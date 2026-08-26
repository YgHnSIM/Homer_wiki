# Homer Wiki Web Deployment Context

Knowledge base publishing context for Homer Wiki, translating an Obsidian markdown vault into a public digital garden on GitHub Pages.

## Language

**Wiki Vault**:
The authoritative Obsidian-compatible markdown repository containing Homeric epic and classical Greek knowledge.
_Avoid_: CMS, database, blog repository

**Digital Garden**:
The public, interconnected web representation of the Homer Wiki knowledge base, featuring full-text search, backlinks, and bi-directional linking.
_Avoid_: Blog, documentation site, portal

**Quartz Engine**:
The static site generator that compiles Obsidian markdown, wikilinks, callouts, and frontmatter into an interactive static web application.
_Avoid_: Web framework, backend server, CMS engine

**Public Scope**:
The curated entry page (`index.md`) and knowledge directories (`wiki/`, `words/`) designated for public web rendering and indexing.
_Avoid_: Full repository dump, uncurated build

**Exclusion Scope**:
Raw texts, source PDFs, and internal agent configurations (`raw/`, `.obsidian/`, `.agents/`, `.omo/`) excluded from web compilation to safeguard copyrights and maintain operational hygiene.
_Avoid_: Hidden pages, secret docs

## Greek Reading Information Architecture

The Greek reading layer separates identification, reading flow, and philological evidence. It keeps the public article readable for Korean readers while retaining the original form and an explicitly versioned scholarly transliteration where those are useful.

| Document or layer | Role | Reader-facing responsibility |
|---|---|---|
| Formal entry frontmatter | Single source of truth | Stores `korean_name`, `conventional_latin`, `greek`, `transliteration`, `transliteration_system`, and `cssclasses`. |
| Title and H1 | Navigation and identification | Concepts and entities use Korean plus the conventional Latin name; words use the English headword plus the Korean name. |
| Reading row | First complete disclosure | Immediately below H1, presents Korean name, Greek headword, and scholarly transliteration in a stable text order. |
| General prose | Continuous reading | Uses the Korean name after first disclosure; restores Greek and transliteration only when the form itself matters. |
| Long quotations and scholarly tables | Textual comparison | Long quotations run translation, original, then actual-form transliteration; tables keep Greek actual form and transliteration in separate columns. |
| `wiki/greek-reading-guide.md` | Public orientation | Explains the visible labels and limits for non-specialist readers without reproducing the full technical rule set. |
| `docs/editorial/homeric-oriented-transliteration-v1.md` | Editorial authority | Defines the versioned transliteration system and its evidence and exception process. |

The transliteration is a reading and character-correspondence aid, not IPA or a claim to reconstruct a single historical Homeric pronunciation. CSS may refine presentation but does not carry information absent from Markdown.

## Entity Editorial Model

**서사적 입구 (Narrative Entry)**:
An opening orientation that presents an entity through its central conflict, decisive movement, and humanistic question before the detailed evidence sections. It is an interpretive frame, not a replacement for the Homeric text or a claim that the interpretation is the only valid reading.
_Avoid_: Novelistic invention of unrecorded thoughts or motives

**핵심 긴장 (Core Tension)**:
The conflict between values, relationships, roles, or forms of action that organizes an entity's narrative arc. It must be grounded in scenes, speeches, narrator wording, or identified scholarship rather than modern psychological diagnosis.
_Avoid_: Treating a modern theory as the character's own conceptual vocabulary

**전환점 (Turning Point)**:
A textually identifiable event, decision, recognition, loss, or intervention that changes the entity's immediate relation to a goal, person, community, or fate. Each major turning point should carry a Homeric book-and-line reference when available.
_Avoid_: Calling every dramatic scene a character-development milestone

**서사적 궤적 (Narrative Arc)**:
The ordered sequence of scenes, choices, consequences, and unresolved tensions through which an entity is presented in the Homeric corpus. The term describes narrative arrangement and does not automatically imply moral progress or psychological growth.
_Avoid_: A linear maturation story when the texts support competing or discontinuous portraits

**해석 렌즈 (Interpretive Lens)**:
A bounded scholarly perspective, such as philology, history, archaeology, religion, ethics, or reception, used to examine a narrative claim after the core textual account has been established.
_Avoid_: Using a lens to substitute for missing primary evidence

**증거 층위 (Evidence Layer)**:
The explicit distinction between what the Homeric text states, what scholarship strongly infers, what remains contested, and what belongs to later reception. Narrative fluency must not erase these differences in certainty.
_Avoid_: Presenting later mythography or modern interpretation as Homeric fact
