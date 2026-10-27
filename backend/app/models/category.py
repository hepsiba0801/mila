from sqlalchemy import Column, Integer, String, Boolean, DateTime, text
from sqlalchemy.sql import func

from app.database import Base


class Category(Base):
    __tablename__ = "categories"

    category_id = Column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    name = Column(
        String(100),
        unique=True,
        nullable=False,
    )

    slug = Column(
        String(120),
        unique=True,
        nullable=False,
    )

    description = Column(
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
