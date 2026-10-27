from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.database import Base, engine
from app import models
from app.routers.products import router as products_router
from app.routers.auth import router as auth_router
from app.routers.profile import router as profile_router
from app.routers.cart import router as cart_router
from app.routers.orders import router as orders_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield

app = FastAPI(
    title="Mila API",
    description="Backend API for the Mila cosmetics store",
    version="1.0.0",
    lifespan=lifespan,
)

# Development origins for frontend integration
ALLOWED_ORIGINS = [
    "http://127.0.0.1:5500",
    "http://localhost:5500",
    "http://127.0.0.1:8000",
    "http://localhost:8000",
    "http://127.0.0.1:3000",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

app.include_router(products_router)
app.include_router(auth_router)
app.include_router(profile_router)
app.include_router(cart_router)
app.include_router(orders_router)


@app.get("/")
def home():
    return {
        "message": "Welcome to Mila API!",
        "status": "running",
    }


@app.get("/health/db")
def database_health():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))

        return {
            "database": "connected",
            "database_name": "mila_db",
        }

    except SQLAlchemyError:
        return {
            "database": "disconnected",
            "message": "Unable to connect to MySQL.",
        }
