"use client";

import { useRef, useState } from "react";
import NextImage from "next/image";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { AppNav } from "./app-nav";
import { createClient } from "@/lib/supabase";
import { useWindowWidth } from "@/lib/use-window-width";

type CrearState = "idle" | "loading" | "success";

type GeneratedCard = {
  id?: string;
  kana: string;
  kanji?: string;
  spanish: string;
  example_usage?: string;
  difficulty?: number | null;
  known?: boolean;
};

interface CrearScreenProps {
  onNavigate: (tab: "inicio" | "crear" | "progreso") => void;
}

export function CrearScreen({ onNavigate }: CrearScreenProps) {
  const router = useRouter();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string | null>(null);
  const [setName, setSetName] = useState("");
  const [state, setState] = useState<CrearState>("idle");
  const [createError, setCreateError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const windowWidth = useWindowWidth();
  const isMobile = windowWidth < 1024;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageUrl(URL.createObjectURL(file));
    setImageName(file.name);
  }

  function handleRemoveImage() {
    setImageUrl(null);
    setImageName(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleGenerate() {
    if (!imageUrl || state !== "idle" || !setName.trim()) return;

    const finalName = setName.trim();
    setCreateError("");
    setState("loading");

    try {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          setState("idle");
          return;
        }
        ctx.drawImage(img, 0, 0);
        const base64 = canvas.toDataURL("image/jpeg").split(",")[1];

        try {
          const response = await fetch("/api/extract-vocab", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image: base64 }),
          });

          if (!response.ok) throw new Error("API error");

          const data = await response.json();
          const cards: GeneratedCard[] = data.cards || [];
          const id = crypto.randomUUID();

          const cardsWithIds: GeneratedCard[] = cards.map((card, index) => ({
            id: index.toString(),
            ...card,
          }));

          const supabase = createClient();
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            throw new Error("Debes iniciar sesión para crear un set.");
          }

          const { error: insertError } = await supabase.from("sets").insert({
            id,
            user_id: user.id,
            name: finalName,
            cards: cardsWithIds,
            is_favorite: false,
            is_public: false,
          });

          if (insertError) {
            throw new Error(insertError.message || "No se pudo guardar el set.");
          }

          setState("success");

          // Redirect to study
          setTimeout(() => {
            if (id) router.push(`/estudiar/${id}`);
          }, 800);
        } catch (err) {
          setCreateError(err instanceof Error ? err.message : "No se pudieron generar las tarjetas.");
          setState("idle");
        }
      };
      img.src = imageUrl;
    } catch (err) {
      setCreateError("No se pudo leer la imagen.");
      setState("idle");
    }
  }

  const canGenerate = !!imageUrl && !!setName.trim() && state === "idle";

  // ===== Main Content =====
  const mainContent = (
    <div className="px-4">
      {/* Title */}
      <h1 className="mb-10 pt-4 text-center text-2xl font-bold leading-tight text-text-primary">
        Nuevo set
      </h1>

      {/* Upload Zone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="mb-4 flex min-h-[250px] cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-border-default bg-surface px-6 py-8 text-center"
      >
        {!imageUrl ? (
          <>
            <NextImage
              src="/Crearcards.svg"
              alt=""
              width={118}
              height={118}
              className="mb-3 h-[118px] w-[118px] object-contain"
            />

            {/* Text */}
            <div>
              <h2 className="mb-2 text-base font-bold leading-tight text-text-primary">
                Subir foto
              </h2>
              <p className="m-0 text-base font-normal leading-normal text-text-secondary">
                Kanji, hiragana o rōmaji
              </p>
            </div>
          </>
        ) : (
          <div className="flex w-full max-w-[260px] items-center gap-3 rounded-md bg-success-bg p-3">
            <div
              className="h-14 w-14 shrink-0 rounded-md bg-surface bg-cover bg-center"
              style={{ backgroundImage: `url(${imageUrl})` }}
            />
            <div className="min-w-0 flex-1 text-left">
              <p className="mb-0.5 text-sm font-semibold leading-normal text-success-text">
                ✓ Imagen lista
              </p>
              <p className="m-0 truncate text-xs font-normal leading-normal text-success-text">
                {imageName}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveImage();
              }}
              className="flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center border-0 bg-transparent p-0 text-success-text"
              aria-label="Quitar imagen"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>

      {/* Set Name Input */}
      <label className="mb-2 block text-sm font-bold leading-normal text-text-primary">
        Nombre del set
      </label>
      <input
        type="text"
        value={setName}
        onChange={(e) => setSetName(e.target.value)}
        placeholder="Nombre del set"
        className="mb-4 w-full rounded-md border border-border-default bg-surface px-4 py-3 text-base text-text-primary placeholder:text-text-secondary"
      />

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={!canGenerate}
        className="flex w-full items-center justify-center gap-2 rounded-sm border-0 bg-text-primary px-5 py-4 text-base font-bold text-white disabled:cursor-not-allowed disabled:bg-grey disabled:text-text-secondary"
      >
        {state === "loading" ? "Procesando..." : "Generar tarjetas →"}
      </button>

      {createError && (
        <p className="mt-3 text-center text-base font-semibold text-error-text">
          {createError}
        </p>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );

  // ===== MOBILE LAYOUT =====
  const mobileContent = (
    <div className="mx-auto flex h-dvh max-w-[390px] flex-col bg-bg-page">
      {/* Safe-area top */}
      <div aria-hidden className="h-[max(16px,env(safe-area-inset-top,0px))] shrink-0" />

      {/* Scrollable content */}
      <div className="h-0 flex-1 overflow-y-auto pb-[100px] [-webkit-overflow-scrolling:touch]">
        {mainContent}
      </div>

      {/* Navigation */}
      <AppNav active="crear" onNavigate={onNavigate} />

      {/* iOS home indicator */}
      <div aria-hidden className="flex shrink-0 justify-center bg-surface pt-1 pb-[max(6px,env(safe-area-inset-bottom,6px))]">
        <div className="h-1 w-[134px] rounded-full bg-text-primary" />
      </div>
    </div>
  );

  // ===== DESKTOP LAYOUT =====
  const desktopContent = (
    <div className="flex h-dvh flex-row bg-bg-page">
      {/* Navigation (renders sidebar on desktop, nothing on mobile) */}
      <AppNav active="crear" onNavigate={onNavigate} />

      {/* Sidebar spacer for desktop layout */}
      <div className="hidden shrink-0 lg:block lg:w-64" />

      <div className="flex flex-1 flex-col">
        <div aria-hidden className="h-[max(16px,env(safe-area-inset-top,0px))] shrink-0" />

        <div className="h-screen flex-1 overflow-y-scroll pb-10 [-webkit-overflow-scrolling:touch]">
          <div className="mx-auto w-full max-w-[430px]">
            {mainContent}
          </div>
        </div>
      </div>
    </div>
  );

  return isMobile ? mobileContent : desktopContent;
}

