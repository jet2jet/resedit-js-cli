import * as ResEdit from 'resedit';

import { validateIntegerValue, validateStringValue } from './utils';

export interface ParsedVersionStrings {
	// if not specified root language is used
	lang?: number;
	values: Record<string, string>;
}

export interface ParsedVersionDefinition {
	fixedInfo: Partial<ResEdit.Resource.VersionFixedInfo>;
	strings: ParsedVersionStrings[];
}

////////////////////////////////////////////////////////////////////////////////

// (NOTE: all key names must be lower case)
const standardVersionStringKeys: Record<string, string> = {
	comments: 'Comments',
	companyname: 'CompanyName',
	filedescription: 'FileDescription',
	fileversion: 'FileVersion',
	internalname: 'InternalName',
	legalcopyright: 'LegalCopyright',
	legaltrademarks: 'LegalTrademarks',
	originalfilename: 'OriginalFilename',
	privatebuild: 'PrivateBuild',
	productname: 'ProductName',
	productversion: 'ProductVersion',
	specialbuild: 'SpecialBuild',
};

function getPreferredPropNamesForVersion(
	// eslint-disable-next-line @typescript-eslint/ban-types
	data: object,
	pickExtraValuesFirst: boolean
): string[] {
	const isEqualNameWithFirstCharCaseIgnored = (a: string, b: string) => {
		return (
			a.replace(/^([A-Z])/, (_, c: string) => c.toLowerCase()) ===
			b.replace(/^([A-Z])/, (_, c: string) => c.toLowerCase())
		);
	};
	return Object.keys(data)
		.sort((a, b) => {
			if (a === b) {
				return 0;
			}
			if (pickExtraValuesFirst) {
				if (a === 'extraValues') {
					return -1;
				} else if (b === 'extraValues') {
					return 1;
				}
			}
			if (isEqualNameWithFirstCharCaseIgnored(a, b)) {
				// camelCase name is followed by PascalCase name
				return /^a-z/.test(a) ? -1 : 1;
			}
			return a.localeCompare(b);
		})
		.reduce<string[]>((prev, cur) => {
			if (
				prev.length === 0 ||
				!isEqualNameWithFirstCharCaseIgnored(prev[prev.length - 1], cur)
			) {
				prev.push(cur);
			}
			return prev;
		}, []);
}

function parseVersionBase(
	data: unknown,
	propName: string,
	outUnknownPropNames: string[]
): Record<string, string> {
	if (typeof data !== 'object' || !data) {
		throw new Error(`Invalid data: '${propName}' is not an object`);
	}
	const ret: Record<string, string> = {};

	// check properties
	getPreferredPropNamesForVersion(data, true).forEach((key) => {
		const lowerCaseName = key.toLowerCase();
		if (
			Object.prototype.hasOwnProperty.call(
				standardVersionStringKeys,
				lowerCaseName
			)
		) {
			const actualName = standardVersionStringKeys[lowerCaseName];
			const value = (data as Record<string, unknown>)[key];
			validateStringValue(value, `${propName}.${key}`);
			ret[actualName] = value;
		} else if (key === 'extraValues') {
			const value = (data as Record<string, unknown>)[key];
			if (typeof value !== 'object' || !value) {
				throw new Error(
					`Invalid data: '${propName}.extraValues' is not an object`
				);
			}
			// validate if each values are string and add to 'ret'
			getPreferredPropNamesForVersion(value, false).forEach((k) => {
				const v = (value as any)[k];
				validateStringValue(v, `${propName}.extraValues,${k}`);
				ret[k] = v;
			});
		} else {
			outUnknownPropNames.push(key);
		}
	});

	return ret;
}

// @internal export for test only
export function parseVersionTranslation(
	data: unknown,
	propName: string
): ParsedVersionStrings {
	const props: string[] = [];
	const versionStringData = parseVersionBase(data, propName, props);
	let lang: number = 0;
	if (!props.includes('lang')) {
		throw new Error(`Invalid data: '${propName}.lang' is missing`);
	}
	props.forEach((prop) => {
		if (prop === 'lang') {
			const v = (data as any)[prop];
			validateIntegerValue(v, `${propName}.lang`);
			lang = v;
		} else {
			throw new Error(
				`Invalid data: unknown property '${prop}' on '${propName}`
			);
		}
	});
	return {
		lang,
		values: versionStringData,
	};
}

