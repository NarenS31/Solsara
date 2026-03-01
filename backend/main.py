# backend/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .db import supabase
from .routers.auth import router as auth_router
from .routers.webhooks import router as webhooks_router
from .routers.checkout import router as checkout_router  # added
from .routers.demo import router as demo_router
from .scheduler import start_scheduler
from .config import settings

app = FastAPI()

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth_router)
app.include_router(webhooks_router)
app.include_router(checkout_router)  # new
app.include_router(demo_router)

# Background scheduler


@app.on_event("startup")
async def startup_event():
    start_scheduler()

# Health check


@app.get("/health")
def health_check():
    result = supabase.table("businesses").select("*").execute()
    return {"status": "ok", "db_connected": True}

# Root endpoint


@app.get("/")
def root():
    return {"message": "FastAPI server running"}

# Payment result endpoints


@app.get("/success")
def success():
    return {"message": "Payment succeeded"}


@app.get("/cancel")
def cancel():
    return {"message": "Payment canceled"}

# Test poll endpoint


@app.get("/test/poll")
def test_poll():
    from .services.poller import poll_all_businesses
    import traceback

    try:
        result = poll_all_businesses()
        return {"message": "Poll complete", "result": result}
    except Exception as e:
        tb = traceback.format_exc()
        print(tb)  # prints full error to console
        return {"error": str(e), "trace": tb}

# Ping endpoint


@app.get("/ping")
async def ping():
    return {"status": "ok"}
