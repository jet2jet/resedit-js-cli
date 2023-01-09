import { cosmiconfig } from 'cosmiconfig';
import * as PE from 'pe-library';
import * as ResEdit from 'resedit';

import Options from './Options';
import { readFile, writeFile } from './fs';
import * as log from './log';

import {
	IconDefinition,
	CertificateSelectMode,
	certificateSelectModeValues,
} from './definitions/DefinitionData';
import parseDefinitionData, {
	ParsedDefinitionData,
} from './definitions/parser';
import { ParsedVersionDefinition } from './definitions/parser/version';
import { ParsedRawResourceDefinition } from './definitions/parser/rawResource';
import {
	ParsedSignDefinitionWithP12File,
	ParsedSignDefinitionWithPemFile,
	isValidDigestAlgorithm,
} from './definitions/parser/sign';

import emitIcons from './emit/icons';
import emitRawResources from './emit/raw';
import emitVersion from './emit/version';

import { doSign, prepare } from './signing';

type ParsedSignDefinitionWithP12FileAndPartialPemFile =
	ParsedSignDefinitionWithP12File & Partial<ParsedSignDefinitionWithPemFile>;
type ParsedSignDefinitionWithPemFileAndPartialP12File =
	ParsedSignDefinitionWithPemFile & Partial<ParsedSignDefinitionWithP12File>;

