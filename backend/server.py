from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime
from decimal import Decimal, ROUND_HALF_UP
import json
from enum import Enum

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

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
    flags: Dict[str, bool] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class ProjectCreate(BaseModel):
    label: str
    address: Dict[str, str] = Field(default_factory=dict)
    regime_tva: RegimeTVA = RegimeTVA.MARGE
    prix_achat_ttc: float = 0
    prix_vente_ttc: float = 0
    travaux_ttc: float = 0
    frais_agence_ttc: float = 0

# Tax calculation service
class TaxCalculationService:
    def __init__(self):
        self.dmto_rates = self._load_dmto_rates()
        self.notaire_baremes = self._load_notaire_baremes()
    
    def _load_dmto_rates(self):
        """Charge les taux DMTO par département"""
        return {
            "defaults": {"dmto_rate": 0.045, "dmto_mdb_rate": 0.00715},
            "departments": {
                "75": {"dmto_rate": 0.045},
                "92": {"dmto_rate": 0.045},
                "93": {"dmto_rate": 0.045},
                "94": {"dmto_rate": 0.045},
                "95": {"dmto_rate": 0.045},
                "69": {"dmto_rate": 0.045},
                "13": {"dmto_rate": 0.045},
                "33": {"dmto_rate": 0.045},
                "59": {"dmto_rate": 0.045},
                "31": {"dmto_rate": 0.045}
            }
        }
    
    def _load_notaire_baremes(self):
        """Charge les barèmes notaire 2025"""
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
        """Arrondi bancaire"""
        if value is None:
            return 0.0
        decimal_value = Decimal(str(value))
        rounded = decimal_value.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        return float(rounded)
    
    def calculate_dmto(self, prix_achat_ttc: float, dept: str, md_b_eligible: bool = False) -> tuple[float, str]:
        """Calcule les droits de mutation"""
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
        """Calcule émoluments + CSI + débours"""
        emoluments = 0.0
        reste = prix_achat_ttc
        explain_parts = []
        
        # Calcul par tranches
        for tranche in self.notaire_baremes["emoluments_tranches"]:
            if reste <= 0:
                break
                
            min_val = tranche["min"]
            max_val = tranche.get("max")
            taux = tranche["taux"]
            
            if max_val is None:
                # Dernière tranche
                montant_tranche = reste * taux
                emoluments += montant_tranche
                explain_parts.append(f"Au-delà de {min_val:,.0f} €: {reste:,.2f} € × {taux:.3%} = {montant_tranche:,.2f} €")
                reste = 0
            else:
                # Tranche intermédiaire
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
        """Calcule TVA selon le régime"""
        tva_collectee = 0.0
        tva_marge = 0.0
        explain = ""
        
        if inputs.regime_tva == RegimeTVA.NORMAL:
            # TVA normale sur le prix de vente
            prix_vente_ht = inputs.prix_vente_ttc / 1.20
            tva_collectee = inputs.prix_vente_ttc - prix_vente_ht
            explain = f"TVA normale: {inputs.prix_vente_ttc:,.2f} € TTC → {prix_vente_ht:,.2f} € HT\nTVA collectée: {tva_collectee:,.2f} €"
            
        elif inputs.regime_tva == RegimeTVA.MARGE:
            # TVA sur marge
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
        """Calcul complet de l'estimation"""
        explains = []
        
        # 1. DMTO
        md_b_eligible = inputs.hypotheses.get("md_b_0715_ok", False)
        dmto, dmto_explain = self.calculate_dmto(inputs.prix_achat_ttc, inputs.dept, md_b_eligible)
        explains.append(f"1. DROITS DE MUTATION:\n{dmto_explain}")
        
        # 2. Frais notaire
        emoluments, csi, debours, notaire_explain = self.calculate_notaire_fees(inputs.prix_achat_ttc)
        explains.append(f"\n2. FRAIS NOTAIRE:\n{notaire_explain}")
        
        # 3. TVA
        tva_collectee, tva_marge, tva_explain = self.calculate_tva(inputs)
        explains.append(f"\n3. TVA:\n{tva_explain}")
        
        # 4. Marges
        total_couts_acquisition = inputs.prix_achat_ttc + dmto + emoluments + csi + debours
        total_couts = total_couts_acquisition + inputs.travaux_ttc + inputs.frais_agence_ttc
        marge_brute = inputs.prix_vente_ttc - total_couts
        marge_nette = marge_brute - tva_collectee - tva_marge
        
        # 5. TRI simplifié (hypothèse 12 mois)
        if total_couts > 0:
            tri = (marge_nette / total_couts) * 1.0  # Annualisé
        else:
            tri = 0.0
        
        marge_explain = f"\n4. CALCUL MARGES:\n"
        marge_explain += f"Coûts acquisition: {total_couts_acquisition:,.2f} €\n"
        marge_explain += f"Coûts totaux: {total_couts:,.2f} €\n"
        marge_explain += f"Marge brute: {inputs.prix_vente_ttc:,.2f} € - {total_couts:,.2f} € = {marge_brute:,.2f} €\n"
        marge_explain += f"Marge nette: {marge_brute:,.2f} € - {tva_collectee + tva_marge:,.2f} € TVA = {marge_nette:,.2f} €\n"
        marge_explain += f"TRI estimé (12 mois): {tri:.1%}"
        explains.append(marge_explain)
        
        # Warnings
        warnings = []
        if inputs.hypotheses.get("travaux_structurants", False):
            warnings.append("⚠️ Travaux structurants → Vérifier garantie décennale")
        if inputs.regime_tva == RegimeTVA.MARGE and not md_b_eligible:
            warnings.append("⚠️ TVA sur marge sans statut MdB → Vérifier conditions art. 268 CGI")
        
        if warnings:
            explains.append(f"\n5. ALERTES:\n" + "\n".join(warnings))
        
        return EstimateOutput(
            dmto=dmto,
            emoluments=emoluments,
            csi=csi,
            debours=debours,
            tva_collectee=tva_collectee,
            tva_marge=tva_marge,
            marge_brute=self._decimal_round(marge_brute),
            marge_nette=self._decimal_round(marge_nette),
            tri=self._decimal_round(tri, 4),
            explain="\n".join(explains)
        )

# Initialize service
tax_service = TaxCalculationService()

# API Routes
@api_router.get("/")
async def root():
    return {"message": "Marchands de Biens API", "version": "1.0.0"}

@api_router.post("/estimate/run", response_model=EstimateOutput)
async def run_estimate(inputs: EstimateInput):
    """Calcule une estimation fiscale complète"""
    try:
        result = tax_service.calculate_estimate(inputs)
        
        # Sauvegarder l'estimation (append-only)
        estimate_record = {
            "id": str(uuid.uuid4()),
            "inputs": inputs.dict(),
            "outputs": result.dict(),
            "created_at": datetime.utcnow().isoformat()
        }
        await db.estimates.insert_one(estimate_record)
        
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erreur de calcul: {str(e)}")

@api_router.get("/projects", response_model=List[Project])
async def get_projects():
    """Liste tous les projets"""
    projects = await db.projects.find().to_list(1000)
    return [Project(**project) for project in projects]

@api_router.post("/projects", response_model=Project)
async def create_project(project_data: ProjectCreate):
    """Crée un nouveau projet"""
    project_dict = project_data.dict()
    project = Project(**project_dict)
    await db.projects.insert_one(project.dict())
    return project

@api_router.get("/projects/{project_id}", response_model=Project)
async def get_project(project_id: str):
    """Récupère un projet par ID"""
    project = await db.projects.find_one({"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Projet non trouvé")
    return Project(**project)

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