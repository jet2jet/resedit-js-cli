import * as log from '../log';

import SimpleCallback from './SimpleCallback';
import SimpleOptions from './SimpleOptions';

import requestNamespace = require('request');

const request: typeof requestNamespace | null = (() => {
	try {
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		const packageJson = require('request/package.json');
		const versionTokens = packageJson.version.split('.');
		if (versionTokens[0] !== '2' || Number(versionTokens[1]) < 88) {
			log.warn(
				`'request' module is found but unsupported version: ${packageJson.version} (expected: ^2.88.0)`
			);
		}
		return require('request');
	} catch {
		return null;
	}
})();

export function isAvailable() {
	return !!request;
}

export default function requestSimpleUsingModule(
	url: string,
	opt: SimpleOptions,
	cb: SimpleCallback
) {
	log.debug("[sign] Use 'request' module");

	const options: requestNamespace.CoreOptions = {
		...opt,
		encoding: null,
	};
	request!(url, options, (err, res, body) => {
		if (err) {
			cb(err, res.headers, body);
		} else {
			if (res.statusCode! < 200 || res.statusCode! >= 400) {
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
