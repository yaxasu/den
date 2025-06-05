from fastapi import APIRouter, Depends, HTTPException
from app.core.jwt import get_current_user_id
from app.tasks.recs import refresh_user_recommendations, refresh_all_user_recommendations

router = APIRouter()

@router.post("/enqueue-refresh")
def enqueue_current_user_recs(user_id: str = Depends(get_current_user_id)):
    try:
        refresh_user_recommendations.delay(user_id)
        return {"status": "queued", "user_id": user_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/enqueue-all")
def enqueue_all_users_recs():
    try:
        refresh_all_user_recommendations.delay()
        return {"status": "all queued"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
