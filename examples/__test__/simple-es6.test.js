import { add } from '../src/add.es6';

describe('es6 test', () => {
  it('test add function', () => {
    expect(add(1, 1)).toBe(2);
  })
});
