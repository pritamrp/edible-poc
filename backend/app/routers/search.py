from fastapi import APIRouter, HTTPException

from app.schemas import SearchRequest, EdibleProduct
from app.services.edible_client import search_products

router = APIRouter()


@router.post("/search", response_model=list[EdibleProduct])
def search(request: SearchRequest):
    """
    Proxy endpoint for Edible catalog search.

    Accepts a keyword and returns matching products from the Edible API.
    This keeps API calls server-side and enables caching later.
    """
    try:
        products = search_products([request.keyword])
        return products
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
