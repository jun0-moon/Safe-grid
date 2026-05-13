// 1. 필요한 도구들을 추가로 가져옵니다! (Polyline, CustomOverlayMap, ZoomControl)
import {
  Map,
  MapMarker,
  Polygon,
  Polyline,
  CustomOverlayMap,
  ZoomControl,
  useKakaoLoader,
} from "react-kakao-maps-sdk";

// 위험 구역 데이터
const dangerZones = [
  {
    id: 1,
    name: "A구역 (침수 위험)",
    path: [
      { lat: 35.872, lng: 128.593 },
      { lat: 35.8725, lng: 128.5945 },
      { lat: 35.8715, lng: 128.595 },
      { lat: 35.871, lng: 128.5935 },
    ],
  },
];

// 2. 파란색 경로를 그리기 위한 가짜(Mock) 좌표 데이터입니다.
const routePath = [
  { lat: 35.8714, lng: 128.5943 }, // 출발 지점 (동성로 마커)
  { lat: 35.8705, lng: 128.5948 }, // 중간 꺾이는 지점
  { lat: 35.871, lng: 128.596 }, // 도착 지점
];

function App() {
  const [loading, error] = useKakaoLoader({
    appkey: "22ff690840af34865670afb94e0d7c3a",
    libraries: ["clusterer", "drawing", "services"],
  });

  if (loading) return <div>지도를 열심히 가져오는 중입니다... ⏳</div>;
  if (error)
    return <div style={{ color: "red" }}>지도 에러 발생: {error.message}</div>;

  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100vh",
        fontFamily: "sans-serif",
      }}
    >
      {/* --- 좌측 사이드바 영역 --- */}
      <div
        style={{
          width: "300px",
          borderRight: "2px solid #333",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#fff",
        }}
      >
        <div style={{ padding: "30px 20px", borderBottom: "2px solid #333" }}>
          <h2 style={{ margin: "0 0 10px 0", fontSize: "20px" }}>동성로</h2>
          <p style={{ margin: "0 0 30px 0", fontSize: "14px", color: "#555" }}>
            동성로 위험구역 정보
          </p>
          <p
            style={{
              margin: "0 0 5px 0",
              fontSize: "15px",
              fontWeight: "bold",
            }}
          >
            오픈 시간
          </p>
          <p style={{ margin: 0, fontSize: "14px", color: "#555" }}>24시</p>
        </div>

        <div style={{ padding: "20px", flex: 1 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "15px",
            }}
          >
            <span style={{ fontWeight: "bold", fontSize: "15px" }}>
              인구 밀집도
            </span>
            <span style={{ fontWeight: "bold", cursor: "pointer" }}>˄</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
            <LegendRow color="#FFFFFF" text="0" />
            <LegendRow color="#FFD1A9" text="1 - 5" />
            <LegendRow color="#FF9E5E" text="6 - 10" />
            <LegendRow color="#FF5A36" text="11 - 15" />
            <LegendRow color="#E83845" text="16 - 25" />
            <LegendRow color="#BA1115" text="26 - 30" />
          </div>
        </div>
      </div>

      {/* --- 우측 지도 영역 --- */}
      <div style={{ flex: 1, position: "relative" }}>
        <Map
          center={{ lat: 35.8714, lng: 128.5943 }}
          style={{ width: "100%", height: "100%" }}
          level={4}
        >
          {/* 💡 3. 확대/축소 버튼 추가 */}
          {/* window.kakao가 로드된 이후에만 ZoomControl을 렌더링하도록 안전장치 추가 */}
          {window.kakao && window.kakao.maps && (
            <ZoomControl
              position={window.kakao.maps.ControlPosition.BOTTOMRIGHT}
            />
          )}

          <MapMarker position={{ lat: 35.8714, lng: 128.5943 }} />

          {/* 위험 구역 다각형 */}
          {dangerZones.map((zone) => (
            <Polygon
              key={zone.id}
              path={zone.path}
              strokeWeight={3}
              strokeColor={"#FF0000"}
              strokeOpacity={0.8}
              strokeStyle={"solid"}
              fillColor={"#FF0000"}
              fillOpacity={0.3}
            />
          ))}

          {/* 💡 4. 파란색 경로 선 (Polyline) 그리기 */}
          <Polyline
            path={routePath}
            strokeWeight={5} // 선 두께
            strokeColor={"#0054FF"} // 선 색깔 (파란색)
            strokeOpacity={0.9} // 투명도
            strokeStyle={"solid"} // 실선
          />

          {/* 💡 5. '걸어서 8분' 툴팁 말풍선 (CustomOverlay) 띄우기 */}
          <CustomOverlayMap
            position={{ lat: 35.8705, lng: 128.5948 }} // 경로 중간 지점에 띄움
            yAnchor={1.5} // 마커(좌표)보다 살짝 위에 뜨도록 위치 조정
          >
            <div
              style={{
                padding: "5px 10px",
                backgroundColor: "white",
                border: "1px solid #ccc",
                borderRadius: "5px",
                fontSize: "12px",
                fontWeight: "bold",
                boxShadow: "0px 2px 4px rgba(0,0,0,0.2)",
              }}
            >
              걸어서 8분
            </div>
            {/* ... 기존 폴리곤, 폴리라인, 걸어서 8분 코드 ... */}

            {/* 💡 6. 출발지 배지 표시 (파란색) */}
            <CustomOverlayMap
              position={routePath[0]} // 배열의 첫 번째 좌표가 출발지!
              yAnchor={2.5} // 선에 가려지지 않게 위로 살짝 띄움
            >
              <div
                style={{
                  padding: "3px 8px",
                  backgroundColor: "#0054FF",
                  color: "white",
                  borderRadius: "12px",
                  fontSize: "12px",
                  fontWeight: "bold",
                  boxShadow: "0px 2px 4px rgba(0,0,0,0.3)",
                }}
              >
                출발
              </div>
            </CustomOverlayMap>

            {/* 💡 7. 도착지 배지 표시 (빨간색) */}
            <CustomOverlayMap
              position={routePath[routePath.length - 1]} // 배열의 마지막 좌표가 도착지!
              yAnchor={2.5}
            >
              <div
                style={{
                  padding: "3px 8px",
                  backgroundColor: "#FF0000",
                  color: "white",
                  borderRadius: "12px",
                  fontSize: "12px",
                  fontWeight: "bold",
                  boxShadow: "0px 2px 4px rgba(0,0,0,0.3)",
                }}
              >
                도착
              </div>
            </CustomOverlayMap>
          </CustomOverlayMap>
        </Map>
      </div>
    </div>
  );
}

function LegendRow({ color, text }) {
  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      <div
        style={{
          width: "40px",
          height: "20px",
          backgroundColor: color,
          border: "1px solid #333",
          borderTop: "none",
        }}
      ></div>
      <span style={{ marginLeft: "10px", fontSize: "13px", color: "#333" }}>
        {text}
      </span>
    </div>
  );
}

export default App;
