# Repository Guidelines

## Project Structure & Module Organization
- Root: `index.html`, `manifest.json`.
- Source: `js/` (feature modules like `assessment-system.js`, `gamification-system.js`, `multimedia-system.js`, `app.js`), `css/` (e.g., `main.css`, `responsive.css`).
- Content: `subjects/` (topic HTML), `assets/` (images/icons), `data/`.
- Config & Docs: `config/`, `docs/`, guides like `SUPABASE_SECURITY_GUIDE.md`, `DEPLOYMENT_GUIDE.md`.
- Scripts: `scripts/` (build, security, diagnostics). Build output: `dist/`.

## Build, Test, and Development Commands
- `npm run dev` or `npm start`: Launch local server at `http://localhost:3000`.
- `npm run build`: Clean, copy static assets, process config, and optimize CSS/JS/images to `dist/`.
- `npm run validate`: HTML validation + security checks.
- `npm test`: Run Jest tests (add tests as described below).
- `npm run lint` / `npm run format`: Lint JS and format JS/CSS.
- `npm run deploy`: Publish `dist/` to GitHub Pages.
- Utilities: `scripts/test-all-pages.sh`, `scripts/diagnose-page-issues.sh`, `npm run lighthouse`.

## Coding Style & Naming Conventions
- JavaScript: ES6+, modules in `js/`. Prefer pure functions; keep DOM access localized.
- CSS: Mobile-first; keep shared styles in `css/main.css`, overrides in `css/responsive.css`.
- Formatting: Prettier enforced via `npm run format` (2-space indent, single quotes default).
- Linting: ESLint via `npm run lint`. Fix warnings before PR.
- Naming: files `kebab-case.js/css`; classes `PascalCase`; variables/functions `camelCase`.

## Testing Guidelines
- Framework: Jest. Place tests under `__tests__/` or alongside modules as `*.test.js`.
- DOM code: use JSDOM (`/** @jest-environment jsdom */`) or `jest-environment-jsdom`.
- Scope: unit tests for module logic (e.g., scoring in `assessment-system.js`).
- Run: `npm test`. Add page validation to CI with `npm run validate`.

## Commit & Pull Request Guidelines
- Commits: GPG-signed, conventional style: `type(scope): short summary`.
  - Examples: `feat(assessment): add partial credit`, `fix(ui): correct progress badge color`.
- PRs: clear description, linked issues (`Closes #123`), screenshots for UI, updated docs.
- Checklist: run `npm run validate`, `npm test`, and `npm run lint` before opening.

## Security & Configuration
- Env: copy `config/example.env` → `config/.env`; never commit secrets.
- Run `npm run test:security` and review `SUPABASE_SECURITY_GUIDE.md` before deploy.
- Data access must respect RLS; avoid embedding keys in client code.

