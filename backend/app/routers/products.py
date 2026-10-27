from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.database import get_db
from app.models.product import Product
from app.models.category import Category

router = APIRouter(
    prefix="/products",
    tags=["Products"],
)


@router.get("", include_in_schema=False)
@router.get("/")
def get_products(
    category: str | None = Query(default=None),
    db: Session = Depends(get_db),
):
    statement = (
        select(Product, Category.name.label("category_name"))
        .join(Category, Product.category_id == Category.category_id)
        .where(Product.is_active.is_(True))
    )

    if category:
        statement = statement.where(Category.slug == category.lower())

    results = db.execute(statement).all()

    return [
        {
            "product_id": product.product_id,
            "name": product.name,
            "slug": product.slug,
            "description": product.description,
            "price": float(product.price),
            "stock_quantity": product.stock_quantity,
            "image_url": product.image_url,
            "category": category_name,
        }
        for product, category_name in results
    ]


@router.get("/{product_id}")
def get_product(
    product_id: int,
    db: Session = Depends(get_db),
):
    statement = (
        select(Product, Category.name.label("category_name"))
        .join(Category, Product.category_id == Category.category_id)
        .where(
            Product.product_id == product_id,
            Product.is_active.is_(True),
        )
    )

    result = db.execute(statement).first()

    if result is None:
        raise HTTPException(
            status_code=404,
            detail="Product not found",
        )

    product, category_name = result

    return {
        "product_id": product.product_id,
        "name": product.name,
        "slug": product.slug,
        "description": product.description,
        "price": float(product.price),
        "stock_quantity": product.stock_quantity,
        "image_url": product.image_url,
        "category": category_name,
    }
