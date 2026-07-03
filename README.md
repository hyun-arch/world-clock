# 🕐 World Clock · 세계 시계

한국 시간(KST)을 기준으로 전 세계 도시의 현재 시각·시차·업무시간을 한 화면에서 확인하는
시계 가젯입니다. **데스크톱 가젯(Windows)** 과 **크롬 익스텐션** 두 가지 형태로 제공됩니다.

> 목적: 해외 파트너와 컨퍼런스 콜/미팅을 잡을 때, 상대 도시의 현지 시각과
> "지금 연락해도 되는 시간인지"를 즉시 판단.

---

## 빠른 시작

### A. 데스크톱 가젯 (Windows) — 진짜 "항상 위에 뜨는" 가젯
```bash
# 방법 1) 설치 파일 실행 (권장)
dist/World Clock Setup 1.0.0.exe   더블클릭 → 설치 → 실행

# 방법 2) 개발자 방식
cd electron
npm install     # 최초 1회
npm start
```
- 📌 다른 모든 창 위에 표시 · 트레이 상주 · **시작 시 자동 실행** 지원
- 직접 설치 파일을 빌드하려면: `cd electron && npm run dist` → `dist/`에 `.exe` 생성
- 설치 없이 바로 실행: `dist/win-unpacked/World Clock.exe`

### B. 크롬 익스텐션 — 어느 PC에서든
```bash
node build/sync.mjs     # 공유 UI를 익스텐션 폴더로 동기화 (이미 반영됨)
```
1. 크롬 → `chrome://extensions`
2. **개발자 모드** 켜기
3. **압축해제된 확장 프로그램을 로드** → `chrome-extension` 폴더 선택
4. 새 탭 또는 툴바 아이콘(사이드 패널)에서 사용

---

## 기본 도시 & 기능
- **기본 시계**: 서울(기준) · 뉴욕 · 샌프란시스코 · 파리 — 그 외 80여 개 도시 검색 추가
- **한국 대비 시차**(`KST −7h`) · **업무시간 색상**(🟢🟡⚪) · **회의 시간 슬라이더** · **12/24 토글** · **날짜/요일** · **낮/밤**
- 서머타임(DST) 자동 반영 · 오프라인 동작 · 개인정보 외부 전송 없음

## 폴더 구조
```
shared/            UI 코어 (단일 소스): 시계 로직·화면·도시 데이터
electron/          데스크톱 가젯 래퍼 (main/preload/package.json)
chrome-extension/  크롬 익스텐션 (manifest/background + shared 복사본)
build/             sync(공유 복사)·테스트·미리보기 서버 스크립트
assets/            앱 아이콘(png/ico) + 생성 스크립트
docs/              기능정리(FEATURES.md)·사용 매뉴얼(.docx)·발표자료(.pptx)
dist/              빌드된 설치 파일(.exe) 및 win-unpacked
```

## 개발용 명령
```bash
node build/test-core.mjs      # 시차/업무시간 로직 단위 테스트 (20개)
node build/sync.mjs           # shared/ → 두 래퍼로 동기화
node build/static-server.mjs  # 브라우저 미리보기 (http://localhost:5177)
```

## 문서
- [docs/FEATURES.md](docs/FEATURES.md) — 전체 기능 정리
- `docs/사용_매뉴얼_World_Clock.docx` — 사용 매뉴얼
- `docs/발표자료_World_Clock.pptx` — 발표 자료
