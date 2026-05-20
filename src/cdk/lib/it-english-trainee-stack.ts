import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CognitoConstruct } from './constructs/cognito-construct';
import { DynamoDbConstruct } from './constructs/dynamodb-construct';
import { S3Construct } from './constructs/s3-construct';
import { SqsConstruct } from './constructs/sqs-construct';
import { LambdaConstruct } from './constructs/lambda-construct';
import { ApiGatewayConstruct } from './constructs/apigateway-construct';

export interface ItEnglishTraineeStackProps extends cdk.StackProps {
  /** 実行環境: dev | stg | prod */
  appEnv: string;
}

export class ItEnglishTraineeStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ItEnglishTraineeStackProps) {
    super(scope, id, props);

    const { appEnv } = props;

    // ── Cognito ──────────────────────────────────────────────────────────────
    const cognito = new CognitoConstruct(this, 'Cognito', { appEnv });

    // ── DynamoDB ─────────────────────────────────────────────────────────────
    const dynamodb = new DynamoDbConstruct(this, 'DynamoDB', { appEnv });

    // ── S3 ───────────────────────────────────────────────────────────────────
    const s3 = new S3Construct(this, 'S3', { appEnv });

    // ── SQS ──────────────────────────────────────────────────────────────────
    const sqs = new SqsConstruct(this, 'SQS', { appEnv });

    // ── Lambda ───────────────────────────────────────────────────────────────
    const lambda = new LambdaConstruct(this, 'Lambda', {
      appEnv,
      tables: dynamodb.tables,
      audioBucket: s3.audioBucket,
      feedbackQueue: sqs.feedbackQueue,
    });

    // ── API Gateway ──────────────────────────────────────────────────────────
    new ApiGatewayConstruct(this, 'ApiGateway', {
      appEnv,
      userPool: cognito.userPool,
      functions: lambda.functions,
    });

    // ── Stack Outputs ────────────────────────────────────────────────────────
    new cdk.CfnOutput(this, 'UserPoolId', {
      value: cognito.userPool.userPoolId,
      description: 'Cognito User Pool ID',
      exportName: `it-english-user-pool-id-${appEnv}`,
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: cognito.userPoolClient.userPoolClientId,
      description: 'Cognito User Pool Client ID',
      exportName: `it-english-user-pool-client-id-${appEnv}`,
    });
  }
}
