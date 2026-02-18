-- Migration: Consent Audit Logging und Re-Consent System
-- Erstellt: 2026-02-11
-- Zweck: DSGVO-konforme Speicherung von Cookie-Einwilligungen

-- Audit Log Table für Cookie-Einwilligungen
CREATE TABLE IF NOT EXISTS consent_audit_log (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(255) NOT NULL,
  ip_address INET,
  user_agent TEXT,
  consent_data JSONB NOT NULL,
  action VARCHAR(50) NOT NULL CHECK (action IN ('accept_all', 'reject_all', 'custom', 'revoke')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  signature VARCHAR(255) NOT NULL,
  is_valid BOOLEAN DEFAULT TRUE
);

-- Index für schnellere Lookups
CREATE INDEX IF NOT EXISTS idx_consent_audit_session ON consent_audit_log(session_id);
CREATE INDEX IF NOT EXISTS idx_consent_audit_created ON consent_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_consent_audit_expires ON consent_audit_log(expires_at);

-- Funktion: Consent validieren
CREATE OR REPLACE FUNCTION validate_consent(
  p_session_id VARCHAR(255),
  p_signature VARCHAR(255)
) RETURNS BOOLEAN AS $$
DECLARE
  v_record RECORD;
BEGIN
  -- Hole den neuesten Consent für diese Session
  SELECT * INTO v_record
  FROM consent_audit_log
  WHERE session_id = p_session_id
    AND signature = p_signature
    AND is_valid = TRUE
    AND expires_at > NOW()
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Wenn gefunden und gültig
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funktion: Consent speichern
CREATE OR REPLACE FUNCTION log_consent(
  p_session_id VARCHAR(255),
  p_ip_address INET,
  p_user_agent TEXT,
  p_consent_data JSONB,
  p_action VARCHAR(50),
  p_signature VARCHAR(255)
) RETURNS INTEGER AS $$
DECLARE
  v_id INTEGER;
  v_expires_at TIMESTAMPTZ;
BEGIN
  -- Berechne Ablaufdatum (12 Monate ab jetzt)
  v_expires_at := NOW() + INTERVAL '12 months';
  
  -- Füge neuen Audit-Eintrag hinzu
  INSERT INTO consent_audit_log (
    session_id,
    ip_address,
    user_agent,
    consent_data,
    action,
    created_at,
    expires_at,
    signature,
    is_valid
  ) VALUES (
    p_session_id,
    p_ip_address,
    p_user_agent,
    p_consent_data,
    p_action,
    NOW(),
    v_expires_at,
    p_signature,
    TRUE
  ) RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funktion: Consent widerrufen
CREATE OR REPLACE FUNCTION revoke_consent(
  p_session_id VARCHAR(255)
) RETURNS BOOLEAN AS $$
BEGIN
  UPDATE consent_audit_log
  SET is_valid = FALSE
  WHERE session_id = p_session_id
    AND is_valid = TRUE;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funktion: Abgelaufene Consents bereinigen (für Cron-Job)
CREATE OR REPLACE FUNCTION cleanup_expired_consents()
RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM consent_audit_log
  WHERE expires_at < NOW() - INTERVAL '6 months'
  RETURNING COUNT(*) INTO v_deleted_count;
  
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Kommentare
COMMENT ON TABLE consent_audit_log IS 'DSGVO-konforme Speicherung von Cookie-Einwilligungen mit 12-Monats-Ablauf';
COMMENT ON COLUMN consent_audit_log.session_id IS 'Eindeutige Session-ID (nicht mit User verknüpft für Anonymität)';
COMMENT ON COLUMN consent_audit_log.signature IS 'HMAC-Signatur zur Tamper-Detection';
COMMENT ON COLUMN consent_audit_log.expires_at IS 'Ablaufdatum - nach 12 Monaten muss Re-Consent erfolgen';
