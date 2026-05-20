from models import UserLocation
from risk_engine import calculate_risk
from settings import AppSettings
from services.weather import fetch_daegu_weather_forecast
from services.skt import get_nearest_poi_id, get_place_congestion, estimate_density_from_congestion


async def evaluate_location_risk(data: UserLocation, settings: AppSettings) -> dict:
    weather_risk = data.weather
    weather_summary = None
    congestion_summary = None

    if weather_risk is None:
        weather_data = await fetch_daegu_weather_forecast(settings)
        weather_risk = weather_data.get("weather_risk")
        weather_summary = weather_data.get("summary")

    if data.d_skt is None:
        nearest_poi_id = await get_nearest_poi_id(settings, data.latitude, data.longitude)
        if nearest_poi_id:
            congestion_data = await get_place_congestion(
                settings, nearest_poi_id, lat=data.latitude, lng=data.longitude
            )
            estimated_density = estimate_density_from_congestion(congestion_data.get("congestion_data", []))
            data.d_skt = estimated_density
            congestion_summary = congestion_data

    risk_score = calculate_risk(
        d_skt=data.d_skt,
        slope=data.slope,
        weather=weather_risk,
    )

    is_red_zone = risk_score >= 0.7
    result = {
        "status": "success",
        "risk_score": round(risk_score, 5),
        "is_red_zone": is_red_zone,
        "location": {
            "latitude": data.latitude,
            "longitude": data.longitude,
        },
        "estimated_values": {
            "d_skt": data.d_skt,
            "slope": data.slope,
            "weather": weather_risk,
        },
    }
    if weather_summary is not None:
        result["weather"] = weather_summary
    if congestion_summary is not None:
        result["congestion"] = congestion_summary
    return result
