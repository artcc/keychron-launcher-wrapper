<p align="center">
	<img src="assets/keychron-launcher-wrapper.png" alt="Keychron Launcher Wrapper icon" width="115" />
</p>

# Keychron Launcher Wrapper

> Disclaimer: This is an independent community project and is not an official Keychron product.
> Keychron and related names are trademarks of their respective owners.

Minimal Electron desktop utility that opens the official Keychron Launcher in a dedicated app window, with WebHID support for configuring Keychron keyboards over wired USB.

## Scope

- Dedicated wrapper app, not a general-purpose browser
- Loads the official Keychron Launcher site
- Uses Electron's embedded Chromium runtime
- Primary target and distribution platform: macOS
- Also runs locally on Windows and Linux (WebHID behavior may vary by OS/runtime support)

## Features

- Single `BrowserWindow` with no tabs, address bar, or bookmarks
- Loads `https://launcher.keychron.com` on startup
- WebHID permission handling through Electron session handlers
- Keychron device auto-detection by vendor ID (0x3434) during HID selection
- Warning dialog when no HID devices are found
- `navigator.hid` runtime validation in the loaded page context
- Domain allowlisting and navigation hardening
- Optional pre-launch hint: connect keyboard by cable before continuing
- Auto-update via GitHub Releases (checks for new versions on launch)

## TODO

- [ ] Add Windows packaging and distribution (`.exe`, NSIS installer).
- [ ] Add Linux packaging and distribution (`.deb` for Debian/Ubuntu and derivatives).
- [ ] Evaluate additional Linux targets (for example, AppImage and `.rpm`) based on demand.
- [ ] Add CI matrix jobs for Windows and Linux artifacts.
- [ ] Add platform-specific verification notes for WebHID behavior on Windows and Linux.

## Installation and Usage

Setup, runtime usage, WebHID verification, and platform notes for macOS, Windows, and Linux are documented in [INSTALL.md](INSTALL.md).

## WebHID Permission Handling

The app uses Electron session APIs to keep HID access explicit and scoped:

- `setPermissionCheckHandler`: allows only `hid` and only from allowlisted origins.
- `setPermissionRequestHandler`: denies non-HID requests and non-allowlisted origins.
- `setDevicePermissionHandler`: allows HID device permissions only for allowlisted origins.
- `select-hid-device`: handles device selection explicitly for all cases. Auto-selects Keychron devices by vendor ID when found. Shows a warning dialog when no devices are detected. Blocks selection from non-allowlisted frames.

## Navigation Hardening

- Only HTTPS URLs are allowed.
- Only allowlisted hostnames can load in the app.
- `will-navigate` blocks non-allowlisted navigation.
- `setWindowOpenHandler` denies all popup windows.
- Allowed popup URLs are redirected into the single main window.
- Webviews are disabled with `will-attach-webview` prevention.

### Allowlist Override (if needed)

If the official launcher starts depending on additional hostnames, you can extend the allowlist without code changes:

```bash
KEYCHRON_ALLOWED_HOSTS="example-cdn.com,assets.example.com" npm start
```

Use this only for hostnames that are strictly required by the official Keychron Launcher.

## Limitations and Risks

- This wrapper depends on compatibility between the official Keychron Launcher site and the Chromium version bundled with the selected Electron version.
- Local builds may be unsigned unless you configure signing and notarization in your own environment.
- If the official launcher adds new third-party domains, the allowlist may need updates (or temporary extension via `KEYCHRON_ALLOWED_HOSTS`).
- HID access still depends on OS-level device behavior, cable quality, and keyboard mode/state.

## Project Structure

```text
.
├── .github/
│   ├── workflows/
│   │   └── build-macos.yml

├── assets/
│   └── keychron-launcher-wrapper.png
├── build/
│   ├── entitlements.mac.inherit.plist
│   └── entitlements.mac.plist
├── docs/
│   ├── index.html
│   └── styles.css
├── src/
│   ├── main.js
│   └── preload.js
├── AGENTS.md
├── CHANGELOG.md
├── CONTRIBUTING.md
├── INSTALL.md
├── LICENSE
├── README.md
└── package.json
```

## License

This project is licensed under the [Apache License 2.0](LICENSE).

## Author

GitHub: [ArtCC](https://github.com/ArtCC)

Arturo Carretero Calvo - 2026