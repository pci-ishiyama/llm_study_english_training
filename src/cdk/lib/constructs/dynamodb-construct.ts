import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

interface DynamoDbConstructProps {
  appEnv: string;
}

export interface DynamoDbTables {
  users: dynamodb.Table;
  scenarios: dynamodb.Table;
  sessions: dynamodb.Table;
  chatLogs: dynamodb.Table;
  feedbacks: dynamodb.Table;
}

export class DynamoDbConstruct extends Construct {
  public readonly tables: DynamoDbTables;

  constructor(scope: Construct, id: string, props: DynamoDbConstructProps) {
    super(scope, id);

    const { appEnv } = props;
    const removalPolicy =
      appEnv === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY;

    // ── Users ─────────────────────────────────────────────────────────────────
    const usersTable = new dynamodb.Table(this, 'UsersTable', {
      tableName: `it-english-users-${appEnv}`,
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      removalPolicy,
    });

    // ── Scenarios ─────────────────────────────────────────────────────────────
    const scenariosTable = new dynamodb.Table(this, 'ScenariosTable', {
      tableName: `it-english-scenarios-${appEnv}`,
      partitionKey: { name: 'scenarioId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PROVISIONED,
      readCapacity: 5,
      writeCapacity: 1,
      pointInTimeRecovery: true,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      removalPolicy,
    });

    // ── Sessions ──────────────────────────────────────────────────────────────
    const sessionsTable = new dynamodb.Table(this, 'SessionsTable', {
      tableName: `it-english-sessions-${appEnv}`,
      partitionKey: { name: 'sessionId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      timeToLiveAttribute: 'ttl',
      removalPolicy,
    });
    sessionsTable.addGlobalSecondaryIndex({
      indexName: 'userId-createdAt-index',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });
    sessionsTable.addGlobalSecondaryIndex({
      indexName: 'scenarioId-createdAt-index',
      partitionKey: { name: 'scenarioId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // ── ChatLogs ──────────────────────────────────────────────────────────────
    const chatLogsTable = new dynamodb.Table(this, 'ChatLogsTable', {
      tableName: `it-english-chatlogs-${appEnv}`,
      partitionKey: { name: 'chatLogId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      timeToLiveAttribute: 'ttl',
      removalPolicy,
    });
    chatLogsTable.addGlobalSecondaryIndex({
      indexName: 'sessionId-timestamp-index',
      partitionKey: { name: 'sessionId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });
    chatLogsTable.addGlobalSecondaryIndex({
      indexName: 'userId-timestamp-index',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.KEYS_ONLY,
    });

    // ── Feedbacks ─────────────────────────────────────────────────────────────
    const feedbacksTable = new dynamodb.Table(this, 'FeedbacksTable', {
      tableName: `it-english-feedbacks-${appEnv}`,
      partitionKey: { name: 'feedbackId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      removalPolicy,
    });
    feedbacksTable.addGlobalSecondaryIndex({
      indexName: 'userId-createdAt-index',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });
    feedbacksTable.addGlobalSecondaryIndex({
      indexName: 'sessionId-index',
      partitionKey: { name: 'sessionId', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });
    feedbacksTable.addGlobalSecondaryIndex({
      indexName: 'userId-scenarioId-index',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'scenarioId', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.KEYS_ONLY,
    });

    this.tables = {
      users: usersTable,
      scenarios: scenariosTable,
      sessions: sessionsTable,
      chatLogs: chatLogsTable,
      feedbacks: feedbacksTable,
    };
  }
}
