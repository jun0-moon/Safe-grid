const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const defaultOptions = {
    headers: {
      "Content-Type": "application/json",
    },
  };

  const finalOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...(options.headers || {}),
    },
  };

  try {
    const response = await fetch(url, finalOptions);
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("API Request Error:", error);
    throw error;
  }
}

export async function updateLocation(latitude, longitude, payload = {}) {
  return apiRequest("/api/v1/location", {
    method: "POST",
    body: JSON.stringify({
      user_id: payload.user_id ?? "zone_analysis",
      latitude,
      longitude,
      ...(payload.d_skt !== undefined ? { d_skt: payload.d_skt } : {}),
      ...(payload.slope !== undefined ? { slope: payload.slope } : {}),
      ...(payload.weather !== undefined ? { weather: payload.weather } : {}),
    }),
  });
}

export async function getDaeguWeather() {
  return apiRequest("/api/v1/weather/daegu", { method: "GET" });
}

export async function getRiskMap() {
  return apiRequest("/api/v1/risk-map", { method: "GET" });
}

export async function getPlaceCongestion(poiId, lat = null, lng = null) {
  const params = new URLSearchParams();
  if (lat !== null) params.append("lat", lat);
  if (lng !== null) params.append("lng", lng);

  const query = params.toString();
  const endpoint = `/api/v1/congestion/${poiId}${query ? "?" + query : ""}`;

  return apiRequest(endpoint, { method: "GET" });
}

export async function analyzeZone(zonePath, areaSqm) {
  const centerLat =
    zonePath.reduce((sum, p) => sum + p.lat, 0) / zonePath.length;
  const centerLng =
    zonePath.reduce((sum, p) => sum + p.lng, 0) / zonePath.length;

  return apiRequest("/api/v1/zone-analysis", {
    method: "POST",
    body: JSON.stringify({
      latitude: centerLat,
      longitude: centerLng,
      area_m2: areaSqm,
    }),
  });
}

export async function evaluateZoneRisk(zonePath) {
  // �ٰ��� �߽��� ���
  const centerLat =
    zonePath.reduce((sum, p) => sum + p.lat, 0) / zonePath.length;
  const centerLng =
    zonePath.reduce((sum, p) => sum + p.lng, 0) / zonePath.length;

  return apiRequest("/api/v1/location", {
    method: "POST",
    body: JSON.stringify({
      user_id: "zone_analysis",
      latitude: centerLat,
      longitude: centerLng,
      direction: 0.5,
      d_skt: 0,
      slope: 0,
      weather: 0,
    }),
  });
}
