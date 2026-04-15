#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import * as store from "./store.js";
import { requireVeyra } from "./veyra.js";

const server = new Server(
  { name: "veyra-snippets", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "list_snippets",
      description: "List code snippets, optionally filtered by language or tag. FREE — no token required.",
      inputSchema: {
        type: "object",
        properties: {
          language: { type: "string", description: "Filter by programming language" },
          tag: { type: "string", description: "Filter by tag" },
        },
      },
    },
    {
      name: "get_snippet",
      description: "Retrieve a code snippet by ID. FREE — no token required.",
      inputSchema: {
        type: "object",
        properties: {
          id: { type: "string", description: "The snippet ID" },
        },
        required: ["id"],
      },
    },
    {
      name: "search_snippets",
      description: "Search snippets by query (matches title, code, language, tags). FREE — no token required.",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search term" },
        },
        required: ["query"],
      },
    },
    {
      name: "save_snippet",
      description: "Save a new code snippet. Requires Veyra commit mode (Class A — €0.005).",
      inputSchema: {
        type: "object",
        properties: {
          title: { type: "string", description: "Snippet title" },
          code: { type: "string", description: "The code content" },
          language: { type: "string", description: "Programming language (e.g. typescript, python)" },
          tags: { type: "string", description: "Optional comma-separated tags" },
          veyra_token: { type: "string", description: "Veyra authorization token" },
        },
        required: ["title", "code", "language"],
      },
    },
    {
      name: "update_snippet",
      description: "Update a snippet's code or title. Requires Veyra commit mode (Class A — €0.005).",
      inputSchema: {
        type: "object",
        properties: {
          id: { type: "string", description: "The snippet ID to update" },
          code: { type: "string", description: "New code content" },
          title: { type: "string", description: "New title" },
          veyra_token: { type: "string", description: "Veyra authorization token" },
        },
        required: ["id"],
      },
    },
    {
      name: "delete_snippet",
      description: "Delete a snippet by ID. Requires Veyra commit mode (Class B — €0.02).",
      inputSchema: {
        type: "object",
        properties: {
          id: { type: "string", description: "The snippet ID to delete" },
          veyra_token: { type: "string", description: "Veyra authorization token" },
        },
        required: ["id"],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case "list_snippets": {
      const { language, tag } = args as { language?: string; tag?: string };
      const snippets = store.list({ language, tag });
      return {
        content: [{ type: "text", text: JSON.stringify({ count: snippets.length, snippets }) }],
      };
    }

    case "get_snippet": {
      const { id } = args as { id: string };
      const snippet = store.get(id);
      if (!snippet) {
        return {
          content: [{ type: "text", text: JSON.stringify({ found: false, id }) }],
        };
      }
      return {
        content: [{ type: "text", text: JSON.stringify({ found: true, ...snippet }) }],
      };
    }

    case "search_snippets": {
      const { query } = args as { query: string };
      const snippets = store.search(query);
      return {
        content: [{ type: "text", text: JSON.stringify({ count: snippets.length, query, snippets }) }],
      };
    }

    case "save_snippet": {
      const { title, code, language, tags, veyra_token } = args as {
        title: string;
        code: string;
        language: string;
        tags?: string;
        veyra_token?: string;
      };
      const check = await requireVeyra(veyra_token);
      if (!check.ok) {
        return { content: [{ type: "text", text: JSON.stringify(check.error, null, 2) }] };
      }
      const snippet = store.save(title, code, language, tags);
      return {
        content: [{ type: "text", text: JSON.stringify({ success: true, commit_mode: "verified", ...snippet }) }],
      };
    }

    case "update_snippet": {
      const { id, code, title, veyra_token } = args as {
        id: string;
        code?: string;
        title?: string;
        veyra_token?: string;
      };
      const check = await requireVeyra(veyra_token);
      if (!check.ok) {
        return { content: [{ type: "text", text: JSON.stringify(check.error, null, 2) }] };
      }
      const snippet = store.update(id, { code, title });
      if (!snippet) {
        return {
          content: [{ type: "text", text: JSON.stringify({ success: false, error: "SnippetNotFound", id }) }],
        };
      }
      return {
        content: [{ type: "text", text: JSON.stringify({ success: true, commit_mode: "verified", ...snippet }) }],
      };
    }

    case "delete_snippet": {
      const { id, veyra_token } = args as { id: string; veyra_token?: string };
      const check = await requireVeyra(veyra_token);
      if (!check.ok) {
        return { content: [{ type: "text", text: JSON.stringify(check.error, null, 2) }] };
      }
      const deleted = store.del(id);
      return {
        content: [{ type: "text", text: JSON.stringify({ success: true, id, deleted, commit_mode: "verified" }) }],
      };
    }

    default:
      return {
        content: [{ type: "text", text: JSON.stringify({ error: "UnknownTool", tool: name }) }],
      };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("veyra-snippets server error:", err);
  process.exit(1);
});
