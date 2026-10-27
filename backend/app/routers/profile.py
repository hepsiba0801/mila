from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.database import get_db
from app.models.user import User
from app.models.user_profile import UserProfile
from app.models.address import Address
from app.schemas.user import ProfileUpdateRequest, ProfileResponse
from app.schemas.address import AddressCreateRequest, AddressUpdateRequest, AddressResponse
from app.services.auth import get_current_user

router = APIRouter(
    tags=["User Profile & Addresses"],
)


# ==========================================
# USER PROFILE ENDPOINTS
# ==========================================

@router.get("/profile", response_model=ProfileResponse)
def get_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve profile details for the authenticated user."""
    profile = db.execute(
        select(UserProfile).where(UserProfile.user_id == current_user.user_id)
    ).scalar_one_or_none()

    return ProfileResponse(
        user_id=current_user.user_id,
        full_name=current_user.full_name,
        email=current_user.email,
        phone_number=profile.phone_number if profile else None,
        date_of_birth=profile.date_of_birth if profile else None,
        created_at=current_user.created_at,
        updated_at=profile.updated_at if profile else current_user.updated_at,
    )


@router.put("/profile", response_model=ProfileResponse)
def update_profile(
    data: ProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update profile fields for the authenticated user."""
    if data.full_name is not None and data.full_name.strip():
        current_user.full_name = data.full_name.strip()

    profile = db.execute(
        select(UserProfile).where(UserProfile.user_id == current_user.user_id)
    ).scalar_one_or_none()

    if not profile:
        profile = UserProfile(user_id=current_user.user_id)
        db.add(profile)

    if data.phone_number is not None:
        profile.phone_number = data.phone_number.strip()
    if data.date_of_birth is not None:
        profile.date_of_birth = data.date_of_birth

    db.commit()
    db.refresh(current_user)
    db.refresh(profile)

    return ProfileResponse(
        user_id=current_user.user_id,
        full_name=current_user.full_name,
        email=current_user.email,
        phone_number=profile.phone_number,
        date_of_birth=profile.date_of_birth,
        created_at=current_user.created_at,
        updated_at=profile.updated_at,
    )


# ==========================================
# ADDRESS ENDPOINTS
# ==========================================

@router.get("/addresses", response_model=AddressResponse)
def get_address(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get the saved delivery address for the authenticated user."""
    address = db.execute(
        select(Address).where(Address.user_id == current_user.user_id)
    ).scalar_one_or_none()

    if not address:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No saved delivery address found for this user.",
        )

    return address


@router.post("/addresses", response_model=AddressResponse, status_code=status.HTTP_201_CREATED)
def create_or_replace_address(
    data: AddressCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Save or update the delivery address for the authenticated user."""
    address = db.execute(
        select(Address).where(Address.user_id == current_user.user_id)
    ).scalar_one_or_none()

    if address:
        # Update existing address
        address.recipient_name = data.recipient_name.strip()
        address.phone_number = data.phone_number.strip()
        address.address_line1 = data.address_line1.strip()
        address.address_line2 = data.address_line2.strip() if data.address_line2 else None
        address.city = data.city.strip()
        address.state = data.state.strip()
        address.postal_code = data.postal_code.strip()
        address.country = data.country.strip()
    else:
        # Create new address
        address = Address(
            user_id=current_user.user_id,
            recipient_name=data.recipient_name.strip(),
            phone_number=data.phone_number.strip(),
            address_line1=data.address_line1.strip(),
            address_line2=data.address_line2.strip() if data.address_line2 else None,
            city=data.city.strip(),
            state=data.state.strip(),
            postal_code=data.postal_code.strip(),
            country=data.country.strip(),
        )
        db.add(address)

    db.commit()
    db.refresh(address)
    return address


@router.put("/addresses", response_model=AddressResponse)
def update_address(
    data: AddressUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Partially update saved address fields."""
    address = db.execute(
        select(Address).where(Address.user_id == current_user.user_id)
    ).scalar_one_or_none()

    if not address:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Address not found. Please create an address first.",
        )

    if data.recipient_name is not None:
        address.recipient_name = data.recipient_name.strip()
    if data.phone_number is not None:
        address.phone_number = data.phone_number.strip()
    if data.address_line1 is not None:
        address.address_line1 = data.address_line1.strip()
    if data.address_line2 is not None:
        address.address_line2 = data.address_line2.strip()
    if data.city is not None:
        address.city = data.city.strip()
    if data.state is not None:
        address.state = data.state.strip()
    if data.postal_code is not None:
        address.postal_code = data.postal_code.strip()
    if data.country is not None:
        address.country = data.country.strip()

    db.commit()
    db.refresh(address)
    return address


@router.delete("/addresses", status_code=status.HTTP_204_NO_CONTENT)
def delete_address(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete saved delivery address for the authenticated user."""
    address = db.execute(
        select(Address).where(Address.user_id == current_user.user_id)
    ).scalar_one_or_none()

    if address:
        db.delete(address)
        db.commit()
    return None
