from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import update

from app.database import get_db
from app.models import Session as DBSession, ProductClick
from app.schemas import ClickRequest, ConvertRequest, StatusResponse

router = APIRouter()


@router.post("/analytics/click", response_model=StatusResponse)
def track_click(request: ClickRequest, db: Session = Depends(get_db)):
    """
    Track when a user clicks on a product card.

    Records the SKU, product name, and position in the recommendation list.
    """
    try:
        # Verify session exists
        session = db.query(DBSession).filter(DBSession.id == request.session_id).first()

        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

        # Record the click
        click = ProductClick(
            session_id=request.session_id,
            sku=request.sku,
            name=request.name,
            position=request.position,
        )
        db.add(click)
        db.flush()

        return StatusResponse(status="ok")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/analytics/convert", response_model=StatusResponse)
def mark_converted(request: ConvertRequest, db: Session = Depends(get_db)):
    """
    Mark a session as converted (user proceeded toward purchase).

    Called when user clicks through to the product detail page or adds to cart.
    """
    try:
        # Update session converted flag
        session = db.query(DBSession).filter(DBSession.id == request.session_id).first()

        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

        session.converted = True
        db.flush()

        return StatusResponse(status="ok")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
