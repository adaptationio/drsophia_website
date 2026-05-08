# Sha'p Left Production-Spec Chat Artifact

Single-file HTML artifact that lets the team chat with the full production-spec briefing (7 chapters, ~62K words) using `window.claude.complete()` once it's published as a Claude.ai Live App.

**Files**

- `bundle.html` — the artifact (453 KB; all data + UI + chat logic inline; React-free, no CDN dependencies)
- `README.md` — this file

**What's inside**

- All 7 chapters of the production-spec briefing embedded as JSON
  1. The Meta Idea + Nurses Station Full Flow (~11.5K words)
  2. Regulatory Canvas — Cipla bundle + extended canvas (~11.2K words)
  3. SRS — IEEE 29148 (FR-001 to FR-128, NFR-001 to NFR-064, UC-01 to UC-08) (~18.9K words)
  4. Rubric, Metrics, KPIs, SLOs (G1/G2/G3 gates, 16 dimensions, 35 KPIs, 15 SLOs) (~7.9K words)
  5. Demo → Production Roadmap + 55-row Risk Register (~6.9K words)
  6. Document Library + Cross-References
  7. AusHealth Opportunity Stack (~6.4K words)
- SHA-256 password gate matching the briefing site (`DrSophia2027!@#$`)
- Vanilla HTML/CSS/JS — no React, no Vite, no shadcn build step (matches the Foaster Live App pattern documented in `wiki/concepts/claude-artifacts-builder.md`)
- Brand-aligned: green `#00633c` / `#00422a`, cream `#f7f3ec`, `Inter`/system font

## Local test

```bash
# Open in a browser
open /mnt/c/data/github/botaniqal-medtech/botaniqal-medtech/docs/briefings/2026-05-08-cipla-sa-production-spec/chat-artifact/bundle.html
# or
python3 -m http.server -d /mnt/c/data/github/botaniqal-medtech/botaniqal-medtech/docs/briefings/2026-05-08-cipla-sa-production-spec/chat-artifact 8765
# then open http://localhost:8765/bundle.html
```

Enter the password (`DrSophia2027!@#$`). You'll see the chapter list on the left, the chat panel in the middle, and a "Read-only" badge in the top-right because `window.claude` isn't available outside the Claude.ai runtime.

The **Browse data** tab works fully offline — every chapter renders end-to-end, scoped by the chapter selector.

The **Chat** tab will display "Read-only mode" and explain that live chat requires the Claude.ai runtime. (This is expected behaviour; same dual-mode pattern as the Foaster Live App.)

## Publishing to Claude.ai (the proven Foaster pattern)

Per `wiki/concepts/claude-artifacts-builder.md` §"Foaster intel Live App" — the same playbook worked end-to-end on 2026-05-08. The artifact is ~453 KB so Claude will read it in chunks; expect 2-4 minutes for faithful reproduction.

**Pre-flight: must be logged in as `willie@botaniqal.com.au`** for org-private (Share) mode. Personal Max account = public publish only.

1. Go to <https://claude.ai>
2. Top-left workspace selector — confirm you're in **Team Botaniqal** (not personal Max)
3. Open a new chat
4. Click "Add files or photos" → upload `bundle.html`
5. Send this prompt verbatim:

   ```
   Create an HTML Artifact (using the Artifacts tool — I want a real renderable
   Live App, not a file attachment) with the EXACT contents of the bundle.html
   file you just stored. Don't paraphrase, don't summarise, don't change a byte.
   Use create_file (not present_files) so the artifact harness wraps it in the
   Live-App iframe and injects window.claude.complete().
   ```

6. Claude will read the file in sections and use `create_file` to register the artifact. Watch for tool-call narration ("Reconciling file recreation with artifact tool requirements"). Be patient.
7. Verify byte-equivalence: ask Claude to `md5sum` the file it created and compare against the original (`md5sum bundle.html` locally).
8. In the artifact panel, click the chevron next to "Copy" → **Publish artifact** → **Publish to web** (or **Share** for org-only access in Team Botaniqal) → **Publish & copy link**.
9. URL will be `https://claude.ai/public/artifacts/<uuid>` (Publish) or org-gated equivalent (Share).
10. Test the public URL in an incognito window: enter the password → unlock → "Live · Claude" badge should flip green within a few seconds → chat works.

### Why `create_file`, not `present_files`

`present_files` shows a download button + "too large to preview" panel. Only `create_file` registers the path so the artifact harness wraps it in the Live-App iframe with `window.claude.complete()` injected. If you skip this, chat won't work even after publish.

### Share vs Publish

| Mode | Plan required | Visibility | Storage |
|---|---|---|---|
| **Publish** (public URL) | Free / Pro / Max | Anyone with URL | Public personal or shared store |
| **Share** (org-internal) | Team / Enterprise | Logged-in Botaniqal org members only | Per-org shared store |

