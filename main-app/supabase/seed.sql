-- ==============================================================================
-- CX-HIRE: COMPLETE DEMO SEED DATA (seed.sql)
-- ==============================================================================
-- This script populates the database with realistic evaluation demo data:
-- 1. Demo Auth Accounts: student@gmail.com, interviewer@gmail.com, recruiter@gmail.com (Password: Demo@12345)
-- 2. Company: Automatically associates with existing company "TCS" (or first existing)
-- 3. Departments: Engineering, Design (with recruiter_id and company_id)
-- 4. Job Openings: 3 active openings across Engineering and Design
-- 5. Applications: 15 applications across all pipeline stages:
--    applied: 3, screening: 3, interview: 4, offer: 2, hired: 1, rejected: 2
-- 6. Trigger Compliance: Triggers remain ACTIVE throughout; natural lifecycle updates generate history
-- 7. Interviewer Assignments & Feedback: 5 assigned, 3 with ratings and notes
-- 8. Scheduled Interviews: 1 upcoming, 1 recent past interview
-- 9. Stalled Application Alerts: 2 applications >10 days inactive triggering alerts
-- 10. Documents & Notes: Realistic candidate responses, resumes, and recruiter notes
-- 11. Verification Queries: Executable queries at bottom validating all 12 criteria
-- ==============================================================================

-- Ensure pgcrypto extension exists for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

DO $$
DECLARE
    -- Demo User Fixed UUIDs
    v_recruiter_id   UUID := 'e0000000-0000-0000-0000-000000000001';
    v_interviewer_id UUID := 'e0000000-0000-0000-0000-000000000002';
    v_student_id     UUID := 'e0000000-0000-0000-0000-000000000003';

    -- Candidate Student Fixed UUIDs (Candidates 2 to 15)
    v_cand_2  UUID := 'c0000000-0000-0000-0000-000000000002';
    v_cand_3  UUID := 'c0000000-0000-0000-0000-000000000003';
    v_cand_4  UUID := 'c0000000-0000-0000-0000-000000000004';
    v_cand_5  UUID := 'c0000000-0000-0000-0000-000000000005';
    v_cand_6  UUID := 'c0000000-0000-0000-0000-000000000006';
    v_cand_7  UUID := 'c0000000-0000-0000-0000-000000000007';
    v_cand_8  UUID := 'c0000000-0000-0000-0000-000000000008';
    v_cand_9  UUID := 'c0000000-0000-0000-0000-000000000009';
    v_cand_10 UUID := 'c0000000-0000-0000-0000-000000000010';
    v_cand_11 UUID := 'c0000000-0000-0000-0000-000000000011';
    v_cand_12 UUID := 'c0000000-0000-0000-0000-000000000012';
    v_cand_13 UUID := 'c0000000-0000-0000-0000-000000000013';
    v_cand_14 UUID := 'c0000000-0000-0000-0000-000000000014';
    v_cand_15 UUID := 'c0000000-0000-0000-0000-000000000015';

    -- Openings Fixed UUIDs
    v_open_1 UUID := 'b0000000-0000-0000-0000-000000000001'; -- Senior Frontend Engineer
    v_open_2 UUID := 'b0000000-0000-0000-0000-000000000002'; -- Backend Engineer
    v_open_3 UUID := 'b0000000-0000-0000-0000-000000000003'; -- Product Designer

    -- Applications Fixed UUIDs
    v_app_1  UUID := 'a0000000-0000-0000-0000-000000000001'; -- Aarav Sharma
    v_app_2  UUID := 'a0000000-0000-0000-0000-000000000002'; -- Riya Mehta
    v_app_3  UUID := 'a0000000-0000-0000-0000-000000000003'; -- Aditya Verma
    v_app_4  UUID := 'a0000000-0000-0000-0000-000000000004'; -- Ananya Patel
    v_app_5  UUID := 'a0000000-0000-0000-0000-000000000005'; -- Rahul Singh
    v_app_6  UUID := 'a0000000-0000-0000-0000-000000000006'; -- Sneha Joshi
    v_app_7  UUID := 'a0000000-0000-0000-0000-000000000007'; -- Karan Gupta
    v_app_8  UUID := 'a0000000-0000-0000-0000-000000000008'; -- Neha Kulkarni
    v_app_9  UUID := 'a0000000-0000-0000-0000-000000000009'; -- Arjun Rao
    v_app_10 UUID := 'a0000000-0000-0000-0000-000000000010'; -- Ishita Shah
    v_app_11 UUID := 'a0000000-0000-0000-0000-000000000011'; -- Yash Malhotra
    v_app_12 UUID := 'a0000000-0000-0000-0000-000000000012'; -- Priya Nair
    v_app_13 UUID := 'a0000000-0000-0000-0000-000000000013'; -- Vikram Desai
    v_app_14 UUID := 'a0000000-0000-0000-0000-000000000014'; -- Meera Iyer
    v_app_15 UUID := 'a0000000-0000-0000-0000-000000000015'; -- Dev Kapoor

    v_all_apps UUID[] := ARRAY[
        v_app_1, v_app_2, v_app_3, v_app_4, v_app_5,
        v_app_6, v_app_7, v_app_8, v_app_9, v_app_10,
        v_app_11, v_app_12, v_app_13, v_app_14, v_app_15
    ];

    -- Company & Department Variables
    v_company_id     UUID;
    v_eng_dept_id    UUID;
    v_design_dept_id UUID;
    v_encrypted_pwd  TEXT;
    v_col            TEXT;

