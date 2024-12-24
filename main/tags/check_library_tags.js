'use strict';
//23/12/24

/*
	Check Library Tags
	Checks all tag values from selected tracks for spelling errors or misplacing values in wrong tags.
	First checks all tags for easily recognizable errors (empty tags, blank spaces, multivalued tags not split).
	Then selects tags with lower freq. of apparition ('freqThreshold') (*), and filters them to a max
	of 30 values ('maxSizePerTag') per tag. Finally all these values are compared to the entire tag value list,
	for any tag, and their similarity is computed. Anything being at least 85% ('stringSimilThreshold') similar
	is considered as an alternative value. If 'maxSizePerTag' is set to zero, then only recognizable errors are shown.
	Since it is not only checking that tagA's value (rock) is misspelled (Rock) but that it may be at TagB instead,
	the script checks for both spelling and misplacing errors.

	There is an additional step to check against am user-provided dictionary. 'en_US' dictionary is provided for
	demonstration purposes, but since every user may use their own words it should be configured.
	Also note random deviations from common words are covered by freq. filtering, more or less.
	Excluding tags to be check against dictionary greatly speeds up the process. For example for composers, etc.

	(*) The rationale is simple. Minor lexical errors on the values are expected to happen only from time to time.
	That implies there could be a 'right value', with much higher freq. of apparition, which may be known or not.
	Which values are lexical errors and which ones are 'right values' is done only by freq. comparison:

	Notes:
		- False positives are expected. I.e. a rare tag only present on a few tracks on the library, may be considered
		as 'possible error' but without a known 'right value' as alternative.

		- False positives are easily recognizable. Alternative values are usually reported, if a positive has no
		alternative value, then it should be pretty easy to see if it's a real error or not. Rare tags may be added
		to the exclusion list for that purpose.

		- False negatives are possible. If you write systematically a wrong tag value in your tracks then,
		by freq. comparison, that value would be considered to be right. It may be 'Rockj' in your entire library.
		A track with 'Rock', would be reported as the wrong value. A check against a dictionary would be required
		to catch those errors, so that's left to the user responsibility.

		- False negatives are hard to recognize. Since they are not a random (low freq.) error , but a systematic one,
		the only way to recognize them is to use your logic. Using the previous example, one should notice
		that the right value is the reported one. Setting 'freqThreshold' to 1 and 'maxSizePerTag' to Infinity
		would compare the tags for the entire library, creating a really long report that could be used to find
		these errors (if there are at least 2 tags with similar enough values).

		- Execution time is: O((#tags to check * mean #tag values * #tracks)**2)
		Since the number of tags to check and the tag values mean is constant for a given library, only the number
		of tracks can be adjusted to reduce the total number of tags to compare. Therefore, it takes more time to check
		all tracks setting freqThreshold = 1 and maxSizePerTag = Infinity, than checking against dictionary with
		standard parameters (where #tags is 30 * #tags to check).
		It can also be greatly reduced adding tag values to the exclusion list, after a few reports, it should be pretty
		easy to add up to 90% of tags/tag values to the list, greatly speeding up future reports (less tags to check).
 */

/* exported checkTags, addTagsToExclusion */

include('..\\..\\helpers\\helpers_xxx.js');
/* global folders:readable, iStepsLibrary:readable, iDelayLibrary:readable, popup:readable, globTags:readable */
include('..\\..\\helpers\\helpers_xxx_file.js');
/* global _isFile:readable, utf8:readable, _open:readable, WshShell:readable, _jsonParseFileCheck:readable, _save:readable */
include('..\\..\\helpers\\helpers_xxx_properties.js');
/* global setProperties:readable, getPropertyByKey:readable, getPropertiesPairs:readable */
include('..\\..\\helpers\\helpers_xxx_prototypes.js');
/* global isString:readable, isStringWeak:readable, isBoolean:readable, _asciify:readable */
include('..\\..\\helpers\\helpers_xxx_tags.js');
/* global getHandleListTagsV2:readable */
include('..\\..\\helpers\\helpers_xxx_levenshtein.js');
/* global similarity:readable */
include('..\\..\\helpers-external\\typo\\typo.js'); // Dictionary helper: https://github.com/cfinke/Typo.js
/* global Typo:readable */
/* global music_graph_descriptors:readable */

