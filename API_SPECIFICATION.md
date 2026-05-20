# Safe-Grid API 명세서

## 기본 정보
- **Base URL**: `http://localhost:8000` (개발 환경)
- **응답 형식**: JSON
- **인증**: 환경변수 기반 (SKT_APP_KEY, KMA_SERVICE_KEY)

---

## 1. 사용자 위치 업데이트

### 요청
```
POST /api/v1/location
```

**요청 헤더**
```
Content-Type: application/json
```

**요청 본문**
```json
{
  "latitude": 35.8799,
  "longitude": 128.5958,
  "user_id": "user123"
}
```

**요청 파라미터**
| 필드명 | 타입 | 필수 | 설명 |
|--------|------|------|------|
| latitude | float | O | 위도 (WGS84) |
| longitude | float | O | 경도 (WGS84) |
| user_id | string | X | 사용자 ID |

**응답 (성공)**
```json
{
  "user_id": "user123",
  "location": {
    "latitude": 35.8799,
    "longitude": 128.5958
  },
  "risk_level": "low",
  "risk_details": {
    "weather_risk": 0.2,
    "congestion_risk": 0.3
  }
}
```

**응답 상태 코드**
| 코드 | 설명 |
|------|------|
| 200 | 성공 |
| 400 | 잘못된 요청 |
| 500 | 서버 오류 |

---

## 2. 대구 날씨 조회

### 요청
```
GET /api/v1/weather/daegu
```

**응답 (성공)**
```json
{
  "location": "대구",
  "forecast": [
    {
      "datetime": "202605181200",
      "temperature": 24,
      "humidity": 65,
      "wind_speed": 5.2,
      "weather": "맑음",
      "precipitation_probability": 0
    },
    {
      "datetime": "202605181500",
      "temperature": 26,
      "humidity": 60,
      "wind_speed": 4.8,
      "weather": "맑음",
      "precipitation_probability": 5
    }
  ],
  "updated_at": "202605181000"
}
```

**응답 상태 코드**
| 코드 | 설명 |
|------|------|
| 200 | 성공 |
| 500 | 서버 오류 |

---

## 3. 데이터 제공 가능 장소 조회

### 요청
```
GET /api/v1/pois?offset=0&limit=100
```

**요청 파라미터**
| 파라미터 | 타입 | 기본값 | 설명 |
|---------|------|-------|------|
| offset | integer | 0 | 조회 시작 위치 |
| limit | integer | 100 | 조회 개수 (최대 1000) |

**응답 (성공)**
```json
{
  "total_count": 204,
  "offset": 0,
  "limit": 100,
  "pois": [
    {
      "poi_id": "5411247",
      "poi_name": "스타필드하남"
    },
    {
      "poi_id": "5799875",
      "poi_name": "롯데월드몰"
    },
    {
      "poi_id": "10067845",
      "poi_name": "더현대서울"
    }
  ]
}
```

**응답 상태 코드**
| 코드 | 설명 |
|------|------|
| 200 | 성공 |
| 500 | SKT API 오류 또는 환경변수 미설정 |

---

## 4. 실시간 혼잡도 조회

### 요청
```
GET /api/v1/congestion/{poi_id}
```

또는 주변 혼잡도 조회:
```
GET /api/v1/congestion/{poi_id}?lat=37.568&lng=126.986
```

**경로 파라미터**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| poi_id | string | O | POI ID (예: 10067845) |

**쿼리 파라미터**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| lat | float | X | 위도 (WGS84) - 주변 혼잡도 조회 시 필요 |
| lng | float | X | 경도 (WGS84) - 주변 혼잡도 조회 시 필요 |

**응답 (성공)**
```json
{
  "poi_id": "10067845",
  "poi_name": "더현대서울",
  "congestion_data": [
    {
      "type": "장소 혼잡도",
      "congestion": 0.03895,
      "congestion_level": 1,
      "congestion_label": "여유",
      "datetime": "20260518160000"
    },
    {
      "type": "주변 혼잡도",
      "congestion": 0.15234,
      "congestion_level": 2,
      "congestion_label": "보통",
      "datetime": "20260518160000"
    }
  ]
}
```

