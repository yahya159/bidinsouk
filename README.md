## Database setup (MySQL + Prisma)

1) Create a MySQL database and set the connection string in an `.env` file at the project root:

```env
DATABASE_URL="mysql://USER:PASSWORD@HOST:PORT/DBNAME?connection_limit=10"
```

2) Install deps:

```bash
npm install
```

3) Generate Prisma client and run the first migration:

```bash
npm run prisma:generate
npm run prisma:migrate
```

To apply pending migrations in CI/production:

```bash
npm run prisma:deploy
```

Open Prisma Studio to inspect data:

```bash
npm run prisma:studio
```

## Development

Run the app:

```bash
npm run dev
```

Then visit `http://localhost:3000`.

## API Routes

### Order Requests

- `POST /api/orders/requests` - Create order request (CLIENT only)
- `POST /api/orders/requests/[id]/accept` - Accept order request (VENDOR only)
- `POST /api/orders/requests/[id]/refuse` - Refuse order request (VENDOR only)

### Messaging

- `POST /api/threads` - Create thread (auth required)
- `GET /api/threads/[id]` - Fetch thread + last 50 messages (participant-only)
- `POST /api/threads/[id]/messages` - Send message (participant-only)

## Testing with curl

Create an order request:
```bash
curl -X POST http://localhost:3000/api/orders/requests \
  -H "Content-Type: application/json" \
  -d '{"storeId":"1","source":"buy_now","address":{"city":"Casa"}}'
```

Accept an order request:
```bash
curl -X POST http://localhost:3000/api/orders/requests/1/accept
```

Refuse an order request:
```bash
curl -X POST http://localhost:3000/api/orders/requests/1/refuse \
  -H "Content-Type: application/json" \
  -d '{"reason":"Item not available"}'
```

Create a message thread:
```bash
curl -X POST http://localhost:3000/api/threads \
  -H "Content-Type: application/json" \
  -d '{"participants":["1","2"]}'
```

Send a message:
```bash
curl -X POST http://localhost:3000/api/threads/1/messages \
  -H "Content-Type: application/json" \
  -d '{"body":"hello"}'
```