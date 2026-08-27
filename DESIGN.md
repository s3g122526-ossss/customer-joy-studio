# DESIGN.md — Kennedy × Takii Caddy Kitchen

A complete design reference for this website: the visual language, every animation,
the sound system, and **how each effect is achieved** so it can be reproduced,
tuned, or ported to another stack. No code changes are described here — this is
documentation only.

---

## 1. Brand & Visual Direction

| Aspect | Decision |
| --- | --- |
| Concept | "Charcoal & Dum Kitchen" — a premium desi grill restaurant with a playful **caddy** companion (Takii, the AI voice caddy). |
| Mood | Warm cream paper, flame red, ember orange, gold foil — like a luxury printed menu over charcoal embers. |
| Mascots | White glossy robot (`white-robot.png`) that trails the cursor, and Takii caddy-bot avatar (`caddy-avatar.jpg`) used for the voice agent and menu-book crest. |
| Voice | The site literally talks: Web Speech API announces pages, and a WebAudio sound kit punctuates interactions. |

### Color tokens (`src/styles.css` `@theme`)

| Token | Value (oklch) | Used for |
| --- | --- | --- |
| `--color-cream` | `0.947 0.041 87.5` | Page background, card borders |
| `--color-cream-deep` | `0.906 0.056 84` | Recessed cream surfaces |
| `--color-flame` | `0.585 0.238 27.5` | Primary brand red — buttons, likes, string of cursor robot |
| `--color-flame-dark` | `0.47 0.2 27.5` | Active/pressed states |
| `--color-ember` | `0.75 0.18 62` | Warm orange accents, gradients |
| `--color-gold` | `0.85 0.15 88` | Foil highlights, luxury bands |
| `--color-charcoal` | `0.28 0.03 40` | Text, outlines, dark surfaces |

Shadows are warm-tinted (charcoal-based), never pure black:
`--shadow-card`, `--shadow-card-hover`, `--shadow-pill`.

### Typography

| Role | Font | Where |
| --- | --- | --- |
| `--font-hero` | **Anton** | Giant hero title, poster numerals |
| `--font-display` | **Baloo 2** | Headings, prices, marquee items |
| `--font-body` | **Nunito** | Body text (site default) |
| `--font-poster` | **Mouse Memoirs** | Playful retro labels |

Fonts load via `<link>` tags in `src/routes/__root.tsx` (never `@import` in CSS —
Tailwind v4 / Lightning CSS requirement).

Signature text treatments (defined as `@utility` in `styles.css`):

- **`hero-title`** — cream foil letters with a 3px charcoal outline
  (`-webkit-text-stroke` + `paint-order: stroke fill`) and a stacked 4-layer
  `text-shadow` (gold rim → ember → charcoal bevel → soft drop shadow) giving a
  3D "menu board" bevel.
- **`hero-glow`** — radial ember glow placed behind hero type.
- **`text-stroked`** — heavy 4px outline text for poster sections.

---

## 2. Layout & Surfaces

- Base radius `--radius: 0.625rem`, scaled up to `--radius-4xl` for big cards.
- Global `prefers-reduced-motion` block collapses **all** animations/transitions
  to `0.01ms` — accessibility is enforced at the CSS root.
- Standard shadcn semantic tokens (`--background`, `--primary`, `--card`, …) are
  kept in sync; components must use semantic utilities, never hardcoded colors.

---

## 3. Animations — each effect and how to achieve it

### 3.1 Bonus Tape — double tilted luxury marquee (`BonusTape.tsx`)

Two full-width ribbons crossing the section at opposing angles
(`rotate(-2.6deg)` and `rotate(2.2deg)`), one gold-gradient, one flame-gradient,
scrolling in **opposite directions**.

How it's done:
- `.tape` is 112% wide, pulled `-6%` left so the tilt never shows gaps; edges are
  feathered with a `mask-image: linear-gradient(to right, transparent, #000 5% …)`.
