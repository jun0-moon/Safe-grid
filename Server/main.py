from fastapi import FastAPI, BackgroundTasks
from pydantic import BaseModel
from typing import List
import uvicorn

app = FastAPI(title="Safe-Grid API Server")

# 데이터 모델 정의
class UserLocation(BaseModel):
    user_id: str
    latitude: float
    longitude: float
    direction: float  # 이동 방향 (Vector)

# 1. 실시간 위치 수집 및 위험도 조회
@app.post("/api/v1/location")
async def update_location(data: UserLocation):
    # TODO: Redis에 위치 데이터 저장 및 그리드별 인원수(D_app) 계산
    # TODO: Risk R 산출 로직 호출
    risk_score = 0.75  # 예시 값
    return {"status": "success", "risk_score": risk_score, "is_red_zone": False}

# 2. 전체 위험 지도 데이터 (Heatmap용)
@app.get("/api/v1/risk-map")
async def get_risk_map():
    # TODO: PostGIS에서 그리드별 위험도(R)를 GeoJSON 형태로 반환
    return {"grid_data": []}

# 3. 외부 API 데이터 갱신 (Background Task)
async def fetch_external_data():
    # SKT OpenAPI 및 기상청 API 호출 로직
    print("Fetching SKT and Weather data...")

@app.on_event("startup")
async def startup_event():
    # 서버 시작 시 주기적인 데이터 호출 스케줄러 등록 가능
    pass

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)