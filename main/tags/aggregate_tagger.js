'use strict';
//06/09/25

/* exported aggregateTagger */

include('..\\..\\helpers\\helpers_xxx.js');
/* global popup:readable */
include('..\\..\\helpers\\helpers_xxx_file.js');
/* global WshShell:readable */
include('..\\..\\helpers\\helpers_xxx_prototypes.js');
/* global _p:readable, round:readable */


/**
 * Aggregates tag values from a handle list from source tag and writes the results to destination tag. Different modes can be set like averaging, summing, etc. NaN values for source tag and count TF expressions are replaced with zeros, missing values -only for source tag- with the default value set at options.
 *
 * @function
 * @name aggregateTagger
 * @kind function
 * @param {FbMetadbHandleList} handleList
 * @param {string} source - ['[%RATING]'] Tag source for computation.
 * @param {string} destination - ['ALBUMRATING'] Tag destination for writing.
 * @param {string} group - ['%ALBUM ARTIST%|%ALBUM%|%DATE%|%COMMENT%'] TF expression to group tracks for computation.
 * @param {string|number} count - [1] TF expression to count every element. May be used to compute averages by total length instead of number of tracks.
 * @param {object} options - Aggregation settings.
 * @param {number} options.round - Round destination tag value to n digits.
 * @param {boolean} options.bAsk - Ask before tagging files. Can be used to just display the report.
 * @param {'average|sum|count'} options.mode - Aggregation mode for destination tag.
 * @param {number|null} options.defaultVal - Value used when source tag is missing. Setting it to null will just skip counting that value for all purposes.
 * @returns {{results: {group: string, avg: Number, sum: Number, count: Number}[], handleList: FbMetadbHandleList, tags: {[destination]: Number}[]}}
 */
function aggregateTagger(handleList, source = '[%RATING%]', destination = 'ALBUMRATING', group = '%ALBUM ARTIST%|%ALBUM%|%DATE%|%COMMENT%', count = 1, options = { round: 2, bAsk: true, mode: 'average', defaultVal: 0 }) {
	options = { round: 2, bAsk: true, mode: 'average', defaultVal: 0, ...(options || {}) };
	const groupTF = fb.TitleFormat(group);
	const sourceTF = fb.TitleFormat(source);
	const countTF = fb.TitleFormat(count);
	const bCountNumber = typeof count === 'number';
	const destinationArr = [];
	const results = [];
	const clone = handleList.Clone();
	clone.OrderByFormat(groupTF, 0);
	const total = clone.Count - 1;
	let currGroup, prevGroup, sum = 0, countTotal = 0, avg, val;
	clone.Convert().forEach((handle, i) => {
		currGroup = groupTF.EvalWithMetadb(handle);
		if (i === 0) { prevGroup = currGroup; }
		if (currGroup === prevGroup) {
			val = sourceTF.EvalWithMetadb(handle) || options.defaultVal;
			if (val !== null) {
				sum += Number(val) || 0;
				countTotal += bCountNumber ? count : (Number(countTF.EvalWithMetadb(handle)) || 0);
			}
		}
		if (currGroup !== prevGroup || total === i) {
			avg = sum / (countTotal || 1);
			switch (options.mode.toLowerCase()) {
				case 'average': val = round(avg, options.round).toFixed(options.round); break;
				case 'sum': val = round(sum, options.round).toFixed(options.round); break;
				case 'count': val = countTotal; break;
			}
			let j = destinationArr.length;
			while (j < i || j === total) {
				destinationArr.push({ [destination]: val });
				j++;
			}
			results.push({ group: prevGroup, avg, sum, count: countTotal, val });
			prevGroup = currGroup;
			val = sourceTF.EvalWithMetadb(handle) || options.defaultVal;
			if (val !== null) {
				countTotal = bCountNumber ? count : (Number(countTF.EvalWithMetadb(handle)) || 0);
				sum = Number(val) || 0;
			}
		}
	});
	const title = 'Aggregate tagging ' + _p(options.mode.toLowerCase()) + ': ' + source + ' -> ' + destination;
	fb.ShowPopupMessage(results.map((result) => result.group + ' ' + _p(result.count) + ' -> ' + result.val).join('\n'), title);
	const answer = options.bAsk && destination && destination.length
		? WshShell.Popup('Check report. Save tag to files?', 0, title, popup.question + popup.yes_no)
		: popup.yes;
	if (answer === popup.yes) { clone.UpdateFileInfoFromJSON(JSON.stringify(destinationArr)); }
	return { results, handleList: clone, tags: destinationArr };
}