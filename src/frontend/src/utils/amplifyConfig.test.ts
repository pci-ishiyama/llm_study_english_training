import { describe, it, expect, vi, beforeEach } from 'vitest';

const configureMock = vi.fn();

vi.mock('aws-amplify', () => ({
  Amplify: {

    configure: configureMock,
  },
}));

describe('amplifyConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('configureAmplify calls Amplify.configure', async () => {

    const { configureAmplify } = await import('@utils/amplifyConfig');



    configureAmplify();


    expect(configureMock).toHaveBeenCalledTimes(1);
  });

  it('configureAmplify passes Auth and API config', async () => {
    const { configureAmplify } = await import('@utils/amplifyConfig');

    configureAmplify();

    const calls = configureMock.mock.calls;
    const callArg = calls[0]?.[0] as Record<string, unknown>;
    expect(callArg).toHaveProperty('Auth');
    expect(callArg).toHaveProperty('API');
  });
});