"""
Authentication Unit Tests - Kabadiwala Connect AI
"""

from app.core.security import create_access_token, verify_password, get_password_hash

def test_password_hashing():
    raw_pass = "TestPassword@2026"
    hashed = get_password_hash(raw_pass)
    assert hashed != raw_pass
    assert verify_password(raw_pass, hashed) is True
    assert verify_password("WrongPassword", hashed) is False

def test_jwt_token_generation():
    token = create_access_token(data={"sub": "user_123"})
    assert isinstance(token, str)
    assert len(token) > 20
