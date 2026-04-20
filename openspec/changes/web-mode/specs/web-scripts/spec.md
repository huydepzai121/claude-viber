## ADDED Requirements

### Requirement: dev:web script starts full dev stack
The `dev:web` npm script SHALL run pre-dev setup (skills build), then start both the web server and Vite dev server concurrently. The browser SHALL access the app at `http://localhost:2810`.

#### Scenario: Start dev stack
- **WHEN** `bun run dev:web` is executed
- **THEN** `scripts/preDev.js` runs first, then Express server starts on `:2810` and Vite starts on `:5174`, and browser can access app at `http://localhost:2810`

#### Scenario: Either process fails
- **WHEN** web server or Vite process crashes
- **THEN** `concurrently --kill-others-on-fail` terminates both processes

### Requirement: build:web script produces production bundle
The `build:web` npm script SHALL build the React renderer using `vite.web.config.ts` and output to `out/renderer/`.

#### Scenario: Build succeeds
- **WHEN** `bun run build:web` is executed
- **THEN** `out/renderer/index.html` and bundled assets are created

### Requirement: start:web script serves production bundle
The `start:web` npm script SHALL start only the Express web server (no Vite), serving the pre-built `out/renderer/` static files.

#### Scenario: Start production server
- **WHEN** `bun run start:web` is executed after `bun run build:web`
- **THEN** server starts on `:2810` and serves `out/renderer/index.html` for non-API routes

### Requirement: vite.web.config.ts is standalone Vite config
A separate `vite.web.config.ts` file SHALL configure Vite for web-mode builds without `electron-vite` plugin. It SHALL set `root` to `src/renderer`, output to `out/renderer/`, and configure `@` alias.

#### Scenario: Config is self-contained
- **WHEN** `vite --config vite.web.config.ts` is run
- **THEN** Vite builds successfully using React + Tailwind plugins without Electron dependencies
