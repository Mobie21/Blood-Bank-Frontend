# HaemoCentral API

Express + TypeScript + MongoDB (Mongoose) + Zod.

## Setup

```bash
cd server
npm install
# edit .env: set MONGODB_URI to your Atlas connection string and change both JWT secrets
npm run seed   # optional: Zimbabwean demo institutions, users and stock
npm run dev    # http://localhost:4000/api/v1
```

In MongoDB Atlas, allow your IP under Network Access.

## Demo logins (after seeding, password = SEED_DEFAULT_PASSWORD)

| Role | Email |
|---|---|
| Super Admin | admin@haemocentral.co.zw |
| Hospital Admin | admin@parirenyatwa.co.zw |
| Staff | staff@parirenyatwa.co.zw |

## Endpoints (prefix `/api/v1`)

- `auth` — login, refresh, logout, me, forgot/reset/change password
- `institutions` — CRUD (super admin), status, stats
- `inventory` — summary, expiring, units CRUD, reserve, issue, discard
- `search/blood` — nationwide availability
- `enquiries` — list/create, detail, approve, decline, fulfil (stock transfer), cancel, messages
- `staff` — tenant staff CRUD, suspend/activate
- `admin` — overview, users CRUD, suspend/activate, audit logs
- `analytics` — trends, distribution, enquiries
- `notifications`, `settings` (profile, alert thresholds)

All requests except login/refresh need `Authorization: Bearer <access_token>`. Every record is scoped by the caller's `tenantId`. Full spec: `../docs/api-spec.md`.
