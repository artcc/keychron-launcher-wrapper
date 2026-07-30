## Scope

This repository is a minimal Electron macOS utility that wraps the official Keychron Launcher website for Keychron keyboard configuration. It exists so users can configure their keyboards without installing Chrome or any general-purpose browser.

## Priorities

1. Working WebHID support
2. Minimal code
3. Stable dedicated app behavior
4. Reasonable security hardening
5. Clear docs

## Rules

- Do not reimplement keyboard HID protocol
- Do not clone Keychron Launcher UI
- Do not add unrelated product features
- Do not introduce heavy dependencies without strong justification
- Keep code easy to read
- Prefer plain JavaScript; only use TypeScript if it meaningfully improves the result
- Prefer correctness over visual polish
- Document limitations honestly

## UX

- Single window
- No browser chrome, no tabs, no address bar, no bookmarks
- Focus on loading the official Keychron Launcher reliably

## Platform

- macOS first
- Wired USB for the initial version

## Technical

- Validate that `navigator.hid` is available in the loaded page context
- Explicit handling of HID permissions and device selection
- Domain allowlisting and navigation hardening
- Secure Electron defaults (contextIsolation, sandbox, no nodeIntegration)
- Packaging-ready project structure for macOS

## Release workflow

When asked to bump or release a new version:
1. Ask the user which version number (e.g. `0.0.6`)
2. Add a new entry at the top of `CHANGELOG.md` with the version, date, and relevant changes
3. Update `"version"` in `package.json` to match
4. The user must push the tag manually (`git tag 0.0.6 && git push origin 0.0.6`) — the tag triggers the CI release workflow