const checkTags_properties = {
	tagNamesToCheck: ['Tags to be checked (\'tag name,...\')', [globTags.genre, globTags.style, globTags.mood, globTags.composer, globTags.titleRaw, 'INVOLVEDPEOPLE', 'ALBUM'].join(',')],
	tagsToCompare: ['Tags to compare against (\'tag name,...\')', [[globTags.genre, globTags.style].join(','), [...new Set([globTags.composer, globTags.artistRaw, 'ARTIST', 'INVOLVEDPEOPLE'])]].join(';')],
	tagValuesExcludedPath: ['File listing tag values to be excluded', (_isFile(fb.FoobarPath + 'portable_mode_enabled') ? '.\\profile\\' : fb.ProfilePath) + folders.dataName + 'check_library_tags_exclusion.json'],
	tagNamesExcludedDic: ['Tags to be excluded at dictionary checking (\'tag name,...\')', [...new Set([globTags.composer, globTags.titleRaw, globTags.artistRaw, 'INVOLVEDPEOPLE', 'ARTIST', 'ALBUM'])].join(',')],
	bAskForConfigTags: ['Enables popup asking to config excluded tags', false],
	bUseDic: ['Enables dictionary checking for every tag value (slow!)', false],
	dictName: ['Dictionary name (available: de_DE, en_GB, en_US, fr_FR)', 'en_US'],
	dictPath: ['Path to all dictionaries', (_isFile(fb.FoobarPath + 'portable_mode_enabled') ? folders.xxx.replace(fb.ProfilePath, '.\\profile\\') : folders.xxx) + 'helpers-external\\typo\\dictionaries'],
	bUseGraphGenres: ['Use genre checking on Graph', false],
};
checkTags_properties['tagNamesToCheck'].push({ func: isString }, checkTags_properties['tagNamesToCheck'][1]);
checkTags_properties['tagsToCompare'].push({ func: isStringWeak }, checkTags_properties['tagsToCompare'][1]);
checkTags_properties['tagValuesExcludedPath'].push({ func: isString, portable: true }, checkTags_properties['tagValuesExcludedPath'][1]);
checkTags_properties['tagNamesExcludedDic'].push({ func: isStringWeak }, checkTags_properties['tagNamesExcludedDic'][1]);
checkTags_properties['dictName'].push({ func: isString }, checkTags_properties['dictName'][1]);
checkTags_properties['dictPath'].push({ func: isString, portable: true }, checkTags_properties['dictPath'][1]); // No need for a popup since the default dic will always be there
checkTags_properties['bUseGraphGenres'].push({ func: isBoolean }, checkTags_properties['bUseGraphGenres'][1]);
var checkTags_prefix = 'ct_'; // NOSONAR

// Load dictionary
const dictSettings = {
	dictName: checkTags_properties['dictName'][1],
	dictPath: checkTags_properties['dictPath'][1],
	affPath() { return this.dictPath + '\\' + this.dictName + '\\' + this.dictName + '.aff'; },
	dicPath() { return this.dictPath + '\\' + this.dictName + '\\' + this.dictName + '.dic'; },
};
var dictionary; // NOSONAR

if (typeof buttonsBar === 'undefined' && typeof bNotProperties === 'undefined') { // Merge all properties when not loaded along buttons
	// With const var creating new properties is needed, instead of reassigning using A = {...A,...B}
	setProperties(checkTags_properties, checkTags_prefix);
	if (getPropertyByKey(checkTags_properties, 'bUseDic', checkTags_prefix)) {
		if (_isFile(dictSettings.dicPath()) && _isFile(dictSettings.affPath())) {
			dictionary = new Typo(dictSettings.dictName, _open(dictSettings.affPath()), _open(dictSettings.dicPath()));
		} else { fb.ShowPopupMessage('Dictionary path not found:\n' + dictSettings.dicPath() + '\n' + dictSettings.affPath(), window.Name); }
	}
} else {  // With buttons, set these properties only once per panel
	dictionary = new Typo(); // Load dict later at first use
}

