-- Ustozlar kuni 2026 — ma'lumotlar bazasi sxemasi (PostgreSQL)
-- Ishga tushirish: npm run db:setup

CREATE TABLE IF NOT EXISTS branches (
  id          SERIAL PRIMARY KEY,
  slug        TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  address     TEXT,
  sort_order  INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS teachers (
  id          SERIAL PRIMARY KEY,
  branch_id   INT NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  full_name   TEXT NOT NULL,
  subject     TEXT,
  bio         TEXT,
  photo_url   TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order  INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS teachers_branch_idx ON teachers(branch_id) WHERE is_active;

CREATE TABLE IF NOT EXISTS users (
  id              BIGSERIAL PRIMARY KEY,
  telegram_id     BIGINT NOT NULL UNIQUE,
  first_name      TEXT,
  last_name       TEXT,
  username        TEXT,
  phone           TEXT,
  -- bitta telefon raqami = bitta akkaunt (anti-fraud asosiy filtri)
  phone_norm      TEXT UNIQUE,
  is_student      BOOLEAN,             -- NULL = hali belgilamagan
  branch_id       INT REFERENCES branches(id) ON DELETE SET NULL,
  referred_by     BIGINT REFERENCES users(id) ON DELETE SET NULL,
  subscribed      BOOLEAN NOT NULL DEFAULT FALSE,
  sub_checked_at  TIMESTAMPTZ,
  is_blocked      BOOLEAN NOT NULL DEFAULT FALSE,   -- admin qo'lda bloklaydi
  suspicion       INT NOT NULL DEFAULT 0,           -- 0..100, avtomatik baho
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS users_referred_by_idx ON users(referred_by);

-- Botdan saytga kirish uchun bir martalik token
CREATE TABLE IF NOT EXISTS auth_tokens (
  token       TEXT PRIMARY KEY,
  user_id     BIGINT REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  used_at     TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS votes (
  id          BIGSERIAL PRIMARY KEY,
  user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  teacher_id  INT NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  nomination  TEXT NOT NULL,
  kind        TEXT NOT NULL CHECK (kind IN ('main','bonus')),
  is_valid    BOOLEAN NOT NULL DEFAULT TRUE,   -- fraud aniqlansa FALSE
  comment     TEXT,                            -- ustozga iliq so'z (albom uchun)
  ip_hash     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Asosiy ovozlar: bitta odam bitta ustozga faqat 1 marta
CREATE UNIQUE INDEX IF NOT EXISTS votes_main_unique
  ON votes(user_id, teacher_id) WHERE kind = 'main';

CREATE INDEX IF NOT EXISTS votes_teacher_idx ON votes(teacher_id) WHERE is_valid;
CREATE INDEX IF NOT EXISTS votes_user_idx ON votes(user_id);

-- Referal: taklif qilingan odam ovoz bergandagina hisoblanadi
CREATE TABLE IF NOT EXISTS referrals (
  id          BIGSERIAL PRIMARY KEY,
  inviter_id  BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invited_id  BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  counted     BOOLEAN NOT NULL DEFAULT FALSE,  -- invited odam ovoz berdimi
  counted_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (inviter_id <> invited_id)
);
CREATE INDEX IF NOT EXISTS referrals_inviter_idx ON referrals(inviter_id) WHERE counted;

-- Admin sessiyalari uchun oddiy log
CREATE TABLE IF NOT EXISTS admin_log (
  id          BIGSERIAL PRIMARY KEY,
  action      TEXT NOT NULL,
  payload     JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
