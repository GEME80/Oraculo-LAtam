-- Active: schema.sql for Oráculo-LATAM (v2.1 - Clean Re-runnable Schema)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Delete obsolete/test user from auth.users (cascade deletes profile)
DELETE FROM auth.users WHERE email = 'gerkof@gmail.com';

-- PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT NOT NULL UNIQUE,
    email TEXT,
    avatar_url TEXT,
    country TEXT NOT NULL,
    orc_balance NUMERIC(12, 2) DEFAULT 1000.00 CHECK (orc_balance >= 0),
    reputation_points INTEGER DEFAULT 0 CHECK (reputation_points >= 0),
    accuracy_rate NUMERIC(5, 2) DEFAULT 0.00 CHECK (accuracy_rate >= 0 AND accuracy_rate <= 100),
    predictions_count INTEGER DEFAULT 0,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- MARKETS TABLE
CREATE TABLE IF NOT EXISTS public.markets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL CHECK (category IN ('Política', 'Economía', 'Tecnología', 'Deportes', 'Cultura')),
    country TEXT NOT NULL,
    start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_date TIMESTAMPTZ NOT NULL,
    yes_price NUMERIC(5, 2) DEFAULT 50.00 CHECK (yes_price >= 1.00 AND yes_price <= 99.00),
    no_price NUMERIC(5, 2) DEFAULT 50.00 CHECK (no_price >= 1.00 AND no_price <= 99.00),
    yes_liquidity NUMERIC(12, 2) DEFAULT 500.00,
    no_liquidity NUMERIC(12, 2) DEFAULT 500.00,
    volume NUMERIC(12, 2) DEFAULT 0.00,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'resolved_yes', 'resolved_no', 'cancelled')),
    resolution_source TEXT NOT NULL,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    market_id UUID NOT NULL REFERENCES public.markets(id) ON DELETE CASCADE,
    outcome TEXT NOT NULL CHECK (outcome IN ('YES', 'NO')),
    type TEXT NOT NULL CHECK (type IN ('buy', 'sell')),
    shares_count NUMERIC(12, 2) NOT NULL,
    points_paid NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- USER POSITIONS TABLE
CREATE TABLE IF NOT EXISTS public.user_positions (
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    market_id UUID NOT NULL REFERENCES public.markets(id) ON DELETE CASCADE,
    yes_shares NUMERIC(12, 2) DEFAULT 0.00,
    no_shares NUMERIC(12, 2) DEFAULT 0.00,
    avg_price_yes NUMERIC(5, 2) DEFAULT 0.00,
    avg_price_no NUMERIC(5, 2) DEFAULT 0.00,
    PRIMARY KEY (profile_id, market_id)
);

-- REWARDS TABLE
CREATE TABLE IF NOT EXISTS public.rewards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    cost NUMERIC(12, 2) NOT NULL,
    image_url TEXT,
    provider TEXT NOT NULL,
    stock INTEGER DEFAULT 100
);