function checkTags({
	selItems = plman.GetPlaylistSelectedItems(plman.ActivePlaylist),
	properties = getPropertiesPairs(checkTags_properties, checkTags_prefix),
	freqThreshold = 0.2, // Any tag value appearing lower than this value in % is considered as 'possible error'
	maxSizePerTag = 30, // From the previous pool, only the first X values are shown
	stringSimilThreshold = 0.85, // How much tag values must be similar to be considered as alternative values
	bUseDic = properties['bUseDic'][1],
	bUseGraphGenres = properties['bUseGraphGenres'][1],
	iSteps = iStepsLibrary, iDelay = iDelayLibrary, // Async processing ~ x1.4 time required
	bDeDup = true, // Changes original handleList
	bAsync = true,
	bProfile = false
} = {}) {
	const profiler = bProfile ? new FbProfiler('checkTags...') : null;
	if (typeof selItems === 'undefined' || selItems === null || selItems.Count === 0) {
		return (bAsync ? Promise.resolve(false) : false);
	}
	if (bDeDup) { selItems.Sort(); }
	if (freqThreshold > 1 || freqThreshold < 0) { freqThreshold = 1; }
	if (stringSimilThreshold > 1 || stringSimilThreshold < 0) { stringSimilThreshold = 1; }
	if (maxSizePerTag < 0) { maxSizePerTag = Infinity; }
	if (typeof music_graph_descriptors === 'undefined') { bUseGraphGenres = false; }
	// Load dictionary if required (and not loaded previously)
	if (bUseDic) {
		if (dictionary.dictionary !== properties['dictName'][1]) {
			dictSettings['dictName'] = properties['dictName'][1];
			dictSettings['dictPath'] = properties['dictPath'][1];
			if (_isFile(dictSettings.dicPath()) && _isFile(dictSettings.affPath())) {
				dictionary = new Typo(dictSettings.dictName, _open(dictSettings.affPath()), _open(dictSettings.dicPath()));
				// Warn if not found
			} else { fb.ShowPopupMessage('Dictionary path not found:\n' + dictSettings.dicPath() + '\n' + dictSettings.affPath(), window.Name); return; }
		} else if (!_isFile(dictSettings.dicPath()) || !_isFile(dictSettings.affPath())) {
			fb.ShowPopupMessage('Dictionary path not found:\n' + dictSettings.dicPath() + '\n' + dictSettings.affPath(), window.Name); return;
		}
	}
	// Constants
	const popupTitle = 'Tags Report'; // Window title for the popups
	const keySplit = '***'; // For the map

	// Skipped values at pre-filter
	const tagValuesExcluded = loadTagsExcluded(properties['tagValuesExcludedPath'][1]); // i x k sets

	const tagsToCheck = Array.from(new Set(properties['tagNamesToCheck'][1].split(',').filter(Boolean)), (s) => s.toLowerCase()); // i, filter holes and remove duplicates
	if (!tagsToCheck.length) {
		fb.ShowPopupMessage('There are no tags to check set at properties panel', popupTitle);
		return (bAsync ? Promise.resolve(false) : false);
	}
	const tagsToCompare = properties['tagsToCompare'][1].split(';').filter(Boolean).map((tag) => { return [...new Set(tag.toLowerCase().split(',').filter(Boolean))]; }); // filter holes and remove duplicates
	const tagsToCompareMap = new Map();
	if (tagsToCompare.length) {
		tagsToCompare.forEach((arr) => {
			arr.forEach((tag, _, thisArr) => {
				if (!tagsToCompareMap.has(tag)) { tagsToCompareMap.set(tag, new Set(thisArr)); }
				else { tagsToCompareMap.set(tag, tagsToCompareMap.get(tag).union(new Set(thisArr))); }
			});
		});
	}
	if (!bAsync || !iSteps || iSteps === 1 || iDelay === 0) {
		// Get all tags and their frequency
		const tags = checkTagsRetrieve(selItems, tagsToCheck, Array.from({ length: tagsToCheck.length }, () => []));
		const count = Array.from({ length: tags.length }, () => new Map()); // i x j x k
		tags.forEach((tagArray, i) => { // i
			checkTagsCount(tagArray, count, i);
		});
		const [countArray, countArrayFiltered] = checkTagsFilter(tagsToCheck, count, freqThreshold, tagValuesExcluded, maxSizePerTag);
		// Find possible alternatives (misplacing and misspelling) or other errors to report
		let alternativesMap = new Map();
		const tagNamesExcludedDic = properties['tagNamesExcludedDic'][1].split(',').map((s) => s.toLowerCase()); // Don't check these against dictionary
		if (countArray.length && countArrayFiltered.length) {
			tagsToCheck.forEach((tagA, indexA) => {
				const bCompare = tagsToCompareMap.has(tagA);
				const toCompareWith = bCompare ? tagsToCompareMap.get(tagA) : null;
				countArrayFiltered[indexA].forEach((tagValueA) => {
					checkTagsCompare(tagA, keySplit, tagValueA, alternativesMap, bCompare, tagsToCheck, toCompareWith, countArray, indexA, stringSimilThreshold, bUseDic, tagNamesExcludedDic, dictionary);
				});
			});
		}
		setTimeout(() => {
			checkTagsReport(tagsToCheck, countArrayFiltered, keySplit, alternativesMap, popupTitle, properties, tagValuesExcluded);
			if (bProfile) { profiler.Print(); }
		}, 500);
		return true;
	} else {
		// Get all tags and their frequency
		return new Promise(resolve => {
			const promises = [];
			const items = selItems.Convert();
			const count = items.length;
			const range = Math.round(count / iSteps);
			const delay = iDelay / 4;
			let tags = Array.from({ length: tagsToCheck.length }, () => []);
			let prevProgress = -1;
			for (let i = 1; i <= iSteps; i++) {
				promises.push(new Promise(resolve => {
					setTimeout(() => {
						const items_i = new FbMetadbHandleList(items.slice((i - 1) * range, i === iSteps ? count : i * range));
						tags = checkTagsRetrieve(items_i, tagsToCheck, tags);
						const progress = Math.round(i / iSteps * 10) * 10;
						if (progress > prevProgress) { prevProgress = progress; console.log('Retrieving tags ' + progress + '%.'); }
						resolve();
					}, delay * i);
				}));
			}
			Promise.all(promises).then(() => {
				resolve(tags);
			});
		})
			.then(tags => {
				return new Promise(resolve => {
					const promises = [];
					const count = Array.from({ length: tags.length }, () => new Map()); // i x j x k
					const delay = iDelay / 50;
					tags.forEach((tagArray, i) => { // i
						promises.push(new Promise(resolve => {
							setTimeout(() => {
								checkTagsCount(tagArray, count, i);
								resolve();
							}, delay * i);
						}));
					});
					Promise.all(promises).then(() => {
						resolve(count);
					});
				});
			})
			.then(count => {
				const [countArray, countArrayFiltered] = checkTagsFilter(tagsToCheck, count, freqThreshold, tagValuesExcluded, maxSizePerTag);
				return { countArray, countArrayFiltered };
			})
			.then(({ countArray, countArrayFiltered }) => {
				return new Promise(resolve => {
					// Find possible alternatives (misplacing and misspelling) or other errors to report
					let alternativesMap = new Map();
					const tagNamesExcludedDic = properties['tagNamesExcludedDic'][1].split(','); // Don't check these against dictionary
					const promises = [];
					// Get node list (+ weak substitutions + substitutions + style cluster)
					const nodeList = bUseGraphGenres
						? new Set(music_graph_descriptors.style_supergenre.flat(Infinity)).union(new Set(music_graph_descriptors.style_weak_substitutions.flat(Infinity))).union(new Set(music_graph_descriptors.style_substitutions.flat(Infinity))).union(new Set(music_graph_descriptors.style_cluster.flat(Infinity))).union(music_graph_descriptors.map_distance_exclusions)
						: null;
					if (countArray.length && countArrayFiltered.length) {
						const total = tagsToCheck.length - 1;
						let prevProgress = -1;
						tagsToCheck.forEach((tagA, indexA) => {
							const bCompare = tagsToCompareMap.has(tagA);
							const toCompareWith = bCompare ? tagsToCompareMap.get(tagA) : null;
							const totalA = countArrayFiltered[indexA].length - 1;
							const delay = bCompare ? (totalA + 1) * (toCompareWith.size ** 2) / 150 * iDelay / 100 : (totalA + 1) / 1000 * iDelay / 100;
							const isGenre = /.*(genre|style).*/i;
							countArrayFiltered[indexA].forEach((tagValueA, i) => {
								promises.push(new Promise(resolve => {
									setTimeout(() => {
										checkTagsCompare(tagA, keySplit, tagValueA, alternativesMap, bCompare, tagsToCheck, toCompareWith, countArray, indexA, stringSimilThreshold, bUseDic, tagNamesExcludedDic, dictionary, isGenre.test(tagA) ? nodeList : null);
										const progress = Math.round(((totalA ? i : 1) * (total ? indexA : 1)) / ((total || 1) * (totalA || 1)) * 10) * 10;
										if (progress > prevProgress) { prevProgress = progress; console.log('Checking tags ' + progress + '%.'); }
										resolve();
									}, delay * i);
								}));
							});
						});
					} else { promises.push(new Promise.resolve('empty')); }
					Promise.all(promises).then(() => {
						resolve({ countArrayFiltered, alternativesMap });
					});
				});
			}).then(({ countArrayFiltered, alternativesMap }) => {
				setTimeout(() => {
					checkTagsReport(tagsToCheck, countArrayFiltered, keySplit, alternativesMap, popupTitle, properties, tagValuesExcluded);
					if (bProfile) { profiler.Print(); }
				}, 500);
				return true;
			});
	}
}

