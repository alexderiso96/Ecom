BEGIN;

GRANT USAGE ON SCHEMA public TO service_role;
GRANT SELECT ON public.products TO service_role;
-- SELECT FOR SHARE requires UPDATE on at least one column.
GRANT UPDATE (id) ON public.products TO service_role;
GRANT SELECT, INSERT ON public.orders, public.order_items TO service_role;

NOTIFY pgrst, 'reload schema';

COMMIT;
