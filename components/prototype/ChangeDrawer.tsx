import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

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

type DeveloperMarker = {
  id: string;
  number: number;
  prdId: string;
  view: PrototypeView;
  targetId: string;
  title: string;
  notes: string[];
};

type PositionedDeveloperMarker = DeveloperMarker & {
  top: number;
  left: number;
  horizontal: 'left' | 'right';
  vertical: 'above' | 'below';
};

const markerPositionsEqual = (before: PositionedDeveloperMarker[], after: PositionedDeveloperMarker[]) => (
  before.length === after.length && before.every((marker, index) => {
    const next = after[index];
    return marker.id === next.id
      && marker.number === next.number
      && marker.prdId === next.prdId
      && marker.title === next.title
      && marker.notes.join('\u0000') === next.notes.join('\u0000')
      && marker.top === next.top
      && marker.left === next.left
      && marker.horizontal === next.horizontal
      && marker.vertical === next.vertical;
  })
);

function DeveloperPolicyOverlay({ markers }: { markers: DeveloperMarker[] }) {
  const [positions, setPositions] = useState<PositionedDeveloperMarker[]>([]);

  useEffect(() => {
    setPositions([]);
    let frame = 0;
    const observed = new Set<Element>();
    let resizeObserver: ResizeObserver | null = null;

    const schedule = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(measure);
    };

    if ('ResizeObserver' in window) resizeObserver = new ResizeObserver(schedule);

    function measure() {
      const drawer = document.querySelector<HTMLElement>('.pc-drawer.open');
      const drawerLeft = drawer?.getBoundingClientRect().left;
      const visibleRightBoundary = drawerLeft && drawerLeft > 0 ? drawerLeft : window.innerWidth;
      const modalLayers = Array.from(document.querySelectorAll<HTMLElement>('.ap-dim')).filter((element) => {
        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);
        return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
      });
      const activeModal = modalLayers[modalLayers.length - 1] || null;

      const next = markers.flatMap<PositionedDeveloperMarker>((marker) => {
        const targets = Array.from(document.querySelectorAll<HTMLElement>('[data-policy-id]'));
        const target = targets.find((element) => element.dataset.policyId === marker.targetId);
        if (!target || (activeModal && !activeModal.contains(target))) return [];

        if (resizeObserver && !observed.has(target)) {
          resizeObserver.observe(target);
          observed.add(target);
        }

        const rect = target.getBoundingClientRect();
        const visibleLeft = Math.max(rect.left, 0);
        const visibleTop = Math.max(rect.top, 0);
        const visibleRight = Math.min(rect.right, visibleRightBoundary);
        const visibleBottom = Math.min(rect.bottom, window.innerHeight);
        if (visibleRight <= visibleLeft || visibleBottom <= visibleTop || rect.width <= 0 || rect.height <= 0) return [];

        const left = Math.round(Math.min(Math.max(visibleRight - 18, 12), Math.max(12, visibleRightBoundary - 42)));
        const top = Math.round(Math.min(Math.max(visibleTop + 12, 12), window.innerHeight - 42));
        const spaceRight = visibleRightBoundary - left;
        const spaceLeft = left + 30;
        const spaceBelow = window.innerHeight - top - 30;
        const spaceAbove = top;

        return [{
          ...marker,
          top,
          left,
          horizontal: spaceRight >= 350 || spaceRight >= spaceLeft ? 'right' : 'left',
          vertical: spaceBelow >= 260 || spaceBelow >= spaceAbove ? 'below' : 'above'
        }];
      });

      setPositions((before) => markerPositionsEqual(before, next) ? before : next);
    }

    const mutationObserver = new MutationObserver((mutations) => {
      const hasRelevantMutation = mutations.some((mutation) => {
        const target = mutation.target instanceof Element ? mutation.target : mutation.target.parentElement;
        return !target?.closest('.pc-dev-marker-layer');
      });
      if (hasRelevantMutation) schedule();
    });

    window.addEventListener('resize', schedule);
    document.addEventListener('scroll', schedule, true);
    mutationObserver.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
    schedule();

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('resize', schedule);
      document.removeEventListener('scroll', schedule, true);
      mutationObserver.disconnect();
      resizeObserver?.disconnect();
    };
  }, [markers]);

  if (typeof document === 'undefined' || positions.length === 0) return null;

  return createPortal(
    <div className="pc-dev-marker-layer" aria-label="개발 구현 조건 오버레이">
      {positions.map((marker) => {
        const tooltipId = `pc-dev-tooltip-${marker.id}`;
        return (
          <div
            className={`pc-dev-marker-shell place-${marker.horizontal} place-${marker.vertical}`}
            style={{ top: marker.top, left: marker.left }}
            key={marker.id}
          >
            <button
              className="pc-dev-marker"
              type="button"
              aria-label={`개발 정책 ${marker.number}번: ${marker.title}`}
              aria-describedby={tooltipId}
              onKeyDown={(event) => { if (event.key === 'Escape') event.currentTarget.blur(); }}
            >
              {marker.number}
            </button>
            <div className="pc-dev-marker-tooltip" id={tooltipId} role="tooltip">
              <div className="pc-dev-marker-tooltip-head">
                <span>{marker.number}</span>
                <div><small>DEV · PRD {marker.prdId}</small><strong>{marker.title}</strong></div>
              </div>
              <ul>{marker.notes.map((note, index) => <li key={index}><Inline text={note} /></li>)}</ul>
            </div>
          </div>
        );
      })}
    </div>,
    document.body
  );
}

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
  const developerMarkers = useMemo(() => {
    const grouped = new Map<string, Omit<DeveloperMarker, 'number'>>();
    available.forEach((change) => {
      if (!change.developerNotes?.length) return;
      const key = `${change.view}:${change.targetId}`;
      const current = grouped.get(key);
      if (current) {
        current.notes.push(...change.developerNotes.filter((note) => !current.notes.includes(note)));
        return;
      }
      grouped.set(key, {
        id: change.id,
        prdId: change.prdId,
        view: change.view,
        targetId: change.targetId,
        title: change.title,
        notes: [...change.developerNotes]
      });
    });
    return Array.from(grouped.values()).map((marker, index) => ({ ...marker, number: index + 1 }));
  }, [available]);
  const currentDeveloperMarkers = useMemo(
    () => developerMarkers.filter((marker) => marker.view === currentView),
    [currentView, developerMarkers]
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
      {devMode && <DeveloperPolicyOverlay markers={currentDeveloperMarkers} />}

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
              {devMode && <div className="pc-dev-notice">화면 위 번호 스티커에 마우스를 올리면 영역별 구현 조건을 확인할 수 있습니다. 스티커는 제품 레이아웃에 영향을 주지 않습니다.</div>}
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
