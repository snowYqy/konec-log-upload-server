# 🚀 快速开始指南

## 1. 环境准备

确保您的系统已安装：
- Node.js (版本 14 或更高)
- npm (通常随 Node.js 一起安装)

## 2. 项目设置

### 方法一：使用启动脚本（推荐）
```bash
./start.sh
```

### 方法二：手动设置
```bash
# 安装依赖
npm install

# 配置环境变量
cp env.example .env
# 编辑 .env 文件，填入您的 AWS 凭证

# 启动应用
npm start
```

## 3. 配置 AWS 凭证

编辑 `.env` 文件，填入以下信息：

```env
# AWS OpenSearch 配置
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key

# OpenSearch 端点
OPENSEARCH_ENDPOINT=https://your-opensearch-domain.us-east-1.es.amazonaws.com
```

## 4. 测试应用

### 方法一：使用 Web 界面
1. 打开浏览器访问：http://localhost:3000
2. 点击"选择文件"按钮
3. 选择要上传的文件（支持 .json, .txt, .gz）
4. 查看上传结果

### 方法二：使用 curl 命令
```bash
# 上传 JSON 文件
curl -X POST -F "file=@test/sample-data.json" http://localhost:3000/api/upload

# 上传 TXT 文件
curl -X POST -F "file=@test/sample-logs.txt" http://localhost:3000/api/upload
```

### 方法三：运行测试脚本
```bash
node test/test-upload.js
```

## 5. API 端点

- **健康检查**: `GET /health`
- **文件上传**: `POST /api/upload`
- **上传状态**: `GET /api/upload/status`

## 6. 支持的文件格式

### JSON 文件 (.json)
```json
[
  {
    "timestamp": "2025-08-07T10:30:00Z",
    "message": "应用启动成功",
    "level": "INFO"
  }
]
```

### 文本文件 (.txt)
```
2025-08-07T10:30:00Z INFO 应用启动成功
2025-08-07T10:31:00Z ERROR 连接失败
```

### GZ 压缩文件 (.gz)
- 压缩的 JSON 或 TXT 文件
- 自动解压并解析

## 7. 索引结构

数据会被上传到按日期命名的索引中：
- 格式：`logs-YYYYMMDD`
- 示例：`logs-20250807`

## 8. 故障排除

### 常见问题

1. **端口被占用**
   ```bash
   # 修改端口
   PORT=3001 npm start
   ```

2. **AWS 认证错误**
   - 检查 AWS 凭证是否正确
   - 确认 IAM 权限是否足够

3. **OpenSearch 连接失败**
   - 验证端点 URL 是否正确
   - 检查网络连接

4. **文件上传失败**
   - 检查文件格式是否支持
   - 查看服务器日志

### 查看日志
应用会在控制台输出详细的日志信息，包括：
- 文件接收确认
- 解析过程
- OpenSearch 上传状态
- 错误信息

## 9. 开发模式

使用 nodemon 进行开发：
```bash
npm run dev
```

## 10. 生产部署

1. 设置环境变量
2. 使用 PM2 或类似工具管理进程
3. 配置反向代理（如 Nginx）
4. 设置 SSL 证书

```bash
# 使用 PM2 部署
npm install -g pm2
pm2 start server.js --name "konec-opensearch-app"
pm2 save
pm2 startup
``` 