import { jest } from '@jest/globals';
import { timeoutErrorPromise } from '../testUtils/index.js';
import type * as Log from '@/log';
import type SimpleOptions from '@/requestSimple/SimpleOptions.js';

const DUMMY_SERVER_HOST = 'localhost';
const DUMMY_SERVER_PATH = '/dummy';
const DUMMY_RESPONSE_DATA = Buffer.from(new ArrayBuffer(16));
const DUMMY_RESPONSE_HEADER = {
	x: 'x',
	y: 'y',
};

describe('requestSimpleUsingFetch', () => {
	let mockLog: typeof Log;
	beforeAll(() => {
		mockLog = {
			trace: jest.fn(),
			debug: jest.fn(),
			info: jest.fn(),
			warn: jest.fn(),
			error: jest.fn(),
		};
		jest.unstable_mockModule('@/log', () => mockLog);
	});
	afterAll(() => {
		jest.dontMock('@/log');
	});
	beforeEach(() => {
		Object.keys(mockLog).forEach((method) => {
			(mockLog[method as keyof typeof mockLog] as jest.Mock).mockClear();
		});
	});

	let responseSuccess = true;
	const mockFetch = jest.fn<typeof fetch>(() => {
		const dummyHeaders = new Headers();
		Object.keys(DUMMY_RESPONSE_HEADER).forEach((key) => {
			dummyHeaders.set(
				key,
				DUMMY_RESPONSE_HEADER[key as keyof typeof DUMMY_RESPONSE_HEADER]
			);
		});
		return Promise.resolve({
			arrayBuffer() {
				return Promise.resolve(DUMMY_RESPONSE_DATA);
			},
			headers: dummyHeaders,
			ok: responseSuccess,
			status: responseSuccess ? 200 : 400,
			statusText: '',
		} satisfies Partial<Response> as unknown as Response);
	});

	beforeEach(() => {
		jest.resetModules();
		responseSuccess = true;
		// @ts-expect-error: for test
		delete global.fetch;
		mockFetch.mockClear();
	});

	describe('isAvailable', () => {
		it('should return true if global fetch is available', async () => {
			global.fetch = mockFetch;

			const isAvailable = (
				await import('@/requestSimple/requestSimpleUsingFetch.js')
			).isAvailable;

			expect(isAvailable()).toEqual(true);
		});
		it('should return false if not available', async () => {
			const isAvailable = (
				await import('@/requestSimple/requestSimpleUsingFetch.js')
			).isAvailable;

			expect(isAvailable()).toEqual(false);
		});
	});

	describe('default function', () => {
		function performTest() {
			it('should call fetch function (success)', async () => {
				responseSuccess = true;

				const requestSimpleUsingFetch = (
					await import('@/requestSimple/requestSimpleUsingFetch.js')
				).default;

				const url = `http://${DUMMY_SERVER_HOST}${DUMMY_SERVER_PATH}`;
				const dummyHeaders: Record<string, string> = {
					__tag: 'dummyHeaders',
				};
				// This is not a real Buffer but it should not be touched in requestSimpleUsingFetch
				const dummyBody: Buffer = {
					__tag: 'dummyBody',
				} as unknown as Buffer;
				const dummyOptions: SimpleOptions = {
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

				expect(mockFetch).toHaveBeenCalledWith(url, {
					method: 'DUMMY',
					headers: dummyHeaders,
					body: dummyBody,
				});
				expect(dummyCb).toHaveBeenCalledWith(
					null,
					DUMMY_RESPONSE_HEADER,
					DUMMY_RESPONSE_DATA
				);
			});
			it('should call fetch function (server failure)', async () => {
				responseSuccess = false;

				const requestSimpleUsingFetch = (
					await import('@/requestSimple/requestSimpleUsingFetch.js')
				).default;

				const url = `http://${DUMMY_SERVER_HOST}${DUMMY_SERVER_PATH}`;
				const dummyHeaders: Record<string, string> = {
					__tag: 'dummyHeaders',
				};
				// This is not a real Buffer but it should not be touched in requestSimpleUsingFetch
				const dummyBody: Buffer = {
					__tag: 'dummyBody',
				} as unknown as Buffer;
				const dummyOptions: SimpleOptions = {
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

				expect(mockFetch).toHaveBeenCalledWith(url, {
					method: 'DUMMY',
					headers: dummyHeaders,
					body: dummyBody,
				});
				expect(dummyCb).toHaveBeenCalledWith(
					expect.any(Error),
					DUMMY_RESPONSE_HEADER,
					DUMMY_RESPONSE_DATA
				);
			});
			it('should call fetch function (function failure)', async () => {
				const dummyError = new Error('dummy');
				mockFetch.mockRejectedValueOnce(dummyError);

				const requestSimpleUsingFetch = (
					await import('@/requestSimple/requestSimpleUsingFetch.js')
				).default;

				const url = `http://${DUMMY_SERVER_HOST}${DUMMY_SERVER_PATH}`;
				const dummyHeaders: Record<string, string> = {
					__tag: 'dummyHeaders',
				};
				// This is not a real Buffer but it should not be touched in requestSimpleUsingFetch
				const dummyBody: Buffer = {
					__tag: 'dummyBody',
				} as unknown as Buffer;
				const dummyOptions: SimpleOptions = {
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

				expect(mockFetch).toHaveBeenCalledWith(url, {
					method: 'DUMMY',
					headers: dummyHeaders,
					body: dummyBody,
				});
				expect(dummyCb).toHaveBeenCalled();
				expect(dummyCb.mock.calls[0][0]).toEqual(dummyError);
			});
		}

		describe('using global fetch', () => {
			beforeEach(() => {
				global.fetch = mockFetch;
			});
			performTest();
		});
	});
});
