# HaemoCentral — Backend API Specification

Multi-tenant blood bank management system. Every resource except `/auth/*` and
`/admin/*` is scoped to the caller's `tenant_id`.

## Conventions

- Base path: `/api/v1`
- Auth: `Authorization: Bearer <access_token>` (JWT). Claims: `sub`, `tenant_id`, `role`.
- Roles: `super_admin` (national, cross-tenant), `hospital_admin` / `lab_admin`
  (own institution only), `staff` (read + raise enquiries).
- Errors: `{ "error": { "code": "forbidden", "message": "…" } }` with HTTP 400/401/403/404/409/422.
- Lists: `?page=1&per_page=25&q=&sort=` → `{ data: [...], meta: { page, per_page, total } }`.
- Timestamps: ISO-8601 UTC. IDs: UUID.

---

## 1. Auth & session

| Method | Path | Role | Purpose |
|---|---|---|---|
| POST | `/auth/login` | public | Exchange credentials for tokens |
| POST | `/auth/refresh` | public (refresh token) | New access token |
| POST | `/auth/logout` | any | Revoke refresh token |
| GET | `/auth/me` | any | Current user + tenant |
| POST | `/auth/forgot-password` | public | Email reset link |
| POST | `/auth/reset-password` | public (reset token) | Set new password |
| POST | `/auth/change-password` | any | Change own password |

**POST /auth/login** — body `{ email, password }`. Verifies hash (argon2/bcrypt),
rejects if user or institution is `inactive`, writes an audit log row, issues
access (15 min) + refresh (session-lifetime) tokens.

```json
{
  "access_token": "…", "refresh_token": "…", "expires_in": 900,
  "user": {
    "id": "u_…", "name": "Dr. Tendai Chikomo",
    "email": "tendai.chikomo@parirenyatwa.co.zw",
    "role": "hospital_admin", "status": "active",
    "tenant": { "id": "h_001", "name": "Parirenyatwa Group of Hospitals",
                "type": "hospital", "city": "Harare", "province": "Harare" }
  }
}
```

**GET /auth/me** — same `user` object; used by the client on boot to rebuild the
tenant context instead of trusting sessionStorage.

---

## 2. Institutions (hospitals & laboratories)

Super admin manages all; an admin may read/update only their own.

| Method | Path | Role | Purpose |
|---|---|---|---|
| GET | `/institutions?type=hospital\|laboratory&status=&province=&q=` | any | Directory list |
| POST | `/institutions` | super_admin | Register institution |
| GET | `/institutions/:id` | any (own or super) | Detail + stock summary |
| PATCH | `/institutions/:id` | super_admin, own admin | Update details |
| PATCH | `/institutions/:id/status` | super_admin | Activate / deactivate |
| DELETE | `/institutions/:id` | super_admin | Soft delete (blocked if active stock/orders) |
| GET | `/institutions/:id/stock` | any | Per-group availability |

Item shape:

```json
{
  "id": "h_001", "code": "PARI-01", "name": "Parirenyatwa Group of Hospitals",
  "type": "hospital", "email": "bloodbank@parirenyatwa.co.zw",
  "phone": "+263 242 701 555", "address": "Mazowe Street",
  "city": "Harare", "province": "Harare", "country": "Zimbabwe",
  "blood_dept_contact": "Dr. Tendai Chikomo", "status": "active",
  "stock": { "A+": 210, "A-": 42, "B+": 168, "B-": 22,
             "AB+": 65, "AB-": 14, "O+": 245, "O-": 38 },
  "total_units": 804, "staff_count": 12,
  "created_at": "2026-01-14T08:00:00Z"
}
```

`POST` generates `code` from the name, seeds an empty stock row, and creates the
first admin user when `admin: { name, email }` is supplied (invite email sent).
`DELETE` is soft (`deleted_at`) so historical enquiries keep resolving names.

---

## 3. Inventory (tenant-scoped)

| Method | Path | Role | Purpose |
|---|---|---|---|
| GET | `/inventory?group=&status=&expiring_within_days=&q=` | any in tenant | Unit list |
| POST | `/inventory` | admin, technician | Add unit / batch |
| GET | `/inventory/:id` | tenant | Unit detail + movement history |
| PATCH | `/inventory/:id` | admin, technician | Edit location/status |
| DELETE | `/inventory/:id` | admin | Discard (reason required) |
| POST | `/inventory/:id/reserve` | admin, staff | Reserve against an order |
| POST | `/inventory/:id/issue` | admin, technician | Issue to ward/requester |
| GET | `/inventory/summary` | tenant | KPI block for dashboard |
| GET | `/inventory/expiring?days=7` | tenant | Expiry watchlist |

