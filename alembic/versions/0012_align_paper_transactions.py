"""Align paper transactions columns.

Revision ID: 0012_align_paper_transactions
Revises: 0011_phase2_seed_subscription_data
Create Date: 2026-08-11 22:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "0012_align_paper_transactions"
down_revision = "0011_phase2_seed_subs"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Check current columns of paper_transactions
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = [c['name'] for c in inspector.get_columns('paper_transactions')]
    
    # Rename 'type' to 'transaction_type' if 'type' is present and 'transaction_type' is not
    if 'type' in columns and 'transaction_type' not in columns:
        with op.batch_alter_table('paper_transactions') as batch_op:
            batch_op.alter_column('type', new_column_name='transaction_type', type_=sa.String(length=50))
            
    # Add 'reference_type' if it's not present
    if 'reference_type' not in columns:
        with op.batch_alter_table('paper_transactions') as batch_op:
            batch_op.add_column(sa.Column('reference_type', sa.String(length=50), nullable=True))
            
    # Modify 'reference_id' to UUID if it exists
    ref_col = next((c for c in inspector.get_columns('paper_transactions') if c['name'] == 'reference_id'), None)
    if ref_col:
        with op.batch_alter_table('paper_transactions') as batch_op:
            batch_op.alter_column('reference_id', type_=sa.UUID(as_uuid=True))

    # Re-create/create the index if not exists
    indexes = [idx['name'] for idx in inspector.get_indexes('paper_transactions')]
    if 'ix_paper_transactions_type' not in indexes and 'idx_paper_transactions_type' not in indexes:
        with op.batch_alter_table('paper_transactions') as batch_op:
            batch_op.create_index('ix_paper_transactions_type', ['transaction_type'])


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = [c['name'] for c in inspector.get_columns('paper_transactions')]
    
    if 'transaction_type' in columns and 'type' not in columns:
        with op.batch_alter_table('paper_transactions') as batch_op:
            batch_op.alter_column('transaction_type', new_column_name='type', type_=sa.String(length=50))
            
    if 'reference_type' in columns:
        with op.batch_alter_table('paper_transactions') as batch_op:
            batch_op.drop_column('reference_type')
            
    if 'reference_id' in columns:
        with op.batch_alter_table('paper_transactions') as batch_op:
            batch_op.alter_column('reference_id', type_=sa.String(length=255))
