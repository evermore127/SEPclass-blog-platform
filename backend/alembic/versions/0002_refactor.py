"""refactor: remove vip, repost, background_url, theme

Revision ID: 0002
Revises: 0001
Create Date: 2026-05-08
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. drop vip_orders table
    op.drop_table("vip_orders")
    op.execute("DROP TYPE IF EXISTS vipplan")
    op.execute("DROP TYPE IF EXISTS orderstatus")

    # 2. drop columns from users
    op.drop_column("users", "is_vip")
    op.drop_column("users", "vip_expire_at")
    op.drop_column("users", "background_url")
    op.drop_column("users", "theme")

    # 3. remove 'repost' from interactiontype enum
    #    PG does not support ALTER TYPE DROP VALUE in a transaction block,
    #    so we must create a new type, migrate, and drop the old one.
    op.execute("DELETE FROM post_interactions WHERE type = 'repost'")
    op.execute("ALTER TYPE interactiontype RENAME TO interactiontype_old")
    op.execute("CREATE TYPE interactiontype AS ENUM('like', 'favorite')")
    op.execute(
        "ALTER TABLE post_interactions ALTER COLUMN type TYPE interactiontype "
        "USING type::text::interactiontype"
    )
    op.execute("DROP TYPE interactiontype_old")


def downgrade() -> None:
    # --- reverse enum change ---
    op.execute("ALTER TYPE interactiontype RENAME TO interactiontype_old")
    op.execute("CREATE TYPE interactiontype AS ENUM('like', 'favorite', 'repost')")
    op.execute(
        "ALTER TABLE post_interactions ALTER COLUMN type TYPE interactiontype "
        "USING type::text::interactiontype"
    )
    op.execute("DROP TYPE interactiontype_old")

    # --- restore columns on users ---
    op.add_column("users", sa.Column("theme", sa.String(20), nullable=False, server_default="light"))
    op.add_column("users", sa.Column("background_url", sa.String(500), nullable=True))
    op.add_column("users", sa.Column("vip_expire_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("users", sa.Column("is_vip", sa.Boolean(), nullable=False, server_default="false"))

    # --- restore vip_orders table ---
    op.create_table(
        "vip_orders",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("plan", sa.Enum("monthly", "yearly", name="vipplan"), nullable=False),
        sa.Column("amount", sa.Float(), nullable=False),
        sa.Column("status", sa.Enum("pending", "paid", name="orderstatus"), nullable=False, server_default="pending"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
