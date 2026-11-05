'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Plus,
  Pencil,
  Trash2,
  ShoppingBag,
  Upload,
  AlertCircle,
  Check,
  Star,
  DownloadCloud,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
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

  // CJdropshipping Import Modal states
  const [cjModalOpen, setCjModalOpen] = useState(false);
  const [cjImportTab, setCjImportTab] = useState<'single' | 'bulk'>('bulk');
  const [cjProductIdOrUrl, setCjProductIdOrUrl] = useState('');
  const [cjBulkKeyword, setCjBulkKeyword] = useState('');
  const [cjBulkLimit, setCjBulkLimit] = useState('20');
  const [cjSelectedCategory, setCjSelectedCategory] = useState('');
  const [cjMarkupPercentage, setCjMarkupPercentage] = useState('40');
  const [cjImporting, setCjImporting] = useState(false);
  const [cjMessage, setCjMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const supabase = createClient();
    const [prodRes, catRes] = await Promise.all([
      supabase.from('products').select('*, category:categories(*)').order('created_at', { ascending: false }),
      supabase.from('categories').select('*').order('name'),
    ]);

    if (prodRes.data) setProducts(prodRes.data);
    if (catRes.data) {
      const catList = catRes.data as Category[];
      setCategories(catList);
      if (!categoryId && catList.length > 0) {
        setCategoryId(catList[0].id);
        setCjSelectedCategory(catList[0].id);
      }
    }
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
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
      const filePath = `products/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('products-images')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('products-images')
        .getPublicUrl(filePath);

      setImageUrl(publicUrl);
    } catch (err: any) {
      setErrorMsg(`Errore upload immagine: ${err.message || 'Riprova'}`);
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Il nome del prodotto è obbligatorio.');
      return;
    }
    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice < 0) {
      setErrorMsg('Inserisci un prezzo valido (es. 29.99).');
      return;
    }
    const numStock = parseInt(stock, 10);
    if (isNaN(numStock) || numStock < 0) {
      setErrorMsg('Inserisci uno stock valido.');
      return;
    }

    setSaving(true);
    setErrorMsg(null);
    const supabase = createClient();

    try {
      const payload = {
        name: name.trim(),
        slug: slug.trim() || slugify(name),
        category_id: categoryId || null,
        description: description.trim() || null,
        price: numPrice,
        stock: numStock,
        image_url: imageUrl.trim() || null,
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
        const { error } = await supabase
          .from('products')
          .insert(payload);

        if (error) throw error;
      }

      setModalOpen(false);
      await fetchData();
    } catch (err: any) {
      setErrorMsg(`Salvataggio fallito: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, prodName: string) => {
    if (!confirm(`Sei sicuro di voler eliminare definitivamente "${prodName}"?`)) return;

    const supabase = createClient();
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) {
      alert(`Errore eliminazione: ${error.message}`);
    } else {
      await fetchData();
    }
  };

  const toggleProductActive = async (id: string, current: boolean) => {
    const supabase = createClient();
    await supabase.from('products').update({ is_active: !current }).eq('id', id);
    await fetchData();
  };

  // Importazione da CJdropshipping
  const handleCjImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cjProductIdOrUrl.trim()) {
      setCjMessage({ type: 'error', text: 'Inserisci il PID o il link del prodotto CJ.' });
      return;
    }

    setCjImporting(true);
    setCjMessage(null);

    try {
      const res = await fetch('/api/cj/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cjProductIdOrUrl: cjProductIdOrUrl.trim(),
          categoryId: cjSelectedCategory || undefined,
          markupPercentage: parseFloat(cjMarkupPercentage) || 40,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Errore durante l\'importazione.');
      }

      setCjMessage({ type: 'success', text: data.message });
      setCjProductIdOrUrl('');
      await fetchData();
    } catch (err: any) {
      setCjMessage({ type: 'error', text: err?.message || 'Errore imprevisto' });
    } finally {
      setCjImporting(false);
    }
  };

  // Importazione Massiva di una Categoria / Ricerca da CJdropshipping
  const handleCjBulkImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cjBulkKeyword.trim()) {
      setCjMessage({ type: 'error', text: 'Inserisci una parola chiave o nicchia (es. Orologi, Gioielli, Borse).' });
      return;
    }

    setCjImporting(true);
    setCjMessage(null);

    try {
      const res = await fetch('/api/cj/import/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: cjBulkKeyword.trim(),
          localCategoryId: cjSelectedCategory || undefined,
          limit: parseInt(cjBulkLimit, 10) || 20,
          markupPercentage: parseFloat(cjMarkupPercentage) || 40,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Errore durante l\'importazione di massa.');
      }

      setCjMessage({
        type: 'success',
        text: `Successo! ${data.result.importedCount} prodotti della categoria "${cjBulkKeyword}" importati con tutte le varianti!`,
      });
      await fetchData();
    } catch (err: any) {
      setCjMessage({ type: 'error', text: err?.message || 'Errore imprevisto importazione massiva' });
    } finally {
      setCjImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Gestione Prodotti
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Gestisci articoli, prezzi, importazione CJdropshipping e giacenze di magazzino.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              setCjMessage(null);
              setCjModalOpen(true);
            }}
            className="flex items-center gap-2 rounded-full px-4 h-10 text-xs font-bold border border-indigo-200 text-indigo-700 bg-indigo-50/80 hover:bg-indigo-100 transition-all dark:border-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300 shadow-xs"
          >
            <DownloadCloud className="h-4 w-4 stroke-[2]" />
            <span>Importa da CJdropshipping</span>
          </button>

          <Button onClick={openAddModal} variant="primary" size="sm" className="rounded-full px-5 h-10 font-bold shadow-sm">
            <Plus className="h-4 w-4 mr-1.5" />
            Nuovo Prodotto
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-3xl border border-slate-200/70 bg-white/80 shadow-xs backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200/70 dark:bg-slate-800/50 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4">Prodotto</th>
                <th className="px-6 py-4">Fornitore / CJ</th>
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
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    Caricamento catalogo in corso...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Nessun articolo presente nel database.
                    </p>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
                      Puoi importare un articolo da CJdropshipping, aggiungerne uno manualmente o caricare il seed dimostrativo.
                    </p>
                    <div className="flex justify-center gap-3">
                      <button
                        onClick={() => setCjModalOpen(true)}
                        className="rounded-full px-4 py-2 text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-500 shadow-sm"
                      >
                        Importa da CJ
                      </button>
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
                            <div className="h-full w-full flex items-center justify-center text-slate-300">
                              <ShoppingBag className="h-5 w-5 stroke-[1.2]" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 dark:text-white line-clamp-1">
                              {p.name}
                            </span>
                            {p.is_featured && (
                              <Star className="h-3 w-3 fill-amber-400 text-amber-400 flex-shrink-0" />
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400 font-mono">
                            /{p.slug}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-3.5">
                      {p.cj_product_id ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800">
                          CJ: {p.cj_product_id.slice(0, 10)}...
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Catalogo Diretto</span>
                      )}
                    </td>

                    <td className="px-6 py-3.5 text-slate-600 dark:text-slate-300">
                      {p.category?.name || <span className="text-slate-400 italic">Nessuna</span>}
                    </td>

                    <td className="px-6 py-3.5">
                      <div className="font-black text-slate-900 dark:text-white">
                        {formatCurrency(p.price)}
                      </div>
                      {p.cost_price && (
                        <div className="text-[10px] text-slate-400">
                          Costo: {formatCurrency(p.cost_price)}
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-3.5">
                      {p.stock > 5 ? (
                        <Badge variant="success">{p.stock} pz</Badge>
                      ) : p.stock > 0 ? (
                        <Badge variant="secondary">Ultime {p.stock} pz</Badge>
                      ) : (
                        <Badge variant="destructive">Esaurito</Badge>
                      )}
                    </td>

                    <td className="px-6 py-3.5">
                      <button
                        onClick={() => toggleProductActive(p.id, p.is_active)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-colors ${
                          p.is_active
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${p.is_active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        {p.is_active ? 'Online' : 'Nascosto'}
                      </button>
                    </td>

                    <td className="px-6 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditModal(p)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors"
                          title="Modifica"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id, p.name)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
                          title="Elimina"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Importazione CJdropshipping */}
      <Modal
        isOpen={cjModalOpen}
        onClose={() => setCjModalOpen(false)}
        title="Importa da CJdropshipping"
      >
        <div className="space-y-4">
          {/* Tabs: Massivo vs Singolo */}
          <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => {
                setCjImportTab('bulk');
                setCjMessage(null);
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                cjImportTab === 'bulk'
                  ? 'bg-white text-indigo-700 shadow-xs dark:bg-slate-900 dark:text-indigo-300'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              Importa Categoria in Blocco (Massivo)
            </button>
            <button
              type="button"
              onClick={() => {
                setCjImportTab('single');
                setCjMessage(null);
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                cjImportTab === 'single'
                  ? 'bg-white text-indigo-700 shadow-xs dark:bg-slate-900 dark:text-indigo-300'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              Singolo Prodotto (PID / Link)
            </button>
          </div>

          {cjMessage && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                cjMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                  : 'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
              }`}
            >
              {cjMessage.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
              )}
              <span>{cjMessage.text}</span>
            </div>
          )}

          {cjImportTab === 'bulk' ? (
            /* Form Importazione Categoria Massiva */
            <form onSubmit={handleCjBulkImport} className="space-y-3.5">
              <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-100 text-indigo-900 dark:bg-indigo-950/40 dark:border-indigo-800 dark:text-indigo-200 text-xs leading-relaxed">
                Importa automaticamente decine di prodotti contemporaneamente cercando per parola chiave o nicchia. Il sistema scaricherà foto, titoli, varianti e applicherà il tuo ricarico.
              </div>

              <Input
                label="Cerca Categoria o Parola Chiave *"
                placeholder="es. watches, rings, luxury jewelry, handbags, sunglasses..."
                value={cjBulkKeyword}
                onChange={(e) => setCjBulkKeyword(e.target.value)}
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Quantità da Caricare
                  </label>
                  <select
                    value={cjBulkLimit}
                    onChange={(e) => setCjBulkLimit(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 font-bold"
                  >
                    <option value="10">10 Prodotti</option>
                    <option value="20">20 Prodotti</option>
                    <option value="30">30 Prodotti</option>
                    <option value="50">50 Prodotti</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Categoria Store
                  </label>
                  <select
                    value={cjSelectedCategory}
                    onChange={(e) => setCjSelectedCategory(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <Input
                  label="Ricarico % *"
                  type="number"
                  placeholder="40"
                  value={cjMarkupPercentage}
                  onChange={(e) => setCjMarkupPercentage(e.target.value)}
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCjModalOpen(false)}
                >
                  Annulla
                </Button>
                <Button type="submit" isLoading={cjImporting} size="sm">
                  <DownloadCloud className="h-4 w-4 mr-1.5" />
                  Importa {cjBulkLimit} Prodotti in Blocco
                </Button>
              </div>
            </form>
          ) : (
            /* Form Importazione Singola */
            <form onSubmit={handleCjImport} className="space-y-3.5">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 text-xs leading-relaxed">
                Inserisci il PID (Product ID) o l'URL specifico della scheda prodotto di CJdropshipping per importare un singolo articolo con tutte le sue varianti.
              </div>

              <Input
                label="PID o Link Prodotto CJ *"
                placeholder="es. 184518294819 o https://cjdropshipping.com/product-detail/..."
                value={cjProductIdOrUrl}
                onChange={(e) => setCjProductIdOrUrl(e.target.value)}
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Categoria Destinazione
                  </label>
                  <select
                    value={cjSelectedCategory}
                    onChange={(e) => setCjSelectedCategory(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <Input
                  label="Margine Ricarico % *"
                  type="number"
                  placeholder="40"
                  value={cjMarkupPercentage}
                  onChange={(e) => setCjMarkupPercentage(e.target.value)}
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCjModalOpen(false)}
                >
                  Annulla
                </Button>
                <Button type="submit" isLoading={cjImporting} size="sm">
                  <DownloadCloud className="h-4 w-4 mr-1.5" />
                  Importa Singolo Prodotto
                </Button>
              </div>
            </form>
          )}
        </div>
      </Modal>

      {/* Modal: Aggiungi / Modifica Prodotto Manuale */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingProduct ? 'Modifica Prodotto' : 'Nuovo Prodotto a Catalogo'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <Input
            label="Nome Prodotto *"
            placeholder="es. Anello Aura Diamond"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Slug Univoco *"
              placeholder="anello-aura-diamond"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
            />

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Categoria
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Prezzo (€) *"
              type="number"
              step="0.01"
              placeholder="99.00"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />

            <Input
              label="Giacenza Stock *"
              type="number"
              placeholder="10"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Descrizione
            </label>
            <textarea
              rows={3}
              placeholder="Dettagli, materiali pregiati, dimensioni e cura del prodotto..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          {/* Immagine */}
          <div className="p-3.5 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 dark:border-slate-700 dark:bg-slate-800/30">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Immagine Prodotto
            </label>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <label className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 cursor-pointer shadow-xs dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200">
                <Upload className="h-3.5 w-3.5" />
                <span>{uploadingFile ? 'Caricamento...' : 'Carica da File'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={uploadingFile}
                  className="hidden"
                />
              </label>

              <input
                type="text"
                placeholder="oppure incolla URL pubblico https://..."
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
