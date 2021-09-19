'use strict';

/*
	Check Library Tags v 0.4 09/04/21
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
	That implies there could be a "right value", with much higher freq. of apparition, which may be known or not.
	Which values are lexical errors and which ones are "right values" is done only by freq. comparison:
	
	Notes:
		- False positives are expected. I.e. a rare tag only present on a few tracks on the library, may be considered 
		as "possible error" but without a known "right value" as alternative.
		
		- False positives are easily recognizable. Alternative values are usually reported, if a positive has no 
		alternative value, then it should be pretty easy to see if it's a real error or not. Rare tags may be added
		to the exclusion list for that purpose.
		
		- False negatives are possible. If you write systematically a wrong tag value in your tracks then,
		by freq. comparison, that value would be considered to be right. It may be "Rockj" in your entire library. 
		A track with "Rock", would be reported as the wrong value. A check against a dictionary would be required
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
 
include('..\\helpers\\helpers_xxx.js');
include('..\\helpers\\helpers_xxx_tags.js');
include('..\\helpers\\helpers_xxx_properties.js');
include('..\\helpers\\helpers_xxx_file.js');
include('..\\helpers-external\\typo\\typo.js'); // Dictionary helper: https://github.com/cfinke/Typo.js

const checkTags_properties = {
	tagNamesToCheck: 	['Tags to be checked (\'tag name,...\')', 'genre,style,mood,composer,involvedpeople'],
	tagsToCompare:	 	['Tags to compare against (\'tag name,...\')', 'genre,style;composer,involvedpeople,artist'],
	tagValuesExcluded: 	['Tag values to be excluded (\'tag name,value;...\')', ''],
	tagNamesExcludedDic:['Tags to be excluded at dictionary checking (\'tag name,...\')', 'album,composer,involvedpeople,artist'],
	bAskForConfigTags: 	['Enables popup asking to config excluded tags', false],
	bUseDic:		 	['Enables dictionary checking for every tag value (slow!)', false],
	dictName:			['Dictionary name (available: de_DE, en_GB, en_US, fr_FR)', 'en_US'],
	dictPath:			['Path to all dictionaries', (_isFile(fb.FoobarPath + 'portable_mode_enabled') ? '.\\profile\\' : fb.ProfilePath) + folders.xxxName + 'helpers-external\\typo\\dictionaries'],
};
checkTags_properties['tagNamesToCheck'].push({func: isString}, checkTags_properties['tagNamesToCheck'][1]);
checkTags_properties['tagsToCompare'].push({func: isStringWeak}, checkTags_properties['tagsToCompare'][1]);
checkTags_properties['tagValuesExcluded'].push({func: isStringWeak}, checkTags_properties['tagValuesExcluded'][1]);
checkTags_properties['tagNamesExcludedDic'].push({func: isStringWeak}, checkTags_properties['tagNamesExcludedDic'][1]);
checkTags_properties['dictName'].push({func: isString}, checkTags_properties['dictName'][1]);
checkTags_properties['dictPath'].push({func: isString, portable: true}, checkTags_properties['dictPath'][1]); // No need for a popup since the default dic will always be there
var checkTags_prefix = 'ct_';

// Load dictionary
const dictSettings = {
	dictName: checkTags_properties['dictName'][1], 
	dictPath: checkTags_properties['dictPath'][1],
	affPath() {return this.dictPath + '\\' + this.dictName + '\\' + this.dictName + '.aff';},
	dicPath() {return this.dictPath + '\\' + this.dictName + '\\' + this.dictName + '.dic';},
};
var dictionary;

if (typeof buttons === 'undefined' && typeof bNotProperties === 'undefined') { // Merge all properties when not loaded along buttons
	// With const var creating new properties is needed, instead of reassigning using A = {...A,...B}
	setProperties(checkTags_properties, checkTags_prefix);
	var bUseDic = getPropertyByKey(checkTags_properties, bUseDic, checkTags_prefix);
	if (bUseDic) {
		if (_isFile(dictSettings.dicPath()) && _isFile(dictSettings.affPath())) {
			dictionary = new Typo(dictSettings.dictName, utils.ReadTextFile(dictSettings.affPath()), utils.ReadTextFile(dictSettings.dicPath()));
		} else {fb.ShowPopupMessage('Dictionary path not found:\n' + dictSettings.dicPath() + '\n' + dictSettings.affPath(), window.name);}
	}
} else {  // With buttons, set these properties only once per panel
	dictionary = new Typo(); // Load dict later at first use
}

function checkTags({
					selItems = plman.GetPlaylistSelectedItems(plman.ActivePlaylist),
					properties = getPropertiesPairs(checkTags_properties, checkTags_prefix),
					freqThreshold = 0.2, // Any tag value appearing lower than this value in % is considered as "possible error"
					maxSizePerTag = 30, // From the previous pool, only the first X values are shown
					stringSimilThreshold = 0.85, // How much tag values must be similar to be considered as alternative values
					bUseDic = properties['bUseDic'][1],
					iSteps = iStepsLibrary, iDelay = iDelayLibrary, // Async processing ~ x1.4 time required
					bAsync = true,
					bDebug = false,
					bProfile = false
					} = {}) {
	if (bProfile) {var profiler = new FbProfiler('checkTags...');}
	if (typeof selItems === 'undefined' || selItems === null || selItems.count === 0) {
		return;
	}
	if (freqThreshold > 1 || freqThreshold < 0) {freqThreshold = 1;}
	if (stringSimilThreshold > 1 || stringSimilThreshold < 0) {stringSimilThreshold = 1;}
	if (maxSizePerTag < 0) {maxSizePerTag = Infinity;}
	// Load dictionary if required (and not loaded previously)
	if (bUseDic) {
		if (dictionary.dictionary !== properties['dictName'][1]) {
			dictSettings['dictName'] = properties['dictName'][1];
			dictSettings['dictPath'] = properties['dictPath'][1];
			if (_isFile(dictSettings.dicPath()) && _isFile(dictSettings.affPath())) {
				dictionary = new Typo(dictSettings.dictName, utils.ReadTextFile(dictSettings.affPath()), utils.ReadTextFile(dictSettings.dicPath()));
		// Warn if not found
			} else {fb.ShowPopupMessage('Dictionary path not found:\n' + dictSettings.dicPath() + '\n' + dictSettings.affPath(), window.name);return;}
		} else if (!_isFile(dictSettings.dicPath()) || !_isFile(dictSettings.affPath())) {
			fb.ShowPopupMessage('Dictionary path not found:\n' + dictSettings.dicPath() + '\n' + dictSettings.affPath(), window.name);return;
		}
	}
	// Constants
	const popupTitle = 'Tags Report'; // Window title for the popups
	const keySplit = '***'; // For the map
	
	// Skipped values at pre-filter
	let tagValuesExcluded = {}; // i x k
	let inputTags = [...new Set(properties['tagValuesExcluded'][1].split(';').filter(Boolean))].join(';'); // filter holes and remove duplicates
	if (inputTags.length) {
		mergeStringToTagsObject(tagValuesExcluded, inputTags);
	}
	const tagsToCheck = [...new Set(properties['tagNamesToCheck'][1].split(',').filter(Boolean))]; // i, filter holes and remove duplicates
	if (!tagsToCheck.length) {
		fb.ShowPopupMessage('There are no tags to check set at properties panel', popupTitle);
		return;
	}
	const tagsToCompare = properties['tagsToCompare'][1].split(';').filter(Boolean).map((_) => {return [...new Set(_.split(',').filter(Boolean))];}); // filter holes and remove duplicates
	const tagsToCompareMap = new Map();
	if (tagsToCompare.length) {
		tagsToCompare.forEach((arr) => {
			arr.forEach((tag, _, thisArr) => {
				if (!tagsToCompareMap.has(tag)) {tagsToCompareMap.set(tag, new Set(thisArr));}
				else {tagsToCompareMap.set(tag, tagsToCompareMap.get(tag).union(new Set(thisArr)));}
			});
		});
	}
	if (!bAsync || !iSteps || iSteps === 1 || iDelay === 0) {
		// Get all tags and their frequency
		const tags = checkTagsRetrieve(selItems, tagsToCheck, [...Array(tagsToCheck.length)].map((_) => {return [];}));
		const count = [...Array(tags.length)].map((_) => {return new Map();}); // i x j x k
		tags.forEach( (tagArray, i) => { // i
			checkTagsCount(tagArray, count, i);
		});
		const [countArray, countArrayFiltered] = checkTagsFilter(tagsToCheck, count, freqThreshold, tagValuesExcluded, maxSizePerTag);
		// Find possible alternatives (misplacing and misspelling) or other errors to report
		let alternativesMap = new Map();
		const tagNamesExcludedDic = properties['tagNamesExcludedDic'][1].split(','); // Don't check these against dictionary
		if (countArray.length && countArrayFiltered.length) {
			tagsToCheck.forEach( (tagA, indexA) => {
				const bCompare = tagsToCompareMap.has(tagA);
				const toCompareWith = bCompare ? tagsToCompareMap.get(tagA) : null;
				countArrayFiltered[indexA].forEach( (tagValueA, i) => {
					checkTagsCompare(tagA, keySplit, tagValueA, alternativesMap, bCompare, tagsToCheck, toCompareWith, countArray, indexA, stringSimilThreshold, bUseDic, tagNamesExcludedDic, dictionary);
				});
			});
		}
		setTimeout(() => {}, 1000);
		checkTagsReport(tagsToCheck, countArrayFiltered, keySplit, alternativesMap, popupTitle, properties, tagValuesExcluded);
		if (bProfile) {profiler.Print();}
	} else {
	// Get all tags and their frequency
		new Promise(resolve => {
			const items = selItems.Convert();
			const count = items.length;
			const range = Math.round(count / iSteps);
			const delay = iDelay / 4;
			let tags = [...Array(tagsToCheck.length)].map((_) => {return [];});
			for (let i = 1; i <= iSteps; i++) {
				setTimeout(() => {
					const items_i = new FbMetadbHandleList(items.slice((i - 1) * range, i === iSteps ? count : i * range));
					tags = checkTagsRetrieve(items_i, tagsToCheck, tags);
					const progress = i / iSteps * 100;
					if (progress % 10 === 0) {console.log('Retrieving tags ' + Math.round(progress) + '%.');}
					if (i === iSteps) {resolve(tags);}
				}, delay * i);
			}
		})
		.then(tags => {
			return new Promise(resolve => {
				const count = [...Array(tags.length)].map((_) => {return new Map();}); // i x j x k
				const total = tags.length - 1;
				const delay = iDelay / 50;
				tags.forEach( (tagArray, i) => { // i
					setTimeout(() => {
						checkTagsCount(tagArray, count, i);
						if (i === total) {resolve(count);}
					}, delay * i);
				})
			});
		})
		.then(count => {
			const [countArray, countArrayFiltered] = checkTagsFilter(tagsToCheck, count, freqThreshold, tagValuesExcluded, maxSizePerTag);
			return {countArray, countArrayFiltered};
		})
		.then(({countArray, countArrayFiltered}) => {
			return new Promise(resolve => {
				// Find possible alternatives (misplacing and misspelling) or other errors to report
				let alternativesMap = new Map();
				const tagNamesExcludedDic = properties['tagNamesExcludedDic'][1].split(','); // Don't check these against dictionary
				if (countArray.length && countArrayFiltered.length) {
					const total = tagsToCheck.length - 1;
					let prevProgress = 0;
					tagsToCheck.forEach( (tagA, indexA) => {
						const bCompare = tagsToCompareMap.has(tagA);
						const toCompareWith = bCompare ? tagsToCompareMap.get(tagA) : null;
						const totalA = countArrayFiltered[indexA].length - 1;
						const delay = bCompare ? (totalA + 1) * (toCompareWith.size ** 2) / 150 * iDelay / 100 : (totalA + 1) / 1000 * iDelay / 100;
						countArrayFiltered[indexA].forEach( (tagValueA, i) => {
							setTimeout(() => {
								checkTagsCompare(tagA, keySplit, tagValueA, alternativesMap, bCompare, tagsToCheck, toCompareWith, countArray, indexA, stringSimilThreshold, bUseDic, tagNamesExcludedDic, dictionary);
								const progress = Math.round(i * indexA / (total * totalA) * 10) * 10;
								if (progress % 10 === 0 && progress > prevProgress) {prevProgress = progress; console.log('Checking tags ' + Math.round(progress) + '%.');}
								if (indexA === total && i === totalA) {resolve({countArrayFiltered, alternativesMap});}
							}, delay * i);
						});
					});
				} else {resolve({countArrayFiltered, alternativesMap});}
			});
		}).then(({countArrayFiltered, alternativesMap}) => {
			setTimeout(() => {}, 1000);
			checkTagsReport(tagsToCheck, countArrayFiltered, keySplit, alternativesMap, popupTitle, properties, tagValuesExcluded);
			if (bProfile) {profiler.Print();}
		});
	}
}

/*
	Sync code
*/
function checkTagsRetrieve(items, tagsToCheck, tags) {
	const newTags = getTagsValuesV4(items, tagsToCheck, false, true);
	tags = tags.map((arr, i) => {return arr.concat(newTags[i]);});
	return tags;
}

