# Menu Bar Setup for Tikker

This document describes the menu bar functionality that was replicated from the retropulse-main project.

## Overview

The tikker application now includes a macOS menu bar (tray) icon that allows users to:
- Click the icon to show/hide the main application window
- Right-click to access a context menu with a "Quit" option
- The application runs as an accessory app (no dock icon)

## Implementation Details

### Files Modified/Created

1. **`src-tauri/Cargo.toml`**
   - Added `macos-private-api`, `tray-icon`, and `image-png` features to tauri
   - Added `tauri-plugin-positioner` dependency

2. **`src-tauri/src/tray.rs`** (new file)
   - Implements the menu bar functionality
   - Creates a tray icon with template image support
   - Handles left-click to show/hide window
   - Handles right-click menu with quit option

3. **`src-tauri/src/lib.rs`**
   - Added tray module import
   - Integrated tray initialization in the app setup
   - Added macOS-specific activation policy

4. **`src-tauri/tauri.conf.json`**
   - Added `macOSPrivateApi: true`
   - Modified window configuration for menu bar app behavior
   - Set window properties for overlay-style window

5. **`src-tauri/assets/menubar-icon.png`**
   - Copied from retropulse-main project
   - Template-style icon for menu bar

### Key Features

- **Template Icon**: The menu bar icon uses template mode for proper macOS integration
- **Window Positioning**: Uses `tauri-plugin-positioner` to position the window below the menu bar icon
- **Accessory App**: Runs without a dock icon using `ActivationPolicy::Accessory`
- **Context Menu**: Right-click provides a quit option
- **Show/Hide**: Left-click toggles window visibility

### Usage

1. Build the application: `pnpm tauri build`
2. Run the application: `pnpm tauri dev` or run the built app
3. The menu bar icon will appear in the top-right of the menu bar
4. Click the icon to show/hide the main window
5. Right-click for the context menu

## Dependencies

- `tauri-plugin-positioner`: For window positioning relative to the menu bar
- `tauri` with `macos-private-api`, `tray-icon`, and `image-png` features

## Notes

- This implementation is macOS-specific and uses the `macos-private-api` feature
- The window is configured as an overlay-style window suitable for menu bar apps
- The application runs as an accessory app, meaning it won't appear in the dock 