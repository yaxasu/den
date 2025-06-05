from fastapi import APIRouter, Depends
from app.core.jwt import get_current_user_id
from app.services.recommendations import score_posts
from app.core.supabase import supabase
from app.tasks.recs import refresh_user_recommendations, refresh_all_user_recommendations

router = APIRouter()

@router.post("/refresh")
def refresh_recommendations(user_id: str = Depends(get_current_user_id)):
    scored = score_posts(user_id)

    # Wipe old recs
    supabase.table("recommended_posts").delete().eq("user_id", user_id).execute()

    if scored:
        supabase.table("recommended_posts").insert(scored).execute()

    return {"status": "ok", "count": len(scored)}

@router.get("/explore")
def get_explore_feed(user_id: str = Depends(get_current_user_id), limit: int = 20):
    recs = (
        supabase
        .from_("recommended_posts")
        .select("post_id, score")
        .eq("user_id", user_id)
        .order("score", desc=True)
        .limit(limit)
        .execute()
    ).data or []

    post_ids = [r["post_id"] for r in recs]

    if not post_ids:
        # Fallback to random posts
        random_posts = (
            supabase
            .from_("posts")
            .select("*")
            .order("created_at", desc=False)
            .limit(limit)
            .execute()
        ).data or []
        return random_posts

    posts = (
        supabase
        .from_("posts")
        .select("*, user:profiles(*)")
        .in_("id", post_ids)
        .execute()
    ).data or []

    return posts
