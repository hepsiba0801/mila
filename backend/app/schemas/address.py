from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional

class AddressCreateRequest(BaseModel):
    recipient_name: str = Field(..., min_length=2, max_length=150)
    phone_number: str = Field(..., min_length=5, max_length=20)
    address_line1: str = Field(..., min_length=3, max_length=255)
    address_line2: Optional[str] = Field(None, max_length=255)
    city: str = Field(..., min_length=2, max_length=100)
    state: str = Field(..., min_length=2, max_length=100)
    postal_code: str = Field(..., min_length=3, max_length=20)
    country: str = Field(default="India", max_length=100)

class AddressUpdateRequest(BaseModel):
    recipient_name: Optional[str] = Field(None, min_length=2, max_length=150)
    phone_number: Optional[str] = Field(None, min_length=5, max_length=20)
    address_line1: Optional[str] = Field(None, min_length=3, max_length=255)
    address_line2: Optional[str] = Field(None, max_length=255)
    city: Optional[str] = Field(None, min_length=2, max_length=100)
    state: Optional[str] = Field(None, min_length=2, max_length=100)
    postal_code: Optional[str] = Field(None, min_length=3, max_length=20)
    country: Optional[str] = Field(None, max_length=100)

class AddressResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    address_id: int
    user_id: int
    recipient_name: str
    phone_number: str
    address_line1: str
    address_line2: Optional[str] = None
    city: str
    state: str
    postal_code: str
    country: str
    created_at: datetime
    updated_at: datetime
