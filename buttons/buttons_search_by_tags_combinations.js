'use strict';
//13/02/25

/*
	Search same by v 1.0 24/08/22
	Search n tracks (randomly) on library matching the conditions given according to the current selected track and tags.
	Note this ONLY USES existing tags, it will not calculate similarity or anything else. i.e. 'dynamic_genre' tag will not
	be calculated on the fly. If some tags are missing, then they get skipped.

	Conditions are set as an object with keys (tags) and values (number of coincidences):
	sameBy = {genre: 1, style: 2 , mood: 5} -> Must match at least 1 genre value, 2 style values and 5 mood values.

	Setting a 0 value for any key (tag) forces matching of all the tag values for that tag name.
	sameBy = {genre: 0, style: 2 , mood: 5} -> Must match all genre values, 2 style values and 5 mood values.

	If X value is greater than the values of a tag, then it simply must match all of them. For ex. if we select a track with 3 moods:
	sameBy = {genre: 0, style: 2 , mood: 5} -> Must match all genre values , 2 style values and (3 < 5) all moods values.

	Setting a -X value for any key (tag) forces matching of all the tag values less X.
	If multi-value tag has less values than x, then must match only one. For ex. if we select a track with 3 genres:
	sameBy = {genre: -1, style: 2 , mood: 5} -> Must match (3-1=) 2 genre values , 2 style values and 5 mood values.
	sameBy = {genre: -2, style: 2 , mood: 5} -> Must match (3-2=) 1 genre values , 2 style values and 5 mood values.
	sameBy = {genre: -10, style: 2 , mood: 5} -> Must match (3 <= 10) 1 genre values, 2 style values and 5 mood values.

	+X/-X value for any key (tag) can be float € (0,1). Outside that range they have no use.
	Final values are rounded, and minimum will always be 1. Maximum all tags values. Also f(-X) = f(1 - X):
	sameBy = {genre: -0.33, style: 2 , mood: 5} -> Must match (n - n * 1/3 = n * 2/3) two thirds of genre values , 2 style values and 5 mood values.
	sameBy = {genre: 0.66, style: 2 , mood: 5} -> Must match (n * 2/3) two thirds of genre values , 2 style values and 5 mood values.
	sameBy = {genre: 0.5, style: 2 , mood: 5} -> Must match (n * 1/2) half of the genre values , 2 style values and 5 mood values.

	After query search, duplicates are removed according to the tags set (checkDuplicatesBy).
	You can change sorting, playlist name and/or force a final query (added to the other requisites).

	- Tags logic -
	Title-format only tags, like rating are acquired via TF, but must be written without '%', like the rest. See dynamicTags.

	When the tags are not strings (genre, etc.) but numeric values (date, etc.), the pair {key: value} work as a range. See numericTags.
	sameBy = {genre: -1, date: 10} -> Must match all genre values and dates between (-10,+10).

	A special subset of numeric tags may be cyclic, so the values can only be within a predefined range. See cyclicTags and cyclicTagsDescriptor.

	- Examples of functionality -
	buttons_search_by_tags_queries {style} <-> use sameBy = {style: 0}
	buttons_search_by_tags_queries {style, artist} <-> use sameBy = {style: 0, artist: 0}
	Tracks from same artist and equal rating <-> use sameBy = {artist: 0, rating: 0}
	Tracks from same genre and style and date within 10 years <-> use sameBy = {genre: 0, style: 0, date: 10}
	Tracks from same genre but allowing n-2 style coincidences and date within 10 years <-> use sameBy = {genre: 0, style: -2, date: 10}

	- Caveat -
	Although the +X/-X notations seem to produce similar results, they don't. Let's say we have a track with n style values, then:
	Using -X notation: final number is always relative to number of tags of selected track.
	5 values && sameBy = {genre: 0, style: -2, date: 10} -> must match (5-2=) 3 styles.
	4 values && sameBy = {genre: 0, style: -2, date: 10} -> must match (4-2=) 2 styles.
	3 values && sameBy = {genre: 0, style: -2, date: 10} -> must match (3-2=) 1 style.
	2 values && sameBy = {genre: 0, style: -2, date: 10} -> must match (2 <= 2) 1 style.
	1 values && sameBy = {genre: 0, style: -2, date: 10} -> must match (2 <= 2) 1 style.
	But using +X notation: final number is a constant value (if possible).
	5 values && sameBy = {genre: 0, style: 2, date: 10} -> must match 2 styles.
	4 values && sameBy = {genre: 0, style: 2, date: 10} -> must match 2 styles.
	3 values && sameBy = {genre: 0, style: 2, date: 10} -> must match 2 styles.
	2 values && sameBy = {genre: 0, style: 2, date: 10} -> must match 2 styles.
	1 values && sameBy = {genre: 0, style: 2, date: 10} -> must match 1 style.
 */

