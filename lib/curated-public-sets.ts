import type { VocabCard } from "@/components/flashcard";

export interface CuratedPublicSet {
  id: string;
  name: string;
  cards: VocabCard[];
}

function makeCards(setId: string, cards: Array<Omit<VocabCard, "id">>): VocabCard[] {
  return cards.map((card, index) => ({
    id: `${setId}-${index + 1}`,
    ...card,
  }));
}

export const CURATED_PUBLIC_SETS: CuratedPublicSet[] = [
  {
    id: "curated-saludos",
    name: "Saludos",
    cards: makeCards("curated-saludos", [
      { kana: "こんにちは", kanji: "", spanish: "Hola", example_usage: "こんにちは、アレハンドラです。" },
      { kana: "おはようございます", kanji: "", spanish: "Buenos días", example_usage: "おはようございます。" },
      { kana: "こんばんは", kanji: "", spanish: "Buenas noches", example_usage: "こんばんは、おげんきですか。" },
      { kana: "さようなら", kanji: "", spanish: "Adiós", example_usage: "さようなら、またあした。" },
      { kana: "またね", kanji: "", spanish: "Hasta luego", example_usage: "じゃあ、またね。" },
      { kana: "ありがとうございます", kanji: "有難うございます", spanish: "Muchas gracias", example_usage: "ありがとうございます。" },
      { kana: "どういたしまして", kanji: "", spanish: "De nada", example_usage: "どういたしまして。" },
      { kana: "すみません", kanji: "", spanish: "Disculpe", example_usage: "すみません、えいごをはなしますか。" },
      { kana: "ごめんなさい", kanji: "", spanish: "Lo siento", example_usage: "ごめんなさい。" },
      { kana: "はい", kanji: "", spanish: "Sí", example_usage: "はい、わかりました。" },
      { kana: "いいえ", kanji: "", spanish: "No", example_usage: "いいえ、けっこうです。" },
      { kana: "はじめまして", kanji: "", spanish: "Mucho gusto", example_usage: "はじめまして。" },
      { kana: "よろしくおねがいします", kanji: "", spanish: "Encantado", example_usage: "よろしくおねがいします。" },
      { kana: "おげんきですか", kanji: "お元気ですか", spanish: "¿Cómo estás?", example_usage: "おげんきですか。" },
      { kana: "げんきです", kanji: "元気です", spanish: "Estoy bien", example_usage: "げんきです。" },
      { kana: "おなまえは", kanji: "お名前は", spanish: "¿Tu nombre?", example_usage: "おなまえはなんですか。" },
      { kana: "わたしは", kanji: "私は", spanish: "Yo soy", example_usage: "わたしはアレハンドラです。" },
      { kana: "またあした", kanji: "また明日", spanish: "Hasta mañana", example_usage: "またあした。" },
      { kana: "おやすみなさい", kanji: "", spanish: "Buenas noches", example_usage: "おやすみなさい。" },
      { kana: "いってきます", kanji: "", spanish: "Ya me voy", example_usage: "いってきます。" },
    ]),
  },
  {
    id: "curated-restaurante",
    name: "En el restaurante",
    cards: makeCards("curated-restaurante", [
      { kana: "メニュー", kanji: "", spanish: "Menú", example_usage: "メニューをみせてください。" },
      { kana: "みず", kanji: "水", spanish: "Agua", example_usage: "みずをください。" },
      { kana: "おちゃ", kanji: "お茶", spanish: "Té", example_usage: "おちゃをください。" },
      { kana: "ごはん", kanji: "ご飯", spanish: "Arroz/comida", example_usage: "ごはんをたべます。" },
      { kana: "おいしい", kanji: "美味しい", spanish: "Delicioso", example_usage: "これはおいしいです。" },
      { kana: "ください", kanji: "", spanish: "Por favor deme", example_usage: "みずをください。" },
      { kana: "おねがいします", kanji: "", spanish: "Por favor", example_usage: "メニューをおねがいします。" },
      { kana: "かんじょう", kanji: "勘定", spanish: "La cuenta", example_usage: "かんじょうをおねがいします。" },
      { kana: "おすすめ", kanji: "", spanish: "Recomendación", example_usage: "おすすめはなんですか。" },
      { kana: "はし", kanji: "箸", spanish: "Palillos", example_usage: "はしをください。" },
      { kana: "フォーク", kanji: "", spanish: "Tenedor", example_usage: "フォークをください。" },
      { kana: "スプーン", kanji: "", spanish: "Cuchara", example_usage: "スプーンをください。" },
      { kana: "からい", kanji: "辛い", spanish: "Picante", example_usage: "これはからいですか。" },
      { kana: "あまい", kanji: "甘い", spanish: "Dulce", example_usage: "これはあまいです。" },
      { kana: "たべます", kanji: "食べます", spanish: "Comer", example_usage: "ラーメンをたべます。" },
      { kana: "のみます", kanji: "飲みます", spanish: "Beber", example_usage: "おちゃをのみます。" },
      { kana: "ひとつ", kanji: "", spanish: "Uno", example_usage: "ひとつください。" },
      { kana: "ふたつ", kanji: "", spanish: "Dos", example_usage: "ふたつください。" },
      { kana: "だいじょうぶ", kanji: "大丈夫", spanish: "Está bien", example_usage: "だいじょうぶです。" },
      { kana: "アレルギー", kanji: "", spanish: "Alergia", example_usage: "アレルギーがあります。" },
    ]),
  },
  {
    id: "curated-familia",
    name: "Familia",
    cards: makeCards("curated-familia", [
      { kana: "かぞく", kanji: "家族", spanish: "Familia", example_usage: "かぞくはなんにんですか。" },
      { kana: "ちち", kanji: "父", spanish: "Padre", example_usage: "ちちはエンジニアです。" },
      { kana: "はは", kanji: "母", spanish: "Madre", example_usage: "はははせんせいです。" },
      { kana: "あに", kanji: "兄", spanish: "Hermano mayor", example_usage: "あにはがくせいです。" },
      { kana: "あね", kanji: "姉", spanish: "Hermana mayor", example_usage: "あねはとうきょうにいます。" },
      { kana: "おとうと", kanji: "弟", spanish: "Hermano menor", example_usage: "おとうとがいます。" },
      { kana: "いもうと", kanji: "妹", spanish: "Hermana menor", example_usage: "いもうとがいます。" },
      { kana: "こども", kanji: "子供", spanish: "Niño/hijo", example_usage: "こどもがふたりいます。" },
      { kana: "おじいさん", kanji: "", spanish: "Abuelo", example_usage: "おじいさんはげんきです。" },
      { kana: "おばあさん", kanji: "", spanish: "Abuela", example_usage: "おばあさんはやさしいです。" },
      { kana: "おじさん", kanji: "", spanish: "Tío", example_usage: "おじさんはいしゃです。" },
      { kana: "おばさん", kanji: "", spanish: "Tía", example_usage: "おばさんはりょうりがじょうずです。" },
      { kana: "いとこ", kanji: "", spanish: "Primo/prima", example_usage: "いとこはおおさかにいます。" },
      { kana: "おっと", kanji: "夫", spanish: "Esposo", example_usage: "おっとはかいしゃいんです。" },
      { kana: "つま", kanji: "妻", spanish: "Esposa", example_usage: "つまはせんせいです。" },
      { kana: "りょうしん", kanji: "両親", spanish: "Padres", example_usage: "りょうしんはメキシコにいます。" },
      { kana: "きょうだい", kanji: "兄弟", spanish: "Hermanos", example_usage: "きょうだいがいますか。" },
      { kana: "むすこ", kanji: "息子", spanish: "Hijo", example_usage: "むすこはさんさいです。" },
      { kana: "むすめ", kanji: "娘", spanish: "Hija", example_usage: "むすめはがくせいです。" },
      { kana: "ペット", kanji: "", spanish: "Mascota", example_usage: "ペットがいます。" },
    ]),
  },
  {
    id: "curated-clima",
    name: "Clima",
    cards: makeCards("curated-clima", [
      { kana: "てんき", kanji: "天気", spanish: "Clima", example_usage: "てんきはどうですか。" },
      { kana: "はれ", kanji: "晴れ", spanish: "Soleado", example_usage: "きょうははれです。" },
      { kana: "あめ", kanji: "雨", spanish: "Lluvia", example_usage: "あめがふっています。" },
      { kana: "くもり", kanji: "曇り", spanish: "Nublado", example_usage: "あしたはくもりです。" },
      { kana: "ゆき", kanji: "雪", spanish: "Nieve", example_usage: "ゆきがふっています。" },
      { kana: "かぜ", kanji: "風", spanish: "Viento", example_usage: "かぜがつよいです。" },
      { kana: "あつい", kanji: "暑い", spanish: "Caluroso", example_usage: "きょうはあついです。" },
      { kana: "さむい", kanji: "寒い", spanish: "Frío", example_usage: "ふゆはさむいです。" },
      { kana: "あたたかい", kanji: "暖かい", spanish: "Cálido", example_usage: "はるはあたたかいです。" },
      { kana: "すずしい", kanji: "涼しい", spanish: "Fresco", example_usage: "あきはすずしいです。" },
      { kana: "たいふう", kanji: "台風", spanish: "Tifón", example_usage: "たいふうがきます。" },
      { kana: "かみなり", kanji: "雷", spanish: "Trueno", example_usage: "かみなりがなっています。" },
      { kana: "にじ", kanji: "虹", spanish: "Arcoíris", example_usage: "にじがでました。" },
      { kana: "きり", kanji: "霧", spanish: "Niebla", example_usage: "きりがこいです。" },
      { kana: "てんきよほう", kanji: "天気予報", spanish: "Pronóstico", example_usage: "てんきよほうをみました。" },
    ]),
  },
];

export function getCuratedPublicSet(id: string) {
  return CURATED_PUBLIC_SETS.find((set) => set.id === id);
}
