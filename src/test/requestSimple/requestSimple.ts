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
		jest.doMock(
			'@/requestSimple/requestSimpleUsingHttp',
			() => mockUsingHttpModule
		);
		jest.doMock(
			'@/requestSimple/requestSimpleUsingModule',
			() => mockUsingModuleModule
		);
		jest.doMock(
			'@/requestSimple/requestSimpleUsingFetch',
			() => mockUsingFetchModule
		);
	});
	afterAll(() => {
		jest.dontMock('@/requestSimple/requestSimpleUsingHttp');
		jest.dontMock('@/requestSimple/requestSimpleUsingModule');
		jest.dontMock('@/requestSimple/requestSimpleUsingFetch');
	});
	beforeEach(() => {
		jest.resetModules();
		jest.clearAllMocks();
	});

	it("should be 'requestSimpleUsingModule' if request is available", async () => {
		mockIsRequestAvailableFn.mockReturnValue(true);
		mockIsFetchAvailableFn.mockReturnValue(false);

		const request = (await import('@/requestSimple')).default;

		expect(request).toBe(mockUsingModuleFn);
		expect(mockIsRequestAvailableFn).toBeCalledWith();
	});

	it("should be 'requestSimpleUsingFetch' if request is not available but fetch is available", async () => {
		mockIsRequestAvailableFn.mockReturnValue(false);
		mockIsFetchAvailableFn.mockReturnValue(true);

		const request = (await import('@/requestSimple')).default;

		expect(request).toBe(mockUsingFetchFn);
		expect(mockIsRequestAvailableFn).toBeCalledWith();
		expect(mockIsFetchAvailableFn).toBeCalledWith();
	});

	it("should be 'requestSimpleUsingModule' if both request and fetch are available", async () => {
		mockIsRequestAvailableFn.mockReturnValue(true);
		mockIsFetchAvailableFn.mockReturnValue(true);

		const request = (await import('@/requestSimple')).default;

		expect(request).toBe(mockUsingModuleFn);
		expect(mockIsRequestAvailableFn).toBeCalledWith();
	});

	it("should be 'requestSimpleUsingHttp' if both request and fetch are not available", async () => {
		mockIsRequestAvailableFn.mockReturnValue(false);
		mockIsFetchAvailableFn.mockReturnValue(false);

		const request = (await import('@/requestSimple')).default;

		expect(request).toBe(mockUsingHttpFn);
		expect(mockIsRequestAvailableFn).toBeCalledWith();
		expect(mockIsFetchAvailableFn).toBeCalledWith();
	});
});
