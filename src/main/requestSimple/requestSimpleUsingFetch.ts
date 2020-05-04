import * as log from '../log';

import SimpleCallback from './SimpleCallback';
import SimpleOptions from './SimpleOptions';

import fetchNamespace = require('node-fetch');

declare global {
	let fetch: unknown;
}

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

export function isAvailable() {
	return !!fetchFunction;
}

export default function requestSimpleUsingFetch(
	url: string,
	opt: SimpleOptions,
	cb: SimpleCallback
) {
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
		} catch (error) {
			cb(error, {}, Buffer.from(''));
		}
	}
	inner();
}
