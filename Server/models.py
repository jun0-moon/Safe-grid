from pydantic import BaseModel


class UserLocation(BaseModel):
    user_id: str
    latitude: float
    longitude: float
    direction: float   # 동선 벡터 위험도 V (이동 방향 충돌/꼬임 정도, 0~1)
    d_skt: float = 0.0     # SKT 혼잡도 기반 군중 밀도 (명/㎡)
    slope: float = 0.0     # 경사도 위험 페널티 (0~1)
    weather: float = 0.0   # 날씨 위험 페널티 (0~1)
