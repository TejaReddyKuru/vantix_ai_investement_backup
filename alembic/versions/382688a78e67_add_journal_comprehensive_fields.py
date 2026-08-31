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
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = inspector.get_table_names()

    # 1. Create journal_observations table if not present
    if 'journal_observations' not in tables:
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
    tje_cols = [c['name'] for c in inspector.get_columns('trade_journal_entries')]
    
    cols_to_add = [
        ('paper_account_id', sa.Column('paper_account_id', sa.UUID(), nullable=True)),
        ('symbol', sa.Column('symbol', sa.String(length=50), nullable=True)),
        ('side', sa.Column('side', sa.String(length=10), nullable=True)),
        ('status', sa.Column('status', sa.String(length=50), nullable=True)),
        ('entry_price', sa.Column('entry_price', sa.Numeric(precision=20, scale=8), nullable=True)),
        ('exit_price', sa.Column('exit_price', sa.Numeric(precision=20, scale=8), nullable=True)),
        ('quantity', sa.Column('quantity', sa.Numeric(precision=20, scale=8), nullable=True)),
        ('realized_pnl', sa.Column('realized_pnl', sa.Numeric(precision=20, scale=8), nullable=True)),
        ('return_percentage', sa.Column('return_percentage', sa.Numeric(precision=10, scale=4), nullable=True)),
        ('duration_seconds', sa.Column('duration_seconds', sa.Integer(), nullable=True)),
        ('entry_timestamp', sa.Column('entry_timestamp', sa.DateTime(), nullable=True)),
        ('exit_timestamp', sa.Column('exit_timestamp', sa.DateTime(), nullable=True)),
        ('market_condition', sa.Column('market_condition', sa.String(length=255), nullable=True)),
        ('entry_reason', sa.Column('entry_reason', sa.Text(), nullable=True)),
        ('trade_thesis', sa.Column('trade_thesis', sa.Text(), nullable=True)),
        ('confidence', sa.Column('confidence', sa.Integer(), nullable=True)),
        ('what_went_well', sa.Column('what_went_well', sa.Text(), nullable=True)),
        ('what_went_wrong', sa.Column('what_went_wrong', sa.Text(), nullable=True)),
        ('discipline_score', sa.Column('discipline_score', sa.Integer(), nullable=True)),
        ('trade_plan_snapshot', sa.Column('trade_plan_snapshot', postgresql.JSONB(astext_type=sa.Text()), nullable=True)),
        ('ahna_snapshot', sa.Column('ahna_snapshot', postgresql.JSONB(astext_type=sa.Text()), nullable=True)),
    ]
    
    for col_name, col_def in cols_to_add:
        if col_name not in tje_cols:
            op.add_column('trade_journal_entries', col_def)
    
    # 3. Add journal_id to paper_trades
    pt_cols = [c['name'] for c in inspector.get_columns('paper_trades')]
    if 'journal_id' not in pt_cols:
        op.add_column('paper_trades', sa.Column('journal_id', sa.UUID(), nullable=True))
        op.create_index(op.f('ix_paper_trades_journal_id'), 'paper_trades', ['journal_id'], unique=False)

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
