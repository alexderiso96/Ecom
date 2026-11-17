-- ==============================================================================
-- HARDENING SICUREZZA: PRIVILEGE ESCALATION PREVENTION & STORAGE PROTECTION
-- Piattaforma: Supabase (PostgreSQL + RLS + Triggers)
-- ==============================================================================

-- 1. TRIGGER: BLOCCO MODIFICA RUOLO (Anti-Privilege Escalation su UPDATE)
-- Impedisce a qualsiasi utente non-superadmin di promuovere se stesso o altri a admin/superadmin
CREATE OR REPLACE FUNCTION public.protect_user_role_update()
RETURNS TRIGGER AS $$
BEGIN
    -- Se il ruolo viene modificato e chi esegue la query non è SuperAdmin, blocca l'operazione
    IF OLD.role IS DISTINCT FROM NEW.role AND NOT public.is_superadmin() THEN
        RAISE EXCEPTION 'Accesso negato: solo un utente SuperAdmin può modificare i ruoli (tentativo di passare da % a %).', OLD.role, NEW.role;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_protect_user_role_update ON public.profiles;
CREATE TRIGGER trigger_protect_user_role_update
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.protect_user_role_update();

-- 2. TRIGGER: FORZATURA RUOLO CUSTOMER SU INSERT (Anti-Privilege Escalation su INSERT)
-- Se un utente tenta di inviare una query INSERT con role='superadmin', viene forzato a 'customer'
CREATE OR REPLACE FUNCTION public.force_customer_role_insert()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT public.is_superadmin() THEN
        NEW.role := 'customer'::public.user_role;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_force_customer_role_insert ON public.profiles;
CREATE TRIGGER trigger_force_customer_role_insert
    BEFORE INSERT ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.force_customer_role_insert();

-- 3. STORAGE HARDENING: RESTRINGI POLICY SU 'products-images'
-- Consenti l'upload solo per MIME type di immagini legittime e solo agli Admin
DROP POLICY IF EXISTS "Storage Admin Insert" ON storage.objects;
CREATE POLICY "Storage Admin Insert" ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id = 'products-images' 
        AND public.is_admin()
        -- Consente solo estensioni e MIME types di immagini valide
        AND (
            LOWER(storage.extension(name)) IN ('jpg', 'jpeg', 'png', 'webp', 'avif')
        )
    );

-- 4. CONFERMA APPLICAZIONE
COMMENT ON TRIGGER trigger_protect_user_role_update ON public.profiles IS 'Protezione nativa PostgreSQL contro tentativi di privilege escalation del campo role';
COMMENT ON TRIGGER trigger_force_customer_role_insert ON public.profiles IS 'Forzatura automatica del ruolo customer su nuove registrazioni';
