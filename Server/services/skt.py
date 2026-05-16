import httpx
from typing import Optional

from fastapi import HTTPException

from settings import AppSettings


async def get_place_congestion(settings: AppSettings, poi_id: str, lat: Optional[float] = None, lng: Optional[float] = None) -> dict:
    if not settings.skt_app_key:
        raise HTTPException(status_code=500, detail="SKT_APP_KEY 환경변수가 설정되지 않았습니다.")

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
            raise HTTPException(status_code=e.response.status_code, detail=f"SKT API 요청 실패: {e.response.text}")
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
                "type": "장소 혼잡도" if item.get("type") == 1 else "주변 혼잡도",
                "congestion": item.get("congestion"),
                "congestion_level": item.get("congestionLevel"),
                "congestion_label": congestion_level_labels.get(item.get("congestionLevel"), "알 수 없음"),
                "datetime": item.get("datetime"),
            }
            for item in rltm_list
        ],
    }
    return result
