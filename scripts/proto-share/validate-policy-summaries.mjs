#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REQUIRED = ['summary_id', 'source_prd_id', 'source_version', 'source_status', 'target_release_at', 'visibility', 'publication_status'];
const ALLOWED_SOURCE_STATUS = new Set(['draft', 'review', 'approved', 'final', 'superseded', 'archived']);
const ALLOWED_PUBLICATION_STATUS = new Set(['baseline', 'approved', 'planned']);

function parseFrontmatter(source, file) {
  const match = source.match(/^---\s*\n([\s\S]*?)\n---\s*\n/);
  if (!match) throw new Error(`${file}: YAML frontmatter가 없습니다.`);
  const meta = {};
  match[1].split('\n').forEach((line) => {
    const i = line.indexOf(':');
    if (i < 0) return;
    meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  });
  return meta;
}

export function validatePolicySummaries(repoRoot) {
  const summaryDir = path.join(repoRoot, 'docs/policy-summaries');
  if (!fs.existsSync(summaryDir)) throw new Error('docs/policy-summaries 폴더가 없습니다.');

  const files = fs.readdirSync(summaryDir).filter((file) => file.endsWith('.md')).sort();
  if (files.length === 0) throw new Error('공개 정책 요약 Markdown이 없습니다.');

  return files.map((file) => {
    const source = fs.readFileSync(path.join(summaryDir, file), 'utf8');
    const meta = parseFrontmatter(source, file);
    REQUIRED.forEach((key) => {
      if (!meta[key]) throw new Error(`${file}: ${key} 메타데이터가 필요합니다.`);
    });
    if (meta.visibility !== 'public-summary') throw new Error(`${file}: visibility는 public-summary여야 합니다.`);
    if (!ALLOWED_SOURCE_STATUS.has(meta.source_status)) throw new Error(`${file}: 지원하지 않는 source_status입니다.`);
    if (!ALLOWED_PUBLICATION_STATUS.has(meta.publication_status)) throw new Error(`${file}: 지원하지 않는 publication_status입니다.`);
    if (meta.target_release_at !== 'null' && !/^\d{4}-\d{2}-\d{2}$/.test(meta.target_release_at)) throw new Error(`${file}: target_release_at은 YYYY-MM-DD 또는 null이어야 합니다.`);
    if (path.basename(file, '.md') !== meta.source_prd_id) throw new Error(`${file}: 파일명과 source_prd_id가 일치해야 합니다.`);
    if (!source.includes(`**PRD ID:** \`${meta.source_prd_id}\``)) throw new Error(`${file}: 본문에 독자가 볼 수 있는 PRD ID가 필요합니다.`);

    if (meta.publication_status === 'approved') {
      if (meta.source_status !== 'approved') throw new Error(`${file}: 승인 반영 요약의 source_status는 approved여야 합니다.`);
      if (!meta.approved_by || meta.approved_by === 'null') throw new Error(`${file}: 승인 반영 요약에 approved_by가 필요합니다.`);
      if (!meta.approved_at || meta.approved_at === 'null') throw new Error(`${file}: 승인 반영 요약에 approved_at이 필요합니다.`);
    }
    if (meta.publication_status === 'planned' && !['draft', 'review'].includes(meta.source_status)) {
      throw new Error(`${file}: 예정 요약의 source_status는 draft 또는 review여야 합니다.`);
    }
    return { file, prdId: meta.source_prd_id, publicationStatus: meta.publication_status };
  });
}

const currentFile = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === currentFile) {
  const repoRoot = path.resolve(path.dirname(currentFile), '../..');
  try {
    const summaries = validatePolicySummaries(repoRoot);
    console.log(`✓ 정책 요약 검증 완료: ${summaries.map((item) => `${item.prdId}(${item.publicationStatus})`).join(', ')}`);
  } catch (error) {
    console.error(`✗ 정책 요약 검증 실패: ${error.message}`);
    process.exit(1);
  }
}
