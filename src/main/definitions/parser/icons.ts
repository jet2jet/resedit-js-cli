import type { IconDefinition } from '../DefinitionData.js';
import {
	validateStringOrIntegerValue,
	validateStringValue,
	validateIntegerValue,
} from './utils.js';

export type ParsedIconDefinition = IconDefinition;

export default function parseIcons(data: unknown): ParsedIconDefinition[] {
	if (!Array.isArray(data)) {
		throw new Error("Invalid data: 'icons' is not an array");
	}
	return data.map(
		(
			item: Record<string, unknown> | null | undefined,
			i
		): ParsedIconDefinition => {
			if (typeof item !== 'object' || !item) {
				throw new Error(`Invalid data: 'icons[${i}]' is not an object`);
			}
			if (!('sourceFile' in item)) {
				throw new Error(
					`Invalid data: 'icons[${i}].sourceFile' is missing`
				);
			}
			validateStringValue(item.sourceFile, `icons[${i}].sourceFile`);
			const result: ParsedIconDefinition = {
				sourceFile: item.sourceFile,
			};
			Object.keys(item).forEach((key) => {
				const value = item[key];
				switch (key) {
					case 'id':
						validateStringOrIntegerValue(value, `icons[${i}].id`);
						result.id = value;
						break;
					case 'sourceFile':
						validateStringValue(value, `icons[${i}].sourceFile`);
						break;
					case 'lang':
						validateIntegerValue(value, `icons[${i}].lang`);
						result.lang = value;
						break;
					default:
						throw new Error(
							`Invalid data: unknown property '${key}' on 'icons[${i}]`
						);
				}
			});
			return result;
		}
	);
}
