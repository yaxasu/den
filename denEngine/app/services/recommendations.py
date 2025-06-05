from datetime import datetime, timedelta
from app.core.supabase import supabase
from collections import defaultdict

def get_recent_interactions(days=7):
    cutoff = (datetime.utcnow() - timedelta(days=days)).isoformat()
    result = (
        supabase
        .from_("interactions")
        .select("*")
        .gte("created_at", cutoff)
        .execute()
    )
    return result.data if result.data else []

def score_posts(user_id: str) -> list[dict]:
    cutoff = (datetime.utcnow() - timedelta(days=7)).isoformat()

    interactions = (
        supabase
        .from_("interactions")
        .select("*")
        .eq("user_id", user_id)
        .gte("created_at", cutoff)
        .execute()
    ).data or []

    post_scores = defaultdict(float)
    seen_posts = set()

    for i in interactions:
        if i.get("post_id"):
            seen_posts.add(i["post_id"])

        weight = 0
        match (i["type"], i["direction"]):
            case ("like", "positive"): weight = 1.0
            case ("unlike", _): weight = -0.5
            case ("follow", "positive"): weight = 1.5
            case ("unfollow", _): weight = -1.0

        if i.get("target_user_id"):
            posts = (
                supabase
                .from_("posts")
                .select("id")
                .eq("user_id", i["target_user_id"])
                .neq("user_id", user_id)
                .execute()
            ).data or []

            for post in posts:
                post_scores[post["id"]] += weight

    return [
        {
            "user_id": user_id,
            "post_id": post_id,
            "score": score,
            "reason": "interaction-based",
        }
        for post_id, score in post_scores.items()
        if score > 0 and post_id not in seen_posts
    ]
