# connect-sq-sandbox — 굿닥 커넥트 프로토타입 샌드박스

굿닥 커넥트(파트너스 웹뷰)의 **진료항목 → 카카오톡 예약하기 연동** 및 **예약 신청 내역** 프로토타입.
`react` 훅만 쓰는 **자체완결 React 화면**을, 모든 JS/CSS가 인라인된 **단일 HTML**(외부 요청 0)로 빌드한다.
빌드 산출물(`out/*.html`)은 브라우저로 바로 열리고, **GitHub Pages로도 서빙**된다.

## 공유 링크 (GitHub Pages)

- 랜딩: **https://connect-sq-sandbox.github.io/**
- 진료항목·카카오 노출 + 예약 신청 내역: **https://connect-sq-sandbox.github.io/out/ti-kakao.html**

> Pages 활성화: 레포 Settings → Pages → Source `main` / `/ (root)`. `*.github.io` 레포라 main 푸시 시 자동 배포된다. (루트 `.nojekyll`로 정적 파일 그대로 서빙)

## 프로토타입 목록

| 화면 | 소스 | 산출물 | 설명 |
|---|---|---|---|
| **진료항목 → 카카오 노출 + 예약 신청 내역** (현행) | `pages/connect/ti-kakao/index.page.tsx` | `out/ti-kakao.html` | 진료항목 목록(인입 채널 심볼 병합) · 진료항목 상세 폼("카카오톡 예약하기에서도 보이기" 토글 + 자동 매핑·규격 검증 + 굿닥 미리보기) · 예약 신청 내역(채널 컬럼·상세 모달). LNB로 화면 이동. |

> 방향: 굿닥 진료항목 정보를 기반으로 원하면 카카오에 노출(자동 매핑 + 규격 검증), 별도 카카오 상품 관리 메뉴 없이 진료항목 화면에 병합. 상세 기획은 `docs/` 참고.

## 시작하기

```bash
# 1) 의존성 설치 (esbuild + react)
yarn install     # 또는 npm install

# 2) 프로토타입 빌드 → out/<name>.html
yarn proto:share pages/connect/ti-kakao/index.page.tsx --out ti-kakao

# 3) 미리보기 (정적 서버, 네트워크 0)
yarn proto:preview
# http://localhost:4599/ti-kakao.html 열기
```

> 웹뷰 프레임이 1280px 고정이라, 미리보기 브라우저 창은 **1360px 이상**으로 열어야 레이아웃이 안 찌그러진다.

## 구조

```
pages/connect/<name>/index.page.tsx   # 프로토타입 화면 (자체완결 React, default export)
styles/                               # globals·connectShell(공용 셸/토큰) + 화면 전용 CSS
scripts/proto-share/                  # 빌드 파이프라인 (build.mjs·css-manifest·template·preview-server)
out/                                  # 빌드 산출물(*.html) — 그대로 열거나 공유
docs/                                 # 기획/기능정의서
```

## 새 프로토타입 추가

1. `pages/connect/<name>/index.page.tsx` 작성 (react 훅만, 인라인 SVG, plain CSS, 네트워크 0).
2. 화면 전용 CSS를 `styles/`에 두고 `scripts/proto-share/css-manifest.mjs`의 `SCREEN_CSS`에 `<name>` 키로 등록.
3. `yarn proto:share pages/connect/<name>/index.page.tsx --out <name>` → 끝에 `외부참조: 0 (OK)` 확인.

## 제약 (빌드 시 프리플라이트가 막음)

네트워크/데이터(@apollo·react-query·axios·fetch), SVG 파일 import, emotion/styled-components, `next/*`, `@/context/*` 등은 단독 번들 불가 → 인라인 mock·인라인 SVG·plain CSS로 작성한다.
