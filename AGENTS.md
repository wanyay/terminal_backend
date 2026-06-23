# AGENTS.md

# Terminal Port Management System (TPMS)

## Project Overview

Terminal Port Management System (TPMS) is used to manage and monitor all vehicles and visitors entering and exiting a terminal port.

The system records:

- Container Trucks
- Visiting Vehicles
- Visitors
- Entry/Exit Gates
- User Activities
- Audit Logs

The terminal contains multiple entry and exit gates.

Example:

- Entry Gate 1
- Entry Gate 2
- Entry Gate 3
- Exit Gate 1
- Exit Gate 2
- Exit Gate 3

Every vehicle and visitor movement must be recorded with timestamps.

---

# Technology Stack

## Backend

Framework: NestJS

Base Project:

- https://github.com/shinekyaw/nestjs-starter-kit

Database:

- PostgreSQL

Authentication:

- JWT Access Token
- JWT Refresh Token

Authorization:

- Role Based Access Control (RBAC)
- Permission Based Access Control

---

## Frontend

Framework:

- ReactJS
- TypeScript

Base Project:

- https://github.com/satnaing/shadcn-admin

UI:

- shadcn/ui
- TailwindCSS

State Management:

- TanStack Query

Forms:

- React Hook Form
- Zod Validation

---

# Business Requirements

## Container Truck Management

Record:

- Truck License Plate Number
- Container Number
- Driver Name
- Driver NRC / Passport
- Entry Gate
- Exit Gate
- Entry Time
- Exit Time
- Status
- Remarks

### Status

- Entered
- Exited
- Cancelled

---

## Visiting Vehicle Management

Record:

- Vehicle Plate Number
- Vehicle Type
- Vehicle Model
- Visitor Name
- NRC / Passport / Driver License
- Company Name
- Purpose Of Visit
- Entry Gate
- Exit Gate
- Entry Time
- Exit Time
- Remarks

### Status

- Entered
- Exited
- Cancelled

---

## Visitor Management

Visitors may arrive:

- By Vehicle
- On Foot

Record:

- Visitor Name
- NRC / Passport
- Phone Number
- Company Name
- Purpose Of Visit
- Host Employee
- Entry Gate
- Exit Gate
- Entry Time
- Exit Time
- Remarks

---

## Gate Management

The system must support:

- Multiple Entry Gates
- Multiple Exit Gates

Gate Information:

- Gate Code
- Gate Name
- Gate Type
- Description

### Gate Types

- Entry
- Exit

---

## Daily Operations

Security officers must be able to:

- Register Entry
- Register Exit
- Search Records
- View Daily Logs
- View Historical Logs
- Print Visitor Pass
- Export Reports

---

# User Roles

## Super Admin

Permissions:

- Manage Users
- Manage Roles
- Manage Permissions
- Manage System Settings
- Manage Gates
- View Audit Logs
- View Reports

---

## Security Officer

Permissions:

- Register Entry
- Register Exit
- Search Records
- Print Passes

Restrictions:

- Cannot Manage Users
- Cannot Manage Roles
- Cannot Manage System Settings

---

## Supervisor

Permissions:

- View Dashboard
- View Reports
- Search Records
- Export Reports

Restrictions:

- Cannot Modify Historical Records

---

# Dashboard Requirements

Dashboard should display:

- Today's Truck Entries
- Today's Truck Exits
- Today's Visitor Entries
- Today's Visitor Exits
- Active Trucks Inside Port
- Active Visitors Inside Port
- Gate Usage Statistics

---

# Reporting Requirements

Reports:

## Vehicle Reports

- Daily Vehicle Report
- Monthly Vehicle Report
- Vehicle History Report

## Visitor Reports

- Daily Visitor Report
- Monthly Visitor Report
- Visitor History Report

## Gate Reports

- Gate Usage Report
- Entry/Exit Summary Report

Support:

- PDF Export
- Excel Export
- Printing

---

# Audit Logging Requirements

All important actions must be audited.

Examples:

- Login
- Logout
- Create Record
- Update Record
- Delete Record
- Approve Record
- Export Report

Store:

- User ID
- Username
- Action
- Module
- Timestamp
- IP Address
- User Agent
- Old Values
- New Values

---

# API Standards

All APIs must follow REST principles.

Response format:

```json
{
  "success": true,
  "message": "Data retrieved successfully",
  "data": [],
  "meta": {
    "page": 1,
    "perPage": 20,
    "total": 100
  }
}
```

---

## API Requirements

All listing APIs must support:

- Pagination
- Search
- Filtering
- Sorting

Example:

```http
GET /api/trucks?page=1&perPage=20&search=YGN-1234
```

---

# Database Standards

Use:

- UUID Primary Keys
- Soft Deletes
- Audit Columns

Common Columns:

```sql
id UUID PRIMARY KEY

created_at TIMESTAMP
updated_at TIMESTAMP
deleted_at TIMESTAMP

created_by UUID
updated_by UUID
deleted_by UUID
```

---

# Security Requirements

Must Implement:

- JWT Authentication
- Refresh Token Rotation
- RBAC Authorization
- Permission Authorization
- Request Validation
- Rate Limiting
- Audit Logging

Never:

- Store Plain Passwords
- Expose Sensitive Data
- Trust Client Side Validation

---

# Backend Development Rules

## Architecture

Follow:

- Clean Architecture
- Modular Architecture
- Feature-Based Architecture
- SOLID Principles

Avoid:

- God Services
- Massive Controllers
- Business Logic Inside Controllers

---

## NestJS Standards

Use:

- DTO Validation
- Class Validator
- Class Transformer
- Swagger Documentation
- Dependency Injection

Controllers should:

- Receive Request
- Validate Request
- Call Service

Services should:

- Contain Business Logic

Repositories should:

- Handle Database Access

Never:

- Access Database Directly From Controllers

---

## Module Structure

Example:

```text
src/modules/trucks

├── controllers
├── services
├── repositories
├── dto
├── entities
├── interfaces
├── validators
└── trucks.module.ts
```

---

## Backend Agent Rules

This project is based on:

https://github.com/shinekyaw/nestjs-starter-kit

Before implementing any feature:

1. Check existing project structure.
2. Check authentication implementation.
3. Check RBAC implementation.
4. Check permission decorators.
5. Check exception filters.
6. Check response interceptors.
7. Check pagination helpers.
8. Reuse existing shared modules.

Do not introduce a second architecture style.

Follow existing starter-kit conventions.