BEGIN
    -- Common encrypted password hash for "Demo@12345"
    v_encrypted_pwd := extensions.crypt('Demo@12345', extensions.gen_salt('bf'));

    -- ==============================================================================
    -- 1. AUTH ACCOUNTS (auth.users & auth.identities)
    -- Must be inserted first so profiles can reference auth.users(id)
    -- ==============================================================================
    -- 1.1 Recruiter: recruiter@gmail.com
    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password,
        email_confirmed_at, created_at, updated_at,
        raw_app_meta_data, raw_user_meta_data, is_super_admin
    ) VALUES (
        v_recruiter_id,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        'recruiter@gmail.com',
        v_encrypted_pwd,
        NOW(), NOW(), NOW(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        '{"name":"Demo Recruiter","role":"recruiter"}'::jsonb,
        false
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        encrypted_password = EXCLUDED.encrypted_password,
        email_confirmed_at = NOW(),
        raw_user_meta_data = EXCLUDED.raw_user_meta_data;

    DELETE FROM auth.identities WHERE user_id = v_recruiter_id;
    INSERT INTO auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    VALUES (
        gen_random_uuid(),
        v_recruiter_id::text,
        v_recruiter_id,
        jsonb_build_object('sub', v_recruiter_id::text, 'email', 'recruiter@gmail.com'),
        'email',
        NOW(), NOW(), NOW()
    );

    -- 1.2 Interviewer: interviewer@gmail.com
    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password,
        email_confirmed_at, created_at, updated_at,
        raw_app_meta_data, raw_user_meta_data, is_super_admin
    ) VALUES (
        v_interviewer_id,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        'interviewer@gmail.com',
        v_encrypted_pwd,
        NOW(), NOW(), NOW(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        '{"name":"Demo Interviewer","role":"interviewer"}'::jsonb,
        false
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        encrypted_password = EXCLUDED.encrypted_password,
        email_confirmed_at = NOW(),
        raw_user_meta_data = EXCLUDED.raw_user_meta_data;

    DELETE FROM auth.identities WHERE user_id = v_interviewer_id;
    INSERT INTO auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    VALUES (
        gen_random_uuid(),
        v_interviewer_id::text,
        v_interviewer_id,
        jsonb_build_object('sub', v_interviewer_id::text, 'email', 'interviewer@gmail.com'),
        'email',
        NOW(), NOW(), NOW()
    );

    -- 1.3 Student: student@gmail.com (Candidate 1: Aarav Sharma)
    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password,
        email_confirmed_at, created_at, updated_at,
        raw_app_meta_data, raw_user_meta_data, is_super_admin
    ) VALUES (
        v_student_id,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        'student@gmail.com',
        v_encrypted_pwd,
        NOW(), NOW(), NOW(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        '{"name":"Aarav Sharma","role":"student"}'::jsonb,
        false
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        encrypted_password = EXCLUDED.encrypted_password,
        email_confirmed_at = NOW(),
        raw_user_meta_data = EXCLUDED.raw_user_meta_data;

    DELETE FROM auth.identities WHERE user_id = v_student_id;
    INSERT INTO auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    VALUES (
        gen_random_uuid(),
        v_student_id::text,
        v_student_id,
        jsonb_build_object('sub', v_student_id::text, 'email', 'student@gmail.com'),
        'email',
        NOW(), NOW(), NOW()
    );

    -- 1.4 Candidates 2 to 15 Student Auth Users
    INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin)
    VALUES
        (v_cand_2,  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'riya.mehta@example.com',    v_encrypted_pwd, NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}'::jsonb, '{"name":"Riya Mehta","role":"student"}'::jsonb, false),
        (v_cand_3,  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'aditya.verma@example.com',  v_encrypted_pwd, NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}'::jsonb, '{"name":"Aditya Verma","role":"student"}'::jsonb, false),
        (v_cand_4,  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ananya.patel@example.com',  v_encrypted_pwd, NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}'::jsonb, '{"name":"Ananya Patel","role":"student"}'::jsonb, false),
        (v_cand_5,  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rahul.singh@example.com',   v_encrypted_pwd, NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}'::jsonb, '{"name":"Rahul Singh","role":"student"}'::jsonb, false),
        (v_cand_6,  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'sneha.joshi@example.com',   v_encrypted_pwd, NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}'::jsonb, '{"name":"Sneha Joshi","role":"student"}'::jsonb, false),
        (v_cand_7,  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'karan.gupta@example.com',   v_encrypted_pwd, NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}'::jsonb, '{"name":"Karan Gupta","role":"student"}'::jsonb, false),
        (v_cand_8,  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'neha.kulkarni@example.com', v_encrypted_pwd, NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}'::jsonb, '{"name":"Neha Kulkarni","role":"student"}'::jsonb, false),
        (v_cand_9,  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'arjun.rao@example.com',     v_encrypted_pwd, NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}'::jsonb, '{"name":"Arjun Rao","role":"student"}'::jsonb, false),
        (v_cand_10, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ishita.shah@example.com',   v_encrypted_pwd, NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}'::jsonb, '{"name":"Ishita Shah","role":"student"}'::jsonb, false),
        (v_cand_11, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'yash.malhotra@example.com', v_encrypted_pwd, NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}'::jsonb, '{"name":"Yash Malhotra","role":"student"}'::jsonb, false),
        (v_cand_12, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'priya.nair@example.com',    v_encrypted_pwd, NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}'::jsonb, '{"name":"Priya Nair","role":"student"}'::jsonb, false),
        (v_cand_13, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'vikram.desai@example.com',  v_encrypted_pwd, NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}'::jsonb, '{"name":"Vikram Desai","role":"student"}'::jsonb, false),
        (v_cand_14, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'meera.iyer@example.com',    v_encrypted_pwd, NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}'::jsonb, '{"name":"Meera Iyer","role":"student"}'::jsonb, false),
        (v_cand_15, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'dev.kapoor@example.com',    v_encrypted_pwd, NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}'::jsonb, '{"name":"Dev Kapoor","role":"student"}'::jsonb, false)
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        encrypted_password = EXCLUDED.encrypted_password,
        raw_user_meta_data = EXCLUDED.raw_user_meta_data;

    -- 1.5 Fix GoTrue NULL to string scan errors for manually seeded auth.users
    -- GoTrue expects string token columns in auth.users to be '' instead of NULL.
    -- If NULL, Go's sql.Scan throws "converting NULL to string is unsupported",
    -- which causes Supabase signInWithPassword to fail with "Database error querying schema".
    FOR v_col IN 
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'auth' 
          AND table_name = 'users' 
          AND data_type IN ('text', 'character varying')
          AND is_nullable = 'YES'
          AND is_generated = 'NEVER'
          AND column_name IN (
              'confirmation_token',
              'recovery_token',
              'email_change_token_new',
              'email_change',
              'email_change_token_current',
              'phone_change',
              'phone_change_token',
              'reauthentication_token'
          )
    LOOP
        EXECUTE format('UPDATE auth.users SET %I = '''' WHERE %I IS NULL', v_col, v_col);
    END LOOP;

    -- ==============================================================================
    -- 2. PUBLIC PROFILES
    -- Must be inserted before departments and memberships so foreign keys resolve
    -- Columns: id, role, name, age, sex, university_name, company_name, job_title
    -- ==============================================================================
    -- Recruiter profile
    INSERT INTO public.profiles (id, name, role, company_name, job_title)
    VALUES (v_recruiter_id, 'Demo Recruiter', 'recruiter', 'TCS', 'Talent Acquisition Lead')
    ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role, company_name = EXCLUDED.company_name, job_title = EXCLUDED.job_title;

    -- Interviewer profile
    INSERT INTO public.profiles (id, name, role, company_name, job_title)
    VALUES (v_interviewer_id, 'Demo Interviewer', 'interviewer', 'TCS', 'Senior Engineering Lead')
    ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role, company_name = EXCLUDED.company_name, job_title = EXCLUDED.job_title;

    -- Student profiles (15 Candidates)
    INSERT INTO public.profiles (id, name, role, university_name, age, sex)
    VALUES
        (v_student_id, 'Aarav Sharma',   'student', 'IIT Bombay',      23, 'Male'),
        (v_cand_2,     'Riya Mehta',     'student', 'BITS Pilani',     22, 'Female'),
        (v_cand_3,     'Aditya Verma',   'student', 'IIT Delhi',       24, 'Male'),
        (v_cand_4,     'Ananya Patel',   'student', 'NIT Trichy',      21, 'Female'),
        (v_cand_5,     'Rahul Singh',    'student', 'DTU Delhi',       23, 'Male'),
        (v_cand_6,     'Sneha Joshi',    'student', 'IIT Madras',      25, 'Female'),
        (v_cand_7,     'Karan Gupta',    'student', 'IIIT Hyderabad',  24, 'Male'),
        (v_cand_8,     'Neha Kulkarni',  'student', 'COEP Pune',       23, 'Female'),
        (v_cand_9,     'Arjun Rao',      'student', 'RVCE Bangalore',  22, 'Male'),
        (v_cand_10,    'Ishita Shah',    'student', 'VJTI Mumbai',     22, 'Female'),
        (v_cand_11,    'Yash Malhotra',  'student', 'NID Ahmedabad',   25, 'Male'),
        (v_cand_12,    'Priya Nair',     'student', 'IDC IIT Bombay',  24, 'Female'),
        (v_cand_13,    'Vikram Desai',   'student', 'Srishti Design',  26, 'Male'),
        (v_cand_14,    'Meera Iyer',     'student', 'MIT Institute',   22, 'Female'),
        (v_cand_15,    'Dev Kapoor',     'student', 'NIFT New Delhi',  23, 'Male')
    ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        role = EXCLUDED.role,
        university_name = EXCLUDED.university_name,
        age = EXCLUDED.age,
        sex = EXCLUDED.sex;

    -- ==============================================================================
    -- 3. COMPANY RESOLUTION: Prioritize existing "TCS", fallback to first or create
    -- ==============================================================================
    SELECT id INTO v_company_id 
    FROM public.companies 
    WHERE name ILIKE '%TCS%' 
    ORDER BY created_at ASC 
    LIMIT 1;

    IF v_company_id IS NULL THEN
        SELECT id INTO v_company_id 
        FROM public.companies 
        ORDER BY created_at ASC 
        LIMIT 1;
    END IF;

    IF v_company_id IS NULL THEN
        INSERT INTO public.companies (name, slug)
        VALUES ('TCS', 'tcs')
        ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
        RETURNING id INTO v_company_id;
    END IF;

    -- Recruiter company membership
    INSERT INTO public.recruiter_company_memberships (recruiter_id, company_id, status)
    VALUES (v_recruiter_id, v_company_id, 'active')
    ON CONFLICT (recruiter_id, company_id) DO UPDATE SET status = EXCLUDED.status;

    -- ==============================================================================
    -- 4. DEPARTMENTS SETUP (Includes NOT NULL recruiter_id & company_id)
    -- ==============================================================================
    SELECT id INTO v_eng_dept_id 
    FROM public.departments 
    WHERE company_id = v_company_id AND lower(name) = 'engineering' 
    LIMIT 1;

    IF v_eng_dept_id IS NULL THEN
        INSERT INTO public.departments (name, company_id, recruiter_id)
        VALUES ('Engineering', v_company_id, v_recruiter_id)
        RETURNING id INTO v_eng_dept_id;
    END IF;

    SELECT id INTO v_design_dept_id 
    FROM public.departments 
    WHERE company_id = v_company_id AND lower(name) = 'design' 
    LIMIT 1;

    IF v_design_dept_id IS NULL THEN
        INSERT INTO public.departments (name, company_id, recruiter_id)
        VALUES ('Design', v_company_id, v_recruiter_id)
        RETURNING id INTO v_design_dept_id;
    END IF;

    -- ==============================================================================
    -- 5. INTERVIEWER COMPANY MEMBERSHIPS & DEPARTMENT TEAMS
    -- ==============================================================================
    -- (a) Company-wide active membership (department_id IS NULL)
    INSERT INTO public.interviewer_company_memberships (interviewer_id, company_id, department_id, status)
    VALUES (v_interviewer_id, v_company_id, NULL, 'active')
    ON CONFLICT (interviewer_id, company_id) WHERE department_id IS NULL 
    DO UPDATE SET status = 'active';

    -- (b) Department specific memberships
    INSERT INTO public.interviewer_company_memberships (interviewer_id, company_id, department_id, status)
    VALUES 
        (v_interviewer_id, v_company_id, v_eng_dept_id, 'active'),
        (v_interviewer_id, v_company_id, v_design_dept_id, 'active')
    ON CONFLICT (interviewer_id, company_id, department_id) WHERE department_id IS NOT NULL 
    DO UPDATE SET status = 'active';

    -- Department team members
    INSERT INTO public.department_members (department_id, user_id)
    VALUES 
        (v_eng_dept_id, v_recruiter_id),
        (v_eng_dept_id, v_interviewer_id),
        (v_design_dept_id, v_recruiter_id),
        (v_design_dept_id, v_interviewer_id)
    ON CONFLICT (department_id, user_id) DO NOTHING;

    -- ==============================================================================
    -- 6. JOB OPENINGS (3 Active Positions)
    -- ==============================================================================
    -- 6.1 Senior Frontend Engineer (Engineering)
    INSERT INTO public.openings (
        id, company_id, recruiter_id, title, department, description, status, type,
        details, requirements, skills, application_materials
    ) VALUES (
        v_open_1,
        v_company_id,
        v_recruiter_id,
        'Senior Frontend Engineer',
        'Engineering',
        'We are looking for a Senior Frontend Engineer to build modern, high-performance web applications using React, Next.js, and TypeScript. You will architect robust UI components, optimize Core Web Vitals, and collaborate closely with product design.',
        'open',
        'Full-time',
        '[{"title":"Location","content":"Remote"},{"title":"Team","content":"Core Web Platform"},{"title":"Level","content":"Senior (IC4)"}]'::jsonb,
        '["4+ years of production experience with modern React & TypeScript","Deep understanding of browser performance, SSR, and Next.js App Router","Experience building accessible, responsive design systems","Strong testing culture with Jest, Playwright, or Cypress"]'::jsonb,
        '["React","Next.js","TypeScript","Tailwind CSS","Performance Tuning"]'::jsonb,
        '{"resume":{"enabled":true,"required":true},"portfolio":{"enabled":true,"required":false},"cover_letter":{"enabled":true,"required":false}}'::jsonb
    )
    ON CONFLICT (id) DO UPDATE SET
        company_id = EXCLUDED.company_id,
        recruiter_id = EXCLUDED.recruiter_id,
        title = EXCLUDED.title,
        department = EXCLUDED.department,
        description = EXCLUDED.description,
        status = EXCLUDED.status,
        type = EXCLUDED.type,
        details = EXCLUDED.details,
        requirements = EXCLUDED.requirements,
        skills = EXCLUDED.skills;

    -- 6.2 Backend Engineer (Engineering)
    INSERT INTO public.openings (
        id, company_id, recruiter_id, title, department, description, status, type,
        details, requirements, skills, application_materials
    ) VALUES (
        v_open_2,
        v_company_id,
        v_recruiter_id,
        'Backend Engineer',
        'Engineering',
        'Join our backend infrastructure team to design scalable distributed microservices, reliable database schemas, and resilient APIs. You will work on PostgreSQL query optimization, Redis caching patterns, and high-throughput background processing.',
        'open',
        'Full-time',
        '[{"title":"Location","content":"Remote"},{"title":"Team","content":"Distributed Data Systems"},{"title":"Level","content":"Mid-Senior (IC3)"}]'::jsonb,
        '["3+ years experience with Node.js, Python, or Go in production","Solid understanding of relational database modeling and PostgreSQL performance","Familiarity with event-driven architectures and message brokers (Kafka/RabbitMQ)","Experience deploying containerized services with Docker and Kubernetes"]'::jsonb,
        '["PostgreSQL","Node.js","Go","Redis","Docker","Distributed Systems"]'::jsonb,
        '{"resume":{"enabled":true,"required":true},"portfolio":{"enabled":true,"required":false},"cover_letter":{"enabled":true,"required":false}}'::jsonb
    )
    ON CONFLICT (id) DO UPDATE SET
        company_id = EXCLUDED.company_id,
        recruiter_id = EXCLUDED.recruiter_id,
        title = EXCLUDED.title,
        department = EXCLUDED.department,
        description = EXCLUDED.description,
        status = EXCLUDED.status,
        type = EXCLUDED.type,
        details = EXCLUDED.details,
        requirements = EXCLUDED.requirements,
        skills = EXCLUDED.skills;

    -- 6.3 Product Designer (Design)
    INSERT INTO public.openings (
        id, company_id, recruiter_id, title, department, description, status, type,
        details, requirements, skills, application_materials
    ) VALUES (
        v_open_3,
        v_company_id,
        v_recruiter_id,
        'Product Designer',
        'Design',
        'We are seeking a Product Designer to craft intuitive user experiences, refined design systems, and delightful micro-interactions. You will conduct user research, deliver interactive Figma prototypes, and partner with engineers for seamless implementation.',
        'open',
        'Full-time',
        '[{"title":"Location","content":"Remote"},{"title":"Team","content":"Product Design & UX"},{"title":"Level","content":"Mid-Senior"}]'::jsonb,
        '["3+ years designing complex B2B SaaS applications or consumer products","Mastery of Figma, auto-layout, design tokens, and component libraries","Strong portfolio showcasing end-to-end product thinking from problem discovery to polish","Excellent communication and ability to present design rationale to stakeholders"]'::jsonb,
        '["Figma","Design Systems","UI/UX","User Research","Prototyping","WCAG"]'::jsonb,
        '{"resume":{"enabled":true,"required":true},"portfolio":{"enabled":true,"required":true},"cover_letter":{"enabled":true,"required":false}}'::jsonb
    )
    ON CONFLICT (id) DO UPDATE SET
        company_id = EXCLUDED.company_id,
        recruiter_id = EXCLUDED.recruiter_id,
        title = EXCLUDED.title,
        department = EXCLUDED.department,
        description = EXCLUDED.description,
        status = EXCLUDED.status,
        type = EXCLUDED.type,
        details = EXCLUDED.details,
        requirements = EXCLUDED.requirements,
        skills = EXCLUDED.skills;

    -- ==============================================================================
    -- 7. CLEAN IDEMPOTENT RESET FOR DEMO APPLICATIONS
    -- ==============================================================================
    -- Delete child dependencies in correct foreign key order so re-runs start clean
    DELETE FROM public.alert_dismissals WHERE application_id = ANY(v_all_apps);
    DELETE FROM public.interviews WHERE application_id = ANY(v_all_apps);
    DELETE FROM public.application_interviewers WHERE application_id = ANY(v_all_apps);
    DELETE FROM public.documents WHERE application_id = ANY(v_all_apps);
    DELETE FROM public.application_history WHERE application_id = ANY(v_all_apps);
    DELETE FROM public.applications WHERE id = ANY(v_all_apps);

    -- ==============================================================================
    -- 8. NATURAL LIFECYCLE STEP 1: INITIAL INSERTION AT "applied" STAGE
    -- Triggers log_application_changes_trigger to naturally create "application_created"
    -- ==============================================================================
    INSERT INTO public.applications (
        id, student_id, opening_id, stage, candidate_name, candidate_email, candidate_responses, notes, created_at, updated_at
    ) VALUES
        -- Opening 1: Senior Frontend Engineer
        (v_app_1, v_student_id, v_open_1, 'applied', 'Aarav Sharma', 'aarav.sharma@example.com',
         '{"portfolio":"https://github.com/aaravsharma","cover_letter":"Passionate frontend engineer excited about modern React architectures.","questions":[{"title":"Why do you want to join?","answer":"To contribute to scalable UI design systems and build delightful interfaces."},{"title":"Years of relevant experience","answer":"3 years"},{"title":"Key technical strengths","answer":"React, TypeScript, Next.js, Tailwind CSS"}]}'::jsonb,
         'Top candidate from IIT Bombay. Strong frontend fundamentals and crisp portfolio demonstration.',
         NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days'),

        (v_app_2, v_cand_2, v_open_1, 'applied', 'Riya Mehta', 'riya.mehta@example.com',
         '{"portfolio":"https://github.com/riyamehta","cover_letter":"Frontend developer with deep interest in web accessibility and design systems.","questions":[{"title":"Why do you want to join?","answer":"Excited by the engineering team culture and focus on product quality."},{"title":"Years of relevant experience","answer":"2 years"},{"title":"Key technical strengths","answer":"TypeScript, CSS Architecture, React State Management"}]}'::jsonb,
         'Completed technical coding exercise with flying colors. Very communicative and structured.',
         NOW() - INTERVAL '11 days', NOW() - INTERVAL '11 days'),

        (v_app_3, v_cand_3, v_open_1, 'applied', 'Aditya Verma', 'aditya.verma@example.com',
         '{"portfolio":"https://adityaverma.dev","cover_letter":"Experienced React developer with a track record of optimizing page speed.","questions":[{"title":"Why do you want to join?","answer":"Looking for an impactful engineering role with high autonomy."},{"title":"Years of relevant experience","answer":"4 years"},{"title":"Key technical strengths","answer":"Web Vitals Optimization, SSR, Next.js, Micro-frontends"}]}'::jsonb,
         'Screening completed two weeks ago. Follow up with team needed.',
         NOW() - INTERVAL '16 days', NOW() - INTERVAL '16 days'),

        (v_app_4, v_cand_4, v_open_1, 'applied', 'Ananya Patel', 'ananya.patel@example.com',
         '{"portfolio":"https://github.com/ananyapatel","cover_letter":"Motivated engineer eager to craft responsive and intuitive web products.","questions":[{"title":"Why do you want to join?","answer":"Great reputation for mentoring junior and mid-level engineers."},{"title":"Years of relevant experience","answer":"1 year"},{"title":"Key technical strengths","answer":"JavaScript, React, Tailwind CSS"}]}'::jsonb,
         'Application received. Resume matches requirements well.',
         NOW() - INTERVAL '13 days', NOW() - INTERVAL '13 days'),

        (v_app_5, v_cand_5, v_open_1, 'applied', 'Rahul Singh', 'rahul.singh@example.com',
         '{"portfolio":"https://github.com/rahulsingh","cover_letter":"Frontend engineer with focus on client-side rendering.","questions":[{"title":"Why do you want to join?","answer":"Interested in building enterprise scale interfaces."},{"title":"Years of relevant experience","answer":"2 years"},{"title":"Key technical strengths","answer":"HTML/CSS, JavaScript, React"}]}'::jsonb,
         'Lacks necessary production TypeScript depth required for this senior position.',
         NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days'),

        -- Opening 2: Backend Engineer
        (v_app_6, v_cand_6, v_open_2, 'applied', 'Sneha Joshi', 'sneha.joshi@example.com',
         '{"portfolio":"https://github.com/snehajoshi","cover_letter":"Systems engineer passionate about PostgreSQL internals and distributed consensus.","questions":[{"title":"Why do you want to join?","answer":"To build mission-critical distributed systems and solve throughput challenges."},{"title":"Years of relevant experience","answer":"5 years"},{"title":"Key technical strengths","answer":"Go, PostgreSQL, Redis, Kubernetes, Distributed Systems"}]}'::jsonb,
         'Outstanding performance across all interview loops. Offer accepted! Ready for onboarding.',
         NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days'),

        (v_app_7, v_cand_7, v_open_2, 'applied', 'Karan Gupta', 'karan.gupta@example.com',
         '{"portfolio":"https://github.com/karangupta","cover_letter":"Backend engineer with background in API gateways and cloud architecture.","questions":[{"title":"Why do you want to join?","answer":"Strong alignment with your technological stack and engineering standards."},{"title":"Years of relevant experience","answer":"4 years"},{"title":"Key technical strengths","answer":"FastAPI, PostgreSQL, Redis, Kafka"}]}'::jsonb,
         'Demonstrated exceptional backend architecture knowledge during the system design session.',
         NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),

        (v_app_8, v_cand_8, v_open_2, 'applied', 'Neha Kulkarni', 'neha.kulkarni@example.com',
         '{"portfolio":"https://github.com/nehakulkarni","cover_letter":"Software engineer specializing in data pipelines and relational schemas.","questions":[{"title":"Why do you want to join?","answer":"Want to tackle complex database modeling problems at scale."},{"title":"Years of relevant experience","answer":"2 years"},{"title":"Key technical strengths","answer":"Java, Spring Boot, PostgreSQL, Kafka"}]}'::jsonb,
         'Solid initial phone screening. Advancing through pipeline.',
         NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days'),

        (v_app_9, v_cand_9, v_open_2, 'applied', 'Arjun Rao', 'arjun.rao@example.com',
         '{"portfolio":"https://github.com/arjunrao","cover_letter":"Junior backend engineer enthusiastic about Node.js microservices.","questions":[{"title":"Why do you want to join?","answer":"To learn best backend engineering practices from senior mentors."},{"title":"Years of relevant experience","answer":"1 year"},{"title":"Key technical strengths","answer":"Node.js, Express, MongoDB, REST"}]}'::jsonb,
         NULL,
         NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days'),

        (v_app_10, v_cand_10, v_open_2, 'applied', 'Ishita Shah', 'ishita.shah@example.com',
         '{"portfolio":"https://github.com/ishitashah","cover_letter":"Fullstack developer transitioning into dedicated backend engineering.","questions":[{"title":"Why do you want to join?","answer":"Excited to deepen expertise in high-concurrency backend services."},{"title":"Years of relevant experience","answer":"2 years"},{"title":"Key technical strengths","answer":"Python, Django, PostgreSQL"}]}'::jsonb,
         'Candidate rejected due to mismatch in required concurrency experience.',
         NOW() - INTERVAL '9 days', NOW() - INTERVAL '9 days'),

        -- Opening 3: Product Designer
        (v_app_11, v_cand_11, v_open_3, 'applied', 'Yash Malhotra', 'yash.malhotra@example.com',
         '{"portfolio":"https://yashmalhotra.design","cover_letter":"Product designer passionate about typography, spacing, and cohesive design systems.","questions":[{"title":"Why do you want to join?","answer":"To elevate product UX and lead the company design system evolution."},{"title":"Years of relevant experience","answer":"4 years"},{"title":"Key technical strengths","answer":"Figma, Design Tokens, Design Systems, User Research"}]}'::jsonb,
         'Incredible portfolio of clean B2B software interfaces. Offer extended with positive verbal confirmation.',
         NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days'),

        (v_app_12, v_cand_12, v_open_3, 'applied', 'Priya Nair', 'priya.nair@example.com',
         '{"portfolio":"https://priyanair.design","cover_letter":"Interaction designer focused on complex enterprise workflows.","questions":[{"title":"Why do you want to join?","answer":"Love simplifying complicated workflows into clean, intuitive products."},{"title":"Years of relevant experience","answer":"3 years"},{"title":"Key technical strengths","answer":"Figma, Prototyping, Wireframing, User Testing"}]}'::jsonb,
         'Completed portfolio presentation. Panel impressed with UX discovery process.',
         NOW() - INTERVAL '9 days', NOW() - INTERVAL '9 days'),

        (v_app_13, v_cand_13, v_open_3, 'applied', 'Vikram Desai', 'vikram.desai@example.com',
         '{"portfolio":"https://vikramdesai.design","cover_letter":"Senior visual designer specializing in design system components.","questions":[{"title":"Why do you want to join?","answer":"To build cohesive, accessible interfaces for global users."},{"title":"Years of relevant experience","answer":"5 years"},{"title":"Key technical strengths","answer":"Visual Design, Design Systems, Token Architecture"}]}'::jsonb,
         'Strong visual presentation skills. Technical evaluation round complete.',
         NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days'),

        (v_app_14, v_cand_14, v_open_3, 'applied', 'Meera Iyer', 'meera.iyer@example.com',
         '{"portfolio":"https://meera.design","cover_letter":"Passionate UI designer crafting delightful interactions.","questions":[{"title":"Why do you want to join?","answer":"To collaborate closely with product and engineering teams."},{"title":"Years of relevant experience","answer":"1 year"},{"title":"Key technical strengths","answer":"UI Design, Figma, Micro-interactions"}]}'::jsonb,
         'Promising junior portfolio. Screening completed.',
         NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days'),

        (v_app_15, v_cand_15, v_open_3, 'applied', 'Dev Kapoor', 'dev.kapoor@example.com',
         '{"portfolio":"https://devkapoor.design","cover_letter":"UX researcher and designer dedicated to user-first methodologies.","questions":[{"title":"Why do you want to join?","answer":"Excited to conduct deep qualitative and quantitative user research."},{"title":"Years of relevant experience","answer":"2 years"},{"title":"Key technical strengths","answer":"User Research, Usability Testing, Figma"}]}'::jsonb,
         NULL,
         NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days');

    -- ==============================================================================
    -- 9. NATURAL LIFECYCLE STEP 2: STAGE PROGRESSIONS VIA NATURAL UPDATES
    -- The trigger automatically logs "stage_changed" and "application_rejected"
    -- ==============================================================================

    -- Phase A: Move candidates to "screening"
    UPDATE public.applications 
    SET stage = 'screening' 
    WHERE id IN (v_app_1, v_app_2, v_app_3, v_app_5, v_app_6, v_app_7, v_app_8, v_app_11, v_app_12, v_app_13, v_app_14);

    -- Phase B: Reject candidate 5 from screening
    UPDATE public.applications 
    SET stage = 'rejected' 
    WHERE id = v_app_5;

    -- Phase C: Reject candidate 10 directly from applied
    UPDATE public.applications 
    SET stage = 'rejected' 
    WHERE id = v_app_10;

    -- Phase D: Move candidates to "interview"
    UPDATE public.applications 
    SET stage = 'interview' 
    WHERE id IN (v_app_1, v_app_2, v_app_6, v_app_7, v_app_11, v_app_12, v_app_13);

    -- Phase E: Move candidates to "offer"
    UPDATE public.applications 
    SET stage = 'offer' 
    WHERE id IN (v_app_1, v_app_6, v_app_11);

    -- Phase F: Move candidate 6 to "hired" (Sneha Joshi - Hired this month!)
    UPDATE public.applications 
    SET stage = 'hired' 
    WHERE id = v_app_6;

    -- ==============================================================================
    -- 10. INTERVIEWER PANEL ASSIGNMENTS (5 Candidates)
    -- Trigger log_interviewer_assignment_trigger automatically logs "interviewer_assigned"
    -- ==============================================================================
    INSERT INTO public.application_interviewers (application_id, interviewer_id)
    VALUES 
        (v_app_1,  v_interviewer_id), -- Aarav Sharma (Offer)
        (v_app_2,  v_interviewer_id), -- Riya Mehta (Interview)
        (v_app_7,  v_interviewer_id), -- Karan Gupta (Interview)
        (v_app_12, v_interviewer_id), -- Priya Nair (Interview)
        (v_app_13, v_interviewer_id)  -- Vikram Desai (Interview)
    ON CONFLICT (application_id, interviewer_id) DO NOTHING;

    -- ==============================================================================
    -- 11. INTERVIEWER EVALUATION FEEDBACK (3 Candidates)
    -- Inserted with event_type 'feedback_submitted' matching getInterviewHistory queries
    -- ==============================================================================
    INSERT INTO public.application_history (application_id, actor_id, event_type, details, created_at)
    VALUES
        (v_app_7, v_interviewer_id, 'feedback_submitted',
         jsonb_build_object(
             'rating', 'Strong Yes',
             'interviewer_name', 'Demo Interviewer',
             'feedback', 'Technical Competence: Exceptional grasp of distributed system design, PostgreSQL query execution plans, and Redis caching. Handled failure scenario simulations with great poise. Communication: Crisp, structured, and clear. Cultural Fit: Strong team-first mindset and high ownership.'
         ),
         NOW() - INTERVAL '3 days'),

        (v_app_12, v_interviewer_id, 'feedback_submitted',
         jsonb_build_object(
             'rating', 'Yes',
             'interviewer_name', 'Demo Interviewer',
             'feedback', 'Technical Competence: Strong Figma mastery, comprehensive component architecture, and solid design token knowledge. Handled responsive breakpoint trade-offs well. Problem Solving: Thoughtful user-journey edge case considerations. Cultural Fit: Eager to collaborate with engineering.'
         ),
         NOW() - INTERVAL '4 days'),

        (v_app_13, v_interviewer_id, 'feedback_submitted',
         jsonb_build_object(
             'rating', 'Mixed',
             'interviewer_name', 'Demo Interviewer',
             'feedback', 'Technical Competence: Outstanding visual aesthetic and polished high-fidelity layouts. Weakness: Slightly struggled with accessibility guidelines (WCAG 2.1 AA) and developer handoff specs. Recommend an additional pair-design round before final decision.'
         ),
         NOW() - INTERVAL '2 days');

    -- ==============================================================================
    -- 12. SCHEDULED INTERVIEWS (1 Upcoming, 1 Recent Past)
    -- ==============================================================================
    INSERT INTO public.interviews (id, application_id, scheduled_at, created_at, updated_at)
    VALUES
        ('f0000000-0000-0000-0000-000000000001', v_app_2, NOW() + INTERVAL '2 days 4 hours', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
        ('f0000000-0000-0000-0000-000000000002', v_app_7, NOW() - INTERVAL '1 day 3 hours', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days')
    ON CONFLICT (id) DO UPDATE SET
        application_id = EXCLUDED.application_id,
        scheduled_at = EXCLUDED.scheduled_at;

    -- ==============================================================================
    -- 13. STALLED APPLICATION ALERTS
    -- Update stage_updated_at >10 days ago (without changing stage, so trigger doesn't overwrite)
    -- ==============================================================================
    UPDATE public.applications 
    SET stage_updated_at = NOW() - INTERVAL '14 days' 
    WHERE id = v_app_3; -- Aditya Verma (Screening, 14 days stalled)

    UPDATE public.applications 
    SET stage_updated_at = NOW() - INTERVAL '12 days' 
    WHERE id = v_app_4; -- Ananya Patel (Applied, 12 days stalled)

    -- ==============================================================================
    -- 14. CANDIDATE RESUME DOCUMENTS
    -- ==============================================================================
    INSERT INTO public.documents (student_id, application_id, type, storage_path, filename, content_type)
    VALUES
        (v_student_id, v_app_1,  'resume', 'https://yysuatdvkvstpmqsjaxq.supabase.co/storage/v1/object/sign/application-documents/dc37f43d-4252-4993-8176-267ab1f80851/e6edc7ba-ff3b-457a-9b09-183172ae9a0a.pdf?token=eyJraWQiOiIxMDMzMjFiYi1lNWUzLTQxMjYtYjlkNy00MGIwNDA3MDdmYTYiLCJhbGciOiJIUzUxMiJ9.eyJ1cmwiOiJhcHBsaWNhdGlvbi1kb2N1bWVudHMvZGMzN2Y0M2QtNDI1Mi00OTkzLTgxNzYtMjY3YWIxZjgwODUxL2U2ZWRjN2JhLWZmM2ItNDU3YS05YjA5LTE4MzE3MmFlOWEwYS5wZGYiLCJzY29wZSI6ImRvd25sb2FkIiwiaWF0IjoxNzg4NTQ3MTg4LCJleHAiOjE4MjAwODMxODh9.Oyz2i79e63xMEe5AaP3lyz3ZoZH9x_l8K5UbbdZQSu55TYev_OxuGLxZVChsAStaJqZSwoaD8t4hjQJrBFNmeg',   'Aarav_Sharma_Resume.pdf',   'application/pdf'),
        (v_cand_2,     v_app_2,  'resume', 'https://yysuatdvkvstpmqsjaxq.supabase.co/storage/v1/object/sign/application-documents/dc37f43d-4252-4993-8176-267ab1f80851/e6edc7ba-ff3b-457a-9b09-183172ae9a0a.pdf?token=eyJraWQiOiIxMDMzMjFiYi1lNWUzLTQxMjYtYjlkNy00MGIwNDA3MDdmYTYiLCJhbGciOiJIUzUxMiJ9.eyJ1cmwiOiJhcHBsaWNhdGlvbi1kb2N1bWVudHMvZGMzN2Y0M2QtNDI1Mi00OTkzLTgxNzYtMjY3YWIxZjgwODUxL2U2ZWRjN2JhLWZmM2ItNDU3YS05YjA5LTE4MzE3MmFlOWEwYS5wZGYiLCJzY29wZSI6ImRvd25sb2FkIiwiaWF0IjoxNzg4NTQ3MTg4LCJleHAiOjE4MjAwODMxODh9.Oyz2i79e63xMEe5AaP3lyz3ZoZH9x_l8K5UbbdZQSu55TYev_OxuGLxZVChsAStaJqZSwoaD8t4hjQJrBFNmeg',     'Riya_Mehta_Resume.pdf',     'application/pdf'),
        (v_cand_3,     v_app_3,  'resume', 'https://yysuatdvkvstpmqsjaxq.supabase.co/storage/v1/object/sign/application-documents/dc37f43d-4252-4993-8176-267ab1f80851/e6edc7ba-ff3b-457a-9b09-183172ae9a0a.pdf?token=eyJraWQiOiIxMDMzMjFiYi1lNWUzLTQxMjYtYjlkNy00MGIwNDA3MDdmYTYiLCJhbGciOiJIUzUxMiJ9.eyJ1cmwiOiJhcHBsaWNhdGlvbi1kb2N1bWVudHMvZGMzN2Y0M2QtNDI1Mi00OTkzLTgxNzYtMjY3YWIxZjgwODUxL2U2ZWRjN2JhLWZmM2ItNDU3YS05YjA5LTE4MzE3MmFlOWEwYS5wZGYiLCJzY29wZSI6ImRvd25sb2FkIiwiaWF0IjoxNzg4NTQ3MTg4LCJleHAiOjE4MjAwODMxODh9.Oyz2i79e63xMEe5AaP3lyz3ZoZH9x_l8K5UbbdZQSu55TYev_OxuGLxZVChsAStaJqZSwoaD8t4hjQJrBFNmeg',   'Aditya_Verma_Resume.pdf',   'application/pdf'),
        (v_cand_4,     v_app_4,  'resume', 'https://yysuatdvkvstpmqsjaxq.supabase.co/storage/v1/object/sign/application-documents/dc37f43d-4252-4993-8176-267ab1f80851/e6edc7ba-ff3b-457a-9b09-183172ae9a0a.pdf?token=eyJraWQiOiIxMDMzMjFiYi1lNWUzLTQxMjYtYjlkNy00MGIwNDA3MDdmYTYiLCJhbGciOiJIUzUxMiJ9.eyJ1cmwiOiJhcHBsaWNhdGlvbi1kb2N1bWVudHMvZGMzN2Y0M2QtNDI1Mi00OTkzLTgxNzYtMjY3YWIxZjgwODUxL2U2ZWRjN2JhLWZmM2ItNDU3YS05YjA5LTE4MzE3MmFlOWEwYS5wZGYiLCJzY29wZSI6ImRvd25sb2FkIiwiaWF0IjoxNzg4NTQ3MTg4LCJleHAiOjE4MjAwODMxODh9.Oyz2i79e63xMEe5AaP3lyz3ZoZH9x_l8K5UbbdZQSu55TYev_OxuGLxZVChsAStaJqZSwoaD8t4hjQJrBFNmeg',   'Ananya_Patel_Resume.pdf',   'application/pdf'),
        (v_cand_5,     v_app_5,  'resume', 'https://yysuatdvkvstpmqsjaxq.supabase.co/storage/v1/object/sign/application-documents/dc37f43d-4252-4993-8176-267ab1f80851/e6edc7ba-ff3b-457a-9b09-183172ae9a0a.pdf?token=eyJraWQiOiIxMDMzMjFiYi1lNWUzLTQxMjYtYjlkNy00MGIwNDA3MDdmYTYiLCJhbGciOiJIUzUxMiJ9.eyJ1cmwiOiJhcHBsaWNhdGlvbi1kb2N1bWVudHMvZGMzN2Y0M2QtNDI1Mi00OTkzLTgxNzYtMjY3YWIxZjgwODUxL2U2ZWRjN2JhLWZmM2ItNDU3YS05YjA5LTE4MzE3MmFlOWEwYS5wZGYiLCJzY29wZSI6ImRvd25sb2FkIiwiaWF0IjoxNzg4NTQ3MTg4LCJleHAiOjE4MjAwODMxODh9.Oyz2i79e63xMEe5AaP3lyz3ZoZH9x_l8K5UbbdZQSu55TYev_OxuGLxZVChsAStaJqZSwoaD8t4hjQJrBFNmeg',    'Rahul_Singh_Resume.pdf',    'application/pdf'),
        (v_cand_6,     v_app_6,  'resume', 'https://yysuatdvkvstpmqsjaxq.supabase.co/storage/v1/object/sign/application-documents/dc37f43d-4252-4993-8176-267ab1f80851/e6edc7ba-ff3b-457a-9b09-183172ae9a0a.pdf?token=eyJraWQiOiIxMDMzMjFiYi1lNWUzLTQxMjYtYjlkNy00MGIwNDA3MDdmYTYiLCJhbGciOiJIUzUxMiJ9.eyJ1cmwiOiJhcHBsaWNhdGlvbi1kb2N1bWVudHMvZGMzN2Y0M2QtNDI1Mi00OTkzLTgxNzYtMjY3YWIxZjgwODUxL2U2ZWRjN2JhLWZmM2ItNDU3YS05YjA5LTE4MzE3MmFlOWEwYS5wZGYiLCJzY29wZSI6ImRvd25sb2FkIiwiaWF0IjoxNzg4NTQ3MTg4LCJleHAiOjE4MjAwODMxODh9.Oyz2i79e63xMEe5AaP3lyz3ZoZH9x_l8K5UbbdZQSu55TYev_OxuGLxZVChsAStaJqZSwoaD8t4hjQJrBFNmeg',    'Sneha_Joshi_Resume.pdf',    'application/pdf'),
        (v_cand_7,     v_app_7,  'resume', 'https://yysuatdvkvstpmqsjaxq.supabase.co/storage/v1/object/sign/application-documents/dc37f43d-4252-4993-8176-267ab1f80851/e6edc7ba-ff3b-457a-9b09-183172ae9a0a.pdf?token=eyJraWQiOiIxMDMzMjFiYi1lNWUzLTQxMjYtYjlkNy00MGIwNDA3MDdmYTYiLCJhbGciOiJIUzUxMiJ9.eyJ1cmwiOiJhcHBsaWNhdGlvbi1kb2N1bWVudHMvZGMzN2Y0M2QtNDI1Mi00OTkzLTgxNzYtMjY3YWIxZjgwODUxL2U2ZWRjN2JhLWZmM2ItNDU3YS05YjA5LTE4MzE3MmFlOWEwYS5wZGYiLCJzY29wZSI6ImRvd25sb2FkIiwiaWF0IjoxNzg4NTQ3MTg4LCJleHAiOjE4MjAwODMxODh9.Oyz2i79e63xMEe5AaP3lyz3ZoZH9x_l8K5UbbdZQSu55TYev_OxuGLxZVChsAStaJqZSwoaD8t4hjQJrBFNmeg',    'Karan_Gupta_Resume.pdf',    'application/pdf'),
        (v_cand_8,     v_app_8,  'resume', 'https://yysuatdvkvstpmqsjaxq.supabase.co/storage/v1/object/sign/application-documents/dc37f43d-4252-4993-8176-267ab1f80851/e6edc7ba-ff3b-457a-9b09-183172ae9a0a.pdf?token=eyJraWQiOiIxMDMzMjFiYi1lNWUzLTQxMjYtYjlkNy00MGIwNDA3MDdmYTYiLCJhbGciOiJIUzUxMiJ9.eyJ1cmwiOiJhcHBsaWNhdGlvbi1kb2N1bWVudHMvZGMzN2Y0M2QtNDI1Mi00OTkzLTgxNzYtMjY3YWIxZjgwODUxL2U2ZWRjN2JhLWZmM2ItNDU3YS05YjA5LTE4MzE3MmFlOWEwYS5wZGYiLCJzY29wZSI6ImRvd25sb2FkIiwiaWF0IjoxNzg4NTQ3MTg4LCJleHAiOjE4MjAwODMxODh9.Oyz2i79e63xMEe5AaP3lyz3ZoZH9x_l8K5UbbdZQSu55TYev_OxuGLxZVChsAStaJqZSwoaD8t4hjQJrBFNmeg',  'Neha_Kulkarni_Resume.pdf',  'application/pdf'),
        (v_cand_9,     v_app_9,  'resume', 'https://yysuatdvkvstpmqsjaxq.supabase.co/storage/v1/object/sign/application-documents/dc37f43d-4252-4993-8176-267ab1f80851/e6edc7ba-ff3b-457a-9b09-183172ae9a0a.pdf?token=eyJraWQiOiIxMDMzMjFiYi1lNWUzLTQxMjYtYjlkNy00MGIwNDA3MDdmYTYiLCJhbGciOiJIUzUxMiJ9.eyJ1cmwiOiJhcHBsaWNhdGlvbi1kb2N1bWVudHMvZGMzN2Y0M2QtNDI1Mi00OTkzLTgxNzYtMjY3YWIxZjgwODUxL2U2ZWRjN2JhLWZmM2ItNDU3YS05YjA5LTE4MzE3MmFlOWEwYS5wZGYiLCJzY29wZSI6ImRvd25sb2FkIiwiaWF0IjoxNzg4NTQ3MTg4LCJleHAiOjE4MjAwODMxODh9.Oyz2i79e63xMEe5AaP3lyz3ZoZH9x_l8K5UbbdZQSu55TYev_OxuGLxZVChsAStaJqZSwoaD8t4hjQJrBFNmeg',      'Arjun_Rao_Resume.pdf',      'application/pdf'),
        (v_cand_10,    v_app_10, 'resume', 'https://yysuatdvkvstpmqsjaxq.supabase.co/storage/v1/object/sign/application-documents/dc37f43d-4252-4993-8176-267ab1f80851/e6edc7ba-ff3b-457a-9b09-183172ae9a0a.pdf?token=eyJraWQiOiIxMDMzMjFiYi1lNWUzLTQxMjYtYjlkNy00MGIwNDA3MDdmYTYiLCJhbGciOiJIUzUxMiJ9.eyJ1cmwiOiJhcHBsaWNhdGlvbi1kb2N1bWVudHMvZGMzN2Y0M2QtNDI1Mi00OTkzLTgxNzYtMjY3YWIxZjgwODUxL2U2ZWRjN2JhLWZmM2ItNDU3YS05YjA5LTE4MzE3MmFlOWEwYS5wZGYiLCJzY29wZSI6ImRvd25sb2FkIiwiaWF0IjoxNzg4NTQ3MTg4LCJleHAiOjE4MjAwODMxODh9.Oyz2i79e63xMEe5AaP3lyz3ZoZH9x_l8K5UbbdZQSu55TYev_OxuGLxZVChsAStaJqZSwoaD8t4hjQJrBFNmeg',    'Ishita_Shah_Resume.pdf',    'application/pdf'),
        (v_cand_11,    v_app_11, 'resume', 'https://yysuatdvkvstpmqsjaxq.supabase.co/storage/v1/object/sign/application-documents/dc37f43d-4252-4993-8176-267ab1f80851/e6edc7ba-ff3b-457a-9b09-183172ae9a0a.pdf?token=eyJraWQiOiIxMDMzMjFiYi1lNWUzLTQxMjYtYjlkNy00MGIwNDA3MDdmYTYiLCJhbGciOiJIUzUxMiJ9.eyJ1cmwiOiJhcHBsaWNhdGlvbi1kb2N1bWVudHMvZGMzN2Y0M2QtNDI1Mi00OTkzLTgxNzYtMjY3YWIxZjgwODUxL2U2ZWRjN2JhLWZmM2ItNDU3YS05YjA5LTE4MzE3MmFlOWEwYS5wZGYiLCJzY29wZSI6ImRvd25sb2FkIiwiaWF0IjoxNzg4NTQ3MTg4LCJleHAiOjE4MjAwODMxODh9.Oyz2i79e63xMEe5AaP3lyz3ZoZH9x_l8K5UbbdZQSu55TYev_OxuGLxZVChsAStaJqZSwoaD8t4hjQJrBFNmeg',  'Yash_Malhotra_Resume.pdf',  'application/pdf'),
        (v_cand_12,    v_app_12, 'resume', 'https://yysuatdvkvstpmqsjaxq.supabase.co/storage/v1/object/sign/application-documents/dc37f43d-4252-4993-8176-267ab1f80851/e6edc7ba-ff3b-457a-9b09-183172ae9a0a.pdf?token=eyJraWQiOiIxMDMzMjFiYi1lNWUzLTQxMjYtYjlkNy00MGIwNDA3MDdmYTYiLCJhbGciOiJIUzUxMiJ9.eyJ1cmwiOiJhcHBsaWNhdGlvbi1kb2N1bWVudHMvZGMzN2Y0M2QtNDI1Mi00OTkzLTgxNzYtMjY3YWIxZjgwODUxL2U2ZWRjN2JhLWZmM2ItNDU3YS05YjA5LTE4MzE3MmFlOWEwYS5wZGYiLCJzY29wZSI6ImRvd25sb2FkIiwiaWF0IjoxNzg4NTQ3MTg4LCJleHAiOjE4MjAwODMxODh9.Oyz2i79e63xMEe5AaP3lyz3ZoZH9x_l8K5UbbdZQSu55TYev_OxuGLxZVChsAStaJqZSwoaD8t4hjQJrBFNmeg',     'Priya_Nair_Resume.pdf',     'application/pdf'),
        (v_cand_13,    v_app_13, 'resume', 'https://yysuatdvkvstpmqsjaxq.supabase.co/storage/v1/object/sign/application-documents/dc37f43d-4252-4993-8176-267ab1f80851/e6edc7ba-ff3b-457a-9b09-183172ae9a0a.pdf?token=eyJraWQiOiIxMDMzMjFiYi1lNWUzLTQxMjYtYjlkNy00MGIwNDA3MDdmYTYiLCJhbGciOiJIUzUxMiJ9.eyJ1cmwiOiJhcHBsaWNhdGlvbi1kb2N1bWVudHMvZGMzN2Y0M2QtNDI1Mi00OTkzLTgxNzYtMjY3YWIxZjgwODUxL2U2ZWRjN2JhLWZmM2ItNDU3YS05YjA5LTE4MzE3MmFlOWEwYS5wZGYiLCJzY29wZSI6ImRvd25sb2FkIiwiaWF0IjoxNzg4NTQ3MTg4LCJleHAiOjE4MjAwODMxODh9.Oyz2i79e63xMEe5AaP3lyz3ZoZH9x_l8K5UbbdZQSu55TYev_OxuGLxZVChsAStaJqZSwoaD8t4hjQJrBFNmeg',   'Vikram_Desai_Resume.pdf',   'application/pdf'),
        (v_cand_14,    v_app_14, 'resume', 'https://yysuatdvkvstpmqsjaxq.supabase.co/storage/v1/object/sign/application-documents/dc37f43d-4252-4993-8176-267ab1f80851/e6edc7ba-ff3b-457a-9b09-183172ae9a0a.pdf?token=eyJraWQiOiIxMDMzMjFiYi1lNWUzLTQxMjYtYjlkNy00MGIwNDA3MDdmYTYiLCJhbGciOiJIUzUxMiJ9.eyJ1cmwiOiJhcHBsaWNhdGlvbi1kb2N1bWVudHMvZGMzN2Y0M2QtNDI1Mi00OTkzLTgxNzYtMjY3YWIxZjgwODUxL2U2ZWRjN2JhLWZmM2ItNDU3YS05YjA5LTE4MzE3MmFlOWEwYS5wZGYiLCJzY29wZSI6ImRvd25sb2FkIiwiaWF0IjoxNzg4NTQ3MTg4LCJleHAiOjE4MjAwODMxODh9.Oyz2i79e63xMEe5AaP3lyz3ZoZH9x_l8K5UbbdZQSu55TYev_OxuGLxZVChsAStaJqZSwoaD8t4hjQJrBFNmeg',     'Meera_Iyer_Resume.pdf',     'application/pdf'),
        (v_cand_15,    v_app_15, 'resume', 'https://yysuatdvkvstpmqsjaxq.supabase.co/storage/v1/object/sign/application-documents/dc37f43d-4252-4993-8176-267ab1f80851/e6edc7ba-ff3b-457a-9b09-183172ae9a0a.pdf?token=eyJraWQiOiIxMDMzMjFiYi1lNWUzLTQxMjYtYjlkNy00MGIwNDA3MDdmYTYiLCJhbGciOiJIUzUxMiJ9.eyJ1cmwiOiJhcHBsaWNhdGlvbi1kb2N1bWVudHMvZGMzN2Y0M2QtNDI1Mi00OTkzLTgxNzYtMjY3YWIxZjgwODUxL2U2ZWRjN2JhLWZmM2ItNDU3YS05YjA5LTE4MzE3MmFlOWEwYS5wZGYiLCJzY29wZSI6ImRvd25sb2FkIiwiaWF0IjoxNzg4NTQ3MTg4LCJleHAiOjE4MjAwODMxODh9.Oyz2i79e63xMEe5AaP3lyz3ZoZH9x_l8K5UbbdZQSu55TYev_OxuGLxZVChsAStaJqZSwoaD8t4hjQJrBFNmeg',     'Dev_Kapoor_Resume.pdf',     'application/pdf');

    -- ==============================================================================
    -- 15. AUDIT TRAIL TIMESTAMPS & ACTOR ATTRIBUTION ENRICHMENT
    -- Attribute recruiter as actor and distribute event timestamps across past weeks
    -- ==============================================================================
    -- Attribute system/recruiter actor_id for trigger-generated events
    UPDATE public.application_history
    SET actor_id = v_recruiter_id
    WHERE application_id = ANY(v_all_apps) 
      AND actor_id IS NULL;

    -- Adjust chronological timestamps so audit trail reflects realistic lifecycle:
    -- Application created events: 14 to 16 days ago
    UPDATE public.application_history
    SET created_at = NOW() - INTERVAL '14 days'
    WHERE application_id = ANY(v_all_apps) AND event_type = 'application_created';

    -- Screening stage change events: 10 days ago
    UPDATE public.application_history
    SET created_at = NOW() - INTERVAL '10 days'
    WHERE application_id = ANY(v_all_apps) 
      AND event_type = 'stage_changed' 
      AND details->>'new_stage' = 'screening';

    -- Interview stage change events: 6 days ago
    UPDATE public.application_history
    SET created_at = NOW() - INTERVAL '6 days'
    WHERE application_id = ANY(v_all_apps) 
      AND event_type = 'stage_changed' 
      AND details->>'new_stage' = 'interview';

    -- Interviewer assigned events: 5 days ago
    UPDATE public.application_history
    SET created_at = NOW() - INTERVAL '5 days'
    WHERE application_id = ANY(v_all_apps) 
      AND event_type = 'interviewer_assigned';

    -- Offer stage change events: 2 days ago
    UPDATE public.application_history
    SET created_at = NOW() - INTERVAL '2 days'
    WHERE application_id = ANY(v_all_apps) 
      AND event_type = 'stage_changed' 
      AND details->>'new_stage' = 'offer';

    -- Hired stage change events: 1 day ago (Within current month!)
    UPDATE public.application_history
    SET created_at = NOW() - INTERVAL '1 day'
    WHERE application_id = ANY(v_all_apps) 
      AND event_type = 'stage_changed' 
      AND details->>'new_stage' = 'hired';

    -- Rejection events: 4 days ago
    UPDATE public.application_history
    SET created_at = NOW() - INTERVAL '4 days'
    WHERE application_id = ANY(v_all_apps) 
      AND event_type = 'application_rejected';

    RAISE NOTICE 'CX-Hire demo seed data populated successfully for company %', v_company_id;
END $$;

-- ==============================================================================
-- 16. STANDALONE VERIFICATION QUERIES
-- Run the queries below to verify all requirements of the seed data
-- ==============================================================================

-- 1. Verify 3 demo authentication accounts exist
SELECT id, email, role, email_confirmed_at, created_at
FROM auth.users
WHERE email IN ('student@gmail.com', 'interviewer@gmail.com', 'recruiter@gmail.com');

-- 2. Verify roles exist in public.profiles
SELECT id, name, role, university_name, company_name, job_title
FROM public.profiles
WHERE id IN (
    'e0000000-0000-0000-0000-000000000001',
    'e0000000-0000-0000-0000-000000000002',
    'e0000000-0000-0000-0000-000000000003'
);

-- 3. Verify Recruiter belongs to the selected company
SELECT rcm.recruiter_id, p.name as recruiter_name, c.id as company_id, c.name as company_name, rcm.status
FROM public.recruiter_company_memberships rcm
JOIN public.companies c ON c.id = rcm.company_id
JOIN public.profiles p ON p.id = rcm.recruiter_id
WHERE rcm.recruiter_id = 'e0000000-0000-0000-0000-000000000001';

-- 4. Verify Interviewer belongs to the selected company
SELECT icm.interviewer_id, p.name as interviewer_name, c.id as company_id, c.name as company_name, icm.department_id, icm.status
FROM public.interviewer_company_memberships icm
JOIN public.companies c ON c.id = icm.company_id
JOIN public.profiles p ON p.id = icm.interviewer_id
WHERE icm.interviewer_id = 'e0000000-0000-0000-0000-000000000002';

-- 5. Verify 3 active job openings exist
SELECT o.id, o.title, o.department, o.type, o.status, c.name as company_name
FROM public.openings o
JOIN public.companies c ON c.id = o.company_id
WHERE o.status = 'open' AND o.archived_at IS NULL
ORDER BY o.title;

-- 6. Verify total candidate applications count (~15)
SELECT count(*) as total_applications
FROM public.applications;

-- 7. Verify pipeline stage distribution: applied(3), screening(3), interview(4), offer(2), hired(1), rejected(2)
SELECT stage, count(*) as candidate_count
FROM public.applications
GROUP BY stage
ORDER BY 
    CASE stage
        WHEN 'applied' THEN 1
        WHEN 'screening' THEN 2
        WHEN 'interview' THEN 3
        WHEN 'offer' THEN 4
        WHEN 'hired' THEN 5
        WHEN 'rejected' THEN 6
        ELSE 7
    END;

-- 8. Verify distribution across openings (~5 each)
SELECT o.title as opening_title, count(a.id) as applicant_count
FROM public.openings o
LEFT JOIN public.applications a ON a.opening_id = o.id
GROUP BY o.id, o.title
ORDER BY o.title;

-- 9. Verify interviewer assignments exist (5 candidates)
SELECT ai.application_id, a.candidate_name, a.stage, p.name as interviewer_name
FROM public.application_interviewers ai
JOIN public.applications a ON a.id = ai.application_id
JOIN public.profiles p ON p.id = ai.interviewer_id
ORDER BY a.candidate_name;

-- 10. Verify interviewer feedback submitted with ratings
SELECT ah.application_id, a.candidate_name, ah.event_type, ah.details->>'rating' as rating, ah.details->>'feedback' as feedback_preview, ah.created_at
FROM public.application_history ah
JOIN public.applications a ON a.id = ah.application_id
WHERE ah.event_type = 'feedback_submitted'
ORDER BY ah.created_at DESC;

-- 11. Verify scheduled interviews (1 upcoming, 1 recent)
SELECT i.id, a.candidate_name, o.title as role, i.scheduled_at,
       CASE WHEN i.scheduled_at > NOW() THEN 'Upcoming' ELSE 'Past' END as schedule_status
FROM public.interviews i
JOIN public.applications a ON a.id = i.application_id
JOIN public.openings o ON o.id = a.opening_id
ORDER BY i.scheduled_at DESC;

-- 12. Verify stalled applications (>10 days inactive, active stage)
SELECT a.id, a.candidate_name, a.stage, a.stage_updated_at,
       ROUND(EXTRACT(EPOCH FROM (NOW() - a.stage_updated_at)) / 86400, 1) as days_stalled
FROM public.applications a
WHERE a.stage_updated_at <= NOW() - INTERVAL '10 days'
  AND a.stage NOT IN ('rejected', 'withdrawn')
ORDER BY a.stage_updated_at ASC;

-- 13. Verify full application lifecycle history counts
SELECT event_type, count(*) as event_count
FROM public.application_history
GROUP BY event_type
ORDER BY event_count DESC;
