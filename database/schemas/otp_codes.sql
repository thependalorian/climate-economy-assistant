-- OTP Codes Table
-- Stores one-time passwords for email verification, password reset, and MFA
CREATE TABLE IF NOT EXISTS otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  code_hash TEXT NOT NULL, -- Store hashed OTP for security
  type TEXT NOT NULL CHECK (type IN ('registration', 'password_reset', 'login_mfa')),
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_otp_codes_user_id ON otp_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_otp_codes_email ON otp_codes(email);
CREATE INDEX IF NOT EXISTS idx_otp_codes_type ON otp_codes(type);
CREATE INDEX IF NOT EXISTS idx_otp_codes_expires_at ON otp_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_otp_codes_used ON otp_codes(used);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_otp_codes_lookup ON otp_codes(email, type, used, expires_at);

-- Row Level Security
ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own OTP codes
CREATE POLICY "Users can access own OTP codes" ON otp_codes
  FOR ALL USING (auth.uid() = user_id);

-- Policy: Service role can manage all OTP codes
CREATE POLICY "Service role can manage OTP codes" ON otp_codes
  FOR ALL USING (auth.role() = 'service_role');

-- Function to automatically cleanup expired OTPs
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS void AS $$
BEGIN
  DELETE FROM otp_codes 
  WHERE expires_at < NOW() - INTERVAL '1 hour'
    AND used = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule cleanup (if using pg_cron extension)
-- SELECT cron.schedule('cleanup-expired-otps', '0 * * * *', 'SELECT cleanup_expired_otps();');

-- Comments for documentation
COMMENT ON TABLE otp_codes IS 'Stores OTP codes for email verification, password reset, and MFA';
COMMENT ON COLUMN otp_codes.code_hash IS 'Hashed OTP code using bcrypt for security';
COMMENT ON COLUMN otp_codes.attempts IS 'Number of failed verification attempts';
COMMENT ON COLUMN otp_codes.max_attempts IS 'Maximum allowed verification attempts before OTP is invalidated'; 