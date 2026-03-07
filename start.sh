#!/bin/bash
# 闲置物品交换平台 - 一键启动脚本（Linux / macOS）

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"

echo "=========================================="
echo "  闲置物品交换平台 - 启动中..."
echo "=========================================="

# ---------- 环境检查 ----------
echo ""
echo "[检查] 验证运行环境..."

command -v python3 >/dev/null 2>&1 || {
    echo "[错误] 未找到 python3，请先安装 Python 3.8+"
    exit 1
}

command -v node >/dev/null 2>&1 || {
    echo "[错误] 未找到 node，请先安装 Node.js 16+"
    exit 1
}

command -v npm >/dev/null 2>&1 || {
    echo "[错误] 未找到 npm，请先安装 npm"
    exit 1
}

# 兼容 pip3 / pip
PIP_CMD=""
command -v pip3 >/dev/null 2>&1 && PIP_CMD="pip3"
command -v pip  >/dev/null 2>&1 && [ -z "$PIP_CMD" ] && PIP_CMD="pip"
if [ -z "$PIP_CMD" ]; then
    echo "[错误] 未找到 pip，请先安装 pip"
    exit 1
fi

echo "  Python : $(python3 --version)"
echo "  Node.js: $(node --version)"
echo "  npm    : $(npm --version)"
echo "  pip    : $($PIP_CMD --version | head -1)"

# ---------- 步骤 1：安装后端依赖 ----------
echo ""
echo "[1/3] 安装后端 Python 依赖..."
$PIP_CMD install -r "$BACKEND_DIR/requirements.txt"
if [ $? -ne 0 ]; then
    echo "[错误] 后端依赖安装失败"
    echo "  建议使用虚拟环境："
    echo "    python3 -m venv venv"
    echo "    source venv/bin/activate"
    echo "    bash start.sh"
    exit 1
fi
echo "  [OK] 后端依赖安装完成"

# ---------- 步骤 2：安装前端依赖 ----------
echo ""
echo "[2/3] 构建前端..."
cd "$FRONTEND_DIR" || exit 1

if [ ! -d "node_modules" ]; then
    echo "  首次运行，安装前端依赖（可能需要几分钟）..."
    npm install
    if [ $? -ne 0 ]; then
        echo "[错误] 前端依赖安装失败"
        exit 1
    fi
    echo "  [OK] 前端依赖安装完成"
fi

# ---------- 步骤 3：构建前端 ----------
npm run build
if [ $? -ne 0 ]; then
    echo "[错误] 前端构建失败"
    exit 1
fi
echo "  [OK] 前端构建完成"

# ---------- 步骤 4：启动后端服务 ----------
echo ""
echo "[3/3] 启动服务..."
echo ""
echo "=========================================="
echo "  服务已启动！"
echo "  前端页面: http://localhost:8000"
echo "  API 文档: http://localhost:8000/docs"
echo "  按 Ctrl+C 停止服务"
echo "=========================================="
echo ""

cd "$BACKEND_DIR" || exit 1
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
