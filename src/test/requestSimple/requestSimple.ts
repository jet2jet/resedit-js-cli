import { jest } from '@jest/globals';

describe('requestSimple', () => {
	const mockUsingModuleFn = jest.fn();
	const mockUsingFetchFn = jest.fn();
	const mockIsRequestAvailableFn = jest.fn(() => true);
	const mockIsFetchAvailableFn = jest.fn(() => true);
	const mockUsingHttpFn = jest.fn();

	const mockUsingModuleModule = {
		__esModule: true,
		default: mockUsingModuleFn,
		isAvailable: mockIsRequestAvailableFn,
	};
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
			'@/requestSimple/requestSimpleUsingModule.js',
			() => mockUsingModuleModule
		);
		jest.unstable_mockModule(
			'@/requestSimple/requestSimpleUsingFetch.js',
			() => mockUsingFetchModule
		);
	});
	afterAll(() => {
		jest.dontMock('@/requestSimple/requestSimpleUsingHttp.js');
		jest.dontMock('@/requestSimple/requestSimpleUsingModule.js');
		jest.dontMock('@/requestSimple/requestSimpleUsingFetch.js');
	});
	beforeEach(() => {
		jest.resetModules();
		jest.clearAllMocks();
	});

	it("should be 'requestSimpleUsingFetch' if fetch is available", async () => {
		mockIsFetchAvailableFn.mockReturnValue(true);
		mockIsRequestAvailableFn.mockReturnValue(false);

		const request = (await import('@/requestSimple/index.js')).default;

		expect(request).toBe(mockUsingFetchFn);
		expect(mockIsFetchAvailableFn).toHaveBeenCalledWith();
	});

	it("should be 'requestSimpleUsingModule' if fetch is not available but request is available", async () => {
		mockIsFetchAvailableFn.mockReturnValue(false);
		mockIsRequestAvailableFn.mockReturnValue(true);

		const request = (await import('@/requestSimple/index.js')).default;

		expect(request).toBe(mockUsingModuleFn);
		expect(mockIsFetchAvailableFn).toHaveBeenCalledWith();
		expect(mockIsRequestAvailableFn).toHaveBeenCalledWith();
	});

	it("should be 'requestSimpleUsingFetch' if both fetch and request are available", async () => {
		mockIsFetchAvailableFn.mockReturnValue(true);
		mockIsRequestAvailableFn.mockReturnValue(true);

		const request = (await import('@/requestSimple/index.js')).default;

		expect(request).toBe(mockUsingFetchFn);
		expect(mockIsFetchAvailableFn).toHaveBeenCalledWith();
	});

	it("should be 'requestSimpleUsingHttp' if both request and fetch are not available", async () => {
		mockIsFetchAvailableFn.mockReturnValue(false);
		mockIsRequestAvailableFn.mockReturnValue(false);

		const request = (await import('@/requestSimple/index.js')).default;

		expect(request).toBe(mockUsingHttpFn);
		expect(mockIsFetchAvailableFn).toHaveBeenCalledWith();
		expect(mockIsRequestAvailableFn).toHaveBeenCalledWith();
	});
});
