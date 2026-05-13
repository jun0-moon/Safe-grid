from fastapi import FastAPI, BackgroundTasks, HTTPException, Query, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
import httpx
import os
from dotenv import load_dotenv
from risk_engine import calculate_risk

# .env 파일에서 환경변수 로드 (.env 값을 최우선으로 적용)
load_dotenv(override=True)

# SKT Open API 설정
SKT_APP_KEY = os.getenv("SKT_APP_KEY", "")  # .env 파일에서 appKey 로드
SKT_CONGESTION_URL = "https://apis.openapi.sk.com/puzzle/place/congestion/rltm/pois"

app = FastAPI(title="Safe-Grid API Server")

# CORS 설정 (프론트엔드 통신 허용)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 데이터 모델 정의
class UserLocation(BaseModel):
    user_id: str
    latitude: float
    longitude: float
    direction: float   # 동선 벡터 위험도 V (이동 방향 충돌/꼬임 정도, 0~1)
    d_skt: float = 0.0     # SKT 혼잡도 기반 군중 밀도 (명/㎡)
    slope: float = 0.0     # 경사도 위험 페널티 (0~1)
    weather: float = 0.0   # 날씨 위험 페널티 (0~1)

# 1. 실시간 위치 수집 및 위험도 조회
@app.post("/api/v1/location")
async def update_location(data: UserLocation):
    # TODO: Redis에 위치 데이터 저장
    # TODO: d_skt를 SKT 혼잡도 API에서 자동 조회하도록 개선

    # 환경 증폭 모델로 위험도 산출
    risk_score = calculate_risk(
        d_skt=data.d_skt,
        vector=data.direction,
        slope=data.slope,
        weather=data.weather,
    )

    # 위험도 임계값 기반 레드존 판정 (예: 0.7 이상)
    is_red_zone = risk_score >= 0.7

    return {
        "status": "success",
        "risk_score": round(risk_score, 5),
        "is_red_zone": is_red_zone,
    }

# 2. 전체 위험 지도 데이터 (Heatmap용)
@app.get("/api/v1/risk-map")
async def get_risk_map():
    # TODO: PostGIS에서 그리드별 위험도(R)를 GeoJSON 형태로 반환
    return {"grid_data": []}

# 3. 실시간 장소 혼잡도 조회 (SKT Open API)
@app.get("/api/v1/congestion/{poi_id}")
async def get_place_congestion(
    poi_id: str,
    lat: Optional[float] = Query(None, description="주변 혼잡도 중심 위도 (WGS84)"),
    lng: Optional[float] = Query(None, description="주변 혼잡도 중심 경도 (WGS84)"),
):
    """
    SKT 실시간 장소 혼잡도 API를 호출하여 결과를 반환합니다.

    - **poi_id**: 관심 장소(POI) ID (예: 10067845 = 더현대서울)
    - **lat/lng**: 위경도를 추가하면 주변(350m×350m) 혼잡도도 함께 조회

    혼잡도 레벨:
      1: 여유, 2: 보통, 3: 혼잡, 4: 매우 혼잡
    """
    if not SKT_APP_KEY:
        raise HTTPException(status_code=500, detail="SKT_APP_KEY 환경변수가 설정되지 않았습니다.")

    url = f"{SKT_CONGESTION_URL}/{poi_id}"
    headers = {
        "appKey": SKT_APP_KEY,
        "Accept": "application/json",
    }
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
            raise HTTPException(
                status_code=e.response.status_code,
                detail=f"SKT API 요청 실패: {e.response.text}",
            )
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=502,
                detail=f"SKT API 연결 오류: {str(e)}",
            )

    data = response.json()

    # SKT API 응답 status 확인
    status = data.get("status", {})
    if status.get("code") != "00":
        raise HTTPException(
            status_code=502,
            detail=f"SKT API 오류 - code: {status.get('code')}, message: {status.get('message')}",
        )

    # 응답 파싱
    contents = data.get("contents", {})
    rltm_list = contents.get("rltm", [])

    congestion_level_labels = {
        1: "여유",
        2: "보통",
        3: "혼잡",
        4: "매우 혼잡",
    }

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


# 4. 외부 API 데이터 갱신 (Background Task)
async def fetch_external_data():
    """SKT OpenAPI 혼잡도 데이터 및 기상청 API 데이터를 갱신합니다."""
    # TODO: 주기적으로 주요 POI들의 혼잡도를 가져와 DB/캐시에 저장
    print("Fetching SKT congestion and Weather data...")

@app.on_event("startup")
async def startup_event():
    # 서버 시작 시 주기적인 데이터 호출 스케줄러 등록 가능
    pass

@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    return Response(status_code=204)

# 정적 파일 서빙 (프론트엔드 - test_web 폴더 사용)
static_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "test_web")
app.mount("/static", StaticFiles(directory=static_dir), name="static")

@app.get("/")
async def root():
    return FileResponse(os.path.join(static_dir, "index.html"))

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)