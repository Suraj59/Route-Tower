from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import httpx
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Email (Emergent managed Resend)
EMAIL_BASE_URL = "https://integrations.emergentagent.com"
EMAIL_KEY = os.environ["EMERGENT_EMAIL_KEY"]
EMAIL_FROM_NAME = os.environ["EMAIL_FROM_NAME"]
DEMO_LEAD_RECIPIENT = os.environ["DEMO_LEAD_RECIPIENT"]

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = FastAPI()
api_router = APIRouter(prefix="/api")


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
        f'font-family:Arial,sans-serif;font-size:13px;color:#8E8E93;width:150px;">{k}</td>'
        f'<td style="padding:10px 16px;border-bottom:1px solid #E5E5EA;'
        f'font-family:Arial,sans-serif;font-size:14px;color:#111111;font-weight:600;">{v}</td></tr>'
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


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
