from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, HttpUrl


class NewsSearchParams(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    symbol: Optional[str] = Field(None, description="Filter articles by symbol")
    limit: Optional[int] = Field(10, ge=1, le=50, description="Limit the number of returned articles")


class NewsArticleOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID = Field(..., description="Unique article ID")
    source: str = Field(..., description="Publisher/Source name")
    title: str = Field(..., description="Title of the article")
    description: str = Field(..., description="Description/Summary of the article")
    url: str = Field(..., description="URL link to the article")
    image_url: Optional[str] = Field(None, description="Image URL associated with the article")
    published_at: datetime = Field(..., description="Publish time with timezone information")
    symbol: str = Field(..., description="Associated crypto asset symbol")
    author: Optional[str] = Field(None, description="Author of the article")
    language: str = Field("en", description="Language of the article")
    relevance_score: Decimal = Field(Decimal("1.00"), description="Computed relevance of the article to the symbol (0.0 to 1.0)")


class NewsListOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    symbol: str
    articles: List[NewsArticleOut]
