'use strict';
//07/08/25

/* exported fooidUtils */

// Requires struct to be loaded
// var struct = require("struct");
if (typeof include !== 'undefined') {include('..\\structjs-1.0\\struct.js');} // Foobar2000
/* global struct:readable */

const fooidUtils = {
	FRAMES_PER_FP: 87,
	span: 25, // number of points to scan cross correlation over. 0 -> correlate = simpleCorrelate
	step: 1, // step size (in points) of cross correlation
	minOverlap: 20, // minimum number of points that must overlap in cross correlation
	threshold: 0.5, // report match when cross correlation has a peak exceeding threshold
	minThreshold: 0.4, // stop looking to different offsets when cross correlation has a peak below threshold
	maxThreshold: 1, // stop looking to different offsets when cross correlation has a peak exceeding threshold
	/*
		Main
	*/
	correlate: function correlate(fpSource, fpTarget) {
		if (!fpSource || !fpTarget || (!fpSource.length && !fpSource.byteLength) || (!fpTarget.length && !fpTarget.byteLength)) {return null;}
		// Accepts tag string but convert them to Uint8Array
		if (fpSource instanceof Uint8Array === false) {fpSource = this.base64DecToArr(fpSource);}
		if (fpTarget instanceof Uint8Array === false) {fpTarget = this.base64DecToArr(fpTarget);}
		const corr = this.compare(fpSource, fpTarget, this.span, this.step, this.maxThreshold, this.minThreshold);
		const maxCorr = this.getMaxCorr(corr, 'source', 'target', this.span, this.step);
		return maxCorr;
	},
	// Returns correlation without offset checking. Equal to setting span to zero
	simpleCorrelate: function simpleCorrelate(fpSource, fpTarget) {
		return this.correlation(fpSource, fpTarget);
	},
	// Restore default config
	restoreDefault: function restoreDefault() {
		this.span = 7;
		this.step = 1;
		this.minOverlap = 20;
		this.threshold = 0.5;
		this.minThreshold = 0.5;
		this.maxThreshold = 1;
	},
	/*
		Helpers
	*/
	// Returns the max correlation from the entire correlation array previously calculated
	getMaxCorr: function getMaxCorr(corr) {
		const maxCorrIdx = this.maxIndex(corr);
		return corr[maxCorrIdx];
	},
	// Cross correlate a and b with offsets from -span to span
	compare: function compare(a, b, span, step, maxThreshold, minThreshold) {
		if (span > Math.min(a.length, b.length)) {return;}
		const corrXY = [];
		// Add zero offset first to optimize comparison
		corrXY.push(this.crossCorrelation(a, b, 0));
		// Then the rest if there is no exact match
		if (corrXY[0] !== 1 && corrXY[0] >= minThreshold) {
			for (let offset = -span; offset <= span; offset += step) {
				if (!offset) {continue;}
				const val = this.crossCorrelation(a, b, offset);
				// Stop looking in a given direction if correlation decreases
				if (corrXY.slice(-10).reduce((acc, curr) => acc + (curr < val ? 0 : 1), 0) > 5) {break;}
				corrXY.push(val);
				if (val === 1 || val > maxThreshold || val < minThreshold) {break;}
			}
		}
		return corrXY;
	},
	// Return cross correlation, with b offset from list
	crossCorrelation: function crossCorrelation(a, b, offset) {
		if (offset > 0) {
			a = a.slice(offset);
			b = b.slice(0, a.length);
		} else if (offset < 0) {
			offset = -offset;
			b = b.slice(offset);
			a = a.slice(0, b.length);
		}
		if (Math.min(a.length, b.length) < this.minOverlap) {return;}
		return this.correlation(a.buffer, b.buffer);
	},
	// Returns correlation between lists at given position
	correlation: function correlation(aBuffer, bBuffer) {
		// Decode
		const {fits: fitSource, doms: domsSource, length} = this.decodeFrom(aBuffer);
		const {fits: fitTarget, doms: domsTarget} = this.decodeFrom(bBuffer);
		// sample rate / FFT size
		const ratio = 8000.0 / 8192.0;
		// frames in this fingerprint
		const frames = Math.min(this.FRAMES_PER_FP, Math.round((length * ratio) / 100.0));
		// maximum error possible given length
		const maxError = frames * ((9 * 16) + (0.25 * 63));
		let errorFit = 0, errorDom = 0;
		for (let i = 0; i < fitSource.length; i++) {
			errorFit += (fitSource[i] - fitTarget[i]) ** 2;
		}
		for (let i = 0; i < domsSource.length; i++) {
			errorDom += Math.abs(domsSource[i] - domsTarget[i]);
		}
		const error = errorFit + (errorDom / 4.0);
		const perc = 1 - (error / maxError);
		let corr = (perc - 0.5) * 2;
		corr = round(Math.max(corr, 0.0000), 4);
		return corr;
	},
	// Return index of maximum value in list
	maxIndex: function maxIndex(a) {
		let maxIdx = 0;
		let maxVal = a[0];
		a.forEach((value, i) => {
			if (value > maxVal) {
				maxVal = value;
				maxIdx = i;
			}
		});
		return maxIdx;
	},
	unpackFits: function unpackFits(buffer) {
		let i = 0;
		const fits = [];
		for (let byteBuff of buffer) {
			fits[i] = ((byteBuff >> 6) & 0x3);
			fits[i+1] = ((byteBuff >> 4) & 0x3);
			fits[i+2] = ((byteBuff >> 2) & 0x3);
			fits[i+3] = ((byteBuff >> 0) & 0x3);
			i += 4;
		}
		return fits;
	},
	unpackDoms: function unpackDoms(buffer) {
		let doms = [];
		for (let offset = 0; offset < buffer.length; offset += 3) {
			doms.push(
				buffer[offset+0] >> 2,
				((buffer[offset+0] & 0x3) << 4) | (buffer[offset+1] >> 4),
				((buffer[offset+1] & 0xF) << 2) | (buffer[offset+2] >> 6),
				buffer[offset+2] & 0x3F
			);
		}
		doms = doms.slice(0, this.FRAMES_PER_FP);
		return doms;
	},
	decodeFrom: function decodeFrom(fp) {
		const header = struct('<hIhh');
		const [, length, , ] = header.unpack_from(fp, 0);
		const fitStruct = struct('<348B');
		const fitData = fitStruct.unpack_from(fp, header.size);
		const domStruct = struct('<66B');
		const domData = domStruct.unpack_from(fp, header.size + fitStruct.size);
		const fits = this.unpackFits(fitData);
		const doms = this.unpackDoms(domData);
		return {length, fits, doms};
	},
	base64DecToArr: function base64DecToArr(sBase64, nBlocksSize){ // Used to convert fingerprint tags into buffer
		const sB64Enc = sBase64.replace(/[^A-Za-z0-9+/]/g, '');
		const nInLen = sB64Enc.length;
		const nOutLen = nBlocksSize ? Math.ceil((nInLen * 3 + 1 >> 2) / nBlocksSize) * nBlocksSize : nInLen * 3 + 1 >> 2;
		let taBytes = new Uint8Array(nOutLen);
		for (let nMod3, nMod4, nUint24 = 0, nOutIdx = 0, nInIdx = 0; nInIdx < nInLen; nInIdx++) {
			nMod4 = nInIdx & 3;
			nUint24 |= this.b64ToUint6(sB64Enc.charCodeAt(nInIdx)) << 6 * (3 - nMod4);
			if (nMod4 === 3 || nInLen - nInIdx === 1) {
				for (nMod3 = 0; nMod3 < 3 && nOutIdx < nOutLen; nMod3++, nOutIdx++) {
					taBytes[nOutIdx] = nUint24 >>> (16 >>> nMod3 & 24) & 255;
				}
				nUint24 = 0;
			}
		}
		return taBytes;
	},
	b64ToUint6: function b64ToUint6(nChr){
		return nChr > 64 && nChr < 91
			? nChr - 65
			: nChr > 96 && nChr < 123
				? nChr - 71
				: nChr > 47 && nChr < 58
					? nChr + 4
					: nChr === 43
						? 62
						: nChr === 47
							? 63
							: 0;
	}
};

// Helpers
if (typeof round === 'undefined') {
	var round = function round(floatNum, decimals){ // NOSONAR [global]
		let result;
		if (decimals > 0) {
			if (decimals === 15) {result = floatNum;}
			else {result = Math.round(floatNum * Math.pow(10, decimals)) / Math.pow(10, decimals);}
		} else {result =  Math.round(floatNum);}
		return result;
	};
}