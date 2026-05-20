import { Amplify } from 'aws-amplify';

/**
 * AWS Amplify 設定
 * 環境変数から Cognito / API Gateway の設定を読み込む
 */
export const configureAmplify = (): void => {
  const userPoolId = import.meta.env.VITE_COGNITO_USER_POOL_ID as string;
  const userPoolClientId = import.meta.env.VITE_COGNITO_CLIENT_ID as string;
  const apiEndpoint = import.meta.env.VITE_API_ENDPOINT as string;
  const region = import.meta.env.VITE_AWS_REGION as string;

  if (!userPoolId || !userPoolClientId || !apiEndpoint || !region) {
    console.warn(
      '[Amplify] 環境変数が未設定です。.env.local を確認してください。',
    );
  }

  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId: userPoolId ?? '',
        userPoolClientId: userPoolClientId ?? '',
        loginWith: {
          email: true,
        },
      },
    },
    API: {
      REST: {
        ItEnglishTraineeApi: {
          endpoint: apiEndpoint ?? '',
          region: region ?? 'ap-northeast-1',
        },
      },
    },
  });
};
