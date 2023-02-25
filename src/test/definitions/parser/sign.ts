import { CertificateSelectMode } from '@/definitions/DefinitionData.js';
import parseSignDefinition, {
	type ParsedSignDefinition,
} from '@/definitions/parser/sign.js';

function testIfNotAString(name: string, baseObj: Record<string, unknown> = {}) {
	expect(() => {
		parseSignDefinition({
			...baseObj,
			[name]: null,
		});
	}).toThrow();
	expect(() => {
		parseSignDefinition({
			...baseObj,
			[name]: 1,
		});
	}).toThrow();
	expect(() => {
		parseSignDefinition({
			...baseObj,
			[name]: true,
		});
	}).toThrow();
}

describe('definitions/parser/sign', () => {
	describe('invalid data', () => {
		it('should throw if not an object', () => {
			expect(() => {
				parseSignDefinition(0);
			}).toThrow();
			expect(() => {
				parseSignDefinition('');
			}).toThrow();
			expect(() => {
				parseSignDefinition(null);
			}).toThrow();
		});
		it('should throw if required fields are missing', () => {
			// no fields
			expect(() => {
				parseSignDefinition({});
			}).toThrow();
			// 'certificateFile' is missing
			expect(() => {
				parseSignDefinition({
					privateKeyFile: '',
				});
			}).toThrow();
			// 'privateKeyFile' is missing
			expect(() => {
				parseSignDefinition({
					certificateFile: '',
				});
			}).toThrow();
		});
		it("should throw if 'p12File' is not a string", () => {
			testIfNotAString('p12File');
		});
		it("should throw if 'privateKeyFile' is not a string", () => {
			testIfNotAString('privateKeyFile', { certificateFile: '' });
		});
		it("should throw if 'certificateFile' is not a string", () => {
			testIfNotAString('certificateFile', { privateKeyFile: '' });
		});
		it.each(['password', 'timestampServer'])(
			"should throw if '%s' is not a string",
			(name) => {
				testIfNotAString(name, { p12File: '' });
			}
		);
		it("should throw if 'certSelect' is not valid", () => {
			testIfNotAString('certSelect', { p12File: '' });
			expect(() => {
				parseSignDefinition({
					p12File: '',
					certSelect: 'Leaf',
				});
			}).toThrow();
			expect(() => {
				parseSignDefinition({
					p12File: '',
					certSelect: 'All',
				});
			}).toThrow();
		});
		it("should throw if 'digestAlgorithm' is not valid or not supported", () => {
			testIfNotAString('digestAlgorithm', { p12File: '' });
			expect(() => {
				parseSignDefinition({
					p12File: '',
					digestAlgorithm: 'SHA1',
				});
			}).toThrow();
			expect(() => {
				parseSignDefinition({
					p12File: '',
					digestAlgorithm: 'SHA256',
				});
			}).toThrow();
			expect(() => {
				parseSignDefinition({
					p12File: '',
					digestAlgorithm: 'SHA512',
				});
			}).toThrow();
			expect(() => {
				parseSignDefinition({
					p12File: '',
					digestAlgorithm: 'unknown',
				});
			}).toThrow();
		});
	});
	describe('parsing', () => {
		it("should return a parsed data with 'p12File' (with default values)", () => {
			expect(
				parseSignDefinition({ p12File: 'p12' })
			).toStrictEqual<ParsedSignDefinition>({
				p12File: 'p12',
				certSelect: CertificateSelectMode.Leaf,
				digestAlgorithm: 'sha256',
				password: undefined,
				timestampServer: undefined,
			});
		});
		it("should return a parsed data with 'privateKeyFile' and 'certificateFile' (with default values)", () => {
			expect(
				parseSignDefinition({
					privateKeyFile: 'key',
					certificateFile: 'cert',
				})
			).toStrictEqual<ParsedSignDefinition>({
				privateKeyFile: 'key',
				certificateFile: 'cert',
				certSelect: CertificateSelectMode.Leaf,
				digestAlgorithm: 'sha256',
				password: undefined,
				timestampServer: undefined,
			});
		});
		it("should return a parsed data with 'p12File' and 'certSelect'", () => {
			expect(
				parseSignDefinition({
					p12File: 'p12',
					certSelect: CertificateSelectMode.NoRoot,
				})
			).toStrictEqual<ParsedSignDefinition>({
				p12File: 'p12',
				certSelect: CertificateSelectMode.NoRoot,
				digestAlgorithm: 'sha256',
				password: undefined,
				timestampServer: undefined,
			});
		});
		it("should return a parsed data with 'p12File' and 'no password'", () => {
			expect(
				parseSignDefinition({ p12File: 'p12', password: undefined })
			).toStrictEqual<ParsedSignDefinition>({
				p12File: 'p12',
				certSelect: CertificateSelectMode.Leaf,
				digestAlgorithm: 'sha256',
				password: undefined,
				timestampServer: undefined,
			});
		});
		it("should return a parsed data with 'p12File' and 'empty password'", () => {
			expect(
				parseSignDefinition({ p12File: 'p12', password: '' })
			).toStrictEqual<ParsedSignDefinition>({
				p12File: 'p12',
				certSelect: CertificateSelectMode.Leaf,
				digestAlgorithm: 'sha256',
				password: '',
				timestampServer: undefined,
			});
		});
		it("should return a parsed data with 'p12File' and 'valid password'", () => {
			expect(
				parseSignDefinition({ p12File: 'p12', password: 'pass' })
			).toStrictEqual<ParsedSignDefinition>({
				p12File: 'p12',
				certSelect: CertificateSelectMode.Leaf,
				digestAlgorithm: 'sha256',
				password: 'pass',
				timestampServer: undefined,
			});
		});
		it("should return a parsed data with 'p12File' and 'digestAlgorithm'", () => {
			expect(
				parseSignDefinition({ p12File: 'p12', digestAlgorithm: 'sha1' })
			).toStrictEqual<ParsedSignDefinition>({
				p12File: 'p12',
				certSelect: CertificateSelectMode.Leaf,
				digestAlgorithm: 'sha1',
				password: undefined,
				timestampServer: undefined,
			});
			expect(
				parseSignDefinition({
					p12File: 'p12',
					digestAlgorithm: 'sha256',
				})
			).toStrictEqual<ParsedSignDefinition>({
				p12File: 'p12',
				certSelect: CertificateSelectMode.Leaf,
				digestAlgorithm: 'sha256',
				password: undefined,
				timestampServer: undefined,
			});
			expect(
				parseSignDefinition({
					p12File: 'p12',
					digestAlgorithm: 'sha512',
				})
			).toStrictEqual<ParsedSignDefinition>({
				p12File: 'p12',
				certSelect: CertificateSelectMode.Leaf,
				digestAlgorithm: 'sha512',
				password: undefined,
				timestampServer: undefined,
			});
		});
		it("should return a parsed data with 'p12File' and 'timestampServer'", () => {
			expect(
				parseSignDefinition({
					p12File: 'p12',
					timestampServer: 'server',
				})
			).toStrictEqual<ParsedSignDefinition>({
				p12File: 'p12',
				certSelect: CertificateSelectMode.Leaf,
				digestAlgorithm: 'sha256',
				password: undefined,
				timestampServer: 'server',
			});
		});
	});
});
