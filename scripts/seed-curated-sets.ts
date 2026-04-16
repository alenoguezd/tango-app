/**
 * Seed script for curated sets
 * Inserts predefined Japanese vocabulary sets into Supabase
 * Run with: npx tsx scripts/seed-curated-sets.ts
 */

import { createClient } from "@supabase/supabase-js";
import { SYSTEM_CURATOR_ID } from "../lib/constants";
import * as fs from "fs";
import * as path from "path";

// Load .env.local manually
const envPath = path.join(__dirname, "../.env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const [, key, value] = match;
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error(
    "Missing SUPABASE environment variables. Make sure .env.local is set up."
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface Card {
  kana: string; // Kana reading (ひらがな)
  kanji?: string; // Kanji (optional)
  spanish: string; // Spanish translation
  example_usage?: string; // Example sentence in Japanese
  difficulty: number;
}

interface CuratedSetData {
  name: string;
  category: string;
  cards: Card[];
}

const CURATED_SETS: CuratedSetData[] = [
  // Category: "Primer viaje a Japón"
  {
    name: "Saludos",
    category: "Primer viaje a Japón",
    cards: [
      { kana: "こんにちは", spanish: "Hola", example_usage: "こんにちは、わたしはアレハンドラです。", difficulty: 1 },
      { kana: "ありがとう", kanji: "有難う", spanish: "Gracias", example_usage: "ありがとうございます。", difficulty: 1 },
      { kana: "すみません", spanish: "Perdón/Disculpe", example_usage: "すみません、えいご をはなしますか？", difficulty: 1 },
      { kana: "はい", spanish: "Sí", example_usage: "はい、わかりました。", difficulty: 1 },
      { kana: "いいえ", spanish: "No", example_usage: "いいえ、ありません。", difficulty: 1 },
    ],
  },
  {
    name: "En el restaurante",
    category: "Primer viaje a Japón",
    cards: [
      { kana: "めにゅー", kanji: "メニュー", spanish: "Menú", example_usage: "めにゅーをください。", difficulty: 2 },
      { kana: "みず", kanji: "水", spanish: "Agua", example_usage: "みずをください。", difficulty: 1 },
      { kana: "かんじょう", spanish: "La cuenta", example_usage: "かんじょうをください。", difficulty: 2 },
      { kana: "おいしい", spanish: "Delicioso", example_usage: "これはおいしいです。", difficulty: 2 },
      { kana: "たべもの", kanji: "食べ物", spanish: "Comida", example_usage: "たべものはなんですか？", difficulty: 2 },
    ],
  },

  // Category: "Conversación básica"
  {
    name: "Familia",
    category: "Conversación básica",
    cards: [
      { kana: "ちち", kanji: "父", spanish: "Padre", example_usage: "ちちは えんじにあです。", difficulty: 1 },
      { kana: "はは", kanji: "母", spanish: "Madre", example_usage: "はははきょうしつです。", difficulty: 1 },
      { kana: "あに", kanji: "兄", spanish: "Hermano mayor", example_usage: "あには がっこうにいます。", difficulty: 2 },
      { kana: "いもうと", kanji: "妹", spanish: "Hermana menor", example_usage: "いもうとは しょうがくせいです。", difficulty: 2 },
      { kana: "かぞく", kanji: "家族", spanish: "Familia", example_usage: "かぞくは なんにんですか？", difficulty: 2 },
    ],
  },
  {
    name: "Clima",
    category: "Conversación básica",
    cards: [
      { kana: "あめ", kanji: "雨", spanish: "Lluvia", example_usage: "あめがふっています。", difficulty: 1 },
      { kana: "はれ", kanji: "晴れ", spanish: "Soleado", example_usage: "きょうははれです。", difficulty: 1 },
      { kana: "くもり", kanji: "曇り", spanish: "Nublado", example_usage: "あしたはくもりでしょう。", difficulty: 1 },
      { kana: "かぜ", kanji: "風", spanish: "Viento", example_usage: "かぜがつよいです。", difficulty: 1 },
      { kana: "ゆき", kanji: "雪", spanish: "Nieve", example_usage: "ゆきがふっています。", difficulty: 1 },
    ],
  },

  // NEW: "Números y tiempo" (Esencial, 25 cards)
  {
    name: "Números y tiempo",
    category: "Números y tiempo",
    cards: [
      { kana: "ゼロ", spanish: "Cero", difficulty: 1 },
      { kana: "いち", kanji: "一", spanish: "Uno", difficulty: 1 },
      { kana: "に", kanji: "二", spanish: "Dos", difficulty: 1 },
      { kana: "さん", kanji: "三", spanish: "Tres", difficulty: 1 },
      { kana: "し/よん", kanji: "四", spanish: "Cuatro", difficulty: 1 },
      { kana: "ご", kanji: "五", spanish: "Cinco", difficulty: 1 },
      { kana: "ろく", kanji: "六", spanish: "Seis", difficulty: 1 },
      { kana: "しち/なな", kanji: "七", spanish: "Siete", difficulty: 1 },
      { kana: "はち", kanji: "八", spanish: "Ocho", difficulty: 1 },
      { kana: "きゅう", kanji: "九", spanish: "Nueve", difficulty: 1 },
      { kana: "じゅう", kanji: "十", spanish: "Diez", difficulty: 1 },
      { kana: "ひゃく", kanji: "百", spanish: "Cien", difficulty: 2 },
      { kana: "せん", kanji: "千", spanish: "Mil", difficulty: 2 },
      { kana: "まん", kanji: "万", spanish: "Diez mil", difficulty: 2 },
      { kana: "じ", kanji: "時", spanish: "Hora", example_usage: "なんじですか？", difficulty: 2 },
      { kana: "ふん", kanji: "分", spanish: "Minuto", example_usage: "ごふんください。", difficulty: 2 },
      { kana: "び", kanji: "日", spanish: "Día (numérico)", difficulty: 2 },
      { kana: "がつ", kanji: "月", spanish: "Mes", difficulty: 2 },
      { kana: "ねん", kanji: "年", spanish: "Año", difficulty: 2 },
      { kana: "あさ", kanji: "朝", spanish: "Mañana", difficulty: 2 },
      { kana: "ひる", kanji: "昼", spanish: "Mediodía", difficulty: 2 },
      { kana: "よる", kanji: "夜", spanish: "Noche", difficulty: 2 },
      { kana: "きょう", kanji: "今日", spanish: "Hoy", difficulty: 2 },
      { kana: "あした", kanji: "明日", spanish: "Mañana (día siguiente)", difficulty: 2 },
      { kana: "きのう", kanji: "昨日", spanish: "Ayer", difficulty: 2 },
    ],
  },

  // NEW: "Transporte y direcciones" (Viaje, 25 cards)
  {
    name: "Transporte y direcciones",
    category: "Transporte y direcciones",
    cards: [
      { kana: "くるま", kanji: "車", spanish: "Coche", difficulty: 2 },
      { kana: "でんしゃ", kanji: "電車", spanish: "Tren", difficulty: 2 },
      { kana: "ひこうき", kanji: "飛行機", spanish: "Avión", difficulty: 2 },
      { kana: "ふね", kanji: "船", spanish: "Barco", difficulty: 2 },
      { kana: "バス", spanish: "Autobús", difficulty: 1 },
      { kana: "えき", kanji: "駅", spanish: "Estación", difficulty: 2 },
      { kana: "ちゅうしゃじょう", spanish: "Aparcamiento", difficulty: 2 },
      { kana: "みち", kanji: "道", spanish: "Camino", difficulty: 2 },
      { kana: "まがる", kanji: "曲がる", spanish: "Girar", difficulty: 2 },
      { kana: "まっすぐ", spanish: "Derecho", difficulty: 2 },
      { kana: "ひだり", kanji: "左", spanish: "Izquierda", difficulty: 1 },
      { kana: "みぎ", kanji: "右", spanish: "Derecha", difficulty: 1 },
      { kana: "うしろ", kanji: "後ろ", spanish: "Atrás", difficulty: 2 },
      { kana: "まえ", kanji: "前", spanish: "Frente", difficulty: 1 },
      { kana: "ちかく", spanish: "Cerca", difficulty: 2 },
      { kana: "とおく", spanish: "Lejos", difficulty: 2 },
      { kana: "あそこ", spanish: "Allá", difficulty: 2 },
      { kana: "どこ", spanish: "Dónde", difficulty: 1 },
      { kana: "ここ", spanish: "Aquí", difficulty: 1 },
      { kana: "そこ", spanish: "Allí", difficulty: 1 },
      { kana: "のります", kanji: "乗ります", spanish: "Subir (a un vehículo)", difficulty: 2 },
      { kana: "おります", kanji: "降ります", spanish: "Bajar (de un vehículo)", difficulty: 2 },
      { kana: "きっぷ", kanji: "切符", spanish: "Boleto", difficulty: 2 },
      { kana: "うんてんしゅ", spanish: "Conductor", difficulty: 2 },
      { kana: "ちず", kanji: "地図", spanish: "Mapa", difficulty: 2 },
    ],
  },

  // NEW: "Hotel y alojamiento" (Viaje, 20 cards)
  {
    name: "Hotel y alojamiento",
    category: "Hotel y alojamiento",
    cards: [
      { kana: "ほてる", kanji: "ホテル", spanish: "Hotel", difficulty: 1 },
      { kana: "やど", kanji: "宿", spanish: "Alojamiento", difficulty: 2 },
      { kana: "へや", kanji: "部屋", spanish: "Habitación", difficulty: 2 },
      { kana: "ベッド", spanish: "Cama", difficulty: 1 },
      { kana: "シャワー", spanish: "Ducha", difficulty: 1 },
      { kana: "おふろ", kanji: "お風呂", spanish: "Baño/Bañera", difficulty: 2 },
      { kana: "といれ", kanji: "トイレ", spanish: "Inodoro", difficulty: 2 },
      { kana: "かぎ", kanji: "鍵", spanish: "Llave", difficulty: 2 },
      { kana: "よやく", kanji: "予約", spanish: "Reserva", difficulty: 2 },
      { kana: "ていいん", spanish: "Recepcionista", difficulty: 2 },
      { kana: "りょうきん", spanish: "Tarifa/Precio", difficulty: 2 },
      { kana: "あさご飯", kanji: "朝食", spanish: "Desayuno", difficulty: 2 },
      { kana: "ばんご飯", kanji: "晩食", spanish: "Cena", difficulty: 2 },
      { kana: "たまご", spanish: "Huevo", difficulty: 1 },
      { kana: "ぎゅうにゅう", spanish: "Leche", difficulty: 2 },
      { kana: "おかし", spanish: "Dulces", difficulty: 2 },
      { kana: "すてき", kanji: "素敵", spanish: "Hermoso", difficulty: 2 },
      { kana: "きれい", kanji: "綺麗", spanish: "Limpio/Hermoso", difficulty: 2 },
      { kana: "すずしい", kanji: "涼しい", spanish: "Fresco", difficulty: 2 },
      { kana: "あたたかい", kanji: "温かい", spanish: "Cálido", difficulty: 2 },
    ],
  },

  // NEW: "Ir de compras" (Viaje, 25 cards)
  {
    name: "Ir de compras",
    category: "Ir de compras",
    cards: [
      { kana: "みせ", kanji: "店", spanish: "Tienda", difficulty: 2 },
      { kana: "スーパー", spanish: "Supermercado", difficulty: 1 },
      { kana: "デパート", spanish: "Departamento", difficulty: 1 },
      { kana: "かいます", kanji: "買います", spanish: "Comprar (present)", difficulty: 2 },
      { kana: "かいました", kanji: "買いました", spanish: "Compré", difficulty: 2 },
      { kana: "いくら", spanish: "Cuánto cuesta", difficulty: 1 },
      { kana: "ねだん", kanji: "値段", spanish: "Precio", difficulty: 2 },
      { kana: "やすい", kanji: "安い", spanish: "Barato", difficulty: 2 },
      { kana: "たかい", kanji: "高い", spanish: "Caro", difficulty: 2 },
      { kana: "ぎゅうにゅう", spanish: "Leche", difficulty: 2 },
      { kana: "パン", spanish: "Pan", difficulty: 1 },
      { kana: "ケーキ", spanish: "Pastel", difficulty: 1 },
      { kana: "はし", spanish: "Palillos", difficulty: 2 },
      { kana: "なべ", kanji: "鍋", spanish: "Olla", difficulty: 2 },
      { kana: "ランプ", spanish: "Lámpara", difficulty: 2 },
      { kana: "ほん", kanji: "本", spanish: "Libro", difficulty: 1 },
      { kana: "ノート", spanish: "Cuaderno", difficulty: 1 },
      { kana: "ペン", spanish: "Bolígrafo", difficulty: 1 },
      { kana: "くつ", kanji: "靴", spanish: "Zapatos", difficulty: 2 },
      { kana: "かばん", kanji: "鞄", spanish: "Bolsa/Maleta", difficulty: 2 },
      { kana: "フク", kanji: "服", spanish: "Ropa", difficulty: 2 },
      { kana: "セーター", spanish: "Suéter", difficulty: 1 },
      { kana: "ズボン", spanish: "Pantalones", difficulty: 1 },
      { kana: "ポケット", spanish: "Bolsillo", difficulty: 1 },
      { kana: "さいふ", kanji: "財布", spanish: "Cartera", difficulty: 2 },
    ],
  },

  // NEW: "Emergencias y salud" (Esencial, 20 cards)
  {
    name: "Emergencias y salud",
    category: "Emergencias y salud",
    cards: [
      { kana: "いたい", kanji: "痛い", spanish: "Duele", difficulty: 2 },
      { kana: "あたまがいたい", spanish: "Me duele la cabeza", difficulty: 2 },
      { kana: "おなかがいたい", spanish: "Me duele el estómago", difficulty: 2 },
      { kana: "びょういん", kanji: "病院", spanish: "Hospital", difficulty: 2 },
      { kana: "いしゃ", kanji: "医者", spanish: "Doctor", difficulty: 2 },
      { kana: "かんごふ", spanish: "Enfermero", difficulty: 2 },
      { kana: "くすり", kanji: "薬", spanish: "Medicina", difficulty: 2 },
      { kana: "かぜ", kanji: "風邪", spanish: "Resfriado", difficulty: 2 },
      { kana: "ねつ", kanji: "熱", spanish: "Fiebre", difficulty: 2 },
      { kana: "けがをしました", spanish: "Me lastimé", difficulty: 2 },
      { kana: "ちゅうしゃ", kanji: "注射", spanish: "Inyección", difficulty: 2 },
      { kana: "けんしん", kanji: "検診", spanish: "Chequeo/Revisión", difficulty: 2 },
      { kana: "たいおん", kanji: "体温", spanish: "Temperatura corporal", difficulty: 2 },
      { kana: "きゅうしゃ", spanish: "Ambulancia", difficulty: 2 },
      { kana: "よんでください", spanish: "Por favor llame a...", difficulty: 2 },
      { kana: "ばんそうこう", spanish: "Venda/Tirita", difficulty: 2 },
      { kana: "すりきず", spanish: "Raspadura", difficulty: 2 },
      { kana: "こわい", kanji: "怖い", spanish: "Asustado", difficulty: 2 },
      { kana: "すぐ", spanish: "Inmediatamente", difficulty: 2 },
      { kana: "たすけてください", spanish: "¡Ayuda por favor!", difficulty: 2 },
    ],
  },

  // NEW: "Comida y bebida" (Cotidiano, 30 cards)
  {
    name: "Comida y bebida",
    category: "Comida y bebida",
    cards: [
      { kana: "ごはん", kanji: "御飯", spanish: "Arroz/Comida", difficulty: 2 },
      { kana: "パン", spanish: "Pan", difficulty: 1 },
      { kana: "めん", kanji: "麺", spanish: "Fideos", difficulty: 2 },
      { kana: "ぎゅうにゅう", spanish: "Leche", difficulty: 2 },
      { kana: "コーヒー", spanish: "Café", difficulty: 1 },
      { kana: "ちゃ", kanji: "茶", spanish: "Té", difficulty: 1 },
      { kana: "ジュース", spanish: "Jugo", difficulty: 1 },
      { kana: "みず", kanji: "水", spanish: "Agua", difficulty: 1 },
      { kana: "ぎゅうにく", spanish: "Carne de res", difficulty: 2 },
      { kana: "とりにく", spanish: "Pollo", difficulty: 2 },
      { kana: "ぶたにく", spanish: "Cerdo", difficulty: 2 },
      { kana: "さかな", kanji: "魚", spanish: "Pescado", difficulty: 2 },
      { kana: "たまご", spanish: "Huevo", difficulty: 1 },
      { kana: "チーズ", spanish: "Queso", difficulty: 1 },
      { kana: "バター", spanish: "Mantequilla", difficulty: 1 },
      { kana: "はちみつ", spanish: "Miel", difficulty: 2 },
      { kana: "ジャム", spanish: "Mermelada", difficulty: 1 },
      { kana: "やさい", kanji: "野菜", spanish: "Verduras", difficulty: 2 },
      { kana: "くだもの", kanji: "果物", spanish: "Fruta", difficulty: 2 },
      { kana: "りんご", spanish: "Manzana", difficulty: 1 },
      { kana: "みかん", spanish: "Mandarina", difficulty: 1 },
      { kana: "いちご", spanish: "Fresa", difficulty: 1 },
      { kana: "バナナ", spanish: "Plátano", difficulty: 1 },
      { kana: "おいしい", kanji: "美味しい", spanish: "Delicioso", difficulty: 2 },
      { kana: "にがい", kanji: "苦い", spanish: "Amargo", difficulty: 2 },
      { kana: "から", kanji: "辛い", spanish: "Picante", difficulty: 2 },
      { kana: "すっぱい", kanji: "酸っぱい", spanish: "Agrio", difficulty: 2 },
      { kana: "あまい", kanji: "甘い", spanish: "Dulce", difficulty: 2 },
      { kana: "しおいっぱい", spanish: "Salado", difficulty: 2 },
      { kana: "さら", kanji: "皿", spanish: "Plato", difficulty: 2 },
    ],
  },
];

async function cleanupOldSets() {
  const setsToCleanup = ["Familia", "Clima"];

  for (const setName of setsToCleanup) {
    const { data: existingSet } = await supabase
      .from("sets")
      .select("id")
      .eq("name", setName)
      .single();

    if (existingSet) {
      // Delete the set (cascade will delete cards)
      const { error } = await supabase
        .from("sets")
        .delete()
        .eq("id", existingSet.id);

      if (!error) {
        console.log(`🗑️  Cleaned up old "${setName}" set (resetting to correct schema)`);
      }
    }
  }
}

async function seedCuratedSets() {
  console.log("🌱 Starting curated sets seed...\n");

  try {
    // Clean up old format sets before seeding
    await cleanupOldSets();

    for (const setData of CURATED_SETS) {
      console.log(`📚 Seeding: ${setData.name}`);

      // Check if set already exists (idempotent)
      const { data: existingSet } = await supabase
        .from("sets")
        .select("id")
        .eq("name", setData.name)
        .single();

      if (existingSet) {
        console.log(`  ⊘ Set already exists, skipping...`);
        continue;
      }

      // Insert set with cards as JSONB
      // Note: user_id is set to NULL for curated sets (system-managed)
      const { data: newSet, error: setError } = await supabase
        .from("sets")
        .insert({
          name: setData.name,
          is_public: true,
          cards: setData.cards, // Cards stored as JSONB array
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (setError) {
        console.error(`  ❌ Error creating set: ${setError.message}`);
        continue;
      }

      console.log(`  ✓ Set created: ${newSet.id}`);
      console.log(`  ✓ Cards inserted: ${setData.cards.length}`);
    }

    console.log("\n✅ Seed completed successfully!");
    console.log(
      `Total sets to seed: ${CURATED_SETS.length}\nSystem curator ID: ${SYSTEM_CURATOR_ID}`
    );
  } catch (error) {
    console.error("❌ Unexpected error during seed:", error);
    process.exit(1);
  }
}

// Run the seed
seedCuratedSets();
