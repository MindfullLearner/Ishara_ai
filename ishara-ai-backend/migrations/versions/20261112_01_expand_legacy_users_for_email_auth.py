
"""Recreate users table using the current SQLAlchemy model.

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
    # WARNING: This permanently deletes all existing users and their data.
    op.drop_table("users")

    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("full_name", sa.String(length=100), nullable=False),
        sa.Column("email", sa.String(length=254), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=True),
        sa.Column(
            "role",
            sa.String(length=20),
            server_default=sa.text("'user'"),
            nullable=False,
        ),
        sa.Column(
            "status",
            sa.String(length=20),
            server_default=sa.text("'active'"),
            nullable=False,
        ),
        sa.Column(
            "is_verified",
            sa.Boolean(),
            server_default=sa.text("false"),
            nullable=False,
        ),
        sa.Column(
            "verification_token_hash",
            sa.String(length=255),
            nullable=True,
        ),
        sa.Column(
            "verification_token_expires",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
        sa.Column("reset_token_hash", sa.String(length=255), nullable=True),
        sa.Column(
            "reset_token_expires",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
        sa.Column(
            "failed_login_attempts",
            sa.Integer(),
            server_default=sa.text("0"),
            nullable=False,
        ),
        sa.Column(
            "locked_until",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "role IN ('user', 'admin')",
            name="ck_users_role",
        ),
        sa.CheckConstraint(
            "status IN ('active', 'pending', 'suspended')",
            name="ck_users_status",
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index("ix_users_id", "users", ["id"], unique=False)
    op.create_index("ix_users_email", "users", ["email"], unique=True)
    op.create_index(
        "uq_users_email_lower",
        "users",
        [sa.text("lower(email)")],
        unique=True,
    )


def downgrade() -> None:
    raise RuntimeError(
        "This migration is irreversible because it deletes the old users data."
    )
