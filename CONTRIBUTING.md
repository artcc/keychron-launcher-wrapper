# Contributing

Thank you for contributing to Keychron Launcher Wrapper.

## Scope

This project is a minimal macOS Electron wrapper for the Keychron Launcher website with WebHID support. Please keep contributions aligned with this scope.

## Ground Rules

- Do not reimplement Keychron HID protocol logic.
- Do not clone or replace the Keychron Launcher UI.
- Keep changes minimal and focused.
- Prefer plain JavaScript and avoid heavy dependencies.
- Preserve security hardening and domain restrictions.

## Development Setup

1. Install dependencies:

```bash
npm install
```

2. Run the app:

```bash
npm start
```

3. Optional debug mode:

```bash
KEYCHRON_DEBUG=1 ELECTRON_ENABLE_LOGGING=1 ELECTRON_ENABLE_STACK_DUMPING=1 npm start
```

## Branching and Commits

- Create a feature branch from main.
- Keep commits small and descriptive.
- Use commit messages like:
  - feat: add allowlist override docs
  - fix: improve HID device selection callback
  - docs: update troubleshooting section

## Pull Requests

Please include:

- What changed and why.
- Any security implications.
- How you tested (macOS version, keyboard model, wired mode).
- Screenshots only if UI behavior changed.

## Testing Checklist

Before opening a PR:

- App launches and loads https://launcher.keychron.com.
- HID permission flow works for wired keyboard usage.
- Navigation restrictions still behave as expected.
- No unrelated files or local artifacts are included in the PR.

## Reporting Issues

When filing a bug, include:

- macOS version
- Keyboard model (for example, any Keychron keyboard)
- Connection mode (wired/wireless)
- Steps to reproduce
- Relevant logs (redact sensitive data)

## Code of Conduct

Please be respectful and constructive in all interactions.
