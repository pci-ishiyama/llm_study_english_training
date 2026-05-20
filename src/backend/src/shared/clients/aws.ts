import { PollyClient } from '@aws-sdk/client-polly';
import { S3Client } from '@aws-sdk/client-s3';
import { SQSClient } from '@aws-sdk/client-sqs';

let _polly: PollyClient | undefined;
let _s3: S3Client | undefined;
let _sqs: SQSClient | undefined;

export const getPollyClient = (): PollyClient => {
  if (!_polly) {
    _polly = new PollyClient({});
  }
  return _polly;
};

export const getS3Client = (): S3Client => {
  if (!_s3) {
    _s3 = new S3Client({});
  }
  return _s3;
};

export const getSqsClient = (): SQSClient => {
  if (!_sqs) {
    _sqs = new SQSClient({});
  }
  return _sqs;
};
