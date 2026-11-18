"""
Seed initial database data.
Run after first migration: python seed_data.py

Creates:
- 12 product categories
- 1 admin account  (DEMO — change password immediately)
- 3 recycler demo accounts (clearly labeled as DEMONSTRATION accounts)
"""
from __future__ import annotations
import os, sys, uuid
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

# Load env
from dotenv import load_dotenv
load_dotenv()

from sqlalchemy.orm import Session
from app.database.session import SessionLocal
from app.core.security import get_password_hash
from app.models.user import User, UserRole
from app.models.product import ProductCategory
from app.models.profiles import RecyclerProfile


CATEGORIES = [
    {"name": "Laptop", "slug": "laptop", "description": "Portable computers and notebooks", "icon_name": "laptop"},
    {"name": "Mobile Phone", "slug": "mobile_phone", "description": "Smartphones and feature phones", "icon_name": "smartphone"},
    {"name": "Battery", "slug": "battery", "description": "Rechargeable batteries and power banks", "icon_name": "battery"},
    {"name": "Keyboard", "slug": "keyboard", "description": "Computer keyboards and input devices", "icon_name": "keyboard"},
    {"name": "Mouse", "slug": "mouse", "description": "Computer mice and pointing devices", "icon_name": "mouse-pointer"},
    {"name": "Printed Circuit Board", "slug": "pcb", "description": "PCBs and electronic circuit boards", "icon_name": "circuit-board"},
    {"name": "Monitor", "slug": "monitor", "description": "Computer monitors and display screens", "icon_name": "monitor"},
    {"name": "Printer", "slug": "printer", "description": "Printers, scanners and copiers", "icon_name": "printer"},
    {"name": "Television", "slug": "television", "description": "TVs and display panels", "icon_name": "tv"},
    {"name": "Cables", "slug": "cables", "description": "Data cables, power cables and adapters", "icon_name": "cable"},
    {"name": "Charger / Adapter", "slug": "charger_adapter", "description": "Phone chargers and power adapters", "icon_name": "plug"},
    {"name": "Other E-Waste", "slug": "other_ewaste", "description": "Other electronic waste not covered above", "icon_name": "trash-2"},
]

DEMO_RECYCLERS = [
    {
        "email": "demo_recycler1@kabadiwala.demo",
        "full_name": "GreenCycle Solutions [DEMO]",
        "phone": "9000000001",
        "city": "Delhi",
        "state": "Delhi",
        "address": "Block A, Industrial Area, Okhla, Delhi — 110020",
        "latitude": 28.5355, "longitude": 77.2910,
        "accepted_categories": ["laptop", "mobile_phone", "battery", "monitor"],
        "collection_capacity_kg": 1000.0,
    },
    {
        "email": "demo_recycler2@kabadiwala.demo",
        "full_name": "EcoTech Recyclers [DEMO]",
        "phone": "9000000002",
        "city": "Mumbai",
        "state": "Maharashtra",
        "address": "Unit 5, MIDC Estate, Turbhe, Navi Mumbai — 400705",
        "latitude": 19.0760, "longitude": 72.8777,
        "accepted_categories": ["pcb", "laptop", "television", "printer"],
        "collection_capacity_kg": 2000.0,
    },
    {
        "email": "demo_recycler3@kabadiwala.demo",
        "full_name": "SafeDisposal India [DEMO]",
        "phone": "9000000003",
        "city": "Bengaluru",
        "state": "Karnataka",
        "address": "14/B Electronics City, Phase 1, Bengaluru — 560100",
        "latitude": 12.8456, "longitude": 77.6603,
        "accepted_categories": ["cables", "charger_adapter", "keyboard", "mouse", "other_ewaste"],
        "collection_capacity_kg": 500.0,
    },
]


def seed(db: Session) -> None:
    print("🌱 Seeding database …")

    # Categories
    for cat_data in CATEGORIES:
        exists = db.query(ProductCategory).filter(ProductCategory.slug == cat_data["slug"]).first()
        if not exists:
            db.add(ProductCategory(**cat_data, is_active=True))
    db.commit()
    print(f"  ✅ {len(CATEGORIES)} product categories seeded.")

    # Admin account
    admin_email = "admin@kabadiwala.local"
    if not db.query(User).filter(User.email == admin_email).first():
        admin = User(
            id=str(uuid.uuid4()),
            email=admin_email,
            hashed_password=get_password_hash("Admin@123456"),  # CHANGE IN PRODUCTION
            full_name="Platform Administrator",
            role=UserRole.admin,
            is_active=True,
            is_verified=True,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        db.add(admin)
        db.commit()
        print(f"  ✅ Admin account: {admin_email} / Admin@123456 (CHANGE THIS!)")

    # Demo recyclers
    for rd in DEMO_RECYCLERS:
        if not db.query(User).filter(User.email == rd["email"]).first():
            user = User(
                id=str(uuid.uuid4()),
                email=rd["email"],
                hashed_password=get_password_hash("Demo@123456"),
                full_name=rd["full_name"],
                phone=rd["phone"],
                role=UserRole.recycler,
                is_active=True,
                is_verified=True,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            )
            db.add(user)
            db.flush()
            profile = RecyclerProfile(
                id=str(uuid.uuid4()),
                user_id=user.id,
                business_name=rd["full_name"],
                address=rd["address"],
                city=rd["city"],
                state=rd["state"],
                accepted_categories=rd["accepted_categories"],
                collection_capacity_kg=rd["collection_capacity_kg"],
                is_verified=True,  # Demo accounts pre-verified
                verification_status="approved",
                latitude=rd["latitude"],
                longitude=rd["longitude"],
                contact_phone=rd["phone"],
            )
            db.add(profile)
            db.commit()

    # Test user accounts
    test_users = [
        {"email": "collector@example.com", "name": "Ramesh Kumar (Collector)", "role": UserRole.collector},
        {"email": "household@example.com", "name": "Priya Sharma (Household)", "role": UserRole.household},
        {"email": "recycler@example.com", "name": "Delhi E-Waste Recyclers", "role": UserRole.recycler},
        {"email": "admin@kabadiwala.ai", "name": "System Administrator", "role": UserRole.admin},
    ]
    for tu in test_users:
        if not db.query(User).filter(User.email == tu["email"]).first():
            db.add(User(
                id=str(uuid.uuid4()),
                email=tu["email"],
                hashed_password=get_password_hash("Test@123456" if "admin" not in tu["email"] else "Admin@123456"),
                full_name=tu["name"],
                phone="9876543210",
                role=tu["role"],
                is_active=True,
                is_verified=True,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            ))
            db.commit()

    print(f"  ✅ {len(DEMO_RECYCLERS)} DEMONSTRATION recycler accounts seeded.")
    print("  ⚠️  DEMO accounts are clearly labeled. Do NOT present them as verified real facilities.")
    print("🎉 Seeding complete!")


if __name__ == "__main__":
    from app.database.base import Base, engine
    import app.models  # noqa: F401
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed(db)
    finally:
        db.close()
