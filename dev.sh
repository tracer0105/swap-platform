#!/bin/bash
# 闲置物品交换平台 - 开发模式启动（前后端分离，支持热更新）

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"

echo "=========================================="
echo "  开发模式启动（前后端热更新）"
echo "=========================================="
echo ""
echo "  后端 API: http://localhost:8000"
echo "  前端页面: http://localhost:5173"
echo "  API 文档: http://localhost:8000/docs"
echo ""
echo "  按 Ctrl+C 停止所有服务"
echo "=========================================="

# 检查前端依赖
if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
    echo ""
    echo "  首次运行，正在安装前端依赖..."
    cd "$FRONTEND_DIR" && npm install
fi

# 启动后端（后台）
cd "$BACKEND_DIR"
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!
echo ""
echo "  后端已启动 (PID: $BACKEND_PID)"

# 等待后端就绪
sleep 2

# 启动前端开发服务器
cd "$FRONTEND_DIR"
npm run dev &
FRONTEND_PID=$!
echo "  前端已启动 (PID: $FRONTEND_PID)"
echo ""

# 捕获中断信号，优雅停止
trap "echo ''; echo '正在停止服务...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT TERM
wait
