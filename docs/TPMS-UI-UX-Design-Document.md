# Terminal Port Management System (TPMS)

## UI/UX Design Document

---

## 1. System Overview

TPMS is a web application used by terminal port security teams to manage and monitor all vehicles and visitors entering and exiting a terminal port. The system records every movement with timestamps and gate assignments.

**Tech Stack:** React + TypeScript, shadcn/ui + TailwindCSS, TanStack Query, React Hook Form + Zod

---

## 2. User Roles & Permissions Matrix

| Permission | Super Admin | Security Officer | Supervisor |
|---|---|---|---|
| **Dashboard** | ✅ | ❌ | ✅ |
| **Register Entry** | ✅ | ✅ | ❌ |
| **Register Exit** | ✅ | ✅ | ❌ |
| **Search Records** | ✅ | ✅ | ✅ |
| **View Active Records** | ✅ | ✅ | ✅ |
| **View Reports** | ✅ | ❌ | ✅ |
| **Export Reports (PDF/Excel)** | ✅ | ❌ | ✅ |
| **Print Visitor Pass** | ✅ | ✅ | ❌ |
| **Manage Users** | ✅ | ❌ | ❌ |
| **Manage Roles & Permissions** | ✅ | ❌ | ❌ |
| **Manage Gates** | ✅ | ❌ | ❌ |
| **Manage System Settings** | ✅ | ❌ | ❌ |
| **View Audit Logs** | ✅ | ❌ | ❌ |
| **Cancel Records** | ✅ | ❌ | ❌ |

### Gate Assignment Rules

- **Security Officer** → assigned to **1 gate** (their duty station)
- **Supervisor** → can see **multiple gates** (e.g., all entry gates)
- **Super Admin** → can see **all gates** (entire terminal)

---

## 3. Module Overview & Screens

```
┌─────────────────────────────────────────────────────────┐
│                      TPMS Modules                        │
├──────────────┬──────────────┬──────────────┬────────────┤
│  Dashboard   │  Operations  │  Management  │  Reports   │
├──────────────┼──────────────┼──────────────┼────────────┤
│ • Overview   │ • Entry Reg  │ • Users      │ • Daily    │
│ • Stats      │ • Exit Reg   │ • Roles      │ • Monthly  │
│ • Gate Usage │ • Active     │ • Gates      │ • History  │
│              │ • Search     │ • Audit Logs │ • Export   │
│              │ • History    │ • Settings   │            │
└──────────────┴──────────────┴──────────────┴────────────┘
```

---

## 4. Authentication Flow

### 4.1 Login Screen

| Field | Type | Required |
|---|---|---|
| Username | text | ✅ |
| Password | password | ✅ |
| Login button | submit | |

- Public page (no auth required)
- Rate limited (5 attempts/min)
- On successful login, if `mustChangePassword` is `true`, redirect to **Force Password Change** screen
- Error states: invalid credentials, inactive account, rate limit exceeded

### 4.2 Force Password Change Screen

| Field | Type | Required |
|---|---|---|
| New Password | password | ✅ (min 6 chars) |
| Confirm New Password | password | ✅ |
| Submit button | submit | |

- Shown when `mustChangePassword: true` — user cannot access any other screen
- Only allowed endpoints while in this state: change-password, logout, profile

### 4.3 Change Password (Self-Serve)

Accessible from Profile or forced after first login.

| Field | Type | Required | Notes |
|---|---|---|---|
| Current Password | password | ✅ | Only for self-serve |
| New Password | password | ✅ | Min 6 chars |
| Must Change on Next Login | toggle | ❌ | Default: `false` |

### 4.4 Reset Password (Admin)

