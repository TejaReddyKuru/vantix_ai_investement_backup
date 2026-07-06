from sqlalchemy import Column, Integer, String, Float, JSON
from database.base import Base


class Market(Base):
    __tablename__ = "markets"
    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String, index=True, unique=True)
    last_price = Column(Float)
    metadata = Column(JSON)
