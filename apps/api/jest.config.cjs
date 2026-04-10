module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@repo/shared/(.*)$': '<rootDir>/../../../packages/shared/src/$1',
    '^@repo/types/(.*)$': '<rootDir>/../../../packages/types/src/$1',
    '^@repo/database/(.*)$': '<rootDir>/../../../packages/database/src/$1',
  },
};
