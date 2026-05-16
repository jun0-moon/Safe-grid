from models import UserLocation
from risk_engine import calculate_risk


def evaluate_location_risk(data: UserLocation) -> dict:
    risk_score = calculate_risk(
        d_skt=data.d_skt,
        vector=data.direction,
        slope=data.slope,
        weather=data.weather,
    )

    is_red_zone = risk_score >= 0.7

    return {"status": "success", "risk_score": round(risk_score, 5), "is_red_zone": is_red_zone}
