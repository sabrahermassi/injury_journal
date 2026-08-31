// tests/integration/port.test.ts
import { jest } from '@jest/globals';

describe('PORT env parsing', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV };
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  test.each([
    // Default is 3002: in the monorepo, 3000 and 3001 belong to the journal
    // app's frontend and backend respectively.
    [undefined, 3002],
    ['3000', 3000],
    ['0', 0],
    ['65535', 65535],
  ])('PORT=%p resolves to %p', async (value, expected) => {
    if (value === undefined) {
      delete process.env.PORT;
    } else {
      process.env.PORT = value;
    }

    const { PORT } = await import('../src/config/port');
    expect(PORT).toBe(expected);
  });

  test.each([['65536'], ['-1'], ['abc'], [''], ['   ']])(
    'PORT=%p throws',
    async (value) => {
      process.env.PORT = value;

      await expect(import('../src/config/port')).rejects.toThrow(
        /Invalid PORT/,
      );
    },
  );
});
