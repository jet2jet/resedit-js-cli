import * as log from '../log';

import requestSimple, { SimpleOptions } from '../requestSimple';

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
