#!/usr/bin/env node
/**
 * proto-share — 자체완결형 React 프로토타입 페이지를
 * 단일 자체완결 HTML(모든 JS/CSS 인라인, 외부 요청 0)로 빌드한다.
 * 산출물은 Claude Artifact로 발행해 공유 링크로 쓴다.
 *
 * 사용법:
 *   yarn proto:share <pagePath> [--out <name>] [--title <title>]
 * 예:
 *   yarn proto:share pages/connect/schedule-group-edit/index.page.tsx --out schedule-group-edit
 */

import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
import * as esbuild from 'esbuild';

import { resolveCssFiles } from './css-manifest.mjs';
import { renderHtml } from './template.mjs';
import { validatePolicySummaries } from './validate-policy-summaries.mjs';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, '../..');

/* ---------- 지원하지 않는 입력(하드 블로커) ---------- */
const BLOCKERS = [
  { re: /@apollo\/client/, msg: 'Apollo(@apollo/client) 사용 — 네트워크 호출은 Artifact CSP에서 차단됩니다. 데이터를 인라인 mock으로 바꾸세요.' },
  { re: /@tanstack\/react-query/, msg: 'react-query 사용 — 네트워크 호출 차단. 데이터를 인라인 mock으로 바꾸세요.' },
  { re: /from\s+['"]@?\/?api\//, msg: 'api/(orval) 클라이언트 import — 네트워크 호출 차단. 데이터를 인라인 mock으로 바꾸세요.' },
  { re: /\baxios\b/, msg: 'axios 사용 — 네트워크 호출 차단. 데이터를 인라인 mock으로 바꾸세요.' },
  { re: /\bfetch\s*\(/, msg: 'fetch() 호출 — 네트워크 차단. 데이터를 인라인 mock으로 바꾸세요.' },
  { re: /\bXMLHttpRequest\b|\bWebSocket\b/, msg: 'XHR/WebSocket 사용 — 네트워크 차단.' },
  { re: /import\s+[^'"\n]*from\s+['"][^'"\n]*\.svg['"]/, msg: "SVG 파일 컴포넌트 import 감지 — esbuild엔 svgr 로더가 없습니다. SVG를 인라인 JSX로 바꾸세요." },
  { re: /@emotion\/|styled-components/, msg: 'emotion/styled-components 런타임 — Next 컴파일러 의존이라 단독 번들 불가. plain CSS로 바꾸세요.' },
  { re: /\bgetServerSideProps\b|\bgetStaticProps\b|\bgetInitialProps\b/, msg: 'Next 데이터 패칭(getServerSideProps 등) — 정적 번들에서 무의미합니다. 제거하세요.' },
  { re: /from\s+['"]next\//, msg: "next/* import(router/image/link/head/dynamic 등) — 단독 번들 불가. 프로토타입은 순수 React로 작성하세요." },
  { re: /@\/context\/|NavigationLayout/, msg: '프로젝트 provider(@/context/*, NavigationLayout 등) import — 앱 전체 그래프를 끌어와 실패합니다. 프로토타입은 자체완결로 작성하세요.' }
];

function fail(message) {
  console.error(`\n✗ proto-share 실패: ${message}\n`);
  process.exit(1);
}

/* ---------- 인자 파싱 ---------- */
function parseArgs(argv) {
  const args = { pagePath: null, out: null, title: null };
  const rest = argv.slice(2);

  for (let i = 0; i < rest.length; i += 1) {
    const token = rest[i];
    if (token === '--out') args.out = rest[(i += 1)];
    else if (token === '--title') args.title = rest[(i += 1)];
    else if (!args.pagePath) args.pagePath = token;
  }

  return args;
}

async function main() {
  const args = parseArgs(process.argv);

  if (!args.pagePath) {
    fail('페이지 경로가 필요합니다. 예) yarn proto:share pages/connect/register/index.page.tsx --out register');
  }

  const pageRel = args.pagePath.replace(/^\.\//, '');
  const pageAbs = path.resolve(REPO_ROOT, pageRel);

  if (!fs.existsSync(pageAbs)) {
    fail(`페이지를 찾을 수 없습니다: ${pageRel}`);
  }

  const outName =
    args.out || path.basename(path.dirname(pageRel)) || 'prototype';
  const title = args.title || outName;

  /* ---- 0) 공개 정책 요약 검증 ---- */
  let policySummaries;
  try {
    policySummaries = validatePolicySummaries(REPO_ROOT);
  } catch (error) {
    fail(`정책 요약 검증 실패 — ${error.message}`);
  }

  /* ---- 1) 프리플라이트 가드 ---- */
  const source = fs.readFileSync(pageAbs, 'utf8');
  for (const blocker of BLOCKERS) {
    if (blocker.re.test(source)) fail(blocker.msg);
  }

  const outDir = path.resolve(REPO_ROOT, 'out');
  const tmpDir = path.resolve(outDir, '.tmp');
  fs.mkdirSync(tmpDir, { recursive: true });

  /* ---- 2) 임시 엔트리 생성 ---- */
  const entryAbs = path.resolve(tmpDir, `entry-${outName}.jsx`);
  fs.writeFileSync(
    entryAbs,
    `import { createRoot } from 'react-dom/client';\n` +
      `import Page from ${JSON.stringify(pageAbs)};\n` +
      `createRoot(document.getElementById('root')).render(<Page />);\n`,
    'utf8'
  );

  /* ---- 3) esbuild 번들 ---- */
  let result;
  try {
    result = await esbuild.build({
      entryPoints: [entryAbs],
      bundle: true,
      write: false,
      format: 'iife',
      platform: 'browser',
      jsx: 'automatic',
      jsxDev: false,
      minify: true,
      target: ['es2019'],
      define: { 'process.env.NODE_ENV': '"production"' },
      loader: { '.svg': 'dataurl', '.png': 'dataurl', '.jpg': 'dataurl', '.gif': 'dataurl', '.md': 'text' },
      alias: { '@': REPO_ROOT },
      absWorkingDir: REPO_ROOT,
      legalComments: 'none'
    });
  } catch (error) {
    fail(`번들 실패 — ${error.message}`);
  } finally {
    fs.rmSync(entryAbs, { force: true });
  }

  const js = result.outputFiles[0].text;

  /* ---- 4) CSS 조립(CDN @import strip) ---- */
  const cssFiles = resolveCssFiles(pageRel);
  const cdnImportRe = /@import\s+url\(\s*['"]?https?:\/\/[^)]*\)\s*;?/gi;
  const css = cssFiles
    .map((rel) => {
      const abs = path.resolve(REPO_ROOT, rel);
      if (!fs.existsSync(abs)) fail(`CSS를 찾을 수 없습니다: ${rel}`);
      return `/* ${rel} */\n${fs.readFileSync(abs, 'utf8').replace(cdnImportRe, '')}`;
    })
    .join('\n\n');

  /* ---- 5) HTML 작성 ---- */
  const html = renderHtml({ title, css, js });
  const outPath = path.resolve(outDir, `${outName}.html`);
  fs.writeFileSync(outPath, html, 'utf8');

  /* ---- 6) 검증 출력(외부 리소스 로드 0이어야 함) ----
     w3.org 네임스페이스 URI나 코드 내 문자열(reactjs.org 등)은 네트워크 요청이 아니므로 제외하고,
     실제 로드를 유발하는 패턴만 센다: CSS url()/@import, <link>/<script>/<img> src·href. */
  const resourceRefRe =
    /url\(\s*['"]?https?:\/\/|@import\s+[^;]*https?:\/\/|(?:src|href)\s*=\s*['"]https?:\/\/|['"]\/\/cdn/gi;
  const externalRefs = (html.match(resourceRefRe) || []).length;
  const sizeKb = (Buffer.byteLength(html, 'utf8') / 1024).toFixed(1);

  console.log(`\n✓ proto-share 완료`);
  console.log(`  page   : ${pageRel}`);
  console.log(`  css    : ${cssFiles.join(', ')}`);
  console.log(`  output : ${outPath}`);
  console.log(`  size   : ${sizeKb} KB`);
  console.log(`  외부참조: ${externalRefs}${externalRefs === 0 ? ' (OK)' : ' ⚠ 0이어야 합니다!'}`);
  console.log(`  PRD 요약: ${policySummaries.map((item) => `${item.prdId}(${item.publicationStatus})`).join(', ')}`);
  console.log(`\n  → 이 경로를 Claude Artifact로 발행하면 공유 링크가 생성됩니다.\n`);

  if (externalRefs !== 0) process.exit(2);
}

main().catch((error) => fail(error.stack || error.message));
