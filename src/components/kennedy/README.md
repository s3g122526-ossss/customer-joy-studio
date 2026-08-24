# `src/components/kennedy` — storefront

Menu, dish, cart, mascot and live-tracking components for `/`, `/dish/$slug`,
`/cart`. Data comes from `src/lib/menu.ts`, `src/lib/cart.ts`,
`src/lib/orders.ts`, `src/lib/rider-location.ts`.

| Component | Needs from Django |
| --- | --- |
| `MenuBook.tsx`, `MenuShowcase.tsx`, `DishCard.tsx` | `GET /dishes/?category=&search=` → paginated `{id, slug, name, description, image, sizes:[{label, price}], tags, is_available, rating}` |
| `SliceGallery.tsx` | `GET /dishes/{slug}/gallery/` → `[{image, caption}]` (optional; falls back to bundled art) |
| `OrderButton.tsx`, `OrderDialog.tsx` | `POST /orders/` `{items:[{dish, size, qty}], address, payment, note}` → `{id, order_code, total, eta_minutes, status}` |
| `CartDock.tsx` | `GET/POST/PATCH/DELETE /cart/items/` (or keep local cart and post once at checkout) |
| `TrackMap.tsx` | `GET /orders/{id}/caddy/location/` → `{lat, lng, updated_at}`; destination from `order.address.lat/lng`. Poll 5–10 s or Django Channels `ws/orders/{id}/` |
| `BonusTape.tsx`, `GiftRibbon.tsx` | `GET /promotions/active/` → `[{code, label, discount_type, value, expires_at}]`; validate with `POST /orders/validate-promo/` |
| `VoiceOrderButton.tsx` (**Takii**, the voice guide — small caddy pill launcher, bottom-right) | server-only: `src/lib/voice.functions.ts` → `transcribe/reply/speak` in `src/lib/voice.server.ts`; keys via `process.env` inside the handler, never `VITE_*`. If Django owns the agent instead, POST `{audioBase64, mime, history}` to `POST /voice/turn/` and return `{transcript, text, audio}` (base64 mp3) — keep that exact shape so the UI needs no change. |
| `PizzaMascot.tsx`, `PizzaEyes.tsx`, `CursorRobot.tsx` (short-elastic string, plain system cursors), `MascotFooter.tsx`, `SoundProvider.tsx` | no backend (pure motion/sound) |
| `MenuBook.tsx` voice-over | none — browser `speechSynthesis`; the spoken line is decided in the click handler so audio always matches the page just revealed (cover speaks welcome + first dish name) |


## Rules

- Components receive data as props or read a `src/lib` stub — no `fetch()` here.
- Prices are integers in PKR; format with the shared `money()` helper.
- `is_available: false` must render the dish disabled, not hidden.
- Images: Django returns absolute URLs (`request.build_absolute_uri`) or a CDN URL.
