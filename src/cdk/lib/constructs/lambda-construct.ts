import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';
import { DynamoDbTables } from './dynamodb-construct';

interface LambdaConstructProps {
  appEnv: string;
  tables: DynamoDbTables;
  audioBucket: s3.Bucket;
  feedbackQueue: sqs.Queue;
}

export interface LambdaFunctions {
  chatHandler: lambda.Function;
  feedbackGenerator: lambda.Function;
  sessionManager: lambda.Function;
  userManager: lambda.Function;
  historyManager: lambda.Function;
}

export class LambdaConstruct extends Construct {
  public readonly functions: LambdaFunctions;

  constructor(scope: Construct, id: string, props: LambdaConstructProps) {
    super(scope, id);

    const { appEnv, tables, audioBucket, feedbackQueue } = props;

    // Bedrock リージョンはクロスリージョン呼び出し（us-east-1）
    const BEDROCK_REGION = 'us-east-1';
    const DYNAMODB_REGION = 'ap-northeast-1';

    const xrayTracingMode =
      appEnv === 'dev' ? lambda.Tracing.PASS_THROUGH : lambda.Tracing.ACTIVE;

    const commonEnv: Record<string, string> = {
      ENV: appEnv,
      DYNAMODB_REGION,
      BEDROCK_REGION,
      S3_BUCKET_AUDIO: audioBucket.bucketName,
      AUDIO_PRESIGNED_URL_EXPIRES: '3600',
    };

    // ── chat-handler ──────────────────────────────────────────────────────────
    const chatHandler = new lambda.Function(this, 'ChatHandler', {
      functionName: `it-english-chat-handler-${appEnv}`,

      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('../backend/dist/functions/chat-handler'),
      memorySize: 512,
      timeout: cdk.Duration.seconds(30),
      tracing: xrayTracingMode,
      environment: commonEnv,
      reservedConcurrentExecutions: appEnv === 'prod' ? 50 : undefined,
    });

    // chat-handler IAM ポリシー
    chatHandler.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['bedrock:InvokeModel'],
        resources: [
          `arn:aws:bedrock:${BEDROCK_REGION}::foundation-model/anthropic.claude-3-5-sonnet-20241022-v2:0`,
        ],
      }),
    );
    chatHandler.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['polly:SynthesizeSpeech'],
        resources: ['*'],
      }),
    );
    tables.sessions.grantReadWriteData(chatHandler);
    tables.chatLogs.grantReadWriteData(chatHandler);
    audioBucket.grantReadWrite(chatHandler);

    // ── feedback-generator ────────────────────────────────────────────────────
    const feedbackGenerator = new lambda.Function(this, 'FeedbackGenerator', {
      functionName: `it-english-feedback-generator-${appEnv}`,

      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('../backend/dist/functions/feedback-generator'),
      memorySize: 512,
      timeout: cdk.Duration.seconds(60),
      tracing: xrayTracingMode,
      environment: commonEnv,
    });

    feedbackGenerator.addEventSource(
      new lambdaEventSources.SqsEventSource(feedbackQueue, {
        batchSize: 1,
        maxConcurrency: 5,
      }),
    );
    feedbackGenerator.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['bedrock:InvokeModel'],
        resources: [
          `arn:aws:bedrock:${BEDROCK_REGION}::foundation-model/anthropic.claude-3-5-sonnet-20241022-v2:0`,
        ],
      }),
    );
    tables.chatLogs.grantReadWriteData(feedbackGenerator);
    tables.feedbacks.grantReadWriteData(feedbackGenerator);
    feedbackQueue.grantConsumeMessages(feedbackGenerator);

    // ── session-manager ───────────────────────────────────────────────────────
    const sessionManager = new lambda.Function(this, 'SessionManager', {
      functionName: `it-english-session-manager-${appEnv}`,

      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('../backend/dist/functions/session-manager'),
      memorySize: 256,
      timeout: cdk.Duration.seconds(10),
      tracing: xrayTracingMode,
      environment: {
        ...commonEnv,
        FEEDBACK_QUEUE_URL: feedbackQueue.queueUrl,
      },
    });

    tables.sessions.grantReadWriteData(sessionManager);
    tables.scenarios.grantReadData(sessionManager);
    feedbackQueue.grantSendMessages(sessionManager);

    // ── user-manager ──────────────────────────────────────────────────────────
    const userManager = new lambda.Function(this, 'UserManager', {
      functionName: `it-english-user-manager-${appEnv}`,

      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('../backend/dist/functions/user-manager'),
      memorySize: 256,
      timeout: cdk.Duration.seconds(10),
      tracing: xrayTracingMode,
      environment: commonEnv,
    });

    tables.users.grantReadWriteData(userManager);

    // ── history-manager ───────────────────────────────────────────────────────
    const historyManager = new lambda.Function(this, 'HistoryManager', {
      functionName: `it-english-history-manager-${appEnv}`,

      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('../backend/dist/functions/history-manager'),
      memorySize: 256,
      timeout: cdk.Duration.seconds(10),
      tracing: xrayTracingMode,
      environment: commonEnv,
    });

    tables.feedbacks.grantReadData(historyManager);
    tables.sessions.grantReadData(historyManager);

    this.functions = {
      chatHandler,
      feedbackGenerator,
      sessionManager,
      userManager,
      historyManager,
    };
  }
}
