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
