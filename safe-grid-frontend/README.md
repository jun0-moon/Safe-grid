# Safe-Grid 프론트엔드

안전한 군중 관리를 위한 실시간 위험 지도 서비스입니다.

## 📋 사전 준비물

다음이 설치되어 있는지 확인하세요:

- **Node.js** (v14 이상) - [다운로드](https://nodejs.org)
- **npm** (Node.js와 함께 설치됨)

설치 확인:
```bash
node --version
npm --version
```

## 🚀 빠른 시작 (3단계)

### 1️⃣ 프로젝트 폴더로 이동

```bash
cd c:\Users\User\Desktop\Safe-grid\safe-grid-frontend
```

또는 VS Code에서 `safe-grid-frontend` 폴더를 먼저 열고, 터미널에서 실행해도 됩니다.

### 2️⃣ npm 의존성 설치

```bash
npm install
```

**이 명령어가 하는 일:**
- `package.json` 파일을 읽음
- 필요한 모든 패키지(React, Vite, Kakao Maps SDK 등)를 다운로드
- `node_modules` 폴더에 설치

⏳ 처음 실행 시 1-2분 정도 소요됩니다.

설치가 완료되면 `added XXX packages` 메시지가 나타납니다.

### 3️⃣ 개발 서버 실행

```bash
npm run dev
```

**성공 메시지 예시:**
```
  VITE v8.0.11  ready in 645 ms

  ➜  Local:   http://localhost:5174/
  ➜  Network: use --host to expose
```

✅ 완료! 이제 브라우저에서 `http://localhost:5174` 로 접속하면 됩니다.

---

## 📖 자주 묻는 질문 (FAQ)

### Q1: 'vite' 명령어를 찾을 수 없다는 오류가 나요
**A:** `npm install`을 먼저 실행했는지 확인하세요.
```bash
npm install
npm run dev
```

### Q2: 포트가 5173 대신 5174로 나왔어요
**A:** 정상입니다. 포트 5173이 이미 사용 중이면 Vite가 자동으로 5174를 사용합니다.

### Q3: Kakao Maps 오류가 발생해요
**A:** 다음을 확인하세요:
1. [Kakao 개발자 센터](https://developers.kakao.com) 접속
2. 앱 설정 → 플랫폼 → Web
3. 도메인 목록에 `http://localhost:5174` 추가

### Q4: 코드를 수정했는데 화면에 반영이 안 돼요
**A:** 자동 새로고침이 안 되면 수동으로 `F5` 키를 눌러 새로고침하세요.

### Q5: 개발 서버를 종료하려면?
**A:** 터미널에서 `Ctrl + C` 키를 누르세요.

---

## 🛠️ 기타 명령어

| 명령어 | 설명 |
|--------|------|
| `npm run dev` | 개발 서버 실행 (핫 리로드 지원) |
| `npm run build` | 프로덕션 빌드 (배포용) |
| `npm run preview` | 빌드된 파일 미리보기 |

---

## 📁 프로젝트 구조

```
safe-grid-frontend/
├── src/
│   ├── App.jsx           # 메인 지도 컴포넌트
│   ├── main.jsx          # 진입점
│   └── ...
├── public/               # 정적 파일
├── index.html            # HTML 템플릿
├── package.json          # 의존성 설정 파일
├── vite.config.js        # Vite 설정
└── README.md             # 이 파일
```

---

## 🔗 유용한 링크

- [React 공식 문서](https://react.dev)
- [Vite 공식 문서](https://vitejs.dev)
- [React Kakao Maps SDK](https://react-kakao-maps-sdk.jaeseokim.dev)

---

## 💡 팁

**백엔드 서버와 함께 실행:**

터미널을 2개 열고:
- 터미널 1: `npm run dev` (프론트엔드)
- 터미널 2: `cd ../Server && python main.py` (백엔드)

---

**문제가 발생하면 개발자 도구를 확인하세요:**
- `F12` 키를 누르기
- Console, Network, Application 탭 확인
