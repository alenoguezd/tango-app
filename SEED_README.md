# Seed Script Documentation

## Overview
The seed script (`scripts/seed-curated-sets.ts`) populates the Supabase database with curated Japanese vocabulary sets.

## System Curator ID
All curated sets are owned by a system user:
```
SYSTEM_CURATOR_ID = "curator-system-001"
```

This ID is exported from `lib/constants.ts` and used throughout the app to identify curated content.

## Seeded Sets

### Category: "Primer viaje a Japón"
1. **Saludos** (Badge: Básico)
   - こんにちは → Hola
   - ありがとう → Gracias
   - すみません → Perdón
   - はい → Sí
   - いいえ → No

2. **En el restaurante** (Badge: Viaje)
   - メニュー → Menú
   - みず → Agua
   - かんじょう → La cuenta
   - おいしい → Delicioso
   - たべもの → Comida

### Category: "Conversación básica"
3. **Familia** (Badge: Básico)
   - ちち → Padre
   - はは → Madre
   - あに → Hermano mayor
   - いもうと → Hermana menor
   - かぞく → Familia

4. **Clima** (Badge: Cotidiano)
   - あめ → Lluvia
   - はれ → Soleado
   - くもり → Nublado
   - かぜ → Viento
   - ゆき → Nieve

## Prerequisites
Ensure your `.env.local` file contains:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

⚠️ **Important**: The `SUPABASE_SERVICE_ROLE_KEY` has admin privileges. Keep it secure and never commit it to version control.

## Running the Script

### Local Development
```bash
npx ts-node scripts/seed-curated-sets.ts
```

### Using tsx (faster)
```bash
npx tsx scripts/seed-curated-sets.ts
```

### Expected Output
```
🌱 Starting curated sets seed...

📚 Seeding: Saludos
  ✓ Set created: [set-uuid]
  ✓ Cards inserted: 5
📚 Seeding: En el restaurante
  ✓ Set created: [set-uuid]
  ✓ Cards inserted: 5
...

✅ Seed completed successfully!
Total sets seeded: 4
System curator ID: curator-system-001
```

## Database Schema Requirements

The script expects the following tables in Supabase:

### `sets` table
```sql
- id (uuid, primary key)
- user_id (uuid or text, references curator system ID)
- name (text)
- description (text, optional)
- category (text)
- badge_label (text: "Básico" | "Viaje" | "Cotidiano")
- is_public (boolean, default: false)
- created_at (timestamp)
- updated_at (timestamp)
```

### `cards` table
```sql
- id (uuid, primary key)
- set_id (uuid, foreign key to sets)
- order (integer)
- front (text, Japanese)
- back (text, Spanish)
- difficulty (integer, 1-5)
- created_at (timestamp)
```

## Production Deployment

### Option 1: Direct Script Execution
1. Set environment variables on your server:
   ```bash
   export NEXT_PUBLIC_SUPABASE_URL="your_url"
   export SUPABASE_SERVICE_ROLE_KEY="your_key"
   ```

2. Run the script:
   ```bash
   npx tsx scripts/seed-curated-sets.ts
   ```

### Option 2: Manual SQL Insertion
If you prefer direct SQL execution in Supabase Dashboard:

1. Go to Supabase Dashboard → SQL Editor
2. Create a new query and paste the SQL below
3. Execute the query