- The content row is duplicated and animated with
  `@keyframes tape-scroll { to { transform: translate3d(-100%,0,0) } }`,
  `38s linear infinite`; the reverse band uses `animation-direction: reverse; 46s`.
- `will-change: transform` keeps it on the GPU; hover pauses
  (`animation-play-state: paused`); individual items lift on hover
  (`translateY(-2px) scale(1.04)`).
- A `::after` gloss gradient (white top, charcoal bottom) gives the tape a
  laminated sheen.

### 3.2 Glass menu cards (`MenuShowcase.tsx` / `.glass-card`)

Clash-style glassmorphism product cards: `backdrop-filter: blur(24px)
saturate(180%)`, 25% white fill, 1px white border, layered warm shadows, and a
`::before` top highlight for the "glass pane" look.

- Image zooms `scale(1.05)` on hover over `0.6s cubic-bezier(0.34,1.3,0.64,1)`
  (a gentle overshoot ease used across the whole site).
- Heart button: flame-red circle that `scale(1.12) rotate(8deg)` on hover.
- Section background uses `menu-grain` — two offset 1px radial dot grids
  (flame + ember at 8% opacity) for a printed-paper texture.

### 3.3 Cursor Robot — elastic dish string (`CursorRobot.tsx`)

The signature effect. A glossy white robot head chases the cursor with the 5
signature dishes hanging beneath it on a dashed flame-red string.

How it's achieved:
- Pure `requestAnimationFrame` spring physics — no library. Each bead stores
  `{x, y, vx, vy}`; every frame `v = (v + (target - pos) * k) * d; pos += v`.
- Stiffness `k = 0.45` (head) down to `0.30` (last bead), damping `0.52–0.55` —
  **deliberately stiff** so the string barely stretches (elasticity was reduced
  on request). Each bead hangs `26 + i*2`px below the one above.
- The string is an SVG `<path>` rebuilt every frame as quadratic curves through
  bead midpoints with only **2px sag**, dashed `5 6`, `stroke: var(--color-flame)`.
- Extras: head tilts with horizontal velocity (clamped ±12°), squashes to 0.78
  on pointerdown and springs back, whole rig fades in/out with pointer presence.
- Disabled on touch devices (`pointer: coarse`), small screens (`hidden md:block`)
  and reduced motion.

### 3.4 The Menu Book (`MenuBook.tsx`)

A physical 3D flip-book. The cover (Takii caddy crest + "Kennedy" foil title)
opens to a stack of dish pages; tapping a photo page flips it over to reveal the
recipe, notes, price and an **"Order this"** button on the back.

How it's achieved:
- Each page is an absolutely stacked element with CSS `transform: rotateY()`
  driven by an `is-open` class and a `--i` custom property for stacking
  (`z-index`/timing). Front/back faces use `backface-visibility: hidden`.
- `book-float` keyframes (`7s ease-in-out infinite`) give the closed book a slow
  idle hover; a `menu-scene__glow` radial sits beneath it.
- **Sound sync**: the toggle handler computes `willOpen` *before* the state
  update, plays `swoosh` (open) / `pop` (close) immediately, cancels any queued
  speech, then speaks the dish name via `SpeechSynthesisUtterance`
  (rate 0.92, pitch 0.9, volume 0.6).
- **Glitch guard**: a 320ms `lockRef` debounce blocks double-firing from
  pointer+click or frantic tapping, so pages can never half-flip and voice lines
  never overlap. Speech is also cancelled on unmount and when closing the book.
- The cover has its own micro-animations: `cta-breathe` (2.4s scale pulse on the
  CTA), `finger-tap` (1.6s tapping finger icon), `cta-ring` (2.4s expanding pulse
  ring).

### 3.5 Takii — AI voice caddy widget (`VoiceOrderButton.tsx`)

A compact floating pill (bottom of screen) with the caddy-bot avatar, labeled
**"Takii — your voice guide"** so users know it's a talking guide. Opens a small
chat panel for real voice ordering.

