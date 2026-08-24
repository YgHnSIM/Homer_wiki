---
status: accepted
date: 2026-08-17
---

# Quartz v5 on GitHub Pages for Homer Wiki

Homer Wiki is an interconnected Obsidian vault using wikilinks, backlinks, callouts, Mermaid diagrams, and frontmatter. We decided to use a pinned Quartz v5 revision built and deployed via GitHub Actions to GitHub Pages. The public build contains only `index.md`, `wiki/`, and `words/`; `raw/` and internal operational directories remain excluded.

## Considered Options

- **Quartz v5**: Native support for Obsidian syntax (`[[wikilinks]]`, tags, callouts, Mermaid), full-text search, backlinks, and zero runtime backend dependency.
- **MkDocs with Material**: Mature and stable, but requires additional plugins and configuration to preserve the vault's Obsidian semantics.
- **Custom Astro / Next.js**: Full design freedom, but high maintenance overhead for parsing and publishing Obsidian markdown.

## Consequences

- The vault content remains 100% standard Obsidian markdown without needing custom formatting or export steps.
- Raw reference sources (`raw/`) and agent system files are kept private from the public web build.
- Pinning Quartz to an immutable commit makes local and CI builds reproducible until that revision is deliberately updated.
- CI/CD automatically publishes changes whenever commits are pushed to the main branch on GitHub.
