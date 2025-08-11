# Konec OpenSearch 文件上传应用

这是一个 Node.js 应用，用于接收文件上传并将其内容发送到 AWS OpenSearch。

## 功能特性

- 支持上传 JSON、TXT 和 GZ 压缩文件
- 自动解析文件内容并转换为 OpenSearch 可识别的格式
- 按日期自动创建索引（格式：logs-YYYYMMDD）
- 符合 AWS OpenSearch 安全认证要求
- 支持批量数据上传

## 安装和配置

### 1. 安装依赖

```bash
npm install
```

### 2. 环境配置

复制环境变量示例文件并配置：

```bash
cp env.example .env
```

编辑 `.env` 文件，配置以下参数：

```env
# AWS OpenSearch 配置
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key

# OpenSearch 端点
OPENSEARCH_ENDPOINT=https://your-opensearch-domain.us-east-1.es.amazonaws.com

# 服务器配置
PORT=3000
NODE_ENV=development

# 文件上传配置
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads
```

### 3. 启动应用

开发模式：
```bash
npm run dev
```

生产模式：
```bash
npm start
```

## API 端点

### 健康检查
```
GET /health
```

### 文件上传
```
POST /api/upload
Content-Type: multipart/form-data

参数：
- file: 要上传的文件（支持 .json, .txt, .gz）
```

### 上传状态
```
GET /api/upload/status
```

## 使用示例

### 使用 curl 上传文件

```bash
# 上传 JSON 文件
curl -X POST -F "file=@data.json" http://localhost:3000/api/upload

# 上传 TXT 文件
curl -X POST -F "file=@logs.txt" http://localhost:3000/api/upload

# 上传 GZ 压缩文件
curl -X POST -F "file=@data.gz" http://localhost:3000/api/upload
```

### 使用 JavaScript 上传文件

```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);

fetch('http://localhost:3000/api/upload', {
  method: 'POST',
  body: formData
})
.then(response => response.json())
.then(data => console.log(data));
```

## 支持的文件格式

### JSON 文件
- 单个 JSON 对象
- JSON 数组
- 每行一个 JSON 对象

### TXT 文件
- 纯文本日志
- JSON 行格式
- 带时间戳的日志行

### GZ 文件
- 压缩的 JSON 或 TXT 文件
- 自动解压并解析

## 索引结构

数据会被上传到按日期命名的索引中，例如：`logs-20250807`

每个文档包含以下字段：
- `timestamp`: 时间戳
- `message`: 消息内容
- `level`: 日志级别（INFO, WARN, ERROR, DEBUG）
- `source`: 数据源标识
- `@timestamp`: OpenSearch 标准时间戳
- `upload_timestamp`: 上传时间戳

## 安全配置

应用使用 AWS IAM 认证访问 OpenSearch：

1. 确保 AWS 凭证有适当的 OpenSearch 权限
2. 配置正确的 IAM 策略
3. 使用 HTTPS 端点

## 错误处理

应用包含完整的错误处理机制：

- 文件格式验证
- 内容解析错误处理
- OpenSearch 连接错误处理
- 自动清理临时文件

## 开发

### 项目结构

```
├── server.js              # 主服务器文件
├── routes/
│   └── upload.js         # 上传路由
├── utils/
│   ├── fileProcessor.js  # 文件处理工具
│   └── opensearchClient.js # OpenSearch 客户端
├── uploads/              # 临时文件目录
├── package.json
└── README.md
```

### 添加新功能

1. 在 `utils/` 目录下添加新的工具模块
2. 在 `routes/` 目录下添加新的路由
3. 更新 `server.js` 注册新路由

## 故障排除

### 常见问题

1. **AWS 认证错误**
   - 检查 AWS 凭证配置
   - 确认 IAM 权限

2. **OpenSearch 连接失败**
   - 验证端点 URL
   - 检查网络连接

3. **文件解析错误**
   - 检查文件格式
   - 查看错误日志

### 日志

应用会在控制台输出详细的日志信息，包括：
- 文件接收确认
- 解析过程
- OpenSearch 上传状态
- 错误信息

## 许可证

MIT License 