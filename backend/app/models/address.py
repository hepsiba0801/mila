from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    ForeignKey,
)
from sqlalchemy.sql import func

from app.database import Base


class Address(Base):
    __tablename__ = "addresses"

    address_id = Column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    user_id = Column(
        Integer,
        ForeignKey("users.user_id"),
        unique=True,
        nullable=False,
    )

    recipient_name = Column(
        String(150),
        nullable=False,
    )

    phone_number = Column(
        String(20),
        nullable=False,
    )

    address_line1 = Column(
        String(255),
        nullable=False,
    )

    address_line2 = Column(
        String(255),
        nullable=True,
    )

    city = Column(
        String(100),
        nullable=False,
    )

    state = Column(
        String(100),
        nullable=False,
    )

    postal_code = Column(
        String(20),
        nullable=False,
    )

    country = Column(
        String(100),
        nullable=False,
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