/*
	Sync code
*/
function checkTagsRetrieve(items, tagsToCheck, tags) {
	const newTags = getHandleListTagsV2(items, tagsToCheck, { bEmptyVal: true });
	tags = tags.map((arr, i) => { return arr.concat(newTags[i]); });
	return tags;
}

function checkTagsCount(tagArray, count, i) {
	tagArray.forEach((tagValueArray) => { //j
		tagValueArray.forEach((tagValue) => { //k
			if (count[i].has(tagValue)) {
				count[i].set(tagValue, count[i].get(tagValue) + 1);
			} else {
				count[i].set(tagValue, 1);
			}
		});
	});
}

function checkTagsFilter(tagsToCheck, count, freqThreshold, tagValuesExcluded, maxSizePerTag) {
	// Sort by frequency
	let countArray = []; // i x k
	let countArrayThreshold = []; // i
	tagsToCheck.forEach((tag, index) => { // i
		let maxFreq = 0;
		countArray.push([...count[index]].sort(function (a, b) { // k
			maxFreq = Math.max(maxFreq, a[1]);
			return a[1] - b[1];
		}));
		countArrayThreshold.push(Math.floor(maxFreq * freqThreshold));
	});
	// Pre-filter with exclusions
	let countArrayPre = []; // i x k
	if (countArray.length) {
		tagsToCheck.forEach((tag, index) => {
			if (Object.hasOwn(tagValuesExcluded, tag)) {
				countArrayPre[index] = countArray[index].filter((pair) => { return !tagValuesExcluded[tag].has(pair[0]); });
			} else { countArrayPre[index] = countArray[index]; }
		});
	}
	// Filter results by identified errors and frequency
	let countArrayFiltered = []; // i x k
	if (countArrayPre.length) {
		tagsToCheck.forEach((tag, index) => {
			countArrayFiltered[index] = [];
			// Add any identified errors first without considering freq. filter
			countArrayPre[index].forEach((tagValue) => {
				let bError = false;
				if (!tagValue[0].length) { bError = true; }
				else if (!tagValue[0].trim().length) { bError = true; } // NOSONAR
				else if (tagValue[0].trim().length !== tagValue[0].length) { bError = true; } // NOSONAR
				else if (tagValue[0] === '?') { bError = true; } // NOSONAR
				else if (tag !== 'title' && tag !== 'album') {
					if (tagValue[0].includes(';')) { bError = true; } // NOSONAR
					else if (tagValue[0].includes(',')) { bError = true; } // NOSONAR
					else if (tagValue[0].includes('/')) { bError = true; } // NOSONAR
				} else if (tag !== 'title') {
					if (tagValue[0].includes('  ')) { bError = true; } // NOSONAR
				}
				if (bError) { countArrayFiltered[index].push(tagValue); }
			});
			// Then all tags according to freq. filter (excluding previously added ones)
			if (freqThreshold === 1 && !isFinite(maxSizePerTag)) { // When forced to check all tags, just push them all
				countArrayPre[index].forEach((tagValue) => {
					if (!countArrayFiltered[index].includes(tagValue)) { countArrayFiltered[index].push(tagValue); }
				});
			} else {
				let breakPoint = -1; // May be entire array or a small subset according to the threshold
				if (freqThreshold === 1) { breakPoint = countArrayPre[index][countArrayPre[index].length - 1]; }
				else { breakPoint = countArrayPre[index].indexOf(countArrayPre[index].find((tag) => { return tag[1] >= countArrayThreshold[index]; })); }
				if (breakPoint !== -1) {
					if (breakPoint > maxSizePerTag) { breakPoint = maxSizePerTag; }
					countArrayPre[index].slice(0, breakPoint).forEach((tagValue) => {
						if (!countArrayFiltered[index].includes(tagValue)) { countArrayFiltered[index].push(tagValue); }
					});
				}
			}
		});
	}
	return [countArray, countArrayFiltered];
}

