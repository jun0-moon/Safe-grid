import { useRef, useState, useEffect } from "react";
import {
  Map,
  MapMarker,
  Polygon,
  ZoomControl,
  DrawingManager,
} from "react-kakao-maps-sdk";
import { getDaeguWeather, updateLocation } from "./services/api";

function App() {
  const managerRef = useRef(null);
  const [analyzedZones, setAnalyzedZones] = useState([]);
  const [myLocation, setMyLocation] = useState(null);
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

  // 💡 [해결 1] 그리기 버튼을 누르면 모든 기록을 깨끗하게 초기화합니다!
  const selectDrawRectangle = () => {
    const manager = managerRef.current;
    if (manager) {
      manager.cancel();

      // 1. 기존에 분석했던 색칠된 구역과 대시보드 데이터를 날려버림 (백지화)
      setAnalyzedZones([]);
      setSelectedZone(null);

      // 2. 지도 위에 지우다 만 파란색 스케치가 있다면 그것도 강제로 싹 지움
      const overlays =
        manager.getOverlays()[window.kakao.maps.drawing.OverlayType.RECTANGLE];
      if (overlays) {
        overlays.forEach((overlay) => manager.remove(overlay));
      }

      // 3. 깨끗해진 상태에서 다시 그리기 모드 시작
      manager.select(window.kakao.maps.drawing.OverlayType.RECTANGLE);
    }
  };

  const getRiskLevelInfo = (riskScore) => {
    if (riskScore < 0.2) {
      return {
        level: "1단계",
        risk: "안전",
        color: "#28a745",
        desc: "위험도가 낮은 상태",
      };
    } else if (riskScore < 0.45) {
      return {
        level: "2단계",
        risk: "주의",
        color: "#ffc107",
        desc: "주의가 필요한 상태",
      };
    } else if (riskScore < 0.7) {
      return {
        level: "3단계",
        risk: "경계",
        color: "#fd7e14",
        desc: "혼잡 또는 기상 영향이 커지는 상태",
      };
    } else {
      return {
        level: "4단계",
        risk: "위험",
        color: "#dc3545",
        desc: "즉시 주의가 필요한 상태",
      };
    }
  };

  const getWeatherIcon = (sky, precipitation) => {
    if (precipitation && precipitation !== "없음") {
      if (precipitation.includes("눈")) {
        return "🌨️";
      }
      if (precipitation.includes("비")) {
        return "🌧️";
      }
      return "🌦️";
    }

    if (sky === "맑음") {
      return "☀️";
    }

    if (sky === "구름많음") {
      return "⛅";
    }

    if (sky === "흐림") {
      return "☁️";
    }

    return "🌤️";
  };

  const formatWeatherData = (weatherResult) => {
    const summary = weatherResult?.summary ?? {};
    const sky = summary.sky ?? "알 수 없음";
    const precipitation = summary.precipitation ?? "알 수 없음";
    const fetched = weatherResult?.fetched ?? true;
    const statusSuffix = fetched ? "" : " (서버 실패)";

    return {
      condition: {
        sky,
        precipitation,
        status: `${sky}${statusSuffix}`,
        precipitationStatus: precipitation,
        icon: getWeatherIcon(sky, precipitation),
      },
      temperature: summary.temperature_celsius ?? "-",
      humidity: summary.humidity_percent ?? "-",
      windSpeed: summary.wind_speed_mps ?? "-",
      weatherRisk: weatherResult?.weather_risk ?? 0,
    };
  };

  const formatWeatherFallback = () => ({
    condition: {
      status: "날씨 조회 실패",
      icon: "⚠️",
    },
    temperature: "-",
    humidity: "-",
    windSpeed: "-",
    weatherRisk: 0,
  });

  const getRectangleData = async () => {
    const manager = managerRef.current;
    if (manager) {
      const data = manager.getData();
      const rectData = data[window.kakao.maps.drawing.OverlayType.RECTANGLE];

      if (rectData && rectData.length > 0) {
        const rect = rectData[rectData.length - 1];
        const start = rect.sPoint;
        const end = rect.ePoint;

        const formattedPath = [
          { lat: start.y, lng: start.x },
          { lat: start.y, lng: end.x },
          { lat: end.y, lng: end.x },
          { lat: end.y, lng: start.x },
        ];

        const centerLat = (start.y + end.y) / 2;
        const centerLng = (start.x + end.x) / 2;
        const simulatedPeopleCount = Math.floor(Math.random() * 1000) + 50;
        const simulatedArea = Math.floor(Math.random() * 10000) + 1000;
        const calculatedDensity = Number(
          (simulatedPeopleCount / simulatedArea).toFixed(3),
        );

        let weather = formatWeatherFallback();
        try {
          const weatherResult = await getDaeguWeather();
          weather = formatWeatherData(weatherResult);
        } catch (error) {
          console.error("날씨 정보를 불러오지 못했습니다.", error);
        }

        let locationRisk = { risk_score: 0 };
        try {
          locationRisk = await updateLocation(centerLat, centerLng, {
            user_id: "zone_analysis",
            d_skt: calculatedDensity,
            slope: 0,
            weather: weather.weatherRisk,
          });
        } catch (error) {
          console.error("위험도 정보를 불러오지 못했습니다.", error);
        }

        const levelInfo = getRiskLevelInfo(locationRisk.risk_score ?? 0);

        const newZoneData = {
          id: Date.now(),
          path: formattedPath,
          color: levelInfo.color,
          count: simulatedPeopleCount,
          area: simulatedArea,
          density: calculatedDensity.toFixed(3),
          levelInfo,
          weather,
          riskScore: locationRisk.risk_score ?? 0,
        };

        setAnalyzedZones((prev) => [...prev, newZoneData]);
        setSelectedZone(newZoneData);

        const overlays =
          manager.getOverlays()[
            window.kakao.maps.drawing.OverlayType.RECTANGLE
          ];
        if (overlays) {
          overlays.forEach((overlay) => manager.remove(overlay));
        }

        alert(
          `[분석 완료! 📊]\n위험도: ${levelInfo.risk}\n우측 상단 알림판과 좌측 대시보드를 확인하세요.`,
        );
      } else {
        alert("먼저 지도 위에 직사각형을 그려주세요!");
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
      {/* --- 좌측 사이드바 영역 --- */}
      <div
        style={{
          width: "350px",
          borderRight: "2px solid #333",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#f8f9fa",
          zIndex: 10,
        }}
      >
        <div
          style={{
            padding: "20px",
            backgroundColor: "#fff",
            borderBottom: "1px solid #ddd",
          }}
        >
          <h2
            style={{ margin: "0 0 15px 0", fontSize: "22px", color: "#2c3e50" }}
          >
            Safe-Grid 분석
          </h2>
          <button
            onClick={selectDrawRectangle}
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
            ✏️ 직사각형 영역 그리기
          </button>
          <button
            onClick={getRectangleData}
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
                  margin: "0 0 15px 0",
                  fontSize: "16px",
                  color: "#0054FF",
                }}
              >
                📍 구역 밀집도 Raw Data
              </h3>

              <div
                style={{
                  paddingBottom: "15px",
                  borderBottom: "1px solid #eee",
                  marginBottom: "15px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "5px",
                    fontSize: "14px",
                  }}
                >
                  <span style={{ color: "#666" }}>추정 방문자 수</span>
                  <strong>{selectedZone.count} 명</strong>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "10px",
                    fontSize: "14px",
                  }}
                >
                  <span style={{ color: "#666" }}>추정 연면적</span>
                  <strong>{selectedZone.area.toLocaleString()} ㎡</strong>
                </div>

                <div
                  style={{
                    backgroundColor: "#f8f9fa",
                    padding: "10px",
                    borderRadius: "5px",
                    border: "1px solid #e9ecef",
                  }}
                >
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#868e96",
                      marginBottom: "3px",
                    }}
                  >
                    혼잡도 수치 (인원/면적)
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      justifyContent: "space-between",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "24px",
                        fontWeight: "bold",
                        color: selectedZone.color,
                      }}
                    >
                      {selectedZone.density}{" "}
                      <span style={{ fontSize: "14px", color: "#495057" }}>
                        명/㎡
                      </span>
                    </span>
                    <span
                      style={{
                        padding: "3px 8px",
                        backgroundColor: selectedZone.color,
                        color: "#fff",
                        borderRadius: "12px",
                        fontSize: "12px",
                        fontWeight: "bold",
                      }}
                    >
                      {selectedZone.levelInfo.level} (
                      {selectedZone.levelInfo.risk})
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#495057",
                      marginTop: "8px",
                      fontWeight: "bold",
                    }}
                  >
                    👉 "{selectedZone.levelInfo.desc}"
                  </div>
                </div>
              </div>

              <div>
                <span
                  style={{
                    fontSize: "13px",
                    color: "#666",
                    display: "block",
                    marginBottom: "10px",
                  }}
                >
                  기상청 Open API 기반 데이터
                </span>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: "8px",
                  }}
                >
                  <span style={{ fontSize: "24px", marginRight: "10px" }}>
                    {selectedZone.weather.condition.icon}
                  </span>
                  <strong style={{ fontSize: "15px" }}>
                    {selectedZone.weather.condition.status}
                  </strong>
                </div>
                <div
                  style={{
                    marginBottom: "10px",
                    fontSize: "13px",
                    color: "#495057",
                    lineHeight: 1.5,
                  }}
                >
                  <div>하늘 상태: {selectedZone.weather.condition.sky}</div>
                  <div>
                    강수 상태:{" "}
                    {selectedZone.weather.condition.precipitationStatus}
                  </div>
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gap: "8px",
                    fontSize: "13px",
                    textAlign: "center",
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
                      기온
                    </div>
                    <div style={{ fontWeight: "bold", marginTop: "3px" }}>
                      {selectedZone.weather.temperature}℃
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
                      습도
                    </div>
                    <div style={{ fontWeight: "bold", marginTop: "3px" }}>
                      {selectedZone.weather.humidity}%
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
                      풍속
                    </div>
                    <div style={{ fontWeight: "bold", marginTop: "3px" }}>
                      {selectedZone.weather.windSpeed}m/s
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
                산출 근거(Raw Data)가 표시됩니다.
              </p>
            </div>
          )}

          <div style={{ marginTop: "30px" }}>
            <h4
              style={{
                fontWeight: "bold",
                fontSize: "15px",
                borderBottom: "2px solid #333",
                paddingBottom: "8px",
                marginBottom: "15px",
              }}
            >
              혼잡도 수준 기준 (명/㎡)
            </h4>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              <LegendRow
                color="#28a745"
                level="1단계"
                range="0.025 미만"
                desc="전방 시야 트임"
              />
              <LegendRow
                color="#ffc107"
                level="2단계"
                range="0.025 ~ 0.05 미만"
                desc="시야 다소 막힘"
              />
              <LegendRow
                color="#fd7e14"
                level="3단계"
                range="0.05 ~ 0.3 미만"
                desc="다소 혼잡 (부딪힘)"
              />
              <LegendRow
                color="#dc3545"
                level="4단계"
                range="0.3 이상"
                desc="매우 혼잡 (불쾌함)"
              />
            </div>
          </div>
        </div>
      </div>

      {/* --- 우측 지도 영역 --- */}
      <div style={{ flex: 1, position: "relative" }}>
        <div
          style={{
            position: "absolute",
            top: "20px",
            right: "20px",
            zIndex: 10,
            backgroundColor: "white",
            padding: "15px",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            width: "160px",
          }}
        >
          <h4
            style={{
              margin: "0 0 12px 0",
              fontSize: "15px",
              textAlign: "center",
              color: "#333",
            }}
          >
            🚨 실시간 위험도
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <RiskLevelRow
              currentRisk={selectedZone?.levelInfo?.risk}
              targetRisk="안전"
              color="#28a745"
            />
            <RiskLevelRow
              currentRisk={selectedZone?.levelInfo?.risk}
              targetRisk="주의"
              color="#ffc107"
            />
            <RiskLevelRow
              currentRisk={selectedZone?.levelInfo?.risk}
              targetRisk="경계"
              color="#fd7e14"
            />
            <RiskLevelRow
              currentRisk={selectedZone?.levelInfo?.risk}
              targetRisk="위험"
              color="#dc3545"
            />
          </div>
        </div>

        <Map
          center={myLocation ? myLocation : { lat: 35.8714, lng: 128.5943 }}
          style={{ width: "100%", height: "100%" }}
          level={4}
        >
          {window.kakao && window.kakao.maps && (
            <DrawingManager
              ref={managerRef}
              drawingMode={[window.kakao.maps.drawing.OverlayType.RECTANGLE]}
              guideTooltip={["draw", "drag", "edit"]}
              rectangleOptions={{
                draggable: true,
                removable: true,
                editable: true,
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

          {analyzedZones.map((zone) => (
            <Polygon
              key={zone.id}
              path={zone.path}
              strokeWeight={selectedZone?.id === zone.id ? 4 : 2}
              strokeColor={selectedZone?.id === zone.id ? "#000" : zone.color}
              strokeOpacity={1.0}
              fillColor={zone.color}
              fillOpacity={0.7}
              onClick={() => setSelectedZone(zone)}
            />
          ))}
        </Map>
      </div>
    </div>
  );
}

function LegendRow({ color, level, range, desc }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start" }}>
      <div
        style={{
          width: "16px",
          height: "16px",
          backgroundColor: color,
          borderRadius: "50%",
          marginTop: "3px",
          flexShrink: 0,
        }}
      ></div>
      <div style={{ marginLeft: "10px" }}>
        <div style={{ fontSize: "13px", fontWeight: "bold", color: "#333" }}>
          {level}{" "}
          <span style={{ fontWeight: "normal", color: "#666" }}>({range})</span>
        </div>
        <div style={{ fontSize: "11px", color: "#868e96", marginTop: "2px" }}>
          {desc}
        </div>
      </div>
    </div>
  );
}

function RiskLevelRow({ currentRisk, targetRisk, color }) {
  const isActive = currentRisk === targetRisk;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "8px 0",
        backgroundColor: isActive ? color : "#f8f9fa",
        color: isActive ? "#fff" : "#adb5bd",
        borderRadius: "6px",
        border: isActive ? `2px solid ${color}` : "1px solid #e9ecef",
        transition: "all 0.3s ease",
        fontWeight: isActive ? "bold" : "normal",
        boxShadow: isActive ? `0 0 10px ${color}80` : "none",
      }}
    >
      <span style={{ fontSize: "14px", letterSpacing: "2px" }}>
        {targetRisk}
      </span>
    </div>
  );
}

export default App;
