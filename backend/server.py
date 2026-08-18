from fastapi import FastAPI, APIRouter, HTTPException, Depends, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import httpx
import html
import secrets
import bcrypt
import jwt
from enum import Enum
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
import json
import re
import asyncio
from datetime import datetime, timezone, timedelta
try:
    from emergentintegrations.llm.chat import LlmChat, UserMessage, TextDelta, StreamDone
    _LLM_SDK_AVAILABLE = True
except ImportError:
    _LLM_SDK_AVAILABLE = False


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'route_tower_db')]

# Email (Emergent managed Resend) — optional; lead emails are skipped if not configured
EMAIL_BASE_URL = "https://integrations.emergentagent.com"
EMAIL_KEY = os.environ.get("EMERGENT_EMAIL_KEY")
EMAIL_FROM_NAME = os.environ.get("EMAIL_FROM_NAME", "Route Tower")
DEMO_LEAD_RECIPIENT = os.environ.get("DEMO_LEAD_RECIPIENT")

# LLM (Emergent universal key) — optional; AI endpoints return 503 if not configured
EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY")
GEMINI_MODEL = "gemini-3-flash-preview"

# Auth (JWT)
JWT_SECRET = os.environ.get("JWT_SECRET")
JWT_ALGORITHM = "HS256"
JWT_EXPIRES_MINUTES = int(os.environ.get("JWT_EXPIRES_MINUTES", "1440"))
SUPERADMIN_EMAIL = "admin@admin.com"
SUPERADMIN_PASSWORD = "admin@1234"

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

if not JWT_SECRET:
    JWT_SECRET = secrets.token_urlsafe(32)
    logger.warning("JWT_SECRET not set — using an ephemeral secret; existing tokens will be invalidated on every restart. Set JWT_SECRET in backend/.env for stable sessions.")

app = FastAPI()
api_router = APIRouter(prefix="/api")


class Role(str, Enum):
    SUPERADMIN = "superadmin"
    ADMIN = "admin"
    EDITOR = "editor"
    VIEWER = "viewer"


# Permissions per role: view / edit / delete shipments, plus tenant/user management for superadmin
ROLE_PERMISSIONS = {
    Role.SUPERADMIN: {"view", "edit", "delete", "manage_tenants", "manage_users"},
    Role.ADMIN: {"view", "edit", "delete"},
    Role.EDITOR: {"view", "edit"},
    Role.VIEWER: {"view"},
}


# ---------------- Auth helpers ----------------
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode(), password_hash.encode())
    except ValueError:
        return False


def create_access_token(user_doc: dict) -> str:
    return _encode_token(user_doc["id"], user_doc["email"], user_doc["role"], user_doc.get("tenant_id"))


bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(creds: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme)) -> dict:
    if creds is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(creds.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return payload


def require_roles(*roles: Role):
    async def dep(user: dict = Depends(get_current_user)) -> dict:
        if user["role"] not in [r.value for r in roles]:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return user
    return dep


def require_permission(perm: str):
    async def dep(user: dict = Depends(get_current_user)) -> dict:
        if perm not in ROLE_PERMISSIONS.get(Role(user["role"]), set()):
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return user
    return dep


async def _tenant_name(tenant_id: Optional[str]) -> Optional[str]:
    if not tenant_id:
        return None
    t = await db.tenants.find_one({"id": tenant_id}, {"_id": 0})
    return t["name"] if t else None


def _effective_grants(user_doc: dict) -> List[dict]:
    """All (tenant_id, role) grants for a user. Falls back to the legacy single tenant_id/role
    fields for users created before multi-tenant access grants existed."""
    grants = user_doc.get("tenant_access")
    if grants:
        return grants
    if user_doc.get("tenant_id"):
        return [{"tenant_id": user_doc["tenant_id"], "role": user_doc.get("role")}]
    return []


def _resolve_tenant_role(user_doc: dict, tenant_id: Optional[str]) -> str:
    """Role this user holds for the given tenant, or raise 403 if they have no grant for it."""
    if user_doc["role"] == Role.SUPERADMIN.value:
        return Role.SUPERADMIN.value
    for g in _effective_grants(user_doc):
        if g["tenant_id"] == tenant_id:
            return g["role"]
    raise HTTPException(status_code=403, detail="No access to this tenant")


async def _tenant_access_out(user_doc: dict) -> List["TenantAccessOut"]:
    grants = _effective_grants(user_doc)
    if not grants:
        return []
    tenant_ids = [g["tenant_id"] for g in grants]
    tenants = await db.tenants.find({"id": {"$in": tenant_ids}}, {"_id": 0}).to_list(1000)
    name_by_id = {t["id"]: t["name"] for t in tenants}
    return [TenantAccessOut(tenant_id=g["tenant_id"], tenant_name=name_by_id.get(g["tenant_id"]), role=g["role"]) for g in grants]


def _encode_token(user_id: str, email: str, role: str, tenant_id: Optional[str]) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "tenant_id": tenant_id,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=JWT_EXPIRES_MINUTES),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


