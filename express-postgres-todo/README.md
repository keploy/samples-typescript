# Advanced Todo API

A comprehensive TypeScript-based Todo API built with Express, Prisma ORM, and PostgreSQL 18+. Designed for testing large queries and responses with support for bulk operations.

## Features

- **Full CRUD Operations** for Todos, Categories, and Tags
- **Advanced Todo Features**: Subtasks, Tags, Attachments
- **Bulk Operations**: Create, fetch, and delete up to 1000 items at once
- **Large Payload Testing**: Configurable payload sizes (10KB to 10MB)
- **Pagination & Filtering**: Full support for search, sort, and filter
- **Docker Ready**: Production and development Docker Compose configurations
- **PostgreSQL 18**: Latest PostgreSQL with health checks
- **Comprehensive Test Script**: Automated API testing

## Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)
- Keploy CLI (optional, for test recording)

## Quick Start

### 1. Clone and Navigate

```bash
git clone https://github.com/keploy/samples-typescript.git
cd samples-typescript/express-postgres-todo
```

### 2. Create Docker Network

```bash
docker network create keploy-network
```

### 3. Start with Docker Compose

```bash
# Build and start
docker-compose up --build -d

# View logs
docker-compose logs -f app
```

The API will be available at `http://localhost:3000`

### 4. Run API Tests

```bash
# Make the script executable
chmod +x scripts/test-api.sh

# Run all tests
./scripts/test-api.sh
```

## Local Development

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment

```bash
cp .env.example .env
# Edit .env if needed
```

### 3. Start PostgreSQL

```bash
# Using Docker
docker run --name postgres-todo -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=tododb -p 5432:5432 -d postgres:18-alpine

# Or use docker-compose for just the database
docker-compose up db -d
```

### 4. Run Migrations

```bash
npm run generate
npm run migrate init
```

### 5. Start Development Server

```bash
npm run dev
```

## API Endpoints

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/health` | Health check |

### Todos

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/todos` | List todos (with pagination) |
| GET | `/api/v1/todos/:id` | Get todo by ID |
| POST | `/api/v1/todos` | Create todo |
| PUT | `/api/v1/todos/:id` | Update todo |
| PATCH | `/api/v1/todos/:id/toggle` | Toggle completion |
| DELETE | `/api/v1/todos/:id` | Delete todo |

#### Query Parameters for List

- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)
- `completed` - Filter by status (true/false)
- `priority` - Filter by priority (1-4)
- `categoryId` - Filter by category
- `search` - Search in title/description
- `sortBy` - Sort field (createdAt, priority, dueDate, title)
- `sortOrder` - Sort order (asc, desc)

### Subtasks

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/todos/:id/subtasks` | Add subtask |
| PATCH | `/api/v1/todos/:id/subtasks/:subtaskId/toggle` | Toggle subtask |
| DELETE | `/api/v1/todos/:id/subtasks/:subtaskId` | Delete subtask |

### Tags

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/tags` | List tags |
| POST | `/api/v1/tags` | Create tag |
| DELETE | `/api/v1/tags/:id` | Delete tag |
| POST | `/api/v1/todos/:id/tags` | Add tag to todo |
| DELETE | `/api/v1/todos/:id/tags/:tagId` | Remove tag from todo |

### Categories

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/categories` | List categories |
| GET | `/api/v1/categories/:id` | Get category |
| POST | `/api/v1/categories` | Create category |
| PUT | `/api/v1/categories/:id` | Update category |
| DELETE | `/api/v1/categories/:id` | Delete category |

### Attachments

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/todos/:id/attachments` | Add attachment |
| GET | `/api/v1/todos/:id/attachments/:attachmentId` | Get attachment |
| DELETE | `/api/v1/todos/:id/attachments/:attachmentId` | Delete attachment |

### Bulk Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/bulk/todos` | Bulk create (max 1000) |
| GET | `/api/v1/bulk/todos?limit=N` | Bulk get (max 10000) |
| DELETE | `/api/v1/bulk/todos` | Bulk delete by IDs |
| POST | `/api/v1/bulk/seed` | Seed database |
| GET | `/api/v1/bulk/payload/:sizeKb` | Get test payload |
| DELETE | `/api/v1/bulk/clear` | Clear all data |
| GET | `/api/v1/bulk/stats` | Get statistics |

## Example Requests

### Create a Todo

```bash
curl -X POST http://localhost:3000/api/v1/todos \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Complete project",
    "description": "Finish the quarterly report",
    "priority": 3,
    "categoryId": 1,
    "tagIds": [1, 2]
  }'
```

### Seed Database with 100 Todos

```bash
curl -X POST http://localhost:3000/api/v1/bulk/seed \
  -H "Content-Type: application/json" \
  -d '{"count": 100}'
```

### Get 1MB Test Payload

```bash
curl http://localhost:3000/api/v1/bulk/payload/1000
```

### Bulk Create Todos

```bash
curl -X POST http://localhost:3000/api/v1/bulk/todos \
  -H "Content-Type: application/json" \
  -d '{
    "todos": [
      {"title": "Task 1", "priority": 1},
      {"title": "Task 2", "priority": 2},
      {"title": "Task 3", "priority": 3}
    ]
  }'
```

## Using with Keploy

### Record Test Cases

```bash
keploy record -c "docker-compose up" --container-name todo-api --network keploy-network
```

Then make API calls using the test script:

```bash
./scripts/test-api.sh
```

### Replay Test Cases

```bash
keploy test -c "docker-compose up" --container-name todo-api --network keploy-network --delay 10
```

## Project Structure

```
express-postgres-todo/
├── src/
│   ├── index.ts                 # Main entry point
│   ├── controllers/             # Request handlers
│   │   ├── todo.controller.ts
│   │   ├── category.controller.ts
│   │   ├── tag.controller.ts
│   │   └── bulk.controller.ts
│   ├── routes/                  # Route definitions
│   │   ├── index.ts
│   │   ├── todo.routes.ts
│   │   ├── category.routes.ts
│   │   ├── tag.routes.ts
│   │   └── bulk.routes.ts
│   ├── middlewares/
│   │   └── validation.ts        # Zod validation
│   └── utils/
│       ├── prisma.ts            # Prisma client
│       └── payload-generator.ts # Large payload utils
├── prisma/
│   └── schema.prisma            # Database schema
├── scripts/
│   └── test-api.sh              # API test script
├── docker-compose.yml           # Production compose
├── docker-compose.dev.yml       # Development compose
├── Dockerfile                   # Multi-stage build
├── package.json
├── tsconfig.json
└── README.md
```

## Database Schema

The application uses the following models:

- **Todo**: Main task entity with title, description, priority, due date
- **Category**: Grouping for todos (Work, Personal, etc.)
- **Tag**: Labels for todos (urgent, important, etc.)
- **TodoTag**: Many-to-many relation between todos and tags
- **Subtask**: Child tasks within a todo
- **Attachment**: File attachments (base64 encoded)

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 3000 | Server port |
| DATABASE_URL | postgresql://... | PostgreSQL connection string |

## Scripts

```bash
npm run dev          # Start development server with hot reload
npm run build        # Build TypeScript
npm run start        # Start production server
npm run generate     # Generate Prisma client
npm run migrate      # Run database migrations
npm run db:push      # Push schema changes
```

## License

MIT
