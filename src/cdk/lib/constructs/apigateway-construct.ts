import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';
import { LambdaFunctions } from './lambda-construct';

interface ApiGatewayConstructProps {
  appEnv: string;
  userPool: cognito.UserPool;
  functions: LambdaFunctions;
}

export class ApiGatewayConstruct extends Construct {
  public readonly api: apigateway.RestApi;

  constructor(scope: Construct, id: string, props: ApiGatewayConstructProps) {
    super(scope, id);

    const { appEnv, userPool, functions } = props;

    // ── REST API ──────────────────────────────────────────────────────────────
    this.api = new apigateway.RestApi(this, 'RestApi', {
      restApiName: `it-english-trainee-api-${appEnv}`,
      description: `IT English Trainee API - ${appEnv}`,
      deployOptions: {
        stageName: appEnv,
        tracingEnabled: appEnv !== 'dev',
        throttlingRateLimit: 100,
        throttlingBurstLimit: 200,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowHeaders: ['Content-Type', 'Authorization'],
      },
    });

    // ── Cognito Authorizer ────────────────────────────────────────────────────
    const authorizer = new apigateway.CognitoUserPoolsAuthorizer(
      this,
      'CognitoAuthorizer',
      {
        cognitoUserPools: [userPool],
        authorizerName: `it-english-cognito-authorizer-${appEnv}`,
        identitySource: 'method.request.header.Authorization',
      },
    );

    const authOptions: apigateway.MethodOptions = {
      authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    };

    // ── Lambda Integrations ───────────────────────────────────────────────────
    const chatHandlerIntegration = new apigateway.LambdaIntegration(
      functions.chatHandler,
    );
    const sessionManagerIntegration = new apigateway.LambdaIntegration(
      functions.sessionManager,
    );
    const userManagerIntegration = new apigateway.LambdaIntegration(
      functions.userManager,
    );
    const historyManagerIntegration = new apigateway.LambdaIntegration(
      functions.historyManager,
    );

    // ── /users/me ─────────────────────────────────────────────────────────────
    const users = this.api.root.addResource('users');
    const usersMe = users.addResource('me');
    usersMe.addMethod('GET', userManagerIntegration, authOptions);
    usersMe.addMethod('PUT', userManagerIntegration, authOptions);

    const usersDashboard = usersMe.addResource('dashboard');
    usersDashboard.addMethod('GET', historyManagerIntegration, authOptions);

    const usersHistory = usersMe.addResource('history');
    usersHistory.addMethod('GET', historyManagerIntegration, authOptions);

    // ── /scenarios ────────────────────────────────────────────────────────────
    const scenarios = this.api.root.addResource('scenarios');
    scenarios.addMethod('GET', sessionManagerIntegration, authOptions);

    // ── /sessions ─────────────────────────────────────────────────────────────
    const sessions = this.api.root.addResource('sessions');
    sessions.addMethod('POST', sessionManagerIntegration, authOptions);

    const session = sessions.addResource('{sessionId}');
    const sessionChat = session.addResource('chat');
    sessionChat.addMethod('POST', chatHandlerIntegration, {
      ...authOptions,
      methodResponses: [{ statusCode: '200' }],
    });

    const sessionEnd = session.addResource('end');
    sessionEnd.addMethod('POST', sessionManagerIntegration, authOptions);

    // ── /feedbacks ────────────────────────────────────────────────────────────
    const feedbacks = this.api.root.addResource('feedbacks');
    const feedback = feedbacks.addResource('{feedbackId}');
    feedback.addMethod('GET', historyManagerIntegration, authOptions);

    // ── Stack Output ──────────────────────────────────────────────────────────
    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: this.api.url,
      description: 'API Gateway endpoint URL',
      exportName: `it-english-api-endpoint-${appEnv}`,
    });
  }
}
