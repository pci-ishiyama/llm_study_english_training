import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('aws-amplify', () => ({
  Amplify: {
    configure: vi.fn(),
  },
}));

describe('amplifyConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('configureAmplify calls Amplify.configure', async () => {
    const { Amplify } = await import('aws-amplify');
    const { configureAmplify } = await import('@utils/amplifyConfig');
    const mockedAmplify = vi.mocked(Amplify);

    configureAmplify();

    expect(mockedAmplify.configure).toHaveBeenCalledTimes(1);
  });

  it('configureAmplify passes Auth and API config', async () => {
    const { Amplify } = await import('aws-amplify');
    const { configureAmplify } = await import('@utils/amplifyConfig');
    const mockedAmplify = vi.mocked(Amplify);

    configureAmplify();

    const callArg = mockedAmplify.configure.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(callArg).toHaveProperty('Auth');
    expect(callArg).toHaveProperty('API');
  });
});