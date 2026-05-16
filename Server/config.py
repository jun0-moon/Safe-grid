from datetime import timezone, timedelta
from dotenv import load_dotenv
import os

# .env 파일에서 환경변수 로드
load_dotenv(override=True)

# SKT Open API 설정
SKT_APP_KEY = os.getenv("SKT_APP_KEY", "")
SKT_CONGESTION_URL = "https://apis.openapi.sk.com/puzzle/place/congestion/rltm/pois"

# 기상청 단기예보 설정
KMA_SERVICE_KEY = os.getenv("KMA_SERVICE_KEY", "")
KMA_FORECAST_URL = "https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst"
DAEGU_NX = int(os.getenv("DAEGU_NX", "89"))
DAEGU_NY = int(os.getenv("DAEGU_NY", "90"))
KST = timezone(timedelta(hours=9), name="KST")
