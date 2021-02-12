import * as forge from 'node-forge';
import { CertificateSelectMode } from '../definitions/DefinitionData';

export interface CertAndKeyData {
	certs: ArrayBufferView[];
	privatePem: string;
	isRSA: boolean;
	password: string | undefined;
}

// @internal
export interface CertLike {
	issuer: { hash: any };
	subject: { hash: any };
}
// @internal
export interface ChainDataT<T extends CertLike> {
	bag: T | { cert?: T };
	subject: { hash: any };
	children: Array<ChainDataT<T>>;
}

// @internal
export function makeChainList<T extends CertLike>(
	list: T[]
): Array<ChainDataT<T>>;
// @internal
export function makeChainList<T extends CertLike>(
	list: Array<{ cert?: T }>
): Array<ChainDataT<T>>;
// @internal
export function makeChainList<T extends CertLike>(
	list: Array<T | { cert?: T }>
): Array<ChainDataT<T>> {
	type TempChainData = Omit<ChainDataT<T>, 'bag'> & {
		bag?: T | { cert?: T };
		parent?: TempChainData;
	};
	const map = new Map<any, TempChainData>();

	list.forEach((d) => {
		let c;
		if ('cert' in d && d.cert) {
			c = d.cert;
		} else if ('issuer' in d) {
			c = d;
		} else {
			return;
		}
		let me = map.get(c.subject.hash);
		if (!me) {
			me = {
				bag: d,
				subject: c.subject,
				children: [],
			};
			map.set(me.subject.hash, me);
		} else {
			if (!me.bag) {
				me.bag = d;
			}
		}
		// 'me.bag' is defined here, so 'me' is ChainDataT<T>
		if (c.subject.hash !== c.issuer.hash) {
			let parent = map.get(c.issuer.hash);
			if (!parent) {
				parent = {
					subject: c.issuer,
					children: [me as ChainDataT<T>],
				};
				map.set(parent.subject.hash, parent);
			} else {
				parent.children.push(me as ChainDataT<T>);
			}
			me.parent = parent;
		}
	});
	const chainRoots: Array<ChainDataT<T>> = [];
	for (const temp of map.values()) {
		if (!temp.bag) {
			continue;
		}
		if (temp.parent) {
			if (temp.parent.bag) {
				delete temp.parent;
				continue;
			}
			delete temp.parent;
		}
		// 'temp.bag' is defined here
		chainRoots.push(temp as ChainDataT<T>);
	}

	return chainRoots;
}

// @internal
export function filterAndSortCertListByChain<T extends CertLike>(
	list: T[],
	certSelect: CertificateSelectMode
): T[];
// @internal
export function filterAndSortCertListByChain<
	TCert extends CertLike,
	T extends { cert?: TCert }
>(list: T[], certSelect: CertificateSelectMode): T[];
// @internal
export function filterAndSortCertListByChain<
	TCert extends CertLike,
	T extends { cert?: TCert }
>(list: Array<T | TCert>, certSelect: CertificateSelectMode): Array<T | TCert> {
	type TElem = T | TCert;
	const concatChainData = (prev: TElem[], d: ChainDataT<TCert>): TElem[] => {
		return prev
			.concat(d.bag as TElem)
			.concat(d.children.reduce(concatChainData, []));
	};
	// make list (each element is the list with elements whose root issuer is 'subject' of each ChainRoot item)
	let sortedCertLists = makeChainList(list as T[]).map((d) =>
		concatChainData([], d).reverse()
	);
	switch (certSelect) {
		case CertificateSelectMode.NoRoot:
			// remove 'Root' element for each list
			sortedCertLists = sortedCertLists.map((a) => {
				return a.filter((elem) => {
					return 'cert' in elem
						? elem.cert!.subject.hash !== elem.cert!.issuer.hash
						: (elem as TCert).subject.hash !==
								(elem as TCert).issuer.hash;
				});
			});
			break;
		case CertificateSelectMode.All:
			break;
		case CertificateSelectMode.Leaf:
		default:
			// pick first element for each list
			sortedCertLists = sortedCertLists.map((a) => a.slice(0, 1));
			break;
	}
	return sortedCertLists.reduce((prev, list) => prev.concat(list), []);
}

function splitCertsFromPem(pemData: string) {
	const ret: string[] = [];
	let inSection = false;
	let tempText = '';
	pemData.split(/\r\n|\n/g).forEach((line) => {
		if (/^-----BEGIN CERTIFICATE-----$/.test(line)) {
			inSection = true;
			tempText = line + '\n';
		} else if (/^-----END CERTIFICATE-----$/.test(line)) {
			if (inSection) {
				inSection = false;
				ret.push(tempText + line + '\n');
			}
		} else {
			if (inSection) {
				tempText += line + '\n';
			}
		}
	});
	return ret;
}

