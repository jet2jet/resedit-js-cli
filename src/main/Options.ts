import type {
	CertificateSelectMode,
	DigestAlgorithmType,
} from './definitions/DefinitionData.js';
import type DefinitionData from './definitions/DefinitionData.js';

export default interface Options {
	in?: string;
	out: string;
	lang?: number;
	definition?: string | DefinitionData;
	'ignore-signed'?: boolean;
	// only used when creating new binary
	as32bit?: boolean;
	// only used when creating new binary
	asExeFile?: boolean;
	// disallow growing resource section size (throw errors if data exceeds)
	noGrow?: boolean;
	// allow shrinking resource section size (if the data size is less than original)
	allowShrink?: boolean;

	// the following resource values will overwrite an object retrieved from `definition`

	// --- for icon resource
	/** icon file names to add (ID can be specified as a string followed by ',' and the icon file name) */
	icon?: string[];

	// --- for version resource
	'product-name'?: string;
	/** product version (format: 'w.x.y.z') */
	'product-version'?: string;
	'file-description'?: string;
	/** file version (format: 'w.x.y.z') */
	'file-version'?: string;
	'company-name'?: string;
	'original-filename'?: string;
	'internal-name'?: string;

	// --- for raw (any) resource
	/** raw resource data to add (format: '<type>,<ID>,<string-value>' or '<type>,<ID>,@<file-name>') */
	raw?: string[];

	// --- for signing
	sign?: boolean;
	/** PKCS 12 file (.p12 or .pfx file) which contains private key and certificates */
	p12?: string;
	/** Private key file (only PEM format file (.pem) is supported) */
	'private-key'?: string;
	/** Certificate file (DER format file (.cer) or PEM format file (.pem) is supported) */
	certificate?: string;
	/** Certificate selection mode whether to pick certificates from the specified file (default: leaf) */
	select?: CertificateSelectMode;
	/** Password/passphrase for private key */
	password?: string;
	/** Digest algorithm for signing (default: 'sha256') */
	digest?: DigestAlgorithmType;
	/** Timestamp server to set timestamp for signed data */
	timestamp?: string;
}
