from pydantic import BaseModel, Field, ConfigDict
from datetime import date, datetime
from typing import Optional

class ProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=150)
    phone_number: Optional[str] = Field(None, max_length=20)
    date_of_birth: Optional[date] = None

class ProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: int
    full_name: str
    email: str
    phone_number: Optional[str] = None
    date_of_birth: Optional[date] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
