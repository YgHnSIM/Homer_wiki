---
status: accepted
date: 2026-08-17
---

# Smart CI/CD Pipeline and Public Content Staging

We decided to use an ephemeral, containerized Quartz build pipeline inside GitHub Actions rather than installing the full Quartz npm dependencies inside the Obsidian vault root.

## Considered Options

- **Ephemeral CI/CD Build via GitHub Actions**: The vault stays lightweight and pure Markdown. During the GitHub Actions workflow, Quartz is cloned in isolation, public content (`index.md`, `wiki/`, `words/`) is staged into the build directory, and `raw/` and internal configs are excluded before generating static assets for GitHub Pages.
- **Local Monolithic Repository**: Installing the full Quartz engine, TypeScript compilers, and `node_modules` permanently in the vault root.

## Consequences

- The vault remains clean and free of heavy dependencies or build debris.
- Private raw texts (`raw/`) and internal assistant files are guaranteed to never leak into public static builds.
- Any commit pushed to `main` triggers a fresh, reproducible build on GitHub Pages automatically.
