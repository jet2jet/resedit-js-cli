import parseIcons, {
	type ParsedIconDefinition,
} from '@/definitions/parser/icons.js';

describe('definitions/parser/icons', () => {
	describe('invalid data', () => {
		it('should throw if input data is not an array', () => {
			expect(() => {
				parseIcons(0);
			}).toThrow();
			expect(() => {
				parseIcons('a');
			}).toThrow();
			expect(() => {
				parseIcons(null);
			}).toThrow();
			expect(() => {
				parseIcons({ length: 0 });
			}).toThrow();
		});
		it('should throw if input array contains non-object item', () => {
			expect(() => {
				parseIcons([0]);
			}).toThrow();
			expect(() => {
				parseIcons(['a']);
			}).toThrow();
			expect(() => {
				parseIcons([null]);
			}).toThrow();
			expect(() => {
				parseIcons([{ sourceFile: 'x' }, 1]);
			}).toThrow();
		});
		it("should throw if 'sourceFile' is missing", () => {
			expect(() => {
				parseIcons([{}]);
			}).toThrow();
		});
		it("should throw if 'sourceFile' is not a string", () => {
			expect(() => {
				parseIcons([{ sourceFile: null }]);
			}).toThrow();
			expect(() => {
				parseIcons([{ sourceFile: 1 }]);
			}).toThrow();
			expect(() => {
				parseIcons([{ sourceFile: true }]);
			}).toThrow();
			expect(() => {
				parseIcons([{ sourceFile: {} }]);
			}).toThrow();
			expect(() => {
				parseIcons([{ sourceFile: new Uint8Array([0]) }]);
			}).toThrow();
		});
		it("should throw if 'id' is neither a string or an integer", () => {
			expect(() => {
				parseIcons([{ sourceFile: 'x', id: undefined }]);
			}).toThrow();
			expect(() => {
				parseIcons([{ sourceFile: 'x', id: null }]);
			}).toThrow();
			expect(() => {
				parseIcons([{ sourceFile: 'x', id: true }]);
			}).toThrow();
			expect(() => {
				parseIcons([{ sourceFile: 'x', id: {} }]);
			}).toThrow();
			expect(() => {
				parseIcons([{ sourceFile: 'x', id: 1.25 }]);
			}).toThrow();
		});
		it("should throw if 'lang' is not an integer", () => {
			expect(() => {
				parseIcons([{ sourceFile: 'x', lang: undefined }]);
			}).toThrow();
			expect(() => {
				parseIcons([{ sourceFile: 'x', lang: null }]);
			}).toThrow();
			expect(() => {
				parseIcons([{ sourceFile: 'x', lang: true }]);
			}).toThrow();
			expect(() => {
				parseIcons([{ sourceFile: 'x', lang: {} }]);
			}).toThrow();
			expect(() => {
				parseIcons([{ sourceFile: 'x', lang: '1033' }]);
			}).toThrow();
			expect(() => {
				parseIcons([{ sourceFile: 'x', lang: 1.25 }]);
			}).toThrow();
		});
	});
	describe('parsing', () => {
		it("should return a parsed data (without 'id')", () => {
			const a = parseIcons([{ sourceFile: 'x' }]);
			expect(a.length).toEqual(1);
			expect(a).toEqual(
				expect.arrayContaining<ParsedIconDefinition>([
					{ sourceFile: 'x' },
				])
			);
		});
		it("should return a parsed data (with string 'id')", () => {
			const a = parseIcons([{ sourceFile: 'x', id: 'ID' }]);
			expect(a.length).toEqual(1);
			expect(a).toEqual(
				expect.arrayContaining<ParsedIconDefinition>([
					{ sourceFile: 'x', id: 'ID' },
				])
			);
		});
		it("should return a parsed data (with integer 'id')", () => {
			const a = parseIcons([{ sourceFile: 'x', id: 23 }]);
			expect(a.length).toEqual(1);
			expect(a).toEqual(
				expect.arrayContaining<ParsedIconDefinition>([
					{ sourceFile: 'x', id: 23 },
				])
			);
		});
		it("should return a parsed data (with 'lang')", () => {
			const a = parseIcons([{ sourceFile: 'x', lang: 1041 }]);
			expect(a.length).toEqual(1);
			expect(a).toEqual(
				expect.arrayContaining<ParsedIconDefinition>([
					{ sourceFile: 'x', lang: 1041 },
				])
			);
		});
		it('should return a parsed data (two items)', () => {
			const a = parseIcons([
				{ sourceFile: 'x' },
				{ sourceFile: 'y', id: 101 },
			]);
			expect(a.length).toEqual(2);
			expect(a).toEqual(
				expect.arrayContaining<ParsedIconDefinition>([
					{ sourceFile: 'x' },
					{ sourceFile: 'y', id: 101 },
				])
			);
		});
	});
});
