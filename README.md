# Kobold Model Switcher

A [SillyTavern](https://github.com/SillyTavern/SillyTavern) extension for switching
KoboldCpp models **without restarting** the backend.

## Features

- Lists all models available to KoboldCpp via the `/v1/models` endpoint
- Switches the active model with a single click (no server restart)
- Auto-refreshes the model list every 30 seconds
- Works with both OpenAI-style (`{ data: [...] }`) and legacy model responses

## Requirements

KoboldCpp must be started in **Router Mode** or **Admin Mode**:

```bash
# Router mode
koboldcpp ... --routermode

# Admin mode
koboldcpp ... --admin --admindir /path/to/kcpps
```

## Installation

### Option 1 — Install from ZIP (recommended)

1. Open SillyTavern → **Extensions** → **Install Extension**.
2. Select the `kobold-model-switcher.zip` file.
3. Reload SillyTavern (F5 or restart the server).

### Option 2 — Manual copy

Extract this folder to:

```
~/.config/sillytavern/data/<your-user-handle>/extensions/kobold-model-switcher/
```

Then reload SillyTavern.

## Usage

1. Go to **Extensions → Settings → "Kobold Model Switcher"**.
2. Enter your KoboldCpp URL (default: `http://192.168.0.23:5001`).
3. Pick a model from the dropdown.
4. Click **Switch Model**.

The currently active model is shown below the dropdown.

## Files

| File            | Purpose                          |
| --------------- | -------------------------------- |
| `index.js`      | Extension logic                  |
| `settings.html` | Settings panel template          |
| `style.css`     | Panel styling                    |
| `manifest.json` | SillyTavern extension metadata   |

## License

MIT
