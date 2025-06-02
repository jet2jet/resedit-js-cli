import * as log from '../log.js';
import { PredefinedResourceTypeNameForDelete } from '../definitions/DefinitionData.js';
import type { ParsedDeleteResourceDefinition } from '../definitions/parser/delete.js';
import type EmitResParameter from './EmitResParameter.js';

export default function deleteResources(
	res: EmitResParameter,
	delData: ParsedDeleteResourceDefinition[] | null | undefined
): boolean {
	if (!delData || delData.length === 0) {
		return false;
	}
	log.info(`[delete] Delete resources. (count = ${delData.length})`);

	for (const d of delData) {
		let found = false;
		for (let i = res.entries.length - 1; i >= 0; --i) {
			const entry = res.entries[i]!;
			switch (d.type) {
				case PredefinedResourceTypeNameForDelete.allCursor:
					if (
						entry.type !==
							PredefinedResourceTypeNameForDelete.cursor &&
						entry.type !==
							PredefinedResourceTypeNameForDelete.groupCursor &&
						entry.type !==
							PredefinedResourceTypeNameForDelete.aniCursor
					) {
						continue;
					}
					break;
				case PredefinedResourceTypeNameForDelete.allIcon:
					if (
						entry.type !==
							PredefinedResourceTypeNameForDelete.icon &&
						entry.type !==
							PredefinedResourceTypeNameForDelete.groupIcon &&
						entry.type !==
							PredefinedResourceTypeNameForDelete.aniIcon
					) {
						continue;
					}
					break;
				default:
					if (entry.type !== d.type) {
						continue;
					}
					break;
			}
			if (d.lang != null) {
				if (entry.lang !== d.lang) {
					continue;
				}
			}
			if (d.id != null) {
				if (entry.id !== d.id) {
					continue;
				}
			}
			found = true;
			log.debug(
				`[delete] Delete resource entry (type: ${entry.type}, id: ${entry.id}, lang: ${entry.lang})`
			);
			res.entries.splice(i, 1);
		}
		if (!found && d.failIfNoDelete) {
			throw new Error(
				`Resource is not found: type = ${d.type}, id = ${
					d.id ?? '(not specified)'
				}, lang = ${d.lang ?? '(not specified)'}`
			);
		}
	}
	log.info(`[delete] Done.`);
	return true;
}
