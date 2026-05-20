def calculate_risk(
    d_skt: float | None = None,
    slope: float | None = None,
    weather: float | None = None,
) -> float:
    """Calculate a normalized risk score from density, slope, and weather.

    - Density is the primary crowd-risk driver.
    - Slope and weather are secondary factors that raise or lower risk.
    - Missing values are handled gracefully, so the formula still returns a risk
      score when only partial data is available.
    """

    def clamp(value: float, minimum: float = 0.0, maximum: float = 1.0) -> float:
        return max(min(value, maximum), minimum)

    # Defensive normalization for `d_skt`
    # 데이터를 받아올 수 없는 경우 평시상황을 가정하고 0.025 명/㎡로 초기화
    # (평시 밀집도는 약 0.02~0.03 명/㎡ 수준으로 가정)
    raw_density = d_skt if d_skt is not None else 0.025

    # Assuming 5.0 명/㎡ is the upper bound for normalization
    density_score = clamp(raw_density / 5.0)
    slope_score = clamp(slope or 0.0)

    # 날씨가 맑을 때는 0
    # 비가 오거나 눈이 오는 경우 위험도가 높아지므로 0.5 이상으로 가정
    # 불쾌지수가 높아서 위험도가 높아지는 경우는 0.3 이상으로 가정
    weather_score = clamp(weather or 0.0)

    env_score = clamp(
        (0.55 * weather_score) + (0.35 * slope_score) + (0.10 * slope_score * weather_score)
    )

    risk = (0.65 * density_score) + (0.30 * env_score) + (0.05 * density_score * env_score)
    return clamp(risk)