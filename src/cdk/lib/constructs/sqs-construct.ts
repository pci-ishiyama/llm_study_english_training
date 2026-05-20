import * as cdk from 'aws-cdk-lib';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as sns from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';

interface SqsConstructProps {
  appEnv: string;
}

export class SqsConstruct extends Construct {
  public readonly feedbackQueue: sqs.Queue;
  public readonly feedbackDlq: sqs.Queue;

  constructor(scope: Construct, id: string, props: SqsConstructProps) {
    super(scope, id);

    const { appEnv } = props;

    // ── Dead Letter Queue ─────────────────────────────────────────────────────
    this.feedbackDlq = new sqs.Queue(this, 'FeedbackDlq', {
      queueName: `it-english-feedback-dlq-${appEnv}`,
      retentionPeriod: cdk.Duration.days(14),
      encryption: sqs.QueueEncryption.SQS_MANAGED,
    });

    // ── Feedback Queue ────────────────────────────────────────────────────────
    this.feedbackQueue = new sqs.Queue(this, 'FeedbackQueue', {
      queueName: `it-english-feedback-queue-${appEnv}`,
      visibilityTimeout: cdk.Duration.seconds(120),
      retentionPeriod: cdk.Duration.days(4),
      maxMessageSizeBytes: 262144, // 256 KB
      encryption: sqs.QueueEncryption.SQS_MANAGED,
      deadLetterQueue: {
        queue: this.feedbackDlq,
        maxReceiveCount: 3,
      },
    });

    // ── CloudWatch アラート（DLQ メッセージ蓄積） ─────────────────────────────
    const dlqAlarmTopic = new sns.Topic(this, 'DlqAlarmTopic', {
      topicName: `it-english-dlq-alarm-${appEnv}`,
    });

    const dlqAlarm = new cloudwatch.Alarm(this, 'DlqMessageAlarm', {
      alarmName: `it-english-dlq-messages-${appEnv}`,
      alarmDescription: 'DLQ にメッセージが蓄積されました',
      metric: this.feedbackDlq.metricApproximateNumberOfMessagesVisible(),
      threshold: 0,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    dlqAlarm.addAlarmAction(new cloudwatchActions.SnsAction(dlqAlarmTopic));
  }
}
