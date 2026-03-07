from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from core.database import engine, Base
import models  # 确保所有模型被导入以创建表
import os

# 创建所有数据库表
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="闲置物品交换平台",
    description="基于 FastAPI + WebSocket 的闲置物品交换系统",
    version="1.0.0",
)

# CORS 配置（允许前端开发服务器跨域）
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册 API 路由（必须在静态文件挂载之前）
from routers.auth import router as auth_router
from routers.items import router as items_router
from routers.exchanges import router as exchanges_router
from routers.chat import router as chat_router

app.include_router(auth_router)
app.include_router(items_router)
app.include_router(exchanges_router)
app.include_router(chat_router)


@app.get("/api/health")
async def health():
    return {"status": "ok"}


# 静态文件目录
STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
UPLOADS_DIR = os.path.join(STATIC_DIR, "uploads")
DIST_DIR = os.path.join(STATIC_DIR, "dist")
os.makedirs(UPLOADS_DIR, exist_ok=True)

# 挂载上传文件目录
app.mount("/static/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")

# 挂载前端构建产物中的 assets 目录
if os.path.exists(DIST_DIR):
    assets_dir = os.path.join(DIST_DIR, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/", include_in_schema=False)
    async def serve_index():
        return FileResponse(os.path.join(DIST_DIR, "index.html"))

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_frontend(request: Request, full_path: str):
        # API 和 WebSocket 请求不走这里（已在上方注册）
        if full_path.startswith("api/") or full_path.startswith("ws/"):
            return JSONResponse({"detail": "Not Found"}, status_code=404)

        # 尝试直接返回静态文件（如 favicon.ico 等）
        static_file = os.path.join(DIST_DIR, full_path)
        if os.path.isfile(static_file):
            return FileResponse(static_file)

        # 其余所有路径返回 index.html（SPA 路由）
        index_file = os.path.join(DIST_DIR, "index.html")
        return FileResponse(index_file)

else:
    @app.get("/", include_in_schema=False)
    async def root():
        return {
            "message": "闲置物品交换平台 API 正在运行",
            "docs": "/docs",
            "note": "前端未构建，请在 frontend/ 目录运行 npm run build"
        }
