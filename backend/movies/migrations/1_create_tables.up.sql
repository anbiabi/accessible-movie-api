CREATE TABLE movies (
  id BIGSERIAL PRIMARY KEY,
  vidsrc_id TEXT UNIQUE,
  imdb_id TEXT,
  title TEXT NOT NULL,
  overview TEXT,
  narrated_description TEXT,
  release_date DATE,
  poster_path TEXT,
  backdrop_path TEXT,
  vote_average DOUBLE PRECISION DEFAULT 0,
  vote_count INTEGER DEFAULT 0,
  runtime INTEGER,
  genres JSONB,
  accessibility_features JSONB,
  audio_description_available BOOLEAN DEFAULT FALSE,
  closed_captions_available BOOLEAN DEFAULT FALSE,
  sign_language_available BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE user_favorites (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  movie_id BIGINT NOT NULL REFERENCES movies(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, movie_id)
);

CREATE TABLE user_ratings (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  movie_id BIGINT NOT NULL REFERENCES movies(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 10),
  review TEXT,
  accessibility_rating INTEGER CHECK (accessibility_rating >= 1 AND accessibility_rating <= 5),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, movie_id)
);

CREATE TABLE accessibility_reports (
  id BIGSERIAL PRIMARY KEY,
  movie_id BIGINT NOT NULL REFERENCES movies(id),
  user_id TEXT NOT NULL,
  report_type TEXT NOT NULL, -- 'audio_description', 'captions', 'navigation', 'other'
  description TEXT NOT NULL,
  severity TEXT NOT NULL, -- 'low', 'medium', 'high', 'critical'
  status TEXT DEFAULT 'open', -- 'open', 'in_progress', 'resolved', 'closed'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_movies_vidsrc_id ON movies(vidsrc_id);
CREATE INDEX idx_movies_title ON movies(title);
CREATE INDEX idx_movies_release_date ON movies(release_date);
CREATE INDEX idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX idx_user_ratings_user_id ON user_ratings(user_id);
CREATE INDEX idx_user_ratings_movie_id ON user_ratings(movie_id);
CREATE INDEX idx_accessibility_reports_movie_id ON accessibility_reports(movie_id);
