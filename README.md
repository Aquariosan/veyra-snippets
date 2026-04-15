# veyra-snippets

A persistent code snippet manager MCP tool for AI agents, with language filtering, tag search, and full-text code search. Reads are always free. Write operations require [Veyra](https://veyra.to) commit mode authorization.

## Overview

`veyra-snippets` gives AI agents a reliable code library backed by SQLite. Agents can freely browse and search snippets. Saving, updating, and deleting snippets is protected by Veyra commit mode — ensuring intentional, accountable writes.

## Installation

```bash
npm install
npm run build
```

Snippets are stored at `~/.veyra-snippets/data.db`, created automatically on first run.

## MCP Configuration (Claude Desktop)

Add the following to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "veyra-snippets": {
      "command": "node",
      "args": ["/absolute/path/to/veyra-snippets/dist/index.js"]
    }
  }
}
```

## Tools

| Tool | Input | Class | Price |
|------|-------|-------|-------|
| `list_snippets` | `{ language?, tag? }` | — | FREE |
| `get_snippet` | `{ id }` | — | FREE |
| `search_snippets` | `{ query }` | — | FREE |
| `save_snippet` | `{ title, code, language, tags?, veyra_token? }` | A | €0.005 |
| `update_snippet` | `{ id, code?, title?, veyra_token? }` | A | €0.005 |
| `delete_snippet` | `{ id, veyra_token? }` | B | €0.02 |

## Examples

### Read (no token needed)

```json
// List all snippets
{ "tool": "list_snippets", "arguments": {} }

// List TypeScript snippets
{ "tool": "list_snippets", "arguments": { "language": "typescript" } }

// List snippets by tag
{ "tool": "list_snippets", "arguments": { "tag": "auth" } }

// Get a specific snippet
{ "tool": "get_snippet", "arguments": { "id": "1712345678-abc1234" } }

// Search across title, code, language, and tags
{ "tool": "search_snippets", "arguments": { "query": "debounce" } }
```

### Write (Veyra token required)

```json
// Save a new snippet
{
  "tool": "save_snippet",
  "arguments": {
    "title": "Debounce utility",
    "code": "function debounce(fn, ms) {\n  let timer;\n  return (...args) => {\n    clearTimeout(timer);\n    timer = setTimeout(() => fn(...args), ms);\n  };\n}",
    "language": "javascript",
    "tags": "utility,performance",
    "veyra_token": "vt_..."
  }
}

// Update snippet code
{
  "tool": "update_snippet",
  "arguments": {
    "id": "1712345678-abc1234",
    "code": "// updated code here",
    "veyra_token": "vt_..."
  }
}

// Delete a snippet
{
  "tool": "delete_snippet",
  "arguments": {
    "id": "1712345678-abc1234",
    "veyra_token": "vt_..."
  }
}
```

### Error response when token is missing

```json
{
  "error": "VeyraCommitRequired",
  "message": "Write operations require Veyra commit mode.",
  "currentMode": "open",
  "requiredMode": "commit",
  "transitionStrategy": "authorize_then_retry_with_x_veyra_token",
  "provider": "veyra",
  "authorize_endpoint": "https://api.veyra.to/v1/authorize-action",
  "docs_url": "https://veyra.to"
}
```

## How Veyra Works

Veyra is a commit-mode authorization layer for AI agents. When an agent attempts a write operation:

1. The agent calls the tool without a `veyra_token` and receives a `VeyraCommitRequired` error with an `authorize_endpoint`.
2. The agent (or the user on its behalf) calls the authorize endpoint to obtain a token.
3. The agent retries the tool call with `veyra_token` set.
4. `veyra-snippets` verifies the token via `@veyrahq/sdk-node` before executing the write.

See [veyra.to](https://veyra.to) for full documentation.

## License

MIT

## Hosted Pack (recommended)

Prefer the hosted pack for one-URL integration:

```json
{
  "mcpServers": {
    "veyra": {
      "url": "https://mcp.veyra.to/sse"
    }
  }
}
```

One URL. 48 tools. 24 free reads. 24 protected writes.

Hosted pack:
https://mcp.veyra.to/sse

Pack manifest:
https://mcp.veyra.to/.well-known/veyra-pack.json

Use the hosted pack when you want the fastest MCP integration path across all Veyra tool families.
Use this standalone package when you specifically want this tool on its own.

## Part of the Veyra Ecosystem

Veyra is commit mode for production AI agent actions.
All tools: reads free, writes require Veyra commit mode.

| Tool | Description | Install |
|------|-------------|---------|
| [veyra-memory](https://github.com/Aquariosan/veyra-memory) | Key-value memory store | `npm i -g veyra-memory` |
| [veyra-notes](https://github.com/Aquariosan/veyra-notes) | Note-taking with tags | `npm i -g veyra-notes` |
| [veyra-tasks](https://github.com/Aquariosan/veyra-tasks) | Task management | `npm i -g veyra-tasks` |
| [veyra-bookmarks](https://github.com/Aquariosan/veyra-bookmarks) | Bookmark manager | `npm i -g veyra-bookmarks` |
| [veyra-contacts](https://github.com/Aquariosan/veyra-contacts) | Contact management | `npm i -g veyra-contacts` |
| [veyra-forms](https://github.com/Aquariosan/veyra-forms) | Form builder | `npm i -g veyra-forms` |
| [veyra-webhooks](https://github.com/Aquariosan/veyra-webhooks) | Webhook sender | `npm i -g veyra-webhooks` |

**SDK:** [npm install @veyrahq/sdk-node](https://www.npmjs.com/package/@veyrahq/sdk-node)
**Website:** [veyra.to](https://veyra.to)
