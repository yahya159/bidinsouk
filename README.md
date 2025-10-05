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
