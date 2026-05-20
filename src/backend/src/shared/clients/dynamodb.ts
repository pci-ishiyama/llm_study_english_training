import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

let _client: DynamoDBDocumentClient | undefined;

/**
 * DynamoDB Document Client シングルトン
 */
export const getDynamoDbClient = (): DynamoDBDocumentClient => {
  if (!_client) {
    const base = new DynamoDBClient({});
    _client = DynamoDBDocumentClient.from(base, {
      marshallOptions: {
        removeUndefinedValues: true,
      },
    });
  }
  return _client;
};
