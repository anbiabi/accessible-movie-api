-- Add narration and braille support features
ALTER TABLE movies ADD COLUMN IF NOT EXISTS ai_narration_generated BOOLEAN DEFAULT FALSE;
ALTER TABLE movies ADD COLUMN IF NOT EXISTS braille_description TEXT;
ALTER TABLE movies ADD COLUMN IF NOT EXISTS estimated_narration_duration INTEGER; -- in seconds

-- Create table for detailed narration components
CREATE TABLE IF NOT EXISTS movie_narration_details (
  id BIGSERIAL PRIMARY KEY,
  movie_id BIGINT NOT NULL REFERENCES movies(id),
  scene_descriptions JSONB,
  character_descriptions JSONB,
  action_descriptions JSONB,
  voice_style TEXT DEFAULT 'professional',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(movie_id)
);

-- Create table for user accessibility preferences
CREATE TABLE IF NOT EXISTS user_accessibility_preferences (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  preferred_narration_speed DOUBLE PRECISION DEFAULT 1.0, -- 0.5 to 2.0
  preferred_voice_style TEXT DEFAULT 'professional',
  enable_braille_output BOOLEAN DEFAULT FALSE,
  enable_speech_navigation BOOLEAN DEFAULT TRUE,
  enable_keyboard_shortcuts BOOLEAN DEFAULT TRUE,
  high_contrast_mode BOOLEAN DEFAULT FALSE,
  large_text_mode BOOLEAN DEFAULT FALSE,
  reduced_motion BOOLEAN DEFAULT FALSE,
  screen_reader_optimized BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create table for accessibility feedback and improvements
CREATE TABLE IF NOT EXISTS accessibility_feedback (
  id BIGSERIAL PRIMARY KEY,
  movie_id BIGINT NOT NULL REFERENCES movies(id),
  user_id TEXT NOT NULL,
  feedback_type TEXT NOT NULL, -- 'narration_quality', 'braille_accuracy', 'navigation_issue', 'suggestion'
  feedback_text TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  is_resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_movie_narration_details_movie_id ON movie_narration_details(movie_id);
CREATE INDEX IF NOT EXISTS idx_user_accessibility_preferences_user_id ON user_accessibility_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_accessibility_feedback_movie_id ON accessibility_feedback(movie_id);
CREATE INDEX IF NOT EXISTS idx_accessibility_feedback_user_id ON accessibility_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_movies_ai_narration ON movies(ai_narration_generated);
CREATE INDEX IF NOT EXISTS idx_movies_accessibility_features ON movies USING GIN(accessibility_features);
