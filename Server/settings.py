from dataclasses import dataclass
from datetime import timezone, timedelta
from functools import lru_cache
import os

from dotenv import load_dotenv


load_dotenv(override=True)


@dataclass(frozen=True)
class AppSettings:
    skt_app_key: str
    skt_congestion_url: str
    kma_service_key: str
    kma_forecast_url: str
    daegu_nx: int
    daegu_ny: int
    kst: timezone


@lru_cache(maxsize=1)
def get_settings() -> AppSettings:
    return AppSettings(
        skt_app_key=os.getenv("SKT_APP_KEY", ""),
        skt_congestion_url="https://apis.openapi.sk.com/puzzle/place/congestion/rltm/pois",
        kma_service_key=os.getenv("KMA_SERVICE_KEY", ""),
        kma_forecast_url="https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst",
        daegu_nx=int(os.getenv("DAEGU_NX", "89")),
        daegu_ny=int(os.getenv("DAEGU_NY", "90")),
        kst=timezone(timedelta(hours=9), name="KST"),
    )
