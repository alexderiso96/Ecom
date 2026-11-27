import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { after, before, test } from 'node:test';
import { PGlite } from '@electric-sql/pglite';

const db = new PGlite();
const customer = { name: 'Cliente test', email: 'cliente@example.test' };
const product = randomUUID();
const quantity = 2;

before(async () => {
  // Minimal Supabase platform schemas with the repository's actual tables and policies.
  await db.exec(`
    CREATE ROLE anon;
    CREATE ROLE authenticated;
    CREATE ROLE service_role BYPASSRLS;
    CREATE SCHEMA auth;
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS
    $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    CREATE TABLE auth.users (id uuid PRIMARY KEY, email text, raw_user_meta_data jsonb);
    CREATE SCHEMA storage;
    CREATE TABLE storage.buckets (id text PRIMARY KEY, name text, public boolean);
    CREATE TABLE storage.objects (id uuid PRIMARY KEY, name text, bucket_id text);
    CREATE FUNCTION storage.extension(text) RETURNS text LANGUAGE sql AS
    $$ SELECT split_part($1, '.', 2) $$;
    GRANT USAGE ON SCHEMA public, auth TO anon, authenticated, service_role;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;
  `);
  for (const file of [
    'schema.sql', 'orders_migration.sql', 'add_multiple_images.sql',
    'security_hardening.sql', 'dream_creation_checkout.sql', 'checkout_service_permissions.sql',
  ]) {
    const sql = await readFile(new URL(`../supabase/${file}`, import.meta.url), 'utf8');
    await db.exec(sql.replace(/^CREATE EXTENSION .*;$/gm, ''));
  }
  await db.query(
    "INSERT INTO public.products (id, name, slug, price, stock) VALUES ($1, 'Pochette', 'test-pochette', 19.95, 2)",
    [product],
  );
});

after(() => db.close());

async function asRole(role, action) {
  await db.exec(`SET ROLE ${role}`);
  try {
    return await action();
  } finally {
    await db.exec('RESET ROLE');
  }
}

async function checkout(key, items, details = customer) {
  const { rows: [row] } = await db.query(
    'SELECT public.create_checkout($1, NULL, $2, $3) AS receipt',
    [key, JSON.stringify(details), JSON.stringify(items)],
  );
  return row.receipt;
}

test('guest checkout uses catalog prices and a repeated request returns the same receipt', async () => {
  const key = randomUUID();
  const items = [{ product_id: product, quantity, price: 0.01 }];
  const receipt = await asRole('service_role', () => checkout(key, items));
  const repeat = await asRole('service_role', () => checkout(key, items));
  assert.deepEqual(repeat, receipt);
  assert.equal(receipt.totalPrice, 39.9);
  assert.deepEqual(receipt.items, [{ name: 'Pochette', price: 19.95, quantity: 2 }]);
  const { rows: [saved] } = await db.query(
    'SELECT count(*)::integer AS count FROM public.orders WHERE checkout_key = $1',
    [key],
  );
  assert.equal(saved.count, 1);
  await assert.rejects(asRole('service_role', () => checkout(key, items, { ...customer, name: 'Altro' })), { code: 'P0002' });
});

test('unavailable items leave no partial order', async () => {
  const key = randomUUID();
  const items = [{ product_id: product, quantity: 1 }, { product_id: product, quantity: 2 }];
  await assert.rejects(asRole('service_role', () => checkout(key, items)), { code: 'P0001' });
  const { rows: [saved] } = await db.query(
    'SELECT count(*)::integer AS count FROM public.orders WHERE checkout_key = $1',
    [key],
  );
  assert.equal(saved.count, 0);
});

test('public roles cannot execute checkout or insert order records', async () => {
  for (const role of ['anon', 'authenticated']) {
    await assert.rejects(asRole(role, () => checkout(randomUUID(), [{ product_id: product, quantity }])), { code: '42501' });
    assert.deepEqual((await db.query(
      "SELECT has_table_privilege($1, 'public.orders', 'INSERT') AS orders, has_table_privilege($1, 'public.order_items', 'INSERT') AS items",
      [role],
    )).rows, [{ orders: false, items: false }]);
  }
});

test('database owner can bootstrap the first SuperAdmin', async () => {
  const id = randomUUID();
  const email = 'bootstrap@example.test';
  await db.query('INSERT INTO auth.users (id, email) VALUES ($1, $2)', [id, email]);
  const { rows: [profile] } = await db.query(
    "UPDATE public.profiles SET role = 'superadmin' WHERE id = $1 RETURNING role",
    [id],
  );
  assert.equal(profile.role, 'superadmin');
});

test('a failure inserting items rolls back the order header', async () => {
  const key = randomUUID();
  await db.exec("ALTER TABLE public.order_items ADD CONSTRAINT test_insert_failure CHECK (quantity < 2) NOT VALID");
  try {
    await assert.rejects(asRole('service_role', () => checkout(key, [{ product_id: product, quantity }])), { code: '23514' });
    const { rows: [saved] } = await db.query(
      'SELECT count(*)::integer AS count FROM public.orders WHERE checkout_key = $1',
      [key],
    );
    assert.equal(saved.count, 0);
  } finally {
    await db.exec('ALTER TABLE public.order_items DROP CONSTRAINT test_insert_failure');
  }
});

test('quote-only products stay out of the fixed-price checkout', async () => {
  const quoteProduct = randomUUID();
  await db.query(
    "INSERT INTO public.products (id, name, slug, price, stock, quote_required) VALUES ($1, 'Su misura', 'test-quote', 0, 5, true)",
    [quoteProduct],
  );
  await assert.rejects(
    asRole('service_role', () => checkout(randomUUID(), [{ product_id: quoteProduct, quantity: 1 }])),
    { code: 'P0001' },
  );
});
