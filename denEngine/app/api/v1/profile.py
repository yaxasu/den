from fastapi import APIRouter, Depends, HTTPException, status
from app.core.jwt import get_current_user_id
from app.core.supabase import supabase

router = APIRouter()

@router.get("/getProfile")
def get_my_profile(user_id: str = Depends(get_current_user_id)):
    try:
        response = (
            supabase
            .from_("profiles")
            .select("*")
            .eq("id", user_id)
            .maybe_single()
            .execute()
        )

        # Check for no result
        if response.data is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Profile not found"
            )

        return response.data

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Supabase error: {str(e)}"
        )
