# Roy's Verdict™

A playful single-page app that asks the big question: **Do you think Roy is a good person?**  
Yes gets you confetti and a persistent counter; No triggers escalating confirmation dialogs until you choose Yes.

## Features

- **Yes flow:** Success overlay, confetti, a short success sound, and a **live Yes counter** (persists, resettable)
- **No flow:** Escalating “Are you sure?” messages in a modal
- Responsive layout, accessibility-friendly (focus management, ARIA, semantic HTML)
- Optional Node server for local dev or deployment (e.g. Heroku, Railway)

## Prerequisites

- **Node.js** 14+ (only needed if you use the Node server)
- A modern browser (Chrome, Firefox, Safari, Edge)

## Quick start

### Option 1: Node server (recommended)

```bash
cd roy-approval-system
npm start
```

Then open **http://localhost:3000** (or the port shown in the terminal; `PORT` env var is supported).

### Option 2: Static only (no backend)

```bash
cd roy-approval-system
npm run dev
```

Uses `serve` to serve the folder at **http://localhost:3000**. No `server.js`; good for static hosting.

### Option 3: Open `index.html` directly

You can open `index.html` in a browser. Some features (e.g. correct MIME types) work best with a local server.

## Project structure

```
roy-approval-system/
├── index.html      # Main page, header (logo + Yes counter), hero, modal, success overlay
├── styles.css      # Layout, theme, responsive rules, reduced-motion support
├── script.js       # Yes/No logic, modal, confetti, sounds, Yes counter (localStorage)
├── server.js       # Optional static file server (path-safe, cache headers, MIME types)
├── package.json    # Scripts and metadata
├── .gitignore
└── README.md       # This file
```

## How the code works

### Frontend (`index.html` + `styles.css`)

- **Header:** Logo (Roy's Verdict™), tagline, and a **Yes counter** card showing how many times Yes was clicked. The counter has a **Reset** button that clears the count and `localStorage`.
- **Hero:** The main question and two buttons (Yes / No). Yes and No use the same size and styling; only the modal and messages change for No.
- **Modal (`<dialog>`):** Shown when the user clicks No. Displays escalating messages (e.g. “Are you sure?”, “Really sure?”) and two actions: “Actually, Yes” (runs the Yes flow and closes the modal) and “Still No” (cycles to the next message, plays a short “sad” sound). The dialog does not close on Escape or backdrop click; the user must pick a button.
- **Success overlay:** Full-screen overlay with a random success message, icon, confetti (canvas), and a “Continue” button. Shown after any Yes (from the main button or from the modal). Focus is moved to “Continue” when shown and back to the Yes button when closed.
- **CSS:** Uses CSS variables for colors, radii, and shadows. Animations (gradient pulse, logo wiggle, success pop, modal fade) are wrapped in `prefers-reduced-motion: no-preference` so they are disabled when the user prefers reduced motion.

### Logic (`script.js`)

- **State:** `yesClickCount` is the number of Yes clicks; it is read from `localStorage` on load and saved after each Yes. `noClickCount` tracks how many times No (or “Still No”) was used, and only drives which modal message is shown.
- **Yes flow:** On Yes (main or “Actually, Yes”), the script picks a success message (from two arrays that loop), increments `yesClickCount`, saves to `localStorage`, updates the counter in the header, shows the success overlay, runs the confetti animation (unless reduced motion), and plays a short success chord (Web Audio).
- **No flow:** On No, the script increments `noClickCount`, opens the modal, and sets the message from `ESCALATING_MESSAGES` (index = `(noClickCount - 1) % length`). On “Still No” it increments again, plays a “sad” tone, and updates the message only (no other UI change).
- **Confetti:** Implemented with a canvas: particles are created from the center, then animated with gravity and rotation until they leave the viewport. The animation is cancelled when the success overlay is closed. Canvas size and scaling use `devicePixelRatio` (capped at 2) for sharp rendering.
- **Accessibility:** Focus is moved to “Continue” when the success overlay appears and back to the Yes button when it closes. The counter region has `aria-live="polite"` and `aria-atomic="true"` so updates are announced. Reduced motion is respected for animations and confetti.

### Server (`server.js`)

- Serves static files from the project directory. Request paths are normalized and checked so responses stay under the public directory (no path traversal). HTML is sent with `Cache-Control: no-cache`; other static assets use `Cache-Control: public, max-age=60`. MIME types are set for common extensions (e.g. `.html`, `.css`, `.js`, `.svg`, `.png`).

## Scripts

| Command        | Description                          |
|----------------|--------------------------------------|
| `npm start`    | Run Node server (uses `PORT` or 3000) |
| `npm run dev`  | Serve static files with `serve` on 3000 |

## Tech stack

- Vanilla HTML, CSS, and JavaScript (no frameworks)
- Native `<dialog>` for the “Are you sure?” modal
- Canvas 2D for confetti
- Web Audio API for the success chime
- Google Fonts: Outfit, JetBrains Mono

## License

MIT
