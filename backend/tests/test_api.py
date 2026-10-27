import pytest
from decimal import Decimal
from fastapi.testclient import TestClient
from sqlalchemy import select, text

from app.main import app
from app.database import get_db, SessionLocal
from app.models.user import User
from app.models.product import Product
from app.models.cart import Cart
from app.models.cart_item import CartItem
from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.address import Address
from app.models.user_profile import UserProfile

client = TestClient(app)

# Test User Data
TEST_EMAIL_1 = "test_customer1@mila-cosmetics.com"
TEST_EMAIL_2 = "test_customer2@mila-cosmetics.com"
TEST_PASSWORD = "SecretPassword123!"


@pytest.fixture(scope="session", autouse=True)
def cleanup_test_data():
    """Clean up test users before and after test session without touching seed data."""
    def remove_users():
        db = SessionLocal()
        try:
            users = db.execute(
                select(User).where(User.email.in_([TEST_EMAIL_1, TEST_EMAIL_2]))
            ).scalars().all()
            for u in users:
                # Remove associated order items and orders
                orders = db.execute(select(Order).where(Order.user_id == u.user_id)).scalars().all()
                for o in orders:
                    db.execute(text(f"DELETE FROM order_items WHERE order_id = {o.order_id}"))
                    db.delete(o)
                # Remove cart items and cart
                cart = db.execute(select(Cart).where(Cart.user_id == u.user_id)).scalar_one_or_none()
                if cart:
                    db.execute(text(f"DELETE FROM cart_items WHERE cart_id = {cart.cart_id}"))
                    db.delete(cart)
                # Remove address and profile
                db.execute(text(f"DELETE FROM addresses WHERE user_id = {u.user_id}"))
                db.execute(text(f"DELETE FROM user_profiles WHERE user_id = {u.user_id}"))
                db.delete(u)
            db.commit()
        finally:
            db.close()

    remove_users()
    yield
    remove_users()


# ==========================================
# 1. DATABASE & PRODUCTS ENDPOINTS TESTS
# ==========================================

def test_database_health():
    response = client.get("/health/db")
    assert response.status_code == 200
    data = response.json()
    assert data["database"] == "connected"
    assert data["database_name"] == "mila_db"


def test_get_all_products():
    response = client.get("/products/")
    assert response.status_code == 200
    products = response.json()
    assert len(products) >= 18
    # Validate fields on first product
    prod = products[0]
    assert "product_id" in prod
    assert "name" in prod
    assert "price" in prod
    assert "stock_quantity" in prod
    assert "category" in prod
    assert "image_url" in prod


def test_get_products_by_category():
    response = client.get("/products/?category=makeup")
    assert response.status_code == 200
    products = response.json()
    assert len(products) == 3
    for p in products:
        assert p["category"].lower() == "makeup"


def test_get_product_by_numeric_id():
    response = client.get("/products/1")
    assert response.status_code == 200
    product = response.json()
    assert product["product_id"] == 1
    assert product["name"] == "Huda Beauty Medium Nude"
    assert product["price"] == 2499.0


def test_get_product_invalid_id():
    response = client.get("/products/99999")
    assert response.status_code == 404
    assert response.json()["detail"] == "Product not found"


# ==========================================
# 2. AUTHENTICATION TESTS
# ==========================================