```sql
-- Insert system curator user (if needed)
-- Note: Adjust user_id type based on your auth setup

-- Insert curated sets
INSERT INTO sets (user_id, name, description, category, badge_label, is_public, created_at, updated_at)
VALUES
  ('curator-system-001', 'Saludos', 'Vocabulary for: Primer viaje a Japón', 'Primer viaje a Japón', 'Básico', true, NOW(), NOW()),
  ('curator-system-001', 'En el restaurante', 'Vocabulary for: Primer viaje a Japón', 'Primer viaje a Japón', 'Viaje', true, NOW(), NOW()),
  ('curator-system-001', 'Familia', 'Vocabulary for: Conversación básica', 'Conversación básica', 'Básico', true, NOW(), NOW()),
  ('curator-system-001', 'Clima', 'Vocabulary for: Conversación básica', 'Conversación básica', 'Cotidiano', true, NOW(), NOW())
RETURNING id, name;

-- Then insert cards (use the returned set IDs):
INSERT INTO cards (set_id, "order", front, back, difficulty, created_at)
VALUES
  -- Saludos cards (replace SET_ID_1 with actual ID)
  ('SET_ID_1', 0, 'こんにちは', 'Hola', 1, NOW()),
  ('SET_ID_1', 1, 'ありがとう', 'Gracias', 1, NOW()),
  ('SET_ID_1', 2, 'すみません', 'Perdón', 1, NOW()),
  ('SET_ID_1', 3, 'はい', 'Sí', 1, NOW()),
  ('SET_ID_1', 4, 'いいえ', 'No', 1, NOW()),
  
  -- En el restaurante cards (replace SET_ID_2 with actual ID)
  ('SET_ID_2', 0, 'メニュー', 'Menú', 2, NOW()),
  ('SET_ID_2', 1, 'みず', 'Agua', 1, NOW()),
  ('SET_ID_2', 2, 'かんじょう', 'La cuenta', 2, NOW()),
  ('SET_ID_2', 3, 'おいしい', 'Delicioso', 2, NOW()),
  ('SET_ID_2', 4, 'たべもの', 'Comida', 2, NOW()),
  
  -- Familia cards (replace SET_ID_3 with actual ID)
  ('SET_ID_3', 0, 'ちち', 'Padre', 1, NOW()),
  ('SET_ID_3', 1, 'はは', 'Madre', 1, NOW()),
  ('SET_ID_3', 2, 'あに', 'Hermano mayor', 2, NOW()),
  ('SET_ID_3', 3, 'いもうと', 'Hermana menor', 2, NOW()),
  ('SET_ID_3', 4, 'かぞく', 'Familia', 2, NOW()),
  
  -- Clima cards (replace SET_ID_4 with actual ID)
  ('SET_ID_4', 0, 'あめ', 'Lluvia', 1, NOW()),
  ('SET_ID_4', 1, 'はれ', 'Soleado', 1, NOW()),
  ('SET_ID_4', 2, 'くもり', 'Nublado', 1, NOW()),
  ('SET_ID_4', 3, 'かぜ', 'Viento', 1, NOW()),
  ('SET_ID_4', 4, 'ゆき', 'Nieve', 1, NOW());
```

## Verification

After running the seed script, verify the data was inserted:

```sql
-- Check seeded sets
SELECT id, name, category, badge_label, is_public 
FROM sets 
WHERE user_id = 'curator-system-001'
ORDER BY category, name;

-- Check card count per set
SELECT s.name, COUNT(c.id) as card_count
FROM sets s
LEFT JOIN cards c ON s.id = c.set_id
WHERE s.user_id = 'curator-system-001'
GROUP BY s.id, s.name;
```

## Troubleshooting

### "Missing SUPABASE environment variables"
- Ensure `.env.local` is in the project root
- Check that `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set
- Restart your terminal for env changes to take effect

### "Error creating set: ..."
- Verify the `sets` table exists and has the required columns
- Check Supabase RLS policies aren't blocking inserts
- Ensure the service role key has write permissions

### "Error creating cards: ..."
- Verify the `cards` table exists with required columns
- Check foreign key constraint on `set_id` column
- Ensure card data format matches schema expectations

## Notes

- The script is idempotent in structure but will insert duplicates if run multiple times. Delete existing sets if you need to re-seed.
- All seeded sets have `is_public: true` and are owned by the system curator
- These sets will appear in the home screen and "See all" views for all users
- User-created sets remain separate (is_public: false) with their own edit controls
