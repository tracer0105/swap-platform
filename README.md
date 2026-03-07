# 闲置物品交换平台

这是一个使用 FastAPI + React 开发的全栈闲置物品交换系统，支持用户发布、浏览、交换物品，并可通过 WebSocket 进行实时聊天。

## 主要功能

- **用户系统**: 注册、登录、个人信息更新、头像上传。
- **物品管理**: 发布、浏览、搜索、筛选、编辑、删除闲置物品，支持多图上传。
- **交换流程**: 发起交换申请、接受/拒绝申请、取消申请。
- **实时聊天**: 基于 WebSocket 实现用户间的实时消息通信，支持在线状态显示、历史消息加载、未读消息提醒。
- **前后端分离**: 后端使用 FastAPI，前端使用 React，通过 API 进行交互。
- **一键部署**: 提供 `start.sh` 和 `start.bat` 脚本，方便在本地快速启动项目。

## 技术栈

| 分类     | 技术                                                               |
| :------- | :----------------------------------------------------------------- |
| **后端**   | FastAPI, Uvicorn, SQLAlchemy, Pydantic, python-jose, passlib, WebSockets |
| **前端**   | React, Vite, TypeScript, TailwindCSS, Zustand, Axios, react-router-dom |
| **数据库** | SQLite                                        |

## 项目结构

```
swap-platform/
├── backend/            # FastAPI 后端代码
│   ├── core/           # 核心模块 (数据库, 认证, WebSocket)
│   ├── models/         # SQLAlchemy 数据模型
│   ├── routers/        # API 路由
│   ├── schemas/        # Pydantic 数据模型
│   ├── static/         # 静态文件
│   │   ├── uploads/    # 用户上传的文件
│   │   └── dist/       # 前端构建产物
│   ├── main.py         # 应用入口
│   └── requirements.txt
├── frontend/           # React 前端代码
│   ├── src/
│   │   ├── api/        # API 请求封装
│   │   ├── components/ # 公共组件
│   │   ├── contexts/   # React Context
│   │   ├── hooks/      # 自定义 Hooks
│   │   ├── pages/      # 页面组件
│   │   ├── store/      # 全局状态管理 (Zustand)
│   │   └── types/      # TypeScript 类型定义
│   ├── package.json
│   └── vite.config.ts
├── .gitignore
├── README.md           # 项目说明
├── start.sh            # Linux/macOS 启动脚本
├── start.bat           # Windows 启动脚本
└── dev.sh              # 开发模式启动脚本
```

## 本地部署指南

### 环境要求

- Python 3.8+
- Node.js 16+
- npm 或 pnpm

### 启动步骤

1.  **下载并解压** `swap-platform.zip` 文件。

2.  **进入项目目录**: `cd swap-platform`

3.  **运行启动脚本**:
    -   在 **Linux** 或 **macOS** 系统中，执行：
        ```bash
        bash start.sh
        ```
    -   在 **Windows** 系统中，双击运行 `start.bat` 文件。

    脚本会自动完成以下操作：
    - 安装后端 Python 依赖。
    - 安装前端 Node.js 依赖并打包。
    - 启动 FastAPI 服务。

4.  **访问应用**:
    打开浏览器，访问 `http://localhost:8000` 即可开始使用。

## 开发模式

如果需要进行二次开发，可以运行 `dev.sh` (Linux/macOS) 脚本，它会分别启动前后端开发服务器，并支持热更新。

- **后端 API**: `http://localhost:8000`
- **前端页面**: `http://localhost:5173`

