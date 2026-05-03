def calculate_risk(d_skt: float, vector: float, slope: float, weather: float) -> float:
    """
    환경 증폭 모델 (Multiplier Model)

    R = (α · D_skt + β · V) × (1 + γ · S + δ · W + ε · (S × W))

    기본 군중 위험도 (α · D_skt + β · V):
        - D_skt : SKT 혼잡도 기반 군중 밀도 (명/㎡)
        - V     : 동선 벡터 위험도 (이동 방향 충돌/꼬임 정도, 0~1)

    환경 위험 증폭 계수 (1 + γ·S + δ·W + ε·(S×W)):
        - S     : 경사도 위험 페널티 (0~1, 정규화된 경사도)
        - W     : 날씨 위험 페널티 (0~1, 시야 제한·우산 사용·빙판 등)
        - S × W : 상호작용 항 — 경사도와 악천후가 동시에 존재할 때
                  위험도가 기하급수적으로 폭증 (예: 가파른 경사 × 빙판/폭우)
    """
    # 가중치 설정
    alpha   = 0.6    # 군중 밀도 가중치
    beta    = 0.4    # 동선 벡터 가중치
    gamma   = 0.3    # 경사도 페널티 가중치
    delta   = 0.25   # 날씨 페널티 가중치
    epsilon = 0.15   # 경사도 × 날씨 상호작용 가중치

    # 기본 군중 위험도
    crowd_base = (alpha * d_skt) + (beta * vector)

    # 환경 위험 증폭 계수
    env_multiplier = 1 + (gamma * slope) + (delta * weather) + (epsilon * slope * weather)

    # 최종 위험도
    risk = crowd_base * env_multiplier

    return risk