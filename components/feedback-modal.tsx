"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase";

const REASONS = ["Traducción incorrecta", "Ejemplo incorrecto", "Otro"] as const;
type Reason = (typeof REASONS)[number];

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  cardId: string;
  setId: string;
  userId: string;
}

export function FeedbackModal({ isOpen, onClose, cardId, setId, userId }: FeedbackModalProps) {
  const [selectedReason, setSelectedReason] = useState<Reason | null>(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const reset = () => {
    setSelectedReason(null);
    setComment("");
    setSubmitted(false);
  };

  const handleClose = () => {
    onClose();
    reset();
  };

  const handleSubmit = async () => {
    if (!selectedReason || submitting) return;
    setSubmitting(true);
    try {
      const supabase = createClient();
      await supabase.from("feedback").insert({
        user_id: userId,
        card_id: cardId,
        set_id: setId,
        reason: selectedReason,
        comment: comment.trim() || null,
      });
      setSubmitted(true);
      setTimeout(() => {
        onClose();
        reset();
      }, 1400);
    } catch {
      // non-fatal — silently close
      handleClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={handleClose}
    >
      {/* Panel */}
      <div
        className="bg-white w-full max-w-sm rounded-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {submitted ? (
          <div className="py-6 flex flex-col items-center gap-2">
            <span className="text-3xl">✓</span>
            <p className="text-sm font-semibold text-text-primary">¡Gracias por el reporte!</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-text-primary">Reportar problema</h2>
              <button
                onClick={handleClose}
                className="text-text-secondary hover:text-text-primary transition-colors p-1 -mr-1"
                aria-label="Cerrar"
              >
                <X size={18} />
              </button>
            </div>

            {/* Reason chips */}
            <div className="flex flex-col gap-2 mb-4">
              {REASONS.map((reason) => (
                <button
                  key={reason}
                  onClick={() => setSelectedReason(reason)}
                  className={`px-4 py-2.5 rounded-lg text-sm font-medium text-left border transition-colors ${
                    selectedReason === reason
                      ? "bg-text-primary text-white border-text-primary"
                      : "bg-transparent text-text-primary border-border-default hover:bg-bg-subtle"
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>

            {/* Comment input */}
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Comentario opcional..."
              rows={3}
              className="w-full rounded-lg border border-border-default px-3 py-2.5 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-text-primary/20 resize-none mb-5 bg-white"
            />

            {/* Actions */}
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={handleClose}>
                Cancelar
              </Button>
              <Button
                className="flex-1"
                onClick={handleSubmit}
                disabled={!selectedReason || submitting}
              >
                {submitting ? "Enviando..." : "Enviar"}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
