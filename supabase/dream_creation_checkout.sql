BEGIN;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS checkout_key uuid UNIQUE,
  ADD COLUMN IF NOT EXISTS checkout_fingerprint text;

DROP POLICY IF EXISTS "orders_insert_policy" ON public.orders;
DROP POLICY IF EXISTS "order_items_insert_policy" ON public.order_items;
REVOKE INSERT ON public.orders, public.order_items FROM PUBLIC, anon, authenticated;

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS personalization text,
  ADD COLUMN IF NOT EXISTS quote_required boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.create_checkout(
  p_key uuid, p_user uuid, p_customer jsonb, p_items jsonb
) RETURNS jsonb
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_order public.orders;
  v_fingerprint text := encode(sha256(convert_to(jsonb_build_array(p_user, p_customer, p_items)::text, 'UTF8')), 'hex');
  v_requested record;
  v_product public.products;
  v_lines jsonb := '[]'::jsonb;
  v_total numeric := 0;
BEGIN
  -- Serialize repeat submissions, including concurrent requests on different servers.
  PERFORM pg_advisory_xact_lock(hashtextextended(p_key::text, 0));
  SELECT * INTO v_order FROM public.orders WHERE checkout_key = p_key;

  IF FOUND THEN
    IF v_order.checkout_fingerprint IS DISTINCT FROM v_fingerprint THEN
      RAISE EXCEPTION 'Checkout key already used' USING ERRCODE = 'P0002';
    END IF;
  ELSE
    FOR v_requested IN
      SELECT x.product_id, sum(x.quantity) AS quantity
      FROM jsonb_to_recordset(p_items) AS x(product_id uuid, quantity integer)
      GROUP BY x.product_id ORDER BY x.product_id
    LOOP
      SELECT * INTO v_product FROM public.products
      WHERE id = v_requested.product_id AND is_active AND NOT quote_required FOR SHARE;
      IF NOT FOUND OR v_requested.quantity < 1 OR v_requested.quantity > v_product.stock THEN
        RAISE EXCEPTION 'Product unavailable' USING ERRCODE = 'P0001';
      END IF;
      v_total := v_total + v_product.price * v_requested.quantity;
      v_lines := v_lines || jsonb_build_object(
        'product_id', v_product.id, 'product_name', v_product.name,
        'product_image', v_product.image_url, 'price', v_product.price,
        'quantity', v_requested.quantity
      );
    END LOOP;

    IF jsonb_array_length(v_lines) = 0 OR v_total >= 100000000 THEN
      RAISE EXCEPTION 'Invalid order amount' USING ERRCODE = 'P0001';
    END IF;

    INSERT INTO public.orders (
      order_number, user_id, customer_name, customer_email, customer_phone,
      shipping_address, notes, total_amount, status, checkout_key, checkout_fingerprint
    ) VALUES (
      'DC-' || upper(replace(gen_random_uuid()::text, '-', '')), p_user,
      p_customer->>'name', p_customer->>'email', p_customer->>'phone',
      p_customer->>'address', p_customer->>'notes', v_total, 'whatsapp_pending', p_key, v_fingerprint
    ) RETURNING * INTO v_order;

    INSERT INTO public.order_items (order_id, product_id, product_name, product_image, price, quantity)
    SELECT v_order.id, x.product_id, x.product_name, x.product_image, x.price, x.quantity
    FROM jsonb_to_recordset(v_lines) AS x(
      product_id uuid, product_name text, product_image text, price numeric, quantity integer
    );
  END IF;

  RETURN jsonb_build_object(
    'orderNumber', v_order.order_number, 'totalPrice', v_order.total_amount,
    'createdAt', v_order.created_at,
    'items', (SELECT jsonb_agg(jsonb_build_object('name', product_name, 'price', price, 'quantity', quantity) ORDER BY product_name, id)
              FROM public.order_items WHERE order_id = v_order.id)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.create_checkout(uuid, uuid, jsonb, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_checkout(uuid, uuid, jsonb, jsonb) TO service_role;

-- Applies after schema.sql and security_hardening.sql. SQL Editor runs as postgres.
CREATE OR REPLACE FUNCTION public.protect_user_role_update()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  IF OLD.role IS DISTINCT FROM NEW.role
     AND NOT public.is_superadmin()
     AND NOT (auth.uid() IS NULL AND session_user = 'postgres') THEN
    RAISE EXCEPTION 'Solo un SuperAdmin può modificare i ruoli.';
  END IF;
  RETURN NEW;
END;
$$;

INSERT INTO public.categories (name, slug, description) VALUES
  ('Ombrelli', 'ombrelli', 'Ombrelli da personalizzare con iniziali ricamate.'),
  ('Tazze', 'tazze', 'Tazze da personalizzare.'),
  ('Pochette', 'pochette', 'Pochette e idee regalo personalizzate.'),
  ('Bijoux', 'gioielli', 'Orecchini, collane e bracciali.')
ON CONFLICT (slug) DO NOTHING;

COMMIT;