def test_user_signup_and_duplicate():
    # 1. Successful Signup
    response = client.post(
        "/auth/signup",
        json={
            "full_name": "Test Customer One",
            "email": TEST_EMAIL_1,
            "password": TEST_PASSWORD,
            "terms_accepted": True,
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == TEST_EMAIL_1
    assert data["user"]["full_name"] == "Test Customer One"

    # 2. Duplicate Email Registration
    dup_response = client.post(
        "/auth/signup",
        json={
            "full_name": "Duplicate User",
            "email": TEST_EMAIL_1,
            "password": TEST_PASSWORD,
            "terms_accepted": True,
        },
    )
    assert dup_response.status_code == 400
    assert "already exists" in dup_response.json()["detail"]


def test_user_signin():
    # Invalid credentials
    bad_login = client.post(
        "/auth/signin",
        json={"email": TEST_EMAIL_1, "password": "WrongPassword!"},
    )
    assert bad_login.status_code == 401

    # Valid credentials
    good_login = client.post(
        "/auth/signin",
        json={"email": TEST_EMAIL_1, "password": TEST_PASSWORD},
    )
    assert good_login.status_code == 200
    data = good_login.json()
    assert "access_token" in data
    assert data["user"]["email"] == TEST_EMAIL_1


def test_auth_me_protected():
    # Without token
    anon_resp = client.get("/auth/me")
    assert anon_resp.status_code == 401

    # With valid token
    login_resp = client.post(
        "/auth/signin",
        json={"email": TEST_EMAIL_1, "password": TEST_PASSWORD},
    )
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    me_resp = client.get("/auth/me", headers=headers)
    assert me_resp.status_code == 200
    assert me_resp.json()["email"] == TEST_EMAIL_1


# ==========================================
# 3. PROFILE & ADDRESS MANAGEMENT TESTS
# ==========================================

def test_profile_and_address_crud():
    login_resp = client.post(
        "/auth/signin",
        json={"email": TEST_EMAIL_1, "password": TEST_PASSWORD},
    )
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Profile view
    prof_resp = client.get("/profile", headers=headers)
    assert prof_resp.status_code == 200
    assert prof_resp.json()["email"] == TEST_EMAIL_1

    # Profile update
    prof_update = client.put(
        "/profile",
        headers=headers,
        json={"full_name": "Updated Name", "phone_number": "9876543210"},
    )
    assert prof_update.status_code == 200
    assert prof_update.json()["full_name"] == "Updated Name"
    assert prof_update.json()["phone_number"] == "9876543210"

    # Address initial get (404 expected before created)
    addr_none = client.get("/addresses", headers=headers)
    assert addr_none.status_code == 404

    # Create address
    addr_create = client.post(
        "/addresses",
        headers=headers,
        json={
            "recipient_name": "Updated Name",
            "phone_number": "9876543210",
            "address_line1": "123 Lavender Lane",
            "address_line2": "Apt 4B",
            "city": "Coimbatore",
            "state": "Tamil Nadu",
            "postal_code": "641001",
            "country": "India",
        },
    )
    assert addr_create.status_code == 201
    assert addr_create.json()["city"] == "Coimbatore"

    # Fetch saved address
    addr_fetch = client.get("/addresses", headers=headers)
    assert addr_fetch.status_code == 200
    assert addr_fetch.json()["address_line1"] == "123 Lavender Lane"


# ==========================================
# 4. PERSISTENT CART TESTS
# ==========================================

def test_cart_operations():
    login_resp = client.post(
        "/auth/signin",
        json={"email": TEST_EMAIL_1, "password": TEST_PASSWORD},
    )
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Initial cart
    cart_resp = client.get("/cart", headers=headers)
    assert cart_resp.status_code == 200
    assert cart_resp.json()["total_items"] == 0

    # Add item to cart
    add_resp = client.post(
        "/cart/items",
        headers=headers,
        json={"product_id": 1, "quantity": 2},
    )
    assert add_resp.status_code == 200
    cart_data = add_resp.json()
    assert cart_data["total_items"] == 2
    assert len(cart_data["items"]) == 1
    assert cart_data["items"][0]["product_id"] == 1
    assert cart_data["items"][0]["quantity"] == 2

    # Update item quantity
    put_resp = client.put(
        "/cart/items/1",
        headers=headers,
        json={"quantity": 3},
    )
    assert put_resp.status_code == 200
    assert put_resp.json()["items"][0]["quantity"] == 3

    # Sync guest cart from localStorage
    sync_resp = client.post(
        "/cart/sync",
        headers=headers,
        json={"items": [{"id": 2, "quantity": 1}]},
    )
    assert sync_resp.status_code == 200
    assert len(sync_resp.json()["items"]) == 2

    # Remove item 2
    del_resp = client.delete("/cart/items/2", headers=headers)
    assert del_resp.status_code == 200
    assert len(del_resp.json()["items"]) == 1


# ==========================================
# 5. CHECKOUT AND ORDERS TESTS
# ==========================================

def test_checkout_and_order_isolation():
    # User 1 sign in
    login1 = client.post(
        "/auth/signin",
        json={"email": TEST_EMAIL_1, "password": TEST_PASSWORD},
    )
    token1 = login1.json()["access_token"]
    headers1 = {"Authorization": f"Bearer {token1}"}

    # Get product 1 stock before checkout
    prod1_before = client.get("/products/1").json()["stock_quantity"]

    # Place order for product 1 (quantity 2) using saved address
    checkout_resp = client.post(
        "/orders",
        headers=headers1,
        json={},  # Checks out existing DB cart (which has product 1, qty 3 from previous test, let's specify items=[{"product_id": 1, "quantity": 2}])
    )
    assert checkout_resp.status_code == 201
    order = checkout_resp.json()
    assert order["order_id"] > 0
    assert order["order_status"] == "confirmed"
    assert len(order["items"]) == 1
    assert order["items"][0]["quantity"] == 3
    order_id = order["order_id"]

    # Verify inventory was decremented in database
    prod1_after = client.get("/products/1").json()["stock_quantity"]
    assert prod1_after == prod1_before - 3

    # Verify cart was cleared
    cart_after = client.get("/cart", headers=headers1).json()
    assert cart_after["total_items"] == 0

    # User 1 can fetch their order
    user1_order = client.get(f"/orders/{order_id}", headers=headers1)
    assert user1_order.status_code == 200

    # User 2 signup
    client.post(
        "/auth/signup",
        json={
            "full_name": "Test Customer Two",
            "email": TEST_EMAIL_2,
            "password": TEST_PASSWORD,
            "terms_accepted": True,
        },
    )
    login2 = client.post(
        "/auth/signin",
        json={"email": TEST_EMAIL_2, "password": TEST_PASSWORD},
    )
    token2 = login2.json()["access_token"]
    headers2 = {"Authorization": f"Bearer {token2}"}

    # User 2 cannot access User 1's order (Broken Access Control prevention)
    unauth_order = client.get(f"/orders/{order_id}", headers=headers2)
    assert unauth_order.status_code == 403
    assert "not authorized" in unauth_order.json()["detail"]

    # Restore stock for product 1 for clean catalog
    db = SessionLocal()
    try:
        p1 = db.execute(select(Product).where(Product.product_id == 1)).scalar_one()
        p1.stock_quantity = 50
        db.commit()
    finally:
        db.close()
