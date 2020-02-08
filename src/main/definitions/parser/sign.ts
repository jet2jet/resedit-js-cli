import * as crypto from 'crypto';

import { validateStringValue } from './utils';
import {
	CertificateSelectMode,
	DigestAlgorithmType,
	certificateSelectModeValues,
} from '../../definitions/DefinitionData';

export interface ParsedSignDefinitionBase {
	password: string | undefined;
	certSelect: CertificateSelectMode;
	digestAlgorithm: DigestAlgorithmType;
	timestampServer: string | undefined;
}

export interface ParsedSignDefinitionWithP12File
	extends ParsedSignDefinitionBase {
	p12File: string;
}

export interface ParsedSignDefinitionWithPemFile
	extends ParsedSignDefinitionBase {
	privateKeyFile: string;
	certificateFile: string;
}

export type ParsedSignDefinition =
	| ParsedSignDefinitionWithP12File
	| ParsedSignDefinitionWithPemFile;

const validDigestAlgorithm: DigestAlgorithmType[] = (() => {
	const base: DigestAlgorithmType[] = [
		'sha1',
		'sha256',
		'sha512',
		'sha224',
		'sha384',
		'sha512-224',
		'sha512-256',
		'sha3-224',
		'sha3-256',
		'sha3-384',
		'sha3-512',
		'shake128',
		'shake256',
	];
	const nodejsHashes = crypto.getHashes();
	// filter algorithms with ones supported by Node.js
	return base.filter(type => nodejsHashes.indexOf(type) >= 0);
})();

export function getValidDigestAlgorithm() {
	return validDigestAlgorithm;
}

export function isValidDigestAlgorithm(
	value: unknown
): value is DigestAlgorithmType {
	return (
		typeof value === 'string' &&
		validDigestAlgorithm.indexOf(value as DigestAlgorithmType) >= 0
	);
}

function validateDigestAlgorithm(
	value: unknown
): asserts value is DigestAlgorithmType {
	if (!isValidDigestAlgorithm(value)) {
		throw new Error(
			`Invalid data: 'sign.digestAlgorithm' is not a valid value (choices: ${validDigestAlgorithm.join(
				', '
			)})`
		);
	}
}

export default function parseSignDefinition(
	data: unknown
): ParsedSignDefinition {
	if (typeof data !== 'object' || !data) {
		throw new Error("Invalid data: 'sign' is not an object");
	}
	const keys = Object.keys(data);
	let hasP12File = false;
	if (keys.indexOf('p12File') >= 0) {
		if (
			keys.indexOf('privateKeyFile') >= 0 ||
			keys.indexOf('certificateFile') >= 0
		) {
			throw new Error(
				"Only 'p12File' or ('privateKeyFile' and 'certificateFile') can be specified"
			);
		}
		hasP12File = true;
	} else {
		if (
			keys.indexOf('privateKeyFile') < 0 ||
			keys.indexOf('certificateFile') < 0
		) {
			throw new Error(
				"Both 'privateKeyFile' and 'certificateFile' are required if 'p12File' is not specified"
			);
		}
	}
	let p12File: string | undefined;
	let privateKeyFile: string | undefined;
	let certificateFile: string | undefined;
	let certSelect: CertificateSelectMode = CertificateSelectMode.Leaf;
	let password: string | undefined;
	let digestAlgorithm: DigestAlgorithmType = 'sha256';
	let timestampServer: string | undefined;
	keys.forEach(key => {
		const value: unknown = (data as any)[key];
		switch (key) {
			case 'p12File':
				validateStringValue(value, 'sign.p12File');
				p12File = value;
				break;
			case 'privateKeyFile':
				validateStringValue(value, 'sign.privateKeyFile');
				privateKeyFile = value;
				break;
			case 'certificateFile':
				validateStringValue(value, 'sign.certificateFile');
				certificateFile = value;
				break;
			case 'certSelect':
				if (
					typeof value !== 'string' ||
					certificateSelectModeValues.indexOf(value) < 0
				) {
					throw new Error(
						`Invalid data: 'sign.certSelect' is not a valid value (choices: ${certificateSelectModeValues.join(
							', '
						)})`
					);
				}
				certSelect = value as CertificateSelectMode;
				break;
			case 'password':
				// 'undefined' is allowed
				if (typeof value !== 'undefined') {
					validateStringValue(value, 'sign.password');
				}
				password = value;
				break;
			case 'digestAlgorithm':
				validateDigestAlgorithm(value);
				digestAlgorithm = value;
				break;
			case 'timestampServer':
				validateStringValue(value, 'sign.timestampServer');
				timestampServer = value;
				break;
			default:
				throw new Error(
					`Invalid data: unknown property '${key}' on 'sign`
				);
		}
	});
	if (hasP12File) {
		return {
			p12File: p12File!,
			certSelect,
			password,
			digestAlgorithm,
			timestampServer,
		};
	} else {
		return {
			privateKeyFile: privateKeyFile!,
			certificateFile: certificateFile!,
			certSelect,
			password,
			digestAlgorithm,
			timestampServer,
		};
	}
}
