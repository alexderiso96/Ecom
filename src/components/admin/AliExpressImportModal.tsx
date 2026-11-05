'use client';

import React, { useState } from 'react';
import { Download, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Category } from '@/types/database.types';

interface AliExpressImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onImportSuccess: () => void;
}

export function AliExpressImportModal({
  isOpen,
  onClose,
  categories,
  onImportSuccess,
}: AliExpressImportModalProps) {
  const [urlOrId, setUrlOrId] = useState('');
  const [markup, setMarkup] = useState('50');
  const [categoryId, setCategoryId] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlOrId.trim()) return;

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/aliexpress/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aliexpressUrlOrId: urlOrId.trim(),
          markupPercentage: Number(markup) || 50,
          categoryId: categoryId || undefined,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Errore durante l\'importazione del prodotto AliExpress');
      }

      setSuccessMsg(`Prodotto "${json.product.name}" importato con successo!`);
      setUrlOrId('');
      setTimeout(() => {
        onImportSuccess();
        onClose();
        setSuccessMsg(null);
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Errore durante la chiamata API di importazione');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Importa Prodotto da AliExpress"
      description="Incolla l'URL o l'ID del prodotto AliExpress per importare immagini, descrizioni, varianti e prezzi."
    >
      <form onSubmit={handleImport} className="space-y-4">
        {errorMsg && (
          <div className="flex items-center gap-2 p-3 rounded-2xl bg-rose-500/15 text-rose-800 border border-rose-500/25 text-xs font-semibold">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="flex items-center gap-2 p-3 rounded-2xl bg-emerald-500/15 text-emerald-800 border border-emerald-500/25 text-xs font-semibold">
            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <Input
          label="URL Prodotto o ID AliExpress"
          placeholder="es. https://it.aliexpress.com/item/1005006234567890.html oppure 1005006234567890"
          value={urlOrId}
          onChange={(e) => setUrlOrId(e.target.value)}
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Ricarico Margine (%)"
            type="number"
            min="0"
            max="500"
            placeholder="50"
            value={markup}
            onChange={(e) => setMarkup(e.target.value)}
            required
          />

          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Categoria di Destinazione
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
            >
              <option value="">Seleziona Categoria (opzionale)</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="pt-3 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-full border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Annulla
          </button>

          <button
            type="submit"
            disabled={loading || !urlOrId.trim()}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 active:scale-95 disabled:opacity-50 transition-all"
          >
            {loading ? (
              <>
                <Sparkles className="h-3.5 w-3.5 animate-spin" />
                <span>Importazione in corso...</span>
              </>
            ) : (
              <>
                <Download className="h-3.5 w-3.5" />
                <span>Avvia Importazione API</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}

