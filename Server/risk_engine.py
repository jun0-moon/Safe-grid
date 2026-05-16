def calculate_risk(d_skt: float, vector: float, slope: float, weather: float) -> float:
    """Calculate the final risk score using crowd and environment factors."""
    alpha = 0.6
    beta = 0.4
    gamma = 0.3
    delta = 0.25
    epsilon = 0.15

    crowd_base = (alpha * d_skt) + (beta * vector)
    env_multiplier = 1 + (gamma * slope) + (delta * weather) + (epsilon * slope * weather)

    return crowd_base * env_multiplier