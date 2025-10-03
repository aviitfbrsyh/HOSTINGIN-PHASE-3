from fastapi import FastAPI, APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import Document, init_beanie, Indexed, PydanticObjectId
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext
import jwt
import os
import logging
import hashlib
import random
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db_name = os.environ['DB_NAME']

# JWT Config
JWT_SECRET = os.environ.get('JWT_SECRET', 'change-this-secret-key')
JWT_ALGORITHM = os.environ.get('JWT_ALGORITHM', 'HS256')
JWT_EXPIRATION = int(os.environ.get('JWT_EXPIRATION_MINUTES', 1440))

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

class User(Document):
    name: str
    email: Indexed(EmailStr, unique=True)
    password_hash: str
    role: str = "user"  # user or admin
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    settings: Dict[str, Any] = Field(default_factory=lambda: {"theme": "light", "color": "blue"})
    
    model_config = ConfigDict(arbitrary_types_allowed=True)
    
    class Settings:
        name = "users"

class Package(Document):
    slug: Indexed(str, unique=True)
    title: str
    price_cents: int
    features: List[str]
    storage_mb: int
    bandwidth_gb: int
    description: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    model_config = ConfigDict(arbitrary_types_allowed=True)
    
    class Settings:
        name = "packages"

class Order(Document):
    user_id: PydanticObjectId
    package_id: PydanticObjectId
    domain: str
    period_months: int
    price_cents: int
    status: str = "pending"  # pending, paid, active, expired, cancelled
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    expires_at: Optional[datetime] = None
    promo_code: Optional[str] = None
    
    model_config = ConfigDict(arbitrary_types_allowed=True)
    
    class Settings:
        name = "orders"

class Payment(Document):
    order_id: PydanticObjectId
    amount_cents: int
    method: str  # bank_transfer, virtual_account, ewallet
    status: str = "pending"  # pending, success, failed
    payload: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    model_config = ConfigDict(arbitrary_types_allowed=True)
    
    class Settings:
        name = "payments"

class Ticket(Document):
    user_id: PydanticObjectId
    subject: str
    message: str
    status: str = "open"  # open, replied, closed
    replies: List[Dict[str, Any]] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    model_config = ConfigDict(arbitrary_types_allowed=True)
    
    class Settings:
        name = "tickets"

class Announcement(Document):
    title: str
    message: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    model_config = ConfigDict(arbitrary_types_allowed=True)
    
    class Settings:
        name = "announcements"

class Promo(Document):
    code: Indexed(str, unique=True)
    discount_percent: int
    expires_at: datetime
    usage_limit: int
    usage_count: int = 0
    
    model_config = ConfigDict(arbitrary_types_allowed=True)
    
    class Settings:
        name = "promos"

class Affiliate(Document):
    user_id: PydanticObjectId
    code: Indexed(str, unique=True)
    clicks: int = 0
    earnings_cents: int = 0
    
    model_config = ConfigDict(arbitrary_types_allowed=True)
    
    class Settings:
        name = "affiliates"

class ActivityLog(Document):
    admin_user_id: PydanticObjectId
    action: str
    meta: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    model_config = ConfigDict(arbitrary_types_allowed=True)
    
    class Settings:
        name = "activity_logs"

class KnowledgeArticle(Document):
    title: str
    content: str
    category: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    model_config = ConfigDict(arbitrary_types_allowed=True)
    
    class Settings:
        name = "knowledge_articles"

# ==================== PYDANTIC SCHEMAS ====================

class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str
    settings: Dict[str, Any]
    created_at: datetime

class PackageCreate(BaseModel):
    slug: str
    title: str
    price_cents: int
    features: List[str]
    storage_mb: int
    bandwidth_gb: int
    description: str

class PackageResponse(BaseModel):
    id: str
    slug: str
    title: str
    price_cents: int
    features: List[str]
    storage_mb: int
    bandwidth_gb: int
    description: str
    created_at: datetime

class OrderCreate(BaseModel):
    package_id: str
    domain: str
    period_months: int
    promo_code: Optional[str] = None

class OrderResponse(BaseModel):
    id: str
    user_id: str
    package_id: str
    domain: str
    period_months: int
    price_cents: int
    status: str
    created_at: datetime
    expires_at: Optional[datetime]
    promo_code: Optional[str]

class PaymentSimulate(BaseModel):
    method: str
    outcome: str  # success or failed

class PaymentResponse(BaseModel):
    id: str
    order_id: str
    amount_cents: int
    method: str
    status: str
    created_at: datetime

