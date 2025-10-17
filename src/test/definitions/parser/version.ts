import type * as ResEdit from 'resedit';
import type { VersionDefinition } from '@/definitions/DefinitionData.js';
import parseVersion, {
	parseVersionTranslation,
	type ParsedVersionDefinition,
	type ParsedVersionStrings,
} from '@/definitions/parser/version.js';

const ALL_FIXED_INFO_KEYS: Array<keyof ResEdit.Resource.VersionFixedInfo> = [
	'fileVersionMS',
	'fileVersionLS',
	'productVersionMS',
	'productVersionLS',
	'fileFlagsMask',
	'fileFlags',
	'fileOS',
	'fileType',
	'fileSubtype',
	'fileDateMS',
	'fileDateLS',
];

const ALL_STANDARD_STRING_KEYS = [
	'Comments',
	'CompanyName',
	'FileDescription',
	'FileVersion',
	'InternalName',
	'LegalCopyright',
	'LegalTrademarks',
	'OriginalFilename',
	'PrivateBuild',
	'ProductName',
	'ProductVersion',
	'SpecialBuild',
];

describe('definitions/parser/version', () => {
	describe('invalid data', () => {
		describe('for VersionDefinition', () => {
			it('should throw if not an object', () => {
				expect(() => {
					parseVersion(0);
				}).toThrow();
				expect(() => {
					parseVersion('');
				}).toThrow();
				expect(() => {
					parseVersion(null);
				}).toThrow();
			});
			it('should throw if an object has unknown property', () => {
				expect(() => {
					parseVersion({ dummy: 0 });
				}).toThrow();
				expect(() => {
					parseVersion({ fixedInfo: {} });
				}).toThrow();
				expect(() => {
					parseVersion({ strings: {} });
				}).toThrow();
			});
			it("should throw if 'lang' is not an integer", () => {
				expect(() => {
					parseVersion({ lang: '1041' });
				}).toThrow();
				expect(() => {
					parseVersion({ lang: true });
				}).toThrow();
				expect(() => {
					parseVersion({ lang: 0.25 });
				}).toThrow();
			});
			it.each(ALL_FIXED_INFO_KEYS)(
				"should throw if '%s' is not an integer",
				(field) => {
					expect(() => {
						parseVersion({ [field]: null });
					}).toThrow();
					expect(() => {
						parseVersion({ [field]: '0' });
					}).toThrow();
					expect(() => {
						parseVersion({ [field]: true });
					}).toThrow();
					expect(() => {
						parseVersion({ [field]: 0.25 });
					}).toThrow();
				}
			);
			it.each(ALL_STANDARD_STRING_KEYS)(
				"should throw if '%s' is not a string",
				(field) => {
					expect(() => {
						parseVersion({ [field]: null });
					}).toThrow();
					expect(() => {
						parseVersion({ [field]: 0 });
					}).toThrow();
					expect(() => {
						parseVersion({ [field]: true });
					}).toThrow();
				}
			);
			it("should throw if 'extraValues' itself is invalid", () => {
				expect(() => {
					parseVersion({ extraValues: 0 });
				}).toThrow();
				expect(() => {
					parseVersion({ extraValues: '' });
				}).toThrow();
				expect(() => {
					parseVersion({ extraValues: null });
				}).toThrow();
				expect(() => {
					parseVersion({ extraValues: { dummy: 0 } });
				}).toThrow();
				expect(() => {
					parseVersion({ extraValues: { dummy: null } });
				}).toThrow();
			});
			it("should throw if 'translations' itself is invalid", () => {
				expect(() => {
					parseVersion({ translations: 0 });
				}).toThrow();
				expect(() => {
					parseVersion({ translations: '' });
				}).toThrow();
				expect(() => {
					parseVersion({ translations: null });
				}).toThrow();
				// only accepts Array
				expect(() => {
					parseVersion({ translations: {} });
				}).toThrow();
			});
			it("should throw if 'translations' itself is an empty array", () => {
				expect(() => {
					parseVersion({ translations: [] });
				}).toThrow();
			});
		});
		describe('for VersionTranslationDefinition', () => {
			const PROP_NAME = 'translations[0]';
			it('should throw if not an object', () => {
				expect(() => {
					parseVersionTranslation(0, PROP_NAME);
				}).toThrow();
				expect(() => {
					parseVersionTranslation('', PROP_NAME);
				}).toThrow();
				expect(() => {
					parseVersionTranslation(null, PROP_NAME);
				}).toThrow();
			});
			it("should throw if an object does not have valid 'lang'", () => {
				expect(() => {
					parseVersionTranslation({}, PROP_NAME);
				}).toThrow();
				expect(() => {
					parseVersionTranslation({ lang: '1041' }, PROP_NAME);
				}).toThrow();
				expect(() => {
					parseVersionTranslation({ lang: true }, PROP_NAME);
				}).toThrow();
				expect(() => {
					parseVersionTranslation({ lang: 0.25 }, PROP_NAME);
				}).toThrow();
			});
			it('should throw if an object has unknown property', () => {
				expect(() => {
					parseVersionTranslation(
						{ lang: 1041, dummy: 0 },
						PROP_NAME
					);
				}).toThrow();
				expect(() => {
					parseVersionTranslation(
						{ lang: 1041, translations: [] },
						PROP_NAME
					);
				}).toThrow();
				expect(() => {
					parseVersionTranslation(
						{ lang: 1041, fixedInfo: {} },
						PROP_NAME
					);
				}).toThrow();
				expect(() => {
					parseVersionTranslation(
						{ lang: 1041, strings: {} },
						PROP_NAME
					);
				}).toThrow();
			});
			// NOTE: all VersionTranslationDefinition fields except for 'lang' are optional
			it("should not throw if an object has 'lang' field at least", () => {
				expect(() => {
					parseVersionTranslation({ lang: 1041 }, PROP_NAME);
				}).not.toThrow();
				expect(
					parseVersionTranslation({ lang: 1041 }, PROP_NAME)
				).toStrictEqual<ParsedVersionStrings>({
					lang: 1041,
					values: {},
				});
			});
			it.each(ALL_STANDARD_STRING_KEYS)(
				"should throw if '%s' is not a string",
				(field) => {
					expect(() => {
						parseVersionTranslation(
							{ lang: 1041, [field]: null },
							PROP_NAME
						);
					}).toThrow();
					expect(() => {
						parseVersionTranslation(
							{ lang: 1041, [field]: 0 },
							PROP_NAME
						);
					}).toThrow();
					expect(() => {
						parseVersionTranslation(
							{ lang: 1041, [field]: true },
							PROP_NAME
						);
					}).toThrow();
				}
			);
			it.each(ALL_STANDARD_STRING_KEYS)(
				"should not throw if '%s' is a string",
				(field) => {
					expect(() => {
						parseVersionTranslation(
							{ lang: 1041, [field]: '' },
							PROP_NAME
						);
					}).not.toThrow();
				}
			);
			it("should throw if 'extraValues' itself is invalid", () => {
				expect(() => {
					parseVersionTranslation(
						{ lang: 1041, extraValues: 0 },
						PROP_NAME
					);
				}).toThrow();
				expect(() => {
					parseVersionTranslation(
						{ lang: 1041, extraValues: '' },
						PROP_NAME
					);
				}).toThrow();
				expect(() => {
					parseVersionTranslation(
						{ lang: 1041, extraValues: null },
						PROP_NAME
					);
				}).toThrow();
			});
			it("should not throw if 'extraValues' itself is an object", () => {
				expect(() => {
					parseVersionTranslation(
						{ lang: 1041, extraValues: {} },
						PROP_NAME
					);
				}).not.toThrow();
				expect(() => {
					parseVersionTranslation(
						{ lang: 1041, extraValues: { dummy: 'a' } },
						PROP_NAME
					);
				}).not.toThrow();
			});
		});
	});
	describe('parsing', () => {
		describe('for VersionDefinition', () => {
			it('should parse an empty object', () => {
				expect(parseVersion({})).toStrictEqual<ParsedVersionDefinition>(
					{
						fixedInfo: {},
						strings: [{ values: {} }],
					}
				);
			});
			it("should store 'lang' value as a 'lang' of first 'strings' object", () => {
				expect(parseVersion({ lang: 1041 })?.strings[0]?.lang).toEqual(
					1041
				);
			});
			it("should store 'lang' value as an additional item of 'strings' if another translation is available", () => {
				const a = parseVersion({
					lang: 1041,
					translations: [{ lang: 1033 }],
				})?.strings?.map((t) => t.lang);
				expect(a?.length).toEqual(2);
				expect(a).toEqual(expect.arrayContaining([1033, 1041]));
			});
			it("should merge 'lang' value on 'strings' if same translation is available", () => {
				const a = parseVersion({
					lang: 1041,
					translations: [{ lang: 1041 }],
				}).strings.map((t) => t.lang);
				expect(a?.length).toEqual(1);
				expect(a?.[0]).toEqual(1041);
			});

			it.each(ALL_FIXED_INFO_KEYS)(
				"should store '%s' FixedInfo field",
				(field) => {
					const v = parseVersion({ [field]: 7 });
					expect(v.fixedInfo[field]).toEqual(7);
				}
			);
			it.each(ALL_STANDARD_STRING_KEYS)(
				"should store '%s' standard field",
				(field) => {
					const v = parseVersion({ [field]: 'abc' });
					expect(v.strings.length).toEqual(1);
					expect(v.strings[0]?.lang).toBeUndefined();
					expect(v.strings).toEqual(
						expect.arrayContaining<ParsedVersionStrings>([
							{ values: { [field]: 'abc' } },
						])
					);
				}
			);
			it.each(ALL_STANDARD_STRING_KEYS)(
				"should store '%s' standard field (case insensitive)",
				(field) => {
					const v = parseVersion({ [field.toLowerCase()]: 'abc' });
					expect(v.strings.length).toEqual(1);
					expect(v.strings[0]?.lang).toBeUndefined();
					expect(v.strings).toEqual(
						expect.arrayContaining<ParsedVersionStrings>([
							{ values: { [field]: 'abc' } },
						])
					);
				}
			);
			it('should store extra value', () => {
				const v = parseVersion({ extraValues: { hogePiyo: 'abc' } });
				expect(v.strings.length).toEqual(1);
				expect(v.strings[0]?.lang).toBeUndefined();
				expect(v.strings).toEqual(
					expect.arrayContaining<ParsedVersionStrings>([
						{ values: { hogePiyo: 'abc' } },
					])
				);
			});
			it('should store extra value (case sensitive)', () => {
				const v = parseVersion({ extraValues: { companyName: 'abc' } });
				expect(v.strings.length).toEqual(1);
				expect(v.strings[0]?.lang).toBeUndefined();
				expect(v.strings).toEqual(
					expect.arrayContaining<ParsedVersionStrings>([
						{ values: { companyName: 'abc' } },
					])
				);
			});
			it('should merge with same language translation', () => {
				const input: VersionDefinition = {
					lang: 1041,
					companyName: 'abc',
					translations: [
						{
							lang: 1041,
							fileDescription: 'def',
						},
					],
				};
				const v = parseVersion(input);
				expect(v.strings.length).toEqual(1);
				expect(v.strings).toEqual(
					expect.arrayContaining<ParsedVersionStrings>([
						{
							lang: 1041,
							values: {
								CompanyName: 'abc',
								FileDescription: 'def',
							},
						},
					])
				);
			});
			it('should not merge with different language translation', () => {
				const input: VersionDefinition = {
					lang: 1041,
					companyName: 'abc',
					translations: [
						{
							lang: 1033,
							fileDescription: 'def',
						},
					],
				};
				const v = parseVersion(input);
				expect(v.strings.length).toEqual(2);
				expect(v.strings).toEqual(
					expect.arrayContaining<ParsedVersionStrings>([
						{
							lang: 1041,
							values: {
								CompanyName: 'abc',
							},
						},
						{
							lang: 1033,
							values: {
								FileDescription: 'def',
							},
						},
					])
				);
			});

			const testVersionParsing = <
				TFieldMS extends 'fileVersionMS' | 'productVersionMS',
				TFieldLS extends 'fileVersionLS' | 'productVersionLS',
				TFieldString extends 'FileVersion' | 'ProductVersion',
			>(
				fieldsMS: TFieldMS,
				fieldsLS: TFieldLS,
				fieldString: TFieldString
			) => {
				it(`should store '${fieldsMS}' and '${fieldsLS}' if these are not defined but '${fieldString}' is 'x.x.x.x' string"`, () => {
					const input: VersionDefinition = {
						lang: 1041,
						[fieldString]: '3.4.5.6',
					};
					const v = parseVersion(input);
					expect(v.fixedInfo[fieldsMS]).toEqual(0x00030004);
					expect(v.fixedInfo[fieldsLS]).toEqual(0x00050006);
					expect(v.strings.length).toEqual(1);
					expect(v.strings).toEqual(
						expect.arrayContaining<ParsedVersionStrings>([
							{
								lang: 1041,
								values: {
									[fieldString]: '3.4.5.6',
								},
							},
						])
					);
				});
				it.each([fieldsMS, fieldsLS])(
					`should not overwrite '${fieldsMS}' and '${fieldsLS}' if '%s' is defined and '${fieldString}' is 'x.x.x.x' string`,
					(field) => {
						const input: VersionDefinition = {
							lang: 1041,
							[fieldString]: '3.4.5.6',
							[field]: 0x00010002,
						};
						const v = parseVersion(input);
						expect(v.fixedInfo[field]).toEqual(0x00010002);
						expect(
							v.fixedInfo[
								field === fieldsMS ? fieldsLS : fieldsMS
							]
						).toBeUndefined();
						expect(v.strings.length).toEqual(1);
						expect(v.strings).toEqual(
							expect.arrayContaining<ParsedVersionStrings>([
								{
									lang: 1041,
									values: {
										[fieldString]: '3.4.5.6',
									},
								},
							])
						);
					}
				);
				it(`should not overwrite '${fieldsMS}' and '${fieldsLS}' if both are defined and '${fieldString}' is 'x.x.x.x' string`, () => {
					const input: VersionDefinition = {
						lang: 1041,
						[fieldString]: '3.4.5.6',
						[fieldsMS]: 0x00010002,
						[fieldsLS]: 0x00070008,
					};
					const v = parseVersion(input);
					expect(v.fixedInfo[fieldsMS]).toEqual(0x00010002);
					expect(v.fixedInfo[fieldsLS]).toEqual(0x00070008);
					expect(v.strings.length).toEqual(1);
					expect(v.strings).toEqual(
						expect.arrayContaining<ParsedVersionStrings>([
							{
								lang: 1041,
								values: {
									[fieldString]: '3.4.5.6',
								},
							},
						])
					);
				});
			};
			testVersionParsing('fileVersionMS', 'fileVersionLS', 'FileVersion');
			testVersionParsing(
				'productVersionMS',
				'productVersionLS',
				'ProductVersion'
			);
		});
		describe('for VersionTranslationDefinition', () => {
			const PROP_NAME = 'translations[0]';
			it("should store 'lang' value", () => {
				expect(
					parseVersionTranslation({ lang: 1041 }, PROP_NAME)?.lang
				).toEqual(1041);
			});
			it.each(ALL_STANDARD_STRING_KEYS)(
				"should store '%s' standard field",
				(field) => {
					const v = parseVersionTranslation(
						{ lang: 1041, [field]: 'abc' },
						PROP_NAME
					);
					expect(v).toStrictEqual<ParsedVersionStrings>({
						lang: 1041,
						values: { [field]: 'abc' },
					});
				}
			);
			it.each(ALL_STANDARD_STRING_KEYS)(
				"should store '%s' standard field (case insensitive)",
				(field) => {
					const v = parseVersionTranslation(
						{ lang: 1041, [field.toLowerCase()]: 'abc' },
						PROP_NAME
					);
					expect(v).toStrictEqual<ParsedVersionStrings>({
						lang: 1041,
						values: { [field]: 'abc' },
					});
				}
			);
			it('should store extra value', () => {
				const v = parseVersionTranslation(
					{ lang: 1041, extraValues: { hogePiyo: 'abc' } },
					PROP_NAME
				);
				expect(v).toStrictEqual<ParsedVersionStrings>({
					lang: 1041,
					values: { hogePiyo: 'abc' },
				});
			});
			it('should store extra value (case sensitive)', () => {
				const v = parseVersionTranslation(
					{ lang: 1041, extraValues: { companyName: 'abc' } },
					PROP_NAME
				);
				expect(v).toStrictEqual<ParsedVersionStrings>({
					lang: 1041,
					values: { companyName: 'abc' },
				});
			});
		});
	});
});
