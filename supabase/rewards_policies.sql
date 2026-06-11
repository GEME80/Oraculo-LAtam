-- =====================================================================
-- MIGRACIÓN DE POLÍTICAS DE BASE DE DATOS Y STORAGE (Oráculo-LATAM)
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- =====================================================================

-- ─────────────────────────────────────────────────────────────────────
-- PARTE 1: POLÍTICAS RLS EN TABLA REWARDS
-- ─────────────────────────────────────────────────────────────────────

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

-- ─────────────────────────────────────────────────────────────────────
-- PARTE 2: CREACIÓN DE BUCKET Y POLÍTICAS DE STORAGE
-- ─────────────────────────────────────────────────────────────────────

-- 1. Asegurar la creación del bucket público "rewards" en Supabase Storage
INSERT INTO storage.buckets (id, name, public) 
VALUES ('rewards', 'rewards', true) 
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Permitir lectura pública de archivos del bucket "rewards"
DROP POLICY IF EXISTS "Permitir lectura pública de portadas" ON storage.objects;
CREATE POLICY "Permitir lectura pública de portadas" ON storage.objects
  FOR SELECT USING (bucket_id = 'rewards');

-- 3. Permitir subida de archivos únicamente a administradores
DROP POLICY IF EXISTS "Permitir subida a administradores" ON storage.objects;
CREATE POLICY "Permitir subida a administradores" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'rewards' AND 
    (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  );

-- 4. Permitir eliminación de archivos únicamente a administradores
DROP POLICY IF EXISTS "Permitir eliminación a administradores" ON storage.objects;
CREATE POLICY "Permitir eliminación a administradores" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'rewards' AND 
    (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  );

-- ─────────────────────────────────────────────────────────────────────
-- PARTE 3: RECARGAR SCHEMA
-- ─────────────────────────────────────────────────────────────────────
NOTIFY pgrst, 'reload schema';
