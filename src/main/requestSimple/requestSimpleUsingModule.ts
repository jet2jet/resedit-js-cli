import { createRequire } from 'module';
import type * as requestNamespace from 'request';

import * as log from '../log.js';

import type SimpleCallback from './SimpleCallback.js';
import type SimpleOptions from './SimpleOptions.js';

const require = createRequire(import.meta.url);

const request: typeof requestNamespace | null = (() => {
	try {
		const packageJson:
			| Record<string, unknown>
			| null
			// eslint-disable-next-line @typescript-eslint/no-var-requires
			| undefined = require('request/package.json');
		if (
			typeof packageJson !== 'object' ||
			packageJson === null ||
			typeof packageJson.version !== 'string'
		) {
			log.warn("Cannot determine 'request' package version");
		} else {
			const versionTokens = packageJson.version.split('.');
			if (versionTokens[0] !== '2' || Number(versionTokens[1]) < 88) {
				log.warn(
					`'request' module is found but unsupported version: ${packageJson.version} (expected: ^2.88.0)`
				);
			}
		}
		return require('request');
	} catch {
		return null;
	}
})();

export function isAvailable(): boolean {
	return request !== null;
}

export default function requestSimpleUsingModule(
	url: string,
	opt: SimpleOptions,
	cb: SimpleCallback
): void {
	log.debug("[sign] Use 'request' module");

	const options: requestNamespace.CoreOptions = {
		...opt,
		encoding: null,
	};
	request!(url, options, (err: unknown, res, body) => {
		if (err !== null && err !== undefined) {
			cb(err, res.headers, body);
		} else {
			if (res.statusCode < 200 || res.statusCode >= 400) {
				cb(
					new Error(
						`Server error ${res.statusCode} ${res.statusMessage}`
					),
					res.headers,
					body
				);
			} else {
				cb(null, res.headers, body);
			}
		}
	});
}
