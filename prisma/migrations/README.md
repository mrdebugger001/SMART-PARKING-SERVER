# Prisma Migrations

This directory contains database migrations managed by Prisma.

## How to Use

1. After making changes to your `schema.prisma` file, run:
```
npm run prisma:migrate
```

2. Follow the prompts to name your migration

3. To apply migrations in production:
```
npx prisma migrate deploy
```

## Migration Guidelines

- Keep migrations small and focused
- Use descriptive names for migrations
- Test migrations before applying to production
- Never edit an existing migration after it has been applied
- Use Prisma Studio to explore your database: `npm run prisma:studio` 