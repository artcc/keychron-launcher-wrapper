# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog, and this project follows Semantic Versioning.

## [0.0.6] - 2026-07-30

### Added

- Added native macOS menu bar with standard Edit, View, and Window menus.
- Added "Check for Updates..." menu item in the app menu (only active in packaged builds).

### Changed

- Restricted macOS builds to arm64 (Apple Silicon) only.
- Simplified CI release workflow to rely on manual tag push instead of automatic tag creation.
- Removed x64 build targets (Intel Mac support deprecated by Apple).
- Merged `.github/copilot-instructions.md` into `AGENTS.md` and removed the file.
- Updated `AGENTS.md` with release workflow and agent guidelines.
- Updated `README.md` with new features (auto-update, Keychron auto-detection, HID warnings).

## [0.0.5] - 2026-07-30

### Added

- Added auto-update support via `electron-updater` using GitHub Releases as update feed.
- Added multi-architecture macOS build targets (arm64 and x64).
- Added warning dialog when no HID devices are found during device selection.

### Changed

- Pinned Electron version to 41.10.3 (exact, no caret range).
- Updated `electron-builder` to 26.15.3.
- Updated CI release workflow to generate auto-update metadata (`latest.yml`).

### Fixed

- Fixed `select-hid-device` handler to explicitly manage device selection for all cases (zero, single, and multiple devices).
- Added Keychron vendor ID (0x3434) auto-detection in device selection.
- Fixed `setPermissionRequestHandler` to fall back to `requestingOrigin` when `requestingUrl` is unavailable.
- Migrated deprecated `console-message` event handler to the new event-based API.

## [0.0.4] - 2026-03-16

### Added

- Added a GitHub Pages static landing under `docs/`.
- Added app icon support in the website as both visible logo and favicon (`docs/favicon.png`).

### Changed

- Updated landing page content to English.
- Switched landing page to a dark theme with a centered main container layout.
- Extended landing page copy to mention Linux, Windows, and macOS availability.
- Expanded README with GitHub Pages setup instructions and docs structure references.

## [0.0.3] - 2026-03-15

### Added

- Added release automation for macOS builds with changelog-based GitHub Release notes.
- Added signing and notarization preparation for release builds using Apple credentials from GitHub Actions secrets.
- Added macOS entitlements files for hardened runtime packaging.

### Changed

- Updated CI to use Node.js 22 LTS.
- Expanded and aligned README content for scope, platform support, release flow, and signing/notarization requirements.
- Improved app branding details (icon usage in dialogs and release documentation consistency).

## [0.0.2] - 2026-03-15

### Changed

- Updated runtime and packaging toolchain dependencies: Electron to 41.0.2 and electron-builder to 26.8.1.
- Restricted DevTools to development by default; packaged builds now keep DevTools disabled unless explicitly enabled.

## [0.0.1] - 2026-03-15

### Added

- Initial Electron macOS wrapper project.
- Single dedicated BrowserWindow loading the official Keychron Launcher.
- WebHID permission and device selection handling.
- Domain allowlisting and navigation hardening.
- Minimal preload and secure Electron defaults.
- Basic macOS packaging scripts with electron-builder.
- Project documentation and repository guidelines.
