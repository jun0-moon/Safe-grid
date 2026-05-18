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

export async function updateLocation(latitude, longitude) {
  return apiRequest("/api/v1/location", {
    method: "POST",
    body: JSON.stringify({ latitude, longitude }),
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
