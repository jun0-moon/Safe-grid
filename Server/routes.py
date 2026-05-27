from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.responses import JSONResponse, Response, FileResponse
import os

from models import UserLocation
from services.risk_handler import evaluate_location_risk
from services.weather import fetch_daegu_weather_forecast
from services.skt import get_place_congestion, get_pois_list
from settings import AppSettings, get_settings

router = APIRouter()


@router.post("/api/v1/location")
async def update_location(data: UserLocation):
    return evaluate_location_risk(data)


@router.get("/api/v1/weather/daegu")
async def get_daegu_weather(settings: AppSettings = Depends(get_settings)):
    """Return Daegu weather via KMA. If fetching fails, return a safe fallback with 'fetched': False."""
    try:
        return await fetch_daegu_weather_forecast(settings)
    except HTTPException:
        # Safe fallback for frontend when KMA fails
        return {
            "weather_risk": 0.0,
            "summary": {
                "forecast_time": "",
                "sky": "unknown",
                "precipitation": "unknown",
                "temperature_celsius": None,
                "humidity_percent": None,
                "wind_speed_mps": None,
            },
            "forecast": [],
            "region": "Daegu",
            "grid": {"nx": settings.daegu_nx, "ny": settings.daegu_ny},
            "base_date": "",
            "base_time": "",
            "fetched": False,
        }
    except Exception:
        return {
            "weather_risk": 0.0,
            "summary": {
                "forecast_time": "",
                "sky": "unknown",
                "precipitation": "unknown",
                "temperature_celsius": None,
                "humidity_percent": None,
                "wind_speed_mps": None,
            },
            "forecast": [],
            "region": "Daegu",
            "grid": {"nx": settings.daegu_nx, "ny": settings.daegu_ny},
            "base_date": "",
            "base_time": "",
            "fetched": False,
        }


@router.get("/api/v1/risk-map")
async def get_risk_map():
    return {"grid_data": []}


@router.get("/api/v1/pois")
async def list_available_pois(
    offset: int = Query(0),
    limit: int = Query(100),
    settings: AppSettings = Depends(get_settings),
):
    return await get_pois_list(settings, offset=offset, limit=limit)


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
