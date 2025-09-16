from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorGridFSBucket
from pymongo import ASCENDING, DESCENDING
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
from decimal import Decimal, ROUND_HALF_UP
from enum import Enum
import io
import json
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib import colors
from reportlab.pdfbase import pdfutils
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase import pdfmetrics

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]
fs = AsyncIOMotorGridFSBucket(db)

# Create the main app without a prefix
app = FastAPI(title="Marchands de Biens API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Enums
class RegimeTVA(str, Enum):
    NORMAL = "NORMAL"
    MARGE = "MARGE"
    EXO = "EXO"

class ProjectStatus(str, Enum):
    DETECTE = "DETECTE"
    OFFRE = "OFFRE"
    COMPROMIS = "COMPROMIS"
    ACTE = "ACTE"
    TRAVAUX = "TRAVAUX"
    COMMERCIALISATION = "COMMERCIALISATION"
    REVENTE = "REVENTE"
    CLOS = "CLOS"

class TaskStatus(str, Enum):
    A_FAIRE = "A_FAIRE"
    EN_COURS = "EN_COURS"
    TERMINE = "TERMINE"
    EN_RETARD = "EN_RETARD"

class FileCategory(str, Enum):
    JURIDIQUE = "JURIDIQUE"
    TECHNIQUE = "TECHNIQUE"
    FINANCIER = "FINANCIER"
    ADMINISTRATIF = "ADMINISTRATIF"

# Models
class EstimateInput(BaseModel):
    dept: str = Field(..., description="Code département (ex: 75)")
    regime_tva: RegimeTVA = Field(..., description="Régime TVA applicable")
    prix_achat_ttc: float = Field(..., description="Prix d'achat TTC")
    prix_vente_ttc: float = Field(..., description="Prix de vente cible TTC")
    travaux_ttc: float = Field(0, description="Montant travaux TTC")
    frais_agence_ttc: float = Field(0, description="Frais agence TTC")
    hypotheses: Dict[str, Any] = Field(default_factory=dict, description="Hypothèses spécifiques")

class EstimateOutput(BaseModel):
    dmto: float = Field(..., description="Droits de mutation à titre onéreux")
    emoluments: float = Field(..., description="Émoluments notaire")
    csi: float = Field(..., description="Contribution de sécurité immobilière")
    debours: float = Field(..., description="Débours notaire")
    tva_collectee: float = Field(..., description="TVA collectée")
    tva_marge: float = Field(..., description="TVA sur marge")
    marge_brute: float = Field(..., description="Marge brute")
    marge_nette: float = Field(..., description="Marge nette")
    tri: float = Field(..., description="Taux de rentabilité interne")
    explain: str = Field(..., description="Détail des calculs")

class Task(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    project_id: str
    title: str
    description: Optional[str] = ""
    status: TaskStatus = TaskStatus.A_FAIRE
    assigned_to: Optional[str] = None
    due_date: Optional[datetime] = None
    completed_date: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = ""
    assigned_to: Optional[str] = None
    due_date: Optional[datetime] = None

class BudgetItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    project_id: str
    category: str
    subcategory: Optional[str] = None
    description: str
    montant_prevu_ht: float
    montant_reel_ht: float = 0
    tva_rate: float = 0.20
    status: str = "prevu"  # prevu, engage, facture, paye
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class BudgetItemCreate(BaseModel):
    category: str
    subcategory: Optional[str] = None
    description: str
    montant_prevu_ht: float
    tva_rate: float = 0.20

class ProjectFile(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    filename: str
    original_filename: str
    file_size: int
    content_type: str
    category: FileCategory
    project_id: str
    uploaded_by: Optional[str] = None
    upload_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    gridfs_id: Optional[str] = None

class ProjectEvent(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    project_id: str
    event_type: str
    description: str
    user: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Project(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    label: str
    address: Dict[str, str] = Field(default_factory=dict)
    status: ProjectStatus = ProjectStatus.DETECTE
    regime_tva: RegimeTVA = RegimeTVA.MARGE
    prix_achat_ttc: float = 0
    prix_vente_ttc: float = 0
    travaux_ttc: float = 0
    frais_agence_ttc: float = 0
    marge_estimee: float = 0
    tri_estime: float = 0
    flags: Dict[str, bool] = Field(default_factory=dict)
    milestones: Dict[str, Optional[str]] = Field(default_factory=dict)
    financing: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProjectCreate(BaseModel):
    label: str
    address: Dict[str, str] = Field(default_factory=dict)
    regime_tva: RegimeTVA = RegimeTVA.MARGE
    prix_achat_ttc: float = 0
    prix_vente_ttc: float = 0
    travaux_ttc: float = 0
    frais_agence_ttc: float = 0

class ProjectUpdate(BaseModel):
    label: Optional[str] = None
    address: Optional[Dict[str, str]] = None
    status: Optional[ProjectStatus] = None
    regime_tva: Optional[RegimeTVA] = None
    prix_achat_ttc: Optional[float] = None
    prix_vente_ttc: Optional[float] = None
    travaux_ttc: Optional[float] = None
    frais_agence_ttc: Optional[float] = None
    milestones: Optional[Dict[str, Optional[str]]] = None
    financing: Optional[Dict[str, Any]] = None

# Tax calculation service (unchanged)
class TaxCalculationService:
    def __init__(self):
        self.dmto_rates = self._load_dmto_rates()
        self.notaire_baremes = self._load_notaire_baremes()
    
    def _load_dmto_rates(self):
        return {
            "defaults": {"dmto_rate": 0.045, "dmto_mdb_rate": 0.00715},
            "departments": {
                "75": {"dmto_rate": 0.045}, "92": {"dmto_rate": 0.045}, "93": {"dmto_rate": 0.045},
                "94": {"dmto_rate": 0.045}, "95": {"dmto_rate": 0.045}, "69": {"dmto_rate": 0.045},
                "13": {"dmto_rate": 0.045}, "33": {"dmto_rate": 0.045}, "59": {"dmto_rate": 0.045},
                "31": {"dmto_rate": 0.045}
            }
        }
    
    def _load_notaire_baremes(self):
        return {
            "version": "2025-01-01",
            "emoluments_tranches": [
                {"min": 0, "max": 6500, "taux": 0.0380},
                {"min": 6500, "max": 17000, "taux": 0.0244},
                {"min": 17000, "max": 60000, "taux": 0.0163},
                {"min": 60000, "max": None, "taux": 0.0122}
            ],
            "csi_rate": 0.001,
            "debours_forfait": 800.0
        }
    
    def _decimal_round(self, value: float, places: int = 2) -> float:
        if value is None:
            return 0.0
        decimal_value = Decimal(str(value))
        rounded = decimal_value.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        return float(rounded)
    
    def calculate_dmto(self, prix_achat_ttc: float, dept: str, md_b_eligible: bool = False) -> tuple[float, str]:
        dept_config = self.dmto_rates["departments"].get(dept, self.dmto_rates["defaults"])
        
        if md_b_eligible:
            rate = self.dmto_rates["defaults"]["dmto_mdb_rate"]
            dmto = self._decimal_round(prix_achat_ttc * rate)
            explain = f"DMTO Marchand de Biens: {prix_achat_ttc:,.2f} € × {rate:.3%} = {dmto:,.2f} €"
        else:
            rate = dept_config["dmto_rate"]
            dmto = self._decimal_round(prix_achat_ttc * rate)
            explain = f"DMTO départemental ({dept}): {prix_achat_ttc:,.2f} € × {rate:.3%} = {dmto:,.2f} €"
        
        return dmto, explain
    
    def calculate_notaire_fees(self, prix_achat_ttc: float) -> tuple[float, float, float, str]:
        emoluments = 0.0
        reste = prix_achat_ttc
        explain_parts = []
        
        for tranche in self.notaire_baremes["emoluments_tranches"]:
            if reste <= 0:
                break
                
            min_val = tranche["min"]
            max_val = tranche.get("max")
            taux = tranche["taux"]
            
            if max_val is None:
                montant_tranche = reste * taux
                emoluments += montant_tranche
                explain_parts.append(f"Au-delà de {min_val:,.0f} €: {reste:,.2f} € × {taux:.3%} = {montant_tranche:,.2f} €")
                reste = 0
            else:
                montant_applicable = min(reste, max_val - min_val)
                montant_tranche = montant_applicable * taux
                emoluments += montant_tranche
                explain_parts.append(f"De {min_val:,.0f} € à {max_val:,.0f} €: {montant_applicable:,.2f} € × {taux:.3%} = {montant_tranche:,.2f} €")
                reste -= montant_applicable
        
        emoluments = self._decimal_round(emoluments)
        csi = self._decimal_round(prix_achat_ttc * self.notaire_baremes["csi_rate"])
        debours = self.notaire_baremes["debours_forfait"]
        
        explain = "Émoluments notaire:\n" + "\n".join(explain_parts)
        explain += f"\nCSI (0,1%): {prix_achat_ttc:,.2f} € × 0,1% = {csi:,.2f} €"
        explain += f"\nDébours forfaitaires: {debours:,.2f} €"
        
        return emoluments, csi, debours, explain
    
    def calculate_tva(self, inputs: EstimateInput) -> tuple[float, float, str]:
        tva_collectee = 0.0
        tva_marge = 0.0
        explain = ""
        
        if inputs.regime_tva == RegimeTVA.NORMAL:
            prix_vente_ht = inputs.prix_vente_ttc / 1.20
            tva_collectee = inputs.prix_vente_ttc - prix_vente_ht
            explain = f"TVA normale: {inputs.prix_vente_ttc:,.2f} € TTC → {prix_vente_ht:,.2f} € HT\nTVA collectée: {tva_collectee:,.2f} €"
            
        elif inputs.regime_tva == RegimeTVA.MARGE:
            total_couts = inputs.prix_achat_ttc + inputs.travaux_ttc + inputs.frais_agence_ttc
            if inputs.prix_vente_ttc > total_couts:
                marge_ttc = inputs.prix_vente_ttc - total_couts
                marge_ht = marge_ttc / 1.20
                tva_marge = marge_ttc - marge_ht
                explain = f"TVA sur marge:\nCoûts totaux: {total_couts:,.2f} € TTC\n"
                explain += f"Marge TTC: {inputs.prix_vente_ttc:,.2f} € - {total_couts:,.2f} € = {marge_ttc:,.2f} €\n"
                explain += f"Marge HT: {marge_ht:,.2f} €\nTVA sur marge: {tva_marge:,.2f} €"
            else:
                explain = "Marge négative ou nulle → pas de TVA sur marge"
                
        else:  # EXO
            explain = "Exonération de TVA → pas de TVA collectée"
        
        return self._decimal_round(tva_collectee), self._decimal_round(tva_marge), explain
    
    def calculate_estimate(self, inputs: EstimateInput) -> EstimateOutput:
        explains = []
        
        md_b_eligible = inputs.hypotheses.get("md_b_0715_ok", False)
        dmto, dmto_explain = self.calculate_dmto(inputs.prix_achat_ttc, inputs.dept, md_b_eligible)
        explains.append(f"1. DROITS DE MUTATION:\n{dmto_explain}")
        
        emoluments, csi, debours, notaire_explain = self.calculate_notaire_fees(inputs.prix_achat_ttc)
        explains.append(f"\n2. FRAIS NOTAIRE:\n{notaire_explain}")
        
        tva_collectee, tva_marge, tva_explain = self.calculate_tva(inputs)
        explains.append(f"\n3. TVA:\n{tva_explain}")
        
        total_couts_acquisition = inputs.prix_achat_ttc + dmto + emoluments + csi + debours
        total_couts = total_couts_acquisition + inputs.travaux_ttc + inputs.frais_agence_ttc
        marge_brute = inputs.prix_vente_ttc - total_couts
        marge_nette = marge_brute - tva_collectee - tva_marge
        
        if total_couts > 0:
            tri = (marge_nette / total_couts) * 1.0
        else:
            tri = 0.0
        
        marge_explain = f"\n4. CALCUL MARGES:\n"
        marge_explain += f"Coûts acquisition: {total_couts_acquisition:,.2f} €\n"
        marge_explain += f"Coûts totaux: {total_couts:,.2f} €\n"
        marge_explain += f"Marge brute: {inputs.prix_vente_ttc:,.2f} € - {total_couts:,.2f} € = {marge_brute:,.2f} €\n"
        marge_explain += f"Marge nette: {marge_brute:,.2f} € - {tva_collectee + tva_marge:,.2f} € TVA = {marge_nette:,.2f} €\n"
        marge_explain += f"TRI estimé (12 mois): {tri:.1%}"
        explains.append(marge_explain)
        
        warnings = []
        if inputs.hypotheses.get("travaux_structurants", False):
            warnings.append("⚠️ Travaux structurants → Vérifier garantie décennale")
        if inputs.regime_tva == RegimeTVA.MARGE and not md_b_eligible:
            warnings.append("⚠️ TVA sur marge sans statut MdB → Vérifier conditions art. 268 CGI")
        
        if warnings:
            explains.append(f"\n5. ALERTES:\n" + "\n".join(warnings))
        
        return EstimateOutput(
            dmto=dmto, emoluments=emoluments, csi=csi, debours=debours,
            tva_collectee=tva_collectee, tva_marge=tva_marge,
            marge_brute=self._decimal_round(marge_brute),
            marge_nette=self._decimal_round(marge_nette),
            tri=self._decimal_round(tri, 4),
            explain="\n".join(explains)
        )

# PDF Generation Service
class PDFGenerationService:
    @staticmethod
    def generate_bank_dossier(project: Project, estimate: EstimateOutput) -> io.BytesIO:
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        styles = getSampleStyleSheet()
        story = []
        
        # Title
        title_style = ParagraphStyle('CustomTitle', parent=styles['Heading1'], 
                                   fontSize=24, spaceAfter=30, textColor=colors.HexColor('#d97706'))
        story.append(Paragraph("DOSSIER BANQUE", title_style))
        story.append(Spacer(1, 20))
        
        # Project Summary
        story.append(Paragraph("RÉSUMÉ DU PROJET", styles['Heading2']))
        project_data = [
            ["Nom du projet", project.label],
            ["Adresse", f"{project.address.get('line1', '')}, {project.address.get('city', '')}"],
            ["Statut", project.status.value],
            ["Régime TVA", project.regime_tva.value],
        ]
        project_table = Table(project_data, colWidths=[2*inch, 4*inch])
        project_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
            ('BACKGROUND', (1, 0), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        story.append(project_table)
        story.append(Spacer(1, 30))
        
        # Financial Summary
        story.append(Paragraph("ANALYSE FINANCIÈRE", styles['Heading2']))
        financial_data = [
            ["Prix d'achat TTC", f"{project.prix_achat_ttc:,.2f} €"],
            ["Travaux TTC", f"{project.travaux_ttc:,.2f} €"],
            ["Prix de vente cible TTC", f"{project.prix_vente_ttc:,.2f} €"],
            ["Marge nette estimée", f"{estimate.marge_nette:,.2f} €"],
            ["TRI estimé", f"{estimate.tri:.1%}"],
        ]
        financial_table = Table(financial_data, colWidths=[3*inch, 2*inch])
        financial_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
            ('BACKGROUND', (1, 0), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        story.append(financial_table)
        
        doc.build(story)
        buffer.seek(0)
        return buffer

    @staticmethod
    def generate_notaire_dossier(project: Project, estimate: EstimateOutput) -> io.BytesIO:
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        styles = getSampleStyleSheet()
        story = []
        
        # Title
        title_style = ParagraphStyle('CustomTitle', parent=styles['Heading1'], 
                                   fontSize=24, spaceAfter=30, textColor=colors.HexColor('#059669'))
        story.append(Paragraph("DOSSIER NOTAIRE", title_style))
        story.append(Spacer(1, 20))
        
        # Legal Information
        story.append(Paragraph("INFORMATIONS JURIDIQUES", styles['Heading2']))
        legal_data = [
            ["Nom du projet", project.label],
            ["Adresse complète", f"{project.address.get('line1', '')}, {project.address.get('city', '')}"],
            ["Département", project.address.get('dept', '')],
            ["Régime TVA", project.regime_tva.value],
        ]
        legal_table = Table(legal_data, colWidths=[2*inch, 4*inch])
        legal_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
            ('BACKGROUND', (1, 0), (-1, -1), colors.beige),
            ('GRID', (0, 0, (-1, -1), 1, colors.black)
        ]))
        story.append(legal_table)
        story.append(Spacer(1, 30))
        
        # Tax Calculations
        story.append(Paragraph("CALCULS FISCAUX", styles['Heading2']))
        tax_data = [
            ["DMTO", f"{estimate.dmto:,.2f} €"],
            ["Émoluments", f"{estimate.emoluments:,.2f} €"],
            ["CSI", f"{estimate.csi:,.2f} €"],
            ["Débours", f"{estimate.debours:,.2f} €"],
            ["TVA collectée", f"{estimate.tva_collectee:,.2f} €"],
            ["TVA sur marge", f"{estimate.tva_marge:,.2f} €"],
        ]
        tax_table = Table(tax_data, colWidths=[3*inch, 2*inch])
        tax_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
            ('BACKGROUND', (1, 0), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        story.append(tax_table)
        
        doc.build(story)
        buffer.seek(0)
        return buffer

# Initialize services
tax_service = TaxCalculationService()
pdf_service = PDFGenerationService()

# API Routes
@api_router.get("/")
async def root():
    return {"message": "Marchands de Biens API", "version": "1.0.0"}

# Estimator endpoints
@api_router.post("/estimate/run", response_model=EstimateOutput)
async def run_estimate(inputs: EstimateInput):
    try:
        result = tax_service.calculate_estimate(inputs)
        
        estimate_record = {
            "id": str(uuid.uuid4()),
            "inputs": inputs.dict(),
            "outputs": result.dict(),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.estimates.insert_one(estimate_record)
        
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erreur de calcul: {str(e)}")

# Project endpoints
@api_router.get("/projects", response_model=List[Project])
async def get_projects():
    projects = await db.projects.find().to_list(1000)
    return [Project(**project) for project in projects]

@api_router.post("/projects", response_model=Project)
async def create_project(project_data: ProjectCreate):
    project_dict = project_data.dict()
    project = Project(**project_dict)
    await db.projects.insert_one(project.dict())
    
    # Log project creation event  
    event = ProjectEvent(
        project_id=project.id,
        event_type="project_created",
        description=f"Projet '{project.label}' créé",
        user="system"
    )
    await db.project_events.insert_one(event.dict())
    
    return project

@api_router.get("/projects/{project_id}", response_model=Project)
async def get_project(project_id: str):
    project = await db.projects.find_one({"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Projet non trouvé")
    return Project(**project)

@api_router.put("/projects/{project_id}", response_model=Project)
async def update_project(project_id: str, update_data: ProjectUpdate):
    update_dict = {k: v for k, v in update_data.dict().items() if v is not None}
    update_dict["updated_at"] = datetime.now(timezone.utc)
    
    result = await db.projects.update_one({"id": project_id}, {"$set": update_dict})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Projet non trouvé")
    
    # Log update event
    event = ProjectEvent(
        project_id=project_id,
        event_type="project_updated",
        description="Projet mis à jour",
        metadata=update_dict,
        user="system"
    )
    await db.project_events.insert_one(event.dict())
    
    updated_project = await db.projects.find_one({"id": project_id})
    return Project(**updated_project)

# Task endpoints
@api_router.get("/projects/{project_id}/tasks", response_model=List[Task])
async def get_project_tasks(project_id: str):
    tasks = await db.tasks.find({"project_id": project_id}).to_list(1000)
    return [Task(**task) for task in tasks]

@api_router.post("/projects/{project_id}/tasks", response_model=Task)
async def create_task(project_id: str, task_data: TaskCreate):
    task_dict = task_data.dict()
    task_dict["project_id"] = project_id
    task = Task(**task_dict)
    await db.tasks.insert_one(task.dict())
    
    # Log task creation event
    event = ProjectEvent(
        project_id=project_id,
        event_type="task_created",
        description=f"Tâche '{task.title}' créée", 
        user="system"
    )
    await db.project_events.insert_one(event.dict())
    
    return task

# Budget endpoints
@api_router.get("/projects/{project_id}/budget", response_model=List[BudgetItem])
async def get_project_budget(project_id: str):
    budget_items = await db.budget_items.find({"project_id": project_id}).to_list(1000)
    return [BudgetItem(**item) for item in budget_items]

@api_router.post("/projects/{project_id}/budget", response_model=BudgetItem)
async def create_budget_item(project_id: str, budget_data: BudgetItemCreate):
    budget_dict = budget_data.dict()
    budget_dict["project_id"] = project_id
    budget_item = BudgetItem(**budget_dict)
    await db.budget_items.insert_one(budget_item.dict())
    
    return budget_item

# File upload endpoints
@api_router.post("/projects/{project_id}/files/upload")
async def upload_file(
    project_id: str,
    category: FileCategory = Form(...),
    file: UploadFile = File(...)
):
    try:
        # Store file in GridFS
        file_content = await file.read()
        gridfs_id = await fs.upload_from_stream(
            file.filename,
            io.BytesIO(file_content),
            metadata={
                "project_id": project_id,
                "category": category.value,
                "content_type": file.content_type,
                "original_filename": file.filename
            }
        )
        
        # Store file metadata
        project_file = ProjectFile(
            filename=file.filename,
            original_filename=file.filename,
            file_size=len(file_content),
            content_type=file.content_type,
            category=category,
            project_id=project_id,
            gridfs_id=str(gridfs_id)
        )
        await db.project_files.insert_one(project_file.dict())
        
        # Log file upload event
        event = ProjectEvent(
            project_id=project_id,
            event_type="file_uploaded", 
            description=f"Fichier '{file.filename}' uploadé dans {category.value}",
            user="system"
        )
        await db.project_events.insert_one(event.dict())
        
        return {"message": "Fichier uploadé avec succès", "file_id": project_file.id}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de l'upload: {str(e)}")

@api_router.get("/projects/{project_id}/files", response_model=List[ProjectFile])
async def get_project_files(project_id: str):
    files = await db.project_files.find({"project_id": project_id}).to_list(1000)
    return [ProjectFile(**file) for file in files]

# Events endpoints  
@api_router.get("/projects/{project_id}/events", response_model=List[ProjectEvent])
async def get_project_events(project_id: str):
    events = await db.project_events.find({"project_id": project_id}).sort("timestamp", DESCENDING).to_list(1000)
    return [ProjectEvent(**event) for event in events]

# PDF Export endpoints
@api_router.get("/projects/{project_id}/export/bank")
async def export_bank_dossier(project_id: str):
    project = await db.projects.find_one({"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Projet non trouvé")
    
    project_obj = Project(**project)
    
    # Get latest estimate
    estimate_record = await db.estimates.find_one(
        {"inputs.prix_achat_ttc": project_obj.prix_achat_ttc},
        sort=[("created_at", DESCENDING)]
    )
    
    if estimate_record:
        estimate = EstimateOutput(**estimate_record["outputs"])
    else:
        # Generate estimate on the fly
        estimate_input = EstimateInput(
            dept=project_obj.address.get("dept", "75"),
            regime_tva=project_obj.regime_tva,
            prix_achat_ttc=project_obj.prix_achat_ttc,
            prix_vente_ttc=project_obj.prix_vente_ttc,
            travaux_ttc=project_obj.travaux_ttc,
            frais_agence_ttc=project_obj.frais_agence_ttc,
            hypotheses={"md_b_0715_ok": project_obj.flags.get("md_b_0715_ok", False)}
        )
        estimate = tax_service.calculate_estimate(estimate_input)
    
    pdf_buffer = pdf_service.generate_bank_dossier(project_obj, estimate)
    
    return StreamingResponse(
        io.BytesIO(pdf_buffer.read()),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=dossier_banque_{project_obj.label.replace(' ', '_')}.pdf"}
    )

@api_router.get("/projects/{project_id}/export/notaire")
async def export_notaire_dossier(project_id: str):
    project = await db.projects.find_one({"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Projet non trouvé")
    
    project_obj = Project(**project)
    
    # Get latest estimate
    estimate_record = await db.estimates.find_one(
        {"inputs.prix_achat_ttc": project_obj.prix_achat_ttc},
        sort=[("created_at", DESCENDING)]
    )
    
    if estimate_record:
        estimate = EstimateOutput(**estimate_record["outputs"])
    else:
        # Generate estimate on the fly
        estimate_input = EstimateInput(
            dept=project_obj.address.get("dept", "75"),
            regime_tva=project_obj.regime_tva,
            prix_achat_ttc=project_obj.prix_achat_ttc,
            prix_vente_ttc=project_obj.prix_vente_ttc,
            travaux_ttc=project_obj.travaux_ttc,
            frais_agence_ttc=project_obj.frais_agence_ttc,
            hypotheses={"md_b_0715_ok": project_obj.flags.get("md_b_0715_ok", False)}
        )
        estimate = tax_service.calculate_estimate(estimate_input)
    
    pdf_buffer = pdf_service.generate_notaire_dossier(project_obj, estimate)
    
    return StreamingResponse(
        io.BytesIO(pdf_buffer.read()),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=dossier_notaire_{project_obj.label.replace(' ', '_')}.pdf"}
    )

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()