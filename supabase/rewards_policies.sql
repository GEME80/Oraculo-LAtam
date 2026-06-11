-- =====================================================================
-- CORRECCIÓN DE POLÍTICAS RLS: TABLA REWARDS
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- =====================================================================

-- 1. Política de Inserción para Administradores
DROP POLICY IF EXISTS "Allow admin insert rewards" ON public.rewards;
CREATE POLICY "Allow admin insert rewards" ON public.rewards FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 2. Política de Eliminación para Administradores
DROP POLICY IF EXISTS "Allow admin delete rewards" ON public.rewards;
CREATE POLICY "Allow admin delete rewards" ON public.rewards FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 3. Forzar recarga del schema cache de PostgREST
NOTIFY pgrst, 'reload schema';
