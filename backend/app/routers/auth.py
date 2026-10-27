from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.database import get_db
from app.models.user import User
from app.models.user_profile import UserProfile
from app.models.cart import Cart
from app.schemas.auth import UserSignupRequest, UserSigninRequest, UserResponse, TokenResponse
from app.services.auth import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def signup(data: UserSignupRequest, db: Session = Depends(get_db)):
    """Register a new customer account."""
    email_clean = data.email.strip().lower()

    # Check for existing email
    existing = db.execute(select(User).where(User.email == email_clean)).scalar_one_or_none()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists.",
        )

    # Create user
    now = datetime.now(timezone.utc)
    new_user = User(
        full_name=data.full_name.strip(),
        email=email_clean,
        password_hash=hash_password(data.password),
        terms_accepted_at=now if data.terms_accepted else None,
        is_active=True,
    )
    db.add(new_user)
    db.flush()

    # Initialize user profile
    profile = UserProfile(user_id=new_user.user_id)
    db.add(profile)

    # Initialize persistent shopping cart
    cart = Cart(user_id=new_user.user_id)
    db.add(cart)

    db.commit()
    db.refresh(new_user)

    token = create_access_token(new_user.user_id, new_user.email)
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(new_user),
    )


@router.post("/signin", response_model=TokenResponse)
def signin(data: UserSigninRequest, db: Session = Depends(get_db)):
    """Authenticate with email and password."""
    email_clean = data.email.strip().lower()

    user = db.execute(select(User).where(User.email == email_clean)).scalar_one_or_none()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated. Please contact support.",
        )

    # Ensure profile and cart exist (defensive initialization)
    profile = db.execute(select(UserProfile).where(UserProfile.user_id == user.user_id)).scalar_one_or_none()
    if not profile:
        db.add(UserProfile(user_id=user.user_id))

    cart = db.execute(select(Cart).where(Cart.user_id == user.user_id)).scalar_one_or_none()
    if not cart:
        db.add(Cart(user_id=user.user_id))

    db.commit()

    token = create_access_token(user.user_id, user.email)
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@router.get("/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Retrieve authenticated user's account details."""
    return UserResponse.model_validate(current_user)
