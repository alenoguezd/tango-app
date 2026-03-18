import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase";

export default async function SharePage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from("sets")
      .select("*")
      .eq("id", params.id)
      .eq("is_public", true)
      .single();

    if (error || !data) {
      notFound();
    }

    return (
      <div style={{
        maxWidth: "600px",
        margin: "0 auto",
        padding: "20px",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      }}>
        <h1 style={{ fontSize: "28px", fontWeight: 800, marginBottom: "8px" }}>
          {data.name}
        </h1>
        <p style={{ fontSize: "13px", color: "#B0A898", marginBottom: "24px" }}>
          Este set ha sido compartido contigo
        </p>

        {data.cards && data.cards.length > 0 ? (
          <div>
            <h2 style={{ fontSize: "17px", fontWeight: 700, marginBottom: "16px" }}>
              Tarjetas ({data.cards.length})
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {data.cards.map((card: any, idx: number) => (
                <div
                  key={idx}
                  style={{
                    background: "#fff",
                    border: "1px solid #EEEBE6",
                    borderRadius: "14px",
                    padding: "16px",
                  }}
                >
                  <h3 style={{
                    fontSize: "14px",
                    fontWeight: 700,
                    color: "#1A1A1A",
                    margin: "0 0 4px 0",
                  }}>
                    {card.spanish || card.kanji || "Sin título"}
                  </h3>
                  <p style={{
                    fontSize: "13px",
                    color: "#B0A898",
                    margin: "0 0 8px 0",
                  }}>
                    {card.kana && `Kana: ${card.kana}`}
                    {card.kanji && card.kana && " • "}
                    {card.kanji && `Kanji: ${card.kanji}`}
                  </p>
                  <p style={{
                    fontSize: "12px",
                    color: "#1A1A1A",
                    margin: 0,
                  }}>
                    {card.example_usage || "Sin descripción"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p style={{ color: "#B0A898" }}>No hay tarjetas en este set</p>
        )}

        <div style={{ marginTop: "24px", padding: "16px", background: "#F5F5F5", borderRadius: "8px" }}>
          <p style={{ fontSize: "11px", color: "#B0A898", margin: 0 }}>
            💡 Este es un set compartido. Para estudiar y crear tus propios sets, inicia sesión en la aplicación.
          </p>
        </div>
      </div>
    );
  } catch (err) {
    console.error("Error fetching shared set:", err);
    notFound();
  }
}
