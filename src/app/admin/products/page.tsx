'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Plus, Pencil, Trash2, ShoppingBag, Upload, AlertCircle, Check, Star } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Product, Category } from '@/types/database.types';
import { formatCurrency, slugify } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { SeedButton } from '@/components/admin/SeedButton';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('10');
  const [imageUrl, setImageUrl] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isActive, setIsActive] = useState(true);

  // Upload state
  const [uploadingFile, setUploadingFile] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const supabase = createClient();
    const [prodRes, catRes] = await Promise.all([
      supabase.from('products').select('*, category:categories(*)').order('created_at', { ascending: false }),
      supabase.from('categories').select('*').order('name'),
    ]);

    if (prodRes.data) setProducts(prodRes.data);
    if (catRes.data) setCategories(catRes.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAddModal = () => {
    setEditingProduct(null);
    setName('');
    setSlug('');
    setCategoryId(categories[0]?.id || '');
    setDescription('');
    setPrice('');
    setStock('10');
    setImageUrl('');
    setIsFeatured(false);
    setIsActive(true);
    setErrorMsg(null);
    setModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setSlug(p.slug);
    setCategoryId(p.category_id || '');
    setDescription(p.description || '');
    setPrice(String(p.price));
    setStock(String(p.stock));
    setImageUrl(p.image_url || '');
    setIsFeatured(p.is_featured);
    setIsActive(p.is_active);
    setErrorMsg(null);
    setModalOpen(true);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!editingProduct) {
      setSlug(slugify(val));
    }
  };

  // Upload su Supabase Storage bucket 'products-images'
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    setErrorMsg(null);

    try {
      const supabase = createClient();
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `products/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('products-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Recupera URL pubblico
      const { data: publicUrlData } = supabase.storage
        .from('products-images')
        .getPublicUrl(filePath);

      setImageUrl(publicUrlData.publicUrl);
    } catch (err: any) {
      setErrorMsg(`Errore upload file su Supabase Storage: ${err.message}`);
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);

    const supabase = createClient();
    const numericPrice = parseFloat(price);
    const numericStock = parseInt(stock, 10);

    if (isNaN(numericPrice) || numericPrice < 0) {
      setErrorMsg('Inserisci un prezzo valido.');
      setSaving(false);
      return;
    }

    try {
      const payload = {
        name,
        slug,
        category_id: categoryId || null,
        description: description || null,
        price: numericPrice,
        stock: isNaN(numericStock) ? 0 : numericStock,
        image_url: imageUrl || null,
        is_featured: isFeatured,
        is_active: isActive,
      };

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(payload)
          .eq('id', editingProduct.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('products').insert(payload);
        if (error) throw error;
      }

      setModalOpen(false);
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Errore salvataggio prodotto.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, prodName: string) => {
    if (!confirm(`Sei sicuro di voler eliminare il prodotto "${prodName}"?`)) return;

    const supabase = createClient();
    const { error } = await supabase.from('products').delete().eq('id', id);

    if (error) {
      alert(`Errore eliminazione: ${error.message}`);
    } else {
      fetchData();
    }
  };

  const toggleProductActive = async (product: Product) => {
    const supabase = createClient();
    const updated = !product.is_active;
    await supabase.from('products').update({ is_active: updated }).eq('id', product.id);
    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, is_active: updated } : p))
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Gestione Prodotti
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Gestisci articoli, prezzi, disponibilità stock e upload immagini su Supabase Storage.
          </p>
        </div>

        <Button onClick={openAddModal} variant="primary" size="sm" className="rounded-full px-5 h-10 font-bold shadow-sm">
          <Plus className="h-4 w-4 mr-1.5" />
          Nuovo Prodotto
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-3xl border border-slate-200/70 bg-white/80 shadow-xs backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200/70 dark:bg-slate-800/50 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4">Prodotto</th>
                <th className="px-6 py-4">Categoria</th>
                <th className="px-6 py-4">Prezzo</th>
                <th className="px-6 py-4">Disponibilità</th>
                <th className="px-6 py-4">Visibilità</th>
                <th className="px-6 py-4 text-right">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">
                    Caricamento catalogo in corso...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Nessun articolo presente nel database.
                    </p>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
                      Puoi aggiungere un prodotto manualmente oppure caricare istantaneamente il catalogo dimostrativo completo.
                    </p>
                    <div className="flex justify-center">
                      <SeedButton />
                    </div>
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="relative h-11 w-11 flex-shrink-0 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
                          {p.image_url ? (
                            <Image
                              src={p.image_url}
                              alt={p.name}
                              fill
                              className="object-cover"
                              sizes="44px"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-slate-300">
                              <ShoppingBag className="h-5 w-5" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            {p.name}
                            {p.is_featured && (
                              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            /{p.slug}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="inline-block px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 text-[10px] font-semibold border border-slate-200/60 dark:border-slate-700">
                        {p.category?.name || 'Senza Categoria'}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 font-black text-slate-900 dark:text-white">
                      {formatCurrency(Number(p.price))}
                    </td>
                    <td className="px-6 py-3.5">
                      {p.stock <= 0 ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-700 border border-rose-500/20 dark:text-rose-400">
                          Esaurito ({p.stock})
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 border border-emerald-500/20 dark:text-emerald-400">
                          {p.stock} pz.
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3.5">
                      <button
                        onClick={() => toggleProductActive(p)}
                        className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-colors ${
                          p.is_active
                            ? 'bg-emerald-500/15 text-emerald-700 border border-emerald-500/25 dark:bg-emerald-950/70 dark:text-emerald-300'
                            : 'bg-slate-100 text-slate-500 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                        }`}
                      >
                        {p.is_active ? 'Attivo' : 'Nascosto'}
                      </button>
                    </td>
                    <td className="px-6 py-3.5 text-right space-x-1">
                      <button
                        onClick={() => openEditModal(p)}
                        className="rounded-full p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
                        title="Modifica"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id, p.name)}
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
        title={editingProduct ? 'Modifica Prodotto' : 'Nuovo Prodotto'}
        className="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          {errorMsg && (
            <div className="flex items-center gap-2 p-3 text-xs text-red-600 bg-red-50 rounded-xl">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Nome Prodotto"
              placeholder="es. Sneakers Limited Edition"
              required
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
            />

            <Input
              label="Slug Univoco"
              placeholder="es. sneakers-limited-edition"
              required
              value={slug}
              onChange={(e) => setSlug(slugify(e.target.value))}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Categoria
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
              >
                <option value="">Nessuna Categoria</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Prezzo (€)"
              type="number"
              step="0.01"
              placeholder="99.99"
              required
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />

            <Input
              label="Giacenza Magazzino (Stock)"
              type="number"
              placeholder="10"
              required
              value={stock}
              onChange={(e) => setStock(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Descrizione Dettagliata
            </label>
            <textarea
              rows={3}
              placeholder="Descrizione completa con specifiche, taglie e materiali..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>

          {/* Upload Immagine su Supabase Storage */}
          <div className="space-y-2 p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/50">
            <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Immagine Prodotto (Supabase Storage: bucket 'products-images')
            </span>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <label className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-200 shadow-sm text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200">
                <Upload className="h-4 w-4" />
                {uploadingFile ? 'Caricamento Storage...' : 'Carica File Immagine'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={uploadingFile}
                />
              </label>

              <span className="text-xs text-slate-400">oppure inserisci URL:</span>

              <input
                type="text"
                placeholder="https://..."
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="flex-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            {imageUrl && (
              <div className="mt-2 flex items-center gap-3">
                <div className="relative h-12 w-12 rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
                  <Image src={imageUrl} alt="Anteprima" fill className="object-cover" />
                </div>
                <span className="text-[11px] text-emerald-600 font-medium truncate max-w-xs">
                  Immagine impostata correttamente
                </span>
              </div>
            )}
          </div>

          {/* Checkbox Toggles */}
          <div className="flex flex-wrap gap-6 pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              In evidenza sulla Home
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              Attivo / Visibile ai clienti
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setModalOpen(false)}
            >
              Annulla
            </Button>
            <Button type="submit" isLoading={saving || uploadingFile} size="sm">
              {editingProduct ? 'Salva Prodotto' : 'Pubblica Prodotto'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

