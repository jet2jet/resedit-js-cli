import type * as ResEdit from 'resedit';

/** Icon definition object which represents individual icon resource (RT_ICON_GROUP) data */
export interface IconDefinition {
	/**
	 * ID for icon resource data.
	 * If omitted, the lowest numeric value (from 1), which is not used, is applied.
	 * If the icon with same ID already exists, it will be replaced.
	 */
	id?: string | number;
	/** (Required) Icon file name which contains icon data to add as an icon resource. */
	sourceFile: string;
	/** The language value (LANGID) for this icon data. If omitted, the value in `DefinitionData` is used. */
	lang?: number;
}

/**
 * The base object of version definitions.
 * All property names except for `extraValues` are case-insensitive, but
 * if other properties are stored, the error will be reported.
 *
 * @note
 * In Windows the key name of String data in the version resource is case-insensitive,
 * so the following rules are applied to this program:
 *
 * - When storing values to the version resource, the properties are
 *   sorted by name using `String.prototype.localeCompare` and
 *   their values are stored in order.
 *   - e.g. if `FileDescription` is followed by `fileDescription`,
 *     the value of `FileDescription` will be overwritten by the value of `fileDescription`.
 * - The properties in `extraValues` are always followed by the properties in
 *   `VersionDefinitionBase` itself.
 *   - e.g. if `FileDescription` is in the `VersionDefinitionBase` object and
 *     `fileDescription` is in `extraValues`, the former one is stored.)
 * - If the name is same as the property name of `VersionDefinitionBase`
 *   without regard to case, the name is converted to the standard one.
 *   - e.g. `fileDescription` will be stored as `FileDescription`.
 *   - This rule is not applied for properties in `extraValues`.
 *     (e.g. `fileDescription` in `extraValues` will be stored as `fileDescription`)
 */
export interface VersionDefinitionBase {
	/** 'Comments' string value */
	comments?: string;
	/** 'CompanyName' string value */
	companyName?: string;
	/** 'FileDescription' string value */
	fileDescription?: string;
	/** 'FileVersion' string value */
	fileVersion?: string;
	/** 'InternalName' string value */
	internalName?: string;
	/** 'LegalCopyright' string value */
	legalCopyright?: string;
	/** 'LegalTrademarks' string value */
	legalTrademarks?: string;
	/** 'OriginalFilename' string value */
	originalFileName?: string;
	/** 'PrivateBuild' string value */
	privateBuild?: string;
	/** 'ProductName' string value */
	productName?: string;
	/** 'ProductVersion' string value */
	productVersion?: string;
	/** 'SpecialBuild' string value */
	specialBuild?: string;
	/** Additional values */
	extraValues?: Record<string, string>;
}

/** The additional translation data definition of version resource data. */
export interface VersionDefinitionTranslation extends VersionDefinitionBase {
	/** The language value (LANGID) (required for VersionDefinitionTranslation) */
	lang: number;
}

/**
 * The root version definition object.
 *
 * @note
 * The propert name rules in `VersionDefinitionBase` are also applied to this object,
 * especially for properties not only from `VersionDefinitionBase` but also from `VersionFixedInfo`.
 */
export interface VersionDefinition
	extends VersionDefinitionBase,
		Partial<ResEdit.Resource.VersionFixedInfo> {
	/** The language value (LANGID). If omitted, the value in `DefinitionData` is used. */
	lang?: number;
	/** Additional translation data */
	translations?: VersionDefinitionTranslation[];
}

/** The predefined resource type name, converted to actual type numeric values. */
export const PredefinedResourceTypeName = {
	cursor: 1,
	bitmap: 2,
	icon: 3,
	menu: 4,
	dialog: 5,
	string: 6,
	fontdir: 7,
	fontDir: 7,
	font: 8,
	accelerator: 9,
	rcdata: 10,
	rcData: 10,
	messagetable: 11,
	messageTable: 11,
	groupcursor: 12,
	groupCursor: 12,
	groupicon: 14,
	groupIcon: 14,
	version: 16,
	dlginclude: 17,
	dlgInclude: 17,
	plugplay: 19,
	plugPlay: 19,
	vxd: 20,
	anicursor: 21,
	aniCursor: 21,
	aniicon: 22,
	aniIcon: 22,
	html: 23,
	manifest: 24,
} as const;
/** The predefined resource type name, converted to actual type numeric values. */
export type PredefinedResourceTypeName =
	(typeof PredefinedResourceTypeName)[keyof typeof PredefinedResourceTypeName];

