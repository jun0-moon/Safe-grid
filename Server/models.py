from pydantic import BaseModel


class UserLocation(BaseModel):
    user_id: str
    latitude: float
    longitude: float
    direction: float | None = None   # 이동 방향 벡터값은 현재 위험도 계산에서 사용하지 않음
    d_skt: float | None = None       # SKT 측정값 밀집도 값 (명/㎡)
    slope: float | None = None       # 경사도 값 (0~1)
    weather: float | None = None     # 날씨 위험도 (0~1)
