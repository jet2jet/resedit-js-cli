import * as ResEdit from 'resedit';

import { readFile } from '../fs';
import * as log from '../log';
import { ParsedIconDefinition } from '../definitions/parser/icons';
import EmitResParameter from './EmitResParameter';

function getNextPreferIconId(
	start: number,
	usedIds: Array<string | number>
): number {
	const s = start;
	while (true) {
		++start;
		if (usedIds.indexOf(start) < 0) {
			return start;
		}
		if (start === 65535) {
			start = 0;
		}
		if (start === s) {
			throw new Error('No more icons can be added.');
		}
	}
}

export default async function emitIcons(
	res: EmitResParameter,
	lang: number,
	icons: ParsedIconDefinition[] | null | undefined
) {
	if (!icons || icons.length === 0) {
		return false;
	}
	log.info(`[icon] Emit icons. (count = ${icons.length})`);
	const baseIcons = ResEdit.Resource.IconGroupEntry.fromEntries(res.entries);
	const prevIconIdMap: { [lang: number]: number } = {};
	// MEMO: to use 'await', we do not use 'icons.forEach'
	for (let i = 0, len = icons.length; i < len; ++i) {
		const item = icons[i];
		const iconLang = typeof item.lang === 'number' ? item.lang : lang;
		const prevIconId = prevIconIdMap[iconLang] || 0;
		const usedIds = baseIcons
			.filter((entry) => entry.lang === iconLang)
			.map((entry) => entry.id);
		let iconId: number | string;
		if (typeof item.id !== 'undefined') {
			iconId = item.id;
			log.debug(
				`[icon] Use specified ID '${iconId}' for icon file '${item.sourceFile}'. (lang = ${iconLang})`
			);
		} else {
			iconId = getNextPreferIconId(prevIconId, usedIds);
			log.debug(
				`[icon] Use calculated ID '${iconId}' for icon file '${item.sourceFile}'. (lang = ${iconLang})`
			);
			prevIconIdMap[iconLang] = iconId;
		}
		const icon = ResEdit.Data.IconFile.from(
			await readFile(item.sourceFile)
		);
		ResEdit.Resource.IconGroupEntry.replaceIconsForResource(
			res.entries,
			iconId,
			iconLang,
			icon.icons.map((item) => item.data)
		);
	}
	log.info(`[icon] Done.`);
	return true;
}
