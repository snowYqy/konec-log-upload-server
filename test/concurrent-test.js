/**
 * 并发测试脚本
 * 测试多个文件同时上传的性能和稳定性
 */

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const UPLOAD_ENDPOINT = `${BASE_URL}/api/upload`;

// 创建测试数据
function createTestFile(filename, content) {
  const testDir = path.join(__dirname, 'temp');
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }
  
  const filePath = path.join(testDir, filename);
  fs.writeFileSync(filePath, content);
  return filePath;
}

// 上传单个文件
async function uploadFile(filePath, filename) {
  const form = new FormData();
  form.append('file', fs.createReadStream(filePath), filename);
  
  const startTime = Date.now();
  
  try {
    const response = await fetch(UPLOAD_ENDPOINT, {
      method: 'POST',
      body: form,
      headers: form.getHeaders()
    });
    
    const result = await response.json();
    const endTime = Date.now();
    
    return {
      success: response.ok,
      filename,
      duration: endTime - startTime,
      result
    };
  } catch (error) {
    const endTime = Date.now();
    return {
      success: false,
      filename,
      duration: endTime - startTime,
      error: error.message
    };
  }
}

// 并发上传测试
async function concurrentUploadTest(concurrency = 5) {
  console.log(`开始并发测试，并发数: ${concurrency}`);
  
  // 创建测试文件
  const testFiles = [];
  const testData = [
    { filename: 'test1.json', content: JSON.stringify([{ message: '测试消息1', timestamp: new Date().toISOString() }]) },
    { filename: 'test2.txt', content: '2025-01-07T10:30:00Z INFO 测试日志1\n2025-01-07T10:31:00Z WARN 测试日志2' },
    { filename: 'test3.json', content: JSON.stringify([{ message: '测试消息3', level: 'ERROR', timestamp: new Date().toISOString() }]) },
    { filename: 'test4.txt', content: '2025-01-07T10:32:00Z DEBUG 调试信息\n2025-01-07T10:33:00Z INFO 信息日志' },
    { filename: 'test5.json', content: JSON.stringify([{ message: '测试消息5', source: 'concurrent_test', timestamp: new Date().toISOString() }]) }
  ];
  
  for (const test of testData) {
    const filePath = createTestFile(test.filename, test.content);
    testFiles.push({ filePath, filename: test.filename });
  }
  
  console.log(`创建了 ${testFiles.length} 个测试文件`);
  
  // 执行并发上传
  const startTime = Date.now();
  const promises = testFiles.map(({ filePath, filename }) => 
    uploadFile(filePath, filename)
  );
  
  const results = await Promise.allSettled(promises);
  const endTime = Date.now();
  
  // 分析结果
  const successful = results.filter(r => r.status === 'fulfilled' && r.value.success);
  const failed = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success));
  
  console.log('\n=== 并发测试结果 ===');
  console.log(`总耗时: ${endTime - startTime}ms`);
  console.log(`成功: ${successful.length}/${results.length}`);
  console.log(`失败: ${failed.length}/${results.length}`);
  
  if (successful.length > 0) {
    const avgDuration = successful.reduce((sum, r) => sum + r.value.duration, 0) / successful.length;
    console.log(`平均处理时间: ${avgDuration.toFixed(2)}ms`);
  }
  
  // 显示详细结果
  console.log('\n=== 详细结果 ===');
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      const { filename, duration, success, result: uploadResult } = result.value;
      console.log(`${index + 1}. ${filename}: ${success ? '成功' : '失败'} (${duration}ms)`);
      if (success && uploadResult.recordsProcessed) {
        console.log(`   处理记录数: ${uploadResult.recordsProcessed}`);
      }
    } else {
      console.log(`${index + 1}. 文件${index + 1}: 失败 - ${result.reason}`);
    }
  });
  
  // 清理测试文件
  testFiles.forEach(({ filePath }) => {
    try {
      fs.unlinkSync(filePath);
    } catch (error) {
      console.warn(`清理文件失败: ${filePath}`);
    }
  });
  
  return {
    totalTime: endTime - startTime,
    successful: successful.length,
    failed: failed.length,
    total: results.length
  };
}

// 压力测试
async function stressTest(maxConcurrency = 10, rounds = 3) {
  console.log(`\n=== 压力测试 ===`);
  console.log(`最大并发数: ${maxConcurrency}, 测试轮数: ${rounds}`);
  
  const results = [];
  
  for (let i = 1; i <= rounds; i++) {
    console.log(`\n第 ${i} 轮测试:`);
    const result = await concurrentUploadTest(maxConcurrency);
    results.push(result);
    
    // 等待一段时间再进行下一轮
    if (i < rounds) {
      console.log('等待 2 秒后进行下一轮测试...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  // 汇总结果
  console.log('\n=== 压力测试汇总 ===');
  const totalSuccessful = results.reduce((sum, r) => sum + r.successful, 0);
  const totalFailed = results.reduce((sum, r) => sum + r.failed, 0);
  const totalTime = results.reduce((sum, r) => sum + r.totalTime, 0);
  
  console.log(`总测试次数: ${totalSuccessful + totalFailed}`);
  console.log(`总成功次数: ${totalSuccessful}`);
  console.log(`总失败次数: ${totalFailed}`);
  console.log(`成功率: ${((totalSuccessful / (totalSuccessful + totalFailed)) * 100).toFixed(2)}%`);
  console.log(`总耗时: ${totalTime}ms`);
  console.log(`平均每轮耗时: ${(totalTime / rounds).toFixed(2)}ms`);
}

// 主函数
async function main() {
  try {
    // 检查服务器是否运行
    const healthResponse = await fetch(`${BASE_URL}/health`);
    if (!healthResponse.ok) {
      throw new Error('服务器未运行或无法访问');
    }
    
    console.log('服务器连接正常，开始并发测试...\n');
    
    // 基础并发测试
    await concurrentUploadTest(5);
    
    // 压力测试
    await stressTest(10, 3);
    
    console.log('\n并发测试完成！');
    
  } catch (error) {
    console.error('测试失败:', error.message);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = {
  concurrentUploadTest,
  stressTest
}; 