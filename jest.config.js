module.exports = {
	preset: 'ts-jest',
	testEnvironment: 'node',
	testMatch: ['<rootDir>/src/test/**/*.ts'],
	testPathIgnorePatterns: ['/node_modules/', '<rootDir>/src/test/testUtils'],
	moduleNameMapper: {
		'^@/(.*)$': '<rootDir>/src/main/$1',
	},
	globals: {
		'ts-jest': {
			tsconfig: 'tsconfig.test.json',
		},
	},
};
