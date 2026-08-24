# Homer Wiki Public Garden Design System

Public-facing Quartz site only. Obsidian vault authoring is unchanged.

## 0. Research Log

- Embedded refs: shortlisted Notion / editorial-serif / Linear → picked redesign-skill + existing terracotta garden (no SaaS clone). Preserve the current Mediterranean palette; fix reading chrome and CJK/Greek type.
- Lazyweb: skipped — this is a scholarly digital garden, not a product landing page.
- Imagen drafts: skipped — no mock-driven redesign; live GitHub Pages screenshots are the baseline.
- Live audit (2026-08-24): desktop 1440 / tablet 768 / mobile 375, light and dark, 12 routes on https://yghnsim.github.io/Homer_wiki/

## 1. Atmosphere & Identity

A quiet classical reading room, not a SaaS dashboard and not an Obsidian dump. Cream paper, terracotta ink, serif Hangul that can sit next to polytonic Greek. The signature is honest entry: only written pages are linked, metadata stays in the vault, and the first screen is the article — not a properties panel.

## 2. Color

Tokens match `quartz.config.yaml` theme colors. Do not introduce a second accent.

| Role | Token | Light | Dark | Usage |
|------|-------|-------|------|-------|
| Surface/primary | --light | #faf7f2 | #181a1b | Page background |
| Surface/secondary | --lightgray | #e8e2d7 | #282c30 | Borders, chips, graph frame |
| Text/secondary | --gray | #a89f91 | #737b84 | Meta, muted UI, unresolved affordance |
| Text/primary | --darkgray | #3c3836 | #d3d0c9 | Body |
| Text/heading | --dark | #1d2021 | #f2efe9 | Titles, icons |
| Accent/primary | --secondary | #8f3f2d | #e58c73 | Links, site title, current graph node |
| Accent/hover | --tertiary | #5c7065 | #8eb09b | Hover, visited graph nodes |
| Highlight | --highlight | rgba(143, 63, 45, 0.12) | rgba(229, 140, 115, 0.15) | Internal link wash |
| Text highlight | --textHighlight | #f9d37188 | #f9d37188 | Markdown ==highlight== |

### Rules

- Accent is for links, site title, and graph focus only.
- Broken/unresolved links use gray + dotted underline, never the same terracotta as live links.
- Warm gray family only. No cool-gray mixing.

## 3. Typography

### Font stack

| Slot | Stack | Why |
|------|-------|-----|
| Display / headings / body | `"Noto Serif KR", "Noto Serif", serif` | Hangul serif + polytonic Greek/Latin from Noto Serif |
| UI (explorer, search, chips) | `"Noto Sans KR", "Noto Serif KR", sans-serif` | Compact sidebar labels |
| Code | `"IBM Plex Mono", ui-monospace, monospace` | Existing mono |

Playfair Display and Spectral are not used: they lack Hangul, and Quartz v5 `quartz-fonts` ignored `theme.typography` unless plugin options are set.

### Scale (reading)

| Level | Size | Line height | Tracking | Usage |
|-------|------|-------------|----------|-------|
| Site title | 1.4–1.6rem | 1.25 | -0.01em | Left brand |
| Article title | clamp(1.7rem, 2.4vw, 2.15rem) | 1.3 | -0.015em | One visible H1 |
| Section H2 | 1.35rem | 1.35 | -0.01em | Article sections |
| Body | 1rem | 1.75 | -0.01em | Korean prose |
| UI / meta | 0.85–0.95rem | 1.4 | 0 | Explorer, breadcrumbs, dates |
| Caption | 0.8rem | 1.4 | 0.01em | Properties (hidden on public) |

### Rules

- `word-break: keep-all` on article, explorer, TOC, breadcrumbs, and chips.
- Headings use `text-wrap: balance`; body uses `text-wrap: pretty` where supported.
- Closing `**bold**` before a Hangul particle must not sit flush (CommonMark treats Hangul as a letter and leaks asterisks). Use U+200B after the closer, or drop nested `*italic*` inside bold.
- One public H1 per page: Quartz `article-title`. Hide the duplicate markdown H1.

## 4. Spacing & Layout

Base unit: 4px.

| Token | Value | Usage |
|-------|-------|-------|
| --space-2 | 8px | Chip gap, toolbar gap |
| --space-3 | 12px | Sidebar item |
| --space-4 | 16px | Compact section (top spacing) |
| --space-6 | 24px | Article block gap |
| --space-8 | 32px | Mobile graph/article split |