function checkTagsCompare(tagA, keySplit, tagValueA, alternativesMap, bCompare, tagsToCheck, toCompareWith, countArray, indexA, stringSimilThreshold, bUseDic, tagNamesExcludedDic, dictionary, nodeList = null) { // NOSONAR
	// Identified errors first (same checks at freq. filtering step)
	const tagKey = tagA + keySplit + tagValueA[0];
	if (!tagValueA[0].length) { alternativesMap.set(tagKey, 'Tag set to empty value (breaks queries!)'); }
	else if (!tagValueA[0].trim().length) { alternativesMap.set(tagKey, 'Tag set to blank space(s)'); }
	else if (tagValueA[0].trim().length !== tagValueA[0].length) { alternativesMap.set(tagKey, 'Tag has blank space(s) at the extremes'); }
	else if (tagValueA[0] === '?') { alternativesMap.set(tagKey, 'Tag not set'); }
	else if (tagA !== 'title' && tagValueA[0].includes('  ')) { alternativesMap.set(tagKey, 'Tag has consecutive blank spaces (instead of one)'); }
	else if (tagA !== 'title' && tagValueA[0].includes(';')) { alternativesMap.set(tagKey, 'Possible multivalue tag not split'); }
	else if (tagA !== 'title' && tagValueA[0].includes(',')) { alternativesMap.set(tagKey, 'Possible multivalue tag not split'); }
	else if (tagA !== 'title' && tagValueA[0].includes('/')) { alternativesMap.set(tagKey, 'Possible multivalue tag not split'); }
	else if (nodeList !== null && !nodeList.has(_asciify(tagValueA[0]))) { alternativesMap.set(tagKey, 'Missing tag on Music Graph descriptors'); }
	else if (bCompare) { // Compare all values to find misplaced (other tag) and misspelled values (same/other tag)
		let similValues = [];
		tagsToCheck.forEach((tagB, indexB) => {
			if (toCompareWith.has(tagB)) {
				countArray[indexB].forEach((tagValueB) => {
					if (indexB === indexA && tagValueB[0] !== tagValueA[0]) { // When comparing the same tag, calc similarity (and skip the same value)
						if (similarity(tagValueA[0], tagValueB[0]) >= stringSimilThreshold) {
							similValues.push(tagValueB[0]);
						}
					} else if (indexB !== indexA && tagValueB[0] === tagValueA[0]) { // When comparing to other tags, check for simple matching
						similValues.push(tagValueB[0] + ' (as ' + tagB + ')');
					} else if (indexB !== indexA && tagValueB[0] !== tagValueA[0]) { // and similarity
						if (similarity(tagValueA[0], tagValueB[0]) >= stringSimilThreshold) {
							similValues.push(tagValueB[0] + ' (as similar ' + tagB + ')');
						}
					}
				});
			}
		});
		// If no error found yet, compare against dictionary
		if (bUseDic && !tagNamesExcludedDic.includes(tagA) && !similValues.length) {
			tagValueA[0].split(' ').forEach((word, index, array) => {
				if (!dictionary.check(word)) {
					const dicSuggest = dictionary.suggest(word);
					if (dicSuggest.length) {
						dicSuggest.forEach((suggestion) => { // Filter suggestions with similarity threshold
							if (similarity(word, suggestion) >= stringSimilThreshold) {
								// Reconstruct tag value with new suggestion
								const numTerms = array.length;
								if (numTerms === 1) { // may be a tag value with one word
									// suggestion = suggestion;
								} else { // or multiple words
									if (index === 0) { // NOSONAR
										suggestion = suggestion + ' ' + array.slice(index + 1, numTerms);
									} else if (index < array.length - 1) {
										suggestion = array.slice(0, index) + ' ' + suggestion + ' ' + array.slice(index + 1, numTerms);
									} else {
										suggestion = array.slice(0, index) + ' ' + suggestion;
									}
								}
								similValues.push(suggestion + ' (on dictionary)');
							}
						});
					}
				}
			});
		}
		if (similValues.length) { alternativesMap.set(tagKey, similValues); }
	}
}

