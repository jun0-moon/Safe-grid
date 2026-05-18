import { useRef, useState, useEffect } from "react";
import {
  Map,
  MapMarker,
  Polygon,
  ZoomControl,
  DrawingManager,
  useKakaoLoader,
} from "react-kakao-maps-sdk";
import * as api from "./services/api";

function App() {
  const [loading, error] = useKakaoLoader({
    appkey: import.meta.env.VITE_KAKAO_JAVASCRIPT_KEY,
    libraries: ["clusterer", "drawing", "services"],
  });

  const managerRef = useRef(null);
  const [analyzedZones, setAnalyzedZones] = useState([]);

  // 서버 API 호출
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const result = await api.updateLocation(latitude, longitude);
          console.log("위치 전송 완료:", result);
        } catch (err) {
          console.error("위치 전송 실패:", err);
        }
      });
    }

    (async () => {
      try {
        const weather = await api.getDaeguWeather();
        console.log("날씨 정보:", weather);
      } catch (err) {
        console.error("날씨 정보 조회 실패:", err);
      }
    })();
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

        setAnalyzedZones((prev) => [
          ...prev,
          {
            path: formattedPath,
            color: targetColor,
            count: simulatedPeopleCount,
          },
        ]);

        alert(
          `[분석 완료! 📊]\n예상 밀집 인구: ${simulatedPeopleCount}명\n밀집도 기준에 맞춰 지도에 영역이 칠해졌습니다!`,
        );
      } else {
        alert("먼저 지도 위에 다각형을 그려주세요!");
      }
    }
  };

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
          <p style={{ margin: "0 0 20px 0", fontSize: "14px", color: "#555" }}>
            동성로 밀집도 분석 시스템
          </p>

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
              marginBottom: "25px",
              padding: "10px",
              backgroundColor: "#333",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            🔍 밀집도 분석 및 색칠하기
          </button>

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
          {window.kakao && window.kakao.maps && (
            <DrawingManager
              ref={managerRef}
              drawingMode={[window.kakao.maps.drawing.OverlayType.POLYGON]}
              guideTooltip={["draw", "drag", "edit"]}
              polygonOptions={{
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

          {/* 동성로 중심 마커 */}
          <MapMarker position={{ lat: 35.8714, lng: 128.5943 }} />

          {/* 사용자가 그리고 분석을 마친 다각형들 */}
          {analyzedZones.map((zone, index) => (
            <Polygon
              key={`analyzed-${index}`}
              path={zone.path}
              strokeWeight={2}
              strokeColor={zone.color}
              strokeOpacity={1.0}
              fillColor={zone.color}
              fillOpacity={0.7}
            />
          ))}
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