export default function parseVersion(data: unknown): ParsedVersionDefinition {
	if (typeof data !== 'object' || !data) {
		throw new Error("Invalid data: 'version' is not an object");
	}
	const ret: ParsedVersionDefinition = {
		fixedInfo: {},
		strings: [],
	};
	const props: string[] = [];
	const thisVersionStrings: ParsedVersionStrings = {
		values: parseVersionBase(data, 'version', props),
	};
	const translations: ParsedVersionStrings[] = [];
	ret.strings.push(thisVersionStrings);
	// check other properties
	props.forEach((key) => {
		const adjustedKey = key.replace(/^([A-Z])/, (_, c: string) =>
			c.toLowerCase()
		);
		const value = (data as any)[key];
		switch (adjustedKey) {
			// from VersionFixedInfo
			// (the name which begins with capital character is allowed)
			case 'fileVersionMS':
			case 'fileVersionLS':
			case 'productVersionMS':
			case 'productVersionLS':
			case 'fileFlagsMask':
			case 'fileFlags':
			case 'fileOS':
			case 'fileType':
			case 'fileSubtype':
			case 'fileDateMS':
			case 'fileDateLS':
				validateIntegerValue(value, `version.${key}`);
				ret.fixedInfo[adjustedKey] = value;
				break;
			default:
				// original props
				switch (key) {
					case 'lang':
						validateIntegerValue(value, `version.lang`);
						thisVersionStrings.lang = value;
						break;
					case 'translations':
						if (!Array.isArray(value)) {
							throw new Error(
								`Invalid data: 'version.translations' is not an array`
							);
						}
						if (value.length === 0) {
							throw new Error(
								`Invalid data: 'version.translations' is empty`
							);
						}
						value.forEach((item, i) => {
							const t = parseVersionTranslation(
								item,
								`version.translations[${i}]`
							);
							// an item with same 'lang' will be overwritten
							let found = false;
							translations.forEach((item, i) => {
								if (found) {
									return;
								}
								if (item.lang === t.lang) {
									translations[i] = t;
									found = true;
								}
							});
							if (!found) {
								translations.push(t);
							}
						});
						break;
					default:
						throw new Error(
							`Invalid data: unknown property '${key}' on 'version`
						);
				}
				break;
		}
	});
	translations.forEach((t) => {
		if (t.lang === thisVersionStrings.lang) {
			// merge translation data (values) with same 'lang' for 'thisVersionStrings' into 'thisVersionStrings.values'
			thisVersionStrings.values = Object.assign(
				{},
				thisVersionStrings.values,
				t.values
			);
		} else {
			// simply push as an individual translation data
			ret.strings.push(t);
		}
	});

	if (
		!('fileVersionLS' in ret.fixedInfo) &&
		!('fileVersionMS' in ret.fixedInfo) &&
		'FileVersion' in thisVersionStrings.values
	) {
		const val = thisVersionStrings.values.FileVersion;
		const ra = /^([0-9]+)\.([0-9]+)\.([0-9]+)\.([0-9]+)$/.exec(val);
		if (ra) {
			ret.fixedInfo.fileVersionMS =
				((Number(ra[1]) & 0xffff) << 16) | (Number(ra[2]) & 0xffff);
			ret.fixedInfo.fileVersionLS =
				((Number(ra[3]) & 0xffff) << 16) | (Number(ra[4]) & 0xffff);
		}
	}
	if (
		!('productVersionLS' in ret.fixedInfo) &&
		!('productVersionMS' in ret.fixedInfo) &&
		'ProductVersion' in thisVersionStrings.values
	) {
		const val = thisVersionStrings.values.ProductVersion;
		const ra = /^([0-9]+)\.([0-9]+)\.([0-9]+)\.([0-9]+)$/.exec(val);
		if (ra) {
			ret.fixedInfo.productVersionMS =
				((Number(ra[1]) & 0xffff) << 16) | (Number(ra[2]) & 0xffff);
			ret.fixedInfo.productVersionLS =
				((Number(ra[3]) & 0xffff) << 16) | (Number(ra[4]) & 0xffff);
		}
	}
	return ret;
}
