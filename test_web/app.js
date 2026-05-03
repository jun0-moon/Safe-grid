// ==========================================
// Safe-Grid Frontend Application
// ==========================================

const API_BASE = window.location.origin;

// ==========================================
// 혼잡도 조회
// ==========================================
async function fetchCongestion() {
    const poiId = document.getElementById('poi-input').value.trim();
    if (!poiId) {
        showError('POI ID를 입력해주세요.');
        return;
    }

    const lat = document.getElementById('lat-input').value;
    const lng = document.getElementById('lng-input').value;

    const btn = document.getElementById('search-btn');
    btn.classList.add('loading');
    btn.innerHTML = '<span class="spinner"></span><span>조회 중...</span>';

    setStatus('loading');

    try {
        let url = `${API_BASE}/api/v1/congestion/${poiId}`;
        const params = new URLSearchParams();
        if (lat) params.append('lat', lat);
        if (lng) params.append('lng', lng);
        if (params.toString()) url += `?${params}`;

        const response = await fetch(url);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `서버 응답 오류 (${response.status})`);
        }

        const data = await response.json();
        renderCongestionResult(data);
        setStatus('connected');
    } catch (error) {
        showError(error.message);
        setStatus('error');
    } finally {
        btn.classList.remove('loading');
        btn.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
            <span>조회</span>`;
    }
}

// ==========================================
// 결과 렌더링
// ==========================================
function renderCongestionResult(data) {
    const section = document.getElementById('result-section');
    section.style.display = 'block';

    // 장소 정보
    document.getElementById('place-name').textContent = data.poi_name || '알 수 없는 장소';
    document.getElementById('place-id').textContent = `POI: ${data.poi_id}`;

    // 마지막 갱신 시간
    if (data.congestion_data && data.congestion_data.length > 0) {
        const dt = data.congestion_data[0].datetime;
        document.getElementById('last-update-time').textContent = formatDatetime(dt);
    }

    // 카드 그리드
    const grid = document.getElementById('cards-grid');
    grid.innerHTML = '';

    if (!data.congestion_data || data.congestion_data.length === 0) {
        grid.innerHTML = `
            <div class="congestion-card">
                <p style="color: var(--color-text-dim); text-align: center; padding: 24px 0;">
                    혼잡도 데이터가 없습니다.
                </p>
            </div>`;
        return;
    }

    data.congestion_data.forEach((item, index) => {
        const card = createCongestionCard(item, index);
        grid.appendChild(card);
    });

    // 스크롤 이동
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function createCongestionCard(item, index) {
    const card = document.createElement('div');
    const level = item.congestion_level || 1;
    card.className = `congestion-card level-${level}`;
    card.style.animationDelay = `${index * 0.1}s`;
    card.style.animation = `fadeSlideUp 0.5s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.1}s both`;

    const isPlace = item.type === '장소 혼잡도';
    const typeClass = isPlace ? 'place' : 'area';
    const typeIcon = isPlace
        ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>'
        : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>';

    const levelEmojis = { 1: '😊', 2: '🙂', 3: '😟', 4: '😰' };
    const barWidths = { 1: '25%', 2: '50%', 3: '75%', 4: '100%' };

    const congestionValue = item.congestion != null ? item.congestion.toFixed(5) : '-';

    card.innerHTML = `
        <div class="card-type ${typeClass}">
            ${typeIcon}
            ${item.type}
        </div>
        <div class="card-main">
            <div>
                <span class="card-value">${congestionValue}</span>
                <span class="card-unit">명/㎡</span>
            </div>
            <div class="card-badge level-${level}">
                <span>${levelEmojis[level] || '❓'}</span>
                <span>${item.congestion_label}</span>
            </div>
        </div>
        <div class="card-bar-track">
            <div class="card-bar-fill level-${level}" style="width: ${barWidths[level]}"></div>
        </div>
    `;

    return card;
}

// ==========================================
// 위험도 조회
// ==========================================
async function fetchRisk() {
    const userId = document.getElementById('user-id-input').value.trim() || 'user_001';
    const lat = parseFloat(document.getElementById('risk-lat').value) || 37.5665;
    const lng = parseFloat(document.getElementById('risk-lng').value) || 126.9780;
    const direction = parseFloat(document.getElementById('risk-dir').value) || 0.0;

    try {
        const response = await fetch(`${API_BASE}/api/v1/location`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: userId,
                latitude: lat,
                longitude: lng,
                direction: direction,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `서버 응답 오류 (${response.status})`);
        }

        const data = await response.json();
        renderRiskResult(data);
        setStatus('connected');
    } catch (error) {
        showError(error.message);
        setStatus('error');
    }
}

function renderRiskResult(data) {
    const resultDiv = document.getElementById('risk-result');
    resultDiv.style.display = 'block';

    const score = data.risk_score || 0;
    const percent = Math.round(score * 100);

    // 원형 게이지 애니메이션
    const circle = document.getElementById('risk-circle');
    const circumference = 2 * Math.PI * 52; // r=52
    const offset = circumference - (score * circumference);
    circle.style.strokeDashoffset = offset;

    // 색상 결정
    let color;
    if (score < 0.3) color = '#00D2D3';
    else if (score < 0.6) color = '#FECA57';
    else if (score < 0.8) color = '#FF9F43';
    else color = '#FF6B6B';

    circle.style.stroke = color;

    // 숫자 애니메이션
    animateValue('risk-value', 0, percent, 800);

    // 레드존 표시
    const zoneEl = document.getElementById('risk-zone');
    if (data.is_red_zone) {
        zoneEl.textContent = '⚠️ 레드존';
        zoneEl.className = 'risk-zone danger';
    } else {
        zoneEl.textContent = '✅ 안전 구역';
        zoneEl.className = 'risk-zone safe';
    }
}

function animateValue(elementId, start, end, duration) {
    const el = document.getElementById(elementId);
    const range = end - start;
    const startTime = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // ease-out
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(start + range * eased);
        el.textContent = `${current}%`;
        if (progress < 1) requestAnimationFrame(update);
    }

    requestAnimationFrame(update);
}

// ==========================================
// 유틸리티
// ==========================================
function quickSearch(poiId, name) {
    document.getElementById('poi-input').value = poiId;
    fetchCongestion();
}

function formatDatetime(dt) {
    if (!dt || dt.length < 14) return dt || '-';
    const y = dt.slice(0, 4);
    const m = dt.slice(4, 6);
    const d = dt.slice(6, 8);
    const h = dt.slice(8, 10);
    const mi = dt.slice(10, 12);
    const s = dt.slice(12, 14);
    return `${y}-${m}-${d} ${h}:${mi}:${s}`;
}

function setStatus(state) {
    const dot = document.getElementById('status-dot');
    const text = document.getElementById('status-text');

    dot.className = 'status-dot';

    switch (state) {
        case 'connected':
            dot.classList.add('connected');
            text.textContent = '서버 연결됨';
            break;
        case 'error':
            dot.classList.add('error');
            text.textContent = '연결 오류';
            break;
        case 'loading':
            text.textContent = '요청 중...';
            break;
        default:
            text.textContent = '연결 대기';
    }
}

let errorTimeout;
function showError(message) {
    const toast = document.getElementById('error-toast');
    document.getElementById('error-message').textContent = message;
    toast.style.display = 'flex';
    toast.style.animation = 'none';
    toast.offsetHeight; // reflow
    toast.style.animation = 'toast-in 0.4s cubic-bezier(0.4,0,0.2,1) forwards';

    clearTimeout(errorTimeout);
    errorTimeout = setTimeout(() => {
        toast.style.display = 'none';
    }, 5000);
}

// Enter 키로 검색
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('poi-input').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') fetchCongestion();
    });
});
