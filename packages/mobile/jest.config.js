/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  moduleNameMapper: {
    '^@nestly/shared/(.+)$': '<rootDir>/../shared/src/$1/index.ts',
    '^@nestly/shared$': '<rootDir>/../shared/src/index.ts',
  },
};
