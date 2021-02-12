import * as ResEdit from 'resedit';

import * as log from '../log';

import { ParsedVersionDefinition } from '../definitions/parser/version';
import EmitResParameter from './EmitResParameter';

export default async function emitVersion(
	res: EmitResParameter,
	lang: number,
	isExe: boolean,
	version: ParsedVersionDefinition | null | undefined
): Promise<boolean> {
	if (!version) {
		return false;
	}
	log.info('[version] Emit version.');
	// pick old data if exist
	const oldVers = ResEdit.Resource.VersionInfo.fromEntries(res.entries);
	if (oldVers.length > 0) {
		log.debug(
			`[version] Existing version resources will be dropped. (count = ${oldVers.length})`
		);
	}
	// remove old data
	// (16 === RT_VERSION)
	res.entries = res.entries.filter((e) => e.type !== 16);

	// create new one
	const outVersion = ResEdit.Resource.VersionInfo.create({
		lang: lang,
		fixedInfo: version.fixedInfo,
		strings: version.strings.map(
			(s): ResEdit.Resource.VersionStringTable => {
				const actualLanguage =
					typeof s.lang === 'number' ? s.lang : lang;
				log.debug(
					`[version] Output version string values (lang = ${actualLanguage})`
				);
				return {
					lang: actualLanguage,
					codepage: 1200,
					values: s.values,
				};
			}
		),
	});
	if (oldVers.length) {
		// use fileFlags or etc. from oldVers as base values
		log.debug(
			'[version] Use FIXEDINFO from (first) existing version resource.'
		);
		Object.assign(
			outVersion.fixedInfo,
			oldVers[0].fixedInfo,
			version.fixedInfo
		);
	} else {
		// adjust fields
		log.debug(`[version] Make default FIXEDINFO data (isExe = ${isExe}).`);
		outVersion.fixedInfo.fileFlagsMask = 0x17;
		outVersion.fixedInfo.fileFlags = 0;
		outVersion.fixedInfo.fileOS =
			ResEdit.Resource.VersionFileOS.NT_Windows32;
		outVersion.fixedInfo.fileType = isExe
			? ResEdit.Resource.VersionFileType.App
			: ResEdit.Resource.VersionFileType.DLL;
		outVersion.fixedInfo.fileSubtype = 0;
	}
	outVersion.outputToResourceEntries(res.entries);
	log.info('[version] Done.');
	return true;
}
