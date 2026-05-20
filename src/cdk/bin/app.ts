#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ItEnglishTraineeStack } from '../lib/it-english-trainee-stack';

const app = new cdk.App();

// コンテキストから環境を取得（必須）
const env = app.node.tryGetContext('env') as string | undefined;
if (!env || !['dev', 'stg', 'prod'].includes(env)) {
  throw new Error(
    'env context is required. Use --context env=dev|stg|prod',
  );
}

const awsEnv: cdk.Environment = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: 'ap-northeast-1',
};

new ItEnglishTraineeStack(app, `ItEnglishTraineeStack-${env}`, {
  env: awsEnv,
  appEnv: env,
  description: `IT English Trainee - ${env} environment`,
  tags: {
    Project: 'it-english-trainee',
    Environment: env,
    ManagedBy: 'CDK',
  },
});

app.synth();
