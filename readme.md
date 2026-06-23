# 🚀 NestJS Starter Kit (PostgreSQL + TypeORM + Auth)

A **production-ready NestJS starter kit** built with **PostgreSQL**, **TypeORM**, and **JWT-based Authentication & Authorization**. This template is designed for scalability, security, and clean architecture, making it ideal for real-world backend applications and open-source projects.

---

## ✨ Features

### Core

* ✅ NestJS (latest)
* ✅ PostgreSQL
* ✅ TypeORM (entities, migrations, repositories)
* ✅ Environment-based configuration
* ✅ Modular & scalable architecture

### 🔐 Authentication & Authorization

* JWT authentication (Access & Refresh tokens)
* Role-Based Access Control (RBAC)
* Password hashing with bcrypt
* Guards & custom decorators
* Protected routes

### 🧱 Architecture & Best Practices

* Feature-based module structure
* DTO validation (`class-validator`, `class-transformer`)
* Centralized error handling
* Global validation pipe
* API versioning (`/api/v1`)

### 📘 API & Documentation

* Swagger (OpenAPI)
* JWT support in Swagger UI
* Standard API response format

### 🗄 Database

* PostgreSQL
* TypeORM migrations
* Database seeders
* Soft delete support
* Base entity (id, timestamps)

### ⚙️ DevOps & DX

* Docker & Docker Compose
* ESLint + Prettier
* Health check endpoint
* Ready for CI/CD

---

## 📁 Project Structure

```
src/
├── modules/ # Feature modules
│ ├── auth/ # Authentication & authorization
│ ├── users/ # User module
│ ├── roles/ # Role & RBAC
│ └── health/ # Health check module
├── shared/ # Shared utilities
│ ├── decorators/
│ ├── guards/
│ ├── filters/
│ ├── interceptors/
│ ├── pipes/
│ ├── strategies/ # Passport strategies
│ ├── types/
│ └── constants/
├── core/ # Core functionality
│ ├── config/ # App & env configuration
│ └── database/ # TypeORM config, migrations, seeds
├── app.module.ts
└── main.ts
```

---

## 🧑‍💻 Tech Stack

* **Framework**: NestJS
* **Database**: PostgreSQL
* **ORM**: TypeORM
* **Auth**: JWT (Access & Refresh Tokens)
* **Docs**: Swagger
* **Containerization**: Docker

---

## 🚀 Getting Started

### 1️⃣ Clone the repository

```bash
git clone https://github.com/shinekyaw/nestjs-starter-kit.git
cd nestjs-starter-kit
```

### 2️⃣ Install dependencies

```bash
npm install
```

### 3️⃣ Environment variables

Create a `.env` file from the example:

```bash
cp .env.example .env
```

Example `.env`:

```env
NODE_ENV=development
PORT=3000

DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=nestjs_starter

JWT_ACCESS_SECRET=access_secret
JWT_REFRESH_SECRET=refresh_secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

---

## 🐳 Run with Docker

```bash
docker-compose up --build
```

API will be available at:

```
http://localhost:3000
```

---

## 🧬 Database Migrations

### Generate migration

```bash
npm run typeorm:migration:generate -- src/database/migrations/init
```

### Run migrations

```bash
npm run typeorm:migration:run
```

---

## 🔐 Authentication Flow

1. **Register** → Create a new user
2. **Login** → Receive access & refresh tokens
3. **Access protected routes** using access token
4. **Refresh token** → Generate new access token

---

## 🔒 Authorization (RBAC)

Roles example:

* `ADMIN`
* `USER`

Usage:

```ts
@Roles('ADMIN')
@UseGuards(JwtAuthGuard, RolesGuard)
@Get('admin-only')
findAdminData() {}
```

---

## 📘 API Documentation (Swagger)

Swagger UI available at:

```
http://localhost:3000/api
```

Features:

* JWT authentication support
* Versioned APIs
* Request/response schemas

---

## 🩺 Health Check

```
GET /health
```

Used for monitoring and container orchestration.

---

## 🧪 Scripts

```bash
npm run start:dev     # Development
npm run build         # Build
npm run start:prod    # Production
npm run lint          # ESLint
npm run format        # Prettier
```

---

## 🔐 Security Best Practices

* Password hashing with bcrypt
* JWT secrets stored in env variables
* Token expiration & rotation
* Role-based guards
* Validation on all incoming requests

---

## 🧩 Roadmap / Optional Features

* Rate limiting
* Redis caching
* Audit logs
* GraphQL support
* **React Starter Kit** - Companion frontend application with:
  * React + TypeScript setup
  * Authentication flow (login, register, token management)
  * Protected routes & role-based UI components
  * API client integration with this NestJS backend
  * State management (Redux)
  * Modern UI library (shadcn UI, or Tailwind CSS)
  * Form validation & error handling
  * Responsive design & best practices

---

## 🤝 Contributing

Contributions are welcome!

1. Fork the repo
2. Create a feature branch
3. Commit your changes
4. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License**.

---

## ⭐ Support

If this starter kit helps you, please give it a ⭐ on GitHub!

Happy coding! 🚀
