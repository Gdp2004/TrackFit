const nextJest = require('next/jest');

const createJestConfig = nextJest({
    // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
    dir: './',
});

// Add any custom config to be passed to Jest
/** @type {import('jest').Config} */
const customJestConfig = {
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    roots: ['<rootDir>/src', '<rootDir>/'],
    testMatch: [
        '**/__tests__/**/*.+(ts|tsx|js)',
        '**/?(*.)+(spec|test).+(ts|tsx|js)'
    ],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^@backend/(.*)$': '<rootDir>/src/backend/$1',
        '^@frontend/(.*)$': '<rootDir>/src/frontend/$1',
    },
    testEnvironment: 'jest-environment-node',
    transform: {
        '^.+\\.(t|j)sx?$': 'ts-jest',
    },
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);
