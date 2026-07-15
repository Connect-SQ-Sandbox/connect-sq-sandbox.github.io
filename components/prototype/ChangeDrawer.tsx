import React, { useMemo, useState } from 'react';

export type PrototypeView = 'items-list' | 'items-form' | 'appt' | 'settings';
export type PublicationStatus = 'baseline' | 'approved' | 'planned';

export type PolicySource = {
  prdId: string;
  title: string;
  version: string;
  sourceStatus: 'draft' | 'review' | 'approved' | 'superseded' | 'archived';
  targetReleaseAt: string | null;
  sourcePath: string;
  summaryMarkdown: string;
};

export type PolicyChange = {
  id: string;
  prdId: string;
  date: string;
  prototypeVersion: string;
  view: PrototypeView;
  targetId: string;
  title: string;
  before: string;
  after: string;
  developerNotes?: string[];
  publicationStatus: PublicationStatus;
};

type Props = {
  currentView: PrototypeView;
  changes: PolicyChange[];
  sources: Record<string, PolicySource>;
  showPlanned: boolean;
  onShowPlannedChange: (show: boolean) => void;
  devMode: boolean;
  onDevModeChange: (show: boolean) => void;
  onLocate: (change: PolicyChange) => void;
};

const VIEW_LABEL: Record<PrototypeView, string> = {
  'items-list': '진료항목 목록',
  'items-form': '진료항목 상세',
  appt: '예약 신청 내역',
  settings: '운영 설정'
};

function stripFrontmatter(markdown: string) {
  return markdown.replace(/^---\s*\n[\s\S]*?\n---\s*\n/, '');
}

function Inline({ text }: { text: string }) {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g).filter(Boolean);
  return <>{parts.map((part, i) => {
    if (part.startsWith('`') && part.endsWith('`')) return <code key={i}>{part.slice(1, -1)}</code>;
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={i}>{part.slice(2, -2)}</strong>;
    return <React.Fragment key={i}>{part}</React.Fragment>;
  })}</>;
}

function MarkdownSummary({ markdown }: { markdown: string }) {
  const lines = stripFrontmatter(markdown).split('\n');
  return (
    <div className="pc-markdown">
      {lines.map((raw, i) => {
        const line = raw.trim();
        if (!line) return <div className="pc-md-gap" key={i} />;
        if (line.startsWith('### ')) return <h3 key={i}><Inline text={line.slice(4)} /></h3>;
        if (line.startsWith('## ')) return <h2 key={i}><Inline text={line.slice(3)} /></h2>;
        if (line.startsWith('# ')) return <h1 key={i}><Inline text={line.slice(2)} /></h1>;
        if (line.startsWith('> ')) return <blockquote key={i}><Inline text={line.slice(2)} /></blockquote>;
        if (line.startsWith('- ')) return <div className="pc-md-li" key={i}><span>•</span><p><Inline text={line.slice(2)} /></p></div>;
        return <p key={i}><Inline text={line} /></p>;
      })}
    </div>
  );
}

const PUBLISH_LABEL: Record<PublicationStatus, string> = {
  baseline: '현재 기준선',
  approved: '승인 반영',
  planned: '예정 · 확정 전'
};

const releaseLabel = (value: string | null) => value || '미정';

