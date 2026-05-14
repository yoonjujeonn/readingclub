import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { BedrockClient, ListFoundationModelsCommand } from '@aws-sdk/client-bedrock';
import { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime';

const execFileAsync = promisify(execFile);
const region = process.env.BEDROCK_REGION || process.env.AWS_REGION || 'ap-northeast-2';
const testModelId = process.env.BEDROCK_TEST_MODEL_ID || process.env.BEDROCK_MODEL_ID || '';

function formatList(value) {
  return Array.isArray(value) ? value.join(',') : '';
}

async function listModels() {
  const client = new BedrockClient({ region });
  const response = await client.send(new ListFoundationModelsCommand({}));
  const models = (response.modelSummaries || [])
    .filter(model => {
      const inputs = model.inputModalities || [];
      const outputs = model.outputModalities || [];
      return inputs.includes('TEXT') && outputs.includes('TEXT');
    })
    .map(model => ({
      provider: model.providerName,
      name: model.modelName,
      id: model.modelId,
      inference: formatList(model.inferenceTypesSupported),
    }));

  console.log(`\n[Bedrock models] region=${region}`);
  if (models.length === 0) {
    console.log('TEXT 입출력을 지원하는 Foundation Model을 찾지 못했습니다.');
    return;
  }
  console.table(models);
}

async function testInvoke() {
  if (!testModelId) {
    console.log('\n[Invoke test] skipped: BEDROCK_MODEL_ID 또는 BEDROCK_TEST_MODEL_ID가 없습니다.');
    return;
  }

  const client = new BedrockRuntimeClient({ region });
  const response = await client.send(new ConverseCommand({
    modelId: testModelId,
    messages: [{
      role: 'user',
      content: [{ text: '한국어로 OK라고만 답해주세요.' }],
    }],
    inferenceConfig: {
      maxTokens: 16,
      temperature: 0,
    },
  }));

  const text = response.output?.message?.content?.map(part => part.text || '').join('').trim();
  console.log(`\n[Invoke test] model=${testModelId}`);
  console.log(text || '(empty response)');
}

async function listQuotas() {
  try {
    const { stdout } = await execFileAsync('aws', [
      'service-quotas',
      'list-service-quotas',
      '--service-code',
      'bedrock',
      '--region',
      region,
      '--output',
      'json',
    ]);
    const parsed = JSON.parse(stdout);
    const quotas = (parsed.Quotas || [])
      .filter(quota => /token|invoke|request|model/i.test(quota.QuotaName || ''))
      .map(quota => ({
        name: quota.QuotaName,
        value: quota.Value,
        unit: quota.Unit,
        adjustable: quota.Adjustable,
      }));

    console.log(`\n[Bedrock service quotas] region=${region}`);
    if (quotas.length === 0) {
      console.log('관련 quota를 찾지 못했습니다. AWS 콘솔의 Service Quotas > Amazon Bedrock도 확인하세요.');
      return;
    }
    console.table(quotas);
  } catch (err) {
    console.log('\n[Bedrock service quotas] skipped');
    console.log(err.stderr?.trim() || err.message);
  }
}

try {
  await listModels();
  await testInvoke();
  await listQuotas();
} catch (err) {
  console.error('\n[Bedrock check failed]');
  console.error(err.name || 'Error', err.message || err);
  process.exitCode = 1;
}