function checkTagsReport(tagsToCheck, countArrayFiltered, keySplit, alternativesMap, popupTitle, properties, tagValuesExcluded) {
	// Report popups
	// First part - Tags errors
	let textA = 'List of values with lowest frequency of apparition.\n' +
		'Some of them may be misspelled (1) or misplaced (2).\n' +
		'(1) Whenever a possible match is found, it\'s shown at right (-->).\n' +
		'(2) If the match is from another tag, then it\'s shown between parenthesis.\n' +
		'(3) Any other identified error, it\'s shown at right too (-->)\n\n';
	tagsToCheck.forEach((tag, index) => {
		textA += '------------------\n';
		textA += tag.toUpperCase() + ':\n';
		textA += '------------------\n';
		if (countArrayFiltered.length) {
			countArrayFiltered[index].forEach((pair) => {
				const tagKey = tag + keySplit + pair[0];
				if (alternativesMap.has(tagKey)) { // Add alternative terms and error comments if possible
					const altTerms = alternativesMap.get(tagKey);
					textA += pair + ' --> ' + (Array.isArray(altTerms) ? altTerms.join(', ') : altTerms) + '\n';
				} else {
					textA += pair + '\n';
				}
			});
		}
		textA += '\n\n';
	});
	textA += '------------------------------------------------------\n';
	textA += '------------------------------------------------------\n';
	// Second part - Pairs of tags
	let textB = 'List of pairs of tags from the report (tag,value;...).\n' +
		'Ready to be copied to exclusions window or properties panel.\n' +
		'In any case you must check them one by one, and only add those needed.\n\n';
	let rightTagsText = '', reportTagsText = '';
	tagsToCheck.forEach((tag, index) => {
		rightTagsText += tag.toUpperCase() + ':\n';
		reportTagsText += tag.toUpperCase() + ':\n';
		let rightPairsText = '', reportPairsText = '';
		if (countArrayFiltered.length) {
			countArrayFiltered[index].forEach((pair) => {
				const tagKey = tag + keySplit + pair[0];
				if (alternativesMap.has(tagKey)) {
					reportPairsText += (reportPairsText.length ? ';' : '') + tag.toUpperCase() + ',' + pair[0];
				} else {
					rightPairsText += (rightPairsText.length ? ';' : '') + tag.toUpperCase() + ',' + pair[0];
				}
			});
		}
		rightTagsText += rightPairsText + '\n\n';
		reportTagsText += reportPairsText + '\n\n';
	});
	rightTagsText = '(1) Values without problems identified:\n' + rightTagsText;
	reportTagsText = '(2) Values with problems reported:\n' + reportTagsText;
	textB += rightTagsText + '\n\n' + reportTagsText;
	// textB += '------------------------------------------------------\n';
	// textB += '------------------------------------------------------\n';
	// Third part - Queries to find the tracks and tips
	let textC = 'Queries needed to find the tracks with errors.\n' +
		'You may use them in search or facets panels.\n\n';
	let queryText = '', tipsText = '';
	alternativesMap.forEach((val, key) => { // keys are pairs of: tagName(separator)tagValue
		const [tagName, tagVal] = key.split(keySplit);
		if (tagVal === '?') {
			queryText += tagName.toUpperCase() + ' - ' + tagVal + ' --> ' + 'NOT ' + tagName.toUpperCase() + ' PRESENT\n';
		} else {
			queryText += tagName.toUpperCase() + ' - ' + tagVal + ' --> ' + tagName.toUpperCase() + ' IS ' + '"' + tagVal + '"\n';
			if (!tagVal.length && !tipsText.includes(tagName)) { // Only add the tip once per tag name
				if (!tipsText.length) { tipsText += 'You can use these TF on facets to differentiate\nbetween empty valued and non set tags on columns:\n\n'; }
				tipsText += '$if(%' + tagName + '%,$ifgreater($len(%' + tagName + '%),0,%<' + tagName + '>%,\'(Empty)\'),\'(\'Unknown\')\')';
				tipsText += '\n';
			}
		}
	});
	tipsText += (tipsText.length ? '\n\n' : '') + 'Empty valued tags or tags with redundant spaces\n' +
		'can be cleaned up using the tag editor within foobar2000\n' +
		'on selected tracks (\'Right Button/Properties\').\n' +
		'Then select the tags with errors and use\n' +
		'right button\'s menu entry named \'Clean Up\'.';

	tipsText += (tipsText.length ? '\n\n' : '') + 'Queries also work on mp3Tag as is, so they can be\n' +
		'used in its filter panel too! (\'View/Filter\')\n' +
		'mp3Tag can also display when a tag is empty valued\n' +
		'(something foobar2000 can\'t do without queries),\n' +
		'use \'Right Button/Extended Tags...\' and you will\n' +
		'see on the panel the tags present without a value\n.' +
		'Those tags can be sanitized just saving the tags again\n' +
		'without any changes, select all and force saving (ctrl+s).';
	tipsText = 'Other tips:\n' + tipsText;
	textC += queryText + '\n\n';
	textC += '------------------------------------------------------\n';
	textC += '------------------------------------------------------\n';
	textC += tipsText;
	textA += tipsText;
	// Popups with all texts
	fb.ShowPopupMessage(textC, popupTitle + ': queries');
	fb.ShowPopupMessage(textB, popupTitle + ': tag pairs and exclusions');
	fb.ShowPopupMessage(textA, popupTitle + ': possible errors');
	// Set verified tags known to be right Popup
	if (properties['bAskForConfigTags'][1]) {
		let currentTags = objectToPairs(tagValuesExcluded);
		let answer = WshShell.Popup('Do you want to add new tags for exclusion in future reports?', 0, window.Name, popup.question + popup.yes_no);
		if (answer === popup.yes) {
			let inputTags = utils.InputBox(window.ID, 'Tag pair(s) to exclude from future reports\n(Values known to be right)\n Pairs \'tagName,value\' separated by \';\' :', window.Name, currentTags);
			if (currentTags !== inputTags) {
				tagValuesExcluded = pairsToObj(inputTags);
				_save(properties['tagValuesExcludedPath'][1], JSON.stringify(tagValuesExcluded, null, '\t').replace(/\n/g, '\r\n'));
			}
		}
	}
}


