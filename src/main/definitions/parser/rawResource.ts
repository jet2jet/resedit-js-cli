import { RawResourceDefinitionData } from '../DefinitionData';

import {
	validateIntegerValue,
	validateStringOrIntegerValue,
	validateStringValue,
} from './utils';

export type ParsedRawResourceDefinition = RawResourceDefinitionData;

export default function parseRawResource(
	data: unknown
): ParsedRawResourceDefinition[] {
	if (!Array.isArray(data)) {
		throw new Error("Invalid data: 'raw' is not an array");
	}
	const ret: ParsedRawResourceDefinition[] = [];
	data.forEach((item: unknown, i) => {
		// check if data is a non-null object
		if (typeof item !== 'object' || item === null) {
			throw new Error(`Invalid data: 'raw[${i}]' is not an object`);
		}
		const props = Object.keys(item);
		if (!props.includes('type')) {
			throw new Error(`Invalid data: 'raw[${i}].type' is missing`);
		}
		if (!props.includes('id')) {
			throw new Error(`Invalid data: 'raw[${i}].id' is missing`);
		}
		if (!props.includes('file') && !props.includes('value')) {
			throw new Error(
				`Invalid data: 'raw[${i}].file' and 'raw[${i}].value' is missing`
			);
		}
		const o: ParsedRawResourceDefinition = { type: '', id: 0 };
		props.forEach((prop) => {
			const value = (item as Record<string, unknown>)[prop];
			switch (prop) {
				case 'type':
				case 'id':
					validateStringOrIntegerValue(value, `raw[${i}].${prop}`);
					o[prop] = value;
					break;
				case 'lang':
					validateIntegerValue(value, `raw[${i}].lang`);
					o.lang = value;
					break;
				case 'file':
					validateStringValue(value, `raw[${i}].file`);
					if (!('value' in item)) {
						o.file = value;
					}
					break;
				case 'value':
					if (typeof value === 'object') {
						if (
							!ArrayBuffer.isView(value) &&
							!(value instanceof ArrayBuffer)
						) {
							throw new Error(
								`Invalid data: 'raw[${i}].value' is an object, but neither an ArrayBuffer nor an ArrayBufferView`
							);
						}
					} else if (typeof value !== 'string') {
						throw new Error(
							`Invalid data: 'raw[${i}].value' is neither a string, an ArrayBuffer, nor an ArrayBufferView`
						);
					}
					o.value = value;
					break;
				default:
					throw new Error(
						`Invalid data: unknown property '${prop}' on 'raw[${i}]`
					);
			}
		});
		ret.push(o);
	});
	return ret;
}
