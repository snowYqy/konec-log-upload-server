/**
 * AWS OpenSearch 客户端
 * 处理安全认证和数据上传
 * 文档：https://docs.opensearch.org/latest/getting-started/search-data/
 */

const AWS = require("aws-sdk");
const { Client } = require("@opensearch-project/opensearch");
// const { AwsSigv4Signer } = require("@opensearch-project/opensearch/aws");
require("dotenv").config();

const region = process.env.AWS_REGION || "ap-southeast-2";
const node = process.env.OPENSEARCH_ENDPOINT;

// 使用Basic Auth连接 OpenSearch
const client = new Client({
  node: process.env.OPENSEARCH_ENDPOINT,
  auth: {
    username: process.env.AWS_OPENSEARCH_USERNAME,
    password: process.env.AWS_OPENSEARCH_PASSWORD,
  },
  ssl: {
    rejectUnauthorized: false,
  },
});

// 索引创建锁，避免并发创建同一索引
const indexCreationLocks = new Map();

// 索引名称：logs-xxxx年.xx月.xx日
// OpenSearch 索引模式（index pattern）：logs-*
function getIndexName() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `logs-${year}.${month}.${day}`;
}

async function createIndex(indexName, settings) {
  // 检查是否已有创建该索引的锁
  if (indexCreationLocks.has(indexName)) {
    // 等待其他请求完成索引创建
    console.log(`等待索引 ${indexName} 创建完成...`);
    await indexCreationLocks.get(indexName);
    return { acknowledged: true, alreadyExists: true };
  }

  // 创建锁
  const lockPromise = (async () => {
    try {
      const exists = await client.indices.exists({ index: indexName });
      if (exists.body) {
        console.log(`索引 ${indexName} 已存在`);
        return { acknowledged: true, alreadyExists: true };
      }

      console.log(`创建索引 ${indexName}...`);
      const resp = await client.indices.create({
        index: indexName,
        body: settings,
      });
      console.log(`索引 ${indexName} 创建成功`);
      return resp.body;
    } catch (err) {
      // 如果是索引已存在的错误，则忽略
      if (
        err.message &&
        err.message.includes("resource_already_exists_exception")
      ) {
        console.log(`索引 ${indexName} 已存在，继续处理数据`);
        return { acknowledged: true, alreadyExists: true };
      }
      throw new Error("Failed to create index: " + err.message);
    } finally {
      // 清理锁
      indexCreationLocks.delete(indexName);
    }
  })();

  // 设置锁
  indexCreationLocks.set(indexName, lockPromise);

  return await lockPromise;
}

async function sendToOpenSearch(data) {
  try {
    const indexName = getIndexName();
    // 索引结构
    // 标记为keyword后可以用来检索
    const indexSettings = {
      settings: {
        number_of_shards: 1,
        number_of_replicas: 1,
        "index.mapping.total_fields.limit": 1000,
      },
      mappings: {
        properties: {
          timestamp: {
            type: "date",
            format: "strict_date_optional_time||epoch_millis",
          },
          account: { type: "keyword" },
          level: { type: "keyword" },
          eventName: {
            type: "keyword",
            fields: {
              text: { type: "text" },
            },
          },
          userId: { type: "keyword" },
          homeId: { type: "keyword" },
          devId: { type: "keyword" },
          appVersion: { type: "keyword" },
          apiName: { type: "keyword" },
          pageId: { type: "keyword" },
          deviceModel: { type: "keyword" },
          debugMode: { type: "keyword" },
          message: { type: "text" },
          stack: { type: "text" },
          error: { type: "text" },
        },
      },
    };
    await createIndex(indexName, indexSettings);

    // 构造 bulk body
    const body = [];
    for (const item of data) {
      body.push({ index: { _index: indexName } });
      body.push({
        ...item,
        "@timestamp": item.timestamp
          ? new Date(Number(item.timestamp)).toISOString()
          : new Date().toISOString(),
      });
    }
    if (!body.length) throw new Error("bulk body cannot be empty");
    const resp = await client.bulk({ refresh: true, body });
    return {
      success: !resp.body.errors,
      indexName,
      recordsUploaded: data.length,
      result: resp.body,
    };
  } catch (err) {
    throw new Error("OpenSearch Upload Failure: " + err.message);
  }
}

async function testConnection() {
  try {
    const info = await client.info();
    return { success: true, info: info.body };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function getIndexInfo(indexName) {
  try {
    const resp = await client.indices.get({ index: indexName });
    return resp.body;
  } catch (err) {
    throw new Error("Failed to get index information: " + err.message);
  }
}

module.exports = {
  sendToOpenSearch,
  testConnection,
  getIndexInfo,
  getIndexName,
  createIndex,
};