/* global menu_panelProperties:readable */
include('..\\helpers\\helpers_xxx.js');
/* global globFonts:readable, MK_SHIFT:readable, MK_CONTROL:readable, VK_SHIFT:readable, globTags:readable, globQuery:readable, globRegExp:readable, MF_GRAYED:readable */
include('..\\helpers\\buttons_xxx.js');
/* global getButtonVersion:readable, getUniquePrefix:readable, buttonsBar:readable, addButton:readable, ThemedButton:readable */
include('..\\helpers\\buttons_xxx_menu.js');
/* global settingsMenu:readable, _menu:readable  */
include('..\\helpers\\menu_xxx_extras.js');
/* global _createSubMenuEditEntries:readable  */
include('..\\helpers\\helpers_xxx_prototypes.js');
/* global isBoolean:readable, isString:readable, isStringWeak:readable, isJSON:readable, isInt:readable */
include('..\\helpers\\helpers_xxx_UI.js');
/* global _gdiFont:readable, _gr:readable, _scale:readable, chars:readable */
include('..\\helpers\\helpers_xxx_properties.js');
/* global setProperties:readable, getPropertiesPairs:readable, overwriteProperties:readable */
include('..\\helpers\\helpers_xxx_tags.js');
/* global checkQuery:readable */
include('..\\main\\search\\search_same_by.js');
/* global searchSameByCombs:readable */

var prefix = 'ssbytc'; // NOSONAR[global]
var version = getButtonVersion('Playlist-Tools-SMP'); // NOSONAR[global]

try { window.DefineScript('Search Same By Tags (Combinations) Button', { author: 'regorxxx', version, features: { drag_n_drop: false } }); } catch (e) { /* May be loaded along other buttons */ }
prefix = getUniquePrefix(prefix, ''); // Puts new ID before '_'