class TicketCreate(BaseModel):
    subject: str
    message: str

class TicketResponse(BaseModel):
    id: str
    user_id: str
    subject: str
    message: str
    status: str
    replies: List[Dict[str, Any]]
    created_at: datetime

class AnnouncementCreate(BaseModel):
    title: str
    message: str

class StatsResponse(BaseModel):
    total_revenue_cents: int
    total_orders: int
    total_users: int
    active_orders: int
    recent_orders: List[Dict[str, Any]]

# ==================== HELPER FUNCTIONS ====================

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=JWT_EXPIRATION)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has expired")
    except jwt.JWTError:
        raise credentials_exception
    
    user = await User.find_one(User.email == email)
    if user is None:
        raise credentials_exception
    return user

async def get_admin_user(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return current_user

def check_domain_availability(domain: str) -> bool:
    """Dummy domain checker using consistent hashing"""
    hash_value = int(hashlib.md5(domain.encode()).hexdigest(), 16)
    return hash_value % 3 != 0  # 2/3 chance of being available

def get_ai_response(query: str) -> Dict[str, Any]:
    """Dummy AI assistant with canned responses"""
    query_lower = query.lower()
    responses = {
        "pricing": "Our pricing starts from $5/month for Basic plan, $15/month for Pro, and $30/month for Enterprise. All plans include 24/7 support!",
        "support": "You can reach our support team via tickets in your dashboard, or email us at support@hostingin.com. We're available 24/7!",
        "domain": "You can register a new domain or transfer an existing one when creating an order. Domain registration is included in all plans!",
        "ssl": "Free SSL certificates are included with all our hosting plans. They're automatically installed and renewed!",
        "backup": "We perform daily automatic backups of your website. You can restore from any backup in the last 30 days.",
        "default": "I'm here to help! You can ask me about pricing, support, domains, SSL, backups, or create a support ticket for detailed assistance."
    }
    
    for key, response in responses.items():
        if key in query_lower:
            return {"answer": response, "category": key}
    
    return {"answer": responses["default"], "category": "general"}

# ==================== CREATE APP ====================

app = FastAPI(title="HostingIn API")
api_router = APIRouter(prefix="/api")

# ==================== STARTUP ====================

@app.on_event("startup")
async def startup_event():
    await init_beanie(
        database=client[db_name],
        document_models=[
            User, Package, Order, Payment, Ticket, 
            Announcement, Promo, Affiliate, ActivityLog, KnowledgeArticle
        ]
    )
    logger.info("Database initialized")
    
    # Seed data if empty
    users_count = await User.count()
    if users_count == 0:
        logger.info("Seeding initial data...")
        
        # Create admin user
        admin = User(
            name="Admin User",
            email="admin@hostingin.com",
            password_hash=hash_password("admin123"),
            role="admin"
        )
        await admin.insert()
        
        # Create test user
        test_user = User(
            name="Test User",
            email="test@hostingin.com",
            password_hash=hash_password("password123"),
            role="user"
        )
        await test_user.insert()
        
        # Create packages
        packages_data = [
            {
                "slug": "basic",
                "title": "Basic Hosting",
                "price_cents": 500,
                "features": ["10GB SSD Storage", "100GB Bandwidth", "1 Domain", "Free SSL", "24/7 Support"],
                "storage_mb": 10240,
                "bandwidth_gb": 100,
                "description": "Perfect for personal websites and blogs"
            },
            {
                "slug": "pro",
                "title": "Pro Hosting",
                "price_cents": 1500,
                "features": ["50GB SSD Storage", "500GB Bandwidth", "5 Domains", "Free SSL", "Priority Support", "Daily Backups"],
                "storage_mb": 51200,
                "bandwidth_gb": 500,
                "description": "Ideal for growing businesses and e-commerce"
            },
            {
                "slug": "enterprise",
                "title": "Enterprise Hosting",
                "price_cents": 3000,
                "features": ["200GB SSD Storage", "2TB Bandwidth", "Unlimited Domains", "Free SSL", "Dedicated Support", "Hourly Backups", "CDN Included"],
                "storage_mb": 204800,
                "bandwidth_gb": 2048,
                "description": "For high-traffic websites and applications"
            }
        ]
        
        package_objects = []
        for pkg_data in packages_data:
            pkg = Package(**pkg_data)
            await pkg.insert()
            package_objects.append(pkg)
        
        # Create sample order
        sample_order = Order(
            user_id=test_user.id,
            package_id=package_objects[0].id,
            domain="example.com",
            period_months=12,
            price_cents=500,
            status="pending"
        )
        await sample_order.insert()
        
        # Create sample payment
        sample_payment = Payment(
            order_id=sample_order.id,
            amount_cents=500,
            method="bank_transfer",
            status="pending"
        )
        await sample_payment.insert()
        
        # Create knowledge articles
        kb_articles = [
            {
                "title": "Getting Started with HostingIn",
                "content": "Welcome to HostingIn! This guide will help you get started with your hosting account...",
                "category": "Getting Started"
            },
            {
                "title": "How to Install SSL Certificate",
                "content": "SSL certificates are automatically installed for all domains. Here's how to verify...",
                "category": "Security"
            },
            {
                "title": "Managing Your Domain",
                "content": "Learn how to manage your domain settings, DNS records, and more...",
                "category": "Domains"
            }
        ]
        
        for article_data in kb_articles:
            article = KnowledgeArticle(**article_data)
            await article.insert()
        
        logger.info("Seeding completed!")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register")
async def register(user_data: UserRegister):
    # Check if user exists
    existing = await User.find_one(User.email == user_data.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user = User(
        name=user_data.name,
        email=user_data.email,
        password_hash=hash_password(user_data.password),
        role="user"
    )
    await user.insert()
    
    # Generate token
    access_token = create_access_token(data={"sub": user.email})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": str(user.id),
            "name": user.name,
            "email": user.email,
            "role": user.role
        }
    }