function convertOptionsToDefinitionData(
	outDefinition: ParsedDefinitionData,
	options: Options
) {
	const lang = options.lang;
	if (typeof lang !== 'undefined') {
		outDefinition.lang = lang;
		const strings = outDefinition.version?.strings;
		if (strings) {
			const sameLangData = strings.filter((s) => s.lang === lang).shift();
			const undefLangData = strings
				.filter((s) => typeof s.lang === 'undefined')
				.shift();
			if (undefLangData) {
				// if 'sameLangData' is already available, merge to 'undefLangData'
				// (overwrite values to 'undefLangData' and delete 'sameLangData')
				if (sameLangData) {
					log.info(
						`Merging version string values for default language into '${lang}' language.`
					);
					Object.keys(sameLangData.values).forEach((k) => {
						undefLangData.values[k] = sameLangData.values[k];
					});
					outDefinition.version!.strings = strings.filter(
						(s) => s.lang !== lang
					);
				} else {
					log.debug(
						`Update lang value to '${lang}' for version string values without language.`
					);
				}
				undefLangData.lang = lang;
			}
		}
	}

	if (options.icon && options.icon.length > 0) {
		if (outDefinition.icons && outDefinition.icons.length > 0) {
			log.info(
				`Replace icon definitions with ones from option. (count = ${options.icon.length})`
			);
		} else {
			log.debug(
				`Add icon definitions from option. (count = ${options.icon.length})`
			);
		}
		outDefinition.icons = options.icon.map((value): IconDefinition => {
			const ra = /^([^,]+),(.*)$/.exec(value);
			if (ra) {
				const iconId = convertIntegerOrStringValue(ra[1]);
				return {
					id: iconId,
					sourceFile: ra[2].trim(),
				};
			} else {
				return {
					sourceFile: value,
				};
			}
		});
	}

	if (typeof options['product-name'] !== 'undefined') {
		const o = getVersionStringData(getVersionObject()).values;
		log.debug(`Set 'ProductName' to '${options['product-name']}'.`);
		o.ProductName = options['product-name'];
	}
	if (typeof options['product-version'] !== 'undefined') {
		const s = options['product-version'];
		const v = validateAndConvertVersionString(s, 'product-version');
		const base = getVersionObject();
		const fixed = base.fixedInfo;
		const stringValues = getVersionStringData(base).values;
		log.debug(
			`Set 'ProductVersion' to '${s}', as well as 'ProductVersionXX' to '${v[0]}.${v[1]}.${v[2]}.${v[3]}'.`
		);
		stringValues.ProductVersion = s;
		fixed.productVersionMS = ((v[0] & 0xffff) << 16) | (v[1] & 0xffff);
		fixed.productVersionLS = ((v[2] & 0xffff) << 16) | (v[3] & 0xffff);
	}
	if (typeof options['file-description'] !== 'undefined') {
		const o = getVersionStringData(getVersionObject()).values;
		log.debug(`Set 'FileDescription' to '${options['file-description']}'.`);
		o.FileDescription = options['file-description'];
	}
	if (typeof options['file-version'] !== 'undefined') {
		const s = options['file-version'];
		const v = validateAndConvertVersionString(s, 'file-version');
		const base = getVersionObject();
		const fixed = base.fixedInfo;
		const stringValues = getVersionStringData(base).values;
		log.debug(
			`Set 'FileVersion' to '${s}', as well as 'FileVersionXX' to '${v[0]}.${v[1]}.${v[2]}.${v[3]}'.`
		);
		stringValues.FileVersion = s;
		fixed.fileVersionMS = ((v[0] & 0xffff) << 16) | (v[1] & 0xffff);
		fixed.fileVersionLS = ((v[2] & 0xffff) << 16) | (v[3] & 0xffff);
	}
	if (typeof options['company-name'] !== 'undefined') {
		const o = getVersionStringData(getVersionObject()).values;
		log.debug(`Set 'CompanyName' to '${options['company-name']}'.`);
		o.CompanyName = options['company-name'];
	}
	if (typeof options['original-filename'] !== 'undefined') {
		const o = getVersionStringData(getVersionObject()).values;
		log.debug(
			`Set 'OriginalFilename' to '${options['original-filename']}'.`
		);
		o.OriginalFilename = options['original-filename'];
	}
	if (typeof options['internal-name'] !== 'undefined') {
		const o = getVersionStringData(getVersionObject()).values;
		log.debug(`Set 'InternalName' to '${options['internal-name']}'.`);
		o.InternalName = options['internal-name'];
	}

	if (options.raw && options.raw.length > 0) {
		if (outDefinition.raw && outDefinition.raw.length > 0) {
			log.debug(
				`Append raw resource definitions with ones from option. (count = ${options.raw.length})`
			);
		} else {
			log.debug(
				`Add raw resource definitions from option. (count = ${options.raw.length})`
			);
		}
		outDefinition.raw = (outDefinition.raw ?? []).concat(
			options.raw.map((value, i): ParsedRawResourceDefinition => {
				const ra = /^([^,]+?),([^,]+?),(.+)$/.exec(value);
				if (!ra) {
					throw new Error(
						`Invalid '--raw' option value (index: ${i}, expected: <type>,<ID>,<data>, actual: ${value})`
					);
				}
				const type = convertIntegerOrStringValue(ra[1]);
				const id = convertIntegerOrStringValue(ra[2]);
				if (ra[3][0] === '@') {
					return {
						type,
						id,
						file: ra[3].substring(1),
					};
				} else {
					return {
						type,
						id,
						value: ra[3],
					};
				}
			})
		);
	}

	if ((options.sign !== undefined && options.sign) || outDefinition.sign) {
		log.debug('Make executable with signing.');
		if (
			!outDefinition.sign &&
			typeof options.p12 === 'undefined' &&
			typeof options.certificate === 'undefined' &&
			typeof options['private-key'] === 'undefined'
		) {
			throw new Error(
				"'--p12' or ('--certificate' and '--private-key') is missing."
			);
		} else if (typeof options.p12 !== 'undefined') {
			if (
				typeof options.certificate !== 'undefined' ||
				typeof options['private-key'] !== 'undefined'
			) {
				throw new Error(
					"Only either '--p12' or ('--certificate' and '--private-key') can be specified."
				);
			}
			if (outDefinition.sign) {
				log.info(`Overwrite signing info in definition data.`);
			}
			storeSignObjectWithP12(options.p12);
			log.debug(`Set signing info with p12 file '${options.p12}'.`);
		} else if (
			typeof options.certificate !== 'undefined' ||
			typeof options['private-key'] !== 'undefined'
		) {
			if (typeof options.certificate === 'undefined') {
				throw new Error("'--certificate' is missing.");
			} else if (typeof options['private-key'] === 'undefined') {
				throw new Error("'--private-key' is missing.");
			}
			if (outDefinition.sign) {
				log.info(`Overwrite signing info in definition data.`);
			}
			storeSignObjectWithPKey(
				options.certificate,
				options['private-key']
			);
			log.debug(
				`Set signing info with certificate file '${options.certificate}' and private key file '${options['private-key']}'.`
			);
		}
		if (
			options.select !== undefined &&
			certificateSelectModeValues.includes(options.select) &&
			outDefinition.sign
		) {
			outDefinition.sign.certSelect = options.select;
			log.debug(`Set certificate selection mode to '${options.select}'.`);
		}
		if (typeof options.password !== 'undefined' && outDefinition.sign) {
			outDefinition.sign.password = options.password;
			log.debug(`Set password for private key.`);
		}
		if (isValidDigestAlgorithm(options.digest) && outDefinition.sign) {
			outDefinition.sign.digestAlgorithm = options.digest;
			log.debug(`Set digest algorithm to '${options.digest}'.`);
		}
		if (typeof options.timestamp !== 'undefined' && outDefinition.sign) {
			outDefinition.sign.timestampServer = options.timestamp;
			log.debug(`Use timestamp server '${options.timestamp}'.`);
		}
	} else {
		throwIfSigningOptionSpecified(options, 'p12');
		throwIfSigningOptionSpecified(options, 'private-key');
		throwIfSigningOptionSpecified(options, 'certificate');
		throwIfSigningOptionSpecified(options, 'password');
		throwIfSigningOptionSpecified(options, 'digest');
		throwIfSigningOptionSpecified(options, 'timestamp');
	}

	function convertIntegerOrStringValue(value: string): string | number {
		if (/^(?:0|[1-9][0-9]*)$/.test(value) && !isNaN(Number(value))) {
			return Number(value);
		} else {
			return value;
		}
	}
	function validateAndConvertVersionString(ver: string, propName: string) {
		const ra = /^([0-9]+)\.([0-9]+)\.([0-9]+)\.([0-9]+)$/.exec(ver);
		if (!ra) {
			throw new Error(
				`Invalid version string format: ${ver} (parsing option '--${propName}')`
			);
		}
		return [
			Number(ra[1]) & 0xffff,
			Number(ra[2]) & 0xffff,
			Number(ra[3]) & 0xffff,
			Number(ra[4]) & 0xffff,
		];
	}
	function getVersionObject() {
		return (
			outDefinition.version ??
			(outDefinition.version = {
				fixedInfo: {},
				strings: [],
			})
		);
	}
	function getVersionStringData(o: ParsedVersionDefinition) {
		let s = o.strings.filter((s) => s.lang === lang).shift();
		if (!s) {
			s = { lang, values: {} };
			o.strings.push(s);
		}
		return s;
	}
	function storeSignObjectWithP12(p12File: string) {
		if (outDefinition.sign) {
			(outDefinition.sign as ParsedSignDefinitionWithP12File).p12File =
				p12File;
			delete (
				outDefinition.sign as ParsedSignDefinitionWithP12FileAndPartialPemFile
			).certificateFile;
			delete (
				outDefinition.sign as ParsedSignDefinitionWithP12FileAndPartialPemFile
			).privateKeyFile;
		} else {
			outDefinition.sign = {
				p12File,
				certSelect: CertificateSelectMode.Leaf,
				password: undefined,
				digestAlgorithm: 'sha256',
				timestampServer: undefined,
			};
		}
		return outDefinition.sign;
	}
	function storeSignObjectWithPKey(
		certificateFile: string,
		privateKeyFile: string
	) {
		if (outDefinition.sign) {
			(
				outDefinition.sign as ParsedSignDefinitionWithPemFile
			).certificateFile = certificateFile;
			(
				outDefinition.sign as ParsedSignDefinitionWithPemFile
			).privateKeyFile = privateKeyFile;
			delete (
				outDefinition.sign as ParsedSignDefinitionWithPemFileAndPartialP12File
			).p12File;
		} else {
			outDefinition.sign = {
				certificateFile,
				privateKeyFile,
				certSelect: CertificateSelectMode.Leaf,
				password: undefined,
				digestAlgorithm: 'sha256',
				timestampServer: undefined,
			};
		}
		return outDefinition.sign;
	}
	function throwIfSigningOptionSpecified(
		options: Options,
		field: keyof Options
	) {
		if (typeof options[field] !== 'undefined') {
			throw new Error(
				`'--sign' option must be true when '--${field}' is specified.`
			);
		}
	}
}

