-- USERS
CREATE TABLE IF NOT EXISTS users (
  user_id      SERIAL PRIMARY KEY,
  name         VARCHAR,
  pronunciation VARCHAR,
  pronouns     VARCHAR,
  profile_photo BYTEA,
  email        VARCHAR UNIQUE,
  password     VARCHAR,  
  token_response VARCHAR,  -- OAuth token response
  slack        VARCHAR,
  phone        VARCHAR, -- changed to VARCHAR
  availability VARCHAR, 
  role         VARCHAR
);

-- Ensure users.phone is VARCHAR if it previously existed as an integer
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
      FROM information_schema.columns
     WHERE table_name = 'users'
       AND column_name = 'phone'
       AND data_type IN ('integer', 'bigint', 'smallint')
  ) THEN
    BEGIN
      ALTER TABLE users
        ALTER COLUMN phone TYPE VARCHAR
        USING phone::text;
    EXCEPTION WHEN others THEN
      -- If conversion fails, keep existing type to avoid breaking deploys
      NULL;
    END;
  END IF;
END$$;

ALTER TABLE users ADD COLUMN IF NOT EXISTS password VARCHAR;
ALTER TABLE users ADD COLUMN IF NOT EXISTS token_response VARCHAR;
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR;

-- GROUPS
CREATE TABLE IF NOT EXISTS groups (
  group_id        SERIAL PRIMARY KEY,
  name            VARCHAR,
  logo            BYTEA,
  mantra          VARCHAR,
  slack           VARCHAR,
  repository_link VARCHAR
);

-- COURSES
CREATE TABLE IF NOT EXISTS courses (
  course_id SERIAL PRIMARY KEY,
  name      VARCHAR,
  code      VARCHAR,
  semester  VARCHAR,
  description TEXT
);

-- ACTIVITIES
CREATE TABLE IF NOT EXISTS activities (
  activity_id SERIAL PRIMARY KEY,
  name        VARCHAR,
  time        TIMESTAMP,      -- "DATETIME" in the diagram
  type        VARCHAR         -- (lecture, oh, etc)
);

-- STAND UP TOOL ENTRIES
CREATE TABLE IF NOT EXISTS standup_entries (
  standup_id SERIAL PRIMARY KEY,
  user_id    INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  name       VARCHAR,
  time      TIMESTAMPTZ DEFAULT NOW(),      -- "DATETIME" in the diagram
  content    VARCHAR,
  sentiment_personal INT,                --  Personal rating (1-5)
  sentiment_team INT,                -- Team rating (1-5)
  sentiment_course INT                 -- Course rating (1-5)
);

-- ANONYMOUS FEEDBACK TABLE
-- This handles anonymous messages (to Team/Leader or Course)
CREATE TABLE IF NOT EXISTS standup_feedback (
    feedback_id SERIAL PRIMARY KEY,
    course_id INT NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
    type VARCHAR NOT NULL, -- 'TEAM' or 'COURSE'
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- GROUPS <-> USERS (membership)
CREATE TABLE IF NOT EXISTS group_users (
  group_id INT NOT NULL REFERENCES groups(group_id) ON DELETE CASCADE,
  user_id  INT NOT NULL REFERENCES users(user_id)  ON DELETE CASCADE,
  role     VARCHAR,
  PRIMARY KEY (group_id, user_id)
);

-- COURSES <-> USERS (enrollment/roles)
CREATE TABLE IF NOT EXISTS course_users (
  user_id   INT NOT NULL REFERENCES users(user_id)   ON DELETE CASCADE,
  course_id INT NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
  role      VARCHAR,
  PRIMARY KEY (user_id, course_id)
);

-- COURSES <-> GROUPS (teams assigned to courses)
CREATE TABLE IF NOT EXISTS course_groups (
  group_id  INT NOT NULL REFERENCES groups(group_id)   ON DELETE CASCADE,
  course_id INT NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
  PRIMARY KEY (group_id, course_id)
);

-- ATTENDANCE (Activities–Users–Courses)
CREATE TABLE IF NOT EXISTS attendance (
  user_id    INT NOT NULL REFERENCES users(user_id)       ON DELETE CASCADE,
  activity_id INT NOT NULL REFERENCES activities(activity_id) ON DELETE CASCADE,
  present    BOOLEAN,
  checked_in_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, activity_id)
);
ALTER TABLE activities
  ADD COLUMN IF NOT EXISTS course_id INT REFERENCES courses(course_id) ON DELETE CASCADE;

ALTER TABLE activities
  ADD COLUMN IF NOT EXISTS starts_at TIMESTAMPTZ;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'activities' AND column_name = 'time'
  ) THEN
    EXECUTE $sql$
      UPDATE activities
      SET starts_at = "time" AT TIME ZONE 'UTC'
      WHERE starts_at IS NULL;
    $sql$;
    EXECUTE 'ALTER TABLE activities DROP COLUMN "time";';
  END IF;
END$$;

DROP INDEX IF EXISTS uq_activity_course_name_minute;
CREATE UNIQUE INDEX IF NOT EXISTS uq_activity_course_name_minute
ON activities (
  course_id,
  name,
  ((date_trunc('minute', (starts_at AT TIME ZONE 'UTC'))) AT TIME ZONE 'UTC')
);

-- ATTENDANCE (to check if students check in within 15 minute frame of start of attendance)
ALTER TABLE attendance
ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- ASSIGNMENTS
CREATE TABLE IF NOT EXISTS assignments (
  assignment_id SERIAL PRIMARY KEY,
  course_id     INT NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
  name          VARCHAR NOT NULL,
  description   TEXT,
  due_date      TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  created_by    INT REFERENCES users(user_id) ON DELETE SET NULL
);