export function ChangeDrawer({ currentView, changes, sources, showPlanned, onShowPlannedChange, devMode, onDevModeChange, onLocate }: Props) {
  const [open, setOpen] = useState(false);
  const [scope, setScope] = useState<'current' | 'all'>('current');
  const [documentPrdId, setDocumentPrdId] = useState<string | null>(null);

  const available = useMemo(
    () => changes.filter((change) => showPlanned || change.publicationStatus !== 'planned'),
    [changes, showPlanned]
  );
  const visible = useMemo(
    () => available.filter((change) => scope === 'all' || change.view === currentView),
    [available, currentView, scope]
  );
  const currentCount = available.filter((change) => change.view === currentView).length;
  const plannedCount = new Set(changes.filter((change) => change.publicationStatus === 'planned').map((change) => change.prdId)).size;
  const documentSource = documentPrdId ? sources[documentPrdId] : null;

  const close = () => { setOpen(false); setDocumentPrdId(null); };
  const locate = (change: PolicyChange) => {
    close();
    onLocate(change);
  };

  return (
    <>
      <button className="pc-trigger" type="button" aria-label="정책 변경 내역 열기" aria-expanded={open} onClick={() => setOpen(true)}>
        <span className="pc-trigger-dot" />
        <span>변경사항</span>
        <span className="pc-trigger-count">{currentCount}</span>
      </button>

      {open && <button className="pc-scrim" type="button" aria-label="정책 변경 내역 닫기" onClick={close} />}

      <aside className={`pc-drawer${open ? ' open' : ''}`} aria-label="정책 변경 내역">
        <div className="pc-drawer-head">
          <div className="pc-eyebrow">PROTOTYPE POLICY LOG</div>
          <button className="pc-close" type="button" aria-label="닫기" onClick={close}>×</button>
        </div>

        <div className="pc-drawer-title-wrap">
              <h2>정책 변경 내역</h2>
              <p>현재 화면에 반영된 정책과 원본 PRD를 확인할 수 있어요.</p>
              <div className="pc-planned-filter">
                <div>
                  <strong>예정된 내용도 보기</strong>
                  <span>확정 전 PRD {plannedCount}건</span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-label="예정된 내용도 보기"
                  aria-checked={showPlanned}
                  className={`pc-switch${showPlanned ? ' on' : ''}`}
                  onClick={() => onShowPlannedChange(!showPlanned)}
                >
                  <span />
                </button>
              </div>
              {showPlanned && <div className="pc-planned-notice">예정 화면은 검토 중이며 실제 배포 시 변경될 수 있어요.</div>}
              <div className="pc-planned-filter pc-dev-filter">
                <div>
                  <strong>개발 검토용 보기</strong>
                  <span>화면 영역별 구현 정책과 데이터 처리 기준</span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-label="개발 검토용 보기"
                  aria-checked={devMode}
                  className={`pc-switch${devMode ? ' on' : ''}`}
                  onClick={() => onDevModeChange(!devMode)}
                >
                  <span />
                </button>
              </div>
              {devMode && <div className="pc-dev-notice">개발자 대상 구현 조건은 아래 정책 카드 안에서만 표시됩니다.</div>}
              <div className="pc-current-view">현재 화면 · {VIEW_LABEL[currentView]}</div>
            </div>

            <div className="pc-scope" role="tablist" aria-label="변경 범위">
              <button type="button" className={scope === 'current' ? 'active' : ''} onClick={() => setScope('current')}>현재 화면 <span>{currentCount}</span></button>
              <button type="button" className={scope === 'all' ? 'active' : ''} onClick={() => setScope('all')}>전체 <span>{available.length}</span></button>
            </div>

            <div className="pc-change-list">
              {visible.length === 0 && <div className="pc-empty">이 화면에 연결된 변경사항이 없습니다.</div>}
              {visible.map((change) => {
                const source = sources[change.prdId];
                return (
                  <article className={`pc-change-card${change.publicationStatus === 'planned' ? ' planned' : ''}`} key={change.id}>
                    <button className="pc-change-main" type="button" onClick={() => locate(change)}>
                      <div className="pc-change-meta">
                        <span className="pc-prd-id">PRD {change.prdId}</span>
                        <span className={`pc-publish ${change.publicationStatus}`}>{PUBLISH_LABEL[change.publicationStatus]}</span>
                        <time>{change.date}</time>
                      </div>
                      <h3>{change.title}</h3>
                      <div className="pc-diff before"><span>이전</span><p>{change.before}</p></div>
                      <div className="pc-diff after"><span>변경</span><p>{change.after}</p></div>
                      {devMode && change.developerNotes && change.developerNotes.length > 0 && (
                        <div className="pc-developer-details" aria-label="개발 검토 내용">
                          <div className="pc-developer-details-head"><span>DEV</span><strong>개발 검토 내용</strong></div>
                          <ul>{change.developerNotes.map((note, index) => <li key={index}><Inline text={note} /></li>)}</ul>
                        </div>
                      )}
                      <div className="pc-locate-hint">화면에서 위치 보기 →</div>
                    </button>
                    <div className="pc-change-foot">
                      <span>프로토타입 {change.prototypeVersion} · 예정 배포 {releaseLabel(source?.targetReleaseAt ?? null)}</span>
                      <button type="button" onClick={() => setDocumentPrdId(change.prdId)} disabled={!source}>PRD 문서 이동</button>
                    </div>
                  </article>
                );
              })}
        </div>
      </aside>

      {documentSource && (
        <div className="pc-document-overlay" role="presentation" onClick={() => setDocumentPrdId(null)}>
          <section className="pc-document-modal" role="dialog" aria-modal="true" aria-labelledby="pc-document-title" onClick={(e) => e.stopPropagation()}>
            <header className="pc-document-head">
              <div>
                <div className="pc-summary-meta">
                  <span className="pc-prd-id">PRD {documentSource.prdId}</span>
                  <span className={`pc-source-status ${documentSource.sourceStatus}`}>{documentSource.sourceStatus}</span>
                </div>
                <h2 id="pc-document-title">{documentSource.title}</h2>
                <p>Markdown 정책 문서 · {documentSource.version}</p>
              </div>
              <button className="pc-document-close" type="button" aria-label="정책 문서 닫기" onClick={() => setDocumentPrdId(null)}>×</button>
            </header>
            <div className="pc-document-body">
              <div className="pc-summary-source">원본 정책 경로: {documentSource.sourcePath}</div>
              <MarkdownSummary markdown={documentSource.summaryMarkdown} />
            </div>
          </section>
        </div>
      )}
    </>
  );
}
