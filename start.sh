#!/bin/bash

echo "🚀 启动 Konec OpenSearch 文件上传应用"

# 检查 Node.js 是否安装
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未找到 Node.js，请先安装 Node.js"
    exit 1
fi

# 检查 npm 是否安装
if ! command -v npm &> /dev/null; then
    echo "❌ 错误: 未找到 npm，请先安装 npm"
    exit 1
fi

# 检查 .env 文件是否存在
if [ ! -f .env ]; then
    echo "⚠️  警告: 未找到 .env 文件"
    echo "📝 请复制 env.example 为 .env 并配置您的 AWS 凭证"
    echo "   cp env.example .env"
    echo ""
fi

# 安装依赖
echo "📦 安装依赖..."
npm install

# 创建必要的目录
echo "📁 创建必要的目录..."
mkdir -p uploads
mkdir -p public

# 启动应用
echo "🌟 启动应用..."
echo "📱 访问 http://localhost:3000 查看测试页面"
echo "🔧 API 端点: http://localhost:3000/api/upload"
echo "💚 健康检查: http://localhost:3000/health"
echo ""
echo "按 Ctrl+C 停止应用"
echo ""

npm start 