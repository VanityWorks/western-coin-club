-- ── Forum schema ──────────────────────────────────────────────────────────────
-- Run this in the Supabase SQL editor (Dashboard → SQL editor → New query)

-- Forum categories (seeded, admin-managed)
CREATE TABLE IF NOT EXISTS forum_categories (
  id          TEXT PRIMARY KEY,
  group_id    TEXT NOT NULL,
  group_name  TEXT NOT NULL,
  name        TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  color       TEXT NOT NULL DEFAULT '#007749',
  sort_order  INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE forum_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "forum_categories_public_read" ON forum_categories FOR SELECT USING (true);

-- Forum threads
CREATE TABLE IF NOT EXISTS forum_threads (
  id          BIGSERIAL PRIMARY KEY,
  category_id TEXT NOT NULL REFERENCES forum_categories(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  author_id   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL,
  is_pinned   BOOLEAN NOT NULL DEFAULT false,
  is_locked   BOOLEAN NOT NULL DEFAULT false,
  views       INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE forum_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "forum_threads_members_read"   ON forum_threads FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "forum_threads_members_insert" ON forum_threads FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "forum_threads_author_update"  ON forum_threads FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "forum_threads_author_delete"  ON forum_threads FOR DELETE USING (auth.uid() = author_id);

-- Forum posts
CREATE TABLE IF NOT EXISTS forum_posts (
  id          BIGSERIAL PRIMARY KEY,
  thread_id   BIGINT NOT NULL REFERENCES forum_threads(id) ON DELETE CASCADE,
  author_id   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL,
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ
);

ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "forum_posts_members_read"   ON forum_posts FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "forum_posts_members_insert" ON forum_posts FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "forum_posts_author_update"  ON forum_posts FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "forum_posts_author_delete"  ON forum_posts FOR DELETE USING (auth.uid() = author_id);

-- ── Seed categories ────────────────────────────────────────────────────────────
INSERT INTO forum_categories (id, group_id, group_name, name, description, color, sort_order) VALUES
  ('sa-coins',  'sa',          'South African Numismatics', 'South African Coins',       'ZAR, Union & RSA coinage discussion',        '#007749', 10),
  ('bullion',   'sa',          'South African Numismatics', 'Krugerrands & Bullion',     'Bullion coins and investment grades',         '#FFB81C', 20),
  ('banknotes', 'sa',          'South African Numismatics', 'Banknotes',                 'SARB notes and paper money',                 '#002395', 30),
  ('medals',    'sa',          'South African Numismatics', 'Medals & Tokens',           'Exonumia, tokens and decorations',           '#E63946', 40),
  ('world',     'general',     'General Collecting',        'World Coins',               'International coinage from all eras',        '#007749', 50),
  ('ancient',   'general',     'General Collecting',        'Ancient & Medieval',        'Classical world and medieval coins',         '#002395', 60),
  ('identify',  'general',     'General Collecting',        'Identification Help',       'Get expert help identifying any coin',       '#FFB81C', 70),
  ('grading',   'general',     'General Collecting',        'Grading & Authentication',  'Coin condition and authenticity advice',     '#525252', 80),
  ('intro',     'community',   'Community',                 'Introductions',             'Say hello to the community',                 '#007749', 90),
  ('club-news', 'community',   'Community',                 'Club News & Announcements', 'Official SACCC updates',                     '#E63946', 100),
  ('events',    'community',   'Community',                 'Events & Shows',            'Numismatic events around South Africa',      '#002395', 110),
  ('buy-sell',  'marketplace', 'Marketplace',               'Buy / Sell / Trade',        'Member-to-member coin transactions',         '#007749', 120),
  ('wanted',    'marketplace', 'Marketplace',               'Wanted',                    'Post what you are looking to buy',           '#FFB81C', 130),
  ('research',  'marketplace', 'Marketplace',               'Research & Articles',       'In-depth articles and numismatic research',  '#002395', 140)
ON CONFLICT (id) DO NOTHING;
