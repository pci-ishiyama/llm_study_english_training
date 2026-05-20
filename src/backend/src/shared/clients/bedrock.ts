import { BedrockRuntimeClient } from '@aws-sdk/client-bedrock-runtime';

let _client: BedrockRuntimeClient | undefined;

/**
 * Bedrock Runtime Client シングルトン
 * ルール7: クロスリージョン呼び出し（us-east-1）。リージョンをハードコーディングしない
 */
export const getBedrockClient = (): BedrockRuntimeClient => {
  if (!_client) {
    const region = process.env.BEDROCK_REGION;
    if (!region) {
      throw new Error('BEDROCK_REGION environment variable is not set');
    }
    _client = new BedrockRuntimeClient({ region });
  }
  return _client;
};
