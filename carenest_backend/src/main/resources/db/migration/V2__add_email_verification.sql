ALTER TABLE users ADD COLUMN email_verified_at TIMESTAMP;

CREATE TABLE verification_tokens (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token       VARCHAR(255) NOT NULL UNIQUE,
  expires_at  TIMESTAMP   NOT NULL,
  used_at     TIMESTAMP,
  created_at  TIMESTAMP   NOT NULL DEFAULT now()
);