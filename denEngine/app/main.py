from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1 import profile, explore, recommendations

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # restrict in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# app.include_router(posts.router, prefix="/v1/posts", tags=["posts"])
app.include_router(profile.router, prefix="/v1/profile", tags=["profile"])
app.include_router(explore.router, prefix="/v1/explore", tags=["explore"])
app.include_router(recommendations.router, prefix="/v1/recommendations", tags=["recommendations"])

@app.get("/")
def root():
    return {"status": "API running"}
