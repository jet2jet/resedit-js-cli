import * as log from '../log.js';

import type SimpleCallback from './SimpleCallback.js';
import type SimpleOptions from './SimpleOptions.js';

import fetchNamespace = require('node-fetch');

const fetchFunction: typeof fetchNamespace.default | null = (() => {
	if (typeof fetch === 'function') {
		return fetch;
	}
	try {
		return require('node-fetch');
	} catch {
		return null;
	}
})();

export function isAvailable(): boolean {
	return fetchFunction !== null;
}

export default function requestSimpleUsingFetch(
	url: string,
	opt: SimpleOptions,
	cb: SimpleCallback
): void {
	log.debug('[sign] Use fetch function');

	async function inner() {
		try {
			const response = await fetchFunction!(url, {
				method: opt.method,
				headers: opt.headers,
				body: opt.body,
			});
			const buffer = await response.buffer();

			const cbHeaders: Record<string, string> = {};
			for (const pair of response.headers.entries()) {
				cbHeaders[pair[0]] = pair[1];
			}

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