/** The predefined resource type name, converted to actual type numeric values. */
export const PredefinedResourceTypeNameForDelete = {
	...PredefinedResourceTypeName,
	allcursor: -1,
	allCursor: -1,
	allicon: -2,
	allIcon: -2,
} as const;
/** The predefined resource type name, converted to actual type numeric values. */
export type PredefinedResourceTypeNameForDelete =
	(typeof PredefinedResourceTypeNameForDelete)[keyof typeof PredefinedResourceTypeNameForDelete];

/**
 * The raw resource data definition object.
 * If there is the resource data with the same values for each of `type`, `id`, and `lang`,
 * it will be replaced by `RawResourceData`'s data.
 *
 * @note
 * `value` is not cloned on parsing. The value of `value` must remain valid until finishing resource editing.
 */
export interface RawResourceDefinitionData {
	/** The resource type (string or integer) */
	type: string | number;
	/** The resource ID (string or integer) */
	id: string | number;
	/** The language value (LANGID). If omitted, the value in `DefinitionData` is used. */
	lang?: number;
	/**
	 * The file name which contains resource data to add.
	 * If `value` is also specified, this property (`file`) is ignored.
	 */
	file?: string;
	/**
	 * The resource data body. If `file` is also specified, `file` is ignored.
	 *
	 * - If the value is a string, it will be stored as UTF-8 string data.
	 * - If the value is not a string, it will be stored without any conversion.
	 */
	value?: string | ArrayBuffer | ArrayBufferView;
}

/**
 * The raw resource data definition object.
 * If there is the resource data with the same values for each of `type`, `id`, and `lang`,
 * it will be replaced by `RawResourceData`'s data.
 *
 * @note
 * `value` is not cloned on parsing. The value of `value` must remain valid until finishing resource editing.
 */
export interface RawResourceDefinitionData2 {
	/** The resource type */
	typeName: PredefinedResourceTypeName;
	/** The resource ID (string or integer) */
	id: string | number;
	/** The language value (LANGID). If omitted, the value in `DefinitionData` is used. */
	lang?: number;
	/**
	 * The file name which contains resource data to add.
	 * If `value` is also specified, this property (`file`) is ignored.
	 */
	file?: string;
	/**
	 * The resource data body. If `file` is also specified, `file` is ignored.
	 *
	 * - If the value is a string, it will be stored as UTF-8 string data.
	 * - If the value is not a string, it will be stored without any conversion.
	 */
	value?: string | ArrayBuffer | ArrayBufferView;
}

/**
 * The resource data definition object for deletion.
 * If there is the resource data with the same values for each of `type`, `id`, and `lang`,
 * it will be deleted.
 * If not, no operation will be performed unless `failIfNoDelete` is true.
 */
export interface DeleteResourceDefinitionData {
	/** The resource type (string or integer) */
	type: string | number;
	/** The resource ID (string or integer). If omitted, all resources matching the type (and `lang`) will be deleted. */
	id?: string | number;
	/** The language value (LANGID). Unlike `RawResourceDefinitionData`, if omitted, all resources matching the type (and `id`) will be deleted. */
	lang?: number;
	/** If true and the resource to be deleted does not exist, the operation will fail. */
	failIfNoDelete?: boolean;
}

/**
 * The resource data definition object for deletion.
 * If there is the resource data with the same values for each of `type`, `id`, and `lang`,
 * it will be deleted.
 * If not, no operation will be performed unless `failIfNoDelete` is true.
 */
