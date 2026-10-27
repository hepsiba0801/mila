from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.database import get_db
from app.models.user import User
from app.models.address import Address
from app.models.product import Product
from app.models.cart import Cart
from app.models.cart_item import CartItem
from app.models.order import Order
from app.models.order_item import OrderItem
from app.schemas.order import CheckoutRequest, OrderResponse, OrderItemResponse
from app.services.auth import get_current_user

router = APIRouter(
    prefix="/orders",
    tags=["Checkout & Orders"],
)


def _build_order_response(order: Order, db: Session) -> OrderResponse:
    statement = (
        select(OrderItem, Product)
        .join(Product, OrderItem.product_id == Product.product_id)
        .where(OrderItem.order_id == order.order_id)
    )
    items_rows = db.execute(statement).all()

    item_responses = []
    for item, product in items_rows:
        unit_price = float(item.unit_price)
        item_responses.append(
            OrderItemResponse(
                order_item_id=item.order_item_id,
                product_id=item.product_id,
                product_name=product.name,
                quantity=item.quantity,
                unit_price=unit_price,
                line_total=round(unit_price * item.quantity, 2),
                image_url=product.image_url,
            )
        )

    return OrderResponse(
        order_id=order.order_id,
        user_id=order.user_id,
        total_amount=float(order.total_amount),
        order_status=order.order_status,
        recipient_name=order.recipient_name,
        phone_number=order.phone_number,
        address_line1=order.address_line1,
        address_line2=order.address_line2,
        city=order.city,
        state=order.state,
        postal_code=order.postal_code,
        country=order.country,
        items=item_responses,
        created_at=order.created_at,
    )


@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def checkout(
    data: CheckoutRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Checkout and place order transactionally:
    1. Validates and snapshots shipping address.
    2. Identifies checkout items (either provided or from user's DB cart).
    3. Acquires row locks (`with_for_update`) to prevent stock overselling.
    4. Computes total server-side using authoritative database prices.
    5. Deducts inventory.
    6. Creates Order and OrderItem records atomically.
    7. Clears user's cart.
    """
    # 1. Resolve Shipping Address
    recipient_name = data.recipient_name
    phone_number = data.phone_number
    address_line1 = data.address_line1
    address_line2 = data.address_line2
    city = data.city
    state = data.state
    postal_code = data.postal_code
    country = data.country or "India"

    # If any required address field is missing, check user's saved address
    if not (recipient_name and phone_number and address_line1 and city and state and postal_code):
        saved_address = db.execute(
            select(Address).where(Address.user_id == current_user.user_id)
        ).scalar_one_or_none()

        if not saved_address:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Delivery address is required. Please provide shipping details or save an address in your profile.",
            )
        recipient_name = recipient_name or saved_address.recipient_name
        phone_number = phone_number or saved_address.phone_number
        address_line1 = address_line1 or saved_address.address_line1
        address_line2 = address_line2 if address_line2 is not None else saved_address.address_line2
        city = city or saved_address.city
        state = state or saved_address.state
        postal_code = postal_code or saved_address.postal_code
        country = country or saved_address.country

    # 2. Gather checkout items
    items_to_process = []
    user_cart = db.execute(select(Cart).where(Cart.user_id == current_user.user_id)).scalar_one_or_none()

    if data.items and len(data.items) > 0:
        # Checkout specific items sent by client
        items_to_process = [(item.product_id, item.quantity) for item in data.items if item.quantity > 0]
    else:
        # Checkout items currently in DB cart
        if user_cart:
            cart_items = db.execute(
                select(CartItem).where(CartItem.cart_id == user_cart.cart_id)
            ).scalars().all()
            items_to_process = [(item.product_id, item.quantity) for item in cart_items if item.quantity > 0]

    if not items_to_process:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Your cart is empty. Please add items before placing an order.",
        )

    # 3. Transactional inventory lock, price calculation & order item staging
    calculated_total = Decimal("0.00")
    order_items_to_create = []

    # Sort product IDs to prevent deadlocks when locking multiple rows
    sorted_items = sorted(items_to_process, key=lambda x: x[0])

    try:
        for product_id, quantity in sorted_items:
            if quantity <= 0:
                continue

            # Lock product row for update
            product = db.execute(
                select(Product)
                .where(Product.product_id == product_id, Product.is_active.is_(True))
                .with_for_update()
            ).scalar_one_or_none()

            if not product:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Product #{product_id} is no longer available.",
                )

            if product.stock_quantity < quantity:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Insufficient stock for '{product.name}'. Requested {quantity}, but only {product.stock_quantity} remaining.",
                )

            # Deduct inventory safely
            product.stock_quantity -= quantity

            # Server-calculated line total
            line_cost = product.price * quantity
            calculated_total += line_cost

            order_items_to_create.append({
                "product_id": product.product_id,
                "quantity": quantity,
                "unit_price": product.price,
            })

        # 4. Create Order record
        new_order = Order(
            user_id=current_user.user_id,
            total_amount=calculated_total,
            order_status="confirmed",
            recipient_name=recipient_name.strip(),
            phone_number=phone_number.strip(),
            address_line1=address_line1.strip(),
            address_line2=address_line2.strip() if address_line2 else None,
            city=city.strip(),
            state=state.strip(),
            postal_code=postal_code.strip(),
            country=country.strip(),
        )
        db.add(new_order)
        db.flush()  # Populates new_order.order_id

        # 5. Create OrderItem records
        for item_data in order_items_to_create:
            oi = OrderItem(
                order_id=new_order.order_id,
                product_id=item_data["product_id"],
                quantity=item_data["quantity"],
                unit_price=item_data["unit_price"],
            )
            db.add(oi)

        # 6. Clear user's DB cart items
        if user_cart:
            existing_cart_items = db.execute(
                select(CartItem).where(CartItem.cart_id == user_cart.cart_id)
            ).scalars().all()
            for ci in existing_cart_items:
                db.delete(ci)

        # Commit all changes in a single atomic transaction
        db.commit()
        db.refresh(new_order)

        return _build_order_response(new_order, db)

    except HTTPException:
        db.rollback()
        raise
    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while processing your order. No charges or stock changes were made.",
        ) from exc


@router.get("", response_model=list[OrderResponse])
@router.get("/", response_model=list[OrderResponse])
def get_user_orders(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve all past orders placed by the authenticated user."""
    orders = db.execute(
        select(Order)
        .where(Order.user_id == current_user.user_id)
        .order_by(Order.created_at.desc())
    ).scalars().all()

    return [_build_order_response(order, db) for order in orders]


@router.get("/{order_id}", response_model=OrderResponse)
def get_order_by_id(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve specific order details, verifying ownership."""
    order = db.execute(
        select(Order).where(Order.order_id == order_id)
    ).scalar_one_or_none()

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found.",
        )

    # Restrict access to order owner
    if order.user_id != current_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to view this order.",
        )

    return _build_order_response(order, db)
