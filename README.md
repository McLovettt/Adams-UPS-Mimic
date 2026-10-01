# Adams UPS Trainer v0.7

A static browser-based UPS switching and training simulator.

## Structure

```text
Adams_UPS_Trainer_v0_7/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── app.js
│   ├── single-ups.js
│   ├── parallel-ups.js
│   ├── castell.js
│   └── auxiliaries.js
└── assets/
    └── images/
```

## What each JavaScript file does

- `app.js` — shared UI helpers and tab navigation
- `single-ups.js` — Single UPS switching, synchronisation, battery and fault logic
- `parallel-ups.js` — Parallel UPS mode
- `castell.js` — Castell-key switching logic and battery-test timer
- `auxiliaries.js` — Lights & Auxiliaries toggle and clickable signal highlighting

## Publish with GitHub Pages

1. Go to **Settings → Pages**.
2. Under **Build and deployment**, select **Deploy from a branch**.
3. Choose branch `main` and folder `/ (root)`.
4. Save.

## Local testing

This project has no backend. On desktop you can usually open `index.html` directly. If a browser blocks local sibling CSS/JS files, serve the folder with a local HTTP server.

## Safety

Training simulator only. It is not a substitute for an approved manufacturer or site switching procedure.
