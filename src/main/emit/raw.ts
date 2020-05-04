import { readFile } from '../fs';
import * as log from '../log';
import { ParsedRawResourceDefinition } from '../definitions/parser/rawResource';
import EmitResParameter from './EmitResParameter';

function arrayBufferViewToArrayBuffer(view: ArrayBufferView): ArrayBuffer {
	return view.buffer.slice(
		view.byteOffset,
		view.byteOffset + view.byteLength
	);
}

export default async function emitRawResources(
	res: EmitResParameter,
	lang: number,
	raw: ParsedRawResourceDefinition[] | null | undefined
) {
	if (!raw || !raw.length) {
		return false;
	}
	log.info(`[raw] Emit raw resources. (count = ${raw.length})`);

	// MEMO: to use 'await', we do not use 'raw.forEach'
	for (let i = 0, len = raw.length; i < len; ++i) {
		const item = raw[i];
		const type = item.type;
		const id = item.id;
		const itemLang = typeof item.lang === 'undefined' ? lang : item.lang;
		let value: ArrayBuffer;
		if (typeof item.value !== 'undefined') {
			if (typeof item.value === 'string') {
				log.debug(
					`[raw] Use string resource data (type = ${type}, ID = ${id}, lang = ${itemLang})`
				);
				value = arrayBufferViewToArrayBuffer(
					Buffer.from(item.value, 'utf8')
				);
			} else if (ArrayBuffer.isView(item.value)) {
				log.debug(
					`[raw] Use ArrayBufferView resource data (type = ${type}, ID = ${id}, lang = ${itemLang})`
				);
				value = arrayBufferViewToArrayBuffer(item.value);
			} else {
				log.debug(
					`[raw] Use ArrayBuffer resource data (type = ${type}, ID = ${id}, lang = ${itemLang})`
				);
				value = item.value;
			}
		} else {
			log.debug(
				`[raw] Load resource data from file '${item.file}' (type = ${type}, ID = ${id}, lang = ${itemLang})`
			);
			value = arrayBufferViewToArrayBuffer(await readFile(item.file!));
		}

		const ent = res.entries.filter(
			(e) => e.type === type && e.id === id && e.lang === itemLang
		)[0];
		if (ent) {
			log.debug(`[raw] Replace existing resource data.`);
			ent.bin = value;
		} else {
			log.debug(`[raw] Add resource data.`);
			res.entries.push({
				type,
				id,
				lang: itemLang,
				codepage: 1200,
				bin: value,
			});
		}
	}
	log.info(`[raw] Done.`);
	return true;
}