var newButtonsProperties = { // NOSONAR[global]
	customName: ['Name for the custom UI button', 'Search Same By... (c)', { func: isStringWeak }, 'Search Same By... (c)'],
	playlistLength: ['Max Playlist Mix length', 50, { greater: 0, func: isInt }, 50],
	forcedQuery: ['Forced query to filter database', globQuery.filter, { func: (query) => { return checkQuery(query, true); } }, globQuery.filter],
	checkDuplicatesBy: ['Tags to look for duplicates', JSON.stringify(globTags.remDupl), { func: isJSON }, JSON.stringify(globTags.remDupl)],
	bAdvTitle: ['Advanced RegEx title matching', true, { func: isBoolean }, true],
	bMultiple: ['Partial multi-value tag matching', true, { func: isBoolean }, true],
	sameBy: ['Tags to look for similarity', JSON.stringify({
		[globTags.genre.toUpperCase()]: 1,
		[globTags.style.toUpperCase()]: 2,
		[globTags.mood.toUpperCase()]: 5
	}), { func: isJSON }],
	playlistName: ['Playlist name', 'Search...', { func: isString }, 'Search...'],
	presets: ['Presets', JSON.stringify([
		{
			name: 'By Genre', settings: {
				sameBy: {
					[globTags.genre.toUpperCase()]: 2
				}
			}
		},
		{
			name: 'By Style', settings: {
				sameBy: {
					[globTags.style.toUpperCase()]: 2
				}
			}
		},
		{
			name: 'By Mood', settings: {
				sameBy: {
					[globTags.mood.toUpperCase()]: 2
				}
			}
		},
		{
			name: 'By Genre - Style - Mood', settings: {
				sameBy: {
					[globTags.genre.toUpperCase()]: 1,
					[globTags.style.toUpperCase()]: 2,
					[globTags.mood.toUpperCase()]: 5
				}
			}
		},
		{ name: 'sep' },
		{
			name: 'By Composer', settings: {
				sameBy: {
					[globTags.composer.toUpperCase()]: 2
				}
			}
		},
		{
			name: 'By Key', settings: {
				sameBy: {
					[globTags.key.toUpperCase()]: 1
				}
			}
		},
		{ name: 'sep' },
		{ // Finds tracks where artist or involved people matches any from selection
			name: 'By Same artist(s) or featured artist(s)',
			settings: {
				sameBy: { [globTags.artistRaw.toUpperCase()]: 1, 'ARTIST': 1, INVOLVEDPEOPLE: 1 },
				remapTags: {
					[globTags.artistRaw.toUpperCase()]: ['INVOLVEDPEOPLE'],
					ARTIST: ['INVOLVEDPEOPLE'],
					INVOLVEDPEOPLE: [...new Set([globTags.artistRaw.toUpperCase(), 'ARTIST'])]
				},
				bOnlyRemap: false,
				logic: 'OR'
			}
		},
		{ // Finds tracks where involved people matches artist from selection (remap)
			name: 'Find collaborations along other artists',
			settings: {
				sameBy: { [globTags.artistRaw.toUpperCase()]: 1, 'ARTIST': 1 },
				remapTags: {
					[globTags.artistRaw.toUpperCase()]: ['INVOLVEDPEOPLE'],
					ARTIST: ['INVOLVEDPEOPLE']
				},
				bOnlyRemap: true,
				logic: 'OR'
			}
		},
		{ // Finds tracks where artist or involvedpeople matches composer from selection (remap)
			name: 'Music by same composer(s) as artist(s)',
			settings: {
				sameBy: { [globTags.composer.toUpperCase()]: 1 },
				remapTags: {
					[globTags.composer.toUpperCase()]: [...new Set(['INVOLVEDPEOPLE', 'ARTIST', 'ALBUM ARTIST', globTags.artistRaw.toUpperCase()])]
				},
				bOnlyRemap: true,
				logic: 'OR'
			}
		},
	]), { func: isJSON }],
	bIconMode: ['Icon-only mode', false, { func: isBoolean }, false]
};
newButtonsProperties.sameBy.push(newButtonsProperties.sameBy[1]);
newButtonsProperties.presets.push(newButtonsProperties.presets[1]);
setProperties(newButtonsProperties, prefix, 0); //This sets all the panel properties at once
newButtonsProperties = getPropertiesPairs(newButtonsProperties, prefix, 0);
buttonsBar.list.push(newButtonsProperties);

