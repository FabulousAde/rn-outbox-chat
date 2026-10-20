/** Unit tests cover the pure logic (store, outbox, backoff), so no React Native preset is needed. */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  transform: { '^.+\\.ts$': ['ts-jest', { tsconfig: { module: 'commonjs', target: 'es2020', strict: true, esModuleInterop: true, skipLibCheck: true, types: ['jest'], moduleResolution: 'node10', ignoreDeprecations: '6.0' } }] },
};
