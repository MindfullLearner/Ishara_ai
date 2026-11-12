BEGIN;

CREATE TABLE alembic_version (
    version_num VARCHAR(32) NOT NULL,
    CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num)
);

-- Running upgrade  -> 20261112_01

DO $$
        BEGIN
            IF EXISTS (SELECT 1 FROM users WHERE role IS NULL OR role NOT IN ('user', 'admin')) THEN
                RAISE EXCEPTION 'Unknown or NULL users.role values; review data before migration';
            END IF;
            IF EXISTS (SELECT 1 FROM users WHERE status IS NULL OR status NOT IN ('active', 'pending', 'suspended')) THEN
                RAISE EXCEPTION 'Unknown or NULL users.status values; review data before migration';
            END IF;
            IF EXISTS (
                SELECT lower(email) FROM users WHERE email IS NOT NULL
                GROUP BY lower(email) HAVING count(*) > 1
            ) THEN
                RAISE EXCEPTION 'Case-insensitive duplicate user emails; resolve before migration';
            END IF;
        END $$;;

ALTER TABLE users ALTER COLUMN username DROP NOT NULL;

ALTER TABLE users ALTER COLUMN sequence_hash DROP NOT NULL;

ALTER TABLE users ADD COLUMN password_hash VARCHAR(255);

ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT false NOT NULL;

ALTER TABLE users ADD COLUMN verification_token_hash VARCHAR(255);

ALTER TABLE users ADD COLUMN verification_token_expires TIMESTAMP WITH TIME ZONE;

ALTER TABLE users ADD COLUMN reset_token_hash VARCHAR(255);

ALTER TABLE users ADD COLUMN reset_token_expires TIMESTAMP WITH TIME ZONE;

ALTER TABLE users ALTER COLUMN full_name DROP NOT NULL;

UPDATE users
        SET full_name = COALESCE(
            NULLIF(btrim(full_name), ''),
            NULLIF(btrim(username), ''),
            NULLIF(split_part(email, '@', 1), ''),
            'User ' || id::text
        );

ALTER TABLE users ALTER COLUMN full_name SET NOT NULL;

ALTER TABLE users ALTER COLUMN role SET NOT NULL;

ALTER TABLE users ALTER COLUMN role SET DEFAULT 'user';

ALTER TABLE users ALTER COLUMN status SET NOT NULL;

ALTER TABLE users ALTER COLUMN status SET DEFAULT 'active';

UPDATE users SET failed_login_attempts = 0 WHERE failed_login_attempts IS NULL;

ALTER TABLE users ALTER COLUMN failed_login_attempts SET NOT NULL;

ALTER TABLE users ALTER COLUMN failed_login_attempts SET DEFAULT '0';

ALTER TABLE users ADD CONSTRAINT ck_users_role CHECK (role IN ('user', 'admin'));

ALTER TABLE users ADD CONSTRAINT ck_users_status CHECK (status IN ('active', 'pending', 'suspended'));

CREATE UNIQUE INDEX uq_users_email_lower ON users (lower(email));

INSERT INTO alembic_version (version_num) VALUES ('20261112_01') RETURNING alembic_version.version_num;

COMMIT;