/** Pick certificates from PEM and converts to DER binaries */
export function getCertificatesFromPem(
	pemData: string,
	certSelect: CertificateSelectMode
): ArrayBufferView[] {
	const pems = splitCertsFromPem(pemData);
	if (pems.length === 0) {
		throw new Error('No certificates in PEM data');
	}
	const sortedList = filterAndSortCertListByChain(
		pems.map((onePemData) => {
			return forge.pki.certificateFromPem(onePemData);
		}),
		certSelect
	);
	return sortedList.map((cert) => {
		const asn1 = forge.pki.certificateToAsn1(cert);
		return Buffer.from(forge.asn1.toDer(asn1).getBytes(), 'binary');
	});
}

/** Verify `bin` has valid certificate data which is supported */
export function verifyDERCertificates(
	bin: Buffer,
	certSelect: CertificateSelectMode
): Buffer {
	const asn1 = forge.asn1.fromDer(
		forge.util.createBuffer(bin.toString('binary'))
	);
	// try to read as simple certificate data (.cer)
	try {
		forge.pki.certificateFromAsn1(asn1);
		// if no error has occurred, it is valid cer data
		// (since 'bin' has only one certificate, 'certSelect' is not used here)
		return bin;
	} catch {}
	// try to read as pkcs7 message data (.p7b)
	try {
		// (unfortunately messageFromAsn1 is not defined now)
		const signedData: any = (forge.pkcs7 as any).messageFromAsn1(asn1);
		if (!('certificates' in signedData)) {
			throw new Error();
		}
		const certificates: forge.pki.Certificate[] = signedData.certificates;
		// if no error has occurred, it is valid p7b data
		let asn1Cert: forge.asn1.Asn1;
		switch (certSelect) {
			case CertificateSelectMode.NoRoot:
				signedData.certificates = certificates.filter((cert) => {
					return cert.issuer.hash !== cert.subject.hash;
				});
				asn1Cert = signedData.toAsn1();
				break;
			case CertificateSelectMode.All:
				asn1Cert = asn1;
				break;
			case CertificateSelectMode.Leaf:
			default:
				asn1Cert = forge.pki.certificateToAsn1(certificates[0]);
				break;
		}
		return Buffer.from(forge.asn1.toDer(asn1Cert).getBytes(), 'binary');
	} catch {
		throw new Error('Not supported certificate data');
	}
}

/**
 * Pick algorithm type from PrivateKeyInfo data (base64-encoded)
 * @return true if RSA, false if DSA, or null if unknown
 */
function getPrivateKeyAlgorithmTypeFromBase64(data: string) {
	const bin = Buffer.from(data, 'base64');
	const asn1 = forge.asn1.fromDer(
		forge.util.createBuffer(bin.toString('binary'))
	);
	// --- refs. https://tools.ietf.org/html/rfc5958
	// OneAsymmetricKey ::= SEQUENCE {
	//   version                   Version,
	//   privateKeyAlgorithm       PrivateKeyAlgorithmIdentifier,
	//   privateKey                PrivateKey,
	//   attributes            [0] Attributes OPTIONAL,
	//   ...,
	//   [[2: publicKey        [1] PublicKey OPTIONAL ]],
	//   ...
	// }
	// PrivateKeyInfo ::= OneAsymmetricKey
	if (asn1.type !== forge.asn1.Type.SEQUENCE || asn1.value.length !== 3) {
		return null;
	}
	const privateKeyAlgorithm = (asn1.value as forge.asn1.Asn1[])[1];
	// PrivateKeyAlgorithmIdentifier ::= AlgorithmIdentifier
	//   { PUBLIC-KEY, { PrivateKeyAlgorithms } }
	// --- refs. https://tools.ietf.org/html/rfc5912
	// PUBLIC-KEY ::= CLASS {
	//   &id             OBJECT IDENTIFIER UNIQUE,
	//   &Params         OPTIONAL,
	//   &paramPresence  ParamOptions DEFAULT absent,
	//   ...
	// } WITH SYNTAX {
	//   IDENTIFIER &id
	//   [PARAMS [TYPE &Params] ARE &paramPresence]
	//   ...
	// }
	// AlgorithmIdentifier{ALGORITHM-TYPE, ALGORITHM-TYPE:AlgorithmSet} ::= SEQUENCE {
	//   algorithm   ALGORITHM-TYPE.&id({AlgorithmSet}),
	//   parameters  ALGORITHM-TYPE.&Params({AlgorithmSet}{@algorithm}) OPTIONAL
	// }
	if (
		privateKeyAlgorithm.type !== forge.asn1.Type.SEQUENCE ||
		privateKeyAlgorithm.value.length !== 2
	) {
		return null;
	}
	const algorithm = (privateKeyAlgorithm.value as forge.asn1.Asn1[])[0];
	if (algorithm.type !== forge.asn1.Type.OID) {
		return null;
	}
	const oid = forge.asn1.derToOid(
		forge.util.createBuffer(algorithm.value as string)
	);
	if (oid === '1.2.840.113549.1.1.1') {
		// 1.2.840.113549.1.1.1 : rsaEncryption
		return true;
	} else if (oid === '1.2.840.10040.4.1') {
		// 1.2.840.10040.4.1 : id-dsa
		return false;
	}
	return null;
}

