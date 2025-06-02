import {
	parseDeleteResource,
	type ParsedDeleteResourceDefinition,
} from '@/definitions/parser/delete.js';
import { PredefinedResourceTypeName } from '@/definitions/DefinitionData.js';

describe('definitions/parser/delete', () => {
	describe('invalid data', () => {
		it('should throw if input data is not an array', () => {
			expect(() => {
				parseDeleteResource(0);
			}).toThrow();
			expect(() => {
				parseDeleteResource('a');
			}).toThrow();
			expect(() => {
				parseDeleteResource(null);
			}).toThrow();
			expect(() => {
				parseDeleteResource({ length: 0 });
			}).toThrow();
		});
		it('should throw if input array contains non-object item', () => {
			expect(() => {
				parseDeleteResource([0]);
			}).toThrow();
			expect(() => {
				parseDeleteResource(['a']);
			}).toThrow();
			expect(() => {
				parseDeleteResource([null]);
			}).toThrow();
			expect(() => {
				parseDeleteResource([{ type: 'A', id: 1 }, 1]);
			}).toThrow();
		});
		it('should throw if one of required fields is missing', () => {
			// NOTE: id can be omitted
			expect(() => {
				parseDeleteResource([{ id: 1 }]);
			}).toThrow();
			expect(() => {
				parseDeleteResource([{}]);
			}).toThrow();
		});
		it('should throw if type is neither a string nor an integer', () => {
			expect(() => {
				parseDeleteResource([{ type: null, id: 1 }]);
			}).toThrow();
			expect(() => {
				parseDeleteResource([{ type: {}, id: 1 }]);
			}).toThrow();
			expect(() => {
				parseDeleteResource([{ type: true, id: 1 }]);
			}).toThrow();
			expect(() => {
				parseDeleteResource([{ type: 1.25, id: 1 }]);
			}).toThrow();
		});
		it('should throw if typeName is not a predefined name', () => {
			expect(() => {
				parseDeleteResource([{ typeName: null, id: 1 }]);
			}).toThrow();
			expect(() => {
				parseDeleteResource([{ typeName: {}, id: 1 }]);
			}).toThrow();
			expect(() => {
				parseDeleteResource([{ typeName: true, id: 1 }]);
			}).toThrow();
			expect(() => {
				parseDeleteResource([{ typeName: 'xxxx', id: 1 }]);
			}).toThrow();
			expect(() => {
				// currently case is sensitive
				parseDeleteResource([{ typeName: 'VERSION', id: 1 }]);
			}).toThrow();
		});
		it('should throw if id is neither a string nor an integer', () => {
			expect(() => {
				parseDeleteResource([{ type: 'A', id: null }]);
			}).toThrow();
			expect(() => {
				parseDeleteResource([{ type: 'A', id: {} }]);
			}).toThrow();
			expect(() => {
				parseDeleteResource([
					{
						typeName: PredefinedResourceTypeName.manifest,
						id: true,
					},
				]);
			}).toThrow();
			expect(() => {
				parseDeleteResource([
					{
						typeName: PredefinedResourceTypeName.manifest,
						id: 1.25,
					},
				]);
			}).toThrow();
		});
	});
	describe('parsing', () => {
		it('should return a parsed data', () => {
			const r = parseDeleteResource([{ type: 'A', id: 1 }]);
			expect(r.length).toEqual(1);
			expect(r[0]).toStrictEqual<ParsedDeleteResourceDefinition>({
				type: 'A',
				id: 1,
			});
		});
		it('should return a parsed data (no id)', () => {
			const r = parseDeleteResource([{ type: 'A' }]);
			expect(r.length).toEqual(1);
			expect(r[0]).toStrictEqual<ParsedDeleteResourceDefinition>({
				type: 'A',
			});
		});
		it.each(Object.keys(PredefinedResourceTypeName))(
			'should return a parsed data (with predefined type name)',
			(typeName) => {
				const r = parseDeleteResource([{ typeName, id: 1 }]);
				expect(r.length).toEqual(1);
				expect(r[0]).toStrictEqual<ParsedDeleteResourceDefinition>({
					type: PredefinedResourceTypeName[
						typeName as keyof typeof PredefinedResourceTypeName
					],
					id: 1,
				});
			}
		);
		it('should return a parsed data (two items)', () => {
			const r = parseDeleteResource([
				{ type: 'A', id: 1 },
				{ type: 'A', id: 2 },
			]);
			expect(r.length).toEqual(2);
			expect(r).toEqual(
				expect.arrayContaining<ParsedDeleteResourceDefinition>([
					{
						type: 'A',
						id: 1,
					},
					{
						type: 'A',
						id: 2,
					},
				])
			);
		});
	});
});
