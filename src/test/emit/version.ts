import * as ResEdit from 'resedit';
import { ParsedVersionDefinition } from '@/definitions/parser/version';
import EmitResParameter from '@/emit/EmitResParameter';
import emitVersion from '@/emit/version';

const DUMMY_VERSION = (() => {
	const v = ResEdit.Resource.VersionInfo.createEmpty();
	v.lang = 1033;
	// use _Windows32, not NT_Windows32, for test purpose
	v.fixedInfo.fileOS = ResEdit.Resource.VersionFileOS._Windows32;
	v.fixedInfo.fileFlagsMask = 17;
	v.fixedInfo.fileFlags = ResEdit.Resource.VersionFileFlags.Debug;
	// use StaticLibrary for test purpose
	v.fixedInfo.fileType = ResEdit.Resource.VersionFileType.StaticLibrary;

	v.setStringValues({ codepage: 1200, lang: 1033 }, { dummy: 'dummy' }, true);
	return v;
})();
const DUMMY_VERSION_RESOURCE = (() => {
	const res = DUMMY_VERSION.generateResource();
	res.id = 1;
	return res;
})();

function testVersionInfo(
	v: ResEdit.Resource.VersionInfo,
	src: ParsedVersionDefinition,
	lang: number,
	baseEntry?: ResEdit.Resource.VersionInfo
) {
	type FixedInfoKeys = keyof ResEdit.Resource.VersionInfo['fixedInfo'];

	// check fixedInfo
	const specifedFixedInfoKeys = Object.keys(src.fixedInfo);
	if (baseEntry) {
		// check values from base fixedInfo are used for unspecified keys
		Object.keys(baseEntry.fixedInfo).forEach((key) => {
			if (specifedFixedInfoKeys.includes(key)) {
				return;
			}
			expect(v.fixedInfo[key as FixedInfoKeys]).toEqual(
				baseEntry.fixedInfo[key as FixedInfoKeys]
			);
		});
	}
	specifedFixedInfoKeys.forEach((key) => {
		expect(v.fixedInfo[key as FixedInfoKeys]).toEqual(
			src.fixedInfo[key as FixedInfoKeys]
		);
	});

	// check strings
	const allLanguages = v.getAllLanguagesForStringValues();
	src.strings.forEach((table) => {
		const l = typeof table.lang !== 'undefined' ? table.lang : lang;
		expect(allLanguages.some((t) => t.lang === l)).toBeTruthy();

		const targetTable = v.getStringValues({
			lang: l,
			codepage: 1200,
		});
		expect(targetTable).toStrictEqual(table.values);
	});
}

describe('emitVersion', () => {
	describe('with no definition', () => {
		it('should emit nothing (with no entries on base data)', async () => {
			const res: EmitResParameter = { entries: [] };
			expect(await emitVersion(res, 1033, true, undefined)).toBeFalsy();
			expect(res.entries.length).toEqual(0);
		});
		it('should emit nothing (with entries on base data)', async () => {
			const res: EmitResParameter = {
				entries: [DUMMY_VERSION_RESOURCE],
			};
			expect(await emitVersion(res, 1033, true, undefined)).toBeFalsy();
			expect(res.entries.length).toEqual(1);
		});
	});
	describe('with definition', () => {
		it('should emit version resource (with no entries on base data)', async () => {
			const res: EmitResParameter = { entries: [] };
			const ver: ParsedVersionDefinition = {
				fixedInfo: {
					fileVersionMS: 0x00010002,
					fileVersionLS: 0x00030004,
				},
				strings: [
					{
						values: {
							// NOTE: In ConvertedVersionDefinition the key name is normalized
							CompanyName: '$',
							abc: 'xyz',
						},
					},
				],
			};
			expect(await emitVersion(res, 1033, true, ver)).toBeTruthy();
			expect(res.entries.length).toEqual(1);
			const versions = ResEdit.Resource.VersionInfo.fromEntries(
				res.entries
			);
			expect(versions.length).toEqual(1);
			testVersionInfo(versions[0], ver, 1033);
		});
		it('should emit version resource (with one version entry on base data)', async () => {
			const res: EmitResParameter = { entries: [DUMMY_VERSION_RESOURCE] };
			const ver: ParsedVersionDefinition = {
				fixedInfo: {
					fileVersionMS: 0x00010002,
					fileVersionLS: 0x00030004,
				},
				strings: [
					{
						values: {
							// NOTE: In ConvertedVersionDefinition the key name is normalized
							CompanyName: '$',
							abc: 'xyz',
						},
					},
				],
			};
			expect(await emitVersion(res, 1033, true, ver)).toBeTruthy();
			// DUMMY_VERSION_RESOURCE should be replaced (removed)
			expect(res.entries.length).toEqual(1);
			const versions = ResEdit.Resource.VersionInfo.fromEntries(
				res.entries
			);
			expect(versions.length).toEqual(1);
			testVersionInfo(versions[0], ver, 1033, DUMMY_VERSION);
		});
	});
});