function checkTagsCount(tagArray, count, i) {
	tagArray.forEach( (tagValueArray) => { //j
		tagValueArray.forEach( (tagValue) => { //k
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
	tagsToCheck.forEach( (tag, index) => { // i
		let maxFreq = 0;
		countArray.push(Array.from(count[index]).sort(function(a, b) { // k
			maxFreq = Math.max(maxFreq, a[1]);
			return a[1] - b[1];
		}));
		countArrayThreshold.push(Math.floor(maxFreq * freqThreshold));
	});
	// Pre-filter with exclusions
	let countArrayPre = []; // i x k
	if (countArray.length) {
		tagsToCheck.forEach( (tag, index) => {
			if (tagValuesExcluded.hasOwnProperty(tag)) {
				countArrayPre[index] = countArray[index].filter((pair) => {return !tagValuesExcluded[tag].has(pair[0]);});
			} else {countArrayPre[index] = countArray[index];}
		});
	}
	// Filter results by identified errors and frequency
	let countArrayFiltered = []; // i x k
	if (countArrayPre.length) {
		tagsToCheck.forEach( (tag, index) => {
			countArrayFiltered[index] = [];
			// Add any identified errors first without considering freq. filter
			countArrayPre[index].forEach( (tagValue, subIndex) => {
				if (!tagValue[0].length) {countArrayFiltered[index].push(tagValue);}
				else if (!tagValue[0].trim().length) {countArrayFiltered[index].push(tagValue);}
				else if (tagValue[0].trim().length !== tagValue[0].length) {countArrayFiltered[index].push(tagValue);}
				else if (tagValue[0] === '?') {countArrayFiltered[index].push(tagValue);}
				else if (tagValue[0].indexOf('  ') !== -1) {countArrayFiltered[index].push(tagValue);}
				else if (tagValue[0].indexOf(';') !== -1) {countArrayFiltered[index].push(tagValue);}
				else if (tagValue[0].indexOf(',') !== -1) {countArrayFiltered[index].push(tagValue);}
				else if (tagValue[0].indexOf('/') !== -1) {countArrayFiltered[index].push(tagValue);}
			});
			// Then all tags according to freq. filter (excluding previously added ones)
			if (freqThreshold === 1 && !isFinite(maxSizePerTag)) { // When forced to check all tags, just push them all
				countArrayPre[index].forEach( (tagValue) => {
					if (countArrayFiltered[index].indexOf(tagValue) === -1) {countArrayFiltered[index].push(tagValue);}
				});
			} else {
				let breakPoint = -1; // May be entire array or a small subset according to the threshold
				if (freqThreshold === 1) {breakPoint = countArrayPre[index][countArrayPre[index].length - 1];}
				else {breakPoint = countArrayPre[index].indexOf(countArrayPre[index].find( (tag) => {return tag[1] >= countArrayThreshold[index];}));}
				if (breakPoint !== -1) {
					if (breakPoint > maxSizePerTag) {breakPoint = maxSizePerTag;}
					countArrayPre[index].slice(0, breakPoint).forEach( (tagValue) => {
						if (countArrayFiltered[index].indexOf(tagValue) === -1) {countArrayFiltered[index].push(tagValue);}
					});
				}
			}
		});
	}
	return [countArray, countArrayFiltered];
}

function checkTagsCompare(tagA, keySplit, tagValueA, alternativesMap, bCompare, tagsToCheck, toCompareWith, countArray, indexA, stringSimilThreshold, bUseDic, tagNamesExcludedDic, dictionary) {
	// Identified errors first (same checks at freq. filtering step)
	const tagKey = tagA + keySplit + tagValueA[0];
	if (!tagValueA[0].length) {alternativesMap.set(tagKey, 'Tag set to empty value (breaks queries!)');}
	else if (!tagValueA[0].trim().length) {alternativesMap.set(tagKey, 'Tag set to blank space(s)');}
	else if (tagValueA[0].trim().length !== tagValueA[0].length) {alternativesMap.set(tagKey, 'Tag has blank space(s) at the extremes');}
	else if (tagValueA[0] === '?') {alternativesMap.set(tagKey, 'Tag not set');}
	else if (tagValueA[0].indexOf('  ') !== -1) {alternativesMap.set(tagKey, 'Tag has consecutive blank spaces (instead of one)');}
	else if (tagValueA[0].indexOf(';') !== -1) {alternativesMap.set(tagKey, 'Possible multivalue tag not split');}
	else if (tagValueA[0].indexOf(',') !== -1) {alternativesMap.set(tagKey, 'Possible multivalue tag not split');}
	else if (tagValueA[0].indexOf('/') !== -1) {alternativesMap.set(tagKey, 'Possible multivalue tag not split');}
	else if (bCompare){ // Compare all values to find misplaced (other tag) and misspelled values (same/other tag)
		let similValues = [];
		tagsToCheck.forEach( (tagB, indexB) => {
			if (toCompareWith.has(tagB)) {
				countArray[indexB].forEach( (tagValueB) => {
					if (indexB === indexA && tagValueB[0] !== tagValueA[0]) { // When comparing the same tag, calc similarity (and skip the same value)
						if (similarity(tagValueA[0],tagValueB[0]) >= stringSimilThreshold) {
							similValues.push(tagValueB[0]);
						}
					} else if (indexB !== indexA && tagValueB[0] === tagValueA[0]) { // When comparing to other tags, check for simple matching
						similValues.push(tagValueB[0] + ' (as ' + tagB + ')');
					} else if (indexB !== indexA && tagValueB[0] !== tagValueA[0]) { // and similarity
						if (similarity(tagValueA[0],tagValueB[0]) >= stringSimilThreshold) {
							similValues.push(tagValueB[0] + ' (as similar ' + tagB + ')');
						}
					}
				});
			}
		});
		// If no error found yet, compare against dictionary
		if (bUseDic && tagNamesExcludedDic.indexOf(tagA) === -1 && !similValues.length) {
			tagValueA[0].split(' ').forEach( (word, index, array) => {
				if (!dictionary.check(word)) {
					const dicSugggest = dictionary.suggest(word);
					if (dicSugggest.length) {
						dicSugggest.forEach( (suggestion) => { // Filter suggestions with similarity threshold
							if (similarity(word, suggestion) >= stringSimilThreshold) {
								// Reconstruct tag value with new suggestion
								const numTerms = array.length;
								if (numTerms === 1) { // may be a tag value with one word
									// suggestion = suggestion;
								} else { // or multiple words
									if (index === 0) {
										suggestion = suggestion + ' ' + array.slice(index + 1, numTerms);
									} else if (index < array.length - 1) {
										suggestion = array.slice(0, index) + ' ' + suggestion + ' ' + array.slice(index + 1, numTerms);
									} else  {
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
		if (similValues.length) {alternativesMap.set(tagKey, similValues);}
	}
}

function checkTagsReport(tagsToCheck, countArrayFiltered, keySplit, alternativesMap, popupTitle, properties, tagValuesExcluded) {
	// Report popups
	// First part - Tags errors
	let textA =	'List of values with lowest frequency of apparition.\n' +
				'Some of them may be misspelled (1) or misplaced (2).\n' +
				'(1) Whenever a possible match is found, it\'s shown at right (-->).\n' +
				'(2) If the match is from another tag, then it\'s shown between parenthesis.\n' +
				'(3) Any other identified error, it\'s shown at right too (-->)\n\n';
	tagsToCheck.forEach( (tag, index) => {
		textA += '------------------\n';
		textA += tag + ':\n';
		textA += '------------------\n';
		if (countArrayFiltered.length){
			countArrayFiltered[index].forEach( (pair) => {
				const tagKey = tag + keySplit + pair[0];
				if (alternativesMap.has(tagKey)) { // Add alternative terms and error comments if possible
					let altTerms = alternativesMap.get(tagKey);
					textA += pair + ' --> ' + (isArray(altTerms) ? altTerms.join(', ') : altTerms) + '\n';
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
	let textB =	'List of pairs of tags from the report (tag,value;...).\n' +
				'Ready to be copied to exclusions window or properties panel.\n' +
				'In any case you must check them one by one, and only add those needed.\n\n';
	let rightTagsText = '', reportTagsText = '';
	tagsToCheck.forEach( (tag, index) => {
		rightTagsText += tag + ':\n';
		reportTagsText += tag + ':\n';
		let rightPairsText = '', reportPairsText = '';
		if (countArrayFiltered.length){
			countArrayFiltered[index].forEach( (pair) => {
				const tagKey = tag + keySplit + pair[0];
				if (alternativesMap.has(tagKey)) {
					reportPairsText += (reportPairsText.length ? ';' : '') + tag + ',' + pair[0];
				} else {
					rightPairsText += (rightPairsText.length ? ';' : '') + tag + ',' + pair[0];
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
	let textC =	'Queries needed to find the tracks with errors.\n' +
				'You may use them in search or facets panels.\n\n';
	let queryText = '', tipsText = '';
	alternativesMap.forEach( (val, key) => { // keys are pairs of: tagName(separator)tagValue
		const [tagName, tagVal] = key.split(keySplit);
		if (tagVal === '?') {
			queryText += tagName + ' - ' + tagVal + ' --> ' + 'NOT ' + tagName.toUpperCase() + ' PRESENT\n';
		} else {
			queryText += tagName + ' - ' + tagVal + ' --> ' + tagName.toUpperCase() + ' IS ' + '"' + tagVal + '"\n';
			if (!tagVal.length && tipsText.indexOf(tagName) === -1) { // Only add the tip once per tag name
				if (!tipsText.length) {tipsText += 'You can use these TF on facets to differentiate\nbetween empty valued and non set tags on columns:\n\n';}
				tipsText += '$if(%' + tagName + '%,$ifgreater($len(%' + tagName + '%),0,%<' + tagName + '>%,\'(Empty)\'),\'(\'Unknown\')\')';
				tipsText += '\n';
			}
		}
	});
	tipsText += (tipsText.length ? '\n\n' : '') + 'Empty valued tags or tags with redundant spaces\n' +
												'can be cleaned up using the tag editor within foobar\n' +
												'on selected tracks (\'Right Button/Properties\').\n' +
												'Then select the tags with errors and use\n' +
												'right button\'s menu entry named \'Clean Up\'.';
												
	tipsText += (tipsText.length ? '\n\n' : '') + 'Queries also work on mp3Tag as is, so they can be\n' +
												'used in its filter panel too! (\'View/Filter\')\n' +
												'mp3Tag can also display when a tag is empty valued\n' +
												'(something foobar can\'t do without queries),\n' +
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
		let currentTags = [];
		Object.keys(tagValuesExcluded).forEach( (key) => {currentTags.push([...tagValuesExcluded[key]].map((value) => {return key + ',' + value;}).join(';'));});
		let answer = WshShell.Popup('Do you want to add new tags for exclusion in future reports?', 0, window.Name, popup.question + popup.yes_no);
		if (answer === popup.yes) {
			let inputTags = utils.InputBox(window.ID, 'Tag pair(s) to exclude from future reports\n(Values known to be right)\n Pairs \'tagName,value\' separated by \';\' :', window.Name, currentTags.join(';'));
			if (inputTags.length && currentTags.join(';') !== inputTags) {
				tagValuesExcluded = {};
				mergeStringToTagsObject(tagValuesExcluded, inputTags);
				let currentTags = [];
				Object.keys(tagValuesExcluded).forEach( (key) => {currentTags.push([...tagValuesExcluded[key]].map((value) => {return key + ',' + value;}).join(';'));});
				properties['tagValuesExcluded'][1] = currentTags.join(';'); // Instead of inputTags, to remove duplicates
				overwriteProperties(properties);
			}
		}
	}
}


/*
	Helpers
*/

function addTagsToExclusion({
					tagsPairs = '',
					properties = getPropertiesPairs(checkTags_properties, checkTags_prefix),
					} = {}){
	if (tagsPairs.length) {
		// Skipped values at pre-filter
		const propertyTags = properties['tagValuesExcluded'][1].split(';'); // filter holes and remove duplicates
		tagsPairs = tagsPairs.split(';');
		const newTags = [...new Set([...propertyTags, ...tagsPairs].filter(Boolean))];
		if (propertyTags !== newTags) {
			properties['tagValuesExcluded'][1] = newTags.join(';');
			overwriteProperties(properties);
		}
	}
}

function addTagsToExclusionPopup({
					properties = getPropertiesPairs(checkTags_properties, checkTags_prefix),
					} = {}){
	// Skipped values at pre-filter
	const propertyTags = [...new Set(properties['tagValuesExcluded'][1].split(';').filter(Boolean))].join(';'); // filter holes and remove duplicates
	let inputTags = utils.InputBox(window.ID, 'Tag pair(s) to exclude from future reports\n(Values known to be right)\n Pairs \'tagName,value\' separated by \';\' :', window.Name, propertyTags);
	if (inputTags.length) {
		inputTags = [...new Set(inputTags.split(';').filter(Boolean))].join(';'); // filter holes and remove duplicates;
		if (propertyTags !== inputTags) {
			properties['tagValuesExcluded'][1] = inputTags;
			overwriteProperties(properties);
		}
	}
}

function mergeStringToTagsObject(tagValuesExcluded, inputTags) {
	inputTags = inputTags.split(';');
	inputTags.forEach( (pair) => {
		let [tag, value] = pair.split(',');
		if (!tagValuesExcluded.hasOwnProperty(tag)){
			tagValuesExcluded[tag] = new Set();
		}
		tagValuesExcluded[tag].add(value);
	});
}

// Levenshtein distance
// https://stackoverflow.com/questions/10473745/compare-strings-javascript-return-of-likely
function similarity(s1, s2) {
	var longer = s1;
	var shorter = s2;
	if (s1.length < s2.length) {
		longer = s2;
		shorter = s1;
	}
	var longerLength = longer.length;
	if (longerLength === 0) {
		return 1.0;
	}
	return (longerLength - editDistance(longer, shorter)) / parseFloat(longerLength);
}

function editDistance(s1, s2) {
s1 = s1.toLowerCase();
s2 = s2.toLowerCase();

var costs = new Array();
	for (var i = 0; i <= s1.length; i++) {
		var lastValue = i;
		for (var j = 0; j <= s2.length; j++) {
			if (i === 0) {
				costs[j] = j;
			} else {
				if (j > 0) {
					var newValue = costs[j - 1];
					if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
						newValue = Math.min(Math.min(newValue, lastValue),
						costs[j]) + 1;
					}
					costs[j - 1] = lastValue;
					lastValue = newValue;
				}
			}
		}
		if (i > 0) {
			costs[s2.length] = lastValue;
		}
	}
	return costs[s2.length];
}