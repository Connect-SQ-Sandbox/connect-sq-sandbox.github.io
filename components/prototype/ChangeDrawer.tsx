import React, { useMemo, useState } from 'react';

export type PrototypeView = 'items-list' | 'items-form' | 'appt' | 'settings';
export type PublicationStatus = 'baseline' | 'approved';

export type PolicySource = {
  prdId: string;
  title: string;
  version: string;
  sourceStatus: 'draft' | 'review' | 'approved' | 'superseded' | 'archived';
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
  publicationStatus: PublicationStatus;
};

type Props = {
  currentView: PrototypeView;
  changes: PolicyChange[];
  sources: Record<string, PolicySource>;
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

export function ChangeDrawer({ currentView, changes, sources, onLocate }: Props) {
  const [open, setOpen] = useState(false);
  const [scope, setScope] = useState<'current' | 'all'>('current');
  const [summaryPrdId, setSummaryPrdId] = useState<string | null>(null);

  const visible = useMemo(
    () => changes.filter((change) => scope === 'all' || change.view === currentView),
    [changes, currentView, scope]
  );
  const currentCount = changes.filter((change) => change.view === currentView).length;
  const summary = summaryPrdId ? sources[summaryPrdId] : null;

  const close = () => { setOpen(false); setSummaryPrdId(null); };
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
          {summary ? (
            <button className="pc-back" type="button" onClick={() => setSummaryPrdId(null)}>← 변경 목록</button>
          ) : <div className="pc-eyebrow">PROTOTYPE POLICY LOG</div>}
          <button className="pc-close" type="button" aria-label="닫기" onClick={close}>×</button>
        </div>

        {summary ? (
          <div className="pc-summary-view">
            <div className="pc-summary-meta">
              <span className="pc-prd-id">PRD {summary.prdId}</span>
              <span className={`pc-source-status ${summary.sourceStatus}`}>{summary.sourceStatus}</span>
            </div>
            <div className="pc-summary-source">원본: {summary.sourcePath}</div>
            <MarkdownSummary markdown={summary.summaryMarkdown} />
          </div>
        ) : (
          <>
            <div className="pc-drawer-title-wrap">
              <h2>정책 변경 내역</h2>
              <p>현재 화면에 반영된 정책과 원본 PRD를 확인할 수 있어요.</p>
              <div className="pc-current-view">현재 화면 · {VIEW_LABEL[currentView]}</div>
            </div>

            <div className="pc-scope" role="tablist" aria-label="변경 범위">
              <button type="button" className={scope === 'current' ? 'active' : ''} onClick={() => setScope('current')}>현재 화면 <span>{currentCount}</span></button>
              <button type="button" className={scope === 'all' ? 'active' : ''} onClick={() => setScope('all')}>전체 <span>{changes.length}</span></button>
            </div>

            <div className="pc-change-list">
              {visible.length === 0 && <div className="pc-empty">이 화면에 연결된 변경사항이 없습니다.</div>}
              {visible.map((change) => {
                const source = sources[change.prdId];
                return (
                  <article className="pc-change-card" key={change.id}>
                    <button className="pc-change-main" type="button" onClick={() => locate(change)}>
                      <div className="pc-change-meta">
                        <span className="pc-prd-id">PRD {change.prdId}</span>
                        <span className={`pc-publish ${change.publicationStatus}`}>{change.publicationStatus === 'approved' ? '승인 반영' : '현재 기준선'}</span>
                        <time>{change.date}</time>
                      </div>
                      <h3>{change.title}</h3>
                      <div className="pc-diff before"><span>이전</span><p>{change.before}</p></div>
                      <div className="pc-diff after"><span>변경</span><p>{change.after}</p></div>
                      <div className="pc-locate-hint">화면에서 위치 보기 →</div>
                    </button>
                    <div className="pc-change-foot">
                      <span>프로토타입 {change.prototypeVersion}</span>
                      <button type="button" onClick={() => setSummaryPrdId(change.prdId)} disabled={!source}>PRD 요약 보기</button>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </aside>
    </>
  );
}
