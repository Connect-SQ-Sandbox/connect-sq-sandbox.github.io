/**
 * 최종 단일 HTML 문자열을 만든다.
 * Claude Artifact가 doctype/html/head/body를 자동 래핑하므로,
 * 여기서는 page 콘텐츠(title + style + #root + script)만 출력한다.
 */

/**
 * @param {{ title: string, css: string, js: string }} parts
 * @returns {string}
 */
export function renderHtml({ title, css, js }) {
  // </script> 가 번들 문자열 안에 등장하면 스크립트가 조기 종료되므로 방어 치환.
  const safeJs = js.replace(/<\/script/gi, '<\\/script');

  return `<title>${escapeHtml(title)}</title>
<style>
${css}
</style>
<div id="root"></div>
<script>
${safeJs}
</script>
`;
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
