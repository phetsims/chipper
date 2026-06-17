# Description Editor server

The persistence service behind the Description Editor wrapper (`chipper/wrappers/description-editor`). It loads a sim's
accessibility description strings YAML, serves each a11y Fluent message's default-variant rendering as
provenance-tagged segments, and back-propagates in-place edits of those rendered sentences into the YAML, which
remains the single source of truth.

## Run

From the monorepo root:

```bash
bash perennial-alias/bin/sage run chipper/wrappers/description-editor/description-editor.ts --repo=quantum-wave-interference
```

The server has no UI of its own; open the editor wrapper against it, e.g.
`http://localhost/chipper/wrappers/description-editor/?sim=quantum-wave-interference&descriptionEditor`. Options:
`--port=...` (default 4621), and `--selfCheck` to build once, verify, and exit with a nonzero code on failure
(suitable for CI).

## How it works

- The YAML file is watched; external edits (IDE, git) push updates to connected editors over server-sent events,
  with changed messages reported so the wrapper can highlight them.
- Each a11y message is rendered once (default variants; free variables shown as `〈name〉` placeholders) into
  provenance-tagged segments, so the wrapper can map an edited phrase back to its source.
- In-place edits POST `{ dotKey, oldText, newText, valueOffset }`; the edit is located in the message's YAML scalar
  block (which covers every variant branch) and applied. Ambiguous or fragment-crossing edits are refused with an
  explanation; structural changes are made by editing the YAML directly in an IDE.
- After every change the server regenerates `{repo}-strings_en.json` (which unbuilt sims load directly, so edits
  survive a standalone relaunch) and exposes the flat string values over `GET /api/strings` so the wrapper can
  live-inject changed values into a running sim without reloading it.

## HTTP API

- `GET /api/document` — the provenance document: `{ document: { messages: [...] }, buildError, changedKeys }`.
- `GET /api/strings` — flat `dotKey → value` map plus the keys that changed since the last build.
- `GET /api/events` — server-sent events; an `update` event fires on every YAML change.
- `POST /api/edit` — apply one in-place static-text edit and write it back to the YAML.

## Architecture

- `loadYamlMessages.ts` — YAML → a11y leaf messages with Fluent IDs and YAML line provenance (mirrors the
  modulify conversion in `chipper/js/grunt/modulify/generateFluentTypes.ts`).
- `renderWithProvenance.ts` — a mini Fluent resolver emitting provenance-tagged segments, plus the
  FluentBundle self-check.
- `editYaml.ts` — back-propagation of static-text edits.
- `buildDescriptionDocument.ts` — renders one default-variant segment list per message into the JSON model
  served to the wrapper.
- `description-editor.ts` — dependency-free node HTTP server (JSON API, SSE, file watching, JSON regeneration).

@author Sam Reid (PhET Interactive Simulations)
