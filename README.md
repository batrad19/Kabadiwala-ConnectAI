# 🔋 Kabadiwala Connect AI
### Advanced AI-Powered E-Waste Intelligence, Classification, Valuation & Recycling Ecosystem
*An intelligent, full-stack supervised machine learning platform for Smart India Hackathon (SIH) 2026.*

![Python](https://img.shields.io/badge/Python-3.10%2B-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.110%2B-green)
![PyTorch](https://img.shields.io/badge/PyTorch-2.0%2B-orange)
![React](https://img.shields.io/badge/React-18-cyan)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-teal)
![License](https://img.shields.io/badge/License-MIT-purple)

---

## 📌 Project Overview

**Kabadiwala Connect AI** bridges the gap between informal waste collectors (*kabadiwalas*), households, aggregators, and certified recycling facilities.

### Central Lifecycle:
$$\text{Identify} \longrightarrow \text{Understand} \longrightarrow \text{Value} \longrightarrow \text{Connect} \longrightarrow \text{Recycle}$$

1. **Identify**: Photographic deep learning categorization across 12 e-waste categories (Custom CNN, MobileNetV3, EfficientNet).
2. **Understand**: Grad-CAM visual heatmaps explaining AI predictions and multi-factor condition assessment.
3. **Value**: Predictive pricing analytics estimating transparent scrap and component resale values.
4. **Connect**: Interactive geospatial marketplace linking informal collectors with authorized recyclers.
5. **Recycle**: Verified pickup manifests, transaction receipts, audit logs, and ESG environmental impact tracking (CO₂ & energy saved).

---

## 🏗️ Technology Architecture

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS (Eco-Tech Palette), Framer Motion, Recharts, React-Leaflet, Lucide Icons.
- **Backend API**: Python 3.10+, FastAPI, Pydantic v2, SQLAlchemy 2.0 ORM, Alembic migrations, JWT Authentication, SlowAPI rate limiting.
- **Machine Learning**: PyTorch, Torchvision, Scikit-learn, XGBoost, Ultralytics YOLOv8, OpenCV, Grad-CAM.
- **Database**: PostgreSQL (with automatic SQLAlchemy schema creation in development).
- **Deployment**: Docker, Docker Compose, Nginx reverse proxy.

---

## 🚀 Quick Start Guide

### Option A: Complete Docker Compose Stack

Run everything (PostgreSQL database, FastAPI backend, React frontend) with a single command:

```bash
docker-compose up --build
```

- **Frontend Web App**: [http://localhost:5173](http://localhost:5173) (or `http://localhost:3000` via Nginx)
- **Backend API Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Database**: `localhost:5432`

---

### Option B: Local Manual Setup

#### 1. Backend Setup
```bash
cd backend

# Create & activate virtual environment (optional but recommended)
python -m venv .venv
# Windows: .venv\Scripts\activate | Linux/macOS: source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
copy .env.example .env

# Initialize database & seed sample accounts / recyclers / categories
python seed_data.py

# Launch FastAPI development server
uvicorn app.main:app --reload --port 8000
```
Backend API will be live at `http://localhost:8000` (Swagger docs: `http://localhost:8000/docs`).

#### 2. Frontend Setup
```bash
cd frontend

# Install packages
pnpm install # or npm install

# Copy environment file
copy .env.example .env

# Run Vite dev server
pnpm dev # or npm run dev
```
Frontend will be accessible at `http://localhost:5173`.

#### 3. Machine Learning Setup
```bash
cd ml

# Install ML requirements
pip install -r requirements.txt

# Train pricing model on benchmark dataset
python training/train_pricing.py

# Run standalone inference check
python inference/predict.py --image sample.jpg --arch efficientnet
```

---

## 🔑 Demo Accounts & Credentials

The seed script (`backend/seed_data.py`) creates standard test accounts:

| Role | Email | Password | Permissions |
|---|---|---|---|
| **System Administrator** | `admin@kabadiwala.ai` | `Admin@123456` | Full admin dashboard, user audits, model feedback approval |
| **Scrap Collector** | `collector@example.com` | `Test@123456` | Camera classification, inventory, collection requests |
| **Authorized Recycler** | `recycler@example.com` | `Test@123456` | Marketplace profile, pickup dispatch, transaction sign-offs |
| **Household User** | `household@example.com` | `Test@123456` | Direct scrap valuation & doorstep collection booking |

---

## 🎯 Smart India Hackathon (SIH 2026) Demo Scenarios

1. **Photograph & Classify**: Go to `/ai-studio`, snap or upload an e-waste photo (e.g. laptop, PCB, battery). The model returns top prediction, softmax confidence, and top-3 possibilities.
2. **Explainability**: Click "Explain with Grad-CAM" to visualize the heatmap highlighting solder joints or circuit traces.
3. **Rule-Based Correction**: If unsure, submit user feedback to queue the image for administrative dataset retraining.
4. **Multi-Object Detection**: Navigate to `/ai-studio/detect` to run YOLOv8 on complex piles of mixed electronics.
5. **Physical Condition Assessment**: Go to `/condition` to analyze age, functionality, and missing parts to receive refurbishment vs. recycling recommendations.
6. **Market Valuation**: Go to `/valuation` to get an indicative scrap valuation based on weight and regional scrap indices (labeled *DEMONSTRATION DATA*).
7. **Find Recyclers & Book Pickup**: Browse certified recyclers on the `/marketplace` Leaflet map, request collection, and track status at `/marketplace/requests`.
8. **Audit Trail & Environmental Impact**: View finalized manifests at `/transactions` (download printable text receipts) and inspect CO₂/energy savings at `/impact`.

---

## 📁 Repository Layout

```text
kabadiwala-connect-ai/
├── backend/
│   ├── app/
│   │   ├── api/             # REST endpoints (auth, ai, products, recyclers, admin)
│   │   ├── core/            # Config, JWT security, auth dependencies
│   │   ├── database/        # SQLAlchemy engine & session
│   │   ├── models/          # 15+ database entity models
│   │   ├── schemas/         # Pydantic v2 validation models
│   │   └── services/        # ML inference, Grad-CAM, image checks
│   ├── alembic/             # Database migrations
│   ├── seed_data.py         # Seed script for initial categories & users
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/      # UI cards, modals, navigation
│   │   ├── context/         # AuthContext with JWT storage
│   │   ├── layouts/         # DashboardLayout (sidebar + navbar)
│   │   ├── pages/           # 24 Complete React pages
│   │   └── services/        # Axios API client
│   ├── package.json
│   └── tailwind.config.js
├── ml/
│   ├── models/              # Custom CNN, MobileNetV3, EfficientNet-B0
│   ├── preprocessing/       # Class mappings & PyTorch dataset loaders
│   ├── training/            # Training scripts for all 3 models + YOLO + Pricing
│   ├── evaluation/          # Comparative evaluation metrics
│   ├── inference/           # Standalone CLI inference
│   └── explainability/      # Grad-CAM heatmap visualization
├── tests/                   # Backend & ML unit tests
├── docker-compose.yml       # Production/dev container stack
└── README.md
```

---

## ⚖️ License
Distributed under the MIT License. Developed for the Smart India Hackathon (SIH 2026).
