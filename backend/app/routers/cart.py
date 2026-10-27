from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.database import get_db
from app.models.user import User
from app.models.product import Product
from app.models.category import Category
from app.models.cart import Cart
from app.models.cart_item import CartItem
from app.schemas.cart import (
    CartItemAddRequest,
    CartItemUpdateRequest,
    CartItemResponse,
    CartResponse,
    CartSyncRequest,
)
from app.services.auth import get_current_user

router = APIRouter(
    prefix="/cart",
    tags=["Persistent Shopping Cart"],
)


def _get_or_create_user_cart(user_id: int, db: Session) -> Cart:
    cart = db.execute(select(Cart).where(Cart.user_id == user_id)).scalar_one_or_none()
    if not cart:
        cart = Cart(user_id=user_id)
        db.add(cart)
        db.commit()
        db.refresh(cart)
    return cart


def _build_cart_response(cart: Cart, db: Session) -> CartResponse:
    # Join CartItem with Product and Category
    statement = (
        select(CartItem, Product, Category.name.label("category_name"))
        .join(Product, CartItem.product_id == Product.product_id)
        .join(Category, Product.category_id == Category.category_id)
        .where(CartItem.cart_id == cart.cart_id)
        .order_by(CartItem.added_at.asc())
    )
    rows = db.execute(statement).all()

    item_responses = []
    total_amount = 0.0
    total_items = 0

    for cart_item, product, category_name in rows:
        unit_price = float(product.price)
        subtotal = unit_price * cart_item.quantity
        total_amount += subtotal
        total_items += cart_item.quantity

        item_responses.append(
            CartItemResponse(
                cart_item_id=cart_item.cart_item_id,
                cart_id=cart_item.cart_id,
                product_id=cart_item.product_id,
                quantity=cart_item.quantity,
                product_name=product.name,
                category=category_name,
                price=unit_price,
                stock_quantity=product.stock_quantity,
                image_url=product.image_url,
                subtotal=subtotal,
                added_at=cart_item.added_at,
            )
        )

    return CartResponse(
        cart_id=cart.cart_id,
        user_id=cart.user_id,
        items=item_responses,
        total_items=total_items,
        total_amount=round(total_amount, 2),
    )


@router.get("", response_model=CartResponse)
@router.get("/", response_model=CartResponse)
def get_user_cart(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve the persistent database cart for the current user."""
    cart = _get_or_create_user_cart(current_user.user_id, db)
    return _build_cart_response(cart, db)


@router.post("/items", response_model=CartResponse)
def add_item_to_cart(
    data: CartItemAddRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Add a product or increment quantity in the user's database cart."""
    if data.quantity <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Quantity must be greater than zero.",
        )

    product = db.execute(
        select(Product).where(Product.product_id == data.product_id, Product.is_active.is_(True))
    ).scalar_one_or_none()

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found or is no longer available.",
        )

    if product.stock_quantity <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Sorry, '{product.name}' is currently out of stock.",
        )

    cart = _get_or_create_user_cart(current_user.user_id, db)

    # Check if item already in cart
    existing_item = db.execute(
        select(CartItem).where(
            CartItem.cart_id == cart.cart_id,
            CartItem.product_id == product.product_id,
        )
    ).scalar_one_or_none()

    if existing_item:
        new_quantity = existing_item.quantity + data.quantity
        if new_quantity > product.stock_quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot add {data.quantity} more. Only {product.stock_quantity} available in stock (you already have {existing_item.quantity} in cart).",
            )
        existing_item.quantity = new_quantity
    else:
        if data.quantity > product.stock_quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Requested quantity ({data.quantity}) exceeds available stock ({product.stock_quantity}).",
            )
        new_item = CartItem(
            cart_id=cart.cart_id,
            product_id=product.product_id,
            quantity=data.quantity,
        )
        db.add(new_item)

    db.commit()
    return _build_cart_response(cart, db)


@router.put("/items/{product_id}", response_model=CartResponse)
def update_cart_item(
    product_id: int,
    data: CartItemUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Set the quantity for a product in the user's cart."""
    if data.quantity <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Quantity must be greater than zero. To remove, use DELETE.",
        )

    cart = _get_or_create_user_cart(current_user.user_id, db)

    item = db.execute(
        select(CartItem).where(
            CartItem.cart_id == cart.cart_id,
            CartItem.product_id == product_id,
        )
    ).scalar_one_or_none()

    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found in your cart.",
        )

    product = db.execute(select(Product).where(Product.product_id == product_id)).scalar_one_or_none()
    if not product or not product.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product no longer available.",
        )

    if data.quantity > product.stock_quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot set quantity to {data.quantity}. Only {product.stock_quantity} in stock.",
        )

    item.quantity = data.quantity
    db.commit()
    return _build_cart_response(cart, db)


@router.delete("/items/{product_id}", response_model=CartResponse)
def remove_cart_item(
    product_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Remove a product from the user's cart."""
    cart = _get_or_create_user_cart(current_user.user_id, db)

    item = db.execute(
        select(CartItem).where(
            CartItem.cart_id == cart.cart_id,
            CartItem.product_id == product_id,
        )
    ).scalar_one_or_none()

    if item:
        db.delete(item)
        db.commit()

    return _build_cart_response(cart, db)


@router.post("/sync", response_model=CartResponse)
def sync_cart(
    data: CartSyncRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Synchronize browser localStorage cart items with persistent database cart upon login."""
    cart = _get_or_create_user_cart(current_user.user_id, db)

    for sync_item in data.items:
        if sync_item.quantity <= 0:
            continue

        product = db.execute(
            select(Product).where(Product.product_id == sync_item.id, Product.is_active.is_(True))
        ).scalar_one_or_none()

        if not product or product.stock_quantity <= 0:
            continue

        existing_item = db.execute(
            select(CartItem).where(
                CartItem.cart_id == cart.cart_id,
                CartItem.product_id == sync_item.id,
            )
        ).scalar_one_or_none()

        capped_qty = min(sync_item.quantity, product.stock_quantity)

        if existing_item:
            # Take the max of existing quantity and synced quantity, capped by available stock
            existing_item.quantity = min(product.stock_quantity, max(existing_item.quantity, capped_qty))
        else:
            db.add(CartItem(
                cart_id=cart.cart_id,
                product_id=product.product_id,
                quantity=capped_qty,
            ))

    db.commit()
    return _build_cart_response(cart, db)


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
@router.delete("/", status_code=status.HTTP_204_NO_CONTENT)
def clear_cart(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Remove all items from the current user's cart."""
    cart = _get_or_create_user_cart(current_user.user_id, db)
    items = db.execute(select(CartItem).where(CartItem.cart_id == cart.cart_id)).scalars().all()
    for item in items:
        db.delete(item)
    db.commit()
    return None
