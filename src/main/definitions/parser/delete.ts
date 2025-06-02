import {
	type DeleteResourceDefinitionData,
	PredefinedResourceTypeNameForDelete,
} from '../DefinitionData.js';
import {
	validateBooleanValue,
	validateIntegerValue,
	validatePredefinedResourceTypeNameForDelete,
	validateStringOrIntegerValue,
} from './utils.js';

export type ParsedDeleteResourceDefinition = DeleteResourceDefinitionData;

export function parseDeleteResource(
	data: unknown
): ParsedDeleteResourceDefinition[] {
	if (!Array.isArray(data)) {
		throw new Error("Invalid data: 'delete' is not an array");
	}
	const ret: ParsedDeleteResourceDefinition[] = [];
	data.forEach((item: unknown, i) => {
		// check if data is a non-null object
		if (typeof item !== 'object' || item === null) {
			throw new Error(`Invalid data: 'delete[${i}]' is not an object`);
		}
		const props = Object.keys(item);
		if (!props.includes('type') && !props.includes('typeName')) {
			throw new Error(
				`Invalid data: 'delete[${i}].type' or 'delete[${i}].typeName' is missing`
			);
		}
		const o: DeleteResourceDefinitionData = { type: '' };
		props.forEach((prop) => {
			const value = (item as Record<string, unknown>)[prop];
			switch (prop) {
				case 'type':
				case 'id':
					validateStringOrIntegerValue(value, `raw[${i}].${prop}`);
					o[prop] = value;
					break;
				case 'typeName':
					validatePredefinedResourceTypeNameForDelete(
						value,
						`raw[${i}].${prop}`
					);
					o.type = PredefinedResourceTypeNameForDelete[value];
					break;
				case 'lang':
					validateIntegerValue(value, `raw[${i}].lang`);
					o.lang = value;
					break;
				case 'failIfNoDelete':
					validateBooleanValue(value, `raw[${i}].${prop}`);
					o.failIfNoDelete = value;
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
