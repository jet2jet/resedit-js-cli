import * as http from 'http';
import * as https from 'https';

import * as log from '../log';

import SimpleCallback from './SimpleCallback';
import SimpleOptions from './SimpleOptions';

export default function requestSimpleUsingHttp(
	url: string,
	opt: SimpleOptions,
	cb: SimpleCallback
): void {
	log.debug('[sign] Use native Node.js http/https library');

	const options: http.RequestOptions = opt;
	const httpCallback = (res: http.IncomingMessage) => {
		const results: Buffer[] = [];
		res.on('data', (chunk) => {
			results.push(chunk);
		});
		res.on('end', () => {
			const buff = Buffer.concat(results);
			if (res.statusCode! < 200 || res.statusCode! >= 400) {
				cb(
					new Error(
						`Server error ${res.statusCode!} ${
							res.statusMessage ?? ''
						}`
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
	req.on('error', (e) => cb(e, {}, Buffer.from('')));
	if (typeof opt.body !== 'undefined') {
		req.write(opt.body);
	}
	req.end();
}
