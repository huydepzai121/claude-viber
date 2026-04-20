# Claude Viber

> Open-source client for Claude Agent SDK — Desktop & Web

[![npm version](https://img.shields.io/npm/v/claude-viber)](https://www.npmjs.com/package/claude-viber)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> [!IMPORTANT]
> This project is not affiliated with [Anthropic](https://www.anthropic.com).

Claude Viber is a full-featured chat client built on the [Claude Agent SDK](https://platform.claude.com/docs/en/agent-sdk/overview). It ships in two modes:

- **Desktop App** — an Electron application for macOS and Windows with bundled runtimes and zero setup required.
- **Web Mode** — a lightweight server you can run on any machine (including a VPS) via `npx claude-viber`, then open in any browser.

![Claude Viber screenshot](https://github.com/user-attachments/assets/d7199fcc-a5ba-45ce-917a-e455ff430a2d)

---

## Features

- Chat with Claude AI using the official Claude Agent SDK
- Full tool use support (file read/write, shell commands, web search, and more)
- MCP (Model Context Protocol) server integration
- Conversation history with search
- Custom skills to extend Claude's capabilities
- Multi-language UI (English, Vietnamese)
- Dark/Light theme
- Web mode for VPS and remote server deployment

---

## Installation

### Option 1: npm / npx (Web Mode)

No installation required — run directly with `npx`:

```bash
npx claude-viber
```

Or install globally for repeated use:

```bash
npm install -g claude-viber
claude-viber
```

The server starts on `http://localhost:7567` and opens your browser automatically.

### Option 2: Desktop App (via npm)

Install globally and launch the Electron desktop app:

```bash
npm install -g claude-viber
claude-viber-app
```

This gives you full features including native folder picker, file browsing, and auto-updates.

### Option 3: Pre-built Binaries

Pre-built binaries for **macOS** and **Windows** are available on the [Releases page](https://github.com/pheuter/claude-agent-desktop/releases).

- **macOS**: download the `.zip`, extract, and open the app.
- **Windows**: download the `.exe` installer and run it.

All required runtimes ([bun](https://bun.sh), [uv](https://docs.astral.sh/uv/), portable Git/Unix tools on Windows) are bundled — no developer tools needed.

---

## Quick Start

### Web Mode

```bash
# Provide your Anthropic API key
export ANTHROPIC_API_KEY=sk-ant-...

# Start
npx claude-viber
# or: claude-viber (if installed globally)
```

Opens `http://localhost:7567` in your default browser.

### Desktop App

1. Install: `npm install -g claude-viber`
2. Launch: `claude-viber-app`
3. Open **Settings** and enter your Anthropic API key.
4. Start chatting.

---

## Configuration

### API Key

Provide your Anthropic API key via environment variable:

```bash
export ANTHROPIC_API_KEY=sk-ant-...
```

Or enter it in the **Settings** panel inside the app.

### Custom API Base URL

For proxies or custom API endpoints:

```bash
export ANTHROPIC_API_BASE_URL=https://your-proxy.example.com
```

### Workspace Directory

The workspace is where Claude reads and writes files during a session.

Default: `~/Desktop/claude-agent`

Override via environment variable:

```bash
export CLAUDE_WORKSPACE_DIR=/path/to/your/workspace
```

Or change it in the **Settings** panel.

---

## Custom Skills

Skills extend what Claude can do during a session. Each skill is a directory under `.claude/skills/` containing a `SKILL.md` description and TypeScript tool scripts.

To add a custom skill:

1. Create `.claude/skills/<skill-name>/SKILL.md` with `name` and `description` fields.
2. Add TypeScript tools under `.claude/skills/<skill-name>/scripts/`.
3. Restart the app or rerun `bun run dev`. Skills are compiled and bundled automatically on startup.

See [CLAUDE.md](./CLAUDE.md) for full details on the skill system.

---

## Development

### Prerequisites

- [Bun](https://bun.sh) v1.3 or later
- Node.js 20 or later

### Setup

```bash
git clone https://github.com/pheuter/claude-agent-desktop.git
cd claude-agent-desktop

bun install
```

### Run in development

```bash
# Desktop app (Electron + Vite)
bun run dev

# Web mode (Express server + Vite)
bun run dev:web
```

### Build

```bash
# Desktop app
bun run build:mac   # macOS (.zip)
bun run build:win   # Windows (NSIS installer)

# Web assets only
bun run build:web
```

### Other commands

```bash
bun run typecheck   # TypeScript type checking
bun run lint        # ESLint
bun run test        # Bun test runner
bun run format      # Prettier formatting
```

---

## Auto-Updates

Packaged desktop builds check this repository's GitHub Releases for updates via `electron-updater`. Set `GH_TOKEN` when running `electron-builder` to publish releases with update metadata, and optionally provide `UPDATE_FEED_URL` to point the app at a custom update server.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Desktop framework | Electron 39 |
| UI | React 19 + TypeScript |
| Styling | Tailwind CSS 4 |
| Build | Vite 7 + electron-vite |
| Runtime | Bun |
| AI | `@anthropic-ai/claude-agent-sdk` |

---

## Contributing

Contributions are welcome. Please open an issue or pull request on GitHub.

---

## License

[MIT](./LICENSE)

---

## Acknowledgments

- [Anthropic](https://anthropic.com) for Claude AI
- [`@anthropic-ai/claude-agent-sdk`](https://www.npmjs.com/package/@anthropic-ai/claude-agent-sdk) for the agent runtime
