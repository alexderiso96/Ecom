'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Plus, Pencil, Trash2, ShoppingBag, Upload, AlertCircle, Check, Star } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Product, Category } from '@/types/database.types';
import { formatCurrency, slugify, generateProductSlug } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { SeedButton } from '@/components/admin/SeedButton';
import { validateProductInput, validateImageFile } from '@/lib/validation';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [productToken, setProductToken] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [personalization, setPersonalization] = useState('');
  const [quoteRequired, setQuoteRequired] = useState(false);
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('10');
  const [imageUrl, setImageUrl] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [inputImageUrl, setInputImageUrl] = useState('');
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
    const token = Math.random().toString(36).substring(2, 7);
    setProductToken(token);
    setName('');
    setSlug(generateProductSlug('', token));
    setCategoryId(categories[0]?.id || '');
    setDescription('');
    setPersonalization('');
    setQuoteRequired(false);
    setPrice('');
    setStock('10');
    setImageUrl('');
    setImages([]);
    setInputImageUrl('');
    setIsFeatured(false);
    setIsActive(true);
    setErrorMsg(null);
    setModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setProductToken('');
    setName(p.name);
    setSlug(p.slug);
    setCategoryId(p.category_id || '');
    setDescription(p.description || '');
    setPersonalization(p.personalization || '');
    setQuoteRequired(Boolean(p.quote_required));
    setPrice(String(p.price));
    setStock(String(p.stock));
    setImageUrl(p.image_url || '');
    const productImages = Array.isArray(p.images) && p.images.length > 0
      ? p.images
      : (p.image_url ? [p.image_url] : []);
    setImages(productImages);
    setInputImageUrl('');
    setIsFeatured(p.is_featured);
    setIsActive(p.is_active);
    setErrorMsg(null);
    setModalOpen(true);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!editingProduct) {
      setSlug(generateProductSlug(val, productToken));
    }
  };

  // Upload su Supabase Storage bucket 'products-images' con supporto caricamento multiplo
  const handleMultipleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const files = Array.from(fileList);

    // 1. Validazione di ciascun file
    for (const file of files) {
      const fileValidation = validateImageFile(file);
      if (!fileValidation.valid) {
        setErrorMsg(fileValidation.error || 'Uno o più file non sono validi.');
        return;
      }
    }

    setUploadingFile(true);
    setErrorMsg(null);

    try {
      const supabase = createClient();
      const uploadedUrls: string[] = [];

      for (const file of files) {
        const fileExt = (file.name.split('.').pop() || 'jpg').toLowerCase();
        // Sanitizzazione nome file: solo timestamp numerico e token alfanumerico casuale
        const safeRandomToken = Math.random().toString(36).substring(2, 10);
        const fileName = `${Date.now()}-${safeRandomToken}.${fileExt}`;
        const filePath = `products/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('products-images')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) throw uploadError;

        // Recupera URL pubblico
        const { data: publicUrlData } = supabase.storage
          .from('products-images')
          .getPublicUrl(filePath);

        if (publicUrlData?.publicUrl) {
          uploadedUrls.push(publicUrlData.publicUrl);
        }
      }

      setImages((prev) => {
        const updated = [...prev, ...uploadedUrls];
        if (!imageUrl && updated.length > 0) {
          setImageUrl(updated[0]);
        }
        return updated;
      });

      if (!imageUrl && uploadedUrls.length > 0) {
        setImageUrl(uploadedUrls[0]);
      }
    } catch (err: any) {
      setErrorMsg(`Errore upload file su Supabase Storage: ${err.message}`);
    } finally {
      setUploadingFile(false);
      e.target.value = '';
    }
  };

  const handleAddImageUrl = () => {
    const trimmed = inputImageUrl.trim();
    if (!trimmed) return;
    if (!trimmed.startsWith('https://') && !trimmed.startsWith('/') && !trimmed.startsWith('http://localhost')) {
      setErrorMsg('L\'URL dell\'immagine deve iniziare con https:// o percorso relativo.');
      return;
    }
    if (images.includes(trimmed)) {
      setErrorMsg('Questa immagine è già presente nella galleria del prodotto.');
      return;
    }
    setErrorMsg(null);
    setImages((prev) => {
      const updated = [...prev, trimmed];
      if (!imageUrl) setImageUrl(trimmed);
      return updated;
    });
    if (!imageUrl) setImageUrl(trimmed);
    setInputImageUrl('');
  };

  const handleSetCoverImage = (url: string) => {
    setImageUrl(url);
  };

  const handleRemoveImage = (url: string) => {
    const filtered = images.filter((img) => img !== url);
    setImages(filtered);
    if (imageUrl === url) {
      setImageUrl(filtered[0] || '');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);

    // Lo slug del prodotto viene generato automaticamente in modo univoco
    const finalSlug = editingProduct
      ? (editingProduct.slug || slug || generateProductSlug(name))
      : (slug || generateProductSlug(name, productToken));

    // Determina la galleria finale e l'immagine principale di copertina
    const finalImages = images.length > 0 ? images : (imageUrl ? [imageUrl] : []);
    const finalCover = imageUrl || (finalImages[0] || null);

    // 2. Validazione rigorosa degli input tramite schema di validazione
    const validation = validateProductInput({
      name,
      slug: finalSlug,
      category_id: categoryId,
      description,
      price: quoteRequired && !price ? 0 : price,
      allowZeroPrice: quoteRequired,
      stock,
      image_url: finalCover,
      images: finalImages,
      is_featured: isFeatured,
      is_active: isActive,
    });

    if (!validation.success || !validation.data) {
      setErrorMsg(validation.error || 'Dati del prodotto non validi.');
      setSaving(false);
      return;
    }

    try {
      const supabase = createClient();
      const payload = {
        ...validation.data,
        personalization: personalization.trim() || null,
        quote_required: quoteRequired,
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
                          <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5">
                            <span>/{p.slug}</span>
                            {Array.isArray(p.images) && p.images.length > 1 && (
                              <span className="text-[9px] font-sans font-medium px-1.5 py-0.5 rounded-full bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300">
                                {p.images.length} foto
                              </span>
                            )}
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

          <div className="space-y-2.5">
            <Input
              label="Nome Prodotto"
              placeholder="es. Collana Solitaire in Oro 18k"
              required
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
            />

            <div className="rounded-xl border border-stone-200/80 bg-stone-50/70 p-3 text-xs dark:border-stone-800 dark:bg-stone-900/60">
              <div className="flex items-center justify-between text-stone-500 mb-1">
                <span className="font-semibold text-[11px] uppercase tracking-wider text-stone-600 dark:text-stone-400">
                  Slug URL Prodotto (Generato Automaticamente)
                </span>
                <span className="text-[10px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full font-medium">
                  {editingProduct ? 'slug esistente' : 'valore univoco random'}
                </span>
              </div>
              <p className="font-mono text-xs text-stone-800 dark:text-stone-200">
                /product/
                <span className="font-bold text-stone-950 dark:text-stone-50">
                  {editingProduct
                    ? editingProduct.slug
                    : (slug || generateProductSlug(name, productToken))}
                </span>
              </p>
            </div>
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
              required={!quoteRequired}
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

          <Input
            label="Opzioni di personalizzazione"
            placeholder="Es. iniziali ricamate, filo oro o argento"
            maxLength={500}
            value={personalization}
            onChange={(event) => setPersonalization(event.target.value)}
          />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={quoteRequired} onChange={(event) => setQuoteRequired(event.target.checked)} />
            Richiede un preventivo su WhatsApp
          </label>

          {/* Galleria Foto Prodotto (Foto Multiple) */}
          <div className="space-y-3 p-4 rounded-2xl border border-stone-200/90 bg-stone-50/60 dark:border-stone-800 dark:bg-stone-900/60">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div>
                <span className="block text-xs font-bold text-stone-800 dark:text-stone-200">
                  Galleria Fotografica ({images.length} {images.length === 1 ? 'foto' : 'foto'})
                </span>
                <p className="text-[11px] text-stone-500">
                  Carica una o più foto (puoi selezionare più file insieme). La foto contrassegnata dalla stella è la copertina.
                </p>
              </div>
              {images.length > 0 && (
                <span className="text-[10px] uppercase font-bold tracking-wider text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2.5 py-0.5 rounded-full border border-amber-200/60 self-start sm:self-auto">
                  Copertina selezionata
                </span>
              )}
            </div>

            {/* Azioni di caricamento: File multipli da disco o URL esterno */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <label className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-stone-900 text-white hover:bg-stone-800 shadow-sm text-xs font-semibold cursor-pointer dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-white transition-all flex-shrink-0">
                <Upload className="h-4 w-4" />
                {uploadingFile ? 'Caricamento Storage...' : 'Carica Foto dal Dispositivo'}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleMultipleFileUpload}
                  className="hidden"
                  disabled={uploadingFile}
                />
              </label>

              <div className="flex-1 flex items-center gap-1.5">
                <input
                  type="text"
                  placeholder="oppure incolla URL https://..."
                  value={inputImageUrl}
                  onChange={(e) => setInputImageUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddImageUrl();
                    }
                  }}
                  className="flex-1 rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs text-stone-900 placeholder:text-stone-400 dark:border-stone-700 dark:bg-slate-800 dark:text-slate-100"
                />
                <button
                  type="button"
                  onClick={handleAddImageUrl}
                  className="px-3.5 py-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-100 text-xs font-bold text-stone-700 dark:bg-stone-800 dark:border-stone-700 dark:text-stone-200 transition-colors flex-shrink-0"
                >
                  Aggiungi
                </button>
              </div>
            </div>

            {/* Griglia Miniature delle Foto */}
            {images.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                {images.map((imgUrl, idx) => {
                  const isCover = imgUrl === imageUrl;
                  return (
                    <div
                      key={`${imgUrl}-${idx}`}
                      className={`relative aspect-[4/5] rounded-xl overflow-hidden border group bg-stone-100 shadow-2xs transition-all ${
                        isCover
                          ? 'border-[#B8915D] ring-2 ring-[#B8915D]/40'
                          : 'border-stone-200 dark:border-stone-800 hover:border-stone-400'
                      }`}
                    >
                      <Image
                        src={imgUrl}
                        alt={`Foto ${idx + 1}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 50vw, 25vw"
                      />

                      {/* Badge Copertina */}
                      {isCover && (
                        <div className="absolute top-1.5 left-1.5 flex items-center gap-1 px-2 py-0.5 rounded-full bg-stone-900/90 text-white text-[9px] font-bold tracking-wider uppercase backdrop-blur-xs shadow-sm z-10">
                          <Star className="h-2.5 w-2.5 fill-[#B8915D] text-[#B8915D]" />
                          <span>Copertina</span>
                        </div>
                      )}

                      {/* Azioni Hover */}
                      <div className="absolute inset-0 bg-stone-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2 z-20">
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(imgUrl)}
                            className="p-1.5 rounded-full bg-white/90 text-rose-600 hover:bg-rose-50 hover:text-rose-700 shadow-sm transition-colors"
                            title="Rimuovi questa foto"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        {!isCover && (
                          <button
                            type="button"
                            onClick={() => handleSetCoverImage(imgUrl)}
                            className="w-full py-1.5 px-2 rounded-lg bg-white/95 text-stone-900 text-[10px] font-bold tracking-wider uppercase hover:bg-white shadow-sm transition-all text-center"
                          >
                            Imposta Copertina
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center py-4 text-xs text-stone-400 border border-dashed border-stone-200 rounded-xl dark:border-stone-800">
                Nessuna foto ancora aggiunta. Carica uno o più file dal tuo computer o incolla un link.
              </p>
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