Accessible from User Management (admin resets another user's password).

| Field | Type | Required | Notes |
|---|---|---|---|
| Target User | user selector | ✅ | Search and select user |
| New Password | password | ✅ | Min 6 chars |
| Must Change on Next Login | toggle | ❌ | Default: `false` |

- Only Super Admin and Supervisor can access
- No current password required from admin

---

## 5. Dashboard Screen

**Access:** Super Admin, Supervisor

### 5.1 Statistics Cards (Top Row)

| Card | Description |
|---|---|
| Today's Truck Entries | Count of trucks entered today |
| Today's Truck Exits | Count of trucks exited today |
| Today's Visitor Entries | Count of visitors entered today |
| Today's Visitor Exits | Count of visitors exited today |
| Active Trucks Inside | Trucks currently with ENTERED status |
| Active Visitors Inside | Visitors currently with ENTERED status |

### 5.2 Gate Usage Section (Bottom)

- Bar chart or table showing entries/exits per gate for today
- Each gate shows: Entry Count, Exit Count

---

## 6. Operations Screens

### 6.1 Register Entry Screen

**Access:** Super Admin, Security Officer

Three tabs at the top to switch between entry types:

#### Tab A: Container Truck Entry

| Field | Type | Required |
|---|---|---|
| License Plate Number | text | ✅ |
| Container Number | text | ❌ |
| Driver Name | text | ❌ |
| Driver NRC / Passport | text | ❌ |
| Entry Gate | dropdown | ✅ |
| Remarks | textarea | ❌ |
| **Submit** | button | |

#### Tab B: Visiting Vehicle Entry

| Field | Type | Required |
|---|---|---|
| Vehicle Plate Number | text | ✅ |
| Vehicle Type | text | ❌ |
| Vehicle Model | text | ❌ |
| Visitor Name | text | ✅ |
| NRC / Passport / License | text | ❌ |
| Company Name | text | ❌ |
| Purpose of Visit | text | ❌ |
| Entry Gate | dropdown | ✅ |
| Remarks | textarea | ❌ |
| **Submit** | button | |

#### Tab C: Visitor Entry (On Foot)

| Field | Type | Required |
|---|---|---|
| Visitor Name | text | ✅ |
| NRC / Passport | text | ❌ |
| Phone Number | text | ❌ |
| Company Name | text | ❌ |
| Purpose of Visit | text | ❌ |
| Host Employee | text | ❌ |
| Entry Gate | dropdown | ✅ |
| Remarks | textarea | ❌ |
| **Submit** | button | |

#### Success State

After successful entry registration, show a success toast or modal with the record summary and a **Print Pass** button.

### 6.2 Register Exit Screen

**Access:** Super Admin, Security Officer

**Search-first approach:** User searches for the active record, then registers exit.

**Search Section:**

| Element | Description |
|---|---|
| Record Type | Tabs: Trucks / Vehicles / Visitors / All |
| Search Box | Search by plate number, name, license, etc. |
| Gate Filter | Optional: filter by entry gate |

**Active Records Table** (filtered to ENTERED status, paginated):

| Column | Description |
|---|---|
| Type | Truck / Vehicle / Visitor icon |
| Identifier | Plate number or Visitor name |
| Name | Driver name or Visitor name |
| Entry Gate | Gate name |
| Entry Time | Timestamp |
| Duration | Time elapsed since entry (e.g., "2h 15m") |
| Action | **Register Exit** button |

**Exit Confirmation Modal/Drawer:**

| Field | Type | Required |
|---|---|---|
| Record Details | read-only | — |
| Exit Gate | dropdown | ✅ |
| Remarks | textarea | ❌ |
| **Confirm Exit** | button | |

> Once exit is registered, status changes to `EXITED` and exit time is recorded.

### 6.3 Active Records Screen

**Access:** All roles

Shows all records currently inside the terminal (status = ENTERED).

Three tabs: **Container Trucks** | **Visiting Vehicles** | **Visitors**

Each tab is a paginated table:

| Column | Description |
|---|---|
| Identifier | Plate number / Visitor Name |
| Driver / Visitor Name | |
| Entry Gate | Gate name |
| Entry Time | Timestamp |
| Duration | Time elapsed since entry |
| Remarks | |
| Action | **Register Exit** (if user has permission) |

**Filters:**
- Gate ID dropdown (filter by entry gate)
- Search box (searches across all searchable fields)

### 6.4 Search & History Screen

**Access:** All roles

Search across all records (all statuses: Entered, Exited, Cancelled).

**Filters:**

| Filter | Type |
|---|---|
| Search | text (searches plate, name, container, etc.) |
| Type | dropdown (All / Truck / Vehicle / Visitor) |
| Status | dropdown (All / Entered / Exited / Cancelled) |
| Gate | dropdown (filter by entry or exit gate) |
| Date Range | date range picker (entry date from → to) |

**Results Table** (paginated, sortable):

| Column |
|---|
| Type (icon + label) |
| Identifier (plate / name) |
| Name (driver / visitor) |
| Entry Gate |
| Exit Gate |
| Entry Time |
| Exit Time |
| Status badge: Entered (green) / Exited (blue) / Cancelled (red) |
| Remarks |
| Actions: View details, Cancel (admin only, active records only) |

---

## 7. Management Screens

**Access:** Super Admin only

### 7.1 User Management

**User List** (paginated, searchable, sortable table):

| Column |
|---|
| Username |
| Full Name |
| Email |
| Roles (badge chips) |
| Assigned Gate (single badge or "—") |
| Manageable Gates (badge chips or "—") |
| Status (Active / Inactive toggle) |
| Actions (Edit, Reset Password, Delete) |

**Create/Edit User Form:**

| Field | Type | Required | Notes |
|---|---|---|---|
| Username | text | ✅ | Unique |
| Full Name | text | ✅ | |
| Email | email | ❌ | Unique |
| Password | password | ✅ (create only) | Min 6 chars |
| Roles | multi-select checkboxes | ✅ | |
| —— | —— | —— | **Conditional fields below** |
| Assigned Gate | single-select dropdown | ❌ | Show only when `SECURITY_OFFICER` selected |
| Manageable Gates | multi-select checkboxes | ❌ | Show only when `SUPER_ADMIN` or `SUPERVISOR` selected |

> **UI Rule:** When `SECURITY_OFFICER` is selected, show a single gate dropdown. When `SUPER_ADMIN` or `SUPERVISOR` is selected (without SECURITY_OFFICER), show multi-select gates. These two fields are **mutually exclusive** in the UI context.

### 7.2 Gate Management

**Gate List** (paginated, searchable, sortable table):

| Column |
|---|
| Code (e.g., EG-01) |
| Name (e.g., Entry Gate 1) |
| Type badge (Entry / Exit) |
| Description |
| Status (Active / Inactive) |
| Actions (Edit, Delete) |

**Create/Edit Gate Form:**

| Field | Type | Required |
|---|---|---|
| Code | text | ✅ (unique, e.g., EG-01, XG-01) |
| Name | text | ✅ (e.g., Entry Gate 1) |
| Type | dropdown (ENTRY / EXIT) | ✅ |
| Description | textarea | ❌ |
| Active | toggle | ✅ |

### 7.3 Audit Logs Screen

Display all system actions with filters.

**Filters:**

| Filter | Type |
|---|---|
| User | dropdown |
| Action | dropdown |
| Module | dropdown |
| Date Range | date range picker |

**Results Table:**

| Column |
|---|
| Timestamp |
| Username |
| Action |
| Module |
| IP Address |
| Details (expandable row: old values → new values) |

---

## 8. Reports Screens

**Access:** Super Admin, Supervisor

### 8.1 Reports Dashboard

Navigation cards/tiles for each report type:

- Daily Vehicle Report
- Monthly Vehicle Report
- Vehicle History Report
- Daily Visitor Report
- Monthly Visitor Report
- Visitor History Report
- Gate Usage Report
- Entry/Exit Summary Report

### 8.2 Report View

Each report includes:

| Component | Description |
|---|---|
| Date Range Filter | Date picker (for range/history reports) |
| Gate Filter | Optional gate dropdown |
| Generate Button | Generate report data |
| Summary Cards | Totals at top of report |
| Data Table | Paginated report results |
| Export Buttons | PDF Export / Excel Export |
| Print Button | Print report |

---

## 9. Navigation Structure

### Sidebar Navigation

```
┌──────────────────┐
│   TPMS Logo      │
├──────────────────┤
│ 📊 Dashboard          (Super Admin, Supervisor)
├──────────────────┤
│ 📥 Register Entry     (Super Admin, Security Officer)
│ 📤 Register Exit      (Super Admin, Security Officer)
│ 🟢 Active Records     (All roles)
│ 🔍 Search Records     (All roles)
├──────────────────┤
│ 👥 User Management    (Super Admin only)
│ 🚪 Gate Management    (Super Admin only)
│ 📋 Audit Logs         (Super Admin only)
├──────────────────┤
│ 📈 Reports            (Super Admin, Supervisor)
├──────────────────┤
│ 👤 Profile            (All roles)
│ 🚪 Logout             (All roles)
└──────────────────┘
```

> Sidebar items are shown/hidden based on user role and permissions.

### Top Bar

- User avatar + name
- Role badge
- (Optional: notification bell for future use)

---

## 10. Visual Design System

### 10.1 Status Badges

| Status | Color | Used In |
|---|---|---|
| **Entered** | Green | Active trucks, vehicles, visitors |
| **Exited** | Blue | Completed records |
| **Cancelled** | Red | Cancelled records |
| **Active** | Green | Gates, Users |
| **Inactive** | Gray / Muted | Gates, Users |

### 10.2 Gate Type Badges

| Type | Color |
|---|---|
| Entry | Green |
| Exit | Orange / Amber |

### 10.3 Role Badges

| Role | Color |
|---|---|
| Super Admin | Purple / Violet |
| Security Officer | Blue |
| Supervisor | Teal / Cyan |
| User | Gray |

### 10.4 Typography & Spacing

- Use shadcn/ui default design tokens
- Consistent padding: `p-4` or `p-6` for cards/sections
- Headings: `text-2xl font-bold` for page titles, `text-lg font-semibold` for sections

---

## 11. API Response Format

All list endpoints return:

```json
{
  "data": [ ... ],
  "meta": {
    "page": 1,
    "perPage": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

Single-item and mutation endpoints return:

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... }
}
```

---

## 12. API Endpoints Reference

### Auth

| Method | Endpoint | Access |
|---|---|---|
| `POST` | `/api/v1/auth/login` | Public |
| `POST` | `/api/v1/auth/register` | Public |
| `POST` | `/api/v1/auth/logout` | Authenticated |
| `POST` | `/api/v1/auth/refresh` | Refresh Token |
| `POST` | `/api/v1/auth/change-password` | Authenticated / Admin |
| `GET` | `/api/v1/auth/profile` | Authenticated |

### Container Trucks

| Method | Endpoint | Access |
|---|---|---|
| `GET` | `/api/v1/trucks` | All roles |
| `GET` | `/api/v1/trucks/active` | All roles |
| `GET` | `/api/v1/trucks/:id` | All roles |
| `POST` | `/api/v1/trucks/entry` | Admin, Security Officer |
| `POST` | `/api/v1/trucks/:id/exit` | Admin, Security Officer |
| `POST` | `/api/v1/trucks/:id/cancel` | Super Admin |
| `PATCH` | `/api/v1/trucks/:id` | Super Admin |
| `DELETE` | `/api/v1/trucks/:id` | Super Admin |

### Visiting Vehicles

| Method | Endpoint | Access |
|---|---|---|
| `GET` | `/api/v1/vehicles` | All roles |
| `GET` | `/api/v1/vehicles/active` | All roles |
| `GET` | `/api/v1/vehicles/:id` | All roles |
| `POST` | `/api/v1/vehicles/entry` | Admin, Security Officer |
| `POST` | `/api/v1/vehicles/:id/exit` | Admin, Security Officer |
| `POST` | `/api/v1/vehicles/:id/cancel` | Super Admin |
| `PATCH` | `/api/v1/vehicles/:id` | Super Admin |
| `DELETE` | `/api/v1/vehicles/:id` | Super Admin |

### Visitors

| Method | Endpoint | Access |
|---|---|---|
| `GET` | `/api/v1/visitors` | All roles |
| `GET` | `/api/v1/visitors/active` | All roles |
| `GET` | `/api/v1/visitors/:id` | All roles |
| `POST` | `/api/v1/visitors/entry` | Admin, Security Officer |
| `POST` | `/api/v1/visitors/:id/exit` | Admin, Security Officer |
| `POST` | `/api/v1/visitors/:id/cancel` | Super Admin |
| `PATCH` | `/api/v1/visitors/:id` | Super Admin |
| `DELETE` | `/api/v1/visitors/:id` | Super Admin |

### Gates

| Method | Endpoint | Access |
|---|---|---|
| `GET` | `/api/v1/gates` | All roles |
| `GET` | `/api/v1/gates/:id` | All roles |
| `POST` | `/api/v1/gates` | Super Admin |
| `PATCH` | `/api/v1/gates/:id` | Super Admin |
| `DELETE` | `/api/v1/gates/:id` | Super Admin |

### Users

| Method | Endpoint | Access |
|---|---|---|
| `GET` | `/api/v1/users` | Super Admin |
| `GET` | `/api/v1/users/:id` | Authenticated |
| `POST` | `/api/v1/users` | Super Admin |
| `PATCH` | `/api/v1/users/:id` | Super Admin |
| `DELETE` | `/api/v1/users/:id` | Super Admin |

---

## 13. Design Notes & Guidelines

1. **Mobile-responsive**: Security officers may use tablets at gates — ensure forms and tables work on smaller screens
2. **Form validation**: Client-side validation via Zod, server-side errors displayed inline under each field
3. **Loading states**: Skeleton loaders for tables, spinners for form submission buttons
4. **Empty states**: Illustrated empty states with helpful messages (e.g., "No active trucks inside the terminal")
5. **Error states**: Toast notifications for API errors, inline validation messages for form fields
6. **Confirmation dialogs**: Required for destructive actions (delete, cancel record, register exit)
7. **Breadcrumbs**: Show current location in the navigation hierarchy
8. **Dark mode**: Support both light and dark themes via shadcn/ui theme provider
9. **Pagination**: All list views use server-side pagination with page, perPage, search, sortBy, sortOrder
10. **Optimistic updates**: Use TanStack Query mutations with optimistic updates where appropriate
11. **Auto-refresh**: Dashboard and Active Records screens could auto-refresh every 30-60 seconds
