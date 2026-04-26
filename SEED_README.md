# Curated Sets Seed Script

`scripts/seed-curated-sets.ts` populates Supabase with public Japanese vocabulary sets. The app reads these as curated/public sets from the `sets` table.

## Requirements

Create `.env.local` in the project root with:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

`SUPABASE_SERVICE_ROLE_KEY` has admin privileges. Keep it local and never commit it.

## Run

```bash
npm run seed:curated
```

The script also works directly:

```bash
npx tsx scripts/seed-curated-sets.ts
```

## Data Shape

The seed script writes each curated set into the `sets` table with:

```sql
name        text
cards       jsonb
is_public   boolean
created_at  timestamp
user_id     null
```

Cards are stored inside `sets.cards` as JSON, matching how the app currently reads sets. Curated sets are public and system-managed, so `user_id` is intentionally `null`.

## Behavior

Before seeding, the script removes older copies of the starter sets by name:

- `Saludos`
- `En el restaurante`
- `Familia`
- `Clima`

It then inserts the current curated data from `CURATED_SETS`. User-created sets are not touched unless they use one of those exact starter names.

## Verify

```sql
SELECT id, name, is_public, user_id, jsonb_array_length(cards) AS card_count
FROM sets
WHERE is_public = true AND user_id IS NULL
ORDER BY name;
```

## Troubleshooting

- Missing environment variables: check `.env.local` and confirm both required keys are present.
- Insert errors: verify the `sets` table has the expected columns and the service role key is being used.
- Sets do not appear in the app: confirm they have `is_public = true` and `user_id IS NULL`.