-- REDEMPTIONS TABLE
CREATE TABLE IF NOT EXISTS public.redemptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reward_id UUID NOT NULL REFERENCES public.rewards(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI COSTS TABLE
CREATE TABLE IF NOT EXISTS public.ai_costs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_name TEXT NOT NULL CHECK (agent_name IN ('Buscador de Noticias', 'Redactor de Preguntas', 'Auditor de Cierres')),
    tokens_input INTEGER DEFAULT 0,
    tokens_output INTEGER DEFAULT 0,
    runs INTEGER DEFAULT 0,
    cost_usd NUMERIC(10, 5) DEFAULT 0.00000,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- MARKET PRICE HISTORY TABLE
CREATE TABLE IF NOT EXISTS public.market_price_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    market_id UUID NOT NULL REFERENCES public.markets(id) ON DELETE CASCADE,
    yes_price NUMERIC(5, 2) NOT NULL,
    no_price NUMERIC(5, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SPONSORS TABLE
CREATE TABLE IF NOT EXISTS public.sponsors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    reward_amount NUMERIC(12, 2) NOT NULL DEFAULT 500.00 CHECK (reward_amount >= 0),
    action_type TEXT NOT NULL,
    action_label TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SPONSOR CLAIMS TABLE
CREATE TABLE IF NOT EXISTS public.sponsor_claims (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    sponsor_id UUID NOT NULL REFERENCES public.sponsors(id) ON DELETE CASCADE,
    reward_amount NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RESOLVED PAYOUTS TABLE
CREATE TABLE IF NOT EXISTS public.resolved_payouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    market_id UUID NOT NULL REFERENCES public.markets(id) ON DELETE CASCADE,
    payout_amount NUMERIC(12, 2) NOT NULL,
    outcome TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CLAIMS TABLE (dispute resolution system)
CREATE TABLE IF NOT EXISTS public.claims (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    market_id UUID NOT NULL REFERENCES public.markets(id) ON DELETE CASCADE,
    market_title TEXT NOT NULL,
    justification TEXT NOT NULL,
    evidence_url TEXT,
    claimed_outcome TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- LIMIT ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.limit_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    market_id UUID NOT NULL REFERENCES public.markets(id) ON DELETE CASCADE,
    outcome TEXT NOT NULL CHECK (outcome IN ('YES', 'NO')),
    limit_price NUMERIC(5,2) NOT NULL CHECK (limit_price >= 1.00 AND limit_price <= 99.00),
    contract_count NUMERIC(12,2) NOT NULL CHECK (contract_count > 0),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'filled', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ADD COLUMNS IF NOT EXIST
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS age INTEGER CHECK (age >= 13 AND age <= 120);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('MASCULINO', 'FEMENINO', 'OTRO'));

-- Markets: option labels added for binary prediction customization
ALTER TABLE public.markets ADD COLUMN IF NOT EXISTS option_a_label TEXT DEFAULT 'SÍ';
ALTER TABLE public.markets ADD COLUMN IF NOT EXISTS option_b_label TEXT DEFAULT 'NO';

-- ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.markets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsor_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resolved_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.limit_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;

-- DROP ALL POLICIES TO PREVENT "ALREADY EXISTS" ERRORS ON RE-RUN
DROP POLICY IF EXISTS "Allow public read market_price_history" ON public.market_price_history;
DROP POLICY IF EXISTS "Allow public read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow public read markets" ON public.markets;
DROP POLICY IF EXISTS "Allow admin insert markets" ON public.markets;
DROP POLICY IF EXISTS "Allow update markets during trading" ON public.markets;
DROP POLICY IF EXISTS "Allow admin delete markets" ON public.markets;
DROP POLICY IF EXISTS "Allow select own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Allow insert own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Allow admin select all transactions" ON public.transactions;
DROP POLICY IF EXISTS "Allow select own positions" ON public.user_positions;
DROP POLICY IF EXISTS "Allow write own positions" ON public.user_positions;
DROP POLICY IF EXISTS "Allow update own positions" ON public.user_positions;
DROP POLICY IF EXISTS "Allow admin select all positions" ON public.user_positions;
DROP POLICY IF EXISTS "Allow admin delete all positions" ON public.user_positions;
DROP POLICY IF EXISTS "Allow public read rewards" ON public.rewards;
DROP POLICY IF EXISTS "Allow update rewards" ON public.rewards;
DROP POLICY IF EXISTS "Allow select own redemptions" ON public.redemptions;
DROP POLICY IF EXISTS "Allow insert own redemptions" ON public.redemptions;
DROP POLICY IF EXISTS "Allow public read ai_costs" ON public.ai_costs;
DROP POLICY IF EXISTS "Allow insert ai_costs" ON public.ai_costs;
DROP POLICY IF EXISTS "Allow public read sponsors" ON public.sponsors;
DROP POLICY IF EXISTS "Allow admin write sponsors" ON public.sponsors;
DROP POLICY IF EXISTS "Allow select own sponsor_claims" ON public.sponsor_claims;
DROP POLICY IF EXISTS "Allow insert own sponsor_claims" ON public.sponsor_claims;
DROP POLICY IF EXISTS "Allow select own resolved_payouts" ON public.resolved_payouts;
DROP POLICY IF EXISTS "Allow insert admin resolved_payouts" ON public.resolved_payouts;
DROP POLICY IF EXISTS "Allow select own limit_orders" ON public.limit_orders;
DROP POLICY IF EXISTS "Allow insert own limit_orders" ON public.limit_orders;
DROP POLICY IF EXISTS "Allow update own limit_orders" ON public.limit_orders;
DROP POLICY IF EXISTS "Allow delete own limit_orders" ON public.limit_orders;

-- RE-CREATE ALL POLICIES
CREATE POLICY "Allow public read market_price_history" ON public.market_price_history FOR SELECT USING (true);

CREATE POLICY "Allow public read profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Allow insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Allow update profiles" ON public.profiles FOR UPDATE USING (
  (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')) OR (auth.uid() = id)
) WITH CHECK (
  (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')) OR (
    auth.uid() = id AND
    (orc_balance IS NOT DISTINCT FROM (SELECT orc_balance FROM public.profiles WHERE id = auth.uid())) AND
    (reputation_points IS NOT DISTINCT FROM (SELECT reputation_points FROM public.profiles WHERE id = auth.uid())) AND
    (predictions_count IS NOT DISTINCT FROM (SELECT predictions_count FROM public.profiles WHERE id = auth.uid())) AND
    (role IS NOT DISTINCT FROM (SELECT role FROM public.profiles WHERE id = auth.uid()))
  )
);

CREATE POLICY "Allow public read markets" ON public.markets FOR SELECT USING (true);
CREATE POLICY "Allow admin insert markets" ON public.markets FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Allow update markets during trading" ON public.markets FOR UPDATE USING (
  (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')) OR (auth.uid() IS NOT NULL AND status = 'active')
) WITH CHECK (
  (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')) OR (
    auth.uid() IS NOT NULL AND status = 'active' AND
    (title IS NOT DISTINCT FROM (SELECT title FROM public.markets WHERE id = id)) AND
    (description IS NOT DISTINCT FROM (SELECT description FROM public.markets WHERE id = id)) AND
    (category IS NOT DISTINCT FROM (SELECT category FROM public.markets WHERE id = id)) AND
    (country IS NOT DISTINCT FROM (SELECT country FROM public.markets WHERE id = id)) AND
    (end_date IS NOT DISTINCT FROM (SELECT end_date FROM public.markets WHERE id = id)) AND
    (status IS NOT DISTINCT FROM (SELECT status FROM public.markets WHERE id = id)) AND
    (resolution_source IS NOT DISTINCT FROM (SELECT resolution_source FROM public.markets WHERE id = id))
  )
);
CREATE POLICY "Allow admin delete markets" ON public.markets FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Allow select own transactions" ON public.transactions FOR SELECT USING (auth.uid() = profile_id);
CREATE POLICY "Allow insert own transactions" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "Allow admin select all transactions" ON public.transactions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Allow select own positions" ON public.user_positions FOR SELECT USING (auth.uid() = profile_id);
CREATE POLICY "Allow write own positions" ON public.user_positions FOR INSERT WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "Allow update own positions" ON public.user_positions FOR UPDATE USING (auth.uid() = profile_id);
CREATE POLICY "Allow admin select all positions" ON public.user_positions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Allow admin delete all positions" ON public.user_positions FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Allow public read rewards" ON public.rewards FOR SELECT USING (true);
CREATE POLICY "Allow update rewards" ON public.rewards FOR UPDATE USING (
  (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')) OR (auth.uid() IS NOT NULL)
);

CREATE POLICY "Allow select own redemptions" ON public.redemptions FOR SELECT USING (auth.uid() = profile_id);
CREATE POLICY "Allow insert own redemptions" ON public.redemptions FOR INSERT WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Allow public read ai_costs" ON public.ai_costs FOR SELECT USING (true);
CREATE POLICY "Allow insert ai_costs" ON public.ai_costs FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Allow public read sponsors" ON public.sponsors FOR SELECT USING (true);
CREATE POLICY "Allow admin write sponsors" ON public.sponsors FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Allow select own sponsor_claims" ON public.sponsor_claims FOR SELECT USING (auth.uid() = profile_id);
CREATE POLICY "Allow insert own sponsor_claims" ON public.sponsor_claims FOR INSERT WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Allow select own resolved_payouts" ON public.resolved_payouts FOR SELECT USING (auth.uid() = profile_id);
CREATE POLICY "Allow insert admin resolved_payouts" ON public.resolved_payouts FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Allow select own limit_orders" ON public.limit_orders FOR SELECT USING (auth.uid() = profile_id);
CREATE POLICY "Allow insert own limit_orders" ON public.limit_orders FOR INSERT WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "Allow update own limit_orders" ON public.limit_orders FOR UPDATE USING (auth.uid() = profile_id);
CREATE POLICY "Allow delete own limit_orders" ON public.limit_orders FOR DELETE USING (auth.uid() = profile_id);


-- TRIGGERS AND FUNCTIONS (DROP BEFORE CREATING)
DROP TRIGGER IF EXISTS on_transaction_inserted ON public.transactions;
DROP TRIGGER IF EXISTS on_redemption_inserted ON public.redemptions;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_market_price_updated ON public.markets;
DROP TRIGGER IF EXISTS on_sponsor_claim_inserted ON public.sponsor_claims;
DROP TRIGGER IF EXISTS on_resolved_payout_inserted ON public.resolved_payouts;
DROP TRIGGER IF EXISTS on_limit_order_changed ON public.limit_orders;

CREATE OR REPLACE FUNCTION public.process_transaction_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.type = 'buy' THEN
    UPDATE public.profiles 
    SET orc_balance = orc_balance - NEW.points_paid,
        predictions_count = predictions_count + 1,
        reputation_points = reputation_points + round(NEW.points_paid / 10)
    WHERE id = NEW.profile_id;
  ELSIF NEW.type = 'sell' THEN
    UPDATE public.profiles 
    SET orc_balance = orc_balance + NEW.points_paid
    WHERE id = NEW.profile_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_transaction_inserted
  AFTER INSERT ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.process_transaction_balance();


CREATE OR REPLACE FUNCTION public.process_redemption_balance()
RETURNS TRIGGER AS $$
DECLARE
  reward_cost NUMERIC(12, 2);
BEGIN
  SELECT cost INTO reward_cost FROM public.rewards WHERE id = NEW.reward_id;
  UPDATE public.profiles 
  SET orc_balance = orc_balance - COALESCE(reward_cost, 0.00)
  WHERE id = NEW.profile_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_redemption_inserted
  AFTER INSERT ON public.redemptions
  FOR EACH ROW EXECUTE FUNCTION public.process_redemption_balance();


CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  base_username TEXT;
  final_username TEXT;
  counter INTEGER := 1;
BEGIN
  base_username := COALESCE(
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    split_part(new.email, '@', 1)
  );
  IF base_username IS NULL OR base_username = '' THEN
    base_username := 'user_' || substring(new.id::text from 1 for 8);
  END IF;
  final_username := base_username;
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) LOOP
    final_username := base_username || '_' || counter;
    counter := counter + 1;
  END LOOP;

  INSERT INTO public.profiles (id, username, email, avatar_url, country, orc_balance, reputation_points, accuracy_rate, predictions_count, role)
  VALUES (
    new.id,
    final_username,
    new.email,
    COALESCE(new.raw_user_meta_data->>'avatar_url', 'https://api.dicebear.com/7.x/avataaars/svg?seed=' || new.id::text),
    COALESCE(new.raw_user_meta_data->>'country', 'CO'),
    1000.00,
    0,
    0.00,
    0,
    CASE 
      WHEN new.email = 'germanmoralesconsulting@gmail.com' THEN 'admin'::text
      ELSE 'user'::text
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


CREATE OR REPLACE FUNCTION public.delete_own_user()
RETURNS void AS $$
BEGIN
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


CREATE OR REPLACE FUNCTION public.log_market_price_history()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.yes_price IS DISTINCT FROM NEW.yes_price THEN
    INSERT INTO public.market_price_history (market_id, yes_price, no_price, created_at)
    VALUES (NEW.id, NEW.yes_price, NEW.no_price, NOW());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_market_price_updated
  AFTER UPDATE ON public.markets
  FOR EACH ROW EXECUTE FUNCTION public.log_market_price_history();


CREATE OR REPLACE FUNCTION public.process_sponsor_claim_balance()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles 
  SET orc_balance = orc_balance + NEW.reward_amount
  WHERE id = NEW.profile_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_sponsor_claim_inserted
  AFTER INSERT ON public.sponsor_claims
  FOR EACH ROW EXECUTE FUNCTION public.process_sponsor_claim_balance();


CREATE OR REPLACE FUNCTION public.process_resolved_payout_balance()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles 
  SET orc_balance = orc_balance + NEW.payout_amount
  WHERE id = NEW.profile_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_resolved_payout_inserted
  AFTER INSERT ON public.resolved_payouts
  FOR EACH ROW EXECUTE FUNCTION public.process_resolved_payout_balance();


CREATE OR REPLACE FUNCTION public.process_limit_order_balance()
RETURNS TRIGGER AS $$
DECLARE
  order_cost NUMERIC(12, 2);
BEGIN
  order_cost := (NEW.limit_price * NEW.contract_count) / 100.0;
  IF TG_OP = 'INSERT' AND NEW.status = 'pending' THEN
    UPDATE public.profiles
    SET orc_balance = orc_balance - order_cost
    WHERE id = NEW.profile_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status = 'pending' AND NEW.status = 'cancelled' THEN
      UPDATE public.profiles SET orc_balance = orc_balance + order_cost WHERE id = NEW.profile_id;
    ELSIF OLD.status = 'pending' AND NEW.status = 'filled' THEN
      UPDATE public.profiles SET orc_balance = orc_balance + order_cost WHERE id = NEW.profile_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_limit_order_changed
  AFTER INSERT OR UPDATE ON public.limit_orders
  FOR EACH ROW EXECUTE FUNCTION public.process_limit_order_balance();


-- SEED DATA (Only insert if not exists to prevent duplicate PKs)
INSERT INTO public.markets (id, title, description, category, country, end_date, yes_price, no_price, yes_liquidity, no_liquidity, volume, resolution_source, image_url)
VALUES 
('c2c1f4e1-27d1-447b-a320-c7be0ad0e001', '¿Aprobará el Congreso de Colombia la reforma de salud antes de fin de año?', 'Se resolverá a SÍ si el Congreso de la República de Colombia aprueba en último debate el proyecto de ley de la reforma a la salud antes del 31 de diciembre.', 'Política', 'CO', '2026-12-31T23:59:59Z', 64.00, 36.00, 640.00, 360.00, 12400.00, 'https://www.senado.gov.co', 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=400&q=80'),
('c2c1f4e1-27d1-447b-a320-c7be0ad0e002', '¿Crecimiento del PIB de México superará el 2.5% anual en el reporte de Q3?', 'Se resolverá a SÍ si el INEGI publica que el crecimiento acumulado del PIB real supera el 2.5% anual.', 'Economía', 'MX', '2026-11-15T23:59:59Z', 42.00, 58.00, 420.00, 580.00, 8950.00, 'https://www.inegi.org.mx', 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=400&q=80'),
('c2c1f4e1-27d1-447b-a320-c7be0ad0e003', '¿Alcanzará la inflación anual en Argentina menos del 80% en diciembre?', 'Se resolverá a SÍ si el INDEC reporta una tasa de inflación interanual acumulada menor al 80.0%.', 'Economía', 'AR', '2026-12-15T23:59:59Z', 55.00, 45.00, 550.00, 450.00, 15600.00, 'https://www.indec.gob.ar', 'https://images.unsplash.com/photo-1569025690938-a00729c9e1f9?auto=format&fit=crop&w=400&q=80'),
('c2c1f4e1-27d1-447b-a320-c7be0ad0e004', '¿Llegará una startup chilena a convertirse en Unicornio este semestre?', 'Se resolverá a SÍ si alguna startup con sede principal en Chile anuncia una ronda de inversión de 1,000 millones de USD o más.', 'Tecnología', 'CL', '2026-06-30T23:59:59Z', 18.00, 82.00, 180.00, 820.00, 5400.00, 'https://www.corfo.cl', 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=400&q=80'),
('c2c1f4e1-27d1-447b-a320-c7be0ad0e005', '¿Ganará Brasil la Copa América en la próxima edición?', 'Se resolverá a SÍ si la selección masculina absoluta de Brasil se consagra campeona oficial.', 'Deportes', 'BR', '2026-07-15T23:59:59Z', 72.00, 28.00, 720.00, 280.00, 22800.00, 'https://www.conmebol.com', 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=400&q=80')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.rewards (id, title, description, cost, image_url, provider, stock)
VALUES
('a3c1f4e1-27d1-447b-a320-c7be0ad0e101', 'Suscripción Digital a La República (Colombia)', '1 mes de acceso premium ilimitado.', 5000.00, 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=400&q=80', 'La República', 50),
('a3c1f4e1-27d1-447b-a320-c7be0ad0e102', 'Suscripción Digital a El Economista (México)', '1 mes de acceso digital premium.', 5000.00, 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=400&q=80', 'El Economista', 50),
('a3c1f4e1-27d1-447b-a320-c7be0ad0e103', 'Suscripción a Valor Econômico (Brasil)', '1 mes de acceso ilimitado en portugués.', 6000.00, 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=400&q=80', 'Valor Econômico', 30),
('a3c1f4e1-27d1-447b-a320-c7be0ad0e104', 'Cupón Platzi Premium (Educación)', '1 mes de suscripción Platzi Plan Classic.', 10000.00, 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=400&q=80', 'Platzi', 20)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.ai_costs (agent_name, tokens_input, tokens_output, runs, cost_usd, created_at)
VALUES
('Buscador de Noticias', 245000, 125000, 520, 0.55750, NOW() - INTERVAL '6 days'),
('Redactor de Preguntas', 45000, 85000, 110, 1.95000, NOW() - INTERVAL '6 days'),
('Auditor de Cierres', 88000, 44000, 95, 0.44000, NOW() - INTERVAL '6 days'),
('Buscador de Noticias', 288000, 142000, 610, 0.65100, NOW() - INTERVAL '5 days'),
('Redactor de Preguntas', 58000, 110000, 145, 2.52000, NOW() - INTERVAL '5 days'),
('Auditor de Cierres', 96000, 48000, 105, 0.48000, NOW() - INTERVAL '5 days'),
('Buscador de Noticias', 312000, 168000, 680, 0.72000, NOW() - INTERVAL '4 days'),
('Redactor de Preguntas', 67000, 125000, 160, 2.88000, NOW() - INTERVAL '4 days'),
('Auditor de Cierres', 112000, 56000, 120, 0.56000, NOW() - INTERVAL '4 days'),
('Buscador de Noticias', 345000, 185000, 750, 0.79500, NOW() - INTERVAL '3 days'),
('Redactor de Preguntas', 88000, 162000, 210, 3.75000, NOW() - INTERVAL '3 days'),
('Auditor de Cierres', 145000, 72000, 155, 0.72500, NOW() - INTERVAL '3 days'),
('Buscador de Noticias', 412000, 210000, 890, 0.93300, NOW() - INTERVAL '2 days'),
('Redactor de Preguntas', 94000, 178000, 230, 4.08000, NOW() - INTERVAL '2 days'),
('Auditor de Cierres', 158000, 79000, 170, 0.79000, NOW() - INTERVAL '2 days'),
('Buscador de Noticias', 458000, 235000, 980, 1.04100, NOW() - INTERVAL '1 days'),
('Redactor de Preguntas', 112000, 210000, 270, 4.83000, NOW() - INTERVAL '1 days'),
('Auditor de Cierres', 188000, 94000, 200, 0.94000, NOW() - INTERVAL '1 days'),
('Buscador de Noticias', 485000, 252000, 1050, 1.10850, NOW()),
('Redactor de Preguntas', 125000, 230000, 300, 5.32500, NOW()),
('Auditor de Cierres', 205000, 102500, 220, 1.02500, NOW());
