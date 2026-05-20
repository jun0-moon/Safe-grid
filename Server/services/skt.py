import httpx
from typing import Optional

from fastapi import HTTPException

from settings import AppSettings


async def get_pois_list(settings: AppSettings, offset: int = 0, limit: int = 100) -> dict:
    if not settings.skt_app_key:
        raise HTTPException(status_code=500, detail="SKT_APP_KEY 환경 변수가 설정되지 않았습니다.")

    url = settings.skt_pois_url
    headers = {"appKey": settings.skt_app_key, "Accept": "application/json"}
    params = {"offset": offset, "limit": limit}

    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            response = await client.get(url, headers=headers, params=params)
            response.raise_for_status()
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=e.response.status_code, detail=f"SKT API 호출 오류: {e.response.text}")
        except httpx.RequestError as e:
            raise HTTPException(status_code=502, detail=f"SKT API 연결 오류: {str(e)}")

    data = response.json()
    status = data.get("status", {})
    if status.get("code") != "00":
        raise HTTPException(status_code=502, detail=f"SKT API 오류 - code: {status.get('code')}, message: {status.get('message')}")

    contents = data.get("contents", [])
    pois = []
    for item in contents:
        pois.append(
            {
                "poi_id": item.get("poiId"),
                "poi_name": item.get("poiName"),
                "latitude": item.get("latitude") or item.get("lat"),
                "longitude": item.get("longitude") or item.get("lng"),
            }
        )

    return {
        "total_count": status.get("totalCount"),
        "offset": offset,
        "limit": limit,
        "pois": pois,
    }


async def get_place_congestion(settings: AppSettings, poi_id: str, lat: Optional[float] = None, lng: Optional[float] = None) -> dict:
    if not settings.skt_app_key:
        raise HTTPException(status_code=500, detail="SKT_APP_KEY ??꽓??짼쩍???????째? ??짚???????짠? ??????????????짚.")

    url = f"{settings.skt_congestion_url}/{poi_id}"
    headers = {"appKey": settings.skt_app_key, "Accept": "application/json"}
    params = {}
    if lat is not None:
        params["lat"] = lat
    if lng is not None:
        params["lng"] = lng

    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            response = await client.get(url, headers=headers, params=params)
            response.raise_for_status()
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=e.response.status_code, detail=f"SKT API 호출 오류: {e.response.text}")
        except httpx.RequestError as e:
            raise HTTPException(status_code=502, detail=f"SKT API 연결 오류: {str(e)}")

    data = response.json()
    status = data.get("status", {})
    if status.get("code") != "00":
        raise HTTPException(status_code=502, detail=f"SKT API 오류 - code: {status.get('code')}, message: {status.get('message')}")

    contents = data.get("contents", {})
    rltm_list = contents.get("rltm", [])

    congestion_level_labels = {1: "여유", 2: "보통", 3: "혼잡", 4: "매우 혼잡"}

    result = {
        "poi_id": contents.get("poiId"),
        "poi_name": contents.get("poiName"),
        "congestion_data": [
            {
                "type": "실내 혼잡도" if item.get("type") == 1 else "실외 혼잡도",
                "congestion": item.get("congestion"),
                "congestion_level": item.get("congestionLevel"),
                "congestion_label": congestion_level_labels.get(item.get("congestionLevel"), "알 수 없음"),
                "datetime": item.get("datetime"),
            }
            for item in rltm_list
        ],
    }
    return result

def _squared_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    return (lat1 - lat2) ** 2 + (lng1 - lng2) ** 2

def estimate_density_from_congestion(congestion_data: list[dict]) -> float | None:
    if not congestion_data:
        return None
    
    latest = congestion_data[-1]
    congestion = latest.get("congestion")
    level = latest.get("congestion_level")

    if congestion is not None:
        try:
            density = float(congestion)
            if density <= 5:
                return density
            if density <= 100:
                return round((density / 100.0) * 5.0, 4)
        except (TypeError, ValueError):
            pass

    level_map = {1: 0.05, 2: 0.5, 3: 1.5, 4: 3.0}
    if isinstance(level, int):
        return level_map.get(level, 0.5)
    try:
        return level_map.get(int(level), 0.5)
    except (TypeError, ValueError):
        return None

async def get_nearest_poi_id(settings: AppSettings, latitude: float, longitude: float) -> str | None:
    pois_data = await get_pois_list(settings, offset=0, limit=100)
    pois = [poi for poi in pois_data.get("pois", []) if poi.get("poi_id")]
    if not pois:
        return None

    best_poi = None
    best_dist = None
    for poi in pois:
        poi_lat = poi.get("latitude")
        poi_lng = poi.get("longitude")
        if poi_lat is None or poi_lng is None:
            continue
        dist = _squared_distance(latitude, longitude, float(poi_lat), float(poi_lng))
        if best_dist is None or dist < best_dist:
            best_dist = dist
            best_poi = poi

    if best_poi:
        return best_poi["poi_id"]

    return pois[0].get("poi_id")
