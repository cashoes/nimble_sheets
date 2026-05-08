# NIMBLE Tracker

The NIMBLE Tracker is a modular, data-driven suite of digital character trackers for the NIMBLE TTRPG. It produces lightweight, self-contained HTML sheets that are highly portable and Lore-accurate.

---

## 🎮 Player Setup Guide

To get the most out of the NIMBLE Tracker, especially if you are playing on **Owlbear Rodeo**, follow these steps to set up your character and bridge your rolls.

### 1. Generate Your Tracker
1. Visit the [NIMBLE Builder](https://cashoes.github.io/nimble_sheets/).
2. Select your **Class**.
3. Click **Download Tracker**.
4. Save the resulting `.html` file to your computer. You can open this file in any web browser to manage your character.

### 2. Install the Browser Bridge (For Owlbear Rodeo)
To send your rolls directly from your character sheet to Owlbear Rodeo's **Dice+**, you need to install the browser extension.

1. Download this repository as a ZIP (Click **Code** > **Download ZIP**) and extract it.
2. Open your browser's Extension page:
   - **Chrome/Edge/Brave**: Go to `chrome://extensions/`
3. Enable **Developer Mode** (usually a toggle in the top-right).
4. Click **Load Unpacked**.
5. Select the folder: `src/extensions/browser_bridge` inside the extracted repository.
6. The "NIMBLE Dice+ Bridge" should now appear in your extensions list.

### 3. Add the Extension to Owlbear Rodeo
Finally, the OBR room needs to be able to receive the rolls.

1. Open your **Owlbear Rodeo** room.
2. Go to the **Extensions** tab (the puzzle piece icon).
3. Click **Add Extension** (the `+` icon).
4. Paste the following Manifest URL:
   `https://cashoes.github.io/nimble_sheets/src/extensions/obr_relay/manifest.json`
5. Click **Add**.

---

## 🎲 How to Use
- **Opening your Sheet**: Simply double-click your downloaded `.html` file. It works offline!
- **Rolling Dice**: Click on any gold-highlighted stat or weapon notation (e.g., `⚔️ 1d8+3`).
- **Saving**: The tracker auto-saves to your browser's local storage. To be safe, you can use the **Save as HTML** link in the top-left to download a fresh copy with your current data embedded.
- **Roll Advantage**: Use the **+ / -** buttons in the top-left of the tracker to set global Advantage or Disadvantage before you roll.

---

## 🛠️ Development
This project uses a modular `src/` structure with shared engine modules.

### Project Structure
- **Builder**: `index.html` (generates self-contained tracker HTML files)
- **Template**: `src/base_template.html` (HTML + CSS for trackers)
- **Engine**: `src/engine/` (shared modules: BaseClass, PanelBuilder, FeatureGen, etc.)
- **Class Data**: `src/data/class_[name].js` (11 character classes)
- **Game Data**: `src/data/json/` (spells, items, ancestries, etc.)

### Architecture Documentation
See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed documentation on:
- Engine module descriptions
- Class structure and configuration
- Build process and data flow
- How to add new classes

### Quick Start
1. Serve the root directory: `python -m http.server 8000`
2. Open `http://localhost:8000` in your browser
3. Use the builder to select a class and download a tracker
4. Open the downloaded `.html` file to manage your character

### Key Design Principles
- **Self-contained output**: Each tracker is a single HTML file with all JS/CSS embedded
- **Configuration over inheritance**: Classes declare *what* they are via config, not *how* to do things
- **Deduplication**: Shared logic lives in engine modules (BaseClass, PanelBuilder, FeatureGen)
