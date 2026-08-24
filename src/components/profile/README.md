# `src/components/profile` — customer profile & caddy

Presentation components for `/profile`. No data fetching inside; the route owns
queries and passes props.

## `ProfileBanner.tsx`

Charcoal-grill banner image + ringed avatar + three stat tiles.

Props → backend mapping:

| Prop | Source | Django field |
| --- | --- | --- |
| `name` | profile | `profiles.full_name` (fallback: email local part) |
| `email` | session / `GET /auth/me/` | `user.email` |
| `joined` | session | `user.date_joined` (ISO) |
| `avatarUrl` | profile | `profiles.avatar_url` — absolute URL, `null` → bundled photo |
| `tier` | loyalty | `profiles.tier` (optional, defaults to "Flame member") |
| `stats` | orders aggregate | `GET /profiles/me/stats/` → `{orders, spent, saved}` |
| `onChangeAvatar` | upload | `PATCH /profiles/me/` as `multipart/form-data` field `avatar` |

Avatar upload: build a `FormData`, pass it to `api.patch("/profiles/me/", form)` —
the client detects `FormData` and drops the JSON content type. Django side needs
`Pillow`, an `ImageField(upload_to="avatars/")`, and a public media/S3 URL.

## `CaddyCard.tsx`

The courier assigned to the live order: photo, rating, vehicle, ETA, call and
message actions. Data type: `Caddy` from `src/lib/caddy.ts`.

| UI element | Django field / endpoint |
| --- | --- |
| photo | `caddy.avatar_url` |
| name, vehicle | `caddy.name`, `caddy.vehicle` |
| rating, deliveries | `caddy.rating` (0–5), `caddy.deliveries` |
| status pill | `caddy.status` ∈ `idle\|picking\|onway\|delivered` |
| ETA | `caddy.eta_minutes` |
| Call | `caddy.phone` (rendered as `tel:`) — expose a masked proxy number in production |
| Message | `POST /orders/{id}/caddy/messages/` `{body}` |
| Rating after delivery | `POST /orders/{id}/caddy/rate/` `{stars, note?}` |

Live position for the map lives in `src/lib/rider-location.ts`
(`GET /orders/{id}/caddy/location/` → `{lat, lng, updated_at}`, poll 5–10 s, or a
Django Channels WebSocket).

## Permissions

`/profiles/me/` and `/caddies/me/assigned/` must be
`IsAuthenticated` and scoped to `request.user` — never accept a user id from the
client.