export interface DeleteResourceDefinitionData2 {
	/** The resource type */
	typeName: PredefinedResourceTypeNameForDelete;
	/** The resource ID (string or integer). If omitted, all resources matching the type (and `lang`) will be deleted. */
	id?: string | number;
	/** The language value (LANGID). Unlike `RawResourceDefinitionData`, if omitted, all resources matching the type (and `id`) will be deleted. */
	lang?: number;
	/** If true and the resource to be deleted does not exist, the operation will fail. */
	failIfNoDelete?: boolean;
}

/** Digest algorithm type for signing process. The type value is case-sensitive. */
export type DigestAlgorithmType =
	| 'sha1'
	| 'sha224'
	| 'sha256'
	| 'sha384'
	| 'sha512'
	| 'sha512-224'
	| 'sha512-256'
	| 'sha3-224'
	| 'sha3-256'
	| 'sha3-384'
	| 'sha3-512'
	| 'shake128'
	| 'shake256';

/** The mode how certificates are stored into the signed information data. */
export const CertificateSelectMode = {
	/** Only picks the leaf certificate */
	Leaf: 'leaf',
	/** Picks certificates without root */
	NoRoot: 'no-root',
	/** Pick all certificates */
	All: 'all',
} as const;
/** The mode how certificates are stored into the signed information data. */
export type CertificateSelectMode =
	(typeof CertificateSelectMode)[keyof typeof CertificateSelectMode];
export const certificateSelectModeValues: string[] = Object.keys(
	CertificateSelectMode
).map((k) => CertificateSelectMode[k as keyof typeof CertificateSelectMode]);

/** The definition data for signing executables */
export interface SigningDefinitionData {
	/** PKCS 12 file (.p12 or .pfx file) which contains private key and certificates */
	p12File?: string;
	/** Private key file (only PEM format file (.pem) is supported) */
	privateKeyFile?: string;
	/** Certificate file (DER format file (.cer) or PEM format file (.pem) is supported) */
	certificateFile?: string;
	/** Certificate selection mode whether to pick certificates from the specified file (default: Leaf) */
	certSelect?: CertificateSelectMode;
	/**
	 * Password/passphrase for private key
	 *
	 * @note
	 * The meaning of 'empty password' and 'no password' is different.
	 *
	 * - If 'empty password' is required for the private key,
	 *   specify an empty string to `password`.
	 * - If 'no password' is required, omit `password` (or specify `undefined`).
	 */
	password?: string;
	/** Digest algorithm for signing (default: 'sha256') */
	digestAlgorithm?: DigestAlgorithmType;
	/**
	 * Timestamp server to set timestamp for signed data.
	 * If omitted, no timestamp is set.
	 */
	timestampServer?: string;
}

/** The root definition data */
export default interface DefinitionData {
	/** Resource language value (LANGID). If omitted, `1033` (en-US) is used. */
	lang?: number;
	/** The definition data array for icon resource data */
	icons?: IconDefinition[];
	/**
	 * The definition data array for version resource data.
	 *
	 * - If `version.fileVersion` is `'x.x.x.x'` and both `version.fileVersionMS` and
	 *   `version.fileVersionLS` are not defined, `fileVersionMS` and `fileVersionLS` will be
	 *   filled by parsed values of `fileVersion`.
	 * - If `version.productVersion` is `'x.x.x.x'` and both `version.productVersionMS` and
	 *   `version.productVersionLS` are not defined, `productVersionMS` and `productVersionLS` will be
	 *   filled by parsed values of `fileVersion`.
	 */
	version?: VersionDefinition;
	/**
	 * The definition data array for raw resource data.
	 * This field is useful to add resource data whose format is not supported by
	 * this program.
	 */
	raw?: Array<RawResourceDefinitionData | RawResourceDefinitionData2>;
	/**
	 * The definition data array for deleting resource data.
	 */
	delete?: Array<
		DeleteResourceDefinitionData | DeleteResourceDefinitionData2
	>;
	/** The definition data for signing output executable binary */
	sign?: SigningDefinitionData;
}
