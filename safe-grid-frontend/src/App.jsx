// 1. 필요한 도구들을 추가로 가져옵니다!
import { useRef } from "react"; // 💡 [추가] React에서 useRef 도구를 가져옵니다.
import {
  Map,
  MapMarker,
  Polygon,
  Polyline,
  CustomOverlayMap,
  ZoomControl,
  DrawingManager, // 💡 [추가] 그리기 도구 관리자 추가
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
    appkey: "22ff690840af34865670afb94e0d7c3a", // 본인 API KEY 유지!
    libraries: ["clusterer", "drawing", "services"],
  });

  // 💡 [추가] 그리기 도구를 조종할 리모컨 역할
  const managerRef = useRef(null);

  // 💡 [추가] '영역 그리기' 시작 버튼 함수
  const selectDrawPolygon = () => {
    const manager = managerRef.current;
    if (manager) {
      manager.cancel(); // 혹시 진행 중인 다른 그리기가 있으면 취소
      manager.select(window.kakao.maps.drawing.OverlayType.POLYGON); // 다각형 그리기 모드 켜기!
    }
  };

  // 💡 [수정] '데이터 뽑아내기' 버튼 함수 (시뮬레이션 기능 추가)
  const getPolygonData = () => {
    const manager = managerRef.current;
    if (manager) {
      const data = manager.getData();
      const polygonData = data[window.kakao.maps.drawing.OverlayType.POLYGON];

      if (polygonData && polygonData.length > 0) {
        // 1. 좌표 추출 (기존과 동일)
        const coords = polygonData[0].points;
        console.log("🎯 백엔드에 보낼 추출된 좌표들:", coords);

        // 2. [시뮬레이션] 백엔드에서 인구수를 계산해서 돌려줬다고 가정해 봅시다!
        // (0에서 30 사이의 랜덤한 숫자를 뽑아냅니다)
        const simulatedPeopleCount = Math.floor(Math.random() * 31);

        // 3. 뽑아낸 인원수로 색상을 판별합니다.
        const targetColor = getDensityColor(simulatedPeopleCount);

        // 4. 교수님께 보여드릴 멋진 결과 창 띄우기
        alert(
          `[분석 완료! 📊]\n\n백엔드 분석 결과, 지정하신 다각형 영역 안에는 약 ${simulatedPeopleCount}명의 인구가 밀집되어 있습니다.\n\n👉 따라서 이 영역은 좌측 범례 기준에 따라 '${targetColor}'으로 칠해져야 합니다!`,
        );
      } else {
        alert("먼저 지도 위에 다각형을 그려주세요!");
      }
    }
  }; // 💡 [추가] 인원수에 따라 사이드바 기준에 맞는 색상을 결정해 주는 함수
  const getDensityColor = (count) => {
    if (count === 0) return "하얀색 (#FFFFFF)";
    if (count >= 1 && count <= 5) return "연한 살구색 (#FFD1A9)";
    if (count >= 6 && count <= 10) return "주황색 (#FF9E5E)";
    if (count >= 11 && count <= 15) return "진한 주황색 (#FF5A36)";
    if (count >= 16 && count <= 25) return "빨간색 (#E83845)";
    if (count >= 26) return "진한 빨간색 (#BA1115)";
    return "알 수 없음";
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
            동성로 위험구역 정보
          </p>

          {/* 💡 [추가] 교수님이 원하셨던 영역 지정 버튼 UI */}
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
            🔍 영역 데이터 뽑아내기
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
          {/* 💡 [추가] 사용자가 영역을 그릴 수 있게 해주는 투명한 도화지 */}
          {window.kakao && window.kakao.maps && (
            <DrawingManager
              ref={managerRef}
              drawingMode={[window.kakao.maps.drawing.OverlayType.POLYGON]} // 다각형만 그리기 허용
              guideTooltip={["draw", "drag", "edit"]} // 마우스 따라다니는 도움말
              polygonOptions={{
                draggable: true, // 다 그리고 나서 도형 이동 가능
                removable: true, // 다 그리고 나서 삭제 가능
                editable: true, // 다 그리고 나서 모양 수정 가능
                strokeColor: "#39f",
                fillColor: "#39f",
                fillOpacity: 0.5,
              }}
            />
          )}

          {/* 3. 확대/축소 버튼 추가 */}
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

          {/* 4. 파란색 경로 선 (Polyline) 그리기 */}
          <Polyline
            path={routePath}
            strokeWeight={5}
            strokeColor={"#0054FF"}
            strokeOpacity={0.9}
            strokeStyle={"solid"}
          />

          {/* 5. '걸어서 8분' 툴팁 말풍선 */}
          <CustomOverlayMap
            position={{ lat: 35.8705, lng: 128.5948 }}
            yAnchor={1.5}
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
          </CustomOverlayMap>

          {/* 6. 출발지 배지 표시 (파란색) */}
          <CustomOverlayMap position={routePath[0]} yAnchor={2.5}>
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

          {/* 7. 도착지 배지 표시 (빨간색) */}
          <CustomOverlayMap
            position={routePath[routePath.length - 1]}
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