addButton({
	'Search Same By Tags (Combinations)': new ThemedButton({
		coordinates: { x: 0, y: 0, w: _gr.CalcTextWidth(newButtonsProperties.customName[1], _gdiFont(globFonts.button.name, globFonts.button.size * buttonsBar.config.scale)) + 25 * _scale(1, false) / _scale(buttonsBar.config.scale), h: 22 },
		text: newButtonsProperties.customName[1],
		func: function (mask) {
			if (mask === MK_SHIFT) {
				const oldName = this.buttonsProperties.customName[1].toString();
				settingsMenu(
					this, true, ['buttons_search_by_tags_combinations.js'],
					{
						bAdvTitle: { popup: globRegExp.title.desc },
						bMultiple: { popup: 'Partial multi-value tag matching when removing duplicates.' }
					},
					void (0),
					(menu) => {
						menu.newSeparator();
						const subMenuName = menu.newMenu('Presets');
						JSON.parse(this.buttonsProperties.presets[1]).forEach((entry) => {
							// Add separators
							if (menu.isSeparator(entry)) {
								menu.newSeparator(subMenuName);
							} else {
								menu.newEntry({
									menuName: subMenuName, entryText: entry.name, func: () => {
										for (const key in entry.settings) {
											if (Object.hasOwn(this.buttonsProperties, key)) {
												this.buttonsProperties[key][1] = typeof (entry.settings[key]) === 'object'
													? JSON.stringify(entry.settings[key])
													: entry.settings[key];
											}
										}
										overwriteProperties(this.buttonsProperties);
									}
								});
								menu.newCheckMenuLast(
									() => Object.keys(entry.settings).every(
										(key) => !Object.hasOwn(this.buttonsProperties, key) || this.buttonsProperties[key][1] === JSON.stringify(entry.settings[key])
									)
								);
							}
						});
						menu.newSeparator(subMenuName);
						_createSubMenuEditEntries(menu, subMenuName, {
							name: 'Search Same By Tags (Combinations)',
							list: JSON.parse(this.buttonsProperties.presets[1]),
							defaults: JSON.parse(this.buttonsProperties.presets[3]),
							input: () => {
								const entry = {
									settings: {
										sameBy: this.buttonsProperties.sameBy[1],
										forcedQuery: this.buttonsProperties.forcedQuery[1],
										checkDuplicatesBy: this.buttonsProperties.checkDuplicatesBy[1],
										bAdvTitle: this.buttonsProperties.bAdvTitle[1],
										bMultiple: this.buttonsProperties.bMultiple[1]
									},
								};
								return entry;
							},
							bNumbered: true,
							bCopyCurrent: true,
							onBtnUp: (presets) => {
								this.buttonsProperties.presets[1] = JSON.stringify(presets);
								overwriteProperties(this.buttonsProperties);
							}
						});
					}
				).btn_up(this.currX, this.currY + this.currH);
				const newName = this.buttonsProperties.customName[1].toString();
				if (oldName !== newName) { this.adjustNameWidth(newName); }
			} else if (mask === MK_SHIFT + MK_CONTROL) {
				const menu = new _menu();
				menu.newEntry({ entryText: 'Select a preset to apply:', flags: MF_GRAYED });
				menu.newSeparator();
				JSON.parse(this.buttonsProperties.presets[1]).forEach((entry) => {
					menu.newEntry({
						entryText: entry.name, func: () => {
							const preset = entry;
							console.log(preset.settings);
							searchSameByCombs({
								checkDuplicatesBy: JSON.parse(this.buttonsProperties.checkDuplicatesBy[1]),
								bAdvTitle: this.buttonsProperties.bAdvTitle[1],
								playlistLength: Number(this.buttonsProperties.playlistLength[1]),
								...preset.settings,
								bProfile: typeof menu_panelProperties !== 'undefined' ? menu_panelProperties.bProfile[1] : false
							});
						}
					});
				});
				menu.btn_up(this.currX, this.currY + this.currH);
			} else {
				// Try to match a preset (for complex usage) or just use the standard arg
				const preset = JSON.parse(this.buttonsProperties.presets[1]).filter((entry) => Object.hasOwn(entry, 'settings'))
					.find((entry) =>
						Object.keys(entry.settings).every(
							(key) => !Object.hasOwn(this.buttonsProperties, key) || this.buttonsProperties[key][1] === JSON.stringify(entry.settings[key])
						)
					);
				console.log(((preset || { settings: { sameBy: JSON.parse(this.buttonsProperties.sameBy[1]) } }).settings));
				searchSameByCombs({
					checkDuplicatesBy: JSON.parse(this.buttonsProperties.checkDuplicatesBy[1]),
					bAdvTitle: this.buttonsProperties.bAdvTitle[1],
					playlistLength: Number(this.buttonsProperties.playlistLength[1]),
					...((preset || { settings: { sameBy: JSON.parse(this.buttonsProperties.sameBy[1]) } }).settings),
					bProfile: typeof menu_panelProperties !== 'undefined' ? menu_panelProperties.bProfile[1] : false
				});
			}
		},
		description: function () {
			const bShift = utils.IsKeyPressed(VK_SHIFT);
			const bInfo = typeof menu_panelProperties === 'undefined' || menu_panelProperties.bTooltipInfo[1];
			const preset = JSON.parse(this.buttonsProperties.presets[1]).filter((entry) => Object.hasOwn(entry, 'settings'))
				.find((entry) =>
					Object.keys(entry.settings).every(
						(key) => !Object.hasOwn(this.buttonsProperties, key) || this.buttonsProperties[key][1] === JSON.stringify(entry.settings[key])
					)
				);
			let info = 'Random playlist matching from currently selected track:';
			info += preset ? '\nName:\t\t' + preset.name : '';
			info += '\nTF (at least):\t' + this.buttonsProperties.sameBy[1].cut(50);
			if (bShift || bInfo) {
				info += '\n-----------------------------------------------------';
				info += '\n(Shift + L. Click to open config menu)';
				info += '\n(Shift + Ctrl + L. Click to search by preset)';
			}
			return info;
		},
		prefix, buttonsProperties: newButtonsProperties,
		icon: chars.searchPlus,
		update: { scriptName: 'Playlist-Tools-SMP', version }
	}),
});