@api_router.post("/auth/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await User.find_one(User.email == form_data.username)
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    access_token = create_access_token(data={"sub": user.email})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": str(user.id),
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "settings": user.settings
        }
    }

@api_router.get("/auth/me")
async def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": str(current_user.id),
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role,
        "settings": current_user.settings,
        "created_at": current_user.created_at.isoformat()
    }

@api_router.patch("/auth/settings")
async def update_settings(settings: Dict[str, Any], current_user: User = Depends(get_current_user)):
    current_user.settings.update(settings)
    await current_user.save()
    return {"message": "Settings updated", "settings": current_user.settings}

# ==================== PACKAGE ROUTES ====================

@api_router.get("/packages")
async def get_packages():
    packages = await Package.find_all().to_list()
    return [
        {
            "id": str(pkg.id),
            "slug": pkg.slug,
            "title": pkg.title,
            "price_cents": pkg.price_cents,
            "features": pkg.features,
            "storage_mb": pkg.storage_mb,
            "bandwidth_gb": pkg.bandwidth_gb,
            "description": pkg.description,
            "created_at": pkg.created_at.isoformat()
        }
        for pkg in packages
    ]

@api_router.post("/packages", dependencies=[Depends(get_admin_user)])
async def create_package(package_data: PackageCreate):
    package = Package(**package_data.dict())
    await package.insert()
    return {"message": "Package created", "id": str(package.id)}

@api_router.patch("/packages/{package_id}", dependencies=[Depends(get_admin_user)])
async def update_package(package_id: str, package_data: Dict[str, Any]):
    package = await Package.get(package_id)
    if not package:
        raise HTTPException(status_code=404, detail="Package not found")
    
    for key, value in package_data.items():
        setattr(package, key, value)
    await package.save()
    
    return {"message": "Package updated"}

@api_router.delete("/packages/{package_id}", dependencies=[Depends(get_admin_user)])
async def delete_package(package_id: str):
    package = await Package.get(package_id)
    if not package:
        raise HTTPException(status_code=404, detail="Package not found")
    
    await package.delete()
    return {"message": "Package deleted"}

# ==================== ORDER ROUTES ====================

@api_router.post("/orders")
async def create_order(order_data: OrderCreate, current_user: User = Depends(get_current_user)):
    package = await Package.get(order_data.package_id)
    if not package:
        raise HTTPException(status_code=404, detail="Package not found")
    
    price = package.price_cents * order_data.period_months
    
    # Apply promo code if provided
    if order_data.promo_code:
        promo = await Promo.find_one(Promo.code == order_data.promo_code)
        if promo and promo.expires_at > datetime.now(timezone.utc) and promo.usage_count < promo.usage_limit:
            discount = int(price * promo.discount_percent / 100)
            price -= discount
            promo.usage_count += 1
            await promo.save()
    
    order = Order(
        user_id=current_user.id,
        package_id=package.id,
        domain=order_data.domain,
        period_months=order_data.period_months,
        price_cents=price,
        status="pending",
        promo_code=order_data.promo_code
    )
    await order.insert()
    
    return {
        "message": "Order created",
        "order": {
            "id": str(order.id),
            "domain": order.domain,
            "price_cents": order.price_cents,
            "status": order.status
        }
    }