- Built with `framer-motion`: `AnimatePresence` for panel enter/exit,
  `whileHover={{ scale: 1.04 }}` on the pill.
- Thinking state shows a spinning loader with "Soch raha hoon…".

### 3.6 "Volt" robot widget animations (`styles.css` `.volt-*`)

A small set of keyframes powering robot micro-interactions:
- `volt-float` — 4.2s gentle hover loop.
- `volt-shake` — 0.46s horizontal jiggle (error/no).
- `volt-pop` — 0.32s springy entrance.
- `volt-spin` — 0.95s full-body spin, then resumes floating.
- `volt-pulse` — 1.8s glow pulse on the antenna bulb.

### 3.7 Misc keyframes

| Keyframes | Duration | Purpose |
| --- | --- | --- |
| `sash-shine` | 3.2s | Moving highlight sweep across ribbon sashes |
| `magic-spin` / `magic-spark` | 5s / 2.6s | Spinning conic badge + sparkle flicker on promotional seals |
| `lux-rise` | 0.5s | Entrance: elements rise with `cubic-bezier(0.22,1,0.36,1)` |
| `lux-pulse-ring` | 2s | Expanding ring around live/CTA elements |
| `candy-pop-in` | 0.42s | Overshoot pop (`cubic-bezier(0.34,1.5,0.64,1)`) for small badges |
| `candy-shine` | 1.5s | One-shot gloss sweep after pop-in |

All decorative loops are disabled under `prefers-reduced-motion`.

### 3.8 Live order tracking (`profile/OrderTracking.tsx` + `TrackMap.tsx`)

- Flame `animate-pulse` dot marks the live status.
- Progress bar across Kitchen → Packed → On the way → Delivered, with live
  stats (ETA, distance left, courier speed) and a timestamped journey timeline.
- The courier marker moves on a Leaflet map via ref-based updates (no map
  re-init), driven by `useOrderTracking` polling every second; a demo simulator
  (`simulateTracking` in `src/lib/tracking.ts`) compresses the ride to ~4 minutes.

---

## 4. Sound design (`src/lib/sfx.ts` + `SoundProvider.tsx`)

A tiny WebAudio kit with five sounds: `click` (real uploaded WAV served from the
CDN via `src/assets/click.wav.asset.json`), `pop`, `cart`, `swoosh`,
`notification`. Non-uploaded sounds are synthesized fallbacks.

Rules:
- The global `pointerdown` listener in `SoundProvider` plays sounds **only on
  real interactive elements** (`button`, `a`, `[role="button"]`, inputs) — plain
  screen taps are silent (per user request).
- Elements can override with `data-sfx="cart"` etc., or opt out with `data-no-sfx`.
- A global mute toggle persists via `isMuted()`; speech synthesis respects it too.

---

## 5. Imagery

AI-generated brand assets live in `src/assets/`: the caddy-bot avatar (Takii),
charcoal-ember profile banner, customer portrait, dish photography (karahi,
malai botti, pulao, skewers, steak…), pizza mascots and stickers. Banner and
avatars are reused across the profile header, menu-book crest and voice widget
to keep the caddy identity consistent.

---

## 6. Implementation cheat-sheet

| Want to… | Do this |
| --- | --- |
| Change brand colors | Edit the `@theme` block in `src/styles.css` only (oklch). |
| Retune cursor-string elasticity | Adjust `k`/`d` constants in `CursorRobot.tsx` (`step(head, …, 0.45, 0.55)` and the per-bead `k`). |
| Change flip speed / sound lock | Page transition timing in the `.menu-book__page` CSS; debounce in `toggle()` (`320`ms). |
| Add a new sound | Add file/key to `SFX_FILES` in `src/lib/sfx.ts`, use `playSfx("key")` or `data-sfx="key"`. |
| Add a page to the book | Add the dish to `DISHES` in `src/lib/menu.ts` — pages, voices and prices generate automatically. |
| Disable an animation for accessibility | Nothing — the global reduced-motion block already covers every keyframe. |
