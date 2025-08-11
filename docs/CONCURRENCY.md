# 并发处理能力说明

## 概述

本应用支持并发文件上传和处理，经过优化以确保在高并发场景下的稳定性和性能。

## 并发支持特性

### ✅ 已实现的并发支持

1. **异步文件操作**
   - 使用 `fs.promises` 进行异步文件读写
   - 异步文件解压缩 (`zlib.gunzip`)
   - 异步文件清理

2. **非阻塞处理**
   - Express.js 默认支持并发请求处理
   - Multer 中间件支持并发文件上传
   - OpenSearch 客户端支持并发操作

3. **错误隔离**
   - 每个请求独立处理，错误不会影响其他请求
   - 完善的错误处理和资源清理

### 🔧 性能优化

1. **文件处理优化**
   ```javascript
   // 异步文件读取
   const fileContent = await fs.readFile(filePath, 'utf8');
   
   // 异步解压缩
   const decompressedData = await gunzip(compressedData);
   
   // 异步文件清理
   await fs.unlink(filePath);
   ```

2. **OpenSearch 批量操作**
   - 使用 bulk API 进行批量数据上传
   - 减少网络往返次数

3. **内存管理**
   - 及时清理临时文件
   - 避免内存泄漏

## 并发测试

### 运行并发测试

```bash
# 基础并发测试
npm run test-concurrent

# 或者直接运行
node test/concurrent-test.js
```

### 测试内容

1. **基础并发测试**
   - 同时上传 5 个不同格式的文件
   - 测量处理时间和成功率

2. **压力测试**
   - 多轮并发测试
   - 测试系统稳定性

3. **性能指标**
   - 平均处理时间
   - 成功率
   - 并发处理能力

## 性能基准

### 预期性能指标

| 并发数 | 平均处理时间 | 成功率 | 备注 |
|--------|-------------|--------|------|
| 5      | < 2秒       | > 95%  | 基础并发 |
| 10     | < 3秒       | > 90%  | 中等负载 |
| 20     | < 5秒       | > 85%  | 高负载 |

### 影响因素

1. **文件大小**
   - 大文件会增加处理时间
   - 建议文件大小 < 30MB

2. **网络延迟**
   - OpenSearch 连接延迟
   - 网络带宽限制

3. **服务器资源**
   - CPU 使用率
   - 内存可用性
   - 磁盘 I/O

## 监控和调优

### 监控指标

1. **请求处理时间**
   ```javascript
   const startTime = Date.now();
   // 处理逻辑
   const duration = Date.now() - startTime;
   ```

2. **错误率**
   - 文件处理错误
   - OpenSearch 连接错误
   - 网络超时

3. **资源使用**
   - 内存使用率
   - CPU 使用率
   - 磁盘空间

### 调优建议

1. **增加并发处理能力**
   ```javascript
   // 在 server.js 中设置
   const cluster = require('cluster');
   const numCPUs = require('os').cpus().length;
   
   if (cluster.isMaster) {
     for (let i = 0; i < numCPUs; i++) {
       cluster.fork();
     }
   }
   ```

2. **优化文件大小限制**
   ```javascript
   // 在 .env 中设置
   MAX_FILE_SIZE=50MB
   ```

3. **调整 OpenSearch 连接池**
   ```javascript
   // 在 opensearchClient.js 中
   const client = new Client({
     // ... 其他配置
     maxRetries: 3,
     requestTimeout: 30000,
   });
   ```

## 故障排除

### 常见问题

1. **内存不足**
   - 减少并发数
   - 增加服务器内存
   - 优化文件处理逻辑

2. **网络超时**
   - 检查网络连接
   - 增加超时时间
   - 重试机制

3. **文件处理错误**
   - 检查文件格式
   - 验证文件完整性
   - 查看错误日志

### 日志分析

```bash
# 查看服务器日志
tail -f server.log

# 查看错误日志
grep "ERROR" server.log

# 查看性能日志
grep "duration" server.log
```

## 最佳实践

1. **文件上传**
   - 使用合适的文件大小
   - 确保文件格式正确
   - 避免同时上传过多文件

2. **系统配置**
   - 定期监控系统资源
   - 设置合理的并发限制
   - 配置适当的超时时间

3. **错误处理**
   - 实现重试机制
   - 记录详细错误信息
   - 提供用户友好的错误消息

## 扩展性

### 水平扩展

1. **负载均衡**
   - 使用 Nginx 进行负载均衡
   - 部署多个应用实例

2. **容器化**
   - 使用 Docker 容器化应用
   - 使用 Kubernetes 进行编排

3. **微服务架构**
   - 将文件处理拆分为独立服务
   - 使用消息队列进行解耦

### 垂直扩展

1. **增加服务器资源**
   - 更多 CPU 核心
   - 更大内存容量
   - 更快存储设备

2. **优化数据库**
   - 使用更快的 OpenSearch 集群
   - 优化索引配置
   - 增加缓存层 