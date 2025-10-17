import { CertificateSelectMode } from '@/definitions/DefinitionData.js';
import {
	type CertLike,
	type ChainDataT,
	filterAndSortCertListByChain,
	makeChainList,
} from '@/signing/signUtil.js';

const DUMMY_CERT_1_A: CertLike = {
	issuer: { hash: 'a' },
	subject: { hash: 'a' },
};
const DUMMY_CERT_1_B: CertLike = {
	issuer: { hash: 'a' },
	subject: { hash: 'b' },
};
const DUMMY_CERT_1_C: CertLike = {
	issuer: { hash: 'b' },
	subject: { hash: 'c' },
};
const DUMMY_CERT_1_D: CertLike = {
	issuer: { hash: 'c' },
	subject: { hash: 'd' },
};
const DUMMY_CERT_2_A: CertLike = {
	issuer: { hash: 'A' },
	subject: { hash: 'A' },
};
const DUMMY_CERT_2_B: CertLike = {
	issuer: { hash: 'A' },
	subject: { hash: 'B' },
};

describe('signUtil', () => {
	describe('makeChainList', () => {
		const expectData1: ChainDataT<CertLike> = {
			subject: DUMMY_CERT_1_A.subject,
			bag: DUMMY_CERT_1_A,
			children: [
				{
					subject: DUMMY_CERT_1_B.subject,
					bag: DUMMY_CERT_1_B,
					children: [
						{
							subject: DUMMY_CERT_1_C.subject,
							bag: DUMMY_CERT_1_C,
							children: [
								{
									subject: DUMMY_CERT_1_D.subject,
									bag: DUMMY_CERT_1_D,
									children: [],
								},
							],
						},
					],
				},
			],
		};
		const expectData2: ChainDataT<CertLike> = {
			subject: DUMMY_CERT_2_A.subject,
			bag: DUMMY_CERT_2_A,
			children: [
				{
					subject: DUMMY_CERT_2_B.subject,
					bag: DUMMY_CERT_2_B,
					children: [],
				},
			],
		};
		it('should make chain list in any order #1', () => {
			expect(
				makeChainList<CertLike>([
					DUMMY_CERT_1_A,
					DUMMY_CERT_1_B,
					DUMMY_CERT_1_C,
					DUMMY_CERT_1_D,
				])
			).toStrictEqual<Array<ChainDataT<CertLike>>>([expectData1]);
		});
		it('should make chain list in any order #2', () => {
			expect(
				makeChainList<CertLike>([
					DUMMY_CERT_1_A,
					DUMMY_CERT_1_C,
					DUMMY_CERT_1_B,
					DUMMY_CERT_1_D,
				])
			).toStrictEqual<Array<ChainDataT<CertLike>>>([expectData1]);
		});
		it('should make chain list in any order #3', () => {
			expect(
				makeChainList<CertLike>([
					DUMMY_CERT_1_B,
					DUMMY_CERT_1_C,
					DUMMY_CERT_1_D,
					DUMMY_CERT_1_A,
				])
			).toStrictEqual<Array<ChainDataT<CertLike>>>([expectData1]);
		});
		it('should make chain list in any order #4', () => {
			expect(
				makeChainList<CertLike>([
					DUMMY_CERT_1_A,
					DUMMY_CERT_1_D,
					DUMMY_CERT_1_B,
					DUMMY_CERT_1_C,
				])
			).toStrictEqual<Array<ChainDataT<CertLike>>>([expectData1]);
		});
		it('should make chain list in any order #5', () => {
			expect(
				makeChainList<CertLike>([
					DUMMY_CERT_1_C,
					DUMMY_CERT_1_A,
					DUMMY_CERT_1_D,
					DUMMY_CERT_1_B,
				])
			).toStrictEqual<Array<ChainDataT<CertLike>>>([expectData1]);
		});
		it('should make chain list in any order #6', () => {
			expect(
				makeChainList<CertLike>([
					DUMMY_CERT_1_A,
					DUMMY_CERT_1_C,
					DUMMY_CERT_2_A,
					DUMMY_CERT_1_B,
					DUMMY_CERT_1_D,
					DUMMY_CERT_2_B,
				])
			).toStrictEqual<Array<ChainDataT<CertLike>>>([
				expectData1,
				expectData2,
			]);
		});
		it('should make chain list in any order #7', () => {
			expect(
				makeChainList<CertLike>([DUMMY_CERT_1_C, DUMMY_CERT_2_B])
			).toStrictEqual<Array<ChainDataT<CertLike>>>([
				{
					subject: DUMMY_CERT_1_C.subject,
					bag: DUMMY_CERT_1_C,
					children: [],
				},
				{
					subject: DUMMY_CERT_2_B.subject,
					bag: DUMMY_CERT_2_B,
					children: [],
				},
			]);
		});
	});
	describe('filterAndSortCertListByChain', () => {
		it('should make filtered and sorted list for Leaf mode', () => {
			expect(
				filterAndSortCertListByChain(
					[
						DUMMY_CERT_1_B,
						DUMMY_CERT_1_C,
						DUMMY_CERT_1_D,
						DUMMY_CERT_1_A,
					],
					CertificateSelectMode.Leaf
				)
			).toStrictEqual<CertLike[]>([DUMMY_CERT_1_D]);
		});
		it('should make filtered and sorted list for NoRoot mode #1', () => {
			expect(
				filterAndSortCertListByChain(
					[
						DUMMY_CERT_1_B,
						DUMMY_CERT_1_C,
						DUMMY_CERT_1_D,
						DUMMY_CERT_1_A,
					],
					CertificateSelectMode.NoRoot
				)
			).toStrictEqual<CertLike[]>([
				DUMMY_CERT_1_D,
				DUMMY_CERT_1_C,
				DUMMY_CERT_1_B,
			]);
		});
		it('should make filtered and sorted list for NoRoot mode #2', () => {
			expect(
				filterAndSortCertListByChain(
					[DUMMY_CERT_1_C, DUMMY_CERT_1_B, DUMMY_CERT_1_D],
					CertificateSelectMode.NoRoot
				)
			).toStrictEqual<CertLike[]>([
				DUMMY_CERT_1_D,
				DUMMY_CERT_1_C,
				DUMMY_CERT_1_B,
			]);
		});
		it('should make filtered and sorted list for All mode', () => {
			expect(
				filterAndSortCertListByChain(
					[
						DUMMY_CERT_1_B,
						DUMMY_CERT_1_C,
						DUMMY_CERT_1_D,
						DUMMY_CERT_1_A,
					],
					CertificateSelectMode.All
				)
			).toStrictEqual<CertLike[]>([
				DUMMY_CERT_1_D,
				DUMMY_CERT_1_C,
				DUMMY_CERT_1_B,
				DUMMY_CERT_1_A,
			]);
		});
	});
});
