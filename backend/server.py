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

class Cart(Document):
    user_id: PydanticObjectId
    items: List[Dict[str, Any]] = Field(default_factory=list)
    total_cents: int = 0
    status: str = "open"  # open, checked_out
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    model_config = ConfigDict(arbitrary_types_allowed=True)
    
    class Settings:
        name = "carts"

class Notification(Document):
    user_id: PydanticObjectId
    title: str
    message: str
    type: str = "system"  # system, order, billing, announcement
    category: str = "system"  # promo, system, payment, expiry
    is_read: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    model_config = ConfigDict(arbitrary_types_allowed=True)
    
    class Settings:
        name = "notifications"

class SupportTicket(Document):
    user_id: PydanticObjectId
    subject: str
    message: str
    source: str = "manual"  # manual, ai_escalation
    status: str = "open"  # open, in_progress, resolved, closed
    priority: str = "medium"  # low, medium, high
    assigned_to: Optional[PydanticObjectId] = None
    replies: List[Dict[str, Any]] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    model_config = ConfigDict(arbitrary_types_allowed=True)
    
    class Settings:
        name = "support_tickets"

class Referral(Document):
    user_id: PydanticObjectId
    code: Indexed(str, unique=True)
    clicks: int = 0
    signups: int = 0
    conversions: int = 0
    rewards_earned_cents: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    model_config = ConfigDict(arbitrary_types_allowed=True)
    
    class Settings:
        name = "referrals"

