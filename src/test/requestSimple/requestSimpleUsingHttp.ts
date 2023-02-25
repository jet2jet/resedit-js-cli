import { jest } from '@jest/globals';
import { createRequire } from 'module';
import type nockNamespace = require('nock');

import type * as Log from '@/log';
import type { SimpleOptions } from '@/requestSimple';

import { timeoutErrorPromise } from '../testUtils/index.js';

const require = createRequire(import.meta.url);
const nock = require('nock') as typeof nockNamespace;

const DUMMY_SERVER_HOST = 'localhost';
const DUMMY_SERVER_PATH = '/dummy';
const DUMMY_REQUEST_DATA = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]).buffer;
const DUMMY_RESPONSE_DATA = Buffer.from(new ArrayBuffer(16));

describe('requestSimpleUsingHttp', () => {
	let mockLog: typeof Log;
	beforeAll(() => {
		jest.resetModules();
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
		nock.disableNetConnect();
	});
	afterAll(() => {
		nock.restore();
	});
	afterEach(() => {
		nock.cleanAll();
	});
	it.each(cases)(
		'should call native request (%s, %s)',
		async (protocol, responseType) => {
			const interceptor = nock(`${protocol}://${DUMMY_SERVER_HOST}`).post(
				DUMMY_SERVER_PATH,
				Buffer.from(DUMMY_REQUEST_DATA)
			);
			let scope: nockNamespace.Scope;
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
			const requestSimpleUsingHttp = (
				await import('@/requestSimple/requestSimpleUsingHttp.js')
			).default;
			const url = `${protocol}://${DUMMY_SERVER_HOST}${DUMMY_SERVER_PATH}`;
			const dummyOptions: SimpleOptions = {
				method: 'POST',
				body: DUMMY_REQUEST_DATA,
			};
			const dummyCb = jest.fn();

			// wait until callback is called
			await Promise.race([
				new Promise<void>((resolve) => {
					requestSimpleUsingHttp(url, dummyOptions, (...args) => {
						// pass to jest.Mock to test arguments
						dummyCb(...args);
						resolve();
					});
				}),
				timeoutErrorPromise(500),
			]);

			if (responseType === ResponseType.Success) {
				expect(dummyCb).toBeCalledWith(
					null,
					expect.anything(),
					DUMMY_RESPONSE_DATA
				);
			} else {
				expect(dummyCb).toBeCalled();
				expect(dummyCb.mock.calls[0][0]).toBeInstanceOf(Error);
			}
			scope.done();
		}
	);
});
