/**
 * 文件内容处理工具
 * 支持解析 JSON、TXT 和 GZ 文件内容
 */

const processFileContent = async (fileContent, fileExt) => {
  try {
    let parsedData = [];

    switch (fileExt) {
      case ".json":
        parsedData = parseJsonContent(fileContent);
        break;
      case ".txt":
        parsedData = parseTxtContent(fileContent);
        break;
      default:
        // 对于 gz 文件，内容已经被解压，尝试自动检测格式
        parsedData = autoDetectAndParse(fileContent);
        break;
    }

    // 验证和标准化数据
    return validateAndNormalizeData(parsedData);
  } catch (error) {
    console.error("文件内容处理错误:", error);
    throw new Error(`Failure to parse file contents: ${error.message}`);
  }
};

/**
 * 解析 JSON 文件内容
 */
const parseJsonContent = (content) => {
  try {
    const lines = content.split("\n").filter((line) => line.trim() !== "");

    const data = lines.map((line) => JSON.parse(line));
    // const data = JSON.parse(content);

    // 如果是数组，直接返回
    if (Array.isArray(data)) {
      return data;
    }

    // 如果是对象，包装成数组
    if (typeof data === "object" && data !== null) {
      return [data];
    }

    throw new Error("Invalid JSON format");
  } catch (error) {
    throw new Error(`JSON parsing failure: ${error.message}`);
  }
};

/**
 * 解析 TXT 文件内容
 * 支持多种格式：JSON 行、日志行、CSV 等
 */
const parseTxtContent = (content) => {
  const lines = content.split("\n").filter((line) => line.trim());
  const parsedData = [];

  for (const line of lines) {
    try {
      // 尝试解析为 JSON
      const jsonData = JSON.parse(line.trim());
      parsedData.push(jsonData);
    } catch (error) {
      // 如果不是 JSON，尝试解析为日志格式
      const logData = parseLogLine(line);
      if (logData) {
        parsedData.push(logData);
      }
    }
  }

  return parsedData;
};

/**
 * 解析日志行
 * 支持常见的日志格式
 */
const parseLogLine = (line) => {
  // 移除前后空格
  const trimmedLine = line.trim();
  if (!trimmedLine) return null;

  // 尝试匹配时间戳格式
  const timestampRegex = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?)/;
  const match = trimmedLine.match(timestampRegex);

  if (match) {
    const timestamp = match[1];
    const message = trimmedLine.substring(timestamp.length).trim();

    return {
      timestamp: new Date(timestamp).toISOString(),
      message: message,
      level: extractLogLevel(message),
      source: "file_upload",
    };
  }

  // 如果没有时间戳，创建默认结构
  return {
    timestamp: new Date().toISOString(),
    message: trimmedLine,
    level: "INFO",
    source: "file_upload",
  };
};

/**
 * 提取日志级别
 */
const extractLogLevel = (message) => {
  const levelPatterns = [
    { pattern: /ERROR|FATAL/i, level: "ERROR" },
    { pattern: /WARN/i, level: "WARN" },
    { pattern: /INFO/i, level: "INFO" },
    { pattern: /DEBUG/i, level: "DEBUG" },
  ];

  for (const { pattern, level } of levelPatterns) {
    if (pattern.test(message)) {
      return level;
    }
  }

  return "INFO";
};

/**
 * 自动检测和解析内容格式
 */
const autoDetectAndParse = (content) => {
  // 尝试解析为 JSON
  try {
    return parseJsonContent(content);
  } catch (error) {
    // 如果不是 JSON，按文本处理
    return parseTxtContent(content);
  }
};

/**
 * 验证和标准化数据
 */
const validateAndNormalizeData = (data) => {
  if (!Array.isArray(data)) {
    throw new Error("Data must be in array format");
  }

  return data.map((item, index) => {
    // 确保每个项目都是对象
    if (typeof item !== "object" || item === null) {
      return {
        message: String(item),
        timestamp: new Date().toISOString(),
        index: index,
      };
    }

    // 标准化时间戳
    if (!item.timestamp) {
      item.timestamp = new Date().toISOString();
    }
    return item;
  });
};

module.exports = {
  processFileContent,
};
