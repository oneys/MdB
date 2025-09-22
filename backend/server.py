from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Form, Depends, Cookie, Response, Request
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.security import HTTPBearer
from fastapi.exceptions import RequestValidationError
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
import io
import traceback
import json
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorGridFSBucket
from pymongo import DESCENDING
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
from decimal import Decimal, ROUND_HALF_UP
from enum import Enum
import io
import json
import aiohttp
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib import colors

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

# Security
security = HTTPBearer(auto_error=False)

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

class UserRole(str, Enum):
    OWNER = "OWNER"
    PM = "PM" 
    ANALYSTE = "ANALYSTE"
    INVITE = "INVITE"

class KYCDocumentType(str, Enum):
    CNI = "CNI"
    PASSEPORT = "PASSEPORT"
    PERMIS = "PERMIS"
    JUSTIFICATIF_DOMICILE = "JUSTIFICATIF_DOMICILE"
    JUSTIFICATIF_REVENUS = "JUSTIFICATIF_REVENUS"
    KBIS = "KBIS"
    STATUTS = "STATUTS"

class KYCStatus(str, Enum):
    EN_ATTENTE = "EN_ATTENTE"
    EN_COURS = "EN_COURS"
    VALIDE = "VALIDE"
    REJETE = "REJETE"
    INCOMPLET = "INCOMPLET"

class RiskLevel(str, Enum):
    FAIBLE = "FAIBLE"
    MOYEN = "MOYEN"
    ELEVE = "ELEVE"
    TRES_ELEVE = "TRES_ELEVE"

class TracfinEventType(str, Enum):
    TRANSACTION_SUSPECTE = "TRANSACTION_SUSPECTE"
    OPERATION_IMPORTANTE = "OPERATION_IMPORTANTE"
    CHANGEMENT_BENEFICIAIRE = "CHANGEMENT_BENEFICIAIRE"
    DEPOT_ESPECES = "DEPOT_ESPECES"
    VIREMENT_INTERNATIONAL = "VIREMENT_INTERNATIONAL"
    OPERATION_FRACTIONNEE = "OPERATION_FRACTIONNEE"

# Authentication Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    name: str
    picture: Optional[str] = None
    role: UserRole = UserRole.ANALYSTE
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_active: bool = True
    kyc_status: KYCStatus = KYCStatus.EN_ATTENTE
    risk_level: RiskLevel = RiskLevel.FAIBLE

