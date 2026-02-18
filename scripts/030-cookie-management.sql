-- Cookie Categories (Essential, Functional, Analytics, Marketing)
CREATE TABLE IF NOT EXISTS cookie_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  is_required BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default categories
INSERT INTO cookie_categories (name, display_name, description, is_required, sort_order) VALUES
  ('essential', 'Notwendig', 'Diese Cookies sind für die Grundfunktionen der Website erforderlich und können nicht deaktiviert werden.', true, 1),
  ('functional', 'Funktional', 'Diese Cookies ermöglichen erweiterte Funktionen und Personalisierung.', false, 2),
  ('analytics', 'Statistik', 'Diese Cookies helfen uns zu verstehen, wie Besucher mit der Website interagieren.', false, 3),
  ('marketing', 'Marketing', 'Diese Cookies werden verwendet, um Werbung relevanter zu gestalten.', false, 4)
ON CONFLICT (name) DO NOTHING;

-- Cookie Definitions (managed by super-admin)
CREATE TABLE IF NOT EXISTS cookie_definitions (
  id SERIAL PRIMARY KEY,
  category_id INTEGER REFERENCES cookie_categories(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  provider VARCHAR(100),
  duration VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default cookie definitions
INSERT INTO cookie_definitions (category_id, name, description, provider, duration) VALUES
  (1, 'session', 'Speichert die Benutzersitzung für die Admin-Anmeldung', 'Eigene', '24 Stunden'),
  (1, 'cart', 'Speichert den Warenkorb-Inhalt', 'Eigene', 'Session'),
  (1, 'cookie_consent', 'Speichert die Cookie-Einstellungen des Benutzers', 'Eigene', '1 Jahr'),
  (2, 'language', 'Speichert die bevorzugte Sprache', 'Eigene', '1 Jahr'),
  (2, 'theme', 'Speichert das bevorzugte Farbschema (hell/dunkel)', 'Eigene', '1 Jahr'),
  (3, 'stripe_mid', 'Stripe Fraud-Prävention und Analyse', 'Stripe', '1 Jahr')
ON CONFLICT DO NOTHING;

-- Cookie Banner Settings
CREATE TABLE IF NOT EXISTS cookie_settings (
  id SERIAL PRIMARY KEY,
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default settings
INSERT INTO cookie_settings (setting_key, setting_value) VALUES
  ('banner_enabled', 'true'),
  ('banner_position', 'bottom'),
  ('banner_title', 'Cookie-Einstellungen'),
  ('banner_description', 'Wir verwenden Cookies, um Ihnen die bestmögliche Erfahrung auf unserer Website zu bieten.'),
  ('accept_all_text', 'Alle akzeptieren'),
  ('reject_all_text', 'Nur notwendige'),
  ('settings_text', 'Einstellungen'),
  ('save_text', 'Auswahl speichern'),
  ('privacy_link', '/datenschutz'),
  ('imprint_link', '/impressum')
ON CONFLICT (setting_key) DO NOTHING;