Unit shape:

```json
{
  "id": "BB-9201", "tenant_id": "h_001", "group": "O-", "quantity": 1,
  "collection_date": "2026-07-20", "expiry_date": "2026-08-28",
  "donor_number": "D-4471", "storage_location": "Rack A-2",
  "status": "available", "days_to_expiry": 1
}
```

`/inventory/summary` → `{ total_units, available, reserved, expiring_soon,
critical_groups: ["O-","AB-"], by_group: { … } }`.

Every write appends an immutable `stock_movements` row (`in`, `reserved`,
`issued`, `expired`, `discarded`) and recomputes the institution's stock
counters in the same transaction. A nightly job flips past-expiry units to
`expired` and emits notifications.

---

## 4. Nationwide blood search

| Method | Path | Role | Purpose |
|---|---|---|---|
| GET | `/search/blood?group=O-&min_quantity=4&province=&type=&max_distance_km=` | any | Cross-tenant availability |

Returns institutions holding the group, own tenant excluded, sorted by quantity
then province:

```json
{ "data": [
  { "institution": { "id": "h_002", "name": "Sally Mugabe Central Hospital",
                     "type": "hospital", "city": "Harare", "province": "Harare",
                     "phone": "+263 242 621 111",
                     "blood_dept_contact": "Dr. Rutendo Moyo", "status": "active" },
    "group": "O-", "available": 62, "last_updated": "2026-08-27T09:12:00Z" } ],
  "meta": { "total": 5 } }
}
```

Only aggregate counts leak across tenants — never unit IDs or donor numbers.

---

## 5. Enquiries & orders

| Method | Path | Role | Purpose |
|---|---|---|---|
| GET | `/enquiries?direction=received\|sent&status=&kind=&q=` | any | List for tenant |
| POST | `/enquiries` | any | Raise enquiry or order |
| GET | `/enquiries/:id` | party to it | Detail + timeline |
| POST | `/enquiries/:id/approve` | supplier admin | Approve, reserve units |
| POST | `/enquiries/:id/decline` | supplier admin | Decline with reason |
| POST | `/enquiries/:id/fulfil` | supplier admin | Issue stock, close request |
| POST | `/enquiries/:id/cancel` | requester | Withdraw while pending |
| POST | `/enquiries/:id/messages` | either party | Thread message |

**POST /enquiries** — body `{ supplier_id, kind: "enquiry"|"order", group,
quantity, notes }`. Validates supplier is active, and for `order` that
`quantity <= supplier available`. Generates `reference` (`ENQ-######`), status
`pending`, notifies the supplier.

```json
{
  "id": "e_001", "reference": "ENQ-480213", "kind": "order",
  "group": "O-", "quantity": 12, "notes": "Theatre reserve…",
  "supplier": { "id": "h_002", "name": "Mpilo Central Hospital" },
  "requester": { "tenant_id": "h_001", "tenant_name": "Parirenyatwa Group of Hospitals",
                 "user_id": "u_001", "user_name": "Dr. Tendai Chikomo" },
  "status": "approved", "created_at": "2026-08-21T09:15:00Z",
  "updated_at": "2026-08-21T10:02:00Z"
}
```

State machine: `pending → approved → fulfilled`, `pending → declined`,
`pending → cancelled`. `approve` reserves the units (fails 409 if stock dropped);
`fulfil` issues them from the supplier and adds them to the requester's
inventory; `decline`/`cancel` release any reservation. Each transition writes an
audit row and a notification to the other party.

---

## 6. Staff (tenant-scoped)

| Method | Path | Role | Purpose |
|---|---|---|---|
| GET | `/staff?q=&role=&status=&department=` | admin | Roster |
| POST | `/staff` | admin | Add member + invite |
| GET | `/staff/:id` | admin | Detail |
| PATCH | `/staff/:id` | admin | Edit profile/role |
| PATCH | `/staff/:id/status` | admin | Suspend / reactivate |
| DELETE | `/staff/:id` | admin | Remove (soft) |
| POST | `/staff/:id/resend-invite` | admin | Re-send invite email |

```json
{ "id": "s_1", "tenant_id": "h_001", "name": "Dr. Tendai Chikomo",
  "email": "tendai@parirenyatwa.co.zw", "phone": "+263 772 100 001",
  "department": "Haematology", "position": "Chief Administrator",
  "role": "hospital_admin", "status": "active", "last_login_at": "2026-08-27T06:31:00Z" }
```

