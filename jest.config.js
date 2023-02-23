module.exports = {
	preset: 'ts-jest',
	testEnvironment: 'node',
	testMatch: ['<rootDir>/src/test/**/*.ts'],
	testPathIgnorePatterns: ['/node_modules/', '<rootDir>/src/test/testUtils'],
	moduleNameMapper: {
		'^@/(.*)\\.js$': '<rootDir>/src/main/$1',
		'^@/(.*)$': '<rootDir>/src/main/$1',
		'(.+)\\.js': '$1',
	},
	transform: {
		'^.+\\.tsx?$': [
			'ts-jest',
			{
				tsconfig: 'tsconfig.test.json',
			},
		],
	},
};
