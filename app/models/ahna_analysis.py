from datetime import datetime
from uuid import uuid4

from sqlalchemy import Column, DateTime, String, Numeric, Index
from sqlalchemy.dialects.postgresql import UUID, JSONB

from database.base import Base

class AHNAAnalysis(Base):
    __tablename__ = "ahna_analyses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    symbol = Column(String(50), nullable=False, index=True)
    question = Column(String(500), nullable=True)
    
    # Store individual agent outputs as JSONB
    market_data = Column(JSONB, nullable=True)
    news_data = Column(JSONB, nullable=True)
    sentiment_data = Column(JSONB, nullable=True)
    feature_data = Column(JSONB, nullable=True)
    risk_data = Column(JSONB, nullable=True)
    trade_data = Column(JSONB, nullable=True)
    
    # Store AI response and synthesis details
    ai_response = Column(JSONB, nullable=True)
    decision = Column(String(50), nullable=True)
    confidence = Column(Numeric(5, 2), nullable=True)
    model_version = Column(String(100), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        Index('ix_ahna_analyses_symbol_created_at', 'symbol', 'created_at'),
    )
