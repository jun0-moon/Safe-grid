from fastapi import APIRouter, Depends, Query
from fastapi.responses import JSONResponse, Response, FileResponse
import os

from models import UserLocation
from services.risk_handler import evaluate_location_risk
from services.weather import fetch_daegu_weather_forecast
from services.skt import get_place_congestion
from settings import AppSettings, get_settings

router = APIRouter()


@router.post("/api/v1/location")
async def update_location(data: UserLocation):
    return evaluate_location_risk(data)


@router.get("/api/v1/weather/daegu")
async def get_daegu_weather(settings: AppSettings = Depends(get_settings)):
    return await fetch_daegu_weather_forecast(settings)


@router.get("/api/v1/risk-map")
async def get_risk_map():
    return {"grid_data": []}


@router.get("/api/v1/congestion/{poi_id}")
async def get_place_congestion_route(
    poi_id: str,
    lat: float | None = Query(None),
    lng: float | None = Query(None),
    settings: AppSettings = Depends(get_settings),
):
    return await get_place_congestion(settings, poi_id, lat=lat, lng=lng)


@router.get("/favicon.ico", include_in_schema=False)
async def favicon():
    return Response(status_code=204)


@router.get("/")
async def root():
    static_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "test_web")
    index_file = os.path.join(static_dir, "index.html")
    if os.path.isfile(index_file):
        return FileResponse(index_file)
    return JSONResponse({"message": "Safe-Grid API server is running."})
