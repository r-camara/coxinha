# Spec 0033: MCP server

- **Status:** draft
- **Phase:** F4
- **Owner:** Rodolfo
- **Depends on:** spec 0005, spec 0032
- **Relevant ADRs:** —

## Why
Expose the vault as a tool to Claude Desktop, Cursor, and other
MCP clients.

## Scope

### In
- Embedded MCP server (stdio or local HTTP)
- Tools: `search_notes`, `read_note`, `list_meetings`,
  `chat_with_vault`
- Configurable under Settings (on/off + simple auth)

### Out
- Remote MCP server (internet-facing) → no
