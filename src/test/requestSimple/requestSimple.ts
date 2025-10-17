import { jest } from '@jest/globals';

describe('requestSimple', () => {
	const mockUsingFetchFn = jest.fn();
	const mockIsFetchAvailableFn = jest.fn(() => true);
	const mockUsingHttpFn = jest.fn();

	const mockUsingFetchModule = {
		__esModule: true,
		default: mockUsingFetchFn,
		isAvailable: mockIsFetchAvailableFn,
	};
	const mockUsingHttpModule = {
		__esModule: true,
		default: mockUsingHttpFn,
	};

	beforeAll(() => {
		jest.unstable_mockModule(
			'@/requestSimple/requestSimpleUsingHttp.js',
			() => mockUsingHttpModule
		);
		jest.unstable_mockModule(
			'@/requestSimple/requestSimpleUsingFetch.js',
			() => mockUsingFetchModule
		);
	});
	afterAll(() => {
		jest.dontMock('@/requestSimple/requestSimpleUsingHttp.js');
		jest.dontMock('@/requestSimple/requestSimpleUsingFetch.js');
	});
	beforeEach(() => {
		jest.resetModules();
		jest.clearAllMocks();
	});

	it("should be 'requestSimpleUsingFetch' if fetch is available", async () => {
		mockIsFetchAvailableFn.mockReturnValue(true);

		const request = (await import('@/requestSimple/index.js')).default;

		expect(request).toBe(mockUsingFetchFn);
		expect(mockIsFetchAvailableFn).toHaveBeenCalledWith();
	});

	it("should be 'requestSimpleUsingHttp' if fetch is not available", async () => {
		mockIsFetchAvailableFn.mockReturnValue(false);

		const request = (await import('@/requestSimple/index.js')).default;

		expect(request).toBe(mockUsingHttpFn);
		expect(mockIsFetchAvailableFn).toHaveBeenCalledWith();
	});
});
