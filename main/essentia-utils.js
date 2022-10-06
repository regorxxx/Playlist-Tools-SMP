'use strict';
//06/10/22

include('..\\helpers\\helpers_xxx.js');
include('..\\helpers\\helpers_xxx_tags.js');
include('..\\helpers\\helpers_xxx_file.js');
include('..\\helpers\\helpers_xxx_prototypes.js');

const essentia = {};

essentia.calculateKey = function calculateKey({
		fromHandleList = plman.GetPlaylistSelectedItems(plman.ActivePlaylist),
		tagName = globTags.key,
		essentiaPath = folders.xxx + 'helpers-external\\essentia\\essentia_streaming_key.exe',
		bDebug = false,
		bProfile = true
	}) {
	// Safecheck
	if (!fromHandleList || !fromHandleList.Count || !tagName.length) {return false;}
	if (!_isFile(essentiaPath)) {fb.ShowPopupMessage('essentia_streaming_key executable not found:\n' + essentiaPath, 'Essentia Key extractor');}
	const profile = bProfile ? new FbProfiler('Essentia Key extractor') : null;
	const handleListArr = fromHandleList.Convert();
	const totalTracks = handleListArr.length, numTracks = 25, maxCount = Math.ceil(totalTracks / numTracks);
	let totalItems = 0;
	let bDone = true;
	let failedItems = [];
	const rgexKey = /.*key: "(.*)"/i;
	const rgexScale= /.*key_scale: "(.*)"/i;
	const calcKEY = (count) => {
			const currMax = (count + 1) === maxCount ? totalTracks : (count + 1) * numTracks;
			console.log('Processing items: ' + currMax + '/' + totalTracks);
			const items = [];
			const KEY = [];
			const essentiaJSON =  folders.temp + 'essentiaJSON' + (new Date().toDateString() + Date.now()).split(' ').join('_') + '.json';
			let prevProgress = -1, iSteps = (count + 1) === maxCount ? currMax : numTracks;
			handleListArr.slice(count * numTracks, currMax).forEach((handle, i) => {
				const path = handle.Path;
				if (_isFile(path)) {
					if (bDebug) {console.log(_q(essentiaPath) + _q(path) + ' ' + _q(essentiaJSON));}
					_runHidden(essentiaPath.replace('.exe','.bat'), path, essentiaJSON, essentiaPath);
					const data = _open(essentiaJSON);
					if (data) {
						const tag = (data.match(rgexKey) || [,])[1];
						const tagScale = (data.match(rgexScale) || [,])[1];
						const tagMerged = tag + (tagScale.toLowerCase() === 'minor' ? 'm' : '');
						if (tag && tagScale && tag.length && tagScale.length) {
							items.push(handle);
							KEY.push(tagMerged);
						}
					} else {failedItems.push(path);}
					const progress = Math.round((i + 1) / iSteps * 10) * 10;
					if (progress > prevProgress) {prevProgress = progress; console.log('Essentia Key extracting ' + progress + '%.');}
				} else {failedItems.push(path);}
			});
			_deleteFile(essentiaJSON);
			const itemsLength = items.length;
			totalItems += itemsLength;
			if (itemsLength) {
				const tags = KEY.map((value) => {return {[tagName]: value};});
				if (itemsLength === tags.length) {
					new FbMetadbHandleList(items).UpdateFileInfoFromJSON(JSON.stringify(tags));
					if (maxCount > 1) {console.log(itemsLength,'items tagged.');} // Don't repeat this line when all is done in 1 step. Will be printed also later
					bDone = bDone;
				} else {bDone = false; console.log('Tagging failed: unknown error.');}
			}
	}
	for (let count = 0; count < maxCount; count++) {
		calcKEY(count);
	}
	const failedItemsLen = failedItems.length;
	console.popup(totalTracks + ' items processed.\n' + totalItems + ' items tagged.\n' + failedItemsLen + ' items failed.' + (failedItemsLen ? '\n\nList of failed items:\n' + failedItems.join('\n') : ''), 'Essentia Key extractor');
	if (bProfile) {profile.Print('Save Key tags to files - completed in ');}
	return bDone;
}

