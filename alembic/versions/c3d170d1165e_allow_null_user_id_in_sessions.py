"""allow_null_user_id_in_sessions

Revision ID: c3d170d1165e
Revises: 8b86f88be9ac
Create Date: 2026-06-07 15:41:10.134700

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c3d170d1165e'
down_revision: Union[str, Sequence[str], None] = '8b86f88be9ac'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column('interview_sessions', 'user_id', nullable=True,
                    existing_type=sa.String())
    op.add_column('users', sa.Column('email_verified', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('users', sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")))
    op.execute("UPDATE users SET email_verified = true WHERE auth_provider != 'local'")

def downgrade() -> None:
    op.alter_column('interview_sessions', 'user_id', nullable=False,
                    existing_type=sa.String())
    op.drop_column('users', 'email_verified')
    op.drop_column('users', 'created_at')
