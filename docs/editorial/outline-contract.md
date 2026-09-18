# Outline contract (L1–L3) — formal consistency for stub enrichment

> Status: **experimental (P0)** — editorial contract before Wave A–D stub promotion.
> Related: AGENTS.md (etymology SoT, greek-reading), CONTEXT.md (narrative entry / evidence layers),
> `docs/ops/2026-09-18-deploy-failure-missing-raw-pdf.md` (CI vs local checks).

## Why this exists

CI already locks filenames, baseline frontmatter, greek-reading chrome, sources, and matrix sync.
It does **not** lock body H2 skeletons. Stub pages (~2–5 Korean-only H2) and mature peers
(bilingual template H2) can diverge while `npm run check:ci` stays green.

P0 rule: **on first L1→L2 enrichment, promote headings to the template titles below** —
do not only grow prose under stub H2 titles.

## Heading style (all public `wiki/` and `words/` pages)

- Numbered sections: `## N. 한국어 (English)` — match template **verbatim** (no free translation).
- Entity narrative: `## 서사적 입구 (Narrative Entry)`.
- Closing section: `## 관련 항목` (no English; existing CI contract).
- Known mature outliers (e.g. `concept-dike` alternate architecture) are **allowlisted** —
  do not rewrite them inside Waves A–D; track separately.

## Maturity ladder

| Level | Meaning | Enrichment waves |
|---|---|---|
| **L1** | Stub / scaffold allowed | Current thin hubs |
| **L2** | Usable graph hub (Wave target) | A concepts, B Zeus, C places, D words |
| **L3** | Peer-lite (most template sections present) | Later |
| **L4** | Full monograph (xenia/achilles scale) | Out of scope here |

### L2 required H2 by type

Copy titles **exactly** from the type template (`wiki/concepts/_template.md`,
`wiki/entities/_template.md`, `words/_template.md`).

#### Concept (L2)

Required:

1. `## 1. 정의와 핵심 테제 (Definition & Core Thesis)`
2. `## 2. 어원과 형태론 (Etymology & Morphology)` — see etymology guard
3. `## 3. 호메로스 서사시 본문 용례와 맥락 (Homeric Attestation & Contexts)`
4. `## 4. 개념 상호작용과 가치망 (Conceptual Network & Polarity)`
5. `## 5. 대표 서사 에피소드 정밀 해제 (Signature Epic Episodes)`
6. `## 12. 증거 매트릭스 (Evidence Matrix)`
7. `## 관련 항목`

§6–11 may be short placeholders at L2 but **titles should exist** if aiming at L3;
at strict L2 minimum, §1–5 + §12 + 관련 항목 is enough.

#### Entity — person / deity (L2)

Required:

1. `## 서사적 입구 (Narrative Entry)`
2. `## 1. 정의와 식별 (Definition & Identification)`
3. `## 2. 명칭과 문헌학 (Philology, Epithets & Dialect)`
4. `## 3. 호메로스 본문에서의 모습 (Homeric Attestation & Narrative Arc)`
5. `## 4. 관계와 소속 (Genealogy, Alliances & Networks)`
6. `## 5. 유형별 상세 (Type-Specific Details)` (epithets / cult aspects as needed)
7. `## 12. 증거 매트릭스 (Evidence Matrix)`
8. `## 관련 항목`

#### Entity — place (L2)

Required:

1. `## 서사적 입구 (Narrative Entry)` — short geographic / narrative orientation OK
2. `## 1. 정의와 식별 (Definition & Identification)`
3. `## 5. 유형별 상세 (Type-Specific Details)` — place module
4. `## 7. 고고학과 지리 (Archaeology, Topography & Material Culture)`
5. `## 12. 증거 매트릭스 (Evidence Matrix)`
6. `## 관련 항목`

Other entity sections optional at L2.

#### Word (L2)

Required:

1. `## 1. 어원 전파 계통도 (Etymological Transmission Tree)` (or template-equivalent title)
2. `## 2. 인구어(PIE) 및 희랍어 원어근 분석 (PIE & Proto-Greek Morphology)`
3. `## 3. 호메로스 서사시 원전 용례 및 인명학 (Homeric Epic Context & Onomastics)`
4. `## 4. 역사적 전파 및 수용사 경로 (Historical Transmission & Reception)`
5. `## 8. 어원 증거 매트릭스 및 학술 출처 (Evidence Matrix & References)`
6. `## 관련 항목`

Prefer matching `words/_template.md` titles exactly when promoting.

## Etymology guard (SoT = `words/`)

On **concept** pages at L2+:

- §2 title uses the template bilingual form.
- Body of §2: **3–5 lines max** + mandatory `[[word-…]]` link.
- No second full PIE / Mermaid etymology essay on the concept page.
- Detail lives in `words/word-*.md`.

## Evidence genre promotion

| L1 (temporary) | L2+ (required title) |
|---|---|
| `## 3. 증거 메모` / `## 어원 메모 (스텁)` | `## 12. 증거 매트릭스 (Evidence Matrix)` (concepts/entities) or word §8 matrix |

Even a thin matrix must use evidence grades when rows exist:

- 원전 명시
- 강한 학술 추론
- 논쟁적
- 후대 수용

Empty grades may be marked 미기입; the section must still exist after promotion.

## Status / Wave gate

- Do not treat `status: active` as “outline-complete”.
- First enrichment commit for a stub **must** include H2 promotion (this contract).
- Suggested Wave A golden pair: `concept-kleos` + `word-kleos`.
- Per-commit checklist:
  1. H2 matches type L2 list (bilingual, verbatim)
  2. No leftover `증거 메모` as the evidence H2
  3. Concept §2 short + `[[word-*]]`
  4. Entity has `서사적 입구 (Narrative Entry)` when required
  5. `npm run check:ci` + bidirectional related links / index as needed

## Out of scope (P1+)

- `validate-outline.mjs` / active↔skeleton CI enforcement
- Requiring relation FM (`concept_domain`, etc.) in CI
- Rewriting allowlisted mature divergences
