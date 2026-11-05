'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Plus, Pencil, Trash2, Layers, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Category } from '@/types/database.types';
import { slugify } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchCategories = async () => {
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    if (data) setCategories(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openAddModal = () => {
    setEditingCategory(null);
    setName('');
    setSlug('');
    setDescription('');
    setImageUrl('');
    setErrorMsg(null);
    setModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description || '');
    setImageUrl(cat.image_url || '');
    setErrorMsg(null);
    setModalOpen(true);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!editingCategory) {
      setSlug(slugify(val));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);

    const supabase = createClient();

    try {
      if (editingCategory) {
        // Update
        const { error } = await supabase
          .from('categories')
          .update({
            name,
            slug,
            description: description || null,
            image_url: imageUrl || null,
          })
          .eq('id', editingCategory.id);

        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase.from('categories').insert({
          name,
          slug,
          description: description || null,
          image_url: imageUrl || null,
        });

        if (error) throw error;
      }

      setModalOpen(false);
      fetchCategories();
    } catch (err: any) {
      setErrorMsg(err.message || 'Errore durante il salvataggio della categoria.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, catName: string) => {
    if (!confirm(`Sei sicuro di voler eliminare la categoria "${catName}"?`)) return;

    const supabase = createClient();
    const { error } = await supabase.from('categories').delete().eq('id', id);

    if (error) {
      alert(`Errore durante l'eliminazione: ${error.message}`);
    } else {
      fetchCategories();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Gestione Categorie
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Crea, modifica ed elimina le categorie merceologiche del catalogo.
          </p>
        </div>

        <Button onClick={openAddModal} variant="primary" size="sm" className="rounded-full px-5 h-10 font-bold shadow-sm">
          <Plus className="h-4 w-4 mr-1.5" />
          Nuova Categoria
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-3xl border border-slate-200/70 bg-white/80 shadow-xs backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200/70 dark:bg-slate-800/50 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4">Anteprima</th>
                <th className="px-6 py-4">Nome Categoria</th>
                <th className="px-6 py-4">Slug</th>
                <th className="px-6 py-4">Descrizione</th>
                <th className="px-6 py-4 text-right">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-400">
                    Caricamento categorie...
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-400">
                    Nessuna categoria presente. Clicca su "Nuova Categoria" per crearne una.
                  </td>
                </tr>
              ) : (
                categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="px-6 py-3.5">
                      <div className="relative h-10 w-10 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
                        {cat.image_url ? (
                          <Image
                            src={cat.image_url}
                            alt={cat.name}
                            fill
                            className="object-cover"
                            sizes="40px"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-slate-300">
                            <Layers className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-3.5 font-bold text-slate-900 dark:text-white">
                      {cat.name}
                    </td>
                    <td className="px-6 py-3.5 text-slate-500 font-mono text-[11px]">
                      {cat.slug}
                    </td>
                    <td className="px-6 py-3.5 text-slate-500 max-w-xs truncate">
                      {cat.description || '—'}
                    </td>
                    <td className="px-6 py-3.5 text-right space-x-1">
                      <button
                        onClick={() => openEditModal(cat)}
                        className="rounded-full p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
                        title="Modifica"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(cat.id, cat.name)}
                        className="rounded-full p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                        title="Elimina"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add / Edit */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingCategory ? 'Modifica Categoria' : 'Crea Nuova Categoria'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMsg && (
            <div className="flex items-center gap-2 p-3 text-xs text-red-600 bg-red-50 rounded-xl">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <Input
            label="Nome Categoria"
            placeholder="es. Gioielli & Accessori"
            required
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
          />

          <Input
            label="Slug URL"
            placeholder="es. gioielli-accessori"
            required
            value={slug}
            onChange={(e) => setSlug(slugify(e.target.value))}
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Descrizione
            </label>
            <textarea
              rows={3}
              placeholder="Descrizione sintetica per la vetrina..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>

          <Input
            label="URL Immagine di Copertina"
            placeholder="https://..."
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setModalOpen(false)}
            >
              Annulla
            </Button>
            <Button type="submit" isLoading={saving} size="sm">
              {editingCategory ? 'Salva Modifiche' : 'Crea Categoria'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

