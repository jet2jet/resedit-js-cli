import { PredefinedResourceTypeName } from '@/definitions/DefinitionData.js';
import parseRawResource, {
	type ParsedRawResourceDefinition,
} from '@/definitions/parser/rawResource.js';

describe('definitions/parser/rawResource', () => {
	describe('invalid data', () => {
		it('should throw if input data is not an array', () => {
			expect(() => {
				parseRawResource(0);
			}).toThrow();
			expect(() => {
				parseRawResource('a');
			}).toThrow();
			expect(() => {
				parseRawResource(null);
			}).toThrow();
			expect(() => {
				parseRawResource({ length: 0 });
			}).toThrow();
		});
		it('should throw if input array contains non-object item', () => {
			expect(() => {
				parseRawResource([0]);
			}).toThrow();
			expect(() => {
				parseRawResource(['a']);
			}).toThrow();
			expect(() => {
				parseRawResource([null]);
			}).toThrow();
			expect(() => {
				parseRawResource([{ type: 'A', id: 1, value: 'x' }, 1]);
			}).toThrow();
		});
		it('should throw if one of required fields is missing', () => {
			expect(() => {
				parseRawResource([{ id: 1, value: 'x' }]);
			}).toThrow();
			expect(() => {
				parseRawResource([{ type: 'A', value: 'x' }]);
			}).toThrow();
			expect(() => {
				parseRawResource([{ type: 'A', id: 1 }]);
			}).toThrow();
			expect(() => {
				parseRawResource([
					{
						typeName: PredefinedResourceTypeName.manifest,
						value: 'x',
					},
				]);
			}).toThrow();
			expect(() => {
				parseRawResource([
					{ typeName: PredefinedResourceTypeName.manifest, id: 1 },
				]);
			}).toThrow();
		});
		it('should throw if type is neither a string nor an integer', () => {
			expect(() => {
				parseRawResource([{ type: null, id: 1, value: 'x' }]);
			}).toThrow();
			expect(() => {
				parseRawResource([{ type: {}, id: 1, value: 'x' }]);
			}).toThrow();
			expect(() => {
				parseRawResource([{ type: true, id: 1, value: 'x' }]);
			}).toThrow();
			expect(() => {
				parseRawResource([{ type: 1.25, id: 1, value: 'x' }]);
			}).toThrow();
		});
		it('should throw if typeName is not a predefined name', () => {
			expect(() => {
				parseRawResource([{ typeName: null, id: 1, value: 'x' }]);
			}).toThrow();
			expect(() => {
				parseRawResource([{ typeName: {}, id: 1, value: 'x' }]);
			}).toThrow();
			expect(() => {
				parseRawResource([{ typeName: true, id: 1, value: 'x' }]);
			}).toThrow();
			expect(() => {
				parseRawResource([{ typeName: 'xxxx', id: 1, value: 'x' }]);
			}).toThrow();
			expect(() => {
				// currently case is sensitive
				parseRawResource([{ typeName: 'VERSION', id: 1, value: 'x' }]);
			}).toThrow();
		});
		it('should throw if id is neither a string nor an integer', () => {
			expect(() => {
				parseRawResource([{ type: 'A', id: null, value: 'x' }]);
			}).toThrow();
			expect(() => {
				parseRawResource([{ type: 'A', id: {}, value: 'x' }]);
			}).toThrow();
			expect(() => {
				parseRawResource([
					{
						typeName: PredefinedResourceTypeName.manifest,
						id: true,
						value: 'x',
					},
				]);
			}).toThrow();
			expect(() => {
				parseRawResource([
					{
						typeName: PredefinedResourceTypeName.manifest,
						id: 1.25,
						value: 'x',
					},
				]);
			}).toThrow();
		});
		it('should throw if value is neither an ArrayBuffer, an ArrayBufferView, nor a string', () => {
			expect(() => {
				parseRawResource([
					{ type: 'A', id: 1, file: 'y', value: undefined },
				]);
			}).toThrow();
			expect(() => {
				parseRawResource([{ type: 'A', id: 1, value: null }]);
			}).toThrow();
			expect(() => {
				parseRawResource([{ type: 'A', id: 1, value: 1 }]);
			}).toThrow();
			expect(() => {
				parseRawResource([{ type: 'A', id: 1, value: true }]);
			}).toThrow();
			expect(() => {
				parseRawResource([{ type: 'A', id: 1, value: {} }]);
			}).toThrow();
			expect(() => {
				parseRawResource([{ type: 'A', id: 1, value: [0, 1] }]);
			}).toThrow();
		});
		it('should throw if file is not a string', () => {
			expect(() => {
				parseRawResource([
					{ type: 'A', id: 1, file: undefined, value: 'x' },
				]);
			}).toThrow();
			expect(() => {
				parseRawResource([{ type: 'A', id: 1, file: null }]);
			}).toThrow();
			expect(() => {
				parseRawResource([{ type: 'A', id: 1, file: 1 }]);
			}).toThrow();
			expect(() => {
				parseRawResource([{ type: 'A', id: 1, file: true }]);
			}).toThrow();
			expect(() => {
				parseRawResource([{ type: 'A', id: 1, file: {} }]);
			}).toThrow();
			expect(() => {
				parseRawResource([
					{ type: 'A', id: 1, file: new Uint8Array([0]) },
				]);
			}).toThrow();
		});
	});
	describe('parsing', () => {
		it('should return a parsed data (with string value)', () => {
			const r = parseRawResource([{ type: 'A', id: 1, value: 'x' }]);
			expect(r.length).toEqual(1);
			expect(r[0]).toStrictEqual<ParsedRawResourceDefinition>({
				type: 'A',
				id: 1,
				value: 'x',
			});
		});
		it.each(Object.keys(PredefinedResourceTypeName))(
			'should return a parsed data (with predefined type name)',
			(typeName) => {
				const r = parseRawResource([{ typeName, id: 1, value: 'x' }]);
				expect(r.length).toEqual(1);
				expect(r[0]).toStrictEqual<ParsedRawResourceDefinition>({
					type: PredefinedResourceTypeName[
						typeName as keyof typeof PredefinedResourceTypeName
					],
					id: 1,
					value: 'x',
				});
			}
		);
		it('should return a parsed data (with ArrayBuffer value)', () => {
			const value = new ArrayBuffer(1);
			const r = parseRawResource([{ type: 'A', id: 1, value }]);
			expect(r.length).toEqual(1);
			expect(r[0]).toStrictEqual<ParsedRawResourceDefinition>({
				type: 'A',
				id: 1,
				value,
			});
		});
		it('should return a parsed data (with ArrayBufferView value - Uint8Array)', () => {
			const value = new Uint8Array([0, 1]);
			const r = parseRawResource([{ type: 'A', id: 1, value }]);
			expect(r.length).toEqual(1);
			expect(r[0]).toStrictEqual<ParsedRawResourceDefinition>({
				type: 'A',
				id: 1,
				value,
			});
		});
		it('should return a parsed data (with ArrayBufferView value - DataView)', () => {
			const value = new DataView(new ArrayBuffer(1));
			const r = parseRawResource([{ type: 'A', id: 1, value }]);
			expect(r.length).toEqual(1);
			expect(r[0]).toStrictEqual<ParsedRawResourceDefinition>({
				type: 'A',
				id: 1,
				value,
			});
		});
		it('should return a parsed data (with ArrayBufferView value - Buffer)', () => {
			const value = Buffer.from([0, 1]);
			const r = parseRawResource([{ type: 'A', id: 1, value }]);
			expect(r.length).toEqual(1);
			expect(r[0]).toStrictEqual<ParsedRawResourceDefinition>({
				type: 'A',
				id: 1,
				value,
			});
		});
		it('should return a parsed data (with file)', () => {
			const r = parseRawResource([{ type: 'A', id: 1, file: 'y' }]);
			expect(r.length).toEqual(1);
			expect(r[0]).toStrictEqual<ParsedRawResourceDefinition>({
				type: 'A',
				id: 1,
				file: 'y',
			});
		});
		it("should return a parsed data (with both 'file' and 'value' - 'value' will be used)", () => {
			const r = parseRawResource([
				{ type: 'A', id: 1, value: 'x', file: 'y' },
			]);
			expect(r.length).toEqual(1);
			expect(r[0]).toStrictEqual<ParsedRawResourceDefinition>({
				type: 'A',
				id: 1,
				value: 'x',
			});
		});
		it('should return a parsed data (two items)', () => {
			const r = parseRawResource([
				{ type: 'A', id: 1, value: 'x' },
				{ type: 'A', id: 2, value: 'y' },
			]);
			expect(r.length).toEqual(2);
			expect(r).toEqual(
				expect.arrayContaining<ParsedRawResourceDefinition>([
					{
						type: 'A',
						id: 1,
						value: 'x',
					},
					{
						type: 'A',
						id: 2,
						value: 'y',
					},
				])
			);
		});
	});
});
