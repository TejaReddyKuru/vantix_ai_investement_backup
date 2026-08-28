"""create_chat_tables

Revision ID: 54c5f5d1c6fc
Revises: 0012_align_paper_transactions
Create Date: 2026-08-27 23:45:43.243247

"""
from alembic import op
import sqlalchemy as sa
import uuid
from datetime import datetime

# revision identifiers, used by Alembic.
revision = '54c5f5d1c6fc'
down_revision = '0012_align_paper_transactions'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create chat_communities table
    op.create_table('chat_communities',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('name', sa.String(length=255), nullable=False),
    sa.Column('slug', sa.String(length=255), nullable=False),
    sa.Column('category', sa.String(length=100), nullable=False),
    sa.Column('description', sa.String(length=500), nullable=True),
    sa.Column('icon', sa.String(length=100), nullable=True),
    sa.Column('avatar_bg', sa.String(length=100), nullable=True),
    sa.Column('icon_color', sa.String(length=100), nullable=True),
    sa.Column('created_by', sa.UUID(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.ForeignKeyConstraint(['created_by'], ['users.id'], ondelete='SET NULL'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_chat_communities_slug'), 'chat_communities', ['slug'], unique=True)
    
    # Create chat_community_members table
    op.create_table('chat_community_members',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('community_id', sa.UUID(), nullable=False),
    sa.Column('user_id', sa.UUID(), nullable=False),
    sa.Column('role', sa.String(length=50), nullable=False),
    sa.Column('joined_at', sa.DateTime(), nullable=False),
    sa.ForeignKeyConstraint(['community_id'], ['chat_communities.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    
    # Create chat_community_messages table
    op.create_table('chat_community_messages',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('community_id', sa.UUID(), nullable=False),
    sa.Column('user_id', sa.UUID(), nullable=False),
    sa.Column('content', sa.Text(), nullable=False),
    sa.Column('reply_to_name', sa.String(length=255), nullable=True),
    sa.Column('reply_to_content', sa.Text(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.ForeignKeyConstraint(['community_id'], ['chat_communities.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )

    # Seed initial communities
    op.execute(
        f"""
        INSERT INTO chat_communities (id, name, slug, category, description, icon, avatar_bg, icon_color, created_at, updated_at)
        VALUES 
            ('{str(uuid.uuid4())}', 'General Discussion', 'general-discussion', 'General', 'The central hub for all Vish Capitals investors. Share daily market thoughts, macro perspectives, and high-level ideas.', 'MessageSquare', 'bg-[#0F2D1F]', 'text-[#D8E9DD]', '{datetime.utcnow().isoformat()}', '{datetime.utcnow().isoformat()}'),
            ('{str(uuid.uuid4())}', 'Investment Beginners', 'investment-beginners', 'Beginners', 'A friendly, supportive space for newcomers to learn portfolio building, risk management basics, and market fundamentals.', 'GraduationCap', 'bg-[#18794E]', 'text-white', '{datetime.utcnow().isoformat()}', '{datetime.utcnow().isoformat()}'),
            ('{str(uuid.uuid4())}', 'Stock Alerts', 'stock-alerts', 'Stocks', 'Real-time discussions and updates regarding stock positions, earnings, and breakouts.', 'TrendingUp', 'bg-[#0F2D1F]', 'text-white', '{datetime.utcnow().isoformat()}', '{datetime.utcnow().isoformat()}'),
            ('{str(uuid.uuid4())}', 'Crypto Alerts', 'crypto-alerts', 'Crypto', 'Dynamic chat regarding Bitcoin, Ethereum, and crypto assets.', 'Coins', 'bg-[#FAFAF7]', 'text-[#171717]', '{datetime.utcnow().isoformat()}', '{datetime.utcnow().isoformat()}')
        """
    )


def downgrade() -> None:
    op.drop_table('chat_community_messages')
    op.drop_table('chat_community_members')
    op.drop_index(op.f('ix_chat_communities_slug'), table_name='chat_communities')
    op.drop_table('chat_communities')
