"""Initial schema migration placeholder

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-03-28 12:00:00.000000

NOTE:
In local development, SQLAlchemy Base.metadata.create_all(bind=engine)
is executed automatically on FastAPI application startup, creating all tables:
- users, collector_profiles, recycler_profiles, aggregator_profiles, businesses
- product_categories, products
- model_versions, image_uploads, ml_predictions, object_detections, model_feedback
- condition_assessments, pricing_estimates, scrap_rate_indices
- collection_requests, transactions, transaction_items
- inventories, reviews, notifications, recycler_documents, audit_logs

To generate production migration revisions using Alembic:
Run: alembic revision --autogenerate -m "initial_schema"
Followed by: alembic upgrade head
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '001_initial_schema'
down_revision = None
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Tables are auto-created by SQLAlchemy lifecycle, or created via autogenerate.
    pass

def downgrade() -> None:
    pass