class UserSession(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    session_token: str
    expires_at: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SessionData(BaseModel):
    id: str
    email: str
    name: str
    picture: Optional[str] = None
    session_token: str

# KYC Models
class KYCDocument(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    document_type: KYCDocumentType
    filename: str
    original_filename: str
    file_size: int
    content_type: str
    gridfs_id: str
    status: KYCStatus = KYCStatus.EN_ATTENTE
    validation_notes: Optional[str] = None
    validated_by: Optional[str] = None
    validated_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class KYCDocumentCreate(BaseModel):
    document_type: KYCDocumentType

class UBODeclaration(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    company_name: str
    company_siren: str
    ubos: List[Dict[str, Any]] = Field(default_factory=list)  # Ultimate Beneficial Owners
    declaration_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    status: KYCStatus = KYCStatus.EN_ATTENTE
    validated_by: Optional[str] = None
    validated_at: Optional[datetime] = None

class UBODeclarationCreate(BaseModel):
    company_name: str
    company_siren: str
    ubos: List[Dict[str, Any]]

class TracfinEvent(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    project_id: Optional[str] = None
    event_type: TracfinEventType
    description: str
    amount: Optional[float] = None
    currency: str = "EUR"
    counterpart: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    risk_score: int = 0  # 0-100
    auto_generated: bool = True
    reported: bool = False
    reported_at: Optional[datetime] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TracfinEventCreate(BaseModel):
    user_id: str
    project_id: Optional[str] = None
    event_type: TracfinEventType
    description: str
    amount: Optional[float] = None
    counterpart: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)

class RiskAssessment(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    project_id: Optional[str] = None
    risk_level: RiskLevel
    risk_score: int  # 0-100
    factors: List[Dict[str, Any]] = Field(default_factory=list)
    assessment_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    next_review_date: datetime
    notes: Optional[str] = None

# Existing models (EstimateInput, Project, etc.) - keep unchanged
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
    status: str = "prevu"
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
    owner_id: Optional[str] = None
    team_members: List[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProjectCreate(BaseModel):
    label: str = Field(..., min_length=3, max_length=200, pattern=r'^[a-zA-Z0-9\s\-_\.\,\(\)]+$')
    address: Dict[str, str] = Field(default_factory=dict)
    regime_tva: RegimeTVA = RegimeTVA.MARGE
    prix_achat_ttc: float = Field(..., ge=1000, le=50000000, description="Prix d'achat entre 1K€ et 50M€")
    prix_vente_ttc: float = Field(..., ge=1000, le=50000000, description="Prix de vente entre 1K€ et 50M€")
    travaux_ttc: float = Field(..., ge=0, le=10000000, description="Travaux entre 0€ et 10M€")
    frais_agence_ttc: float = Field(..., ge=0, le=1000000, description="Frais agence entre 0€ et 1M€")
    
    @validator('prix_vente_ttc')
    def validate_margin_positive(cls, v, values):
        if 'prix_achat_ttc' in values and v <= values['prix_achat_ttc']:
            raise ValueError('Le prix de vente doit être supérieur au prix d\'achat')
        return v
    
    @validator('travaux_ttc')
    def validate_reasonable_renovation(cls, v, values):
        if 'prix_achat_ttc' in values and v > values['prix_achat_ttc'] * 2:
            raise ValueError('Travaux ne peuvent pas dépasser 200% du prix d\'achat')
        return v
        
    @validator('frais_agence_ttc')
    def validate_agency_fees(cls, v, values):
        if 'prix_achat_ttc' in values and v > values['prix_achat_ttc'] * 0.15:
            raise ValueError('Frais agence ne peuvent pas dépasser 15% du prix d\'achat')
        return v

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

class ProjectResponse(BaseModel):
    id: str
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
    owner_id: Optional[str] = None
    team_members: List[str] = Field(default_factory=list)
    documents: List[Dict[str, Any]] = Field(default_factory=list)
    tasks: List[Dict[str, Any]] = Field(default_factory=list)
    events: List[Dict[str, Any]] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Risk Assessment Service
class RiskAssessmentService:
    @staticmethod
    def calculate_risk_score(user: User, project: Optional[Project] = None, amount: Optional[float] = None) -> tuple[int, RiskLevel, List[Dict[str, Any]]]:
        """Calculate risk score and level for a user/transaction"""
        score = 0
        factors = []
        
        # Base user factors
        if user.kyc_status != KYCStatus.VALIDE:
            score += 30
            factors.append({
                "factor": "KYC non validé",
                "impact": 30,
                "description": "Dossier KYC incomplet ou non validé"
            })
        
        # Transaction amount factors
        if amount:
            if amount > 500000:
                score += 25
                factors.append({
                    "factor": "Montant élevé",
                    "impact": 25,
                    "description": f"Transaction de {amount:,.0f} € (>500k€)"
                })
            elif amount > 150000:
                score += 15
                factors.append({
                    "factor": "Montant significatif",
                    "impact": 15,
                    "description": f"Transaction de {amount:,.0f} € (>150k€)"
                })
        
        # Project-specific factors
        if project:
            # High-value property
            if project.prix_achat_ttc > 1000000:
                score += 20
                factors.append({
                    "factor": "Bien de luxe",
                    "impact": 20,
                    "description": f"Acquisition > 1M€ ({project.prix_achat_ttc:,.0f} €)"
                })
            
            # Quick turnaround projects (potential speculation)
            if project.status in [ProjectStatus.REVENTE, ProjectStatus.CLOS]:
                # Check if sold quickly (mock check - would need actual dates)
                score += 10
                factors.append({
                    "factor": "Rotation rapide",
                    "impact": 10,
                    "description": "Revente rapide potentiellement spéculative"
                })
        
        # Determine risk level
        if score >= 70:
            risk_level = RiskLevel.TRES_ELEVE
        elif score >= 50:
            risk_level = RiskLevel.ELEVE
        elif score >= 30:
            risk_level = RiskLevel.MOYEN
        else:
            risk_level = RiskLevel.FAIBLE
        
        return min(score, 100), risk_level, factors

    @staticmethod
    async def create_risk_assessment(user: User, project: Optional[Project] = None, amount: Optional[float] = None) -> RiskAssessment:
        """Create a new risk assessment"""
        score, risk_level, factors = RiskAssessmentService.calculate_risk_score(user, project, amount)
        
        assessment = RiskAssessment(
            user_id=user.id,
            project_id=project.id if project else None,
            risk_level=risk_level,
            risk_score=score,
            factors=factors,
            next_review_date=datetime.now(timezone.utc) + timedelta(days=365 if risk_level == RiskLevel.FAIBLE else 180)
        )
        
        await db.risk_assessments.insert_one(assessment.dict())
        
        # Update user risk level if higher
        if risk_level.value > user.risk_level.value:
            await db.users.update_one(
                {"id": user.id},
                {"$set": {"risk_level": risk_level.value}}
            )
        
        return assessment

# TRACFIN Service
class TracfinService:
    @staticmethod
    async def create_event(event_data: TracfinEventCreate, auto_risk_score: bool = True) -> TracfinEvent:
        """Create a TRACFIN event"""
        event_dict = event_data.dict()
        
        # Calculate risk score if not provided
        if auto_risk_score and event_data.amount:
            if event_data.amount > 300000:
                event_dict["risk_score"] = 80
            elif event_data.amount > 150000:
                event_dict["risk_score"] = 60
            elif event_data.amount > 50000:
                event_dict["risk_score"] = 40
            else:
                event_dict["risk_score"] = 20
        
        event = TracfinEvent(**event_dict)
        await db.tracfin_events.insert_one(event.dict())
        
        # Auto-report high-risk events
        if event.risk_score >= 70:
            await TracfinService.flag_for_review(event.id)
        
        return event

    @staticmethod
    async def flag_for_review(event_id: str):
        """Flag event for manual review"""
        await db.tracfin_events.update_one(
            {"id": event_id},
            {"$set": {"requires_review": True}}
        )

    @staticmethod
    async def get_user_events(user_id: str, limit: int = 100) -> List[TracfinEvent]:
        """Get TRACFIN events for a user"""
        events = await db.tracfin_events.find(
            {"user_id": user_id}
        ).sort("timestamp", DESCENDING).limit(limit).to_list(limit)
        
        return [TracfinEvent(**event) for event in events]

# Authentication Service (unchanged)
class AuthenticationService:
    @staticmethod
    async def get_session_data_from_emergent(session_id: str) -> Optional[SessionData]:
        try:
            async with aiohttp.ClientSession() as session:
                headers = {"X-Session-ID": session_id}
                url = "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data"
                
                logging.info(f"Validating session with Emergent: {url}")
                async with session.get(url, headers=headers) as response:
                    response_text = await response.text()
                    logging.info(f"Emergent response status: {response.status}")
                    
                    if response.status == 200:
                        data = await response.json()
                        logging.info(f"Session validated successfully for: {data.get('email', 'unknown')}")
                        return SessionData(**data)
                    else:
                        logging.warning(f"Session validation failed. Status: {response.status}, Response: {response_text[:200]}")
                        return None
        except Exception as e:
            logging.error(f"Error getting session data: {e}")
            return None

    @staticmethod
    async def create_or_get_user(session_data: SessionData) -> User:
        existing_user = await db.users.find_one({"email": session_data.email})
        if existing_user:
            return User(**existing_user)
        
        user = User(
            email=session_data.email,
            name=session_data.name,
            picture=session_data.picture,
            role=UserRole.ANALYSTE
        )
        await db.users.insert_one(user.dict())
        return user

    @staticmethod
    async def create_user_session(user_id: str, session_token: str) -> UserSession:
        expires_at = datetime.now(timezone.utc) + timedelta(days=7)
        session = UserSession(
            user_id=user_id,
            session_token=session_token,
            expires_at=expires_at
        )
        await db.user_sessions.insert_one(session.dict())
        return session

    @staticmethod
    async def get_user_from_session_token(session_token: str) -> Optional[User]:
        if not session_token:
            return None
        
        session = await db.user_sessions.find_one({
            "session_token": session_token,
            "expires_at": {"$gt": datetime.now(timezone.utc)}
        })
        
        if not session:
            return None
        
        user = await db.users.find_one({"id": session["user_id"]})
        if not user:
            return None
        
        return User(**user)

    @staticmethod
    async def logout_user(session_token: str) -> bool:
        result = await db.user_sessions.delete_one({"session_token": session_token})
        return result.deleted_count > 0

# Authentication dependencies (unchanged)
async def get_current_user(
    request: Request,
    session_token: Optional[str] = Cookie(None, alias="session_token")
) -> Optional[User]:
    if not session_token:
        auth_header = request.headers.get("authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.split(" ")[1]
    
    if not session_token:
        return None
    
    return await AuthenticationService.get_user_from_session_token(session_token)

async def require_auth(current_user: User = Depends(get_current_user)) -> User:
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")
    return current_user

async def require_role(required_roles: List[UserRole]):
    async def role_checker(current_user: User = Depends(require_auth)) -> User:
        if current_user.role not in required_roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return current_user
    return role_checker

# Tax calculation service (unchanged - keeping existing implementation)
class TaxCalculationService:
    def __init__(self):
        self.dmto_rates = self._load_dmto_rates()
        self.notaire_baremes = self._load_notaire_baremes()
    
    def _load_dmto_rates(self):
        """Load DMTO rates from JSON file with fallback to hardcoded values"""
        try:
            dmto_file_path = ROOT_DIR / 'data' / 'dmto.json'
            if dmto_file_path.exists():
                with open(dmto_file_path, 'r', encoding='utf-8') as f:
                    dmto_data = json.load(f)
                    logging.info(f"Loaded DMTO rates from JSON - Version: {dmto_data.get('version', 'unknown')}")
                    return dmto_data
            else:
                logging.warning(f"DMTO JSON file not found at {dmto_file_path}, using fallback values")
        except Exception as e:
            logging.error(f"Error loading DMTO JSON file: {e}, using fallback values")
        
        # Fallback to hardcoded values
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
        """Load notary fee scales from JSON file with fallback to hardcoded values"""
        try:
            notary_file_path = ROOT_DIR / 'data' / 'notary_fees.json'
            if notary_file_path.exists():
                with open(notary_file_path, 'r', encoding='utf-8') as f:
                    notary_data = json.load(f)
                    logging.info(f"Loaded notary fees from JSON - Version: {notary_data.get('version', 'unknown')}")
                    
                    # Restructure for compatibility with existing code
                    return {
                        "version": notary_data.get("version", "2025-01-01"),
                        "emoluments_tranches": notary_data.get("emoluments_tranches", []),
                        "csi_rate": notary_data.get("additional_fees", {}).get("csi", {}).get("rate", 0.001),
                        "debours_forfait": notary_data.get("additional_fees", {}).get("debours_forfait", {}).get("amount", 800.0)
                    }
            else:
                logging.warning(f"Notary fees JSON file not found at {notary_file_path}, using fallback values")
        except Exception as e:
            logging.error(f"Error loading notary fees JSON file: {e}, using fallback values")
        
        # Fallback to hardcoded values
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
        
        marge_explain = "\n4. CALCUL MARGES:\n"
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
            explains.append("\n5. ALERTES:\n" + "\n".join(warnings))
        
        return EstimateOutput(
            dmto=dmto, emoluments=emoluments, csi=csi, debours=debours,
            tva_collectee=tva_collectee, tva_marge=tva_marge,
            marge_brute=self._decimal_round(marge_brute),
            marge_nette=self._decimal_round(marge_nette),
            tri=self._decimal_round(tri, 4),
            explain="\n".join(explains)
        )

# PDF Generation Service (unchanged)
class PDFGenerationService:
    @staticmethod
    def generate_bank_dossier(project: Project, estimate: EstimateOutput) -> io.BytesIO:
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        styles = getSampleStyleSheet()
        story = []
        
        title_style = ParagraphStyle('CustomTitle', parent=styles['Heading1'], 
                                   fontSize=24, spaceAfter=30, textColor=colors.HexColor('#d97706'))
        story.append(Paragraph("DOSSIER BANQUE", title_style))
        story.append(Spacer(1, 20))
        
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
        
        title_style = ParagraphStyle('CustomTitle', parent=styles['Heading1'], 
                                   fontSize=24, spaceAfter=30, textColor=colors.HexColor('#059669'))
        story.append(Paragraph("DOSSIER NOTAIRE", title_style))
        story.append(Spacer(1, 20))
        
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
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        story.append(legal_table)
        story.append(Spacer(1, 30))
        
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
auth_service = AuthenticationService()
risk_service = RiskAssessmentService()
tracfin_service = TracfinService()

# API Routes
@api_router.get("/")
async def root():
    return {"message": "Marchands de Biens API", "version": "1.0.0"}

# Authentication endpoints (unchanged)
@api_router.post("/auth/session")
async def create_session(response: Response, session_id: str = Form(...)):
    try:
        logging.info(f"Attempting session creation with session_id: {session_id[:20]}...")
        session_data = await auth_service.get_session_data_from_emergent(session_id)
        
        if not session_data:
            logging.warning(f"No session data returned for session_id: {session_id[:20]}...")
            raise HTTPException(status_code=400, detail="Invalid session ID")
        
        logging.info(f"Session data received for user: {session_data.email}")
        user = await auth_service.create_or_get_user(session_data)
        user_session = await auth_service.create_user_session(user.id, session_data.session_token)
        
        response.set_cookie(
            key="session_token",
            value=session_data.session_token,
            max_age=7*24*60*60,
            httponly=True,
            secure=False,  # Set to False for development
            samesite="lax",  # Changed from "none" to "lax" for better compatibility
            path="/"
        )
        
        logging.info(f"Session created successfully for user: {user.email}")
        return {
            "user": user.dict(),
            "session_expires": user_session.expires_at.isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Session creation error: {e}")
        raise HTTPException(status_code=500, detail="Session creation failed")

@api_router.get("/auth/me")
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return current_user.dict()

@api_router.post("/auth/logout")
async def logout(response: Response, session_token: Optional[str] = Cookie(None, alias="session_token")):
    if session_token:
        await auth_service.logout_user(session_token)
    
    response.delete_cookie(
        key="session_token",
        path="/",
        secure=False,
        samesite="lax"
    )
    return {"message": "Logged out successfully"}

@api_router.post("/auth/dev-session")
async def create_dev_session(response: Response):
    """Temporary endpoint for development authentication bypass"""
    try:
        # Check if test user exists
        test_user_data = await db.users.find_one({"email": "test@marchands-de-biens.dev"})
        if not test_user_data:
            return {"error": "Test user not found. Run temp_bypass.py first"}
        
        # Get existing session
        session_data = await db.user_sessions.find_one({"user_id": test_user_data["id"]})
        if not session_data:
            return {"error": "Test session not found. Run temp_bypass.py first"}
        
        # Set session cookie
        response.set_cookie(
            key="session_token",
            value=session_data["session_token"],
            max_age=7*24*60*60,
            httponly=True,
            secure=False,
            samesite="lax",
            path="/"
        )
        
        logging.info(f"Dev session activated for: {test_user_data['email']}")
        return {
            "message": "Development session activated",
            "user": {
                "email": test_user_data["email"],
                "name": test_user_data["name"],
                "role": test_user_data["role"]
            }
        }
        
    except Exception as e:
        logging.error(f"Dev session error: {e}")
        raise HTTPException(status_code=500, detail="Dev session creation failed")

# KYC Endpoints
@api_router.post("/kyc/documents/upload")
async def upload_kyc_document(
    document_type: KYCDocumentType = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(require_auth)
):
    """Upload KYC document"""
    try:
        # Validate file type
        allowed_types = ["image/jpeg", "image/png", "application/pdf"]
        if file.content_type not in allowed_types:
            raise HTTPException(status_code=400, detail="Type de fichier non autorisé")
        
        # Store file in GridFS
        file_content = await file.read()
        gridfs_id = await fs.upload_from_stream(
            file.filename,
            io.BytesIO(file_content),
            metadata={
                "user_id": current_user.id,
                "document_type": document_type.value,
                "content_type": file.content_type,
                "original_filename": file.filename
            }
        )
        
        # Create KYC document record
        kyc_doc = KYCDocument(
            user_id=current_user.id,
            document_type=document_type,
            filename=file.filename,
            original_filename=file.filename,
            file_size=len(file_content),
            content_type=file.content_type,
            gridfs_id=str(gridfs_id)
        )
        await db.kyc_documents.insert_one(kyc_doc.dict())
        
        # Create TRACFIN event for document upload
        await tracfin_service.create_event(TracfinEventCreate(
            user_id=current_user.id,
            event_type=TracfinEventType.OPERATION_IMPORTANTE,
            description=f"Upload document KYC: {document_type.value}",
            metadata={"document_type": document_type.value, "filename": file.filename}
        ))
        
        return {"message": "Document KYC uploadé avec succès", "document_id": kyc_doc.id}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de l'upload: {str(e)}")

@api_router.get("/kyc/documents", response_model=List[KYCDocument])
async def get_user_kyc_documents(current_user: User = Depends(require_auth)):
    """Get user's KYC documents"""
    documents = await db.kyc_documents.find({"user_id": current_user.id}).to_list(1000)
    return [KYCDocument(**doc) for doc in documents]

@api_router.put("/kyc/documents/{document_id}/validate")
async def validate_kyc_document(
    document_id: str,
    status: KYCStatus,
    notes: Optional[str] = None,
    current_user: User = Depends(require_auth)
):
    """Validate KYC document (Owner/PM only)"""
    if current_user.role not in [UserRole.OWNER, UserRole.PM]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    result = await db.kyc_documents.update_one(
        {"id": document_id},
        {
            "$set": {
                "status": status.value,
                "validation_notes": notes,
                "validated_by": current_user.id,
                "validated_at": datetime.now(timezone.utc)
            }
        }
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Document non trouvé")
    
    # Update user KYC status if all documents are validated
    user_docs = await db.kyc_documents.find({"user_id": current_user.id}).to_list(1000)
    if all(doc["status"] == KYCStatus.VALIDE.value for doc in user_docs):
        await db.users.update_one(
            {"id": current_user.id},
            {"$set": {"kyc_status": KYCStatus.VALIDE.value}}
        )
    
    return {"message": "Document validé avec succès"}

# UBO Endpoints
@api_router.post("/kyc/ubo", response_model=UBODeclaration)
async def create_ubo_declaration(
    ubo_data: UBODeclarationCreate,
    current_user: User = Depends(require_auth)
):
    """Create UBO declaration"""
    ubo_dict = ubo_data.dict()
    ubo_dict["user_id"] = current_user.id
    
    ubo_declaration = UBODeclaration(**ubo_dict)
    await db.ubo_declarations.insert_one(ubo_declaration.dict())
    
    # Create TRACFIN event
    await tracfin_service.create_event(TracfinEventCreate(
        user_id=current_user.id,
        event_type=TracfinEventType.CHANGEMENT_BENEFICIAIRE,
        description=f"Déclaration UBO pour {ubo_data.company_name}",
        metadata={"company_siren": ubo_data.company_siren, "ubo_count": len(ubo_data.ubos)}
    ))
    
    return ubo_declaration

@api_router.get("/kyc/ubo", response_model=List[UBODeclaration])
async def get_user_ubo_declarations(current_user: User = Depends(require_auth)):
    """Get user's UBO declarations"""
    declarations = await db.ubo_declarations.find({"user_id": current_user.id}).to_list(1000)
    return [UBODeclaration(**decl) for decl in declarations]

# TRACFIN Endpoints
@api_router.get("/tracfin/events", response_model=List[TracfinEvent])
async def get_tracfin_events(
    current_user: User = Depends(require_auth),
    limit: int = 100
):
    """Get TRACFIN events for current user"""
    if current_user.role == UserRole.OWNER:
        # Owner can see all events
        events = await db.tracfin_events.find().sort("timestamp", DESCENDING).limit(limit).to_list(limit)
    else:
        # Others see only their events
        events = await db.tracfin_events.find({"user_id": current_user.id}).sort("timestamp", DESCENDING).limit(limit).to_list(limit)
    
    return [TracfinEvent(**event) for event in events]

@api_router.post("/tracfin/events", response_model=TracfinEvent)
async def create_tracfin_event(
    event_data: TracfinEventCreate,
    current_user: User = Depends(require_auth)
):
    """Create TRACFIN event manually (Owner/PM only)"""
    if current_user.role not in [UserRole.OWNER, UserRole.PM]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    return await tracfin_service.create_event(event_data)

# Risk Assessment Endpoints
@api_router.get("/risk/assessment")
async def get_user_risk_assessment(current_user: User = Depends(require_auth)):
    """Get current user's risk assessment"""
    assessment = await db.risk_assessments.find_one(
        {"user_id": current_user.id},
        sort=[("assessment_date", DESCENDING)]
    )
    
    if not assessment:
        # Create initial assessment
        new_assessment = await risk_service.create_risk_assessment(current_user)
        return new_assessment.dict()
    
    return RiskAssessment(**assessment).dict()

@api_router.post("/risk/assessment")
async def create_risk_assessment(
    project_id: Optional[str] = None,
    amount: Optional[float] = None,
    current_user: User = Depends(require_auth)
):
    """Create new risk assessment"""
    project = None
    if project_id:
        project_data = await db.projects.find_one({"id": project_id})
        if project_data:
            project = Project(**project_data)
    
    assessment = await risk_service.create_risk_assessment(current_user, project, amount)
    return assessment.dict()

# Estimator endpoints (unchanged but now with TRACFIN integration)
@api_router.post("/estimate/run", response_model=EstimateOutput)
async def run_estimate(inputs: EstimateInput, current_user: Optional[User] = Depends(get_current_user)):
    try:
        result = tax_service.calculate_estimate(inputs)
        
        estimate_record = {
            "id": str(uuid.uuid4()),
            "inputs": inputs.dict(),
            "outputs": result.dict(),
            "user_id": current_user.id if current_user else None,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.estimates.insert_one(estimate_record)
        
        # Create TRACFIN event for high-value estimates
        if current_user and inputs.prix_achat_ttc > 150000:
            await tracfin_service.create_event(TracfinEventCreate(
                user_id=current_user.id,
                event_type=TracfinEventType.OPERATION_IMPORTANTE,
                description=f"Estimation immobilière - {inputs.prix_achat_ttc:,.0f} €",
                amount=inputs.prix_achat_ttc,
                metadata={"dept": inputs.dept, "regime_tva": inputs.regime_tva.value}
            ))
        
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erreur de calcul: {str(e)}")

# Project endpoints (unchanged structure but with enhanced logging)
async def get_accessible_projects(user: User) -> List[str]:
    if user.role == UserRole.OWNER:
        projects = await db.projects.find({}, {"id": 1}).to_list(1000)
        return [p["id"] for p in projects]
    elif user.role == UserRole.PM:
        projects = await db.projects.find(
            {"$or": [{"owner_id": user.id}, {"team_members": user.id}]},
            {"id": 1}
        ).to_list(1000)
        return [p["id"] for p in projects]
    else:
        projects = await db.projects.find(
            {"team_members": user.id},
            {"id": 1}
        ).to_list(1000)
        return [p["id"] for p in projects]

async def require_auth(session_token: Optional[str] = Cookie(None, alias="session_token")):
    """Require authentication - simplified version"""
    if not session_token:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    # Get user from session
    user_session = await db.user_sessions.find_one({"session_token": session_token})
    if not user_session:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    # Check session expiry
    expires_at = user_session.get("expires_at")
    if expires_at:
        # Handle both datetime objects and ISO strings
        if isinstance(expires_at, str):
            expires_at = datetime.fromisoformat(expires_at)
        # Ensure both datetimes are timezone-aware
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at < datetime.now(timezone.utc):
            raise HTTPException(status_code=401, detail="Session expired")
    
    # Get user
    user_data = await db.users.find_one({"id": user_session["user_id"]})
    if not user_data:
        raise HTTPException(status_code=401, detail="User not found")
    
    return User(**user_data)

async def check_project_access(project_id: str, user: User, access_type: str = "read"):
    """Check if user has access to project"""
    project = await db.projects.find_one({"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Check access based on user role and project ownership
    if user.role == UserRole.OWNER:
        return True  # Owner has access to all projects
    elif project["owner_id"] == user.id:
        return True  # Project owner has full access
    elif user.id in project.get("team_members", []):
        return access_type == "read"  # Team members have read access only
    else:
        raise HTTPException(status_code=403, detail="Access denied")

# Projects API endpoints
@api_router.get("/projects", response_model=List[ProjectResponse])
async def get_projects(current_user: User = Depends(require_auth)):
    """Get projects based on user role"""
    if current_user.role == UserRole.OWNER:
        projects = await db.projects.find().to_list(length=None)
    elif current_user.role in [UserRole.PM, UserRole.ANALYSTE]:
        projects = await db.projects.find({
            "$or": [
                {"owner_id": current_user.id},
                {"team_members": current_user.id}
            ]
        }).to_list(length=None)
    else:  # INVITE
        projects = await db.projects.find({"team_members": current_user.id}).to_list(length=None)
    
    return [ProjectResponse(**project) for project in projects]

# Original create_project endpoint removed - replaced with new implementation below

@api_router.post("/projects", response_model=ProjectResponse)
async def create_project(
    project: ProjectCreate,
    current_user: User = Depends(require_auth)
):
    """Create a new project"""
    if current_user.role not in [UserRole.OWNER, UserRole.PM]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    # Create new project
    new_project = {
        "id": str(uuid.uuid4()),
        "label": project.label,
        "address": project.address,
        "status": "DETECTE",
        "regime_tva": project.regime_tva,
        "prix_achat_ttc": project.prix_achat_ttc,
        "prix_vente_ttc": project.prix_vente_ttc,
        "travaux_ttc": project.travaux_ttc,
        "frais_agence_ttc": project.frais_agence_ttc,
        "marge_estimee": project.prix_vente_ttc - project.prix_achat_ttc - project.travaux_ttc - project.frais_agence_ttc,
        "tri_estime": 0.15,
        "owner_id": current_user.id,
        "team_members": [],
        "documents": [],
        "tasks": [],
        "events": [
            {
                "id": str(uuid.uuid4()),
                "type": "project_created",
                "description": "Projet créé",
                "user": current_user.name,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        ],
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    
    result = await db.projects.insert_one(new_project)
    new_project["_id"] = str(result.inserted_id)
    
    return ProjectResponse(**new_project)

@api_router.get("/projects/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: str,
    current_user: User = Depends(require_auth)
):
    """Get project by ID"""
    await check_project_access(project_id, current_user, "read")
    
    project = await db.projects.find_one({"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    return ProjectResponse(**project)

@api_router.patch("/projects/{project_id}")
async def update_project(
    project_id: str,
    project: ProjectUpdate,
    current_user: User = Depends(require_auth)
):
    """Update project details"""
    # Check if project exists and user has access
    existing_project = await db.projects.find_one({"id": project_id})
    if not existing_project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Check permissions
    if (existing_project["owner_id"] != current_user.id and 
        current_user.id not in existing_project.get("team_members", []) and
        current_user.role not in [UserRole.OWNER]):
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    # Update project
    update_data = project.dict(exclude_unset=True)
    if "prix_achat_ttc" in update_data or "prix_vente_ttc" in update_data or "travaux_ttc" in update_data or "frais_agence_ttc" in update_data:
        # Recalculate margin
        update_data["marge_estimee"] = (
            update_data.get("prix_vente_ttc", existing_project["prix_vente_ttc"]) - 
            update_data.get("prix_achat_ttc", existing_project["prix_achat_ttc"]) -
            update_data.get("travaux_ttc", existing_project["travaux_ttc"]) -
            update_data.get("frais_agence_ttc", existing_project["frais_agence_ttc"])
        )
    
    update_data["updated_at"] = datetime.now(timezone.utc)
    
    # Add event
    event = {
        "id": str(uuid.uuid4()),
        "type": "project_update",
        "description": f"Projet modifié : {update_data.get('label', existing_project['label'])}",
        "user": current_user.name,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    
    await db.projects.update_one(
        {"id": project_id},
        {
            "$set": update_data,
            "$push": {"events": event}
        }
    )
    
    updated_project = await db.projects.find_one({"id": project_id})
    return ProjectResponse(**updated_project)

@api_router.patch("/projects/{project_id}/status")
async def update_project_status(
    project_id: str,
    status_update: dict,
    current_user: User = Depends(require_auth)
):
    """Update project status (for drag & drop)"""
    new_status = status_update.get("status")
    
    # Check if project exists
    existing_project = await db.projects.find_one({"id": project_id})
    if not existing_project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Check permissions
    if (existing_project["owner_id"] != current_user.id and 
        current_user.id not in existing_project.get("team_members", []) and
        current_user.role not in [UserRole.OWNER, UserRole.PM]):
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    # Add event
    event = {
        "id": str(uuid.uuid4()),
        "type": "status_change",
        "description": f"Statut changé de {existing_project['status']} vers {new_status}",
        "user": current_user.name,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    
    await db.projects.update_one(
        {"id": project_id},
        {
            "$set": {
                "status": new_status,
                "updated_at": datetime.now(timezone.utc)
            },
            "$push": {"events": event}
        }
    )
    
    updated_project = await db.projects.find_one({"id": project_id})
    return ProjectResponse(**updated_project)

# Documents API endpoints
@api_router.post("/projects/{project_id}/documents")
async def upload_document(
    project_id: str,
    file: UploadFile = File(...),
    category: str = Form(...),
    current_user: User = Depends(require_auth)
):
    """Upload document to project"""
    await check_project_access(project_id, current_user, "write")
    
    # Validate file size (50MB max)
    if file.size > 50 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File too large (max 50MB)")
    
    # Validate file type
    allowed_types = {
        'application/pdf': '.pdf',
        'image/jpeg': '.jpg',
        'image/png': '.png',
        'application/msword': '.doc',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
        'application/vnd.ms-excel': '.xls',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx'
    }
    
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="File type not allowed")
    
    # Create upload directory
    upload_dir = Path("uploads") / project_id
    upload_dir.mkdir(parents=True, exist_ok=True)
    
    # Generate unique filename
    file_id = str(uuid.uuid4())
    file_extension = allowed_types.get(file.content_type, Path(file.filename).suffix)
    safe_filename = f"{file_id}{file_extension}"
    file_path = upload_dir / safe_filename
    
    # Save file
    content = await file.read()
    with open(file_path, "wb") as buffer:
        buffer.write(content)
    
    # Create document record
    document = {
        "id": file_id,
        "filename": file.filename,
        "safe_filename": safe_filename,
        "category": category,
        "file_path": str(file_path),
        "size": len(content),
        "content_type": file.content_type,
        "uploaded_by": current_user.id,
        "uploaded_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Add to project
    await db.projects.update_one(
        {"id": project_id},
        {"$push": {"documents": document}}
    )
    
    # Add event
    event = {
        "id": str(uuid.uuid4()),
        "type": "document_upload",
        "description": f"Document ajouté: {file.filename}",
        "user": current_user.name,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    
    await db.projects.update_one(
        {"id": project_id},
        {"$push": {"events": event}}
    )
    
    logging.info(f"Document uploaded: {file.filename} by {current_user.name}")
    return {"message": "Document uploaded successfully", "document": document}

@api_router.get("/projects/{project_id}/documents/{document_id}/download")
async def download_document(
    project_id: str,
    document_id: str,
    current_user: User = Depends(require_auth)
):
    """Download document from project"""
    await check_project_access(project_id, current_user, "read")
    
    # Find project and document
    project = await db.projects.find_one({"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    document = next((doc for doc in project.get("documents", []) if doc["id"] == document_id), None)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    file_path = Path(document["file_path"])
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found on disk")
    
    return StreamingResponse(
        open(file_path, "rb"),
        media_type=document["content_type"],
        headers={"Content-Disposition": f"attachment; filename={document['filename']}"}
    )

@api_router.delete("/projects/{project_id}/documents/{document_id}")
async def delete_document(
    project_id: str,
    document_id: str,
    current_user: User = Depends(require_auth)
):
    """Delete document from project"""
    await check_project_access(project_id, current_user, "write")
    
    # Find project and document
    project = await db.projects.find_one({"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    document = next((doc for doc in project.get("documents", []) if doc["id"] == document_id), None)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Delete file from disk
    file_path = Path(document["file_path"])
    if file_path.exists():
        file_path.unlink()
    
    # Remove from project
    await db.projects.update_one(
        {"id": project_id},
        {"$pull": {"documents": {"id": document_id}}}
    )
    
    # Add event
    event = {
        "id": str(uuid.uuid4()),
        "type": "document_delete",
        "description": f"Document supprimé: {document['filename']}",
        "user": current_user.name,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    
    await db.projects.update_one(
        {"id": project_id},
        {"$push": {"events": event}}
    )
    
    return {"message": "Document deleted successfully"}

# Tasks API endpoints
@api_router.post("/projects/{project_id}/tasks")
async def create_task(
    project_id: str,
    task_data: dict,
    current_user: User = Depends(require_auth)
):
    """Create new task for project"""
    await check_project_access(project_id, current_user, "write")
    
    task = {
        "id": str(uuid.uuid4()),
        "title": task_data["title"],
        "status": task_data.get("status", "pending"),
        "due_date": task_data.get("due_date"),
        "created_by": current_user.id,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.projects.update_one(
        {"id": project_id},
        {"$push": {"tasks": task}}
    )
    
    return {"message": "Task created successfully", "task": task}

@api_router.patch("/projects/{project_id}/tasks/{task_id}")
async def update_task(
    project_id: str,
    task_id: str, 
    task_data: dict,
    current_user: User = Depends(require_auth)
):
    """Update task status"""
    await check_project_access(project_id, current_user, "write")
    
    await db.projects.update_one(
        {"id": project_id, "tasks.id": task_id},
        {"$set": {"tasks.$.status": task_data["status"]}}
    )
    
    return {"message": "Task updated successfully"}

# PDF Export endpoints
@api_router.get("/projects/{project_id}/export/bank")
async def export_bank_dossier(
    project_id: str,
    current_user: User = Depends(require_auth)
):
    """Generate bank dossier PDF"""
    await check_project_access(project_id, current_user, "read")
    
    # Get project data
    project = await db.projects.find_one({"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Get estimate for this project
    estimate_data = await get_project_estimate(project)
    
    # Generate PDF
    buffer = io.BytesIO()
    
    # Create PDF document
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=72)
    
    # Get styles
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        spaceAfter=30,
        textColor='#d97706',
        alignment=1  # Center
    )
    
    # Build PDF content
    story = []
    
    # Title
    story.append(Paragraph("DOSSIER BANQUE", title_style))
    story.append(Spacer(1, 20))
    
    # Project info
    story.append(Paragraph(f"<b>Projet:</b> {project.get('label', 'N/A')}", styles['Normal']))
    if project.get('address'):
        story.append(Paragraph(f"<b>Localisation:</b> {project['address'].get('line1', '')}, {project['address'].get('city', '')}", styles['Normal']))
    story.append(Paragraph(f"<b>Statut:</b> {project.get('status', 'N/A')}", styles['Normal']))
    story.append(Spacer(1, 20))
    
    # Financial analysis
    story.append(Paragraph("ANALYSE FINANCIÈRE", styles['Heading2']))
    story.append(Spacer(1, 12))
    
    # Create financial table
    financial_data = [
        ['Poste', 'Montant TTC'],
        ['Prix d\'achat', f"{project.get('prix_achat_ttc', 0):,.2f} €"],
        ['Travaux estimés', f"{project.get('travaux_ttc', 0):,.2f} €"],
        ['Frais agence', f"{project.get('frais_agence_ttc', 0):,.2f} €"],
        ['Prix de vente cible', f"{project.get('prix_vente_ttc', 0):,.2f} €"],
        ['Marge nette estimée', f"{project.get('marge_estimee', 0):,.2f} €"]
    ]
    
    t = Table(financial_data, colWidths=[3*inch, 2*inch])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), '#f59e0b'),
        ('TEXTCOLOR', (0, 0), (-1, 0), '#ffffff'),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), '#fffbeb'),
        ('GRID', (0, 0), (-1, -1), 1, '#d97706')
    ]))
    
    story.append(t)
    story.append(Spacer(1, 20))
    
    # Estimate details if available
    if estimate_data:
        story.append(Paragraph("CALCULS FISCAUX", styles['Heading2']))
        story.append(Spacer(1, 12))
        
        fiscal_data = [
            ['Taxe/Frais', 'Montant'],
            ['DMTO', f"{estimate_data.get('dmto', 0):,.2f} €"],
            ['Émoluments notaire', f"{estimate_data.get('emoluments', 0):,.2f} €"],
            ['CSI', f"{estimate_data.get('csi', 0):,.2f} €"],
            ['Débours', f"{estimate_data.get('debours', 0):,.2f} €"],
            ['TVA collectée', f"{estimate_data.get('tva_collectee', 0):,.2f} €"],
            ['TVA sur marge', f"{estimate_data.get('tva_marge', 0):,.2f} €"]
        ]
        
        t2 = Table(fiscal_data, colWidths=[3*inch, 2*inch])
        t2.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), '#10b981'),
            ('TEXTCOLOR', (0, 0), (-1, 0), '#ffffff'),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), '#f0fdf4'),
            ('GRID', (0, 0), (-1, -1), 1, '#10b981')
        ]))
        
        story.append(t2)
    
    # Documents list
    story.append(Spacer(1, 20))
    story.append(Paragraph("DOCUMENTS FOURNIS", styles['Heading2']))
    story.append(Spacer(1, 12))
    
    documents = project.get('documents', [])
    if documents:
        for document in documents:
            story.append(Paragraph(f"• {document.get('filename', 'N/A')} ({document.get('category', 'N/A')})", styles['Normal']))
    else:
        story.append(Paragraph("Aucun document fourni", styles['Normal']))
    
    # Footer
    story.append(Spacer(1, 40))
    story.append(Paragraph("Document généré automatiquement par MarchndsBiens", styles['Normal']))
    story.append(Paragraph(f"Date: {datetime.now().strftime('%d/%m/%Y %H:%M')}", styles['Normal']))
    
    # Build PDF
    doc.build(story)
    buffer.seek(0)
    
    return StreamingResponse(
        io.BytesIO(buffer.read()),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=dossier_banque_{project.get('label', 'projet').replace(' ', '_')}.pdf"}
    )

@api_router.get("/projects/{project_id}/export/notary")
async def export_notary_dossier(
    project_id: str,
    current_user: User = Depends(require_auth)
):
    """Generate notary dossier PDF"""
    await check_project_access(project_id, current_user, "read")
    
    # Similar to bank dossier but with notary-specific content
    project = await db.projects.find_one({"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=72)
    
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        spaceAfter=30,
        textColor='#059669',
        alignment=1
    )
    
    story = []
    
    # Title
    story.append(Paragraph("DOSSIER NOTAIRE", title_style))
    story.append(Spacer(1, 20))
    
    # Project details
    story.append(Paragraph(f"<b>Projet:</b> {project.get('label', 'N/A')}", styles['Normal']))
    if project.get('address'):
        story.append(Paragraph(f"<b>Adresse:</b> {project['address'].get('line1', '')}", styles['Normal']))
        story.append(Paragraph(f"<b>Ville:</b> {project['address'].get('city', '')}", styles['Normal']))
        story.append(Paragraph(f"<b>Département:</b> {project['address'].get('dept', '')}", styles['Normal']))
    
    story.append(Paragraph(f"<b>Régime TVA:</b> {project.get('regime_tva', 'N/A')}", styles['Normal']))
    story.append(Spacer(1, 20))
    
    # Legal information
    story.append(Paragraph("INFORMATIONS JURIDIQUES", styles['Heading2']))
    story.append(Spacer(1, 12))
    
    legal_data = [
        ['Élément', 'Valeur'],
        ['Prix d\'acquisition TTC', f"{project.get('prix_achat_ttc', 0):,.2f} €"],
        ['Régime fiscal', project.get('regime_tva', 'Non spécifié')],
        ['Marchand de biens', 'Oui' if project.get('flags', {}).get('md_b_0715_ok') else 'Non'],
        ['Date création', project.get('created_at').strftime('%Y-%m-%d') if project.get('created_at') else 'N/A']
    ]
    
    t = Table(legal_data, colWidths=[3*inch, 2*inch])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), '#059669'),
        ('TEXTCOLOR', (0, 0), (-1, 0), '#ffffff'),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), '#f0fdfa'),
        ('GRID', (0, 0), (-1, -1), 1, '#059669')
    ]))
    
    story.append(t)
    story.append(Spacer(1, 20))
    
    # Documents checklist
    story.append(Paragraph("DOCUMENTS REQUIS", styles['Heading2']))
    story.append(Spacer(1, 12))
    
    required_docs = [
        "Compromis de vente signé",
        "Diagnostics techniques",
        "Plan de financement",
        "Justificatifs d'identité",
        "Justificatifs de domicile",
        "Attestation d'assurance"
    ]
    
    for required_doc in required_docs:
        story.append(Paragraph(f"☐ {required_doc}", styles['Normal']))
    
    story.append(Spacer(1, 40))
    story.append(Paragraph("Document généré par MarchndsBiens", styles['Normal']))
    story.append(Paragraph(f"Date: {datetime.now().strftime('%d/%m/%Y %H:%M')}", styles['Normal']))
    
    doc.build(story)
    buffer.seek(0)
    
    return StreamingResponse(
        io.BytesIO(buffer.read()),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=dossier_notaire_{project.get('label', 'projet').replace(' ', '_')}.pdf"}
    )

async def get_project_estimate(project):
    """Get estimate data for a project"""
    try:
        # Create estimate input from project data
        estimate_input = EstimateInput(
            dept=project['address'].get('dept', '75'),
            regime_tva=RegimeTVA(project.get('regime_tva', 'MARGE')),
            prix_achat_ttc=project.get('prix_achat_ttc', 0),
            prix_vente_ttc=project.get('prix_vente_ttc', 0),
            travaux_ttc=project.get('travaux_ttc', 0),
            frais_agence_ttc=project.get('frais_agence_ttc', 0),
            hypotheses={
                'md_b_0715_ok': project.get('flags', {}).get('md_b_0715_ok', False),
                'travaux_structurants': project.get('flags', {}).get('travaux_structurants', False)
            }
        )
        
        # Calculate estimate
        tax_service = TaxCalculationService()
        estimate = tax_service.calculate_estimate(estimate_input)
        return estimate.dict()
    except Exception as e:
        logging.error(f"Error calculating estimate for project {project.get('id')}: {e}")
        return None

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