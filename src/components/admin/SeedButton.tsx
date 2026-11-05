'use client';

import React, { useState } from 'react';
import { Sparkles, Check, AlertCircle } from 'lucide-react';

export function SeedButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSeed = async () => {
    if (!confirm('Vuoi caricare il catalogo dimostrativo (8 categorie e 22 prodotti con immagini)?')) {
      return;
    }

    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch('/api/seed', { method: 'POST' });
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || 'Errore durante il caricamento');
      }

      setMessage(json.message);
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        onClick={handleSeed}
        disabled={loading}
        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 active:scale-95 transition-all disabled:opacity-50"
      >
        <Sparkles className="h-4 w-4" />
        <span>{loading ? 'Caricamento in corso...' : 'Carica Dati Demo (1 Click)'}</span>
      </button>

      {message && (
        <p className="text-xs font-semibold text-emerald-600 flex items-center gap-1 animate-fade-in">
          <Check className="h-3.5 w-3.5" /> {message}
        </p>
      )}

      {error && (
        <p className="text-xs font-semibold text-rose-500 flex items-center gap-1 animate-fade-in">
          <AlertCircle className="h-3.5 w-3.5" /> {error}
        </p>
      )}
    </div>
  );
}
