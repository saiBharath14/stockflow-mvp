# StockFlow MVP

StockFlow is a SaaS inventory management system. The project includes a React/Vite frontend and an Express REST API backend with a MySQL database layer, JWT authentication, and organization-scoped product management. Frontend database integration is intentionally deferred.

## Project structure

- `frontend/` - React application powered by Vite, Tailwind CSS, and React Router
- `backend/` - Express REST API, authentication, and MySQL connection layer
- `backend/database/init.sql` - MySQL database and table definitions

## Prerequisites

- Node.js 20 or newer
- npm
- MySQL Server and MySQL Workbench

## Install dependencies

```powershell
cd frontend
npm install
cd ..\backend
npm install
```

The backend uses `mysql2/promise` with a reusable connection pool, `bcrypt` for password hashing, and `jsonwebtoken` for signed access tokens. Database credentials and signing secrets are read from environment variables and are never stored in source code.

## Create the database with MySQL Workbench

1. Open MySQL Workbench and connect to your local MySQL server.
2. Open `backend/database/init.sql`.
3. Execute the full script. It creates `stockflow_db`, the organizations, users, products, and settings tables, and all required foreign keys and indexes.
4. Confirm that `stockflow_db` appears in the Schemas panel and refresh the schema list if needed.

The products SKU constraint is unique on `(organization_id, sku)`, so two organizations may use the same SKU while duplicate SKUs remain blocked within one organization. User email addresses are globally unique.

## Configure the backend

Copy the example environment file and replace the placeholder values with your local MySQL credentials:

```powershell
cd backend
Copy-Item .env.example .env
```

Set these values in `backend/.env`:

```dotenv
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password
DB_NAME=stockflow_db
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=1d
```

Use a long, random `JWT_SECRET`. `.env` is ignored by Git. Never commit credentials or secrets.

## Test the database connection

```powershell
cd backend
npm run db:test
```

The command prints `Database connection successful.` when the configured MySQL server and database are reachable. Configuration errors and connection failures are reported with a non-zero exit code.

## Run the development servers

Open two terminals from the repository root.

Frontend:

```powershell
cd frontend
npm run dev
```

Backend:

```powershell
cd backend
npm run dev
```

The frontend is available at `http://localhost:5173`. The API listens on `http://localhost:5000` by default.

## Verify the API

```powershell
curl http://localhost:5000/api/health
```

Expected response:

```json
{"success":true,"message":"StockFlow API is running"}
```

## Authentication endpoints

### Register

`POST /api/auth/register`

Request body:

```json
{
  "name": "Ada Lovelace",
  "email": "ada@example.com",
  "password": "correct horse battery staple",
  "organizationName": "Analytical Engines"
}
```

Registration creates the organization, linked user, and default settings in one transaction. Duplicate emails return `409`.

### Login

`POST /api/auth/login`

Request body:

```json
{
  "email": "ada@example.com",
  "password": "correct horse battery staple"
}
```

Invalid credentials return `401`. Successful responses include a JWT and safe user details; `password_hash` is never returned.

Protected routes can use `authenticateToken` from `backend/src/middleware/authMiddleware.js`:

```http
Authorization: Bearer <token>
```

Missing, invalid, and expired tokens return `401`.

## Product endpoints

All product endpoints require:

```http
Authorization: Bearer <token>
```

The organization is always taken from the verified token. `organization_id` is not accepted from request bodies.

### Create product

`POST /api/products`

```json
{
  "name": "Wireless Keyboard",
  "sku": "KB-001",
  "description": "Compact wireless keyboard",
  "quantity_on_hand": 25,
  "cost_price": 18.5,
  "selling_price": 29.99,
  "low_stock_threshold": 5
}
```

Only `name` and `sku` are required. Optional numeric fields default from the database schema when omitted. SKU uniqueness is enforced per organization. Duplicate SKUs return `409`.

### List products

`GET /api/products`

Returns all products for the authenticated user's organization.

### Get one product

`GET /api/products/:id`

Returns `404` when the product does not exist or belongs to another organization.

### Update product

`PUT /api/products/:id`

Send any product fields to update:

```json
{
  "name": "Wireless Keyboard - Rev 2",
  "quantity_on_hand": 30,
  "selling_price": 31.99
}
```

At least one field is required. All supplied values are validated, and duplicate SKU conflicts return `409`.

### Delete product

`DELETE /api/products/:id`

Deletes only a product owned by the authenticated user's organization. Missing or cross-organization products return `404`.

## Authentication test checklist

Using Postman or curl:

1. Register with valid fields and confirm `201`, a token, and safe user details.
2. Repeat registration with the same email and confirm `409`.
3. Login with the registered credentials and confirm `200` and a token.
4. Login with a wrong password and confirm `401`.
5. Add a temporary protected route with `authenticateToken`, call it without `Authorization`, and confirm `401`.
6. Call it with a modified or expired token and confirm `401`.

Example requests:

```powershell
curl.exe -X POST http://localhost:5000/api/auth/register -H "Content-Type: application/json" -d "{\"name\":\"Ada Lovelace\",\"email\":\"ada@example.com\",\"password\":\"correct horse battery staple\",\"organizationName\":\"Analytical Engines\"}"
curl.exe -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"ada@example.com\",\"password\":\"correct horse battery staple\"}"
```
