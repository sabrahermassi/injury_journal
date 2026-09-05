import { AppError } from '../src/utils.js';

// A pure unit test, not an integration one -- no cleanDatabase/createTestUser
// import, since there's nothing here that touches the database. This is the
// regression check issue #19 itself points out is missing: something that
// would catch AppError's shape breaking on its own, independent of any
// particular route's status-code assertion.
describe('AppError', () => {
  test('carries the message and statusCode it was given', () => {
    const error = new AppError('Something went wrong', 418);

    expect(error.message).toBe('Something went wrong');
    expect(error.statusCode).toBe(418);
  });

  test('is a real Error, so it still has a stack and works with instanceof', () => {
    const error = new AppError('Nope', 400);

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AppError);
    expect(typeof error.stack).toBe('string');
  });
});
