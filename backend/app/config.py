from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    database_url: str = "sqlite:///./edible_poc.db"
    openai_api_key: str = ""
    edible_api_url: str = "https://www.ediblearrangements.com/api/search/"

    # Model configuration
    intent_model: str = "gpt-4o"  # Strong reasoning for intent
    curation_model: str = "gpt-4o-mini"  # Fast for curation

    class Config:
        env_file = ".env"


@lru_cache
def get_settings() -> Settings:
    return Settings()