/** @return array of tuple `[<isRSA>, <pem>]` */
export function pickPrivateKeyFromPem(
	pemData: string
): Array<[isRSA: boolean, pem: string]> {
	const ret: Array<[boolean, string]> = [];
	let inSection = false;
	let isRSA: boolean | null = null;
	let tempText = '';
	let tempTextHeader = '';
	pemData.split(/\r\n|\n/g).forEach((line) => {
		if (/^-----BEGIN RSA PRIVATE KEY-----$/.test(line)) {
			if (!inSection) {
				inSection = true;
				isRSA = true;
				tempText = line + '\n';
			}
		} else if (/^-----END RSA PRIVATE KEY-----$/.test(line)) {
			if (inSection) {
				inSection = false;
				if (isRSA) {
					ret.push([true, tempText + line + '\n']);
				}
			}
		} else if (/^-----BEGIN DSA PRIVATE KEY-----$/.test(line)) {
			if (!inSection) {
				inSection = true;
				isRSA = false;
				tempText = line + '\n';
			}
		} else if (/^-----END DSA PRIVATE KEY-----$/.test(line)) {
			if (inSection) {
				inSection = false;
				if (isRSA === false) {
					ret.push([false, tempText + line + '\n']);
				}
			}
		} else if (/^-----BEGIN PRIVATE KEY-----$/.test(line)) {
			if (!inSection) {
				inSection = true;
				isRSA = null;
				tempTextHeader = line;
				tempText = '';
			}
		} else if (/^-----END PRIVATE KEY-----$/.test(line)) {
			if (inSection) {
				inSection = false;
				if (isRSA === null) {
					// the data is PrivateKeyInfo, so detect the algorithm type
					isRSA = getPrivateKeyAlgorithmTypeFromBase64(tempText);
					if (isRSA !== null) {
						ret.push([
							isRSA,
							tempTextHeader + '\n' + tempText + line + '\n',
						]);
					}
				}
			}
		} else {
			if (inSection) {
				tempText += line + '\n';
			}
		}
	});
	return ret;
}

/** Pick private key and certificates from P12 binary */
export function pickKeysFromP12File(
	p12Bin: Buffer,
	certSelect: CertificateSelectMode,
	password?: string
): CertAndKeyData {
	const asn1 = forge.asn1.fromDer(
		forge.util.createBuffer(p12Bin.toString('binary'))
	);
	const p12 = forge.pkcs12.pkcs12FromAsn1(asn1, password);

	const pkeyBag = p12.getBags({
		bagType: forge.pki.oids.pkcs8ShroudedKeyBag,
	});
	const pkeyData = pkeyBag[forge.pki.oids.pkcs8ShroudedKeyBag]?.[0];
	if (!pkeyData || !pkeyData.key) {
		throw new Error('No private key is found for p12 data');
	}
	const privatePem = forge.pki
		.privateKeyToPem(pkeyData.key)
		.replace(/\r\n/g, '\n');

	const certBag = p12.getBags({ bagType: forge.pki.oids.certBag });
	const certList = certBag[forge.pki.oids.certBag];
	const certsResult: ArrayBufferView[] = [];
	if (certList) {
		const sortedCertList: forge.pkcs12.Bag[] = filterAndSortCertListByChain(
			certList,
			certSelect
		);
		sortedCertList.forEach((certData) => {
			let asn1;
			if (certData.cert) {
				asn1 = forge.pki.certificateToAsn1(certData.cert) as
					| forge.asn1.Asn1
					| undefined;
			} else {
				asn1 = certData.asn1 as forge.asn1.Asn1 | undefined;
			}
			if (asn1) {
				const certBin = forge.asn1.toDer(asn1);
				certsResult.push(Buffer.from(certBin.getBytes(), 'binary'));
			}
		});
	}
	if (certsResult.length === 0) {
		throw new Error('No certificates are found for p12 data.');
	}

	return {
		certs: certsResult,
		privatePem,
		// currently only RSA private key is supported
		isRSA: true,
		password,
	};
}