**혼잡도 레벨**
| 레벨 | 라벨 | 범위 (명/㎡) | 설명 |
|------|------|----------|------|
| 1 | 여유 | 0.025 미만 | 전방 시야가 트인 상태 |
| 2 | 보통 | 0.025~0.05 | 전방 시야가 다소 막히는 상태 |
| 3 | 혼잡 | 0.05~0.3 | 다소 혼잡한 상태 |
| 4 | 매우 혼잡 | 0.3 이상 | 매우 혼잡하여 불쾌할 수 있는 상태 |

**응답 상태 코드**
| 코드 | 설명 |
|------|------|
| 200 | 성공 |
| 500 | SKT API 오류 또는 환경변수 미설정 |

---

## 5. 위험 지도 조회

### 요청
```
GET /api/v1/risk-map
```

**응답 (성공)**
```json
{
  "grid_data": []
}
```

**응답 상태 코드**
| 코드 | 설명 |
|------|------|
| 200 | 성공 |

---

## 에러 응답

### 일반 에러 형식
```json
{
  "detail": "에러 메시지"
}
```

### 에러 코드
| 상태 코드 | 메시지 예시 |
|---------|----------|
| 400 | 잘못된 요청 매개변수 |
| 500 | SKT_APP_KEY 환경변수가 설정되지 않았습니다. |
| 502 | SKT API 요청 실패 또는 연결 오류 |

---

## JavaScript 클라이언트 예제

### 1. 사용자 위치 업데이트
```javascript
async function updateLocation(latitude, longitude, userId) {
  try {
    const response = await fetch('http://localhost:8000/api/v1/location', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        latitude: latitude,
        longitude: longitude,
        user_id: userId
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('위치 업데이트 성공:', data);
    return data;
  } catch (error) {
    console.error('위치 업데이트 실패:', error);
  }
}

// 사용법
updateLocation(35.8799, 128.5958, 'user123');
```

### 2. 대구 날씨 조회
```javascript
async function getWeather() {
  try {
    const response = await fetch('http://localhost:8000/api/v1/weather/daegu');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('날씨 정보:', data);
    return data;
  } catch (error) {
    console.error('날씨 조회 실패:', error);
  }
}

// 사용법
getWeather();
```

### 3. POI 목록 조회
```javascript
async function getPOIs(offset = 0, limit = 100) {
  try {
    const url = new URL('http://localhost:8000/api/v1/pois');
    url.searchParams.append('offset', offset);
    url.searchParams.append('limit', limit);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('POI 목록:', data);
    return data;
  } catch (error) {
    console.error('POI 조회 실패:', error);
  }
}

// 사용법
getPOIs(0, 50);
```

### 4. 혼잡도 조회
```javascript
async function getCongestion(poiId, lat = null, lng = null) {
  try {
    const url = new URL(`http://localhost:8000/api/v1/congestion/${poiId}`);
    
    if (lat !== null && lng !== null) {
      url.searchParams.append('lat', lat);
      url.searchParams.append('lng', lng);
    }
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('혼잡도 정보:', data);
    return data;
  } catch (error) {
    console.error('혼잡도 조회 실패:', error);
  }
}

// 사용법
// 장소 혼잡도
getCongestion('10067845');

