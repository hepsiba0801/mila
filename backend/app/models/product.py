from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Boolean,
    DateTime,
    Numeric,
    ForeignKey,
    CheckConstraint,
    text,
)
from sqlalchemy.sql import func

from app.database import Base


class Product(Base):
    __tablename__ = "products"

    __table_args__ = (
        CheckConstraint(
            "price >= 0",
            name="ck_products_price_nonnegative",
        ),
        CheckConstraint(
            "stock_quantity >= 0",
            name="ck_products_stock_nonnegative",
        ),
    )

    product_id = Column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    category_id = Column(
        Integer,
        ForeignKey("categories.category_id"),
        nullable=False,
    )

    name = Column(
        String(200),
        nullable=False,
    )

    slug = Column(
        String(220),
        unique=True,
        nullable=False,
    )

    description = Column(
        Text,
        nullable=True,
    )

    price = Column(
        Numeric(10, 2),
        nullable=False,
    )

    stock_quantity = Column(
        Integer,
        nullable=False,
        server_default=text("0"),
    )

    image_url = Column(
        String(500),
        nullable=True,
    )

    is_active = Column(
        Boolean,
        nullable=False,
        server_default=text("1"),
    )

    created_at = Column(
        DateTime,
        nullable=False,
        server_default=func.now(),
    )

    updated_at = Column(
        DateTime,
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )
