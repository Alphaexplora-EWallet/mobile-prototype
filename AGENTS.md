# Repository Guidelines

## Project Structure & Module Organization

This is a Vite-powered React 19 and TypeScript wallet prototype with simulated data and no backend today; the planned NetBank-based backend is designed in `docs/backend-architecture.md` and `docs/multi-user-model.md`. Keep portable application code in `src/core/`: domain types and derivations belong in `domain/`, integer-centavo utilities in `money/`, Zustand state in `stores/`, platform contracts in `platform/`, and one `use*ViewModel` hook per screen in `viewmodels/`. React views live in `src/ui/`, grouped into screens, layout, reusable primitives, and assets. Web adapters belong in `src/platform/web/`; renderless browser side effects belong in `src/app/bridges/`. Global CSS is split by cascade layer under `src/styles/`. Tests and shared jsdom setup are under `src/test/`, with focused unit tests beside their modules.

## Build, Test, and Development Commands

- `npm install` installs the locked dependencies.
- `npm run dev` starts Vite at `http://localhost:5173`.
- `npm run build` type-checks and creates the production bundle in `dist/`.
- `npm run test` runs Vitest once; `npm run test:watch` runs it interactively.
- `npm run lint` checks ESLint rules; `npm run format:check` verifies Prettier formatting.
- `npm run verify` runs type-checking, linting, formatting checks, tests, and the build. Run it before committing.

## Coding Style & Naming Conventions

Prettier enforces 120-character lines, semicolons, double quotes, and trailing commas. Use PascalCase for React components, `use*` for hooks and ViewModels, `*.store.ts` for stores, and descriptive camelCase for functions. Keep browser globals behind platform ports or bridges. Views must consume ViewModels instead of importing stores, mock data, or money helpers directly. Store monetary values as integer centavos and format them at the ViewModel boundary.

## Testing Guidelines

Vitest, Testing Library, and jsdom provide the test stack. Name tests `*.test.ts` or `*.test.tsx`. Preserve `src/test/app.flow.test.tsx` and its golden snapshot as behavioral evidence. Do not run `vitest -u` merely to clear a failure; update snapshots only for intentional UI changes and explain why.

## Commit & Pull Request Guidelines

Follow the existing Conventional Commit style: `refactor:`, `test:`, `docs:`, `chore:`, or scoped forms such as `refactor(css):`. Keep commits focused. Pull requests should summarize behavior and architecture changes, link relevant issues, include screenshots for visual work, call out intentional snapshot updates, and report `npm run verify` results.