async function emitResources(
	isExe: boolean,
	res: PE.NtExecutableResource,
	defData: ParsedDefinitionData
) {
	const lang = typeof defData.lang !== 'undefined' ? defData.lang : 1033;
	let modified = false;

	modified = (await emitIcons(res, lang, defData.icons)) || modified;
	modified =
		(await emitVersion(res, lang, isExe, defData.version)) || modified;
	modified = (await emitRawResources(res, lang, defData.raw)) || modified;

	return modified;
}

export default async function run(options: Options): Promise<void> {
	let convertedDefData: ParsedDefinitionData = {};

	log.debug('noGrow: ', !!options.noGrow);
	log.debug('allowShrink: ', !!options.allowShrink);

	if (options.definition !== undefined) {
		if (typeof options.definition === 'string') {
			const explorer = cosmiconfig('resedit');
			log.info(
				`Load definition data structure from '${options.definition}'.`
			);
			const ret = await explorer.load(options.definition);
			if (!ret || ret.isEmpty) {
				throw new Error();
			}
			log.info(`Check definition data structure.`);
			convertedDefData = parseDefinitionData(ret.config);
		} else {
			log.info(
				`Check definition data structure in the 'options' object.`
			);
			convertedDefData = parseDefinitionData(options.definition);
		}
	}

	log.debug('Merge definition data with options (if specified).');
	convertOptionsToDefinitionData(convertedDefData, options);

	let executable;
	if (options.in === undefined) {
		log.info(
			`Create an empty executable binary (32-bit: ${
				options.as32bit ? 'true' : 'false'
			}, as EXE: ${options.asExeFile ? 'true' : 'false'}).`
		);
		executable = PE.NtExecutable.createEmpty(
			options.as32bit,
			options.asExeFile !== undefined ? !options.asExeFile : true
		);
	} else {
		log.info(`Load the executable file from '${options.in}'.`);
		const inFile = await readFile(options.in);
		log.debug(
			`Parse the executable file '${options.in}' (ignore-signed: ${
				options['ignore-signed'] ?? false ? 'true' : 'false'
			}).`
		);
		executable = PE.NtExecutable.from(inFile, {
			ignoreCert: options['ignore-signed'],
		});
	}
	const res = PE.NtExecutableResource.from(executable);
	const hasResOnBase = res.entries.length > 0;
	log.debug(
		`The input executable file has ${hasResOnBase ? '' : 'no '}resource(s).`
	);

	const isExe =
		options.in !== undefined
			? /\.(?:exe|com)$/i.test(options.in)
			: options.asExeFile !== undefined
			? options.asExeFile
			: false;
	const modified = await emitResources(isExe, res, convertedDefData);

	if (modified) {
		log.info(
			'Resources has been created. Apply resources to the new executable.'
		);
		if (res.entries.length > 0 || (!options.allowShrink && hasResOnBase)) {
			res.outputResource(executable, options.noGrow, options.allowShrink);
		} else if (hasResOnBase) {
			// remove resource entry
			executable.setSectionByEntry(
				ResEdit.Format.ImageDirectoryEntry.Resource,
				null
			);
		}
	}

	let newBin: ArrayBuffer;
	if (convertedDefData.sign) {
		const signData = convertedDefData.sign;
		log.debug(`Prepare signing information.`);
		const certAndKeyData = await prepare(signData);
		log.info('Sign the executable.');
		newBin = await doSign(
			executable,
			certAndKeyData,
			signData.digestAlgorithm,
			signData.timestampServer
		);
	} else {
		log.debug(`Generate executable binary.`);
		newBin = executable.generate();
	}
	log.info(`Write executable binary to '${options.out}'.`);
	await writeFile(options.out, Buffer.from(newBin));
	log.info('Done.');
}
