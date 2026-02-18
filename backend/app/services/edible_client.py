import httpx

from app.config import get_settings
from app.schemas import EdibleProduct

settings = get_settings()

# Headers required by Edible API
HEADERS = {
    "Content-Type": "application/json",
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

EDIBLE_BASE_URL = "https://www.ediblearrangements.com"


def parse_edible_product(raw: dict) -> EdibleProduct | None:
    """Parse a raw product from the Edible API into our schema."""
    try:
        # SKU: use catalogCode (primary), fallback to number or id
        sku = str(raw.get("catalogCode") or raw.get("number") or raw.get("id") or "").strip()

        # Name
        name = (raw.get("name") or "").strip()

        # Price: use minPrice (the starting price)
        price = 0.0
        if "minPrice" in raw:
            price = float(raw["minPrice"])
        elif "maxPrice" in raw:
            price = float(raw["maxPrice"])

        # Image URL: prefer full image over thumbnail
        image_url = raw.get("image") or raw.get("thumbnail") or ""

        # Product detail page URL: needs base URL prefix
        url_path = (raw.get("url") or "").strip()
        if url_path:
            if url_path.startswith("http"):
                pdp_url = url_path
            else:
                url_path = url_path.lstrip("/")
                pdp_url = f"{EDIBLE_BASE_URL}/product/{url_path}"
        else:
            pdp_url = ""

        # Description
        description = raw.get("description") or raw.get("metaTagDescription") or ""

        # Tags: combine occasion + parse from category
        tags = []

        # Add occasion as a tag
        occasion = raw.get("occasion")
        if occasion:
            tags.append(occasion)

        # Add some category-based tags (parse first few relevant ones)
        category = raw.get("category") or ""
        if category:
            cat_parts = [c.strip() for c in category.split(",")]
            # Pick meaningful tags (skip generic ones)
            for cat in cat_parts[:3]:
                if cat and cat not in ["All Products", "Featured Arrangements"] and cat not in tags:
                    tags.append(cat)
                    if len(tags) >= 4:
                        break

        if raw.get("promo"):
            tags.append("Sale")

        # Validate required fields
        if not sku or not name:
            return None

        return EdibleProduct(
            sku=sku,
            name=name,
            price=price,
            image_url=image_url,
            description=description,
            tags=tags[:4],  # Limit to 4 tags
            pdp_url=pdp_url,
        )
    except (KeyError, TypeError, ValueError) as e:
        print(f"Error parsing product: {e}")
        return None


def fetch_single_keyword(keyword: str) -> list[EdibleProduct]:
    """Fetch products for a single keyword from Edible API."""
    try:
        with httpx.Client() as client:
            response = client.post(
                settings.edible_api_url,
                json={"keyword": keyword},
                headers=HEADERS,
                timeout=15.0,
            )
            response.raise_for_status()
            data = response.json()

        # API returns a top-level list of products
        raw_products = data if isinstance(data, list) else []

        products = []
        for raw in raw_products:
            product = parse_edible_product(raw)
            if product:
                products.append(product)

        print(f"Fetched {len(products)} products for keyword '{keyword}'")
        return products

    except httpx.HTTPError as e:
        print(f"HTTP error fetching products for keyword '{keyword}': {e}")
        return []
    except Exception as e:
        print(f"Error fetching products for keyword '{keyword}': {e}")
        return []


def search_products(keywords: list[str]) -> list[EdibleProduct]:
    """
    Search for products using multiple keywords.

    Deduplicates results by SKU and returns combined list.
    """
    if not keywords:
        return []

    # Fetch all keywords (sync)
    all_results = []
    for keyword in keywords[:3]:  # Max 3 keywords
        all_results.append(fetch_single_keyword(keyword))

    # Combine and deduplicate
    seen_skus = set()
    all_products = []

    for product_list in all_results:
        for product in product_list:
            if product.sku not in seen_skus:
                seen_skus.add(product.sku)
                all_products.append(product)

    return all_products
