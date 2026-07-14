# Connect SQ Sandbox Agent Rules

## Purpose

This repository is a pre-development, high-fidelity communication prototype for
approved Connect Squad PRDs. It renders the Connect desktop shell and hospital
webview together so product policy can be reviewed as an interactive screen.

## Source of truth

- Canonical PRDs live only in the shared Connect Squad workspace under
  `3-미션·기획/1-PRD/`.
- Never treat `docs/policy-summaries/` as an editable policy source. It contains
  public-safe, derived summaries only.
- Every summary and change entry must show a stable source `prd_id`.
- Every source PRD requires `target_release_at` as an ISO date or `null`.
- New approved changes require `status: approved`, `approved_by`, `approved_at`,
  and `version` in the canonical PRD.
- Existing GCP-1 entries are a clearly labelled prototype baseline because the
  canonical PRD is still in review. Do not relabel them as approved.

## Public content boundary

- This repository and its GitHub Pages site are public.
- Never copy a full internal PRD, customer data, credentials, commercial terms,
  private links, or unpublished operational detail into this repository.
- Publish only the minimum policy summary needed to understand the prototype.
- A draft or review summary may be published only as a clearly labelled planned
  preview with a concrete screen target and no internal-only detail.

## Design and interaction

- Treat the current implementation as the visual source of truth.
- Reuse `connectShell.css`, existing tokens, spacing, typography, controls, and
  page interaction patterns before adding new styles.
- The left navigation represents the Connect client. The main area represents
  the hospital webview.
- The right-side change drawer is prototype metadata, not a production Connect
  feature. It is closed by default and overlays the webview without resizing it.
- Clicking a change locates and highlights the affected screen section. The PRD
  action opens the public-safe Markdown summary inside the drawer.
- Planned content is hidden by default. When enabled, the page must show a
  persistent unapproved-preview notice and restore the current-state view when
  the toggle is turned off.
- Every change card shows the source target release date; `null` renders as `미정`.

## File contracts

- `pages/connect/<name>/index.page.tsx`: interactive prototype page.
- `components/prototype/`: shared prototype-only UI such as the change drawer.
- `content/change-manifests/`: screen-to-policy change mappings.
- `docs/policy-summaries/`: public-safe Markdown summaries named by PRD ID.
- `styles/prototypeChanges.css`: prototype metadata UI styles.
- `out/*.html`: generated deployable artifacts; rebuild after source changes.

## Verification

Run both commands after relevant changes:

```bash
npm run proto:validate
npm run proto:share -- pages/connect/ti-kakao/index.page.tsx --out ti-kakao
```

The build must report external references `0 (OK)` and list the validated PRD
summaries. Do not add a dependency unless the existing React, esbuild, and plain
CSS stack cannot reasonably support the requirement.
