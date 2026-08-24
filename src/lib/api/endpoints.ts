/**
 * ============================================================================
 * DJANGO ENDPOINT CONTRACT — the map a backend dev implements
 * ============================================================================
 *
 * Every screen in this app currently reads from a LOCAL stub. Each stub file
 * carries a `// BACKEND:` comment naming the endpoint below that replaces it.
 *
 *   UI screen                 local stub                     endpoint
 *   ------------------------  -----------------------------  ---------------------------
 *   /login, /signup           src/lib/auth.ts                AUTH.*
 *   /profile (identity)       src/lib/account.ts             PROFILE.*
 *   /profile (orders, track)  src/lib/account.ts             ORDERS.*
 *   /cart → checkout          src/lib/cart.ts + account.ts   ORDERS.create
 *   /admin/*                  src/lib/admin-store.ts         ADMIN.*
 *   /rider/*                  src/lib/admin-store.ts         RIDER.*
 *   menu + dish pages         src/lib/menu.ts                MENU.*
 *
 * Suggested Django apps: accounts, menu, orders, riders, payments.
 * Roles live on the user model as `role ∈ {customer, staff, rider}` and are
 * returned by AUTH.me — the React router guard reads exactly that field.
 */

export const AUTH = {
  /** POST {email, password} → {access, refresh} (SimpleJWT) */
  login: "/auth/token/",
  /** POST {refresh} → {access} */
  refresh: "/auth/token/refresh/",
  /** POST {name, email, phone, password, role} → {user, access, refresh} */
  register: "/auth/register/",
  /** POST — blacklist the refresh token */
  logout: "/auth/logout/",
  /** GET → {id, name, email, phone, role, avatar_url, created_at} */
  me: "/auth/me/",
  /** POST {email} → 204 (sends the reset mail) */
  passwordReset: "/auth/password-reset/",
} as const;

export const PROFILE = {
  /** GET → Profile */
  detail: "/profile/",
  /** PATCH {full_name, phone, city, street} → Profile */
  update: "/profile/",
  /** POST multipart {avatar: File} → {avatar_url} */
  avatar: "/profile/avatar/",
  /** GET / POST / DELETE saved delivery addresses */
  addresses: "/profile/addresses/",
  /** GET / POST wishlist + liked dish slugs */
  saved: "/profile/saved/",
} as const;

export const MENU = {
  /** GET → paginated Dish[] (slug, name, price, image, tags, recipe) */
  dishes: "/menu/dishes/",
  /** GET /menu/dishes/{slug}/ */
  dish: (slug: string) => `/menu/dishes/${slug}/`,
} as const;

export const ORDERS = {
  /** GET → Order[] for the signed-in customer */
  list: "/orders/",
  /** POST {items[], address, payment, total} → Order */
  create: "/orders/",
  /** GET /orders/{code}/ → Order incl. rider + status timeline */
  detail: (code: string) => `/orders/${code}/`,
  /** GET /orders/{code}/tracking/ → {lat, lng, eta_minutes, status} — poll 10s
   *  or upgrade to Django Channels ws://.../ws/orders/{code}/ later. */
  tracking: (code: string) => `/orders/${code}/tracking/`,
} as const;

export const ADMIN = {
  /** GET → every order, filterable ?status=&payment_verified= */
  orders: "/admin/orders/",
  /** PATCH /admin/orders/{id}/ {status, rider_id, payment_verified} */
  order: (id: string) => `/admin/orders/${id}/`,
  /** GET → {revenue_series, live, unassigned, unverified, top_dishes} */
  stats: "/admin/stats/",
  payments: "/admin/payments/",
  riders: "/admin/riders/",
  customers: "/admin/customers/",
} as const;

export const RIDER = {
  /** GET → jobs assigned to the signed-in rider */
  jobs: "/rider/jobs/",
  /** POST /rider/jobs/{id}/accept/ */
  accept: (id: string) => `/rider/jobs/${id}/accept/`,
  /** POST {lat, lng} every ~10s while a delivery is active */
  location: "/rider/location/",
  /** GET → {today, week, month, payouts[]} */
  earnings: "/rider/earnings/",
  /** GET / PATCH the rider partner profile (bike, cnic, zone, photo) */
  profile: "/rider/profile/",
} as const;