@api_router.get("/orders")
async def get_orders(status: Optional[str] = None, current_user: User = Depends(get_current_user)):
    query = Order.find(Order.user_id == current_user.id)
    if status:
        query = query.find(Order.status == status)
    
    orders = await query.to_list()
    result = []
    
    for order in orders:
        package = await Package.get(order.package_id)
        result.append({
            "id": str(order.id),
            "domain": order.domain,
            "package_name": package.title if package else "Unknown",
            "period_months": order.period_months,
            "price_cents": order.price_cents,
            "status": order.status,
            "created_at": order.created_at.isoformat(),
            "expires_at": order.expires_at.isoformat() if order.expires_at else None
        })
    
    return result

@api_router.get("/orders/{order_id}")
async def get_order(order_id: str, current_user: User = Depends(get_current_user)):
    order = await Order.get(order_id)
    if not order or order.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Order not found")
    
    package = await Package.get(order.package_id)
    payments = await Payment.find(Payment.order_id == order.id).to_list()
    
    return {
        "id": str(order.id),
        "domain": order.domain,
        "package": {
            "id": str(package.id),
            "title": package.title,
            "features": package.features
        } if package else None,
        "period_months": order.period_months,
        "price_cents": order.price_cents,
        "status": order.status,
        "created_at": order.created_at.isoformat(),
        "expires_at": order.expires_at.isoformat() if order.expires_at else None,
        "payments": [
            {
                "id": str(p.id),
                "amount_cents": p.amount_cents,
                "method": p.method,
                "status": p.status,
                "created_at": p.created_at.isoformat()
            }
            for p in payments
        ]
    }

@api_router.post("/orders/{order_id}/pay")
async def pay_order(order_id: str, payment_data: PaymentSimulate, current_user: User = Depends(get_current_user)):
    order = await Order.get(order_id)
    if not order or order.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Create payment record
    payment = Payment(
        order_id=order.id,
        amount_cents=order.price_cents,
        method=payment_data.method,
        status="pending"
    )
    await payment.insert()
    
    # Simulate payment
    if payment_data.outcome == "success":
        payment.status = "success"
        order.status = "paid"
        order.expires_at = datetime.now(timezone.utc) + timedelta(days=30 * order.period_months)
    else:
        payment.status = "failed"
    
    await payment.save()
    await order.save()
    
    return {
        "message": f"Payment {payment.status}",
        "payment": {
            "id": str(payment.id),
            "status": payment.status
        },
        "order": {
            "id": str(order.id),
            "status": order.status
        }
    }

@api_router.post("/orders/{order_id}/renew")
async def renew_order(order_id: str, current_user: User = Depends(get_current_user)):
    order = await Order.get(order_id)
    if not order or order.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Create new order with same details
    package = await Package.get(order.package_id)
    new_order = Order(
        user_id=current_user.id,
        package_id=order.package_id,
        domain=order.domain,
        period_months=order.period_months,
        price_cents=package.price_cents * order.period_months,
        status="pending"
    )
    await new_order.insert()
    
    return {
        "message": "Order renewed",
        "order_id": str(new_order.id)
    }

# ==================== PAYMENT ROUTES ====================

@api_router.get("/payments/{order_id}")
async def get_payments(order_id: str, current_user: User = Depends(get_current_user)):
    order = await Order.get(order_id)
    if not order or order.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Order not found")
    
    payments = await Payment.find(Payment.order_id == order.id).to_list()
    
    return [
        {
            "id": str(p.id),
            "amount_cents": p.amount_cents,
            "method": p.method,
            "status": p.status,
            "created_at": p.created_at.isoformat()
        }
        for p in payments
    ]

# ==================== TICKET ROUTES ====================

@api_router.post("/tickets")
async def create_ticket(ticket_data: TicketCreate, current_user: User = Depends(get_current_user)):
    ticket = Ticket(
        user_id=current_user.id,
        subject=ticket_data.subject,
        message=ticket_data.message,
        status="open"
    )
    await ticket.insert()
    
    return {
        "message": "Ticket created",
        "ticket_id": str(ticket.id)
    }