essentia.calculateHighLevelTags = function calculateHighLevelTags({
		fromHandleList = plman.GetPlaylistSelectedItems(plman.ActivePlaylist),
		tagName = [globTags.key, globTags.bpm, 'DANCENESS', 'LRA'],
		essentiaPath = folders.xxx + 'helpers-external\\essentia\\streaming_extractor_music.exe',
		bDebug = false,
		bProfile = true
	}) {
	// Safecheck
	if (!fromHandleList || !fromHandleList.Count || !tagName.length) {return false;}
	if (!_isFile(essentiaPath)) {fb.ShowPopupMessage('streaming_extractor_music executable not found:\n' + essentiaPath, 'Essentia Music extractor');}
	const profile = bProfile ? new FbProfiler('Essentia Music extractor') : null;
	const handleListArr = fromHandleList.Convert();
	const totalTracks = handleListArr.length, numTracks = 25, maxCount = Math.ceil(totalTracks / numTracks);
	tagName = tagName.map((key) => {return key.toUpperCase();});
	const tagNameLen = tagName.length;
	let totalItems = 0;
	let bDone = true;
	let failedItems = [];
	const calcTag = (count) => {
			const currMax = (count + 1) === maxCount ? totalTracks : (count + 1) * numTracks;
			console.log('Processing items: ' + currMax + '/' + totalTracks);
			const items = [];
			const tags = [];
			const essentiaJSON =  folders.temp + 'essentiaJSON' + (new Date().toDateString() + Date.now()).split(' ').join('_') + '.json';
			let prevProgress = -1, iSteps = (count + 1) === maxCount ? currMax : numTracks;
			handleListArr.slice(count * numTracks, currMax).forEach((handle, i) => {
				const path = handle.Path;
				if (_isFile(path)) {
					if (bDebug) {console.log(_q(essentiaPath) + _q(path) + ' ' + _q(essentiaJSON));}
					_runHidden(essentiaPath.replace('.exe','.bat'), path, essentiaJSON, essentiaPath);
					const data = _jsonParseFile(essentiaJSON, utf8);
					if (data) {
						let tag = {};
						let val, scale, method;
						tagName.forEach((key) => {
							if (key === 'BPM' && data.hasOwnProperty('rhythm')) {
								val = data.rhythm.bpm;
								if (Number.isFinite(val)) {tag[key] = Math.round(val);}
							} else if (key === 'KEY' && data.hasOwnProperty('tonal')) {
								// Retrieve genre group
								const bElectronic = fb.GetQueryItems(new FbMetadbHandleList(handle), "(GENRE IS Electronic OR GENRE IS Techno OR GENRE IS House OR GENRE IS Trance OR GENRE IS Future Bass OR GENRE IS Post-Dubstep OR GENRE IS Dubstep OR GENRE IS Bassline OR GENRE IS Breakbeat Garage OR GENRE IS Liquid Funk OR GENRE IS Neuro Funk OR GENRE IS Intelligent Drum & Bass OR GENRE IS Ambient Drum & Bass OR GENRE IS Jazzstep OR GENRE IS Jump Up OR GENRE IS Hardstep OR GENRE IS Techstep OR GENRE IS Darkcore OR GENRE IS Darkstep OR GENRE IS Old School Jungle OR GENRE IS New Beat OR GENRE IS Hardcore Techno OR GENRE IS Hardcore Rave OR GENRE IS Breakbeat Hardcore OR GENRE IS Darkcore OR GENRE IS Darkstep OR GENRE IS Happy Hardcore OR GENRE IS Bouncy Techno OR GENRE IS Trancecore OR GENRE IS Acidcore OR GENRE IS Gabber OR GENRE IS Speedcore OR GENRE IS Frenchcore OR GENRE IS Terrorcore OR GENRE IS Nu Style Gabber OR GENRE IS Mainstream Hardcore OR GENRE IS Hardstyle OR GENRE IS Ghetto House OR GENRE IS Ghettotech OR GENRE IS Juke OR GENRE IS Hardtechno OR GENRE IS Tech Trance OR GENRE IS Tech House OR GENRE IS Industrial Techno OR GENRE IS Minimal Techno OR GENRE IS Ambient Techno OR GENRE IS IDM OR GENRE IS Hardtek OR GENRE IS Freetekno OR GENRE IS Hardcore Techno OR GENRE IS Hardcore Rave OR GENRE IS New Beat OR GENRE IS Detroit Techno OR GENRE IS Fidget House OR GENRE IS Electro House OR GENRE IS Moombahton OR GENRE IS Microhouse OR GENRE IS Minimal House OR GENRE IS Ghetto House OR GENRE IS French House OR GENRE IS Funky House OR GENRE IS Tech House OR GENRE IS NRG OR GENRE IS Hard NRG OR GENRE IS Hard House OR GENRE IS Progressive House OR GENRE IS Deep House OR GENRE IS Ibiza House OR GENRE IS Ibiza Trance OR GENRE IS Dream House OR GENRE IS Dream Trance OR GENRE IS Hip House OR GENRE IS Eurodance OR GENRE IS Acid House OR GENRE IS Chicago House OR GENRE IS Garage House OR GENRE IS Neo Trance OR GENRE IS Epic Trance OR GENRE IS Hardtrance OR GENRE IS NRG OR GENRE IS Hard NRG OR GENRE IS Hard House OR GENRE IS Eurotrance OR GENRE IS Vocal Trance OR GENRE IS Progressive Trance OR GENRE IS Goa Trance OR GENRE IS Psytrance OR GENRE IS Ibiza House OR GENRE IS Ibiza Trance OR GENRE IS Dream House OR GENRE IS Dream Trance OR GENRE IS Classic Trance OR GENRE IS Acid Trance) OR (STYLE IS Electronic OR STYLE IS Techno OR STLYE IS House OR STLYE IS Trance OR STYLE IS Future Bass OR STYLE IS Post-Dubstep OR STYLE IS Dubstep OR STYLE IS Bassline OR STYLE IS Breakbeat Garage OR STYLE IS Liquid Funk OR STYLE IS Neuro Funk OR STYLE IS Intelligent Drum & Bass OR STYLE IS Ambient Drum & Bass OR STYLE IS Jazzstep OR STYLE IS Jump Up OR STYLE IS Hardstep OR STYLE IS Techstep OR STYLE IS Darkcore OR STYLE IS Darkstep OR STYLE IS Old School Jungle OR STYLE IS New Beat OR STYLE IS Hardcore Techno OR STYLE IS Hardcore Rave OR STYLE IS Breakbeat Hardcore OR STYLE IS Darkcore OR STYLE IS Darkstep OR STYLE IS Happy Hardcore OR STYLE IS Bouncy Techno OR STYLE IS Trancecore OR STYLE IS Acidcore OR STYLE IS Gabber OR STYLE IS Speedcore OR STYLE IS Frenchcore OR STYLE IS Terrorcore OR STYLE IS Nu Style Gabber OR STYLE IS Mainstream Hardcore OR STYLE IS Hardstyle OR STYLE IS Ghetto House OR STYLE IS Ghettotech OR STYLE IS Juke OR STYLE IS Hardtechno OR STYLE IS Tech Trance OR STYLE IS Tech House OR STYLE IS Industrial Techno OR STYLE IS Minimal Techno OR STYLE IS Ambient Techno OR STYLE IS IDM OR STYLE IS Hardtek OR STYLE IS Freetekno OR STYLE IS Hardcore Techno OR STYLE IS Hardcore Rave OR STYLE IS New Beat OR STYLE IS Detroit Techno OR STYLE IS Fidget House OR STYLE IS Electro House OR STYLE IS Moombahton OR STYLE IS Microhouse OR STYLE IS Minimal House OR STYLE IS Ghetto House OR STYLE IS French House OR STYLE IS Funky House OR STYLE IS Tech House OR STYLE IS NRG OR STYLE IS Hard NRG OR STYLE IS Hard House OR STYLE IS Progressive House OR STYLE IS Deep House OR STYLE IS Ibiza House OR STYLE IS Ibiza Trance OR STYLE IS Dream House OR STYLE IS Dream Trance OR STYLE IS Hip House OR STYLE IS Eurodance OR STYLE IS Acid House OR STYLE IS Chicago House OR STYLE IS Garage House OR STYLE IS Neo Trance OR STYLE IS Epic Trance OR STYLE IS Hardtrance OR STYLE IS NRG OR STYLE IS Hard NRG OR STYLE IS Hard House OR STYLE IS Eurotrance OR STYLE IS Vocal Trance OR STYLE IS Progressive Trance OR STYLE IS Goa Trance OR STYLE IS Psytrance OR STYLE IS Ibiza House OR STYLE IS Ibiza Trance OR STYLE IS Dream House OR STYLE IS Dream Trance OR STYLE IS Classic Trance OR STYLE IS Acid Trance)").Count === 1;
								const bClassical = !bElectronic ? fb.GetQueryItems(new FbMetadbHandleList(handle), "(GENRE IS Classical OR GENRE IS Ballata OR GENRE IS Estampie OR GENRE IS Gregorian OR GENRE IS Chant OR GENRE IS Madrigal OR GENRE IS Motet OR GENRE IS Organum OR GENRE IS Saltarero OR GENRE IS Choral OR GENRE IS Ballade OR GENRE IS Canzona OR GENRE IS Carol OR GENRE IS Fantasia OR GENRE IS Galliard OR GENRE IS Intermedio OR GENRE IS Lauda OR GENRE IS Litany OR GENRE IS Madrigal OR GENRE IS Madrigal OR GENRE IS Comedy OR GENRE IS Madrigale Spirituale OR GENRE IS Mass OR GENRE IS Motet OR GENRE IS Motet-Chanson OR GENRE IS Opera OR GENRE IS Pavane OR GENRE IS Ricercar OR GENRE IS Sequence OR GENRE IS Tiento OR GENRE IS Toccata OR GENRE IS Allemande OR GENRE IS Canon OR GENRE IS Cantata OR GENRE IS Chaconne OR GENRE IS Concerto OR GENRE IS Courante OR GENRE IS Fugue OR GENRE IS Classical Gavotte OR GENRE IS Gigue OR GENRE IS Minuet OR GENRE IS Opera OR GENRE IS Oratorio OR GENRE IS Partita OR GENRE IS Passacaglia OR GENRE IS Passepied OR GENRE IS Prelude OR GENRE IS Sarabande OR GENRE IS Sinfonia OR GENRE IS Sonata OR GENRE IS Suite OR GENRE IS Sonatina OR GENRE IS Bagatelle OR GENRE IS Ballade OR GENRE IS Ballet OR GENRE IS Caprice OR GENRE IS Carol OR GENRE IS Concerto OR GENRE IS Dance OR GENRE IS Divertimento OR GENRE IS Étude OR GENRE IS Fantasy OR GENRE IS Impromptu OR GENRE IS Intermezzo OR GENRE IS Lied OR GENRE IS Mass OR GENRE IS Classical Mazurka OR GENRE IS March OR GENRE IS Music Hall OR GENRE IS Nocturne OR GENRE IS Octet OR GENRE IS Polonaise OR GENRE IS Quartet OR GENRE IS Quintet OR GENRE IS Requiem OR GENRE IS Rhapsody OR GENRE IS Rondo OR GENRE IS Scherzo OR GENRE IS Serenade OR GENRE IS Sinfonia Concertante OR GENRE IS Symphony OR GENRE IS Waltz OR GENRE IS Avant-Garde Classical OR GENRE IS Contemporary Classical OR GENRE IS Neo-Classical OR GENRE IS Third Stream OR GENRE IS Ambient Classical) OR (STYLE IS Classical OR STYLE IS Ballata OR STYLE IS Estampie OR STYLE IS Gregorian OR STYLE IS Chant OR STYLE IS Madrigal OR STYLE IS Motet OR STYLE IS Organum OR STYLE IS Saltarero OR STYLE IS Choral OR STYLE IS Ballade OR STYLE IS Canzona OR STYLE IS Carol OR STYLE IS Fantasia OR STYLE IS Galliard OR STYLE IS Intermedio OR STYLE IS Lauda OR STYLE IS Litany OR STYLE IS Madrigal OR STYLE IS Madrigal OR STYLE IS Comedy OR STYLE IS Madrigale Spirituale OR STYLE IS Mass OR STYLE IS Motet OR STYLE IS Motet-Chanson OR STYLE IS Opera OR STYLE IS Pavane OR STYLE IS Ricercar OR STYLE IS Sequence OR STYLE IS Tiento OR STYLE IS Toccata OR STYLE IS Allemande OR STYLE IS Canon OR STYLE IS Cantata OR STYLE IS Chaconne OR STYLE IS Concerto OR STYLE IS Courante OR STYLE IS Fugue OR STYLE IS Classical Gavotte OR STYLE IS Gigue OR STYLE IS Minuet OR STYLE IS Opera OR STYLE IS Oratorio OR STYLE IS Partita OR STYLE IS Passacaglia OR STYLE IS Passepied OR STYLE IS Prelude OR STYLE IS Sarabande OR STYLE IS Sinfonia OR STYLE IS Sonata OR STYLE IS Suite OR STYLE IS Sonatina OR STYLE IS Bagatelle OR STYLE IS Ballade OR STYLE IS Ballet OR STYLE IS Caprice OR STYLE IS Carol OR STYLE IS Concerto OR STYLE IS Dance OR STYLE IS Divertimento OR STYLE IS Étude OR STYLE IS Fantasy OR STYLE IS Impromptu OR STYLE IS Intermezzo OR STYLE IS Lied OR STYLE IS Mass OR STYLE IS Classical Mazurka OR STYLE IS March OR STYLE IS Music Hall OR STYLE IS Nocturne OR STYLE IS Octet OR STYLE IS Polonaise OR STYLE IS Quartet OR STYLE IS Quintet OR STYLE IS Requiem OR STYLE IS Rhapsody OR STYLE IS Rondo OR STYLE IS Scherzo OR STYLE IS Serenade OR STYLE IS Sinfonia Concertante OR STYLE IS Symphony OR STYLE IS Waltz OR STYLE IS Avant-Garde Classical OR STYLE IS Contemporary Classical OR STYLE IS Neo-Classical OR STYLE IS Third Stream OR STYLE IS Ambient Classical)").Count === 1 : false;	
								// Apply right model for key according to genre
								if (bElectronic && data.tonal.hasOwnProperty('key_edma')) {method = 'key_edma';} // Electronic
								else if (bClassical && data.tonal.hasOwnProperty('key_temperley')) {method = 'key_temperley';} // Euroclassical
								else if (data.tonal.hasOwnProperty('key_krumhansl')) {method = 'key_krumhansl';} // Pop and general
								else {return;}
								val = data.tonal[method].key;
								scale = (data.tonal[method].scale || '').toLowerCase();
								if (val.length) {tag[key] = val + (scale === 'minor' ? 'm' : '');}
							} else if (key === 'DANCENESS' && data.hasOwnProperty('rhythm')) {
								val = data.rhythm.danceability;
								if (Number.isFinite(val)) {tag[key] = round(val, 2);}
							} else if (key === 'LRA' && data.hasOwnProperty('lowlevel') && data.lowlevel.hasOwnProperty('loudness_ebu128')) {
								val = data.lowlevel.loudness_ebu128.loudness_range;
								if (Number.isFinite(val)) {tag[key] = round(val, 2);}
							}
						});
						if (Object.keys(tag).length === tagNameLen) {
							items.push(handle);
							tags.push(tag);
						} else {failedItems.push(path);}
					} else {failedItems.push(path);}
					const progress = Math.round((i + 1) / iSteps * 10) * 10;
					if (progress > prevProgress) {prevProgress = progress; console.log('Essentia high level data extracting ' + progress + '%.');}
				} else {failedItems.push(path);}
			});
			_deleteFile(essentiaJSON);
			const itemsLength = items.length;
			totalItems += itemsLength;
			if (itemsLength) {
				if (itemsLength === tags.length) {
					new FbMetadbHandleList(items).UpdateFileInfoFromJSON(JSON.stringify(tags));
					if (maxCount > 1) {console.log(itemsLength,'items tagged.');} // Don't repeat this line when all is done in 1 step. Will be printed also later
					bDone = bDone;
				} else {bDone = false; console.log('Tagging failed: unknown error.');}
			}
	}
	for (let count = 0; count < maxCount; count++) {
		calcTag(count);
	}
	const failedItemsLen = failedItems.length;
	console.popup(totalTracks + ' items processed.\n' + totalItems + ' items tagged.\n' + failedItemsLen + ' items failed.' + (failedItemsLen ? '\n\nList of failed items:\n' + failedItems.join('\n') : ''), 'Essentia Music extractor');
	if (bProfile) {profile.Print('Save high level tags to files - completed in ');}
	return bDone;
}