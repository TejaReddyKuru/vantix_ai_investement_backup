"""Add journal comprehensive fields

Revision ID: 382688a78e67
Revises: 0013_paper_trading_persistence
Create Date: 2026-08-30 14:14:47.320497

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '382688a78e67'
down_revision = '0013_paper_trading_persistence'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # 1. Create journal_observations table
    op.create_table('journal_observations',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('journal_entry_id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('text', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['journal_entry_id'], ['trade_journal_entries.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_journal_observations_journal_entry_id'), 'journal_observations', ['journal_entry_id'], unique=False)
    op.create_index(op.f('ix_journal_observations_user_id'), 'journal_observations', ['user_id'], unique=False)

    # 2. Add fields to trade_journal_entries
    op.add_column('trade_journal_entries', sa.Column('paper_account_id', sa.UUID(), nullable=True))
    op.add_column('trade_journal_entries', sa.Column('symbol', sa.String(length=50), nullable=True))
    op.add_column('trade_journal_entries', sa.Column('side', sa.String(length=10), nullable=True))
    op.add_column('trade_journal_entries', sa.Column('status', sa.String(length=50), nullable=True))
    op.add_column('trade_journal_entries', sa.Column('entry_price', sa.Numeric(precision=20, scale=8), nullable=True))
    op.add_column('trade_journal_entries', sa.Column('exit_price', sa.Numeric(precision=20, scale=8), nullable=True))
    op.add_column('trade_journal_entries', sa.Column('quantity', sa.Numeric(precision=20, scale=8), nullable=True))
    op.add_column('trade_journal_entries', sa.Column('realized_pnl', sa.Numeric(precision=20, scale=8), nullable=True))
    op.add_column('trade_journal_entries', sa.Column('return_percentage', sa.Numeric(precision=10, scale=4), nullable=True))
    op.add_column('trade_journal_entries', sa.Column('duration_seconds', sa.Integer(), nullable=True))
    op.add_column('trade_journal_entries', sa.Column('entry_timestamp', sa.DateTime(), nullable=True))
    op.add_column('trade_journal_entries', sa.Column('exit_timestamp', sa.DateTime(), nullable=True))
    op.add_column('trade_journal_entries', sa.Column('market_condition', sa.String(length=255), nullable=True))
    op.add_column('trade_journal_entries', sa.Column('entry_reason', sa.Text(), nullable=True))
    op.add_column('trade_journal_entries', sa.Column('trade_thesis', sa.Text(), nullable=True))
    op.add_column('trade_journal_entries', sa.Column('confidence', sa.Integer(), nullable=True))
    op.add_column('trade_journal_entries', sa.Column('what_went_well', sa.Text(), nullable=True))
    op.add_column('trade_journal_entries', sa.Column('what_went_wrong', sa.Text(), nullable=True))
    op.add_column('trade_journal_entries', sa.Column('discipline_score', sa.Integer(), nullable=True))
    op.add_column('trade_journal_entries', sa.Column('trade_plan_snapshot', postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    op.add_column('trade_journal_entries', sa.Column('ahna_snapshot', postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    
    op.alter_column('trade_journal_entries', 'title', existing_type=sa.VARCHAR(length=255), nullable=True)
    
    op.create_index(op.f('ix_trade_journal_entries_paper_account_id'), 'trade_journal_entries', ['paper_account_id'], unique=False)
    op.create_index(op.f('ix_trade_journal_entries_symbol'), 'trade_journal_entries', ['symbol'], unique=False)
    
    # 3. Add journal_id to paper_trades
    op.add_column('paper_trades', sa.Column('journal_id', sa.UUID(), nullable=True))
    op.create_index(op.f('ix_paper_trades_journal_id'), 'paper_trades', ['journal_id'], unique=False)
    op.create_foreign_key(None, 'paper_trades', 'trade_journal_entries', ['journal_id'], ['id'], ondelete='SET NULL')

def downgrade() -> None:
    # 1. Remove journal_id from paper_trades
    op.drop_constraint(None, 'paper_trades', type_='foreignkey')
    op.drop_index(op.f('ix_paper_trades_journal_id'), table_name='paper_trades')
    op.drop_column('paper_trades', 'journal_id')

    # 2. Remove fields from trade_journal_entries
    op.drop_index(op.f('ix_trade_journal_entries_symbol'), table_name='trade_journal_entries')
    op.drop_index(op.f('ix_trade_journal_entries_paper_account_id'), table_name='trade_journal_entries')
    op.alter_column('trade_journal_entries', 'title', existing_type=sa.VARCHAR(length=255), nullable=False)
    op.drop_column('trade_journal_entries', 'ahna_snapshot')
    op.drop_column('trade_journal_entries', 'trade_plan_snapshot')
    op.drop_column('trade_journal_entries', 'discipline_score')
    op.drop_column('trade_journal_entries', 'what_went_wrong')
    op.drop_column('trade_journal_entries', 'what_went_well')
    op.drop_column('trade_journal_entries', 'confidence')
    op.drop_column('trade_journal_entries', 'trade_thesis')
    op.drop_column('trade_journal_entries', 'entry_reason')
    op.drop_column('trade_journal_entries', 'market_condition')
    op.drop_column('trade_journal_entries', 'exit_timestamp')
    op.drop_column('trade_journal_entries', 'entry_timestamp')
    op.drop_column('trade_journal_entries', 'duration_seconds')
    op.drop_column('trade_journal_entries', 'return_percentage')
    op.drop_column('trade_journal_entries', 'realized_pnl')
    op.drop_column('trade_journal_entries', 'quantity')
    op.drop_column('trade_journal_entries', 'exit_price')
    op.drop_column('trade_journal_entries', 'entry_price')
    op.drop_column('trade_journal_entries', 'status')
    op.drop_column('trade_journal_entries', 'side')
    op.drop_column('trade_journal_entries', 'symbol')
    op.drop_column('trade_journal_entries', 'paper_account_id')

    # 3. Drop journal_observations table
    op.drop_index(op.f('ix_journal_observations_user_id'), table_name='journal_observations')
    op.drop_index(op.f('ix_journal_observations_journal_entry_id'), table_name='journal_observations')
    op.drop_table('journal_observations')
