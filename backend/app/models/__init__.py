"""ORM model package — import all models so Alembic can discover them."""

from app.models.user import User, UserRole  # noqa: F401
from app.models.profiles import (  # noqa: F401
    CollectorProfile, RecyclerProfile, AggregatorProfile, Business
)
from app.models.product import (  # noqa: F401
    ProductCategory, Product, ProductCondition, ProductFunctionality, ProductStatus
)
from app.models.ml_models import (  # noqa: F401
    ModelVersion, ImageUpload, MLPrediction, ObjectDetection, ModelFeedback
)
from app.models.condition import ConditionAssessment  # noqa: F401
from app.models.pricing import PriceEstimate, RecyclerQuotation  # noqa: F401
from app.models.transaction import (  # noqa: F401
    CollectionRequest, CollectionRequestStatus,
    Transaction, TransactionStatus, TransactionItem
)
from app.models.social import (  # noqa: F401
    Inventory, Review, Notification, RecyclerDocument, AuditLog
)
