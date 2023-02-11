describe('simple async test with describe and it', () => {
  it('should works', async () => {
    const result = await new Promise(resolve =>
      setTimeout(() => {
        resolve(1);
      }, 200)
    );
    expect(result).toBe(1);
  });
});
