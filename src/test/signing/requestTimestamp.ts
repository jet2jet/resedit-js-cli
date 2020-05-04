/// <reference types='jest' />

import * as nock from 'nock';

import requestNamespace = require('request');

const DUMMY_SERVER_HOST = 'localhost';
const DUMMY_SERVER_PATH = '/dummy';
const DUMMY_REQUEST_DATA = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]).buffer;
const DUMMY_RESPONSE_DATA = Buffer.from(new ArrayBuffer(16));

describe('signing/requestTimestamp', () => {
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

	describe("with 'request' module", () => {
		// NOTE: Here 'nock' is not used because it is important to check whether 'request' is used and called.
		let mockRequest: jest.Mock;
		let mockRequestVersion: string;
		let returnSuccess = true;
		beforeAll(() => {
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
							headers: {
								'content-type': 'application/timestamp-reply',
							},
						} as any,
						DUMMY_RESPONSE_DATA
					);
				} else {
					cb(new Error(), {} as any, undefined);
				}
				return {} as any;
			};
			mockRequest = jest.fn(fnRequest);
			jest.doMock('request', () => mockRequest);
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

		it("should call 'request' module function if available (success)", async () => {
			returnSuccess = true;
			const requestTimestamp = (
				await import('@/signing/requestTimestamp')
			).default;
			const url = `http://${DUMMY_SERVER_HOST}${DUMMY_SERVER_PATH}`;
			const resp = await requestTimestamp(url, DUMMY_REQUEST_DATA);
			expect(mockRequest).toBeCalledTimes(1);
			expect(mockLog.warn).toBeCalledTimes(0);
			expect(mockRequest.mock.calls[0][0]).toEqual(url);
			expect(mockRequest.mock.calls[0][1]).toEqual(
				expect.objectContaining<requestNamespace.CoreOptions>({
					method: 'POST',
					headers: {
						'Content-Type': 'application/timestamp-query',
						'Content-Length': `${DUMMY_REQUEST_DATA.byteLength}`,
					},
					body: expect.any(Buffer),
				})
			);
			expect(resp).toEqual(DUMMY_RESPONSE_DATA);
		});

		it("should call 'request' module function if available (success but warn for module)", async () => {
			returnSuccess = true;
			mockRequestVersion = '2.87.0';
			const requestTimestamp = (
				await import('@/signing/requestTimestamp')
			).default;
			const url = `http://${DUMMY_SERVER_HOST}${DUMMY_SERVER_PATH}`;
			const resp = await requestTimestamp(url, DUMMY_REQUEST_DATA);
			expect(mockRequest).toBeCalledTimes(1);
			expect(mockLog.warn).toBeCalledTimes(1);
			expect(mockRequest.mock.calls[0][0]).toEqual(url);
			expect(mockRequest.mock.calls[0][1]).toEqual(
				expect.objectContaining<requestNamespace.CoreOptions>({
					method: 'POST',
					headers: {
						'Content-Type': 'application/timestamp-query',
						'Content-Length': `${DUMMY_REQUEST_DATA.byteLength}`,
					},
					body: expect.any(Buffer),
				})
			);
			expect(resp).toEqual(DUMMY_RESPONSE_DATA);
		});
		it("should call 'request' module function if available (fail)", async () => {
			returnSuccess = false;
			const requestTimestamp = (
				await import('@/signing/requestTimestamp')
			).default;
			const url = `http://${DUMMY_SERVER_HOST}${DUMMY_SERVER_PATH}`;
			await expect(
				requestTimestamp(url, DUMMY_REQUEST_DATA)
			).rejects.toThrow();
			expect(mockRequest).toBeCalledTimes(1);
			expect(mockRequest.mock.calls[0][0]).toEqual(url);
			expect(mockRequest.mock.calls[0][1]).toEqual(
				expect.objectContaining({
					method: 'POST',
					headers: {
						'Content-Type': 'application/timestamp-query',
						'Content-Length': `${DUMMY_REQUEST_DATA.byteLength}`,
					},
					body: expect.any(Buffer),
				})
			);
		});
	});
	describe("without 'request' module", () => {
		const enum ResponseType {
			Success = 'success',
			Error = 'error',
			ServerError = 'server error',
		}
		const cases: Array<['http' | 'https', ResponseType]> = [
			['http', ResponseType.Success],
			['http', ResponseType.Error],
			['http', ResponseType.ServerError],
			['https', ResponseType.Success],
			['https', ResponseType.Error],
			['https', ResponseType.ServerError],
		];
		beforeAll(() => {
			jest.doMock('request', () => {
				throw new Error('Not found');
			});
			jest.doMock('request/package.json', () => {
				throw new Error('Not found');
			});
			nock.disableNetConnect();
		});
		afterAll(() => {
			jest.resetModules();
			jest.dontMock('request/package.json');
			jest.dontMock('request');
			nock.restore();
		});
		afterEach(() => {
			nock.cleanAll();
		});
		it.each(cases)(
			"should call native request if 'request' module is not available (%s, %s)",
			async (protocol, responseType) => {
				const interceptor = nock(
					`${protocol}://${DUMMY_SERVER_HOST}`
				).post(DUMMY_SERVER_PATH, Buffer.from(DUMMY_REQUEST_DATA));
				let scope: nock.Scope;
				switch (responseType) {
					case ResponseType.Success:
						scope = interceptor.reply(200, DUMMY_RESPONSE_DATA, {
							'content-type': 'application/timestamp-reply',
						});
						break;
					case ResponseType.Error:
						scope = interceptor.replyWithError('fail');
						break;
					case ResponseType.ServerError:
						scope = interceptor.reply(400);
						break;
				}
				const requestTimestamp = (
					await import('@/signing/requestTimestamp')
				).default;
				const url = `${protocol}://${DUMMY_SERVER_HOST}${DUMMY_SERVER_PATH}`;
				if (responseType === ResponseType.Success) {
					const resp = await requestTimestamp(
						url,
						DUMMY_REQUEST_DATA
					);
					expect(resp).toEqual(DUMMY_RESPONSE_DATA);
				} else {
					await expect(
						requestTimestamp(url, DUMMY_REQUEST_DATA)
					).rejects.toThrow();
				}
				scope.done();
			}
		);
	});
});
