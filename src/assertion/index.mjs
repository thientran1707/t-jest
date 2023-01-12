import chalk from 'chalk';

export const expect = received => {
  return {
    toBe: expected => {
      if (received !== expected) {
        throw new Error(`Expected ${chalk.green(expected)} but received ${chalk.red(received)}`);
      }

      return true;
    }
  }
}
