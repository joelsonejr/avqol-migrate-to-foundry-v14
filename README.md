# A/V Quality of Life

## About
Attempt to refactor the code, moving it towards foundry 14
## Features

AV/ Quality Of Life provides a number of features beyond the built-in Foundry options:

* Force the player setting your devices before connect on A/V.
* Custom virtual background.
* Camera device preview.
* Microphone device test.
* (Optional) Disable A/V controls
* (Optional) Enhanced Voice Button

## Requirements

* Foundry Virtual Tabletop **v13 or v14**.
* Audio/Video enabled in the world, in the core Audio/Video configuration (sidebar **Settings** tab → **Game Settings** → **Core**). Without it the camera dock and the module's audio and video tabs do not appear.
* A Chromium-based browser (Chrome, Edge, Brave) or the Foundry desktop app for virtual backgrounds. They are disabled on Firefox.
* Optional: [libWrapper](https://foundryvtt.com/packages/lib-wrapper). The module ships with a fallback and works without it, but libWrapper avoids conflicts with other modules.
* Optional: [LiveKit AVClient](https://foundryvtt.com/packages/avclient-livekit). Both it and Foundry's built-in A/V client are supported.

## Installation

This fork is not listed in Foundry's package browser, so searching for it by name will not find it. Install it with the manifest URL.

### Option 1: Manifest URL (recommended)

1. Open Foundry and go to the **Setup** screen. If a world is running, use **Return to Setup** first.
2. Open the **Add-on Modules** tab and click **Install Module**.
3. At the bottom of the dialog, paste this address into the **Manifest URL** field:

   ```
   https://github.com/joelsonejr/avqol-migrate-to-foundry-v14/releases/latest/download/module.json
   ```

4. Click **Install** and wait for "A/V Quality of Life" to show up in the module list.

Installing this way lets Foundry find new versions: use **Update All** on the same tab.

### Option 2: Manual installation

Use this when the Foundry server cannot reach GitHub.

1. Download `avqol.zip` from the [latest release](https://github.com/joelsonejr/avqol-migrate-to-foundry-v14/releases/latest).
2. Find your Foundry user data folder. Its path is shown in the Foundry **Setup → Configuration** screen. The defaults are:
   * Windows: `%localappdata%\FoundryVTT`
   * macOS: `~/Library/Application Support/FoundryVTT`
   * Linux: `~/.local/share/FoundryVTT`
3. Inside it, create the folder `Data/modules/avqol`. The name must be exactly `avqol`.
4. Extract the zip **into that folder**. The zip has no top-level folder, so `module.json` must end up at `Data/modules/avqol/module.json`.
5. Restart Foundry, or return to Setup, so the module list is read again.

### Enabling the module in a world

Installing does not turn the module on. In each world where you want it:

1. Launch the world as a Gamemaster.
2. Open the **Settings** tab of the sidebar and click **Module Management**.
3. Tick **A/V Quality of Life** and click **Save Module Settings**. The world reloads.

### Where to find the settings

* **Per user** (camera, virtual background, microphone, voice mode): open your own **User Configuration** from the player list and use the **Audio** and **Video** tabs.
* **Per world** (Gamemaster only): sidebar **Settings** tab → **Game Settings** → **A/V Quality of Life**.

### Installing from source (development)

```
git clone https://github.com/joelsonejr/avqol-migrate-to-foundry-v14.git
cd avqol-migrate-to-foundry-v14
npm install
npm run build
```

The build output goes to `dist/`. Link it into your Foundry modules folder under the name `avqol`, for example on Linux:

```
ln -s "$PWD/dist" ~/.local/share/FoundryVTT/Data/modules/avqol
```

Use `npm run build:watch` to rebuild on every change, and reload the browser to pick it up. Remove any copy of the module installed through the manifest first, since both use the `avqol` folder.

## Virtual Backgrounds

> **NOTE:** This feature is only available for the **Chrome** browser.

* Blur background
* Custom image/video
