
from fastapi import FastAPI, HTTPException, Request
from fastapi import FastAPI, HTTPException, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel
import pandas as pd
import logging
import os
import time

from pipeline import load_bundle, predict_df


# ---------------------------------------------------------
# App configuration
# ---------------------------------------------------------

app = FastAPI(
    title="House Price Prediction API",
    description="House Price Prediction using Machine Learning",
    version="1.0.0",
)

# Tell FastAPI where our HTML files will be
templates = Jinja2Templates(directory="templates")
app.mount("/static", StaticFiles(directory="static"), name="static")

# ---------------------------------------------------------
# Logging
# ---------------------------------------------------------

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("house-price-api")


@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.perf_counter()

    response = await call_next(request)

    latency_ms = (time.perf_counter() - start) * 1000

    logger.info(
        "%s %s - %s - %.2f ms",
        request.method,
        request.url.path,
        response.status_code,
        latency_ms,
    )

    return response


# ---------------------------------------------------------
# Load ML model
# ---------------------------------------------------------

try:
    bundle = load_bundle()
    logger.info("Model loaded successfully.")

except Exception as e:
    bundle = None
    logger.exception("Failed to load model: %s", e)


# ---------------------------------------------------------
# Request schema
# ---------------------------------------------------------

class HouseFeatures(BaseModel):
    IncomeLevel: float
    PropertyAge: float
    TotalRooms: float
    TotalBedrooms: float
    NeighborhoodPop: float
    AvgOccupancy: float
    Latitude: float
    Longitude: float
    RoomsPerHousehold: float
    BedroomsRatio: float


# ---------------------------------------------------------
# Web UI
# ---------------------------------------------------------

@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    """
    Serve the interactive house price prediction UI.
    """

    return templates.TemplateResponse(
        "index.html",
        {
            "request": request
        }
    )


# ---------------------------------------------------------
# Health check
# ---------------------------------------------------------

@app.get("/health")
def health():
    return {
        "status": "ok",
        "model_loaded": bundle is not None
    }


# ---------------------------------------------------------
# Prediction API
# ---------------------------------------------------------

@app.post("/predict")
def predict(features: HouseFeatures):

    if bundle is None:
        raise HTTPException(
            status_code=503,
            detail="Model is not loaded."
        )

    try:

        # Convert request into DataFrame
        input_df = pd.DataFrame([features.model_dump()])

        # Run prediction through your existing pipeline
        prediction = predict_df(
            input_df,
            bundle
        )

        # Convert numpy/pandas value into normal Python float
        predicted_price = float(prediction[0])

        return {
            "prediction": predicted_price
        }

    except Exception as e:

        logger.exception("Prediction failed")

        raise HTTPException(
            status_code=500,
            detail=f"Prediction failed: {str(e)}"
        )