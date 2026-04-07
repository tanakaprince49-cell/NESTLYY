import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  moduleNameMapper: {
    '^@nestly/shared/(.+)$': '<rootDir>/../shared/src/$1/index.ts',
    '^@nestly/shared$': '<rootDir>/../shared/src/index.ts',
  },
};

export default config;
