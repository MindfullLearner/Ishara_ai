"""Expand legacy users for email/password recovery without dropping credentials.

Revision ID: 20261112_01
Revises:
"""
from alembic import op
import sqlalchemy as sa

revision = "20261112_01"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # This revision targets the partner's legacy users table. Stop if source
    # values are outside the reviewed vocabulary rather than guessing.
    op.execute(sa.text("""
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
        END $$;
    """))

    # Preserve all existing legacy values; no sequence_hash is transformed.
    op.alter_column("users", "username", existing_type=sa.String(length=30), nullable=True)
    op.alter_column("users", "sequence_hash", existing_type=sa.String(length=255), nullable=True)
    op.add_column("users", sa.Column("password_hash", sa.String(length=255), nullable=True))
    op.add_column("users", sa.Column("is_verified", sa.Boolean(), server_default=sa.text("false"), nullable=False))
    op.add_column("users", sa.Column("verification_token_hash", sa.String(length=255), nullable=True))
    op.add_column("users", sa.Column("verification_token_expires", sa.DateTime(timezone=True), nullable=True))
    op.add_column("users", sa.Column("reset_token_hash", sa.String(length=255), nullable=True))
    op.add_column("users", sa.Column("reset_token_expires", sa.DateTime(timezone=True), nullable=True))

    # Existing partner schema has nullable full_name. Populate only missing or
    # blank values from stable identifiers, then make it required.
    op.alter_column("users", "full_name", existing_type=sa.String(length=100), nullable=True)
    op.execute(sa.text("""
        UPDATE users
        SET full_name = COALESCE(
            NULLIF(btrim(full_name), ''),
            NULLIF(btrim(username), ''),
            NULLIF(split_part(email, '@', 1), ''),
            'User ' || id::text
        )
    """))
    op.alter_column("users", "full_name", existing_type=sa.String(length=100), nullable=False)

    # Keep legacy pending accounts pending; verification/reset does not imply
    # administrator approval.
    op.alter_column("users", "role", existing_type=sa.String(length=20), nullable=False, server_default="user")
    op.alter_column("users", "status", existing_type=sa.String(length=20), nullable=False, server_default="active")
    # Keep every recorded counter; only repair NULLs so the column can remain
    # non-null for new authentication lockout accounting.
    op.execute(sa.text("UPDATE users SET failed_login_attempts = 0 WHERE failed_login_attempts IS NULL"))
    op.alter_column("users", "failed_login_attempts", existing_type=sa.Integer(), nullable=False, server_default="0")

    op.create_check_constraint("ck_users_role", "users", "role IN ('user', 'admin')")
    op.create_check_constraint("ck_users_status", "users", "status IN ('active', 'pending', 'suspended')")
    op.create_index("uq_users_email_lower", "users", [sa.text("lower(email)")], unique=True)


def downgrade() -> None:
    raise RuntimeError(
        "This recovery migration is intentionally irreversible: downgrade could "
        "discard verified/password recovery data or reintroduce pending state."
    )
