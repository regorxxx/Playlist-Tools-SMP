'use strict';
//29/07/24

/* global menusEnabled:readable, readmes:readable, menu:readable, newReadmeSep:readable, scriptName:readable, defaultArgs:readable, disabledCount:writable, menuAltAllowed:readable, menuDisabled:readable, menu_properties:writable, overwriteMenuProperties:readable, specialMenu:readable, forcedQueryMenusEnabled:readable, menu_panelProperties:readable, configMenu:readable, isPlayCount:readable, createSubMenuEditEntries:readable, stripSort:readable */

/* global MF_GRAYED:readable, folders:readable, _isFile:readable, globTags:readable, clone:readable, MF_STRING:readable, globQuery:readable, isJSON:readable, Input:readable, _qCond:readable, queryJoin:readable, queryCombinations:readable */

// Pools
{
	const scriptPath = folders.xxx + 'main\\pools\\pools.js';
	/* global _pools:readable */
	if (_isFile(scriptPath)) {
		const name = 'Pools';
		if (!Object.hasOwn(menusEnabled, name) || menusEnabled[name] === true) {
			include(scriptPath.replace(folders.xxx + 'main\\', '..\\'));
			readmes[newReadmeSep()] = 'sep';
			readmes[name] = folders.xxx + 'helpers\\readme\\playlist_tools_menu_pools.txt';
			readmes[name + ' (allowed keys)'] = folders.xxx + '\\presets\\Playlist Tools\\pools\\allowedKeys.txt';
			forcedQueryMenusEnabled[name] = true;
			let menuName = menu.newMenu(name);
			const nameGraph = 'Search similar by Graph';
			const nameDynGenre = 'Search similar by DynGenre';
			const nameWeight = 'Search similar by Weight';
			const bEnableSearchDistance = !Object.hasOwn(menusEnabled, nameGraph) || !Object.hasOwn(menusEnabled, nameDynGenre) || !Object.hasOwn(menusEnabled, nameWeight) || !Object.hasOwn(menusEnabled, specialMenu) || menusEnabled[nameGraph] === true || menusEnabled[nameDynGenre] === true || menusEnabled[nameWeight] === true || menusEnabled[specialMenu] === true;
			const plsManHelper = folders.xxx + 'main\\playlist_manager\\playlist_manager_helpers.js';
			if (_isFile(plsManHelper)) { include(plsManHelper.replace(folders.xxx + 'main\\', '..\\')); }
			const bEnablePlsMan = typeof loadPlaylistsFromFolder !== 'undefined';
			const poolsGen = new _pools({
				sortBias: defaultArgs.sortBias,
				checkDuplicatesBy: defaultArgs.checkDuplicatesBy,
				bAdvTitle: defaultArgs.bAdvTitle,
				bMultiple: defaultArgs.bMultiple,
				bAdvancedShuffle: menu_properties.bSmartShuffleAdvc[1],
				smartShuffleSortBias: menu_properties.smartShuffleSortBias[1],
				keyTag: defaultArgs.keyTag,
				bEnableSearchDistance,
				bEnablePlsMan,
				playlistPath: bEnablePlsMan ? JSON.parse(menu_panelProperties.playlistPath[1]) : [],
				bDebug: defaultArgs.bDebug,
				bProfile: defaultArgs.bProfile,
				title: 'Playlist Tools'
			});
			{	// Pools
				const plLen = defaultArgs.playlistLength;
				const plLenHalf = Math.floor(plLen / 2) + Math.ceil(plLen % 4 / 2);
				const plLenQuart = Math.floor(plLen / 4);
				let pools = [
					...[ // Top tracks
						{
							folder: 'Top tracks',
							name: 'Top tracks mix', pool: {
								fromPls: {
									_LIBRARY_0: plLenQuart,
									_LIBRARY_1: plLenQuart,
									_LIBRARY_2: plLenHalf
								},
								query: {
									_LIBRARY_0: globTags.rating + ' EQUAL 3 AND ' + globQuery.noInstrumental,
									_LIBRARY_1: globTags.rating + ' EQUAL 4',
									_LIBRARY_2: globTags.rating + ' EQUAL 5'
								},
								toPls: 'Top tracks mix',
								sort: '', // Random
							}
						},
						{
							folder: 'Top tracks',
							name: 'Top tracks mix (harmonic)', pool: {
								fromPls: {
									_LIBRARY_0: plLenQuart,
									_LIBRARY_1: plLenQuart,
									_LIBRARY_2: plLenHalf
								},
								query: {
									_LIBRARY_0: globTags.rating + ' EQUAL 3 AND ' + globQuery.noInstrumental,
									_LIBRARY_1: globTags.rating + ' EQUAL 4',
									_LIBRARY_2: globTags.rating + ' EQUAL 5'
								},
								toPls: 'Top tracks mix',
								harmonicMix: true
							}
						},
						{
							folder: 'Top tracks',
							name: 'Top tracks mix (intercalate)', pool: {
								fromPls: {
									_LIBRARY_0: plLenQuart,
									_LIBRARY_1: plLenQuart,
									_LIBRARY_2: plLenHalf
								},
								query: {
									_LIBRARY_0: globTags.rating + ' EQUAL 3 AND ' + globQuery.noInstrumental,
									_LIBRARY_1: globTags.rating + ' EQUAL 4',
									_LIBRARY_2: globTags.rating + ' EQUAL 5'
								},
								insertMethod: 'intercalate',
								toPls: 'Top tracks mix'
							}
						},
						{ folder: 'Top tracks', name: 'sep' },
						{
							folder: 'Top tracks',
							name: 'Top this year tracks mix', pool: {
								fromPls: {
									_LIBRARY_0: plLenQuart,
									_LIBRARY_1: plLenQuart,
									_LIBRARY_2: plLenHalf
								},
								query: {
									_LIBRARY_0: globTags.rating + ' EQUAL 3 AND ' + _qCond(globTags.date) + ' GREATER #$sub(#YEAR#,1)#',
									_LIBRARY_1: globTags.rating + ' EQUAL 4 AND ' + _qCond(globTags.date) + ' GREATER #$sub(#YEAR#,1)#',
									_LIBRARY_2: globTags.rating + ' EQUAL 5 AND ' + _qCond(globTags.date) + ' GREATER #$sub(#YEAR#,1)#'
								},
								toPls: 'Top last year tracks mix',
								sort: '',
							}
						},
						{
							folder: 'Top tracks',
							name: 'Top last 5 years tracks mix', pool: {
								fromPls: {
									_LIBRARY_0: plLenQuart,
									_LIBRARY_1: plLenQuart,
									_LIBRARY_2: plLenHalf
								},
								query: {
									_LIBRARY_0: globTags.rating + ' EQUAL 3 AND ' + _qCond(globTags.date) + ' GREATER #$sub(#YEAR#,5)#',
									_LIBRARY_1: globTags.rating + ' EQUAL 4 AND ' + _qCond(globTags.date) + ' GREATER #$sub(#YEAR#,5)#',
									_LIBRARY_2: globTags.rating + ' EQUAL 5 AND ' + _qCond(globTags.date) + ' GREATER #$sub(#YEAR#,5)#'
								},
								toPls: 'Top last 5 years tracks mix',
								sort: '',
							}
						},
						{
							folder: 'Top tracks',
							name: 'Top last 10 years tracks mix', pool: {
								fromPls: {
									_LIBRARY_0: plLenQuart,
									_LIBRARY_1: plLenQuart,
									_LIBRARY_2: plLenHalf
								},
								query: {
									_LIBRARY_0: globTags.rating + ' EQUAL 3 AND ' + _qCond(globTags.date) + ' GREATER #$sub(#YEAR#,10)#',
									_LIBRARY_1: globTags.rating + ' EQUAL 4 AND ' + _qCond(globTags.date) + ' GREATER #$sub(#YEAR#,10)#',
									_LIBRARY_2: globTags.rating + ' EQUAL 5 AND ' + _qCond(globTags.date) + ' GREATER #$sub(#YEAR#,10)#'
								},
								toPls: 'Top last 10 years tracks mix',
								sort: '',
							}
						},
						{ folder: 'Top tracks', name: 'sep' },
						{
							folder: 'Top tracks',
							name: 'Top recently played tracks mix', pool: {
								fromPls: {
									_LIBRARY_0: plLenQuart,
									_LIBRARY_1: plLenQuart,
									_LIBRARY_2: plLenHalf
								},
								query: {
									_LIBRARY_0: globTags.rating + ' EQUAL 3 AND (%LAST_PLAYED_ENHANCED% DURING LAST 5 WEEKS OR %LAST_PLAYED% DURING LAST 5 WEEKS)',
									_LIBRARY_1: globTags.rating + ' EQUAL 4 AND (%LAST_PLAYED_ENHANCED% DURING LAST 5 WEEKS OR %LAST_PLAYED% DURING LAST 5 WEEKS)',
									_LIBRARY_2: globTags.rating + ' EQUAL 5 AND (%LAST_PLAYED_ENHANCED% DURING LAST 5 WEEKS OR %LAST_PLAYED% DURING LAST 5 WEEKS)'
								},
								toPls: 'Top recently played tracks mix',
								sort: '',
							}
						},
						{
							folder: 'Top tracks',
							name: 'Top recently added tracks mix', pool: {
								fromPls: {
									_LIBRARY_0: plLenQuart,
									_LIBRARY_1: plLenQuart,
									_LIBRARY_2: plLenHalf
								},
								query: {
									_LIBRARY_0: globTags.rating + ' EQUAL 3 AND %ADDED% DURING LAST 5 WEEKS',
									_LIBRARY_1: globTags.rating + ' EQUAL 4 AND %ADDED% DURING LAST 5 WEEKS',
									_LIBRARY_2: globTags.rating + ' EQUAL 5 AND %ADDED% DURING LAST 5 WEEKS'
								},
								toPls: 'Top recently added tracks mix',
								sort: '',
							}
						},
						{ folder: 'Top tracks', name: 'sep' },
						{
							folder: 'Top tracks',
							name: 'Top not played tracks mix', pool: {
								fromPls: {
									_LIBRARY_0: plLenQuart,
									_LIBRARY_1: plLenQuart,
									_LIBRARY_2: plLenHalf
								},
								query: {
									_LIBRARY_0: globTags.rating + ' EQUAL 3 AND NOT (%LAST_PLAYED_ENHANCED% DURING LAST 2 WEEKS OR %LAST_PLAYED% DURING LAST 2 WEEKS)',
									_LIBRARY_1: globTags.rating + ' EQUAL 4 AND NOT (%LAST_PLAYED_ENHANCED% DURING LAST 2 WEEK OR %LAST_PLAYED% DURING LAST 2 WEEK)',
									_LIBRARY_2: globTags.rating + ' EQUAL 5 AND NOT (%LAST_PLAYED_ENHANCED% DURING LAST 2 WEEKS OR %LAST_PLAYED% DURING LAST 2 WEEKS)'
								},
								toPls: 'Top not played tracks mix',
								sort: '',
							}
						},
						{
							folder: 'Top tracks',
							name: 'Top not played this year tracks mix', pool: {
								fromPls: {
									_LIBRARY_0: plLenQuart,
									_LIBRARY_1: plLenQuart,
									_LIBRARY_2: plLenHalf
								},
								query: {
									_LIBRARY_0: globTags.rating + ' EQUAL 3 AND NOT (%LAST_PLAYED_ENHANCED% DURING LAST 2 WEEKS OR %LAST_PLAYED% DURING LAST 2 WEEKS) AND ' + _qCond(globTags.date) + ' GREATER #$sub(#YEAR#,1)#',
									_LIBRARY_1: globTags.rating + ' EQUAL 4 AND NOT (%LAST_PLAYED_ENHANCED% DURING LAST 2 WEEKS OR %LAST_PLAYED% DURING LAST 2 WEEKS) AND ' + _qCond(globTags.date) + ' GREATER #$sub(#YEAR#,1)#',
									_LIBRARY_2: globTags.rating + ' EQUAL 5 AND NOT (%LAST_PLAYED_ENHANCED% DURING LAST 2 WEEKS OR %LAST_PLAYED% DURING LAST 2 WEEKS) AND ' + _qCond(globTags.date) + ' GREATER #$sub(#YEAR#,1)#'
								},
								toPls: 'Top not played this year tracks mix',
								sort: '',
							}
						},
						{
							folder: 'Top tracks',
							name: 'Top not played last 5 years tracks mix', pool: {
								fromPls: {
									_LIBRARY_0: plLenQuart,
									_LIBRARY_1: plLenQuart,
									_LIBRARY_2: plLenHalf
								},
								query: {
									_LIBRARY_0: globTags.rating + ' EQUAL 3 AND NOT (%LAST_PLAYED_ENHANCED% DURING LAST 2 WEEKS OR %LAST_PLAYED% DURING LAST 2 WEEKS) AND ' + _qCond(globTags.date) + ' GREATER #$sub(#YEAR#,5)#',
									_LIBRARY_1: globTags.rating + ' EQUAL 4 AND NOT (%LAST_PLAYED_ENHANCED% DURING LAST 2 WEEKS OR %LAST_PLAYED% DURING LAST 2 WEEKS) AND ' + _qCond(globTags.date) + ' GREATER #$sub(#YEAR#,5)#',
									_LIBRARY_2: globTags.rating + ' EQUAL 5 AND NOT (%LAST_PLAYED_ENHANCED% DURING LAST 2 WEEKS OR %LAST_PLAYED% DURING LAST 2 WEEKS) AND ' + _qCond(globTags.date) + ' GREATER #$sub(#YEAR#,5)#'
								},
								toPls: 'Top not played last 5 years tracks mix',
								sort: '',
							}
						},
					],
					{ name: 'sep' },
					...[ // From selection
						{
							folder: 'From current track',
							name: 'Current genre/style and top tracks', pool: {
								fromPls: {
									_LIBRARY_0: plLenQuart,
									_LIBRARY_1: plLenQuart,
									_LIBRARY_2: plLenHalf
								},
								query: {
									_LIBRARY_0: '' + globTags.genre + ' IS #' + globTags.genre + '# AND NOT (' + globTags.rating + ' EQUAL 2 OR ' + globTags.rating + ' EQUAL 1)',
									_LIBRARY_1: globTags.style + ' IS #' + globTags.style + '# AND NOT (' + globTags.rating + ' EQUAL 2 OR ' + globTags.rating + ' EQUAL 1)',
									_LIBRARY_2: globTags.rating + ' EQUAL 5'
								},
								toPls: 'Current genre/style and top tracks',
								sort: '',
							}
						},
						{
							folder: 'From current track',
							name: 'Current genre/style and instrumentals', pool: {
								fromPls: {
									_LIBRARY_0: plLenHalf,
									_LIBRARY_1: plLenQuart,
									_LIBRARY_2: plLenQuart
								},
								query: {
									_LIBRARY_0: '((' + globTags.genre + ' IS #' + globTags.genre + '#) OR (' + globTags.style + ' IS #' + globTags.style + '#)) AND NOT (' + globTags.rating + ' EQUAL 2 OR ' + globTags.rating + ' EQUAL 1)',
									_LIBRARY_1: '((' + globTags.genre + ' IS #' + globTags.genre + '#) OR (' + globTags.style + ' IS #' + globTags.style + '#)) AND ' + globTags.rating + ' EQUAL 5',
									_LIBRARY_2: '((' + globTags.genre + ' IS #' + globTags.genre + '#) OR (' + globTags.style + ' IS #' + globTags.style + '#)) AND (' + globQuery.instrumental + ') AND NOT (' + globTags.rating + ' EQUAL 2 OR ' + globTags.rating + ' EQUAL 1)'
								},
								toPls: 'Current genre/style and instrumentals',
								sort: '',
							}
						},
						{
							folder: 'From current track',
							name: 'Current artist\'s top tracks', pool: {
								fromPls: {
									_LIBRARY_0: plLenHalf,
									_LIBRARY_1: plLenHalf
								},
								query: {
									_LIBRARY_0: globTags.artist + ' IS #' + globTags.artistRaw + '# AND ' + globTags.rating + ' EQUAL 4',
									_LIBRARY_1: globTags.artist + ' IS #' + globTags.artistRaw + '# AND ' + globTags.rating + ' EQUAL 5',
								},
								toPls: 'Current artist\'s top tracks',
								sort: '',
							}
						},
					],
					{ name: 'sep' },
					...[ // Classic Pools
						{
							folder: 'Classic Pools',
							name: 'Classic Pools (50 artists current genre)', pool: {
								fromPls: { _GROUP_0: 50 },
								group: { _GROUP_0: globTags.artist },
								limit: { _GROUP_0: 3 },
								query: { _GROUP_0: '' + globTags.genre + ' IS #' + globTags.genre + '#' },
								toPls: 'Classic Pools (50 artists current genre)',
								sort: '',
							}
						},
						{
							folder: 'Classic Pools',
							name: 'Classic Pools (50 random artists)', pool: {
								fromPls: { _GROUP_0: 50 },
								group: { _GROUP_0: globTags.artist },
								limit: { _GROUP_0: 3 },
								query: { _GROUP_0: '' },
								toPls: 'Classic Pools (50 artists)',
								sort: '',
							}
						},
						{
							folder: 'Classic Pools',
							name: 'Classic Pools (all dates)', pool: {
								fromPls: { _GROUP_0: Infinity },
								group: { _GROUP_0: globTags.date },
								limit: { _GROUP_0: 2 },
								query: { _GROUP_0: '' },
								toPls: 'Classic Pools (all dates)',
								sort: globTags.date,
							}
						},
						{
							folder: 'Classic Pools',
							name: 'Classic Pools (3 tracks per letter)', pool: {
								fromPls: { _GROUP_0: Infinity },
								group: { _GROUP_0: '$lower($ascii($left(' + globTags.artist + ',1)))' },
								limit: { _GROUP_0: 3 },
								query: { _GROUP_0: '' },
								toPls: 'Classic Pools (3 tracks per letter)',
								sort: '',
							}
						},
						{
							folder: 'Classic Pools',
							name: 'Classic Pools (3 tracks per genre)', pool: {
								fromPls: { _GROUP_0: Infinity },
								group: { _GROUP_0: globTags.genre },
								limit: { _GROUP_0: 3 },
								query: { _GROUP_0: '' },
								toPls: 'Classic Pools (3 tracks per genre)',
								sort: '',
							}
						},
					],
					{ name: 'sep' },
					...[ // Genre mixes
						{
							name: 'Dark Metal',
							folder: 'Genre mixes',
							pool: {
								fromPls: {
									_LIBRARY_0: 10,
									_LIBRARY_1: 5,
									_LIBRARY_2: 8,
									_LIBRARY_3: 8,
									_LIBRARY_4: 5,
									_LIBRARY_5: 5,
									_LIBRARY_6: 5
								},
								query: {
									_LIBRARY_0: '(STYLE IS black metal OR STYLE IS stoner doom OR STYLE IS doom metal OR STYLE IS death metal) AND %RATING% IS 5',
									_LIBRARY_1: 'STYLE IS black metal AND NOT STYLE IS folk metal AND (%RATING% IS 4 OR %RATING% IS 3)',
									_LIBRARY_2: 'STYLE IS stoner doom AND NOT STYLE IS folk metal AND (%RATING% IS 4 OR %RATING% IS 3)',
									_LIBRARY_3: 'STYLE IS doom metal AND NOT STYLE IS folk metal AND (%RATING% IS 4 OR %RATING% IS 3)',
									_LIBRARY_4: 'STYLE IS folk metal AND (STYLE IS black metal OR STYLE IS stoner doom OR STYLE IS doom metal OR STYLE IS death metal) AND %RATING% GREATER 2',
									_LIBRARY_5: '(STYLE IS black metal OR STYLE IS stoner doom OR STYLE IS doom metal OR STYLE IS death metal) AND GENRE IS instrumental AND %RATING% GREATER 2',
									_LIBRARY_6: '(STYLE IS black metal AND STYLE IS ambient metal) OR (STYLE IS atmospheric black metal) OR (STYLE IS death metal AND STYLE IS acoustic) AND %RATING% GREATER 3'
								},
								toPls: 'Dark Metal',
								smartShuffle: 'ARTIST'
							}
						},
						{
							name: 'Kawaii Rock and Metal',
							folder: 'Genre mixes',
							pool: {
								fromPls: {
									_LIBRARY_0: 10,
									_LIBRARY_1: 5,
									_LIBRARY_2: 10,
									_LIBRARY_3: 5,
									_LIBRARY_4: 10
								},
								query: {
									_LIBRARY_0: 'STYLE IS kawaii metal AND %RATING% IS 5',
									_LIBRARY_1: 'STYLE IS j-pop AND (GENRE IS rock OR GENRE IS heavy metal) AND %RATING% GREATER 2',
									_LIBRARY_2: 'STYLE IS kawaii metal AND (%RATING% IS 4 OR %RATING% IS 3)',
									_LIBRARY_3: 'STYLE IS kawaii metal AND GENRE IS instrumental AND %RATING% GREATER 2',
									_LIBRARY_4: 'STYLE IS kawaii metal OR (STYLE IS j-pop AND (GENRE IS rock OR GENRE IS heavy metal)) AND STYLE IS female vocal AND %RATING% GREATER 2'
								},
								toPls: 'Kawaii Metal',
								smartShuffle: 'ARTIST'
							}
						},
						{
							name: 'Chill and Downtempo',
							folder: 'Genre mixes',
							pool: {
								fromPls: {
									_LIBRARY_0: 13,
									_LIBRARY_1: 8,
									_LIBRARY_2: 8,
									_LIBRARY_3: 4,
									_LIBRARY_4: 13,
									_LIBRARY_5: 4
								},
								query: {
									_LIBRARY_0: '(STYLE IS chill-out downtempo OR STYLE IS trip hop OR STYLE IS deep house) AND %RATING% IS 5',
									_LIBRARY_1: 'STYLE IS trip hop AND (MOOD IS not aggressive AND MOOD IS relaxed) AND (%RATING% IS 4 OR %RATING% IS 3)',
									_LIBRARY_2: '(STYLE IS contemporary r&b OR STYLE IS neo soul) AND (MOOD IS not aggressive AND MOOD IS relaxed) AND (%RATING% IS 4 OR %RATING% IS 3)',
									_LIBRARY_3: 'STYLE IS deep house AND (MOOD IS not aggressive AND MOOD IS relaxed AND BPM LESS 140) AND (%RATING% IS 4 OR %RATING% IS 3)',
									_LIBRARY_4: '(STYLE IS chill-out downtempo OR STYLE IS trip hop OR STYLE IS deep house) AND STYLE IS female vocal AND (MOOD IS not aggressive AND MOOD IS relaxed) AND %RATING% GREATER 2',
									_LIBRARY_5: '(STYLE IS chill-out downtempo OR STYLE IS trip hop OR STYLE IS deep house) AND GENRE IS instrumental AND (MOOD IS not aggressive AND MOOD IS relaxed) AND %RATING% GREATER 2'
								},
								toPls: 'Chill and Downtempo',
								smartShuffle: 'ARTIST'
							}
						},
						{
							name: 'Spanish Urban Music',
							folder: 'Genre mixes',
							pool: {
								fromPls: {
									_LIBRARY_0: 6,
									_LIBRARY_1: 8,
									_LIBRARY_2: 8,
									_LIBRARY_3: 4,
									_LIBRARY_4: 13,
									_LIBRARY_5: 4,
									_LIBRARY_6: 4,
									_LIBRARY_7: 4,
									_LIBRARY_8: 7
								},
								query: {
									_LIBRARY_0: '(STYLE IS trap OR GENRE IS hip-hop) AND (LANGUAGE IS spa OR STYLE IS spanish hip-hop) AND NOT (STYLE IS rap metal) AND %RATING% IS 5',
									_LIBRARY_1: '(STYLE IS trap OR GENRE IS hip-hop) AND (LANGUAGE IS spa OR STYLE IS spanish hip-hop OR STYLE IS latin trap) AND NOT (STYLE IS rap metal) AND (%RATING% IS 4 OR %RATING% IS 3)',
									_LIBRARY_2: 'STYLE IS spanish hip-hop AND NOT (STYLE IS rap metal) AND (%RATING% IS 4 OR %RATING% IS 3)',
									_LIBRARY_3: '(STYLE IS flamenco OR STYLE IS rumba flamenca) AND GENRE IS hip-hop AND %RATING% GREATER 2',
									_LIBRARY_4: '(STYLE IS trap OR GENRE IS hip-hop) AND (LANGUAGE IS spa OR STYLE IS spanish hip-hop OR STYLE IS latin trap) AND NOT (STYLE IS rap metal) AND STYLE IS female vocal AND %RATING% GREATER 2',
									_LIBRARY_5: 'STYLE IS nuevo flamenco AND GENRE IS hip-hop AND DATE GREATER 2000 AND %RATING% GREATER 3',
									_LIBRARY_6: '(STYLE IS flamenco rock OR STYLE IS flamenco OR STYLE IS rumba flamenca) AND (STYLE IS spanish folk OR STYLE IS spanish rock) AND DATE GREATER 2000 AND %RATING% GREATER 3',
									_LIBRARY_7: '(STYLE IS rumba fusion OR STYLE IS rumba) AND STYLE IS spanish rock AND DATE GREATER 2000 AND %RATING% GREATER 3',
									_LIBRARY_8: '(STYLE IS trap OR GENRE IS hip-hop) AND (LANGUAGE IS spa OR STYLE IS spanish hip-hop OR STYLE IS latin trap) AND NOT (STYLE IS rap metal) AND %RATING% IS 5',
								},
								toPls: 'Spanish Urban Music',
								smartShuffle: 'ARTIST'
							}
						},
						{
							name: 'Gothic Rock',
							folder: 'Genre mixes',
							pool: {
								fromPls: {
									_LIBRARY_0: 13,
									_LIBRARY_1: 10,
									_LIBRARY_2: 15,
									_LIBRARY_3: 4,
									_LIBRARY_4: 4,
									_LIBRARY_5: 4
								},
								query: {
									_LIBRARY_0: '(STYLE IS darkwave OR STYLE IS gothic rock OR STYLE IS post-punk) AND %RATING% IS 5',
									_LIBRARY_1: '(STYLE IS darkwave OR STYLE IS gothic rock OR STYLE IS post-punk) AND DATE LESS 2000 AND %RATING% IS 5',
									_LIBRARY_2: '(STYLE IS darkwave OR STYLE IS gothic rock OR STYLE IS post-punk) AND %RATING% GREATER 2',
									_LIBRARY_3: '(STYLE IS darkwave OR STYLE IS gothic rock OR STYLE IS post-punk) AND STYLE IS female vocal AND %RATING% GREATER 2',
									_LIBRARY_4: '(STYLE IS gothic metal) AND %RATING% GREATER 3',
									_LIBRARY_5: '(STYLE IS darksynth OR STYLE IS dark techno) AND %RATING% GREATER 3'
								},
								toPls: 'Gothic Rock',
								smartShuffle: 'ARTIST'
							}
						},
						{
							name: 'Gothic Metal',
							folder: 'Genre mixes',
							pool: {
								fromPls: {
									_LIBRARY_0: 5,
									_LIBRARY_1: 5,
									_LIBRARY_2: 5,
									_LIBRARY_3: 5,
									_LIBRARY_4: 7,
									_LIBRARY_5: 7,
									_LIBRARY_6: 5,
									_LIBRARY_7: 5,
									_LIBRARY_8: 5
								},
								query: {
									_LIBRARY_0: 'STYLE IS gothic metal AND %RATING% IS 5',
									_LIBRARY_1: 'STYLE IS atmospheric black metal AND %RATING% GREATER 3',
									_LIBRARY_2: 'STYLE IS black metal AND %RATING% IS 5',
									_LIBRARY_3: '(STYLE IS dark techno OR STYLE IS dark ambient) AND GENRE IS heavy metal AND %RATING% GREATER 3',
									_LIBRARY_4: 'STYLE IS doom metal AND GENRE IS heavy metal AND %RATING% GREATER 3',
									_LIBRARY_5: 'STYLE IS doom metal AND GENRE IS heavy metal AND STYLE IS female vocal AND %RATING% GREATER 3',
									_LIBRARY_6: 'STYLE IS doom metal AND (%RATING% IS 5 OR STYLE IS female vocal AND %RATING% IS 4)',
									_LIBRARY_7: '(STYLE IS pagan metal OR STYLE IS sludge metal OR STYLE IS stoner doom OR STYLE IS stoner sludge) AND GENRE IS heavy metal AND %RATING% GREATER 3',
									_LIBRARY_8: 'STYLE IS gothic metal AND STYLE IS female vocal AND %RATING% IS 5'
								},
								toPls: 'Gothic Rock',
								smartShuffle: 'ARTIST'
							}
						}
					]
				];
				const musicGraphPools = [];
				const scriptPathGraph = folders.xxx + 'main\\music_graph\\music_graph_descriptors_xxx.js';
				if (_isFile(scriptPathGraph)) {
					/* global music_graph_descriptors:readable */
					include(scriptPathGraph.replace(folders.xxx + 'main\\', '..\\'));
					pools.push({ name: 'sep' });
					[...music_graph_descriptors.style_cluster, ...music_graph_descriptors.style_supergenre]
						.forEach((cluster) => {
							const genres = [...new Set(music_graph_descriptors.replaceWithSubstitutionsReverse(cluster[1]).concat(cluster[1]))];
							const genreQuery = queryJoin(
								queryCombinations(genres.map((s) => s.toLowerCase()), [globTags.genre, globTags.style], 'OR')
								, 'OR'
							);
							// Some groups require further splitting or finetuning
							const versions = (() => {
								const name = cluster[0].replace('_supergenre', ' Supergenre');
								if (cluster[0] === 'Downtempo_supergenre') {
									return [
										{
											name: 'Electronic ' + name,
											subFolder: music_graph_descriptors.getStyleGroup(cluster[0].replace('_supergenre', '')),
											query: queryJoin([
												genreQuery,
												queryJoin(queryCombinations(['electronic', 'hip-hop', 'electropop', 'industrial', 'synth-pop', 'trip-hop', 'future soul', 'contemporary r&b', 'chill-out downtempo'], [globTags.genre, globTags.style], 'OR'),'OR')
											], 'AND')
										},
										{
											name,
											subFolder: 'Other styles',
											query: queryJoin([
												genreQuery,
												queryJoin(queryCombinations(['electronic', 'hip-hop', 'electropop', 'industrial', 'synth-pop', 'trip-hop', 'future soul', 'contemporary r&b', 'chill-out downtempo'], [globTags.genre, globTags.style], 'OR'),'OR')
											], 'AND NOT')
										}
									];
								} else if (cluster[0] === 'Hardcore Punk_supergenre') {
									return [
										{
											name: 'Hardcore Rock-Metal Supergenre',
											subFolder: 'Metal and Hard Rock',
											query: queryJoin([
												genreQuery,
												queryJoin(queryCombinations(['heavy metal', 'hard rock'], [globTags.genre, globTags.style], 'OR'),'OR')
											], 'AND')
										},
										{
											name: 'Hardcore Psy-Alt-Punk Supergenre',
											subFolder: music_graph_descriptors.getStyleGroup(cluster[0].replace('_supergenre', '')),
											query: queryJoin([
												genreQuery,
												queryJoin(queryCombinations(['heavy metal', 'hard rock'], [globTags.genre, globTags.style], 'OR'),'OR')
											], 'AND NOT')
										}
									];
								} else {
									return [
										{
											name,
											subFolder: music_graph_descriptors.getStyleGroup(cluster[0].replace('_supergenre', '')),
											query: genreQuery,
										}
									];
								}
							})();
							versions.forEach((version) => {
								const pool = {
									name: version.name,
									folder: 'Music Graph mixes',
									subFolder: version.subFolder,
									pool: {
										fromPls: {
											_LIBRARY_0: 10,
											_LIBRARY_1: 15,
											_LIBRARY_2: 10,
											_LIBRARY_3: 10,
											_LIBRARY_4: 5
										},
										query: {
											_LIBRARY_0: queryJoin(
												[
													version.query,
													globTags.rating + ' IS 5'
												]
												, 'AND'
											),
											_LIBRARY_1: queryJoin(
												[
													version.query,
													globTags.rating + ' IS 3'
												]
												, 'AND'
											),
											_LIBRARY_2: queryJoin(
												[
													version.query,
													globTags.rating + ' GREATER 3'
												]
												, 'AND'
											),
											_LIBRARY_3: queryJoin(
												[
													version.query,
													'(' + globTags.genre + ' IS female vocal OR ' + globTags.style + ' IS female vocal) AND ' + globTags.rating + ' GREATER 2'
												]
												, 'AND'
											),
											_LIBRARY_4: queryJoin(
												[
													version.query,
													queryJoin(queryCombinations(['instrumental', 'ambiental'], [globTags.genre, globTags.style], 'OR'),'OR'),
													globTags.rating + ' GREATER 2'
												]
												, 'AND'
											)
										},
										toPls: version.name,
										smartShuffle: 'ARTIST'
									}
								};
								musicGraphPools.push(pool);
							});
						});
				}
				let selArg = { ...clone(pools[0]), name: 'Custom' };
				const poolsDefaults = [...pools];
				// Create new properties with previous args
				menu_properties['pools'] = [name + ' entries', JSON.stringify(pools)];
				menu_properties['poolsCustomArg'] = [name + '\\Custom pool args', JSON.stringify(selArg)];
				// Checks
				menu_properties['pools'].push({ func: isJSON }, menu_properties['pools'][1]);
				menu_properties['poolsCustomArg'].push({ func: isJSON }, menu_properties['poolsCustomArg'][1]);
				// Menus
				menu.newEntry({ menuName, entryText: 'Use Playlists / Queries as pools:', func: null, flags: MF_GRAYED });
				menu.newEntry({ menuName, entryText: 'sep' });
				menu.newCondEntry({
					entryText: 'Pools (cond)', condFunc: () => {
						// On first execution, must update from property
						selArg = JSON.parse(menu_properties['poolsCustomArg'][1]);
						// Entry list
						pools = JSON.parse(menu_properties['pools'][1]);
						const entryNames = new Set();
						let bSbdSufFolders = false;
						pools.concat(musicGraphPools).forEach((poolObj) => {
							// Add submenus
							let subMenu = Object.hasOwn(poolObj, 'folder')
								? menu.findOrNewMenu(poolObj.folder, menuName)
								: menuName;
							if (Object.hasOwn(poolObj, 'subFolder')) {
								if (!bSbdSufFolders && musicGraphPools.includes(poolObj)) {
									music_graph_descriptors.style_cluster_groups.forEach((group) => menu.findOrNewMenu(group, subMenu));
									bSbdSufFolders = true;
								}
								subMenu = menu.findOrNewMenu(poolObj.subFolder, subMenu);
							}
							// Add separators
							if (Object.hasOwn(poolObj, 'name') && poolObj.name === 'sep') {
								menu.newEntry({ menuName: subMenu, entryText: 'sep' });
							} else {
								// Create names for all entries
								let poolName = poolObj.name || '';
								poolName = poolName.length > 40 ? poolName.substring(0, 40) + ' ...' : poolName;
								if (entryNames.has(poolName)) {
									fb.ShowPopupMessage('There is an entry with duplicated name:\t' + poolName + '\nEdit the custom entries and either remove or rename it.\n\nEntry:\n' + JSON.stringify(poolObj, null, '\t'), scriptName + ': ' + name);
									return;
								} else { entryNames.add(poolName); }
								// Global forced query
								const pool = clone(poolObj.pool);
								if (forcedQueryMenusEnabled[name] && defaultArgs.forcedQuery.length) {
									Object.keys(pool.query).forEach((key) => { // With forced query enabled
										if (pool.query[key].length && pool.query[key].toUpperCase() !== 'ALL') { // ALL query never uses forced query!
											const queryNoSort = stripSort(pool.query[key]);
											const sortedBy = pool.query[key] === queryNoSort
												? ''
												: pool.query[key].replace(queryNoSort, '');
											pool.query[key] = '(' + queryNoSort + ') AND (' + defaultArgs.forcedQuery + ')' + sortedBy;
										} else if (!pool.query[key].length) { // Empty uses forced query or ALL
											pool.query[key] = defaultArgs.forcedQuery;
										}
									});
								} else {
									Object.keys(pool.query).forEach((key) => { // Otherwise empty is replaced with ALL
										if (!pool.query[key].length) {
											pool.query[key] = 'ALL';
										}
									});
								}
								menu.newEntry({
									menuName: subMenu, entryText: poolName, func: () => {
										poolsGen.changeConfig({
											sortBias: defaultArgs.sortBias,
											checkDuplicatesBy: defaultArgs.checkDuplicatesBy,
											bAdvTitle: defaultArgs.bAdvTitle,
											bAdvancedShuffle: menu_properties.bSmartShuffleAdvc[1],
											smartShuffleSortBias: menu_properties.smartShuffleSortBias[1],
											keyTag: defaultArgs.keyTag,
											playlistPath: JSON.parse(menu_panelProperties.playlistPath[1]),
											bDebug: defaultArgs.bDebug,
											bProfile: defaultArgs.bProfile
										}).processPool(pool, menu_properties);
									}
								});
							}
						});
						menu.newEntry({ menuName, entryText: 'sep' });
						{ // Static menu: user configurable
							menu.newEntry({
								menuName, entryText: 'Custom pool...', func: () => {
									// Input
									const input = poolsGen.inputPool(selArg.pool);
									if (!input) { return; }
									const pool = clone(input.pool);
									if (forcedQueryMenusEnabled[name] && defaultArgs.forcedQuery.length) {
										Object.keys(pool.query).forEach((key) => { // With forced query enabled
											if (pool.query[key].length && pool.query[key].toUpperCase() !== 'ALL') { // ALL query never uses forced query!
												pool.query[key] = '(' + pool.query[key] + ') AND (' + defaultArgs.forcedQuery + ')';
											} else if (!pool.query[key].length) { // Empty uses forced query or ALL
												pool.query[key] = defaultArgs.forcedQuery;
											}
										});
									} else {
										Object.keys(pool.query).forEach((key) => { // Otherwise empty is replaced with ALL
											if (!pool.query[key].length) {
												pool.query[key] = 'ALL';
											}
										});
									}
									// Execute
									poolsGen.changeConfig({
										sortBias: defaultArgs.sortBias,
										checkDuplicatesBy: defaultArgs.checkDuplicatesBy,
										bAdvTitle: defaultArgs.bAdvTitle,
										bAdvancedShuffle: menu_properties.bSmartShuffleAdvc[1],
										smartShuffleSortBias: menu_properties.smartShuffleSortBias[1],
										keyTag: defaultArgs.keyTag,
										playlistPath: JSON.parse(menu_panelProperties.playlistPath[1]),
										bDebug: defaultArgs.bDebug,
										bProfile: defaultArgs.bProfile
									}).processPool(pool, menu_properties);
									// For internal use original object
									selArg = { name: 'Custom', ...input };
									menu_properties['poolsCustomArg'][1] = JSON.stringify(selArg); // And update property with new value
									overwriteMenuProperties(); // Updates panel
								}
							});
							// Menu to configure property
							menu.newEntry({ menuName, entryText: 'sep' });
						}
						{	// Add / Remove
							createSubMenuEditEntries(menuName, {
								name,
								list: pools,
								propName: 'pools',
								defaults: poolsDefaults,
								defaultPreset: folders.xxx + 'presets\\Playlist Tools\\pools\\default.json',
								input: poolsGen.inputPool,
								bDefaultFile: true,
								bUseFolders: true
							});
						}
					}
				});
				menu.newCondEntry({
					entryText: 'Get playlist manager path (cond)', condFunc: () => {
						window.NotifyOthers('Playlist manager: playlistPath', null); // Ask to share paths
						poolsGen.changeConfig({ bEnablePlsMan: _isFile(plsManHelper) }); // Safety check
					}
				});
			}
			if (!Object.hasOwn(menusEnabled, configMenu) || menusEnabled[configMenu] === true) {
				const subMenuName = 'Smart shuffle';
				if (!menu.hasMenu(subMenuName, configMenu)) {
					menu.newMenu(subMenuName, configMenu);
					{	// bSmartShuffleAdvc
						menu.newEntry({ menuName: subMenuName, entryText: 'For any tool which uses Smart Shuffle:', func: null, flags: MF_GRAYED });
						menu.newEntry({ menuName: subMenuName, entryText: 'sep' });
						menu.newEntry({
							menuName: subMenuName, entryText: 'Enable extra conditions', func: () => {
								menu_properties.bSmartShuffleAdvc[1] = !menu_properties.bSmartShuffleAdvc[1];
								if (menu_properties.bSmartShuffleAdvc[1]) {
									fb.ShowPopupMessage(
										'Smart shuffle will also try to avoid consecutive tracks with these conditions:' +
										'\n\t-Instrumental tracks.' +
										'\n\t-Live tracks.' +
										'\n\t-Female/male vocals tracks.' +
										'\n\nThese rules apply in addition to the main smart shuffle, swapping tracks' +
										'\nposition whenever possible without altering the main logic.'
										, scriptName + ': ' + configMenu
									);
								}
								overwriteMenuProperties(); // Updates panel
							}
						});
						menu.newCheckMenu(subMenuName, 'Enable extra conditions', void (0), () => { return menu_properties.bSmartShuffleAdvc[1]; });
						{
							const subMenuNameSecond = menu.newMenu('Sorting bias', subMenuName);
							const options = [
								{ key: 'Random', flags: MF_STRING },
								{ key: 'Play count', flags: isPlayCount ? MF_STRING : MF_GRAYED, req: 'foo_playcount' },
								{ key: 'Rating', flags: MF_STRING },
								{ key: 'Popularity', flags: utils.GetPackageInfo('{F5E9D9EB-42AD-4A47-B8EE-C9877A8E7851}') ? MF_STRING : MF_GRAYED, req: 'Find & Play' },
								{ key: 'Last played', flags: isPlayCount ? MF_STRING : MF_GRAYED, req: 'foo_playcount' },
								{ key: 'Key', flags: MF_STRING },
								{ key: 'Key 6A centered', flags: MF_STRING },
							];
							menu.newEntry({ menuName: subMenuNameSecond, entryText: 'Prioritize tracks by:', flags: MF_GRAYED });
							menu.newEntry({ menuName: subMenuNameSecond, entryText: 'sep' });
							options.forEach((opt) => {
								const tf = opt.key.replace(/ /g, '').toLowerCase();
								menu.newEntry({
									menuName: subMenuNameSecond, entryText: opt.key + (opt.flags ? '\t' + opt.req : ''), func: () => {
										menu_properties.smartShuffleSortBias[1] = tf;
										overwriteMenuProperties(); // Updates panel
									}, flags: opt.flags
								});
							});
							menu.newEntry({ menuName: subMenuNameSecond, entryText: 'sep' });
							menu.newEntry({
								menuName: subMenuNameSecond, entryText: 'Custom TF...', func: () => {
									const input = Input.string('string', menu_properties.smartShuffleSortBias[1], 'Enter TF expression:', 'Search by distance', menu_properties.smartShuffleSortBias[3]);
									if (input === null) { return; }
									menu_properties.smartShuffleSortBias[1] = input;
									overwriteMenuProperties(); // Updates panel
								}
							});
							menu.newCheckMenu(subMenuNameSecond, options[0].key, 'Custom TF...', () => {
								const idx = options.findIndex((opt) => opt.key.replace(/ /g, '').toLowerCase() === menu_properties.smartShuffleSortBias[1]);
								return idx !== -1 ? idx : options.length;
							});
						}
					}
					menu.newEntry({ menuName: configMenu, entryText: 'sep' });
				}
			} else { menuDisabled.push({ menuName: configMenu, subMenuFrom: menu.getMainMenuName(), index: menu.getMenus().filter((entry) => { return menuAltAllowed.has(entry.subMenuFrom); }).length + disabledCount++, bIsMenu: true }); } // NOSONAR
		} else { menuDisabled.push({ menuName: name, subMenuFrom: menu.getMainMenuName(), index: menu.getMenus().filter((entry) => { return menuAltAllowed.has(entry.subMenuFrom); }).length + disabledCount++, bIsMenu: true }); }
	}
}