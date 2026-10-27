from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Optional

class CartItemAddRequest(BaseModel):
    product_id: int
    quantity: int = Field(default=1, ge=1)

class CartItemUpdateRequest(BaseModel):
    quantity: int = Field(..., ge=1)

class CartItemResponse(BaseModel):
    cart_item_id: int
    cart_id: int
    product_id: int
    quantity: int
    product_name: str
    category: str
    price: float
    stock_quantity: int
    image_url: Optional[str] = None
    subtotal: float
    added_at: datetime

class CartResponse(BaseModel):
    cart_id: int
    user_id: int
    items: List[CartItemResponse] = []
    total_items: int
    total_amount: float

class CartSyncItem(BaseModel):
    id: int
    quantity: int = Field(default=1, ge=1)

class CartSyncRequest(BaseModel):
    items: List[CartSyncItem] = []
