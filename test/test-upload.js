/**
 * 文件上传测试脚本
 */

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

async function testHealthCheck() {
    console.log('🔍 测试健康检查...');
    try {
        const response = await fetch(`${BASE_URL}/health`);
        const data = await response.json();
        console.log('✅ 健康检查通过:', data);
        return true;
    } catch (error) {
        console.log('❌ 健康检查失败:', error.message);
        return false;
    }
}

async function testFileUpload(filePath, expectedRecords) {
    console.log(`📤 测试文件上传: ${path.basename(filePath)}`);
    
    try {
        const formData = new FormData();
        formData.append('file', fs.createReadStream(filePath));
        
        const response = await fetch(`${BASE_URL}/api/upload`, {
            method: 'POST',
            body: formData
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log('✅ 文件上传成功:', {
                filename: result.filename,
                recordsProcessed: result.recordsProcessed,
                success: result.success
            });
            
            if (result.recordsProcessed === expectedRecords) {
                console.log('✅ 记录数量匹配');
            } else {
                console.log('⚠️  记录数量不匹配，期望:', expectedRecords, '实际:', result.recordsProcessed);
            }
            
            return true;
        } else {
            const error = await response.json();
            console.log('❌ 文件上传失败:', error);
            return false;
        }
    } catch (error) {
        console.log('❌ 文件上传错误:', error.message);
        return false;
    }
}

async function runTests() {
    console.log('🧪 开始运行测试...\n');
    
    // 测试健康检查
    const healthOk = await testHealthCheck();
    if (!healthOk) {
        console.log('❌ 健康检查失败，停止测试');
        return;
    }
    
    console.log('');
    
    // 测试 JSON 文件上传
    const jsonFile = path.join(__dirname, 'sample-data.json');
    if (fs.existsSync(jsonFile)) {
        await testFileUpload(jsonFile, 4);
    } else {
        console.log('⚠️  JSON 测试文件不存在');
    }
    
    console.log('');
    
    // 测试 TXT 文件上传
    const txtFile = path.join(__dirname, 'sample-logs.txt');
    if (fs.existsSync(txtFile)) {
        await testFileUpload(txtFile, 5);
    } else {
        console.log('⚠️  TXT 测试文件不存在');
    }
    
    console.log('\n🎉 测试完成！');
}

// 如果直接运行此脚本
if (require.main === module) {
    runTests().catch(console.error);
}

module.exports = { runTests }; 