/** @type {import('jest').Config} */
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: { "^.+\.(t|j)sx?$": "ts-jest" },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@repo/shared/(.*)$': '<rootDir>/../../../packages/shared/src/$1',
    '^@repo/types/(.*)$': '<rootDir>/../../../packages/types/src/$1',
    '^@repo/database/(.*)$': '<rootDir>/../../../packages/database/src/$1',
    '^better-auth$': '<rootDir>/../node_modules/better-auth/dist/index.mjs'
  },
  transformIgnorePatterns: ['node_modules/(?!(better-auth)/)'],
  extensionsToTreatAsEsm: ['.ts'],
  preset: 'ts-jest/presets/default-esm',
};