- Article column ~65–75ch (Quartz center ~790px at 1440).
- Breakpoints: mobile 800px (existing Quartz/custom.scss), tablet 768 captured in QA, desktop 1440.
- Right rail: TOC, then backlinks.
- 404 keeps left chrome (title, search, dark mode). No empty canvas.

## 5. Components

### Site chrome

- **Structure**: page title, search, dark mode, reader mode, explorer / article / TOC + backlinks.
- **States**: hover on links (tertiary), visible focus ring, reader-mode hides rails.
- **Accessibility**: skip-to-content is accepted debt until Quartz exposes a slot. Touch targets >= 40px under 800px.

### Properties panel

- **Public**: hidden (`note-properties` disabled). Vault YAML stays for Obsidian.
- **States**: n/a on public.

### Wikilink

- **Live**: terracotta, light wash.
- **Unresolved**: gray, dotted underline. Public entry pages must not emit these.
- **File URLs**: forbidden on public pages.

### Tag chip

- Nowrap; wrap the chip row, never the label mid-slug. Prefer hidden on public.

### Concept constellation

- **Where**: `wiki/overview.md`, first map after the intro.
- **Nodes**: the eight written concepts plus Achilles. Fixed mermaid flowchart, not a force graph.
- **Edges**: subgraphs keep pairs side by side (aidos–nemesis, hikesia–xenia) and the Iliad arc in one row (menis → Achilles → eleos). Remaining solids: concepts realized in Achilles; epic-cycle as a frame.
- **Rules**: short labels, no markdown list markers in nodes, no wikilinks inside mermaid. Legend under the diagram carries the wikilinks. Default mermaid palette; do not add a second accent.

### Concept × source matrix

- **Where**: analysis page `개념과 문헌`. Sources as rows, written concepts as columns.
- **Cells**: 중심 (terracotta bold), 언급 (body), — (empty). No emoji, no extra hues.
- **Layout**: sticky first column, horizontal scroll. Caption 0.85rem. Do not wrap cell labels.

### Mermaid

- Max width 100%; horizontal pan on small screens; node labels short (prefer Latin/Greek lemma over long Korean sentences).

### 404

- Keep site title + search. Copy already Korean. Offer home as primary action.

## 6. Motion & Interaction

| Type | Duration | Easing | Usage |
|------|----------|--------|-------|
| Micro | 150ms | ease-out | Link color, chip hover |
| Standard | 200–300ms | ease-in-out | Search modal, dark-mode swap |

### Rules

- No decorative motion. Graph physics is Quartz-owned; do not add page-load animations.
- `prefers-reduced-motion`: leave Quartz defaults; do not add new keyframe motion.
- GPU-only if anything is added later (`transform`, `opacity`).

## 7. Depth & Surface

Strategy: **borders-only**, warm.

- Cards/panels: 1px `var(--lightgray)`.
- No drop shadows, no grain, no glass.
- Callouts use Quartz default border + tint (warning / note). No extra elevation.

## 8. Accessibility Constraints & Accepted Debt

### Constraints

- WCAG 2.2 AA target for text contrast on cream/terracotta (body 4.5:1, titles 3:1+).
- Visible focus on search, dark mode, reader mode, explorer disclosure.
- Hangul must not orphan a single syllable in titles or explorer labels.
- `lang="ko"` stays; Greek runs inline without swapping `lang` (Quartz limit).

### Accepted Debt

| Item | Location | Why accepted | Owner / Exit |
|------|----------|--------------|--------------|
| No skip-to-content | Quartz shell | No slot without forking the engine | Revisit if Quartz adds a plugin |
| Explorer folder slugs (`entities`, `concepts`) | Left rail | Renaming folders breaks vault paths | Optional folder `index.md` titles later |
| English "min read" | content-meta | Plugin i18n still emits English next to Korean dates | Hide via CSS if a stable selector exists after build |
| Search ranking | Search modal | Quartz BM25; entity pages cannot be boosted without a custom mapFn | Content titles + unpublishing log reduce noise |
| Mermaid node type | `.mermaid` | Noto Serif KR has no Greek metrics, so diagrams use Times New Roman | Load Noto Serif (non-KR) in quartz-fonts without a Sass `@import` |
| `note-properties` stays enabled | quartz.config.yaml | Disabling it dumps YAML into the article. Hide the panel with `hidePropertiesView` | Do not set `enabled: false` |