// 주변 혼잡도 (위도, 경도 기반)
getCongestion('10067845', 37.568, 126.986);
```

### 5. Fetch 래퍼 클래스
```javascript
class SafeGridAPI {
  constructor(baseUrl = 'http://localhost:8000') {
    this.baseUrl = baseUrl;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API 요청 실패: ${endpoint}`, error);
      throw error;
    }
  }

  // 위치 업데이트
  updateLocation(latitude, longitude, userId) {
    return this.request('/api/v1/location', {
      method: 'POST',
      body: JSON.stringify({
        latitude,
        longitude,
        user_id: userId
      })
    });
  }

  // 날씨 조회
  getWeather() {
    return this.request('/api/v1/weather/daegu');
  }

  // POI 목록 조회
  getPOIs(offset = 0, limit = 100) {
    return this.request(`/api/v1/pois?offset=${offset}&limit=${limit}`);
  }

  // 혼잡도 조회
  getCongestion(poiId, lat = null, lng = null) {
    let endpoint = `/api/v1/congestion/${poiId}`;
    if (lat !== null && lng !== null) {
      endpoint += `?lat=${lat}&lng=${lng}`;
    }
    return this.request(endpoint);
  }

  // 위험 지도 조회
  getRiskMap() {
    return this.request('/api/v1/risk-map');
  }
}

// 사용법
const api = new SafeGridAPI();

(async () => {
  try {
    // 위치 업데이트
    const locationResult = await api.updateLocation(35.8799, 128.5958, 'user123');
    console.log('위치:', locationResult);

    // 날씨 조회
    const weather = await api.getWeather();
    console.log('날씨:', weather);

    // POI 목록 조회
    const pois = await api.getPOIs(0, 10);
    console.log('POI:', pois);

    // 혼잡도 조회
    const congestion = await api.getCongestion('10067845');
    console.log('혼잡도:', congestion);

    // 주변 혼잡도 조회
    const localCongestion = await api.getCongestion('10067845', 37.568, 126.986);
    console.log('주변 혼잡도:', localCongestion);
  } catch (error) {
    console.error('오류 발생:', error);
  }
})();
```

---

## cURL 요청 예제

### 사용자 위치 업데이트
```bash
curl -X POST http://localhost:8000/api/v1/location \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 35.8799,
    "longitude": 128.5958,
    "user_id": "user123"
  }'
```

### 대구 날씨 조회
```bash
curl http://localhost:8000/api/v1/weather/daegu
```

### POI 목록 조회
```bash
curl "http://localhost:8000/api/v1/pois?offset=0&limit=50"
```

### 혼잡도 조회 (장소 기반)
```bash
curl http://localhost:8000/api/v1/congestion/10067845
```

### 혼잡도 조회 (위도/경도 기반)
```bash
curl "http://localhost:8000/api/v1/congestion/10067845?lat=37.568&lng=126.986"
```

---

## Python 클라이언트 예제

```python
import httpx
import asyncio

class SafeGridAPIClient:
    def __init__(self, base_url="http://localhost:8000"):
        self.base_url = base_url

    async def update_location(self, latitude: float, longitude: float, user_id: str = None) -> dict:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/api/v1/location",
                json={
                    "latitude": latitude,
                    "longitude": longitude,
                    "user_id": user_id
                }
            )
            return response.json()

    async def get_weather(self) -> dict:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{self.base_url}/api/v1/weather/daegu")
            return response.json()

    async def get_pois(self, offset: int = 0, limit: int = 100) -> dict:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/api/v1/pois",
                params={"offset": offset, "limit": limit}
            )
            return response.json()

    async def get_congestion(self, poi_id: str, lat: float = None, lng: float = None) -> dict:
        params = {}
        if lat is not None and lng is not None:
            params = {"lat": lat, "lng": lng}
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/api/v1/congestion/{poi_id}",
                params=params
            )
            return response.json()

# 사용 예제
async def main():
    client = SafeGridAPIClient()
    
    # 위치 업데이트
    result = await client.update_location(35.8799, 128.5958, "user123")
    print("위치 업데이트:", result)
    
    # 날씨 조회
    weather = await client.get_weather()
    print("날씨:", weather)
    
    # POI 목록 조회
    pois = await client.get_pois(0, 10)
    print("POI:", pois)
    
    # 혼잡도 조회
    congestion = await client.get_congestion("10067845")
    print("혼잡도:", congestion)

if __name__ == "__main__":
    asyncio.run(main())
```
