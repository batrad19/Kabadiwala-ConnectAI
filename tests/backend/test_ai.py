"""
AI API Endpoint Unit Tests - Kabadiwala Connect AI
"""

from app.services.ml_service import ml_service

def test_ml_service_graceful_status():
    """Verify ML service reports readiness status without crashing"""
    assert hasattr(ml_service, 'classifier')
    assert hasattr(ml_service, 'detector')
    assert isinstance(ml_service.is_loaded, bool)
