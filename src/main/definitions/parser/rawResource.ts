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
	data.forEach((item: any, i) => {
		// check if data is a non-null object
		if (typeof item !== 'object' || !item) {
			throw new Error(`Invalid data: 'raw[${i}]' is not an object`);
		}
		const props = Object.keys(item);
		if (props.indexOf('type') < 0) {
			throw new Error(`Invalid data: 'raw[${i}].type' is missing`);
		}
		if (props.indexOf('id') < 0) {
			throw new Error(`Invalid data: 'raw[${i}].id' is missing`);
		}
		if (props.indexOf('file') < 0 && props.indexOf('value') < 0) {
			throw new Error(
				`Invalid data: 'raw[${i}].file' and 'raw[${i}].value' is missing`
			);
		}
		const o: ParsedRawResourceDefinition = {} as ParsedRawResourceDefinition;
		props.forEach((prop) => {
			const value = item[prop];
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