/*
	Helpers
*/

function addTagsToExclusion({
	newTags = '',
	properties = getPropertiesPairs(checkTags_properties, checkTags_prefix),
} = {}) {
	// Skipped values at pre-filter
	const oldTags = loadTagsExcluded(properties['tagValuesExcludedPath'][1]);
	if (!newTags || !newTags.length) {
		newTags = utils.InputBox(window.ID, 'Tag pair(s) to exclude from future reports.\n Pairs \'tagName,value\' separated by \';\' :\n\nList can also be edited at:\n' + properties['tagValuesExcludedPath'][1], window.Name, objectToPairs(oldTags));
	} else {
		newTags = newTags + ';' + objectToPairs(oldTags);
	}
	if (newTags.length) {
		newTags = JSON.stringify(pairsToObj(newTags), null, '\t');
		if (JSON.stringify(oldTags, null, '\t') !== newTags) {
			_save(properties['tagValuesExcludedPath'][1], newTags);
		}
	}
}

function objectToPairs(inputObj) { // {A:[x,y],B:[z], ...} -> A,x;A,y;B,z;...
	let outputStr = '';
	let outputSet = new Set();
	for (const key in inputObj) {
		const arr = (Array.isArray(inputObj[key])
			? inputObj[key]
			: [...inputObj[key]]
		).sort((a, b) => a.localeCompare(b, 'en', { 'sensitivity': 'base' }));
		for (let value of arr) {
			if (value) { outputSet.add(key.toLowerCase() + ',' + value); }
		}
	}
	outputStr = [...outputSet].join(';');
	return outputStr; // A,B;C,D;...
}

