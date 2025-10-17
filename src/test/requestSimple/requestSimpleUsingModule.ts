import { jest } from '@jest/globals';
import type * as requestNamespace from 'request';
import { timeoutErrorPromise } from '../testUtils/index.js';
import type * as Log from '@/log';

const DUMMY_SERVER_HOST = 'localhost';
const DUMMY_SERVER_PATH = '/dummy';
const DUMMY_RESPONSE_DATA = Buffer.from(new ArrayBuffer(16));
const DUMMY_RESPONSE_HEADER = {
	x: 'x',
	y: 'y',
};

describe('requestSimpleUsingModule', () => {
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
			((mockLog as any)[method] as jest.Mock).mockClear();
		});
	});

	// NOTE: Here 'nock' is not used because it is important to check whether 'request' is used and called.
	let mockRequest: jest.Mock;
	let mockRequestVersion: string;
	let isRequestAvailable = true;
	let returnSuccess = true;
	beforeAll(() => {
		jest.resetModules();

		const fnRequest = (arg1: any, arg2?: any, arg3?: any) => {
			let cb: requestNamespace.RequestCallback | undefined;
			if (typeof arg1 === 'string') {
				cb = typeof arg2 === 'object' ? arg3 : arg2;
			} else {
				cb = arg2;
			}
			if (!cb) {
				return;
			}
			if (returnSuccess) {
				cb(
					null,
					{
						headers: DUMMY_RESPONSE_HEADER,
					} as any,
					DUMMY_RESPONSE_DATA
				);
			} else {
				cb(new Error(), {} as any, undefined);
			}
			return {} as any;
		};

		mockRequest = jest.fn(fnRequest);
		jest.doMock('request', () => {
			if (!isRequestAvailable) {
				throw new Error('Unavailable');
			}
			return mockRequest;
		});
		mockRequestVersion = '2.88.0';
		jest.doMock('request/package.json', () => {
			const o = Object.create(null);
			Object.defineProperty(o, 'version', {
				get() {
					return mockRequestVersion;
				},
			});
			return o;
		});
	});
	beforeEach(() => {
		isRequestAvailable = true;
		returnSuccess = true;
		mockRequestVersion = '2.88.0';
		mockRequest.mockClear();
	});
	afterEach(() => {
		jest.resetModules();
	});
	afterAll(() => {
		jest.dontMock('request/package.json');
		jest.dontMock('request');
	});

	describe('isAvailable', () => {
		it('should return true if available', async () => {
			const isAvailable = (
				await import('@/requestSimple/requestSimpleUsingModule.js')
			).isAvailable;

			expect(isAvailable()).toEqual(true);
		});
		it('should return false if not available', async () => {
			isRequestAvailable = false;

			const isAvailable = (
				await import('@/requestSimple/requestSimpleUsingModule.js')
			).isAvailable;

			expect(isAvailable()).toEqual(false);
		});
	});

	describe('default function', () => {
		it("should call 'request' module function if available (success)", async () => {
			const requestSimpleUsingModule = (
				await import('@/requestSimple/requestSimpleUsingModule.js')
			).default;

			const url = `http://${DUMMY_SERVER_HOST}${DUMMY_SERVER_PATH}`;
			const dummyOptions: any = {
				a: 'a',
				b: 'b',
			};
			const dummyCb = jest.fn();

			// wait until callback is called
			await Promise.race([
				new Promise<void>((resolve) => {
					requestSimpleUsingModule(url, dummyOptions, (...args) => {
						// pass to jest.Mock to test arguments
						dummyCb(...args);
						resolve();
					});
				}),
				timeoutErrorPromise(500),
			]);

			expect(mockRequest).toHaveBeenCalledTimes(1);
			expect(mockLog.warn).toHaveBeenCalledTimes(0);
			expect(mockRequest).toHaveBeenCalledWith(
				url,
				expect.objectContaining({ ...dummyOptions, encoding: null }),
				expect.anything()
			);
			expect(dummyCb).toHaveBeenCalledWith(
				null,
				DUMMY_RESPONSE_HEADER,
				DUMMY_RESPONSE_DATA
			);
		});

		it("should call 'request' module function if available (success but warn for module)", async () => {
			mockRequestVersion = '2.87.0';
			const requestSimpleUsingModule = (
				await import('@/requestSimple/requestSimpleUsingModule.js')
			).default;

			const url = `http://${DUMMY_SERVER_HOST}${DUMMY_SERVER_PATH}`;
			const dummyOptions: any = {
				a: 'a',
				b: 'b',
			};
			const dummyCb = jest.fn();

			// wait until callback is called
			await Promise.race([
				new Promise<void>((resolve) => {
					requestSimpleUsingModule(url, dummyOptions, (...args) => {
						// pass to jest.Mock to test arguments
						dummyCb(...args);
						resolve();
					});
				}),
				timeoutErrorPromise(500),
			]);

			expect(mockRequest).toHaveBeenCalledTimes(1);
			expect(mockLog.warn).toHaveBeenCalledTimes(1);
			expect(mockRequest).toHaveBeenCalledWith(
				url,
				expect.objectContaining({ ...dummyOptions, encoding: null }),
				expect.anything()
			);
			expect(dummyCb).toHaveBeenCalledWith(
				null,
				DUMMY_RESPONSE_HEADER,
				DUMMY_RESPONSE_DATA
			);
		});

		it("should call 'request' module function if available (fail)", async () => {
			returnSuccess = false;

			const requestSimpleUsingModule = (
				await import('@/requestSimple/requestSimpleUsingModule.js')
			).default;

			const url = `http://${DUMMY_SERVER_HOST}${DUMMY_SERVER_PATH}`;
			const dummyOptions: any = {
				a: 'a',
				b: 'b',
			};
			const dummyCb = jest.fn();

			// wait until callback is called
			await Promise.race([
				new Promise<void>((resolve) => {
					requestSimpleUsingModule(url, dummyOptions, (...args) => {
						// pass to jest.Mock to test arguments
						dummyCb(...args);
						resolve();
					});
				}),
				timeoutErrorPromise(500),
			]);

			expect(mockRequest).toHaveBeenCalledTimes(1);
			expect(mockLog.warn).toHaveBeenCalledTimes(0);
			expect(mockRequest).toHaveBeenCalledWith(
				url,
				expect.objectContaining({ ...dummyOptions, encoding: null }),
				expect.anything()
			);
			expect(dummyCb).toHaveBeenCalled();
			expect(dummyCb.mock.calls[0][0]).toBeInstanceOf(Error);
		});
	});
});
