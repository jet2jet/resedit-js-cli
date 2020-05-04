/// <reference types='jest' />

import { SimpleOptions } from '@/requestSimple';

const DUMMY_SERVER_HOST = 'localhost';
const DUMMY_SERVER_PATH = '/dummy';
const DUMMY_REQUEST_DATA = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]).buffer;
const DUMMY_RESPONSE_DATA = Buffer.from(new ArrayBuffer(16));

describe('signing/requestTimestamp', () => {
	const mockLog: typeof import('@/log') = {
		trace: jest.fn(),
		debug: jest.fn(),
		info: jest.fn(),
		warn: jest.fn(),
		error: jest.fn(),
	};
	const mockRequestSimple = {
		__esModule: true,
		default: jest.fn(),
	};
	beforeAll(() => {
		jest.resetModules();
		jest.doMock('@/log', () => mockLog);
		jest.doMock('@/requestSimple', () => mockRequestSimple);
	});
	afterAll(() => {
		jest.dontMock('@/requestSimple');
		jest.dontMock('@/log');
	});
	beforeEach(() => {
		Object.keys(mockLog).forEach((method) => {
			((mockLog as any)[method] as jest.Mock).mockClear();
		});
		mockRequestSimple.default.mockClear();
	});

	it("should call 'requestSimple' and resolve if timestamp data is replied", async () => {
		mockRequestSimple.default.mockImplementation((_1, _2, cb: Function) => {
			cb(
				null,
				{
					'content-type': 'application/timestamp-reply',
				},
				DUMMY_RESPONSE_DATA
			);
		});

		const requestTimestamp = (await import('@/signing/requestTimestamp'))
			.default;
		const url = `http://${DUMMY_SERVER_HOST}${DUMMY_SERVER_PATH}`;
		const resp = await requestTimestamp(url, DUMMY_REQUEST_DATA);
		expect(mockRequestSimple.default).toBeCalledWith(
			url,
			expect.objectContaining<SimpleOptions>({
				method: 'POST',
				headers: {
					'Content-Type': 'application/timestamp-query',
					'Content-Length': `${DUMMY_REQUEST_DATA.byteLength}`,
				},
				body: expect.any(Buffer),
			}),
			expect.anything()
		);
		expect(resp).toEqual(DUMMY_RESPONSE_DATA);
	});

	it("should call 'requestSimple' and reject if unexpected data is replied", async () => {
		mockRequestSimple.default.mockImplementation((_1, _2, cb: Function) => {
			cb(
				null,
				{
					'content-type': 'text/plain',
				},
				DUMMY_RESPONSE_DATA
			);
		});

		const requestTimestamp = (await import('@/signing/requestTimestamp'))
			.default;
		const url = `http://${DUMMY_SERVER_HOST}${DUMMY_SERVER_PATH}`;
		await expect(
			requestTimestamp(url, DUMMY_REQUEST_DATA)
		).rejects.toThrow();
		expect(mockRequestSimple.default).toBeCalledWith(
			url,
			expect.objectContaining<SimpleOptions>({
				method: 'POST',
				headers: {
					'Content-Type': 'application/timestamp-query',
					'Content-Length': `${DUMMY_REQUEST_DATA.byteLength}`,
				},
				body: expect.any(Buffer),
			}),
			expect.anything()
		);
	});

	it("should call 'requestSimple' and reject if the failure is replied", async () => {
		const dummyError = new Error('dummy');
		mockRequestSimple.default.mockImplementation((_1, _2, cb: Function) => {
			cb(dummyError, undefined, undefined);
		});

		const requestTimestamp = (await import('@/signing/requestTimestamp'))
			.default;
		const url = `http://${DUMMY_SERVER_HOST}${DUMMY_SERVER_PATH}`;
		await expect(requestTimestamp(url, DUMMY_REQUEST_DATA)).rejects.toEqual(
			dummyError
		);
		expect(mockRequestSimple.default).toBeCalledWith(
			url,
			expect.objectContaining<SimpleOptions>({
				method: 'POST',
				headers: {
					'Content-Type': 'application/timestamp-query',
					'Content-Length': `${DUMMY_REQUEST_DATA.byteLength}`,
				},
				body: expect.any(Buffer),
			}),
			expect.anything()
		);
	});
});