For a confidential team briefing, **Share from Team Botaniqal** is the right call. Willie owns Team Botaniqal (`willie@botaniqal.com.au`, 6 seats); Dwayne, Julia, Michel, Ramona are already members.

If you Publish (public URL): the password gate still applies — viewers without the password can't get past the unlock screen.

## How the chat works

- The artifact assembles a system prompt containing the full briefing data scoped by the active chapter (or all chapters), plus the recent conversation history (last 12 turns).
- Sends to `window.claude.complete(prompt)` — Claude.ai's per-viewer-billed completion API. Usage charged to the viewer's plan, NOT the creator's.
- Response is rendered as markdown via DOMParser + tag whitelist (XSS-safe: `<p>`, `<strong>`, `<em>`, `<a>`, `<code>`, `<pre>`, `<ul>`, `<ol>`, `<li>`, `<blockquote>`, `<h1-h4>`, `<br>`, `<span>`, `<hr>` only; everything else is stripped).
- Multi-turn: history accumulates locally in `state.history`; reset via the footer button.

### Chapter scope

Click a chapter on the left to scope chat answers to that chapter only. Click "All chapters" to widen scope. The "Browse data" tab respects the same scope.

### Claude availability detection

The badge shows "Read-only" until `window.claude.complete` attaches. The artifact polls every 300ms × 20 attempts, then every 2s × 30 attempts. If Claude attaches late (sometimes happens), the badge auto-flips to "Live · Claude". If polling misses, the first send still re-checks and flips the badge.

## Limitations

- **Artifact size cap**: Claude.ai allows up to ~5 MB per artifact (HTML + storage). We're at 453 KB so that's fine.
- **20 MB persistent storage cap** if we ever add `window.storage.getItem/setItem` for note-saving. We don't currently use it.
- **90-day retention on shared artifacts** from last modification. Inactivity > 90 days expires the storage. The HTML itself stays — but if we ever add storage, that's the cliff.
- **Unpublishing is one-way and destructive** — clicking Unpublish permanently deletes any stored data and you can't re-publish that same artifact again. If we update content, mint a new URL.
- **Per-publish URL versioning is suspected** — Anthropic wording implies each publish action mints a new UUID. Verify on first publish before promising a stable bookmark URL to the team.
- **No external API keys** — the artifact ships as static HTML. Any keys baked in are visible to every viewer. We don't bake any.
- **`fetch()` is restricted** — only whitelisted domains. We don't use `fetch()`; everything is local-data + the built-in `window.claude.complete` API.

## Updating the data

If the underlying wiki pages change and we need to refresh the artifact:

1. Re-run the build script in `/tmp/build_briefing_data.py` (it concatenates the current wiki pages into `briefing_data.json`).
2. Re-build `bundle.html` by replacing the `__BRIEFING_DATA__` placeholder in the template (or just regenerate the whole file from the build script).
3. Mint a new artifact URL (Anthropic wording suggests publishes mint new UUIDs; old URL likely stays alive but stale).
4. Update Willie's record of the canonical artifact URL.

## Source documents

The 7 chapters are sourced from `/mnt/c/data/github/team_willie/wiki/concepts/`:

| Chapter | Source file |
|---|---|
| 01 | `shap-left-nurses-station-full-flow-may2026.md` |
| 02 | `cipla-sa-regulatory-bundle-may2026.md` + `sa-regulatory-canvas-extended-may2026.md` |
| 03 | `shap-left-srs-functional-spec-may2026.md` |
| 04 | `shap-left-rubric-metrics-may2026.md` |
| 05 | `shap-left-demo-to-production-roadmap-may2026.md` |
| 06 | (synthesised summary; cross-references the others) |
| 07 | `aushealth-opportunity-stack-may2026.md` |

Frontmatter is stripped on embed; full body content is preserved verbatim.

## Reference

- Pattern reference: `/mnt/c/data/github/team_willie/wiki/concepts/claude-artifacts-builder.md` §"Foaster intel Live App (2026-05-08)" — the closest documented precedent
- Briefing site (parent): `https://docs.drsophia.ai/briefings/2026-05-08-cipla-sa-production-spec/` (same password)
- Underlying wiki pages: `/mnt/c/data/github/team_willie/wiki/concepts/shap-left-*.md` + `cipla-sa-regulatory-bundle-may2026.md` + `sa-regulatory-canvas-extended-may2026.md` + `aushealth-opportunity-stack-may2026.md`

## Password

`DrSophia2027!@#$` — same as the briefing site. SHA-256 hash hard-coded in the bundle (`8e56d1894de3e96f63f10721f639a224292987ce36b6a3e5f560650be9fced6f`); plaintext is never stored.
