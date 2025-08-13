const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const uploadRoutes = require("./routes/upload");

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 创建临时上传目录
const tempUploadPath = process.env.UPLOAD_PATH || "./temps";
if (!fs.existsSync(tempUploadPath)) {
  fs.mkdirSync(tempUploadPath, { recursive: true });
}

// 路由
app.use("/api/upload", uploadRoutes);

// 健康检查端点
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    message: "The server is running fine.",
  });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error("错误:", err);
  res.status(500).json({
    error: "Internal server error",
    message: err.message,
  });
});

// 404 处理
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Path not found",
    message: `Path ${req.originalUrl} does not exist`,
  });
});

app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
  console.log(`健康检查: http://localhost:${PORT}/health`);
  console.log(`上传端点: http://localhost:${PORT}/api/upload`);
});
