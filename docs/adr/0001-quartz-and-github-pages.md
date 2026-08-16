---
status: accepted
date: 2026-08-17
---

# Quartz v4 on GitHub Pages for Homer Wiki

Homer Wiki is an interconnected Obsidian vault using wikilinks, bi-directional graphs, callouts, and frontmatter. We decided to use Quartz v4 built and deployed via GitHub Actions to GitHub Pages, while restricting the build scope strictly to `wiki/` and `words/` (excluding `raw/` and meta directories).

## Considered Options

- **Quartz v4**: Native support for Obsidian syntax (`[[wikilinks]]`, tags, callouts, Mermaid), interactive local/global graph view, full-text search, backlinks explorer, and zero runtime backend dependency.
- **MkDocs with Material**: Mature and stable, but requires complex plugin chains to support Obsidian wikilinks and graph view.
- **Custom Astro / Next.js**: Full design freedom, but high maintenance overhead for parsing Obsidian markdown pipelines and maintaining interactive knowledge graphs.

## Consequences

- The vault content remains 100% standard Obsidian markdown without needing custom formatting or export steps.
- Raw reference sources (`raw/`) and agent system files are kept private from the public web build.
- CI/CD automatically publishes changes whenever commits are pushed to the main branch on GitHub.
