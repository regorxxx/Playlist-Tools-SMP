'use strict';
//23/11/21

// TODO: optimize offset correlation checking if previously calculated correlations follow a trend
// stop looking in a given direction if correlation decreases. Should improve processing time
// while allowing higher span to be set.

const chromaPrintUtils = {
	span: 50, // number of points to scan cross correlation over. 0 -> correlate = simpleCorrelate
	step: 1, // step size (in points) of cross correlation
	min_overlap: 20, // minimum number of points that must overlap in cross correlation
	threshold: 0.5, // report match when cross correlation has a peak exceeding threshold
	minThreshold: 0.5, // stop looking to different offsets when cross correlation has a peak below threshold
	maxThreshold: 1, // stop looking to different offsets when cross correlation has a peak exceeding threshold
	/*
		Main
	*/
	// Returns max correlation between two fingerprint chromaprint arrays (int), trying all positions with offsets from -span to span 
	correlate: function correlate(fpSource, fpTarget) {
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
		this.span = 50;
		this.step = 1, 
		this.min_overlap = 20;
		this.threshold = 0.5;
		this.minThreshold = 0.5;
		this.maxThreshold = 1;
	},
	/*
		Helpers
	*/
	// Returns the max correlation from the entire correlation array previously calculated
	getMaxCorr: function getMaxCorr(corr, source, target, span, step) {
		const maxCorrIdx = this.maxIndex(corr);
		// First index is offset = 0, then it goes from -Span to + Span
		const maxCorrOffset = (maxCorrIdx === 0 ? 0 : - span + maxCorrIdx * (maxCorrIdx >= span + step ? step + 1 : step - 1));
		// const maxCorrOffset = -span + maxCorrIdx * step;
		// console.log("maxCorrIdx = ", maxCorrIdx, "maxCorrOffset = ", maxCorrOffset);
		// Report matches
		// if (corr[maxCorrIdx] > this.threshold) {
			// console.log(source,' and ', target, ' match with correlation of ',corr[maxCorrIdx],' at offset ', maxCorrOffset);
		// }
		return corr[maxCorrIdx];
	},
	// Cross correlate a and b with offsets from -span to span
	compare: function compare(a, b, span, step, maxThreshold, minThreshold) {
		if (span > Math.min(a.length, b.length)) {return [];}
		const corrXY = [];
		// Add zero offset first to optimize comparison
		corrXY.push(this.crossCorrelation(a, b, 0));
		// Then the rest if there is no exact match
		if (corrXY[0] !== 1 && corrXY[0] >= minThreshold) {
			for (let offset = -span; offset <= span; offset += step) {
				if (!offset) {continue;}
				const val = this.crossCorrelation(a, b, offset);
				corrXY.push(val);
				if (val === 1 || val > maxThreshold || val < minThreshold) {break;}
			}
		}
		return corrXY;
	},
	// Return cross correlation, with b offset from listx
	crossCorrelation: function crossCorrelation(a, b, offset) {
		if (offset > 0) {
			a = a.slice(offset);
			b = b.slice(0, a.length);
		} else if (offset < 0) {
			offset = -offset
			b = b.slice(offset);
			a = a.slice(0, b.length);
		}
		if (Math.min(a.length, b.length) < this.min_overlap) {return;}
		return this.correlation(a, b);
	},
	// Returns correlation between lists at given position
	correlation: function correlation(a, b) {
		let aLen = a.length;
		let bLen = b.length;
		let totalBits = aLen;
		// Trim to shortest
		if (aLen !== bLen) {
			const shortest = Math.min(aLen, bLen);
			const longest = Math.max(aLen, bLen);
			if (aLen > shortest) {a = a.slice(0, shortest);}
			if (bLen > shortest) {b = b.slice(0, shortest);}
			aLen = bLen = shortest;
			// Extra bits count as different
			totalBits = longest;
		}
		let covariance = 0;
		const meanA = a.reduce((total, current) => {return total + current}, 0) / aLen;
		const meanB = b.reduce((total, current) => {return total + current}, 0) / bLen;
		for (let i = 0; i < aLen; i++) {
			covariance += Math.abs((a[i] - meanA) * (b[i] - meanB));
		}
		covariance = covariance / totalBits;
		covariance = round(covariance / (Math.sqrt(this.variance(a, aLen, meanA) * this.variance(b, bLen, meanB))), 4);
		return covariance;
	},
	// returns variance of list
	variance: function variance(a, aLen = a.length, meanA = a.reduce((total, current) => {return total + current}, 0) / aLen) {
		// # get mean of x^2
		let meanA_sqr = 0;
		a.forEach((x) => {meanA_sqr += x ** 2;});
		meanA_sqr = meanA_sqr / aLen;
		return meanA_sqr - meanA ** 2;
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
	}
}

// Helpers
if (typeof round === 'undefined') {
	var round = function round(floatnum, decimals){
		let result;
		if (decimals > 0) {
			if (decimals === 15) {result = floatnum;}
			else {result = Math.round(floatnum * Math.pow(10, decimals)) / Math.pow(10, decimals);}
		} else {result =  Math.round(floatnum);}
		return result;
	};
}