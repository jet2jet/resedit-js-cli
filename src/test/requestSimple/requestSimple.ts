describe('requestSimple', () => {
	const mockUsingModuleFn = jest.fn();
	const mockIsRequestAvailableFn = jest.fn(() => true);
	const mockUsingHttpFn = jest.fn();

	const mockUsingModuleModule = {
		__esModule: true,
		default: mockUsingModuleFn,
		isAvailable: mockIsRequestAvailableFn,
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
	});
	afterAll(() => {
		jest.dontMock('@/requestSimple/requestSimpleUsingHttp');
		jest.dontMock('@/requestSimple/requestSimpleUsingModule');
	});
	beforeEach(() => {
		jest.resetModules();
		jest.clearAllMocks();
	});

	it("should be 'requestSimpleUsingModule' if request is available", async () => {
		mockIsRequestAvailableFn.mockReturnValue(true);

		const request = (await import('@/requestSimple')).default;

		expect(request).toBe(mockUsingModuleFn);
		expect(mockIsRequestAvailableFn).toBeCalledWith();
	});

	it("should be 'requestSimpleUsingHttp' if request is not available", async () => {
		mockIsRequestAvailableFn.mockReturnValue(false);

		const request = (await import('@/requestSimple')).default;

		expect(request).toBe(mockUsingHttpFn);
		expect(mockIsRequestAvailableFn).toBeCalledWith();
	});
});
