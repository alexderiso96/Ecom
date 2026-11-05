import React, { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { Product, Category } from '@/types/database.types';
import { CatalogClient } from '@/components/catalog/CatalogClient';

export const revalidate = 60;

export default async function CatalogPage() {
  let products: Product[] = [];
  let categories: Category[] = [];

  try {
    const supabase = createClient();

    const [catResponse, prodResponse] = await Promise.all([
      supabase.from('categories').select('*').order('name'),
      supabase
        .from('products')
        .select('*, category:categories(*)')
        .eq('is_active', true)
        .order('created_at', { ascending: false }),
    ]);

    if (catResponse.data) categories = catResponse.data;
    if (prodResponse.data) products = prodResponse.data;
  } catch (error) {
    console.error('Errore catalog fetch:', error);
  }

  return (
    <Suspense fallback={<div className="container py-12 text-center text-sm text-slate-500">Caricamento catalogo...</div>}>
      <CatalogClient initialProducts={products} categories={categories} />
    </Suspense>
  );
}