class UserProfile(Document):
    user_id: Indexed(PydanticObjectId, unique=True)
    completion_percentage: int = 0
    badges: List[str] = Field(default_factory=list)
    onboarding_completed: bool = False
    preferences: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    model_config = ConfigDict(arbitrary_types_allowed=True)
    
    class Settings:
        name = "user_profiles"

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
            Announcement, Promo, Affiliate, ActivityLog, KnowledgeArticle,
            Cart, Notification, SupportTicket, Referral, UserProfile
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
        
        # Create sample notifications for test user
        sample_notifications = [
            {
                "user_id": test_user.id,
                "title": "🎉 Welcome to HostingIn!",
                "message": "Selamat datang di HostingIn! Nikmati hosting premium dengan harga terjangkau.",
                "type": "system",
                "category": "system",
                "is_read": False
            },
            {
                "user_id": test_user.id,
                "title": "💳 Payment Reminder",
                "message": "Jangan lupa untuk menyelesaikan pembayaran order Anda.",
                "type": "billing",
                "category": "payment",
                "is_read": False
            },
            {
                "user_id": test_user.id,
                "title": "🎁 Special Promo - 50% OFF!",
                "message": "Gunakan kode PROMO50 untuk diskon 50% pada order selanjutnya!",
                "type": "announcement",
                "category": "promo",
                "is_read": False
            }
        ]
        
        for notif_data in sample_notifications:
            notif = Notification(**notif_data)
            await notif.insert()
        
        # Create referral for test user
        referral_code = f"REF{str(test_user.id)[:8].upper()}"
        test_referral = Referral(
            user_id=test_user.id,
            code=referral_code,
            clicks=15,
            signups=5,
            conversions=2,
            rewards_earned_cents=10000
        )
        await test_referral.insert()
        
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
    
    # Create notification for order creation
    notification = Notification(
        user_id=current_user.id,
        title="📦 Order Created",
        message=f"Order untuk domain {order_data.domain} telah dibuat. Silakan lanjutkan pembayaran.",
        type="order",
        category="system",
        is_read=False
    )
    await notification.insert()
    
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
    """Enhanced domain checker with TLD pricing"""
    # TLD pricing in cents (Rupiah)
    tld_pricing = {
        ".com": 150000,
        ".id": 300000,
        ".co.id": 250000,
        ".net": 145000,
        ".org": 130000,
        ".store": 85000,
        ".tech": 100000,
        ".ai": 400000
    }
    
    results = []
    for tld, price_cents in tld_pricing.items():
        domain_with_tld = f"{q}{tld}"
        available = check_domain_availability(domain_with_tld)
        results.append({
            "tld": tld,
            "domain": domain_with_tld,
            "price_cents": price_cents,
            "available": available
        })
    
    return {
        "query": q,
        "results": results
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

# ==================== CART ROUTES ====================

@api_router.get("/cart")
async def get_cart(current_user: User = Depends(get_current_user)):
    """Get user's cart"""
    cart = await Cart.find_one(Cart.user_id == current_user.id, Cart.status == "open")
    
    if not cart:
        # Create new cart if doesn't exist
        cart = Cart(user_id=current_user.id, items=[], total_cents=0)
        await cart.insert()
    
    return {
        "id": str(cart.id),
        "items": cart.items,
        "total_cents": cart.total_cents,
        "status": cart.status
    }

@api_router.post("/cart/add")
async def add_to_cart(item: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Add item to cart (domain, hosting, or addon)"""
    cart = await Cart.find_one(Cart.user_id == current_user.id, Cart.status == "open")
    
    if not cart:
        cart = Cart(user_id=current_user.id, items=[], total_cents=0)
        await cart.insert()
    
    # Add item to cart
    cart.items.append(item)
    
    # Recalculate total
    cart.total_cents = sum(i.get("price_cents", 0) for i in cart.items)
    cart.updated_at = datetime.now(timezone.utc)
    
    await cart.save()
    
    return {
        "id": str(cart.id),
        "items": cart.items,
        "total_cents": cart.total_cents,
        "message": f"{item.get('name', 'Item')} added to cart"
    }

@api_router.delete("/cart/remove/{item_index}")
async def remove_from_cart(item_index: int, current_user: User = Depends(get_current_user)):
    """Remove item from cart by index"""
    cart = await Cart.find_one(Cart.user_id == current_user.id, Cart.status == "open")
    
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")
    
    if item_index < 0 or item_index >= len(cart.items):
        raise HTTPException(status_code=400, detail="Invalid item index")
    
    removed_item = cart.items.pop(item_index)
    cart.total_cents = sum(i.get("price_cents", 0) for i in cart.items)
    cart.updated_at = datetime.now(timezone.utc)
    
    await cart.save()
    
    return {
        "message": f"{removed_item.get('name', 'Item')} removed from cart",
        "items": cart.items,
        "total_cents": cart.total_cents
    }

@api_router.delete("/cart/clear")
async def clear_cart(current_user: User = Depends(get_current_user)):
    """Clear all items from cart"""
    cart = await Cart.find_one(Cart.user_id == current_user.id, Cart.status == "open")
    
    if cart:
        cart.items = []
        cart.total_cents = 0
        cart.updated_at = datetime.now(timezone.utc)
        await cart.save()
    
    return {"message": "Cart cleared"}

# ==================== CHECKOUT & PAYMENT ROUTES ====================

@api_router.post("/checkout")
async def checkout(payment_method: Dict[str, str], current_user: User = Depends(get_current_user)):
    """Checkout cart and create order with payment"""
    cart = await Cart.find_one(Cart.user_id == current_user.id, Cart.status == "open")
    
    if not cart or len(cart.items) == 0:
        raise HTTPException(status_code=400, detail="Cart is empty")
    
    # Extract domain and services from cart
    domain = None
    services = []
    package_id = None
    
    for item in cart.items:
        if item.get("type") == "domain":
            domain = item.get("name")
        elif item.get("type") == "hosting":
            package_id = item.get("package_id")
            services.append(item.get("slug", "hosting"))
        elif item.get("type") == "addon":
            services.append(item.get("slug"))
    
    if not domain:
        raise HTTPException(status_code=400, detail="Domain is required")
    
    # Create order
    order = Order(
        user_id=current_user.id,
        package_id=PydanticObjectId(package_id) if package_id else None,
        domain=domain,
        period_months=12,  # Default 1 year
        price_cents=cart.total_cents,
        status="inactive"  # Start as inactive until payment
    )
    await order.insert()
    
    # Create payment record
    payment = Payment(
        order_id=order.id,
        amount_cents=cart.total_cents,
        method=payment_method.get("method", "unknown"),
        status="pending",
        payload={
            "services": services,
            "payment_details": payment_method,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    )
    await payment.insert()
    
    # Mark cart as checked out
    cart.status = "checked_out"
    await cart.save()
    
    # Create notification
    notification = Notification(
        user_id=current_user.id,
        title="Order Created",
        message=f"Order for {domain} has been created. Please complete payment.",
        type="order"
    )
    await notification.insert()
    
    # Generate payment reference based on method
    payment_reference = None
    if "VA" in payment_method.get("method", ""):
        # Virtual Account number
        bank_code = payment_method.get("method", "VA").split("-")[-1]
        payment_reference = f"{bank_code[:3].upper()}{str(order.id)[-9:]}"
    elif "QRIS" in payment_method.get("method", ""):
        payment_reference = f"QRIS-{str(order.id)[-12:]}"
    
    return {
        "order_id": str(order.id),
        "payment_id": str(payment.id),
        "amount_cents": cart.total_cents,
        "method": payment_method.get("method"),
        "payment_reference": payment_reference,
        "status": "pending",
        "expires_in_seconds": 900  # 15 minutes
    }

@api_router.post("/payment/{payment_id}/simulate")
async def simulate_payment(payment_id: str, current_user: User = Depends(get_current_user)):
    """Start payment simulation - will auto-succeed after 3 minutes"""
    try:
        payment = await Payment.get(payment_id)
    except Exception:
        # Invalid ObjectId format or other errors
        raise HTTPException(status_code=404, detail="Payment not found")
    
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    order = await Order.get(payment.order_id)
    
    if not order or order.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    # Update order status to pending (waiting for payment)
    order.status = "pending"
    await order.save()
    
    # Payment status will be updated by background job after 3 minutes
    # For now, return pending status
    
    return {
        "payment_id": str(payment.id),
        "order_id": str(order.id),
        "status": "pending",
        "message": "Payment is being processed. It will be automatically confirmed in ~3 minutes."
    }

@api_router.get("/payment/{payment_id}/status")
async def get_payment_status(payment_id: str, current_user: User = Depends(get_current_user)):
    """Check payment status"""
    try:
        payment = await Payment.get(payment_id)
    except Exception:
        # Invalid ObjectId format or other errors
        raise HTTPException(status_code=404, detail="Payment not found")
    
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    order = await Order.get(payment.order_id)
    
    if not order or order.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    # Auto-update payment status based on time (simulation)
    created_at = payment.created_at
    if created_at.tzinfo is None:
        created_at = created_at.replace(tzinfo=timezone.utc)
    now = datetime.now(timezone.utc)
    elapsed_seconds = (now - created_at).total_seconds()
    
    if payment.status == "pending":
        if elapsed_seconds >= 180:  # 3 minutes
            # Auto success
            payment.status = "success"
            await payment.save()
            
            order.status = "paid"
            order.expires_at = now + timedelta(days=365)  # 1 year from now
            await order.save()
            
            # Create notification
            notification = Notification(
                user_id=current_user.id,
                title="Payment Successful",
                message=f"Payment for {order.domain} has been completed. Your service is now active!",
                type="billing"
            )
            await notification.insert()
            
            # Update order to active after payment
            order.status = "active"
            await order.save()
            
        elif elapsed_seconds >= 900:  # 15 minutes
            # Auto cancel
            payment.status = "failed"
            await payment.save()
            
            order.status = "cancelled"
            await order.save()
            
            notification = Notification(
                user_id=current_user.id,
                title="Payment Cancelled",
                message=f"Payment for {order.domain} has been cancelled due to timeout.",
                type="billing"
            )
            await notification.insert()
    
    return {
        "payment_id": str(payment.id),
        "order_id": str(order.id),
        "payment_status": payment.status,
        "order_status": order.status,
        "elapsed_seconds": int(elapsed_seconds),
        "expires_in_seconds": max(0, 900 - int(elapsed_seconds))
    }

# ==================== MY SERVICES ROUTES ====================

@api_router.get("/services/my")
async def get_my_services(current_user: User = Depends(get_current_user)):
    """Get all user's active services"""
    orders = await Order.find(Order.user_id == current_user.id).to_list()
    
    services = []
    for order in orders:
        package = await Package.get(order.package_id) if order.package_id else None
        
        services.append({
            "id": str(order.id),
            "domain": order.domain,
            "package": package.title if package else "Custom",
            "status": order.status,
            "created_at": order.created_at.isoformat(),
            "expires_at": order.expires_at.isoformat() if order.expires_at else None,
            "price_cents": order.price_cents,
            "period_months": order.period_months
        })
    
    return services

@api_router.post("/services/{order_id}/renew")
async def renew_service(order_id: str, current_user: User = Depends(get_current_user)):
    """Renew a service - extends expiry by 1 year"""
    order = await Order.get(order_id)
    
    if not order or order.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Extend expiry date by 1 year
    if order.expires_at:
        order.expires_at = order.expires_at + timedelta(days=365)
    else:
        order.expires_at = datetime.now(timezone.utc) + timedelta(days=365)
    
    order.status = "active"
    await order.save()
    
    # Create notification
    notification = Notification(
        user_id=current_user.id,
        title="Service Renewed",
        message=f"Your service for {order.domain} has been renewed for 1 year.",
        type="order"
    )
    await notification.insert()
    
    return {
        "message": "Service renewed successfully",
        "expires_at": order.expires_at.isoformat()
    }

# ==================== NOTIFICATION ROUTES ====================

@api_router.get("/notifications")
async def get_notifications(current_user: User = Depends(get_current_user)):
    """Get user notifications"""
    notifications = await Notification.find(
        Notification.user_id == current_user.id
    ).sort(-Notification.created_at).to_list(50)
    
    return [
        {
            "id": str(n.id),
            "title": n.title,
            "message": n.message,
            "type": n.type,
            "category": n.category,
            "is_read": n.is_read,
            "created_at": n.created_at.isoformat()
        }
        for n in notifications
    ]

@api_router.patch("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str, current_user: User = Depends(get_current_user)):
    """Mark notification as read"""
    notification = await Notification.get(notification_id)
    
    if not notification or notification.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    notification.is_read = True
    await notification.save()
    
    return {"message": "Notification marked as read"}

@api_router.post("/notifications/read-all")
async def mark_all_read(current_user: User = Depends(get_current_user)):
    """Mark all notifications as read"""
    notifications = await Notification.find(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).to_list()
    
    for n in notifications:
        n.is_read = True
        await n.save()
    
    return {"message": f"{len(notifications)} notifications marked as read"}


# ==================== AI SUPPORT CHAT ROUTES ====================

# AI FAQ Knowledge Base
AI_FAQ_DATABASE = {
    "reset password": {
        "answer": "Untuk reset password, klik 'Forgot Password' di halaman login, masukkan email Anda, dan ikuti instruksi di email yang dikirim.",
        "related": ["login", "email", "akun"]
    },
    "cara order domain": {
        "answer": "1. Masuk ke Dashboard\n2. Cek domain di Domain Checker\n3. Tambahkan domain ke Cart\n4. Pilih hosting package (opsional)\n5. Checkout dan pilih metode pembayaran",
        "related": ["domain", "hosting", "cart"]
    },
    "cara upload website": {
        "answer": "Untuk upload website:\n1. Login ke cPanel (info ada di email aktivasi)\n2. Buka File Manager\n3. Masuk ke folder public_html\n4. Upload file website Anda\n5. Extract file zip jika perlu",
        "related": ["cpanel", "file manager", "hosting"]
    },
    "cara setting dns": {
        "answer": "Untuk setting DNS:\n1. Masuk ke Dashboard → My Services\n2. Klik domain yang ingin diatur\n3. Pilih menu DNS Management\n4. Tambahkan/edit record DNS (A, CNAME, MX, dll)\n5. Tunggu propagasi 1-24 jam",
        "related": ["domain", "nameserver", "dns"]
    },
    "cara install ssl": {
        "answer": "SSL gratis otomatis aktif untuk semua hosting. Jika belum aktif:\n1. Login ke cPanel\n2. Buka SSL/TLS Status\n3. Klik 'AutoSSL'\n4. Tunggu instalasi (5-10 menit)\nAtau hubungi support jika ada masalah.",
        "related": ["ssl", "https", "keamanan"]
    },
    "cara perpanjang domain": {
        "answer": "Untuk perpanjang domain/hosting:\n1. Masuk ke Dashboard → My Services\n2. Cari layanan yang akan expired\n3. Klik tombol 'Renew'\n4. Pilih periode perpanjangan\n5. Lakukan pembayaran",
        "related": ["renewal", "expired", "billing"]
    },
    "status pembayaran": {
        "answer": "Untuk cek status pembayaran:\n1. Masuk ke Dashboard\n2. Klik menu 'Billing & Invoices'\n3. Lihat status invoice Anda\nPembayaran diproses maksimal 1x24 jam. Jika sudah bayar tapi belum terkonfirmasi, hubungi support.",
        "related": ["payment", "invoice", "billing"]
    },
    "cara transfer domain": {
        "answer": "Untuk transfer domain ke HostingIn:\n1. Minta EPP code dari registrar lama\n2. Unlock domain di registrar lama\n3. Order Transfer Domain di Dashboard\n4. Masukkan EPP code\n5. Konfirmasi email approval\n6. Proses selesai 5-7 hari kerja",
        "related": ["domain", "transfer", "epp"]
    }
}

@api_router.post("/support/chat")
async def ai_support_chat(
    query: Dict[str, str],
    current_user: User = Depends(get_current_user)
):
    """AI Support Chat - Mock FAQ with intelligent matching"""
    user_query = query.get("message", "").lower().strip()
    
    if not user_query:
        return {
            "type": "suggestions",
            "message": "Halo! Ada yang bisa saya bantu?",
            "suggestions": [
                "Cara upload website",
                "Reset password",
                "Cara order domain",
                "Status pembayaran"
            ]
        }
    
    # Simple keyword matching
    best_match = None
    best_score = 0
    
    for key, data in AI_FAQ_DATABASE.items():
        score = 0
        keywords = key.split()
        for keyword in keywords:
            if keyword in user_query:
                score += 2
        
        # Check related keywords
        for related in data.get("related", []):
            if related in user_query:
                score += 1
        
        if score > best_score:
            best_score = score
            best_match = (key, data)
    
    # If good match found
    if best_match and best_score >= 2:
        key, data = best_match
        return {
            "type": "answer",
            "message": data["answer"],
            "related_topics": data.get("related", [])
        }
    
    # If no good match - offer escalation
    return {
        "type": "escalation",
        "message": "Maaf, saya belum bisa menjawab pertanyaan ini. Apakah Anda ingin saya buatkan tiket support untuk Anda? Tim support kami akan membantu dalam 1x24 jam.",
        "can_escalate": True
    }

@api_router.post("/support/tickets")
async def create_support_ticket(
    ticket_data: Dict[str, str],
    current_user: User = Depends(get_current_user)
):
    """Create support ticket (escalated from AI or manual)"""
    ticket = SupportTicket(
        user_id=current_user.id,
        subject=ticket_data.get("subject", "Support Request"),
        message=ticket_data.get("message", ""),
        source=ticket_data.get("source", "manual"),
        priority=ticket_data.get("priority", "medium")
    )
    await ticket.insert()
    
    # Create notification
    notification = Notification(
        user_id=current_user.id,
        title="Support Ticket Created",
        message=f"Tiket #{str(ticket.id)[:8]} telah dibuat. Tim support akan merespons dalam 1x24 jam.",
        type="system",
        category="system"
    )
    await notification.insert()
    
    return {
        "id": str(ticket.id),
        "subject": ticket.subject,
        "status": ticket.status,
        "created_at": ticket.created_at.isoformat(),
        "message": "Tiket berhasil dibuat. Tim support akan segera membantu Anda."
    }

@api_router.get("/support/tickets")
async def get_user_tickets(current_user: User = Depends(get_current_user)):
    """Get user's support tickets"""
    tickets = await SupportTicket.find(
        SupportTicket.user_id == current_user.id
    ).sort(-SupportTicket.created_at).to_list(50)
    
    return [
        {
            "id": str(t.id),
            "subject": t.subject,
            "message": t.message,
            "status": t.status,
            "priority": t.priority,
            "source": t.source,
            "replies_count": len(t.replies),
            "created_at": t.created_at.isoformat(),
            "updated_at": t.updated_at.isoformat()
        }
        for t in tickets
    ]

@api_router.get("/support/tickets/{ticket_id}")
async def get_ticket_detail(
    ticket_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get ticket details with replies"""
    ticket = await SupportTicket.get(ticket_id)
    
    if not ticket or ticket.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    return {
        "id": str(ticket.id),
        "subject": ticket.subject,
        "message": ticket.message,
        "status": ticket.status,
        "priority": ticket.priority,
        "source": ticket.source,
        "replies": ticket.replies,
        "created_at": ticket.created_at.isoformat(),
        "updated_at": ticket.updated_at.isoformat()
    }

# ==================== ADMIN SUPPORT ROUTES ====================

@api_router.get("/admin/support/tickets")
async def admin_get_all_tickets(
    status: Optional[str] = None,
    admin_user: User = Depends(get_admin_user)
):
    """Admin: Get all support tickets"""
    query = {}
    if status:
        query[SupportTicket.status] = status
    
    tickets = await SupportTicket.find(query).sort(-SupportTicket.created_at).to_list()
    
    result = []
    for t in tickets:
        user = await User.get(t.user_id)
        result.append({
            "id": str(t.id),
            "subject": t.subject,
            "message": t.message[:100] + "..." if len(t.message) > 100 else t.message,
            "status": t.status,
            "priority": t.priority,
            "source": t.source,
            "user_name": user.name if user else "Unknown",
            "user_email": user.email if user else "Unknown",
            "replies_count": len(t.replies),
            "created_at": t.created_at.isoformat(),
            "updated_at": t.updated_at.isoformat()
        })
    
    return result

@api_router.patch("/admin/support/tickets/{ticket_id}")
async def admin_update_ticket(
    ticket_id: str,
    update_data: Dict[str, Any],
    admin_user: User = Depends(get_admin_user)
):
    """Admin: Update ticket status or add reply"""
    ticket = await SupportTicket.get(ticket_id)
    
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    # Update status
    if "status" in update_data:
        ticket.status = update_data["status"]
    
    # Add reply
    if "reply" in update_data:
        ticket.replies.append({
            "admin_id": str(admin_user.id),
            "admin_name": admin_user.name,
            "message": update_data["reply"],
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        
        # Notify user
        notification = Notification(
            user_id=ticket.user_id,
            title="Support Reply Received",
            message=f"Admin telah membalas tiket #{str(ticket.id)[:8]}",
            type="system",
            category="system"
        )
        await notification.insert()
    
    ticket.updated_at = datetime.now(timezone.utc)
    await ticket.save()
    
    return {"message": "Ticket updated successfully"}

@api_router.get("/admin/support/stats")
async def admin_support_stats(admin_user: User = Depends(get_admin_user)):
    """Admin: Get support statistics"""
    all_tickets = await SupportTicket.find().to_list()
    
    stats = {
        "total": len(all_tickets),
        "open": len([t for t in all_tickets if t.status == "open"]),
        "in_progress": len([t for t in all_tickets if t.status == "in_progress"]),
        "resolved": len([t for t in all_tickets if t.status == "resolved"]),
        "closed": len([t for t in all_tickets if t.status == "closed"]),
        "ai_escalated": len([t for t in all_tickets if t.source == "ai_escalation"]),
        "manual": len([t for t in all_tickets if t.source == "manual"])
    }
    
    return stats

# ==================== NOTIFICATION ENHANCEMENT ====================

@api_router.get("/notifications/unread-count")
async def get_unread_count(current_user: User = Depends(get_current_user)):
    """Get unread notifications count"""
    count = await Notification.find(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).count()
    
    return {"count": count}

@api_router.post("/admin/notifications/broadcast")
async def broadcast_notification(
    data: Dict[str, Any],
    admin_user: User = Depends(get_admin_user)
):
    """Admin: Broadcast notification to all users or specific group"""
    title = data.get("title", "")
    message = data.get("message", "")
    category = data.get("category", "system")  # promo, system, maintenance
    target = data.get("target", "all")  # all, active_users, etc
    
    # Get target users
    if target == "all":
        users = await User.find(User.role == "user").to_list()
    else:
        users = await User.find(User.role == "user").to_list()  # Simplified
    
    # Create notification for each user
    notifications_created = 0
    for user in users:
        notification = Notification(
            user_id=user.id,
            title=title,
            message=message,
            type="announcement",
            category=category
        )
        await notification.insert()
        notifications_created += 1
    
    # Log activity
    log = ActivityLog(
        admin_user_id=admin_user.id,
        action="broadcast_notification",
        meta={"title": title, "users_count": notifications_created, "category": category}
    )
    await log.insert()
    
    return {
        "message": f"Notification broadcasted to {notifications_created} users",
        "count": notifications_created
    }

# ==================== ACTIVITY TIMELINE ROUTES ====================

@api_router.get("/history/timeline")
async def get_activity_timeline(current_user: User = Depends(get_current_user)):
    """Get user activity timeline (orders, payments, tickets, etc)"""
    timeline = []
    
    # Get orders
    orders = await Order.find(
        Order.user_id == current_user.id
    ).sort(-Order.created_at).limit(50).to_list()
    
    for order in orders:
        package = await Package.get(order.package_id)
        
        # Order created event
        timeline.append({
            "type": "order_created",
            "icon": "📦",
            "title": "Order Created",
            "description": f"Order domain {order.domain}",
            "meta": {
                "domain": order.domain,
                "package": package.title if package else "Custom",
                "price": order.price_cents
            },
            "timestamp": order.created_at.isoformat()
        })
        
        # Payment events
        payments = await Payment.find(Payment.order_id == order.id).to_list()
        for payment in payments:
            if payment.status == "success":
                timeline.append({
                    "type": "payment_success",
                    "icon": "💳",
                    "title": "Payment Success",
                    "description": f"Payment Rp{payment.amount_cents // 100:,} sukses",
                    "meta": {
                        "amount": payment.amount_cents,
                        "method": payment.method
                    },
                    "timestamp": payment.created_at.isoformat()
                })
        
        # Service activation
        if order.status == "active" and order.expires_at:
            timeline.append({
                "type": "service_active",
                "icon": "🌐",
                "title": "Service Active",
                "description": f"Domain {order.domain} active",
                "meta": {
                    "domain": order.domain,
                    "expires_at": order.expires_at.isoformat()
                },
                "timestamp": order.created_at.isoformat()
            })
    
    # Get support tickets
    tickets = await SupportTicket.find(
        SupportTicket.user_id == current_user.id
    ).limit(20).to_list()
    
    for ticket in tickets:
        timeline.append({
            "type": "support_ticket",
            "icon": "🤖",
            "title": "Support Ticket",
            "description": ticket.subject,
            "meta": {
                "status": ticket.status,
                "replies_count": len(ticket.replies)
            },
            "timestamp": ticket.created_at.isoformat()
        })
    
    # Sort by timestamp (newest first)
    timeline.sort(key=lambda x: x["timestamp"], reverse=True)
    
    return timeline[:50]  # Return last 50 events

# ==================== REFERRAL & REWARDS ROUTES ====================

@api_router.get("/referral/me")
async def get_referral_info(current_user: User = Depends(get_current_user)):
    """Get user referral information"""
    # Get or create referral
    referral = await Referral.find_one(Referral.user_id == current_user.id)
    
    if not referral:
        # Generate unique referral code
        code = f"REF{str(current_user.id)[:8].upper()}"
        referral = Referral(
            user_id=current_user.id,
            code=code
        )
        await referral.insert()
    
    # Simulate some data for demo
    return {
        "code": referral.code,
        "link": f"https://hostingin.com/register?ref={referral.code}",
        "stats": {
            "clicks": referral.clicks,
            "signups": referral.signups,
            "conversions": referral.conversions,
            "rewards_earned": referral.rewards_earned_cents
        },
        "rewards_available": [
            {
                "id": "1",
                "name": "Diskon 50% Renewal",
                "description": "Diskon 50% untuk perpanjangan hosting",
                "cost_points": 3,
                "available": referral.conversions >= 3
            },
            {
                "id": "2",
                "name": "1 Bulan Hosting Gratis",
                "description": "Gratis 1 bulan hosting unlimited",
                "cost_points": 5,
                "available": referral.conversions >= 5
            },
            {
                "id": "3",
                "name": "Domain .com Gratis",
                "description": "Gratis domain .com untuk 1 tahun",
                "cost_points": 10,
                "available": referral.conversions >= 10
            }
        ],
        "leaderboard_position": random.randint(50, 500),  # Mock data
        "next_milestone": {
            "target": 3,
            "current": referral.conversions,
            "reward": "Diskon 50% Renewal"
        }
    }

@api_router.post("/referral/simulate-click")
async def simulate_referral_click(current_user: User = Depends(get_current_user)):
    """Simulate referral click (for demo purposes)"""
    referral = await Referral.find_one(Referral.user_id == current_user.id)
    
    if referral:
        referral.clicks += 1
        # Random chance to simulate signup and conversion
        if random.random() > 0.7:  # 30% chance
            referral.signups += 1
            if random.random() > 0.5:  # 50% of signups convert
                referral.conversions += 1
                referral.rewards_earned_cents += 50000  # Rp 50k per conversion
        
        await referral.save()
        
        return {
            "message": "Referral click simulated",
            "stats": {
                "clicks": referral.clicks,
                "signups": referral.signups,
                "conversions": referral.conversions
            }
        }
    
    return {"message": "Referral not found"}

# ==================== USER PROFILE & GAMIFICATION ====================

@api_router.get("/profile/completion")
async def get_profile_completion(current_user: User = Depends(get_current_user)):
    """Calculate profile completion percentage"""
    profile = await UserProfile.find_one(UserProfile.user_id == current_user.id)
    
    if not profile:
        profile = UserProfile(user_id=current_user.id)
        await profile.insert()
    
    # Calculate completion
    completion_score = 0
    total_fields = 8
    
    # Check various completions
    if current_user.name and len(current_user.name) > 3:
        completion_score += 1
    if current_user.email:
        completion_score += 1
    if current_user.settings.get("theme"):
        completion_score += 1
    
    # Check if user has orders
    orders = await Order.find(Order.user_id == current_user.id).limit(1).to_list()
    if orders:
        completion_score += 1
    
    # Check if user has active services
    active_orders = await Order.find(
        Order.user_id == current_user.id,
        Order.status == "active"
    ).limit(1).to_list()
    if active_orders:
        completion_score += 1
    
    # Check referral setup
    referral = await Referral.find_one(Referral.user_id == current_user.id)
    if referral:
        completion_score += 1
    
    # Check if onboarding completed
    if profile.onboarding_completed:
        completion_score += 1
    
    # Check if user has interacted (tickets or support)
    tickets = await SupportTicket.find(SupportTicket.user_id == current_user.id).limit(1).to_list()
    if tickets:
        completion_score += 1
    
    completion_percentage = int((completion_score / total_fields) * 100)
    profile.completion_percentage = completion_percentage
    await profile.save()
    
    return {
        "completion": completion_percentage,
        "completed_items": completion_score,
        "total_items": total_fields,
        "suggestions": [
            {"text": "Complete your first order", "done": len(orders) > 0},
            {"text": "Setup referral program", "done": referral is not None},
            {"text": "Activate a service", "done": len(active_orders) > 0},
            {"text": "Contact support", "done": len(tickets) > 0},
            {"text": "Complete onboarding wizard", "done": profile.onboarding_completed}
        ]
    }

@api_router.post("/profile/complete-onboarding")
async def complete_onboarding(current_user: User = Depends(get_current_user)):
    """Mark onboarding as completed"""
    profile = await UserProfile.find_one(UserProfile.user_id == current_user.id)
    
    if not profile:
        profile = UserProfile(user_id=current_user.id)
    
    profile.onboarding_completed = True
    profile.updated_at = datetime.now(timezone.utc)
    await profile.save()
    
    # Award badge
    if "onboarding_complete" not in profile.badges:
        profile.badges.append("onboarding_complete")
        await profile.save()
    
    return {"message": "Onboarding completed successfully"}

@api_router.get("/profile/badges")
async def get_user_badges(current_user: User = Depends(get_current_user)):
    """Get user badges and achievements"""
    profile = await UserProfile.find_one(UserProfile.user_id == current_user.id)
    
    if not profile:
        profile = UserProfile(user_id=current_user.id)
        await profile.insert()
    
    # Get user stats for badge calculation
    orders = await Order.find(Order.user_id == current_user.id).to_list()
    active_services = [o for o in orders if o.status == "active"]
    referral = await Referral.find_one(Referral.user_id == current_user.id)
    
    # Define available badges
    all_badges = [
        {
            "id": "onboarding_complete",
            "name": "🎓 Welcome Aboard",
            "description": "Completed onboarding wizard",
            "earned": "onboarding_complete" in profile.badges
        },
        {
            "id": "first_order",
            "name": "🛒 First Order",
            "description": "Made your first purchase",
            "earned": len(orders) > 0
        },
        {
            "id": "active_user",
            "name": "⚡ Active User",
            "description": "Have at least 1 active service",
            "earned": len(active_services) > 0
        },
        {
            "id": "hosting_master",
            "name": "🏆 Hosting Master",
            "description": "Have 3 or more active services",
            "earned": len(active_services) >= 3
        },
        {
            "id": "domain_hunter",
            "name": "🎯 Domain Hunter",
            "description": "Registered 5 or more domains",
            "earned": len(orders) >= 5
        },
        {
            "id": "referral_starter",
            "name": "🤝 Referral Starter",
            "description": "Setup referral program",
            "earned": referral is not None
        },
        {
            "id": "referral_master",
            "name": "💎 Referral Master",
            "description": "Get 5 successful referrals",
            "earned": referral and referral.conversions >= 5
        }
    ]
    
    # Update profile badges
    for badge in all_badges:
        if badge["earned"] and badge["id"] not in profile.badges:
            profile.badges.append(badge["id"])
    
    await profile.save()
    
    return {
        "badges": all_badges,
        "total_earned": len([b for b in all_badges if b["earned"]]),
        "total_available": len(all_badges)
    }

# ==================== ADMIN ANALYTICS ENHANCEMENT ====================

@api_router.get("/admin/analytics/advanced")
async def admin_advanced_analytics(admin_user: User = Depends(get_admin_user)):
    """Admin: Get advanced analytics including lifecycle, referrals, etc"""
    
    # Service lifecycle stats
    all_orders = await Order.find().to_list()
    lifecycle_stats = {
        "total": len(all_orders),
        "pending": len([o for o in all_orders if o.status == "pending"]),
        "paid": len([o for o in all_orders if o.status == "paid"]),
        "active": len([o for o in all_orders if o.status == "active"]),
        "expired": len([o for o in all_orders if o.status == "expired"]),
        "cancelled": len([o for o in all_orders if o.status == "cancelled"])
    }
    
    # Payment stats
    all_payments = await Payment.find().to_list()
    payment_stats = {
        "total_attempts": len(all_payments),
        "success": len([p for p in all_payments if p.status == "success"]),
        "pending": len([p for p in all_payments if p.status == "pending"]),
        "failed": len([p for p in all_payments if p.status == "failed"]),
        "success_rate": round((len([p for p in all_payments if p.status == "success"]) / len(all_payments) * 100), 2) if all_payments else 0
    }
    
    # Referral stats
    all_referrals = await Referral.find().to_list()
    referral_stats = {
        "total_users": len(all_referrals),
        "total_clicks": sum(r.clicks for r in all_referrals),
        "total_signups": sum(r.signups for r in all_referrals),
        "total_conversions": sum(r.conversions for r in all_referrals),
        "conversion_rate": round((sum(r.conversions for r in all_referrals) / sum(r.signups for r in all_referrals) * 100), 2) if sum(r.signups for r in all_referrals) > 0 else 0
    }
    
    # Support stats
    support_tickets = await SupportTicket.find().to_list()
    support_stats = {
        "total": len(support_tickets),
        "open": len([t for t in support_tickets if t.status == "open"]),
        "resolved": len([t for t in support_tickets if t.status == "resolved"]),
        "ai_escalated": len([t for t in support_tickets if t.source == "ai_escalation"])
    }
    
    # Revenue calculation
    successful_payments = [p for p in all_payments if p.status == "success"]
    total_revenue = sum(p.amount_cents for p in successful_payments)
    
    return {
        "lifecycle": lifecycle_stats,
        "payments": payment_stats,
        "referrals": referral_stats,
        "support": support_stats,
        "revenue": {
            "total_cents": total_revenue,
            "total_idr": f"Rp {total_revenue // 100:,}",
            "average_order_value": total_revenue // len(successful_payments) if successful_payments else 0
        }
    }

@api_router.get("/admin/users/{user_id}/activity")
async def admin_get_user_activity(
    user_id: str,
    admin_user: User = Depends(get_admin_user)
):
    """Admin: Get detailed user activity timeline"""
    user = await User.get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    activity = []
    
    # Orders
    orders = await Order.find(Order.user_id == user.id).sort(-Order.created_at).to_list()
    for order in orders:
        activity.append({
            "type": "order",
            "description": f"Order {order.domain}",
            "status": order.status,
            "amount": order.price_cents,
            "timestamp": order.created_at.isoformat()
        })
    
    # Support tickets
    tickets = await SupportTicket.find(SupportTicket.user_id == user.id).sort(-SupportTicket.created_at).to_list()
    for ticket in tickets:
        activity.append({
            "type": "support",
            "description": ticket.subject,
            "status": ticket.status,
            "timestamp": ticket.created_at.isoformat()
        })
    
    # Referrals
    referral = await Referral.find_one(Referral.user_id == user.id)
    if referral:
        activity.append({
            "type": "referral",
            "description": f"Referral program: {referral.conversions} conversions",
            "stats": {
                "clicks": referral.clicks,
                "signups": referral.signups,
                "conversions": referral.conversions
            },
            "timestamp": referral.created_at.isoformat()
        })
    
    # Sort by timestamp
    activity.sort(key=lambda x: x["timestamp"], reverse=True)
    
    return {
        "user": {
            "id": str(user.id),
            "name": user.name,
            "email": user.email,
            "created_at": user.created_at.isoformat()
        },
        "activity": activity
    }

@api_router.patch("/admin/users/{user_id}/suspend")
async def admin_suspend_user(
    user_id: str,
    data: Dict[str, Any],
    admin_user: User = Depends(get_admin_user)
):
    """Admin: Suspend or unsuspend user (simulation)"""
    user = await User.get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    suspend = data.get("suspend", True)
    
    # In a real app, you'd add a 'suspended' field to User model
    # For now, we'll just log the action
    log = ActivityLog(
        admin_user_id=admin_user.id,
        action="suspend_user" if suspend else "unsuspend_user",
        meta={"user_id": str(user.id), "user_email": user.email}
    )
    await log.insert()
    
    # Send notification to user
    notification = Notification(
        user_id=user.id,
        title="Account Status Changed",
        message=f"Your account has been {'suspended' if suspend else 'reactivated'}. Contact support for more information.",
        type="system",
        category="system"
    )
    await notification.insert()
    
    return {
        "message": f"User {'suspended' if suspend else 'unsuspended'} successfully",
        "user_id": str(user.id)
    }

# ==================== SYSTEM SETTINGS ====================

@api_router.get("/admin/settings/global")
async def get_global_settings(admin_user: User = Depends(get_admin_user)):
    """Admin: Get global system settings"""
    # In a real app, store these in a Settings collection
    # For now, return mock data
    return {
        "branding": {
            "accent_color": "blue",
            "logo_url": "/logo.png",
            "company_name": "HostingIn"
        },
        "features": {
            "referral_enabled": True,
            "ai_support_enabled": True,
            "maintenance_mode": False
        },
        "banner": {
            "enabled": True,
            "message": "🎉 Promo Akhir Tahun - Diskon 50% untuk semua paket hosting!",
            "type": "promo"
        }
    }

@api_router.patch("/admin/settings/global")
async def update_global_settings(
    data: Dict[str, Any],
    admin_user: User = Depends(get_admin_user)
):
    """Admin: Update global system settings"""
    # In a real app, save to database
    # For now, just log the action
    log = ActivityLog(
        admin_user_id=admin_user.id,
        action="update_global_settings",
        meta=data
    )
    await log.insert()
    
    return {"message": "Settings updated successfully", "data": data}


# ==================== INCLUDE ROUTER ====================

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)
