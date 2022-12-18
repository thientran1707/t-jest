export const expect = received => {
  return {
    toBe: expected => {
      if (received !== expected) {
        throw new Error(`Expected ${expected} but received ${received}`);
      }

      return true;
    }
  }
}