# ---------------- Tenants & Users ----------------
class TenantCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)


class TenantProfileUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=200)
    owner_name: Optional[str] = None
    owner_email: Optional[EmailStr] = None
    address_street: Optional[str] = None
    address_city: Optional[str] = None
    address_country: Optional[str] = None


class Tenant(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    owner_name: Optional[str] = None
    owner_email: Optional[str] = None
    address_street: Optional[str] = None
    address_city: Optional[str] = None
    address_country: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class TenantAccessEntry(BaseModel):
    tenant_id: str
    role: Role


class TenantAccessOut(BaseModel):
    tenant_id: str
    tenant_name: Optional[str] = None
    role: Role


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    tenant_access: List[TenantAccessEntry] = Field(min_length=1)


class UserTenantAccessUpdate(BaseModel):
    tenant_access: List[TenantAccessEntry] = Field(min_length=1)


class UserOut(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    email: EmailStr
    role: Role
    tenant_id: Optional[str] = None
    tenant_name: Optional[str] = None
    tenant_access: List[TenantAccessOut] = Field(default_factory=list)
    created_at: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class StatusCheckCreate(BaseModel):
    client_name: str


class DemoLeadCreate(BaseModel):
    name: str
    email: EmailStr
    company: str
    role: Optional[str] = None
    shipment_volume: Optional[str] = None
    message: Optional[str] = None


class DemoLead(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: EmailStr
    company: str
    role: Optional[str] = None
    shipment_volume: Optional[str] = None
    message: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


def _lead_email_html(lead: DemoLead) -> str:
    rows = [
        ("Name", lead.name),
        ("Email", lead.email),
        ("Company", lead.company),
        ("Role", lead.role or "—"),
        ("Shipment volume", lead.shipment_volume or "—"),
        ("Message", lead.message or "—"),
        ("Submitted", lead.created_at),
    ]
    tr = "".join(
        f'<tr><td style="padding:10px 16px;border-bottom:1px solid #E5E5EA;'
        f'font-family:Arial,sans-serif;font-size:13px;color:#8E8E93;width:150px;">{html.escape(str(k))}</td>'
        f'<td style="padding:10px 16px;border-bottom:1px solid #E5E5EA;'
        f'font-family:Arial,sans-serif;font-size:14px;color:#111111;font-weight:600;">{html.escape(str(v))}</td></tr>'
        for k, v in rows
    )
    return f"""
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#F7F7F8;padding:32px 0;">
      <tr><td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border:1px solid #E5E5EA;">
          <tr><td style="background:#111111;padding:24px 24px;">
            <div style="font-family:Arial,sans-serif;font-size:11px;letter-spacing:3px;color:#FF4500;text-transform:uppercase;">Route Tower</div>
            <div style="font-family:Arial,sans-serif;font-size:20px;color:#FFFFFF;font-weight:700;margin-top:6px;">New Demo Request</div>
          </td></tr>
          <tr><td style="padding:8px 8px;">
            <table width="100%" cellpadding="0" cellspacing="0">{tr}</table>
          </td></tr>
        </table>
      </td></tr>
    </table>
    """


async def _send_lead_email(lead: DemoLead):
    if not EMAIL_KEY or not DEMO_LEAD_RECIPIENT:
        logger.warning("Lead email skipped — EMERGENT_EMAIL_KEY/DEMO_LEAD_RECIPIENT not configured")
        return False
    payload = {
        "to": [DEMO_LEAD_RECIPIENT],
        "subject": f"New demo request — {lead.company}",
        "html": _lead_email_html(lead),
        "from_name": EMAIL_FROM_NAME,
        "contact_email": lead.email,
    }
    try:
        async with httpx.AsyncClient(timeout=30) as c:
            resp = await c.post(
                f"{EMAIL_BASE_URL}/api/v1/email/send",
                headers={"X-Email-Key": EMAIL_KEY},
                json=payload,
            )
        resp.raise_for_status()
        return True
    except Exception as e:
        logger.error(f"Lead email failed: {e}")
        return False


@api_router.get("/")
async def root():
    return {"message": "Hello World"}


@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_obj = StatusCheck(**input.model_dump())
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    _ = await db.status_checks.insert_one(doc)
    return status_obj


@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    return status_checks


@api_router.post("/leads")
async def create_lead(input: DemoLeadCreate):
    lead = DemoLead(**input.model_dump())
    await db.demo_leads.insert_one(lead.model_dump())
    emailed = await _send_lead_email(lead)
    return {"status": "success", "id": lead.id, "emailed": emailed}


# ---------------- Auth ----------------
@api_router.post("/auth/login", response_model=LoginResponse)
async def login(req: LoginRequest):
    user_doc = await db.users.find_one({"email": req.email.lower()}, {"_id": 0})
    if not user_doc or not verify_password(req.password, user_doc["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token(user_doc)
    tenant_name = await _tenant_name(user_doc.get("tenant_id"))
    return LoginResponse(
        access_token=token,
        user=UserOut(
            id=user_doc["id"], email=user_doc["email"], role=user_doc["role"],
            tenant_id=user_doc.get("tenant_id"), tenant_name=tenant_name,
            tenant_access=await _tenant_access_out(user_doc),
            created_at=user_doc["created_at"],
        ),
    )


@api_router.get("/auth/me", response_model=UserOut)
async def read_current_user(current: dict = Depends(get_current_user)):
    user_doc = await db.users.find_one({"id": current["sub"]}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    # Reflect the *active* tenant/role from the token (may differ from the user's home
    # tenant after a tenant switch), not the DB doc's home fields.
    tenant_id = current.get("tenant_id")
    tenant_name = await _tenant_name(tenant_id)
    return UserOut(
        id=user_doc["id"], email=user_doc["email"], role=current["role"],
        tenant_id=tenant_id, tenant_name=tenant_name,
        tenant_access=await _tenant_access_out(user_doc),
        created_at=user_doc["created_at"],
    )


class SwitchTenantRequest(BaseModel):
    tenant_id: Optional[str] = None  # None = "All tenants" view, superadmin only


@api_router.post("/auth/switch-tenant", response_model=LoginResponse)
async def switch_tenant(body: SwitchTenantRequest, current: dict = Depends(get_current_user)):
    user_doc = await db.users.find_one({"id": current["sub"]}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    is_superadmin = user_doc["role"] == Role.SUPERADMIN.value
    if body.tenant_id is None:
        if not is_superadmin:
            raise HTTPException(status_code=403, detail="Select a tenant")
        tenant_id, effective_role = None, Role.SUPERADMIN.value
    else:
        if not await db.tenants.find_one({"id": body.tenant_id}, {"_id": 0}):
            raise HTTPException(status_code=404, detail="Tenant not found")
        effective_role = _resolve_tenant_role(user_doc, body.tenant_id)
        tenant_id = body.tenant_id
    token = _encode_token(user_doc["id"], user_doc["email"], effective_role, tenant_id)
    tenant_name = await _tenant_name(tenant_id)
    return LoginResponse(
        access_token=token,
        user=UserOut(
            id=user_doc["id"], email=user_doc["email"], role=effective_role,
            tenant_id=tenant_id, tenant_name=tenant_name,
            tenant_access=await _tenant_access_out(user_doc),
            created_at=user_doc["created_at"],
        ),
    )


@api_router.get("/tenants/accessible", response_model=List[TenantAccessOut])
async def list_accessible_tenants(current: dict = Depends(get_current_user)):
    user_doc = await db.users.find_one({"id": current["sub"]}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    if user_doc["role"] == Role.SUPERADMIN.value:
        tenants = await db.tenants.find({}, {"_id": 0}).sort("name", 1).to_list(1000)
        return [TenantAccessOut(tenant_id=t["id"], tenant_name=t["name"], role=Role.SUPERADMIN) for t in tenants]
    return await _tenant_access_out(user_doc)


# ---------------- Tenants (super admin only) ----------------
@api_router.post("/tenants", response_model=Tenant)
async def create_tenant(body: TenantCreate, user: dict = Depends(require_roles(Role.SUPERADMIN))):
    tenant = Tenant(name=body.name.strip())
    await db.tenants.insert_one(tenant.model_dump())
    return tenant


@api_router.get("/tenants", response_model=List[Tenant])
async def list_tenants(user: dict = Depends(require_roles(Role.SUPERADMIN))):
    return await db.tenants.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)


@api_router.get("/tenants/me", response_model=Tenant)
async def get_my_tenant(user: dict = Depends(get_current_user)):
    tenant_id = user.get("tenant_id")
    if not tenant_id:
        raise HTTPException(status_code=404, detail="No tenant associated with this account")
    doc = await db.tenants.find_one({"id": tenant_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Tenant not found")
    return doc


@api_router.put("/tenants/{tenant_id}", response_model=Tenant)
async def update_tenant(tenant_id: str, body: TenantProfileUpdate, user: dict = Depends(get_current_user)):
    is_superadmin = user["role"] == Role.SUPERADMIN.value
    is_own_admin = user["role"] == Role.ADMIN.value and user.get("tenant_id") == tenant_id
    if not (is_superadmin or is_own_admin):
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    existing = await db.tenants.find_one({"id": tenant_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Tenant not found")
    patch = {k: v for k, v in body.model_dump(exclude_none=True).items()}
    if patch:
        await db.tenants.update_one({"id": tenant_id}, {"$set": patch})
        existing.update(patch)
    return existing


# ---------------- Users (super admin only) ----------------
def _validate_tenant_access_list(grants: List[TenantAccessEntry]) -> List[str]:
    if any(g.role == Role.SUPERADMIN for g in grants):
        raise HTTPException(status_code=400, detail="Cannot grant super admin role via tenant access")
    tenant_ids = [g.tenant_id for g in grants]
    if len(set(tenant_ids)) != len(tenant_ids):
        raise HTTPException(status_code=400, detail="Duplicate tenant in access list")
    return tenant_ids


@api_router.post("/users", response_model=UserOut)
async def create_user(body: UserCreate, user: dict = Depends(require_roles(Role.SUPERADMIN))):
    tenant_ids = _validate_tenant_access_list(body.tenant_access)
    tenants = await db.tenants.find({"id": {"$in": tenant_ids}}, {"_id": 0}).to_list(1000)
    if len(tenants) != len(tenant_ids):
        raise HTTPException(status_code=404, detail="One or more tenants not found")
    email = body.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=409, detail="A user with this email already exists")
    home = body.tenant_access[0]
    doc = {
        "id": str(uuid.uuid4()),
        "email": email,
        "password_hash": hash_password(body.password),
        "role": home.role.value,
        "tenant_id": home.tenant_id,
        "tenant_access": [{"tenant_id": g.tenant_id, "role": g.role.value} for g in body.tenant_access],
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.users.insert_one(doc)
    name_by_id = {t["id"]: t["name"] for t in tenants}
    return UserOut(
        id=doc["id"], email=doc["email"], role=doc["role"], tenant_id=doc["tenant_id"],
        tenant_name=name_by_id.get(doc["tenant_id"]),
        tenant_access=await _tenant_access_out(doc),
        created_at=doc["created_at"],
    )


@api_router.put("/users/{user_id}/tenant-access", response_model=UserOut)
async def update_user_tenant_access(user_id: str, body: UserTenantAccessUpdate, user: dict = Depends(require_roles(Role.SUPERADMIN))):
    existing = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="User not found")
    if existing["role"] == Role.SUPERADMIN.value:
        raise HTTPException(status_code=400, detail="Cannot modify super admin access")
    tenant_ids = _validate_tenant_access_list(body.tenant_access)
    tenants = await db.tenants.find({"id": {"$in": tenant_ids}}, {"_id": 0}).to_list(1000)
    if len(tenants) != len(tenant_ids):
        raise HTTPException(status_code=404, detail="One or more tenants not found")
    home = body.tenant_access[0]
    patch = {
        "tenant_access": [{"tenant_id": g.tenant_id, "role": g.role.value} for g in body.tenant_access],
        "role": home.role.value,
        "tenant_id": home.tenant_id,
    }
    await db.users.update_one({"id": user_id}, {"$set": patch})
    existing.update(patch)
    name_by_id = {t["id"]: t["name"] for t in tenants}
    return UserOut(
        id=existing["id"], email=existing["email"], role=existing["role"], tenant_id=existing["tenant_id"],
        tenant_name=name_by_id.get(existing["tenant_id"]),
        tenant_access=await _tenant_access_out(existing),
        created_at=existing["created_at"],
    )


@api_router.get("/users", response_model=List[UserOut])
async def list_users(user: dict = Depends(require_roles(Role.SUPERADMIN))):
    docs = await db.users.find({"role": {"$ne": Role.SUPERADMIN.value}}, {"_id": 0, "password_hash": 0}).sort("created_at", -1).to_list(1000)
    tenants = {t["id"]: t["name"] for t in await db.tenants.find({}, {"_id": 0}).to_list(1000)}
    out = []
    for doc in docs:
        grants = _effective_grants(doc)
        out.append(UserOut(
            **doc, tenant_name=tenants.get(doc.get("tenant_id")),
            tenant_access=[TenantAccessOut(tenant_id=g["tenant_id"], tenant_name=tenants.get(g["tenant_id"]), role=g["role"]) for g in grants],
        ))
    return out


# ---------------- Shipments (tenant-scoped, role-based permissions) ----------------
SHIPMENT_FIELDS = {"mode", "origin", "destination", "carrier", "tracking", "eta", "status", "current", "stops"}


class ShipmentIn(BaseModel):
    mode: str
    origin: str
    destination: str
    carrier: str
    tracking: str
    eta: str
    status: str
    current: str
    stops: List[Dict[str, Any]] = Field(default_factory=list)


class ShipmentOut(ShipmentIn):
    model_config = ConfigDict(extra="ignore")
    id: str
    tenant_id: Optional[str] = None
    created_at: str


def _shipment_query(shipment_id: Optional[str], user: dict, tenant_id: Optional[str] = None) -> dict:
    query: Dict[str, Any] = {"id": shipment_id} if shipment_id else {}
    if user["role"] == Role.SUPERADMIN.value:
        if tenant_id:
            query["tenant_id"] = tenant_id
    else:
        query["tenant_id"] = user.get("tenant_id")
    return query


@api_router.get("/shipments", response_model=List[ShipmentOut])
async def list_shipments(tenant_id: Optional[str] = Query(default=None), user: dict = Depends(require_permission("view"))):
    query = _shipment_query(None, user, tenant_id)
    return await db.shipments.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)


@api_router.post("/shipments", response_model=ShipmentOut)
async def create_shipment(body: ShipmentIn, user: dict = Depends(require_permission("edit"))):
    tenant_id = user.get("tenant_id")
    if user["role"] == Role.SUPERADMIN.value and not tenant_id:
        raise HTTPException(status_code=400, detail="Super admin has no tenant context — create shipments from a tenant user account")
    doc = {
        **body.model_dump(),
        "id": "CT-" + str(uuid.uuid4().int % 90000 + 10000),
        "tenant_id": tenant_id,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.shipments.insert_one(doc)
    await _fire_webhooks(tenant_id, "shipment.created", doc)
    return doc


@api_router.put("/shipments/{shipment_id}", response_model=ShipmentOut)
async def update_shipment(shipment_id: str, body: Dict[str, Any], user: dict = Depends(require_permission("edit"))):
    query = _shipment_query(shipment_id, user)
    existing = await db.shipments.find_one(query, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Shipment not found")
    patch = {k: v for k, v in body.items() if k in SHIPMENT_FIELDS}
    if patch:
        await db.shipments.update_one(query, {"$set": patch})
        existing.update(patch)
        if "status" in patch:
            await _fire_webhooks(existing.get("tenant_id"), "shipment.status_changed", existing)
            if patch["status"] == "delivered":
                await _fire_webhooks(existing.get("tenant_id"), "shipment.delivered", existing)
            elif patch["status"] in ("delayed", "held", "exception"):
                await _fire_webhooks(existing.get("tenant_id"), "shipment.exception", existing)
    return existing


@api_router.delete("/shipments/{shipment_id}")
async def delete_shipment(shipment_id: str, user: dict = Depends(require_permission("delete"))):
    query = _shipment_query(shipment_id, user)
    res = await db.shipments.delete_one(query)
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Shipment not found")
    return {"status": "success"}


def _tenant_scoped_query(item_id: Optional[str], user: dict, tenant_id: Optional[str] = None) -> dict:
    query: Dict[str, Any] = {"id": item_id} if item_id else {}
    if user["role"] == Role.SUPERADMIN.value:
        if tenant_id:
            query["tenant_id"] = tenant_id
    else:
        query["tenant_id"] = user.get("tenant_id")
    return query


# ---------------- Providers (tenant-scoped) ----------------
class ProviderIn(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    type: str = Field(min_length=1, max_length=60)
    enabled: bool = True
    config: Dict[str, Any] = Field(default_factory=dict)


class ProviderOut(ProviderIn):
    model_config = ConfigDict(extra="ignore")
    id: str
    tenant_id: Optional[str] = None
    created_at: str
    shipments_count: int = 0
    exceptions_count: int = 0
    on_time_pct: Optional[float] = None


PROVIDER_FIELDS = {"name", "type", "enabled", "config"}


async def _provider_stats(tenant_id: Optional[str], name: str) -> Dict[str, Any]:
    shipments = await db.shipments.find({"tenant_id": tenant_id, "carrier": name}, {"_id": 0, "status": 1}).to_list(2000)
    total = len(shipments)
    exceptions = sum(1 for s in shipments if s.get("status") in ("delayed", "held", "exception"))
    on_time_pct = round(((total - exceptions) / total) * 100, 1) if total else None
    return {"shipments_count": total, "exceptions_count": exceptions, "on_time_pct": on_time_pct}


@api_router.post("/providers", response_model=ProviderOut)
async def create_provider(body: ProviderIn, user: dict = Depends(require_permission("edit"))):
    tenant_id = user.get("tenant_id")
    if user["role"] == Role.SUPERADMIN.value and not tenant_id:
        raise HTTPException(status_code=400, detail="Super admin has no tenant context — create providers from a tenant user account")
    doc = {
        **body.model_dump(),
        "id": str(uuid.uuid4()),
        "tenant_id": tenant_id,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.providers.insert_one(doc)
    return {**doc, "shipments_count": 0, "exceptions_count": 0, "on_time_pct": None}


@api_router.get("/providers", response_model=List[ProviderOut])
async def list_providers(tenant_id: Optional[str] = Query(default=None), user: dict = Depends(require_permission("view"))):
    query = _tenant_scoped_query(None, user, tenant_id)
    providers = await db.providers.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    out = []
    for p in providers:
        stats = await _provider_stats(p.get("tenant_id"), p["name"])
        out.append({**p, **stats})
    return out


@api_router.put("/providers/{provider_id}", response_model=ProviderOut)
async def update_provider(provider_id: str, body: Dict[str, Any], user: dict = Depends(require_permission("edit"))):
    query = _tenant_scoped_query(provider_id, user)
    existing = await db.providers.find_one(query, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Provider not found")
    patch = {k: v for k, v in body.items() if k in PROVIDER_FIELDS}
    if patch:
        await db.providers.update_one(query, {"$set": patch})
        existing.update(patch)
    stats = await _provider_stats(existing.get("tenant_id"), existing["name"])
    return {**existing, **stats}


@api_router.delete("/providers/{provider_id}")
async def delete_provider(provider_id: str, user: dict = Depends(require_permission("delete"))):
    query = _tenant_scoped_query(provider_id, user)
    res = await db.providers.delete_one(query)
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Provider not found")
    return {"status": "success"}


# ---------------- Store / Warehouse (tenant-scoped) ----------------
class StoreIn(BaseModel):
    name: str = Field(min_length=1, max_length=160)
    type: str = Field(default="warehouse", pattern="^(store|warehouse)$")
    address: str = ""
    city: str = ""
    country: str = ""
    lat: Optional[float] = None
    lng: Optional[float] = None
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    enabled: bool = True


class StoreOut(StoreIn):
    model_config = ConfigDict(extra="ignore")
    id: str
    tenant_id: Optional[str] = None
    created_at: str


STORE_FIELDS = {"name", "type", "address", "city", "country", "lat", "lng", "contact_name", "contact_phone", "contact_email", "enabled"}


@api_router.post("/stores", response_model=StoreOut)
async def create_store(body: StoreIn, user: dict = Depends(require_permission("edit"))):
    tenant_id = user.get("tenant_id")
    if user["role"] == Role.SUPERADMIN.value and not tenant_id:
        raise HTTPException(status_code=400, detail="Super admin has no tenant context — create stores from a tenant user account")
    doc = {
        **body.model_dump(),
        "id": str(uuid.uuid4()),
        "tenant_id": tenant_id,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.stores.insert_one(doc)
    return doc


@api_router.get("/stores", response_model=List[StoreOut])
async def list_stores(tenant_id: Optional[str] = Query(default=None), user: dict = Depends(require_permission("view"))):
    query = _tenant_scoped_query(None, user, tenant_id)
    return await db.stores.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)


@api_router.put("/stores/{store_id}", response_model=StoreOut)
async def update_store(store_id: str, body: Dict[str, Any], user: dict = Depends(require_permission("edit"))):
    query = _tenant_scoped_query(store_id, user)
    existing = await db.stores.find_one(query, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Store/warehouse not found")
    patch = {k: v for k, v in body.items() if k in STORE_FIELDS}
    if patch:
        await db.stores.update_one(query, {"$set": patch})
        existing.update(patch)
    return existing


@api_router.delete("/stores/{store_id}")
async def delete_store(store_id: str, user: dict = Depends(require_permission("delete"))):
    query = _tenant_scoped_query(store_id, user)
    res = await db.stores.delete_one(query)
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Store/warehouse not found")
    return {"status": "success"}


# ---------------- Webhooks (tenant-scoped) ----------------
WEBHOOK_EVENTS = {"shipment.created", "shipment.status_changed", "shipment.delivered", "shipment.exception"}


class WebhookIn(BaseModel):
    url: str = Field(min_length=1, max_length=500)
    events: List[str] = Field(default_factory=list)
    enabled: bool = True


class WebhookOut(WebhookIn):
    model_config = ConfigDict(extra="ignore")
    id: str
    tenant_id: Optional[str] = None
    created_at: str


WEBHOOK_FIELDS = {"url", "events", "enabled"}


async def _fire_webhooks(tenant_id: Optional[str], event: str, payload: dict):
    if not tenant_id:
        return
    hooks = await db.webhooks.find({"tenant_id": tenant_id, "enabled": True, "events": event}, {"_id": 0}).to_list(100)
    if not hooks:
        return

    async def _send(url: str):
        try:
            async with httpx.AsyncClient(timeout=10) as c:
                await c.post(url, json={"event": event, "data": payload})
        except Exception as e:
            logger.warning(f"Webhook delivery failed for {url}: {e}")

    for h in hooks:
        asyncio.create_task(_send(h["url"]))


@api_router.post("/webhooks", response_model=WebhookOut)
async def create_webhook(body: WebhookIn, user: dict = Depends(require_permission("edit"))):
    tenant_id = user.get("tenant_id")
    if user["role"] == Role.SUPERADMIN.value and not tenant_id:
        raise HTTPException(status_code=400, detail="Super admin has no tenant context — create webhooks from a tenant user account")
    doc = {
        "url": body.url,
        "events": [e for e in body.events if e in WEBHOOK_EVENTS],
        "enabled": body.enabled,
        "id": str(uuid.uuid4()),
        "tenant_id": tenant_id,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.webhooks.insert_one(doc)
    return doc


@api_router.get("/webhooks", response_model=List[WebhookOut])
async def list_webhooks(tenant_id: Optional[str] = Query(default=None), user: dict = Depends(require_permission("view"))):
    query = _tenant_scoped_query(None, user, tenant_id)
    return await db.webhooks.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)


@api_router.put("/webhooks/{webhook_id}", response_model=WebhookOut)
async def update_webhook(webhook_id: str, body: Dict[str, Any], user: dict = Depends(require_permission("edit"))):
    query = _tenant_scoped_query(webhook_id, user)
    existing = await db.webhooks.find_one(query, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Webhook not found")
    patch = {k: v for k, v in body.items() if k in WEBHOOK_FIELDS}
    if "events" in patch:
        patch["events"] = [e for e in patch["events"] if e in WEBHOOK_EVENTS]
    if patch:
        await db.webhooks.update_one(query, {"$set": patch})
        existing.update(patch)
    return existing


@api_router.delete("/webhooks/{webhook_id}")
async def delete_webhook(webhook_id: str, user: dict = Depends(require_permission("delete"))):
    query = _tenant_scoped_query(webhook_id, user)
    res = await db.webhooks.delete_one(query)
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Webhook not found")
    return {"status": "success"}


# ---------------- Post-Purchase Experience (tenant singleton) ----------------
class PostPurchaseIn(BaseModel):
    logo_url: str = ""
    primary_color: str = "#111111"
    secondary_color: str = "#FF4500"
    welcome_message: str = "Thanks for your purchase! Track your shipment below."
    notification_email_template: str = ""
    notification_sms_template: str = ""


class PostPurchaseOut(PostPurchaseIn):
    model_config = ConfigDict(extra="ignore")
    tenant_id: Optional[str] = None
    updated_at: str


@api_router.get("/post-purchase", response_model=PostPurchaseOut)
async def get_post_purchase(user: dict = Depends(require_permission("view"))):
    tenant_id = user.get("tenant_id")
    doc = await db.post_purchase.find_one({"tenant_id": tenant_id}, {"_id": 0})
    if not doc:
        default = PostPurchaseIn()
        return {**default.model_dump(), "tenant_id": tenant_id, "updated_at": datetime.now(timezone.utc).isoformat()}
    return doc


@api_router.put("/post-purchase", response_model=PostPurchaseOut)
async def update_post_purchase(body: PostPurchaseIn, user: dict = Depends(require_permission("edit"))):
    tenant_id = user.get("tenant_id")
    if user["role"] == Role.SUPERADMIN.value and not tenant_id:
        raise HTTPException(status_code=400, detail="Super admin has no tenant context")
    doc = {**body.model_dump(), "tenant_id": tenant_id, "updated_at": datetime.now(timezone.utc).isoformat()}
    await db.post_purchase.update_one({"tenant_id": tenant_id}, {"$set": doc}, upsert=True)
    return doc


# ---------------- AI (Gemini 3 Flash) ----------------
class AICreateRequest(BaseModel):
    prompt: str


class AIInsightRequest(BaseModel):
    shipment: dict
    question: Optional[str] = None


async def _gemini(system_message: str, prompt: str, session: str) -> str:
    if not _LLM_SDK_AVAILABLE:
        raise RuntimeError("emergentintegrations SDK not installed")
    if not EMERGENT_LLM_KEY:
        raise RuntimeError("EMERGENT_LLM_KEY not configured")
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=session,
        system_message=system_message,
    ).with_model("gemini", GEMINI_MODEL)

    async def _run():
        out = ""
        async for ev in chat.stream_message(UserMessage(text=prompt)):
            if isinstance(ev, TextDelta):
                out += ev.content
            elif isinstance(ev, StreamDone):
                break
        return out

    return await asyncio.wait_for(_run(), timeout=25)


def _extract_json(text: str):
    text = text.strip()
    fence = re.search(r"```(?:json)?\s*(.*?)```", text, re.DOTALL)
    if fence:
        text = fence.group(1).strip()
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1:
        text = text[start:end + 1]
    return json.loads(text)


CREATE_SYSTEM = (
    "You are a logistics routing engine for the 'Route Tower' shipment visibility platform. "
    "Given a natural-language request, design ONE realistic international/domestic shipment and "
    "return ONLY strict minified JSON (no prose, no markdown). Schema: "
    '{"mode": one of ["Road","Ocean","Air","Rail","Multimodal"], '
    '"origin": city, "destination": city, "carrier": realistic carrier name (or "A + B" for multimodal), '
    '"tracking": realistic tracking number, "eta": human date like "Aug 24, 2026", '
    '"status": one of ["in_transit","delayed","held","exception","delivered"], '
    '"current": short current-location string, '
    '"stops": array of 3 to 6 objects [{"city":str,"country":str,"lat":number,"lng":number,'
    '"event": normalized uppercase milestone like "PICKED UP"|"IN TRANSIT"|"CUSTOMS"|"PORT"|"DELIVERED"}]}. '
    "Use accurate real-world latitude/longitude for each stop. First stop = origin, last stop = destination. "
    "Pick a sensible mode and carriers for the geography. Keep it plausible and enterprise-grade."
)


@api_router.post("/ai/create-shipment")
async def ai_create_shipment(req: AICreateRequest):
    try:
        raw = await _gemini(CREATE_SYSTEM, req.prompt, f"create-{uuid.uuid4()}")
        data = _extract_json(raw)
    except Exception as e:
        logger.error(f"AI create failed: {e}")
        raise HTTPException(status_code=502, detail="AI could not generate a shipment. Try rephrasing.")
    data["id"] = "CT-" + str(uuid.uuid4().int % 90000 + 10000)
    return {"status": "success", "shipment": data}


INSIGHT_SYSTEM = (
    "You are Route Tower's AI tracking co-pilot for logistics operations teams. "
    "Given a shipment's JSON and an optional question, respond in 2-4 short sentences. "
    "Be specific and actionable: assess risk, likely next milestone, and a recommended next action. "
    "Plain text only, no markdown headers."
)


@api_router.post("/ai/insight")
async def ai_insight(req: AIInsightRequest):
    try:
        q = req.question or "Give me a tracking status summary, risk assessment and the recommended next action."
        prompt = f"Shipment:\n{json.dumps(req.shipment)}\n\nQuestion: {q}"
        text = await _gemini(INSIGHT_SYSTEM, prompt, f"insight-{req.shipment.get('id','x')}")
    except Exception as e:
        logger.error(f"AI insight failed: {e}")
        raise HTTPException(status_code=502, detail="AI insight is unavailable right now.")
    return {"status": "success", "insight": text.strip()}


class CSVRequest(BaseModel):
    csv: str


CSV_SYSTEM = (
    "You are a data-normalization engine for the 'Route Tower' shipment platform. "
    "The user pastes messy CSV/tabular shipment data (headers may vary or be missing). "
    "Normalize EACH row into a shipment and return ONLY strict minified JSON: "
    '{"shipments": [ { same schema as a Route Tower shipment } ] }. '
    "Each shipment: {\"mode\": one of [\"Road\",\"Ocean\",\"Air\",\"Rail\",\"Multimodal\"], "
    '"origin": city, "destination": city, "carrier": str, "tracking": str, '
    '"eta": human date like "Sep 02, 2026", "status": one of ["in_transit","delayed","held","exception","delivered"], '
    '"current": short string, "stops": 2-5 objects [{"city","country","lat":number,"lng":number,"event":UPPERCASE}]}. '
    "Infer sensible modes, normalize varied status wording into the allowed values, and use real lat/lng. "
    "Process at most 15 rows. No prose, no markdown."
)


@api_router.post("/ai/normalize-csv")
async def ai_normalize_csv(req: CSVRequest):
    try:
        raw = await _gemini(CSV_SYSTEM, req.csv[:6000], f"csv-{uuid.uuid4()}")
        data = _extract_json(raw)
        ships = data.get("shipments", []) if isinstance(data, dict) else []
    except Exception as e:
        logger.error(f"CSV normalize failed: {e}")
        raise HTTPException(status_code=502, detail="Could not normalize that data. Check the format.")
    for s in ships:
        s["id"] = "CT-" + str(uuid.uuid4().int % 90000 + 10000)
    return {"status": "success", "shipments": ships, "count": len(ships)}


class AlertsRequest(BaseModel):
    shipments: List[dict]


ALERTS_SYSTEM = (
    "You are Route Tower's predictive risk engine. Given a JSON array of shipments, identify the ones "
    "MOST LIKELY TO MISS their ETA. Return ONLY strict minified JSON: "
    '{"alerts": [ {"id": shipment id, "risk": "high"|"medium", "probability": integer 0-100 (chance of ETA miss), '
    '"reason": short cause, "action": short recommended next action} ] }. '
    "Only include shipments with meaningful risk (skip delivered and clearly on-track ones). "
    "Order by probability descending. No prose, no markdown."
)


@api_router.post("/ai/alerts")
async def ai_alerts(req: AlertsRequest):
    try:
        slim = [{k: s.get(k) for k in ("id", "status", "mode", "origin", "destination", "eta", "current", "carrier")} for s in req.shipments]
        raw = await _gemini(ALERTS_SYSTEM, json.dumps(slim), f"alerts-{uuid.uuid4()}")
        data = _extract_json(raw)
        alerts = data.get("alerts", []) if isinstance(data, dict) else []
    except Exception as e:
        logger.error(f"AI alerts failed: {e}")
        raise HTTPException(status_code=502, detail="Risk scan is unavailable right now.")
    return {"status": "success", "alerts": alerts, "count": len(alerts)}


app.include_router(api_router)

_cors_origins = [o.strip() for o in os.environ.get('CORS_ORIGINS', 'http://localhost:3000').split(',') if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=_cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def seed_superadmin_and_indexes():
    await db.users.create_index("email", unique=True)
    existing = await db.users.find_one({"email": SUPERADMIN_EMAIL})
    if not existing:
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "email": SUPERADMIN_EMAIL,
            "password_hash": hash_password(SUPERADMIN_PASSWORD),
            "role": Role.SUPERADMIN.value,
            "tenant_id": None,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        logger.info(f"Seeded default super admin user ({SUPERADMIN_EMAIL})")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
