-- ===========================================================
-- SAMPLE SEED DATA FOR CONDUCTOR
-- Populates users, groups, courses, activities, assignments,
-- standup entries, attendance, and membership tables.
-- ===========================================================

-- -----------------------------
-- USERS
-- -----------------------------
WITH inserted_users AS (
  INSERT INTO users (name, pronunciation, pronouns, email, password, role, slack, phone, availability)
  VALUES
    ('Dr. Alice Instructor', 'AL-iss', 'she/her', 'alice@university.edu', '$2b$10$yv9vxRB.E2QI5lRBgPVj8u/PR.zKEwbJJ22kbXqjrSu1T6ov0UstW', 'instructor', '@alice', '555-1111', 'MWF'),
    ('Dr. Bob Professor', 'Bahb', 'he/him', 'bob@university.edu', '$2b$10$yv9vxRB.E2QI5lRBgPVj8u/PR.zKEwbJJ22kbXqjrSu1T6ov0UstW', 'instructor', '@bob', '555-2222', 'TTh'),
    ('Charlie Student', 'CHAR-lee', 'he/him', 'charlie@student.edu', '$2b$10$yv9vxRB.E2QI5lRBgPVj8u/PR.zKEwbJJ22kbXqjrSu1T6ov0UstW', 'student', '@charlie', '555-3333', 'MWF'),
    ('Dana Student', 'DAY-nuh', 'she/her', 'dana@student.edu', '$2b$10$yv9vxRB.E2QI5lRBgPVj8u/PR.zKEwbJJ22kbXqjrSu1T6ov0UstW', 'student', '@dana', '555-4444', 'TTh'),
    ('Evan Student', 'EH-van', 'they/them', 'evan@student.edu', '$2b$10$yv9vxRB.E2QI5lRBgPVj8u/PR.zKEwbJJ22kbXqjrSu1T6ov0UstW', 'student', '@evan', '555-5555', 'MWF')
  RETURNING user_id, email
)
SELECT * FROM inserted_users;

-- -----------------------------
-- GROUPS (Student project teams)
-- -----------------------------
WITH inserted_groups AS (
  INSERT INTO groups (name, mantra, slack, repository_link)
  VALUES
    ('Team Rocket', 'Blast off at the speed of light!', '#team-rocket', 'https://github.com/team-rocket/repo'),
    ('Team Photon', 'Move fast with energy.', '#team-photon', 'https://github.com/team-photon/repo')
  RETURNING group_id
)
SELECT * FROM inserted_groups;

-- -----------------------------
-- COURSES
-- -----------------------------
WITH inserted_courses AS (
  INSERT INTO courses (name, code, semester, description)
  VALUES
    ('Software Engineering', 'CSE210', 'Fall 2025', 'Introduction to SE with real-world projects.'),
    ('Data Structures', 'CSE200', 'Fall 2025', 'Foundations of algorithms and data structures.')
  RETURNING course_id
)
SELECT * FROM inserted_courses;

-- -----------------------------
-- COURSE ↔ USERS ENROLLMENT
-- -----------------------------
-- Assign instructors & students to CSE210
INSERT INTO course_users (user_id, course_id, role)
SELECT user_id, 1, 'instructor' FROM users WHERE email = 'alice@university.edu';
INSERT INTO course_users (user_id, course_id, role)
SELECT user_id, 1, 'instructor' FROM users WHERE email = 'bob@university.edu';

INSERT INTO course_users (user_id, course_id, role)
SELECT user_id, 1, 'student' FROM users WHERE email = 'charlie@student.edu';
INSERT INTO course_users (user_id, course_id, role)
SELECT user_id, 1, 'student' FROM users WHERE email = 'dana@student.edu';
INSERT INTO course_users (user_id, course_id, role)
SELECT user_id, 1, 'student' FROM users WHERE email = 'evan@student.edu';

-- CSE200 only has one student
INSERT INTO course_users (user_id, course_id, role)
SELECT user_id, 2, 'student' FROM users WHERE email = 'charlie@student.edu';

-- -----------------------------
-- GROUPS ↔ USERS MEMBERSHIP
-- -----------------------------
-- Team Rocket: Charlie + Dana
INSERT INTO group_users (group_id, user_id, role)
SELECT 1, user_id, 'member' FROM users WHERE email = 'charlie@student.edu';
INSERT INTO group_users (group_id, user_id, role)
SELECT 1, user_id, 'member' FROM users WHERE email = 'dana@student.edu';

-- Team Photon: Evan
INSERT INTO group_users (group_id, user_id, role)
SELECT 2, user_id, 'member' FROM users WHERE email = 'evan@student.edu';

-- -----------------------------
-- COURSES ↔ GROUPS (Teams in course)
-- -----------------------------
INSERT INTO course_groups (group_id, course_id) VALUES (1, 1);
INSERT INTO course_groups (group_id, course_id) VALUES (2, 1);

-- -----------------------------
-- ACTIVITIES (Lectures, OH, Labs)
-- -----------------------------
INSERT INTO activities (name, type, course_id, starts_at)
VALUES
  ('Lecture 1', 'lecture', 1, '2025-01-20 10:00:00-08'),
  ('Lecture 2', 'lecture', 1, '2025-01-22 10:00:00-08'),
  ('Office Hours', 'oh', 1, '2025-01-23 14:00:00-08');

-- -----------------------------
-- ATTENDANCE
-- -----------------------------
INSERT INTO attendance (user_id, activity_id, present)
SELECT user_id, 1, TRUE FROM users WHERE email = 'charlie@student.edu';
INSERT INTO attendance (user_id, activity_id, present)
SELECT user_id, 1, TRUE FROM users WHERE email = 'dana@student.edu';
INSERT INTO attendance (user_id, activity_id, present)
SELECT user_id, 1, FALSE FROM users WHERE email = 'evan@student.edu';

-- -----------------------------
-- ASSIGNMENTS
-- -----------------------------
INSERT INTO assignments (course_id, name, description, due_date, created_by)
SELECT 1, 'Homework 1', 'Intro exercise on SE principles.', '2025-02-01 23:59:00-08', user_id
FROM users WHERE email = 'alice@university.edu';

INSERT INTO assignments (course_id, name, description, due_date, created_by)
SELECT 1, 'Project Milestone 1', 'Initial team project deliverable.', '2025-02-10 23:59:00-08', user_id
FROM users WHERE email = 'bob@university.edu';

-- -----------------------------
-- STANDUP ENTRIES
-- -----------------------------
INSERT INTO standup_entries (user_id, name, time, content)
SELECT user_id, 'Daily Standup', NOW(), 'Yesterday I worked on setup; today I will work on user flows.'
FROM users WHERE email = 'charlie@student.edu';

INSERT INTO standup_entries (user_id, name, time, content)
SELECT user_id, 'Daily Standup', NOW(), 'Debugged database issues; today finishing assignment 1.'
FROM users WHERE email = 'dana@student.edu';