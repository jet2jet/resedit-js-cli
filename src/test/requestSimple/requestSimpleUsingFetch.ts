import { timeoutErrorPromise } from '../testUtils';

const DUMMY_SERVER_HOST = 'localhost';
const DUMMY_SERVER_PATH = '/dummy';
const DUMMY_RESPONSE_DATA = Buffer.from(new ArrayBuffer(16));
const DUMMY_RESPONSE_HEADER = {
	x: 'x',
	y: 'y',
};

describe('requestSimpleUsingFetch', () => {
	let mockLog: typeof import('@/log');
	beforeAll(() => {
		mockLog = {
			trace: jest.fn(),
			debug: jest.fn(),
			info: jest.fn(),
			warn: jest.fn(),
			error: jest.fn(),
		};
		jest.doMock('@/log', () => mockLog);
	});
	afterAll(() => {
		jest.dontMock('@/log');
	});
	beforeEach(() => {
		Object.keys(mockLog).forEach((method) => {
			((mockLog as any)[method] as jest.Mock).mockClear();
		});
	});

	let isModuleAvailable = true;

	let responseSuccess = true;
	const mockFetch = jest.fn(async () => {
		const dummyHeaders = new Map<string, string>();
		Object.keys(DUMMY_RESPONSE_HEADER).forEach((key) => {
			dummyHeaders.set(key, (DUMMY_RESPONSE_HEADER as any)[key]);
		});
		return {
			async buffer() {
				return DUMMY_RESPONSE_DATA;
			},
			headers: dummyHeaders,
			ok: responseSuccess,
			status: responseSuccess ? 200 : 400,
			statusText: '',
		};
	});

	beforeAll(() => {
		jest.doMock('node-fetch', () => {
			if (!isModuleAvailable) {
				throw new Error('Not found');
			}
			return mockFetch;
		});
	});
	afterAll(() => {
		jest.dontMock('node-fetch');
	});
	beforeEach(() => {
		jest.resetModules();
		isModuleAvailable = true;
		responseSuccess = true;
		delete (global as any).fetch;
		mockFetch.mockClear();
	});

	describe('isAvailable', () => {
		it('should return true if node-fetch is available', async () => {
			isModuleAvailable = true;

			const isAvailable = (
				await import('@/requestSimple/requestSimpleUsingFetch')
			).isAvailable;

			expect(isAvailable()).toEqual(true);
		});
		it('should return true if global fetch is available', async () => {
			isModuleAvailable = false;
			(global as any).fetch = mockFetch;

			const isAvailable = (
				await import('@/requestSimple/requestSimpleUsingFetch')
			).isAvailable;

			expect(isAvailable()).toEqual(true);
		});
		it('should return false if not available', async () => {
			isModuleAvailable = false;

			const isAvailable = (
				await import('@/requestSimple/requestSimpleUsingFetch')
			).isAvailable;

			expect(isAvailable()).toEqual(false);
		});
	});

	describe('default function', () => {
		function performTest() {
			it('should call fetch function (success)', async () => {
				responseSuccess = true;

				const requestSimpleUsingFetch = (
					await import('@/requestSimple/requestSimpleUsingFetch')
				).default;

				const url = `http://${DUMMY_SERVER_HOST}${DUMMY_SERVER_PATH}`;
				const dummyHeaders: any = { __tag: 'dummyHeaders' };
				const dummyBody: any = { __tag: 'dummyBody' };
				const dummyOptions: any = {
					method: 'DUMMY',
					headers: dummyHeaders,
					body: dummyBody,
				};
				const dummyCb = jest.fn();

				// wait until callback is called
				await Promise.race([
					new Promise<void>((resolve) => {
						requestSimpleUsingFetch(
							url,
							dummyOptions,
							(...args) => {
								// pass to jest.Mock to test arguments
								dummyCb(...args);
								resolve();
							}
						);
					}),
					timeoutErrorPromise(500),
				]);

				expect(mockFetch).toBeCalledWith(url, {
					method: 'DUMMY',
					headers: dummyHeaders,
					body: dummyBody,
				});
				expect(dummyCb).toBeCalledWith(
					null,
					DUMMY_RESPONSE_HEADER,
					DUMMY_RESPONSE_DATA
				);
			});
			it('should call fetch function (server failure)', async () => {
				responseSuccess = false;

				const requestSimpleUsingFetch = (
					await import('@/requestSimple/requestSimpleUsingFetch')
				).default;

				const url = `http://${DUMMY_SERVER_HOST}${DUMMY_SERVER_PATH}`;
				const dummyHeaders: any = { __tag: 'dummyHeaders' };
				const dummyBody: any = { __tag: 'dummyBody' };
				const dummyOptions: any = {
					method: 'DUMMY',
					headers: dummyHeaders,
					body: dummyBody,
				};
				const dummyCb = jest.fn();

				// wait until callback is called
				await Promise.race([
					new Promise<void>((resolve) => {
						requestSimpleUsingFetch(
							url,
							dummyOptions,
							(...args) => {
								// pass to jest.Mock to test arguments
								dummyCb(...args);
								resolve();
							}
						);
					}),
					timeoutErrorPromise(500),
				]);

				expect(mockFetch).toBeCalledWith(url, {
					method: 'DUMMY',
					headers: dummyHeaders,
					body: dummyBody,
				});
				expect(dummyCb).toBeCalledWith(
					expect.any(Error),
					DUMMY_RESPONSE_HEADER,
					DUMMY_RESPONSE_DATA
				);
			});
			it('should call fetch function (function failure)', async () => {
				const dummyError = new Error('dummy');
				mockFetch.mockRejectedValueOnce(dummyError);

				const requestSimpleUsingFetch = (
					await import('@/requestSimple/requestSimpleUsingFetch')
				).default;

				const url = `http://${DUMMY_SERVER_HOST}${DUMMY_SERVER_PATH}`;
				const dummyHeaders: any = { __tag: 'dummyHeaders' };
				const dummyBody: any = { __tag: 'dummyBody' };
				const dummyOptions: any = {
					method: 'DUMMY',
					headers: dummyHeaders,
					body: dummyBody,
				};
				const dummyCb = jest.fn();

				// wait until callback is called
				await Promise.race([
					new Promise<void>((resolve) => {
						requestSimpleUsingFetch(
							url,
							dummyOptions,
							(...args) => {
								// pass to jest.Mock to test arguments
								dummyCb(...args);
								resolve();
							}
						);
					}),
					timeoutErrorPromise(500),
				]);

				expect(mockFetch).toBeCalledWith(url, {
					method: 'DUMMY',
					headers: dummyHeaders,
					body: dummyBody,
				});
				expect(dummyCb).toBeCalled();
				expect(dummyCb.mock.calls[0][0]).toEqual(dummyError);
			});
		}

		describe('using node-fetch', () => {
			beforeEach(() => {
				isModuleAvailable = true;
			});
			performTest();
		});
		describe('using global fetch', () => {
			beforeEach(() => {
				isModuleAvailable = false;
				(global as any).fetch = mockFetch;
			});
			performTest();
		});
	});
});