function pairsToObj(inputStr, bSet = false) { // A,x;A,y;B,z;... -> {A:[x,y],B:[z], ...}
	const inputArr = [...new Set(inputStr.split(';').filter(Boolean))]; // filter holes and remove duplicates
	let outputObj = {};
	inputArr.forEach((pair) => {
		let [key, value] = pair.split(',');
		key = key.toLowerCase();
		if (!Object.hasOwn(outputObj, key)) { outputObj[key] = bSet ? new Set() : []; }
		if (!bSet) { outputObj[key].push(value); }
		else { outputObj[key].add(value); }
	});
	if (!bSet) { for (const key in outputObj) { outputObj[key].sort((a, b) => a.localeCompare(b, 'en', { 'sensitivity': 'base' })); } }
	return outputObj;
}

function loadTagsExcluded(path) { // filter holes and remove duplicates
	const bFromFile = _isFile(path);
	let obj = bFromFile
		? _jsonParseFileCheck(path, 'Exclusion list json', window.Name, utf8) || {}
		: {};
	// Ensure data consistency
	let bSave = false;
	for (const key in obj) {
		if (key !== key.toLowerCase()) {
			obj[key.toLowerCase()] = [...new Set([...obj[key], ...(obj[key.toLowerCase()] || [])])]
				.sort((a, b) => a.localeCompare(b, 'en', { 'sensitivity': 'base' }));
			delete obj[key];
			bSave = true;
		}
	}
	if (bFromFile && bSave) {
		_save(path, JSON.stringify(obj, null, '\t').replace(/\n/g, '\r\n'));
		console.log('loadTagsExcluded: overwrote file after fixing keys.\n\t' + path);
	}
	for (const key in obj) { obj[key] = new Set(obj[key].filter(Boolean)); }
	return obj;
}