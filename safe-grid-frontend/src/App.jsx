import { useRef, useState, useEffect } from "react";
import {
  Map,
  MapMarker,
  Polygon,
  ZoomControl,
  DrawingManager,
} from "react-kakao-maps-sdk";

function App() {
  const managerRef = useRef(null);
  const [analyzedZones, setAnalyzedZones] = useState([]);
  const [myLocation, setMyLocation] = useState(null);

  // 💡 [추가 1] 지도에서 '클릭된 구역'의 상세 데이터를 저장할 메모리
  const [selectedZone, setSelectedZone] = useState(null);

  useEffect(() => {
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          setMyLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) =>
          console.error("위치 정보를 가져오는 데 실패했습니다.", error),
        { enableHighAccuracy: true },
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  const selectDrawPolygon = () => {
    const manager = managerRef.current;
    if (manager) {
      manager.cancel();
      manager.select(window.kakao.maps.drawing.OverlayType.POLYGON);
    }
  };

  const getDensityHexColor = (count) => {
    if (count === 0) return "#FFFFFF";
    if (count >= 1 && count <= 5) return "#FFD1A9";
    if (count >= 6 && count <= 10) return "#FF9E5E";
    if (count >= 11 && count <= 15) return "#FF5A36";
    if (count >= 16 && count <= 25) return "#E83845";
    if (count >= 26) return "#BA1115";
    return "#39f";
  };

  // 💡 [추가 2] 기상청 API에서 받아올 데이터를 흉내 내는(시뮬레이션) 함수
  const generateMockWeatherData = () => {
    const weatherTypes = [
      { status: "맑음", icon: "☀️" },
      { status: "구름 많음", icon: "⛅" },
      { status: "흐림", icon: "☁️" },
      { status: "비", icon: "🌧️" },
    ];
    const randomWeather =
      weatherTypes[Math.floor(Math.random() * weatherTypes.length)];

    return {
      temperature: (Math.random() * 15 + 10).toFixed(1), // 10.0 ~ 25.0도
      humidity: Math.floor(Math.random() * 40 + 40), // 40 ~ 80%
      windSpeed: (Math.random() * 5).toFixed(1), // 0.0 ~ 5.0 m/s
      condition: randomWeather,
    };
  };

  const getPolygonData = () => {
    const manager = managerRef.current;
    if (manager) {
      const data = manager.getData();
      const polygonData = data[window.kakao.maps.drawing.OverlayType.POLYGON];

      if (polygonData && polygonData.length > 0) {
        const coords = polygonData[0].points;
        const formattedPath = coords.map((point) => ({
          lat: point.y,
          lng: point.x,
        }));

        const simulatedPeopleCount = Math.floor(Math.random() * 31);
        const targetColor = getDensityHexColor(simulatedPeopleCount);
        const simulatedWeather = generateMockWeatherData(); // 가상 기상 데이터 생성

        const newZoneData = {
          id: Date.now(), // 구역 구분을 위한 고유 ID
          path: formattedPath,
          color: targetColor,
          count: simulatedPeopleCount,
          weather: simulatedWeather, // 구역 데이터에 기상 정보 포함!
        };

        setAnalyzedZones((prev) => [...prev, newZoneData]);

        // 새로 분석된 구역을 자동으로 '선택된 구역'으로 지정해서 대시보드에 띄웁니다.
        setSelectedZone(newZoneData);

        alert(
          `[분석 완료! 📊]\n영역 분석이 완료되었습니다. 좌측 대시보드에서 Raw Data를 확인하세요.`,
        );
      } else {
        alert("먼저 지도 위에 다각형을 그려주세요!");
      }
    }
  };

  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100vh",
        fontFamily: "sans-serif",
      }}
    >
      {/* --- 좌측 사이드바 영역 (대시보드) --- */}
      <div
        style={{
          width: "320px",
          borderRight: "2px solid #333",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#f8f9fa",
        }}
      >
        {/* 상단 버튼 영역 */}
        <div
          style={{
            padding: "20px",
            backgroundColor: "#fff",
            borderBottom: "1px solid #ddd",
          }}
        >
          <h2
            style={{ margin: "0 0 15px 0", fontSize: "20px", color: "#2c3e50" }}
          >
            Safe-Grid 분석
          </h2>
          <button
            onClick={selectDrawPolygon}
            style={{
              width: "100%",
              marginBottom: "10px",
              padding: "10px",
              backgroundColor: "#0054FF",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            ✏️ 임의 영역 그리기
          </button>
          <button
            onClick={getPolygonData}
            style={{
              width: "100%",
              padding: "10px",
              backgroundColor: "#333",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            🔍 밀집도 분석 및 데이터 추출
          </button>
        </div>

        {/* 💡 [추가 3] 클릭된 구역의 Raw Data를 보여주는 동적 대시보드 영역 */}
        <div style={{ padding: "20px", flex: 1, overflowY: "auto" }}>
          {selectedZone ? (
            <div
              style={{
                backgroundColor: "#fff",
                padding: "15px",
                borderRadius: "8px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              }}
            >
              <h3
                style={{
                  margin: "0 0 10px 0",
                  fontSize: "16px",
                  color: "#0054FF",
                }}
              >
                📍 선택된 구역 상세 데이터
              </h3>

              <div
                style={{ padding: "10px 0", borderBottom: "1px solid #eee" }}
              >
                <span
                  style={{
                    fontSize: "13px",
                    color: "#666",
                    display: "block",
                    marginBottom: "5px",
                  }}
                >
                  실시간 밀집 인구 (추정치)
                </span>
                <strong style={{ fontSize: "24px", color: selectedZone.color }}>
                  {selectedZone.count}명
                </strong>
              </div>

              <div style={{ paddingTop: "15px" }}>
                <span
                  style={{
                    fontSize: "13px",
                    color: "#666",
                    display: "block",
                    marginBottom: "10px",
                  }}
                >
                  기상청 Open API 기반 (Raw Data)
                </span>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: "10px",
                  }}
                >
                  <span style={{ fontSize: "28px", marginRight: "10px" }}>
                    {selectedZone.weather.condition.icon}
                  </span>
                  <strong style={{ fontSize: "16px" }}>
                    {selectedZone.weather.condition.status}
                  </strong>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "10px",
                    fontSize: "14px",
                  }}
                >
                  <div
                    style={{
                      backgroundColor: "#f1f3f5",
                      padding: "8px",
                      borderRadius: "5px",
                    }}
                  >
                    <div style={{ color: "#868e96", fontSize: "12px" }}>
                      🌡️ 기온
                    </div>
                    <div style={{ fontWeight: "bold", marginTop: "3px" }}>
                      {selectedZone.weather.temperature} ℃
                    </div>
                  </div>
                  <div
                    style={{
                      backgroundColor: "#f1f3f5",
                      padding: "8px",
                      borderRadius: "5px",
                    }}
                  >
                    <div style={{ color: "#868e96", fontSize: "12px" }}>
                      💧 습도
                    </div>
                    <div style={{ fontWeight: "bold", marginTop: "3px" }}>
                      {selectedZone.weather.humidity} %
                    </div>
                  </div>
                  <div
                    style={{
                      backgroundColor: "#f1f3f5",
                      padding: "8px",
                      borderRadius: "5px",
                    }}
                  >
                    <div style={{ color: "#868e96", fontSize: "12px" }}>
                      🌬️ 풍속
                    </div>
                    <div style={{ fontWeight: "bold", marginTop: "3px" }}>
                      {selectedZone.weather.windSpeed} m/s
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div
              style={{
                textAlign: "center",
                padding: "40px 0",
                color: "#adb5bd",
              }}
            >
              <p style={{ fontSize: "30px", margin: "0 0 10px 0" }}>🗺️</p>
              <p style={{ margin: 0, fontSize: "14px" }}>
                지도에서 분석된 구역을 클릭하면
                <br />
                상세 Raw Data가 표시됩니다.
              </p>
            </div>
          )}

          {/* 인구 밀집도 범례 */}
          <div style={{ marginTop: "30px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "15px",
              }}
            >
              <span style={{ fontWeight: "bold", fontSize: "15px" }}>
                인구 밀집도 기준
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
              <LegendRow color="#FFFFFF" text="0명 (안전)" />
              <LegendRow color="#FFD1A9" text="1 - 5명" />
              <LegendRow color="#FF9E5E" text="6 - 10명" />
              <LegendRow color="#FF5A36" text="11 - 15명" />
              <LegendRow color="#E83845" text="16 - 25명" />
              <LegendRow color="#BA1115" text="26명 이상 (위험)" />
            </div>
          </div>
        </div>
      </div>

      {/* --- 우측 지도 영역 --- */}
      <div style={{ flex: 1, position: "relative" }}>
        <Map
          center={myLocation ? myLocation : { lat: 35.8714, lng: 128.5943 }}
          style={{ width: "100%", height: "100%" }}
          level={4}
        >
          {window.kakao && window.kakao.maps && (
            <DrawingManager
              ref={managerRef}
              drawingMode={[window.kakao.maps.drawing.OverlayType.POLYGON]}
              guideTooltip={["draw", "drag", "edit"]}
              polygonOptions={{
                strokeColor: "#39f",
                fillColor: "#39f",
                fillOpacity: 0.3,
              }}
            />
          )}

          {window.kakao && window.kakao.maps && (
            <ZoomControl
              position={window.kakao.maps.ControlPosition.BOTTOMRIGHT}
            />
          )}

          {myLocation && (
            <MapMarker
              position={myLocation}
              image={{
                src: "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png",
                size: { width: 24, height: 35 },
              }}
              title="현재 내 위치"
            />
          )}

          {/* 💡 [추가 4] 그려진 다각형에 마우스 클릭(onClick) 이벤트 추가 */}
          {analyzedZones.map((zone) => (
            <Polygon
              key={zone.id}
              path={zone.path}
              strokeWeight={selectedZone?.id === zone.id ? 4 : 2} // 클릭된 구역은 테두리를 두껍게!
              strokeColor={selectedZone?.id === zone.id ? "#000" : zone.color} // 클릭된 구역은 검은색 테두리 강조
              strokeOpacity={1.0}
              fillColor={zone.color}
              fillOpacity={0.7}
              onClick={() => setSelectedZone(zone)} // 다각형을 클릭하면 해당 구역 정보를 대시보드로 전송
            />
          ))}
        </Map>
      </div>
    </div>
  );
}

function LegendRow({ color, text }) {
  return (
    <div style={{ display: "flex", alignItems: "center", marginBottom: "3px" }}>
      <div
        style={{
          width: "40px",
          height: "20px",
          backgroundColor: color,
          border: "1px solid #ddd",
        }}
      ></div>
      <span style={{ marginLeft: "10px", fontSize: "13px", color: "#333" }}>
        {text}
      </span>
    </div>
  );
}

export default App;
