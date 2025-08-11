const express = require("express");
const multer = require("multer");
const path = require("path");
const rateLimit = require("express-rate-limit");
const fs = require("fs").promises; // 使用异步文件操作
const zlib = require("zlib");
const { promisify } = require("util");
const { processFileContent } = require("../utils/fileProcessor");
const { sendToOpenSearch } = require("../utils/opensearchClient");

const router = express.Router();

// 将 zlib.gunzip 转换为 Promise
const gunzip = promisify(zlib.gunzip);

// 配置 multer 用于文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = process.env.UPLOAD_PATH || "./uploads";
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const fileFilter = (req, file, cb) => {
  // 允许的文件类型
  const allowedTypes = [".json", ".txt", ".gz"];
  const fileExt = path.extname(file.originalname).toLowerCase();

  if (allowedTypes.includes(fileExt)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `不支持的文件类型: ${fileExt}。支持的类型: ${allowedTypes.join(", ")}`
      ),
      false
    );
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 30 * 1024 * 1024, // 默认30MB
  },
});

// 简单的JWT验证
function authenticateApiToken(req, res, next) {
  const token = req.headers["authorization"]?.split(" ")[1]; // Bearer <token>

  if (!token || token !== process.env.JWT_SECRET) {
    return res.status(401).json({ error: "无效或缺少 Token" });
  }
  next();
}

// 限流配置（每分钟最多 10 次)
const uploadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 10, // 最多 10 次
  message: { error: "请求过于频繁，请稍后再试" },
});

// 文件上传端点
router.post(
  "/",
  authenticateApiToken,
  uploadLimiter,
  upload.single("file"),
  async (req, res) => {
    let filePath = null;

    try {
      if (!req.file) {
        return res.status(400).json({
          error: "No files uploaded",
          message: "Please select a file to upload",
        });
      }

      console.log(`接收到文件: ${req.file.originalname}`);

      // 处理文件内容
      filePath = req.file.path;
      const fileExt = path.extname(req.file.originalname).toLowerCase();

      let fileContent;

      // 根据文件类型处理 - 使用异步操作
      if (fileExt === ".gz") {
        // 异步解压 gz 文件
        const compressedData = await fs.readFile(filePath);
        const decompressedData = await gunzip(compressedData);
        fileContent = decompressedData.toString("utf8");
      } else {
        // 异步读取 json 或 txt 文件
        fileContent = await fs.readFile(filePath, "utf8");
      }

      // 解析文件内容
      const parsedData = await processFileContent(fileContent, fileExt);

      if (!parsedData || parsedData.length === 0) {
        return res.status(400).json({
          error: "Failure to parse file contents",
          message: "Unable to extract valid data from files",
        });
      }

      // 发送到 OpenSearch
      const result = await sendToOpenSearch(parsedData);

      res.json({
        success: true,
        message: "File uploaded and processed successfully",
        filename: req.file.originalname,
        recordsProcessed: parsedData.length,
        opensearchResult: result,
      });
    } catch (error) {
      console.error("文件上传处理错误:", error);

      res.status(500).json({
        error: "Document processing failure",
        message: error.message,
      });
    } finally {
      // 统一清理临时文件
      if (filePath) {
        try {
          await fs.unlink(filePath);
          console.log(`临时文件已删除: ${filePath}`);
        } catch (cleanupError) {
          console.warn(`清理临时文件失败: ${cleanupError.message}`);
        }
      }
      if (req.file) {
        console.log(`处理完成: ${req.file.originalname}`);
      }
    }
  }
);

// 获取上传状态
// router.get("/status", (req, res) => {
//   res.json({
//     status: "running",
//     timestamp: new Date().toISOString(),
//     supportedFormats: [".json", ".txt", ".gz"],
//     maxFileSize: process.env.MAX_FILE_SIZE || "10MB",
//   });
// });

module.exports = router;
