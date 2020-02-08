import * as http from 'http';
import * as https from 'https';

import * as log from '../log';

import requestNamespace = require('request');

interface SimpleOptions {
	method: string;
	headers?: { [key: string]: string };
	body?: any;
}
type SimpleCallback = (
	err: any,
	headers: http.IncomingHttpHeaders,
	body: Buffer
) => void;

const request: typeof requestNamespace | null = (() => {
	try {
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		const packageJson = require('request/package.json');
		const versionTokens = packageJson.version.split('.');
		if (versionTokens[0] !== '2' || Number(versionTokens[1]) < 88) {
			log.warn(
				`'request' module is found but unsupported version: ${packageJson.version} (expected: ^2,88.0)`
			);
		}
		return require('request');
	} catch {
		return null;
	}
})();

function requestSimpleUsingHttp(
	url: string,
	opt: SimpleOptions,
	cb: SimpleCallback
) {
	const options: http.RequestOptions = opt;
	const httpCallback = (res: http.IncomingMessage) => {
		const results: Buffer[] = [];
		res.on('data', chunk => {
			results.push(chunk);
		});
		res.on('end', () => {
			const buff = Buffer.concat(results);
			if (res.statusCode! < 200 || res.statusCode! >= 400) {
				cb(
					new Error(
						`Server error ${res.statusCode} ${res.statusMessage}`
					),
					res.headers,
					buff
				);
			} else {
				cb(null, res.headers, buff);
			}
		});
	};
	let req: http.ClientRequest;
	if (/^https:/.test(url)) {
		req = https.request(url, options, httpCallback);
	} else {
		req = http.request(url, options, httpCallback);
	}
	req.on('error', e => cb(e, {}, Buffer.from('')));
	if (typeof opt.body !== 'undefined') {
		req.write(opt.body);
	}
	req.end();
}

function requestSimpleUsingModule(
	url: string,
	opt: SimpleOptions,
	cb: SimpleCallback
) {
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

const requestSimple = request
	? requestSimpleUsingModule
	: requestSimpleUsingHttp;

/**
 * Requests to TSA.
 * @param server server URL to request
 * @param data binary data of TSQ
 * @return response from TSA
 */
export default function requestTimestamp(server: string, data: ArrayBuffer) {
	return new Promise<Buffer>((resolve, reject) => {
		const bin = Buffer.from(data);
		const options: SimpleOptions = {
			method: 'POST',
			headers: {
				'Content-Type': 'application/timestamp-query',
				'Content-Length': `${bin.byteLength}`,
			},
			body: bin,
		};
		log.info(
			`[sign] Request timestamp server '${server}' (data length = ${data.byteLength}).`
		);
		log.debug(
			`[sign] Use ${
				request
					? "'request' module"
					: 'native Node.js http/https library'
			}.`
		);
		requestSimple(server, options, (err, headers, body) => {
			if (err) {
				reject(err);
				return;
			}
			if (headers['content-type'] !== 'application/timestamp-reply') {
				reject(
					new Error(
						`Unexpected Content-Type for response: ${headers['content-type']}`
					)
				);
				return;
			}
			log.debug(
				`[sign] Server responded with valid timestamp data (length = ${body.byteLength})`
			);
			resolve(body);
		});
	});
}
