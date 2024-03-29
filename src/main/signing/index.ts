import * as crypto from 'crypto';
import type * as PE from 'pe-library';
import * as ResEdit from 'resedit';

import { readFile } from '../fs.js';
import * as log from '../log.js';
import requestTimestamp from './requestTimestamp.js';
import {
	type CertAndKeyData,
	getCertificatesFromPem,
	pickKeysFromP12File,
	pickPrivateKeyFromPem,
	verifyDERCertificates,
} from './signUtil.js';
import type {
	DigestAlgorithmType,
	CertificateSelectMode,
} from '../definitions/DefinitionData.js';
import type { ParsedSignDefinition } from '../definitions/parser/sign.js';

class MySignerObject implements ResEdit.SignerObject {
	public timestampData?(reqData: ArrayBuffer): Promise<ArrayBufferView>;

	constructor(
		private readonly privateKeyPem: string,
		private readonly isRSA: boolean,
		private readonly certificates: ArrayBufferView[],
		private readonly digestAlgorithm: DigestAlgorithmType,
		timestampServer?: string
	) {
		if (timestampServer !== undefined) {
			this.timestampData = (reqData) =>
				requestTimestamp(timestampServer, reqData);
		}
	}

	public getDigestAlgorithm(): ResEdit.DigestAlgorithmType {
		return this.digestAlgorithm;
	}
	public getEncryptionAlgorithm(): ResEdit.EncryptionAlgorithmType {
		return this.isRSA ? 'rsa' : 'dsa';
	}
	public getCertificateData(): ArrayBufferView[] {
		return this.certificates;
	}
	public async digestData(
		dataIterator: Iterator<ArrayBuffer, void, undefined>
	) {
		const hash = crypto.createHash(this.digestAlgorithm);
		while (true) {
			const it = dataIterator.next();
			if (it.done) {
				break;
			}
			hash.update(Buffer.from(it.value));
		}
		return hash.digest();
	}
	public async encryptData(
		dataIterator: Iterator<ArrayBuffer, void, undefined>
	) {
		const pkey = {
			key: this.privateKeyPem,
		};

		const binArray: Buffer[] = [];
		let totalLength = 0;
		while (true) {
			const it = dataIterator.next();
			if (it.done) {
				break;
			}
			binArray.push(Buffer.from(it.value));
			totalLength += it.value.byteLength;
		}
		return crypto.privateEncrypt(
			pkey,
			Buffer.concat(binArray, totalLength)
		);
	}
}

export async function prepareForSigningByP12(
	p12File: string,
	password: string | undefined,
	certSelect: CertificateSelectMode
): Promise<CertAndKeyData> {
	const p12Data = await readFile(p12File);
	try {
		return pickKeysFromP12File(p12Data, certSelect, password);
	} catch (e) {
		throw new Error(
			`Invalid or unsupported p12/pfx file '${p12File}' (detail: ${String(
				e == null
					? ''
					: typeof e === 'object' && 'message' in e
					? String(e.message)
					: e
			)})`
		);
	}
}

export async function prepareForSigning(
	privateKeyFile: string,
	certificateFile: string,
	password: string | undefined,
	certSelect: CertificateSelectMode
): Promise<CertAndKeyData> {
	const [pkeyFile, certFile] = await Promise.all([
		readFile(privateKeyFile, 'utf8'),
		readFile(certificateFile),
	]);

	const keys = pickPrivateKeyFromPem(pkeyFile);
	if (!keys.length) {
		throw new Error(
			`Invalid or unsupported private key file '${privateKeyFile}'.`
		);
	}
	const [isRSA, privatePem] = keys[0];

	let certs: ArrayBufferView[];
	try {
		// first check as binary data
		certs = [verifyDERCertificates(certFile, certSelect)];
	} catch {
		// second check as PEM data (text data)
		try {
			certs = getCertificatesFromPem(
				certFile.toString('utf8'),
				certSelect
			);
		} catch {
			throw new Error(
				`Invalid or unsupported certificate file '${certificateFile}'.`
			);
		}
	}

	return {
		certs,
		privatePem,
		isRSA,
		password,
	};
}

export async function prepare(
	defData: ParsedSignDefinition
): Promise<CertAndKeyData> {
	if ('p12File' in defData) {
		return await prepareForSigningByP12(
			defData.p12File,
			defData.password,
			defData.certSelect
		);
	} else {
		return await prepareForSigning(
			defData.privateKeyFile,
			defData.certificateFile,
			defData.password,
			defData.certSelect
		);
	}
}

export function doSign(
	nt: PE.NtExecutable,
	data: CertAndKeyData,
	digestAlgorithm: DigestAlgorithmType,
	timestampServer?: string
): PromiseLike<ArrayBuffer> {
	log.debug(
		`[sign] isRSA = ${data.isRSA ? 'true' : 'false'}, cert count = ${
			data.certs.length
		}, digest algorithm = ${digestAlgorithm}, timestamp server = ${
			timestampServer ?? '(not use)'
		}`
	);
	return ResEdit.generateExecutableWithSign(
		nt,
		new MySignerObject(
			data.privatePem,
			data.isRSA,
			data.certs,
			digestAlgorithm,
			timestampServer
		)
	);
}
