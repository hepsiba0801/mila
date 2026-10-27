from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Optional

class OrderItemCheckout(BaseModel):
    product_id: int
    quantity: int = Field(..., ge=1)

class CheckoutRequest(BaseModel):
    # Optional direct shipping details; if omitted, uses user's saved address
    recipient_name: Optional[str] = Field(None, min_length=2, max_length=150)
    phone_number: Optional[str] = Field(None, min_length=5, max_length=20)
    address_line1: Optional[str] = Field(None, min_length=3, max_length=255)
    address_line2: Optional[str] = Field(None, max_length=255)
    city: Optional[str] = Field(None, min_length=2, max_length=100)
    state: Optional[str] = Field(None, min_length=2, max_length=100)
    postal_code: Optional[str] = Field(None, min_length=3, max_length=20)
    country: Optional[str] = Field(default="India", max_length=100)
    # Optional items to checkout; if omitted, checks out user's active DB cart
    items: Optional[List[OrderItemCheckout]] = None

class OrderItemResponse(BaseModel):
    order_item_id: int
    product_id: int
    product_name: str
    quantity: int
    unit_price: float
    line_total: float
    image_url: Optional[str] = None

class OrderResponse(BaseModel):
    order_id: int
    user_id: int
    total_amount: float
    order_status: str
    recipient_name: str
    phone_number: str
    address_line1: str
    address_line2: Optional[str] = None
    city: str
    state: str
    postal_code: str
    country: str
    items: List[OrderItemResponse] = []
    created_at: datetime
