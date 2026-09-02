/**
 * 프로토타입 화면별로 인라인할 CSS 파일 순서를 정의한다.
 * 순서: 공용(globals -> connectShell) 다음에 화면 전용 CSS.
 * 키는 프로토타입 페이지 디렉터리명(pages/connect/<dir>)이다.
 */

/** 모든 connect 화면이 공유하는 기반 CSS (순서 유지) */
export const SHARED_CSS = ['styles/globals.css', 'styles/connectShell.css', 'styles/prototypeChanges.css'];

/** 페이지 디렉터리명 -> 화면 전용 CSS */
export const SCREEN_CSS = {
  'ti-category-map': ['styles/tiCategoryMap.css'],
  'ti-kakao': ['styles/connectRegister.css', 'styles/connectTiKakao.css'],
  'ti-category-c': ['styles/connectRegister.css', 'styles/connectAdminNonpayAug.css', 'styles/tiCategoryC.css'],
  'admin-nonpay-aug': ['styles/connectRegister.css', 'styles/connectAdminNonpayAug.css'],
  'kakao-booking': ['styles/kakaoBooking.css'],
  'kakao-booking-ticket': ['styles/kakaoBookingTicket.css'],
  'kakao-booking-skin': ['styles/kakaoBookingSkin.css'],
  'kakao-booking-skin-confirm': ['styles/kakaoBookingSkinConfirm.css'],
  'goodoc-webview': ['styles/goodocWebview.css'],
  'goodoc-webview-item': ['styles/goodocWebviewItem.css'],
  'kakao-link': ['styles/connectKakaoLink.css']
};

/**
 * 페이지 경로로부터 인라인할 CSS 파일 목록을 결정한다.
 * @param {string} pagePath - 예: pages/connect/ti-kakao/index.page.tsx
 * @returns {string[]} repo 루트 기준 상대 경로 배열
 */
export function resolveCssFiles(pagePath) {
  const match = pagePath.match(/pages\/connect\/([^/]+)\//);
  const dir = match ? match[1] : null;
  const screen = dir && SCREEN_CSS[dir] ? SCREEN_CSS[dir] : [];

  // 폼 단독 탐색 페이지: 공용 shell/드로어 CSS를 상속하지 않고 리셋(globals)만 사용
  if (dir === 'ti-category-map') return ['styles/globals.css', ...screen];

  return [...SHARED_CSS, ...screen];
}
