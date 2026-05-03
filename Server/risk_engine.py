def calculate_risk(d_skt, d_app, slope, weather, vector):
    """
    R = (alpha * [D_skt + D_app]) + (beta * S) + (gamma * W) + (delta * V)
    """
    alpha, beta, gamma, delta = 0.4, 0.3, 0.2, 0.1
    risk = (alpha * (d_skt + d_app)) + (beta * slope) + (gamma * weather) + (delta * vector)
    return risk