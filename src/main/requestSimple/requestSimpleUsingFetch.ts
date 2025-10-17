import { EnvHttpProxyAgent, setGlobalDispatcher } from 'undici';
import * as log from '../log.js';
import type SimpleCallback from './SimpleCallback.js';
import type SimpleOptions from './SimpleOptions.js';

type GlobalFetch = typeof globalThis.fetch;

const fetchFunction: GlobalFetch | null = (() => {
	if (typeof fetch === 'function') {
		// eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
		if (process.env.HTTPS_PROXY || process.env.HTTP_PROXY) {
			setGlobalDispatcher(new EnvHttpProxyAgent());
		}
		return fetch;
	}
	return null;
})();

export function isAvailable(): boolean {
	return fetchFunction !== null;
}

export default function requestSimpleUsingFetch(
	url: string,
	opt: SimpleOptions,
	cb: SimpleCallback
): void {
	log.debug(
		`[sign] Use${
			typeof fetch !== 'undefined' ? ' native' : ''
		} fetch function`
	);

	async function inner() {
		try {
			const response = await fetchFunction!(url, {
				method: opt.method,
				headers: opt.headers,
				body: opt.body,
			});
			const buffer = Buffer.from(await response.arrayBuffer());

			const cbHeaders: Record<string, string> = {};
			response.headers.forEach((value, key) => {
				cbHeaders[key] = value;
			});

			if (response.ok) {
				cb(null, cbHeaders, buffer);
			} else {
				cb(
					new Error(
						`Server error ${response.status} ${response.statusText}`
					),
					cbHeaders,
					buffer
				);
			}
		} catch (error: unknown) {
			cb(error, {}, Buffer.from(''));
		}
	}
	// eslint-disable-next-line @typescript-eslint/no-floating-promises
	inner();
}