Creation is rejected if the email exists in any tenant. Suspension revokes
refresh tokens immediately. An admin cannot delete or demote themself if they
are the institution's last active admin (409).

---

## 7. Super admin console

| Method | Path | Purpose |
|---|---|---|
| GET | `/admin/stats` | National KPI cards |
| GET | `/admin/users?tenant_id=&role=&status=&q=` | All system users |
| POST | `/admin/users` | Provision an admin for any institution |
| PATCH | `/admin/users/:id` | Edit role / institution |
| PATCH | `/admin/users/:id/status` | Activate / suspend |
| DELETE | `/admin/users/:id` | Soft delete |
| GET | `/admin/audit-logs?actor_id=&tenant_id=&action=&from=&to=` | Audit trail |

`/admin/stats` →

```json
{ "institutions": { "total": 7, "hospitals": 5, "laboratories": 2, "inactive": 0 },
  "units": { "total": 1842, "expiring_7d": 23, "critical_groups": ["AB-","O-"] },
  "users": { "total": 61, "active": 58 },
  "enquiries": { "pending": 4, "orders_30d": 38, "fulfilment_rate": 0.87 },
  "stock_by_province": [ { "province": "Harare", "units": 960 } ],
  "stock_by_group": { "O+": 993, "O-": 158 } }
```

---

## 8. Analytics & reports

| Method | Path | Role | Purpose |
|---|---|---|---|
| GET | `/dashboard/summary` | tenant | KPI cards + recent activity |
| GET | `/analytics/stock-distribution?tenant_id=` | tenant / super | Donut chart data |
| GET | `/analytics/trends?metric=inflow\|issued\|expired&period=30d&interval=day` | tenant / super | Time series |
| GET | `/analytics/enquiries?period=90d` | tenant / super | Volume + turnaround |
| GET | `/reports/export?type=inventory\|enquiries\|staff&format=csv\|pdf&from=&to=` | admin | File download |

`/dashboard/summary` → `{ kpis: { total_units, available, expiring_soon,
pending_enquiries }, distribution: [{ group, units, pct }],
activity: [{ id, kind, message, timestamp }] }`.

Trends return `{ series: [{ date, value }], total, change_pct }`.
Exports stream a file (`Content-Disposition: attachment`) and are logged.

---

## 9. Notifications

| Method | Path | Role | Purpose |
|---|---|---|---|
| GET | `/notifications?unread=true` | any | Inbox for user/tenant |
| GET | `/notifications/unread-count` | any | Sidebar badge |
| POST | `/notifications/:id/read` | any | Mark read |
| POST | `/notifications/read-all` | any | Clear badge |
| DELETE | `/notifications/:id` | any | Dismiss |

```json
{ "id": "n1", "title": "Critical stock: O-",
  "body": "Only 38 units remaining. Consider requesting from network.",
  "severity": "critical", "read": false, "link": "/inventory?group=O-",
  "created_at": "2026-08-27T14:20:00Z" }
```

Generated by: enquiry state changes, stock crossing a configured threshold,
units expiring within 72 h, and staff/account changes.

---

## 10. Settings & profile

| Method | Path | Role | Purpose |
|---|---|---|---|
| GET / PATCH | `/profile` | any | Own name, phone, avatar |
| GET / PATCH | `/settings/institution` | admin | Contact details, dept contact |
| GET / PATCH | `/settings/thresholds` | admin | Per-group low/critical levels |
| GET / PATCH | `/settings/notifications` | any | Email/in-app preferences |

Threshold shape: `{ "O-": { "low": 40, "critical": 20 }, … }` — drives the
critical-stock alerts and dashboard tone.

---

## Cross-cutting rules

1. **Tenant isolation** — every query filters on `tenant_id` from the token, not
   from the request body. Only `/admin/*` and `/search/blood` read across tenants,
   and search returns aggregates only.
2. **Audit log** — all writes append `{ actor_id, tenant_id, action, entity,
   entity_id, before, after, ip, created_at }`.
3. **Idempotency** — `POST /enquiries` and stock issue/reserve accept an
   `Idempotency-Key` header to survive retries.
4. **Rate limits** — 5/min on `/auth/login` per IP+email, 60/min elsewhere.
5. **Validation** — schema-validate every payload; blood group must be one of the
   eight enum values; quantities are positive integers.

## Suggested tables

`institutions`, `users`, `sessions`, `blood_units`, `stock_levels`,
`stock_movements`, `enquiries`, `enquiry_messages`, `notifications`,
`alert_thresholds`, `audit_logs`.
