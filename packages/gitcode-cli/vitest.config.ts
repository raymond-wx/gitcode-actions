export default {
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.test.ts'],
    testTimeout: 10000,
    hookTimeout: 10000,
  },
};
