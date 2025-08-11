const AWS = require('aws-sdk');
const { Client } = require('@opensearch-project/opensearch');
const { AwsSigv4Signer } = require('@opensearch-project/opensearch/aws');
require('dotenv').config();

const region = process.env.AWS_REGION || 'us-east-1';
const node = process.env.OPENSEARCH_ENDPOINT; // 例如 https://xxx.region.es.amazonaws.com

const client = new Client({
  ...AwsSigv4Signer({
    region,
    service: 'es',
    getCredentials: () =>
      new Promise((resolve, reject) => {
        AWS.config.getCredentials((err, credentials) => {
          if (err) {
            reject(err);
          } else {
            resolve(credentials);
          }
        });
      }),
  }),
  node,
});

async function smokeTest() {
  try {
    const info = await client.info();
    console.log('OpenSearch info:', info.body);
  } catch (err) {
    console.error('OpenSearch 连接/签名失败:', err);
  }
}

smokeTest();