from app.core.celery import celery
from app.core.supabase import supabase
from app.services.recommendations import score_posts

@celery.task
def refresh_user_recommendations(user_id: str):
    scored = score_posts(user_id)
    supabase.table("recommended_posts").delete().eq("user_id", user_id).execute()
    if scored:
        supabase.table("recommended_posts").insert(scored).execute()

@celery.task
def refresh_all_user_recommendations():
    res = supabase.from_("profiles").select("id").execute()
    users = res.data or []
    for user in users:
        refresh_user_recommendations.delay(user["id"])
    return {"status": "queued", "user_count": len(users)}