@api_router.get("/tickets")
async def get_tickets(current_user: User = Depends(get_current_user)):
    if current_user.role == "admin":
        tickets = await Ticket.find_all().to_list()
    else:
        tickets = await Ticket.find(Ticket.user_id == current_user.id).to_list()
    
    return [
        {
            "id": str(t.id),
            "subject": t.subject,
            "message": t.message,
            "status": t.status,
            "created_at": t.created_at.isoformat(),
            "replies_count": len(t.replies)
        }
        for t in tickets
    ]

# ==================== ADMIN ROUTES ====================

@api_router.get("/admin/orders")
async def admin_get_orders(admin: User = Depends(get_admin_user)):
    orders = await Order.find_all().to_list()
    result = []
    
    for order in orders:
        user = await User.get(order.user_id)
        package = await Package.get(order.package_id)
        result.append({
            "id": str(order.id),
            "user_email": user.email if user else "Unknown",
            "domain": order.domain,
            "package_name": package.title if package else "Unknown",
            "price_cents": order.price_cents,
            "status": order.status,
            "created_at": order.created_at.isoformat()
        })
    
    return result

@api_router.patch("/admin/orders/{order_id}")
async def admin_update_order(order_id: str, data: Dict[str, Any], admin: User = Depends(get_admin_user)):
    order = await Order.get(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    for key, value in data.items():
        setattr(order, key, value)
    await order.save()
    
    # Log activity
    log = ActivityLog(
        admin_user_id=admin.id,
        action=f"Updated order {order_id}",
        meta={"order_id": order_id, "changes": data}
    )
    await log.insert()
    
    return {"message": "Order updated"}

@api_router.get("/admin/stats")
async def admin_get_stats(admin: User = Depends(get_admin_user)):
    # Calculate stats
    all_orders = await Order.find_all().to_list()
    paid_orders = [o for o in all_orders if o.status in ["paid", "active"]]
    total_revenue = sum(o.price_cents for o in paid_orders)
    
    users_count = await User.count()
    active_orders = len([o for o in all_orders if o.status == "active"])
    
    # Recent orders
    recent = sorted(all_orders, key=lambda x: x.created_at, reverse=True)[:10]
    recent_orders = []
    for order in recent:
        user = await User.get(order.user_id)
        package = await Package.get(order.package_id)
        recent_orders.append({
            "id": str(order.id),
            "user_email": user.email if user else "Unknown",
            "package_name": package.title if package else "Unknown",
            "price_cents": order.price_cents,
            "status": order.status,
            "created_at": order.created_at.isoformat()
        })
    
    return {
        "total_revenue_cents": total_revenue,
        "total_orders": len(all_orders),
        "total_users": users_count,
        "active_orders": active_orders,
        "recent_orders": recent_orders
    }

@api_router.post("/admin/announce")
async def admin_announce(announcement_data: AnnouncementCreate, admin: User = Depends(get_admin_user)):
    announcement = Announcement(**announcement_data.dict())
    await announcement.insert()
    
    return {"message": "Announcement created", "id": str(announcement.id)}

@api_router.get("/admin/logs")
async def admin_get_logs(admin: User = Depends(get_admin_user)):
    logs = await ActivityLog.find_all().sort(-ActivityLog.created_at).to_list(100)
    
    return [
        {
            "id": str(log.id),
            "action": log.action,
            "meta": log.meta,
            "created_at": log.created_at.isoformat()
        }
        for log in logs
    ]

# ==================== UTILITY ROUTES ====================

@api_router.get("/domain/check")
async def check_domain(q: str):
    available = check_domain_availability(q)
    return {
        "domain": q,
        "available": available,
        "message": f"Domain {q} is {'available' if available else 'taken'}!"
    }

@api_router.get("/ai/help")
async def ai_help(q: str):
    response = get_ai_response(q)
    return response

@api_router.get("/kb")
async def get_kb_articles():
    articles = await KnowledgeArticle.find_all().to_list()
    return [
        {
            "id": str(a.id),
            "title": a.title,
            "content": a.content,
            "category": a.category,
            "created_at": a.created_at.isoformat()
        }
        for a in articles
    ]

@api_router.get("/announcements")
async def get_announcements():
    announcements = await Announcement.find_all().sort(-Announcement.created_at).to_list(5)
    return [
        {
            "id": str(a.id),
            "title": a.title,
            "message": a.message,
            "created_at": a.created_at.isoformat()
        }
        for a in announcements
    ]

# ==================== INCLUDE ROUTER ====================

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)
