from datetime import datetime, timedelta
from typing import Optional

import httpx

from fastapi import HTTPException

from settings import AppSettings


def get_kma_base_datetime(settings: AppSettings, now: Optional[datetime] = None) -> tuple[str, str]:
    current = now or datetime.now(settings.kst)
    publish_hours = [2, 5, 8, 11, 14, 17, 20, 23]

    if current.hour < 2:
        base_date = (current - timedelta(days=1)).strftime("%Y%m%d")
        return base_date, "2300"

    base_hour = max(hour for hour in publish_hours if hour <= current.hour)
    return current.strftime("%Y%m%d"), f"{base_hour:02d}00"


def parse_weather_risk_and_summary(items: list[dict]) -> dict:
    forecast_by_time: dict[str, dict[str, str]] = {}
    for item in items:
        forecast_time = item.get("fcstTime")
        category = item.get("category")
        value = item.get("fcstValue")
        if not forecast_time or not category:
            continue
        forecast_by_time.setdefault(forecast_time, {})[category] = value

    if not forecast_by_time:
        return {"weather_risk": 0.0, "summary": {}, "forecast": []}

    selected_time = sorted(forecast_by_time.keys())[0]
    selected = forecast_by_time[selected_time]

    sky_label_map = {"1": "맑음", "3": "구름많음", "4": "흐림"}
    pty_label_map = {
        "0": "없음",
        "1": "비",
        "2": "비/눈",
        "3": "눈",
        "5": "빗방울",
        "6": "빗방울/눈날림",
        "7": "눈날림",
    }

    pty = selected.get("PTY", "0")
    sky = selected.get("SKY", "1")
    temperature = selected.get("TMP")
    humidity = selected.get("REH")
    wind_speed = selected.get("WSD")

    weather_risk = 0.0
    if pty != "0":
        weather_risk += {"1": 0.85, "2": 0.9, "3": 0.8, "5": 0.65, "6": 0.75, "7": 0.8}.get(pty, 0.6)
    else:
        weather_risk += {"1": 0.05, "3": 0.2, "4": 0.35}.get(sky, 0.1)

    try:
        wind_value = float(wind_speed) if wind_speed is not None else 0.0
    except ValueError:
        wind_value = 0.0

    if wind_value >= 10:
        weather_risk += 0.2
    elif wind_value >= 7:
        weather_risk += 0.1
    elif wind_value >= 4:
        weather_risk += 0.05

    weather_risk = max(0.0, min(1.0, weather_risk))

    return {
        "weather_risk": round(weather_risk, 3),
        "summary": {
            "forecast_time": selected_time,
            "sky": sky_label_map.get(sky, "알 수 없음"),
            "precipitation": pty_label_map.get(pty, "알 수 없음"),
            "temperature_celsius": temperature,
            "humidity_percent": humidity,
            "wind_speed_mps": wind_speed,
        },
        "forecast": [
            {
                "forecast_time": forecast_time,
                "sky": sky_label_map.get(data.get("SKY", ""), data.get("SKY")),
                "precipitation": pty_label_map.get(data.get("PTY", "0"), data.get("PTY")),
                "temperature_celsius": data.get("TMP"),
                "humidity_percent": data.get("REH"),
                "wind_speed_mps": data.get("WSD"),
            }
            for forecast_time, data in sorted(forecast_by_time.items())
        ],
    }


async def fetch_daegu_weather_forecast(settings: AppSettings) -> dict:
    if not settings.kma_service_key:
        raise HTTPException(status_code=500, detail="KMA_SERVICE_KEY 환경변수가 설정되지 않았습니다.")

    base_date, base_time = get_kma_base_datetime(settings)
    params = {
        "serviceKey": settings.kma_service_key,
        "pageNo": 1,
        "numOfRows": 1000,
        "dataType": "JSON",
        "base_date": base_date,
        "base_time": base_time,
        "nx": settings.daegu_nx,
        "ny": settings.daegu_ny,
    }

    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            response = await client.get(settings.kma_forecast_url, params=params)
            response.raise_for_status()
        except httpx.HTTPStatusError as e:
            raise HTTPException(
                status_code=e.response.status_code,
                detail=f"기상청 API 요청 실패: {e.response.text}",
            )
        except httpx.RequestError as e:
            raise HTTPException(status_code=502, detail=f"기상청 API 연결 오류: {str(e)}")

    data = response.json()
    header = data.get("response", {}).get("header", {})
    body = data.get("response", {}).get("body", {})

    if header.get("resultCode") != "00":
        raise HTTPException(
            status_code=502,
            detail=f"기상청 API 오류 - code: {header.get('resultCode')}, message: {header.get('resultMsg')}",
        )

    items = body.get("items", {}).get("item", [])
    if isinstance(items, dict):
        items = [items]

    parsed = parse_weather_risk_and_summary(items)
    # 표시용으로 서버에서 실제로 데이터를 가져왔는지 여부 플래그 추가
    parsed["fetched"] = True
    parsed.update(
        {
            "region": "대구",
            "grid": {"nx": settings.daegu_nx, "ny": settings.daegu_ny},
            "base_date": base_date,
            "base_time": base_time,
        }
    )
    return parsed
