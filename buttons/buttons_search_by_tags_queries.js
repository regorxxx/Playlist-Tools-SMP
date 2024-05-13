'use strict';
//03/01/24

/*
	Search n tracks (randomly) on library with the same tag(s) than the current selected track.
	You can configure the number of tracks at properties panel. Also forced query to prefilter tracks.
 */

/* global menu_panelProperties:readable */
include('..\\helpers\\helpers_xxx.js');
/* global globFonts:readable, MK_SHIFT:readable, VK_SHIFT:readable, globTags:readable, globQuery:readable, globRegExp:readable */
include('..\\helpers\\buttons_xxx.js');
/* global getButtonVersion:readable, getUniquePrefix:readable, buttonsBar:readable, addButton:readable, ThemedButton:readable */
include('..\\helpers\\buttons_xxx_menu.js');
/* global settingsMenu:readable  */
include('..\\helpers\\menu_xxx_extras.js');
/* global _createSubMenuEditEntries:readable  */
include('..\\helpers\\helpers_xxx_input.js');
/* global Input:readable */
include('..\\helpers\\helpers_xxx_prototypes.js');
/* global isBoolean:readable, isString:readable, isStringWeak:readable, isJSON:readable, isInt:readable */
include('..\\helpers\\helpers_xxx_UI.js');
/* global _gdiFont:readable, _gr:readable, _scale:readable, chars:readable */
include('..\\helpers\\helpers_xxx_properties.js');
/* global setProperties:readable, getPropertiesPairs:readable, overwriteProperties:readable */
include('..\\helpers\\helpers_xxx_tags.js');
/* global checkQuery:readable */
include('..\\main\\search\\search_same_by.js');
/* global searchSameByQueries:readable */

var prefix = 'ssbytq'; // NOSONAR[global]
var version = getButtonVersion('Playlist-Tools-SMP'); // NOSONAR[global]

try { window.DefineScript('Search Same By Tags (Queries) Button', { author: 'regorxxx', version, features: { drag_n_drop: false } }); } catch (e) { /* May be loaded along other buttons */ }
prefix = getUniquePrefix(prefix, ''); // Puts new ID before '_'

var newButtonsProperties = { // NOSONAR[global]
	customName: ['Name for the custom UI button', 'Search Same By... (q)', { func: isStringWeak }, 'Search Same By... (q)'],
	playlistLength: ['Max Playlist Mix length', 50, { greater: 0, func: isInt }, 50],
	forcedQuery: ['Forced query to filter database', globQuery.filter, { func: (query) => { return checkQuery(query, true); } }, globQuery.filter],
	checkDuplicatesBy: ['Tags to look for duplicates', JSON.stringify(globTags.remDupl), { func: isJSON }, JSON.stringify(globTags.remDupl)],
	bAdvTitle: ['Advanced RegEx title matching?', true, { func: isBoolean }, true],
	bMultiple: ['Partial Multi-value tag matching', true, { func: isBoolean }, true],
	sameBy: ['Tags to look for similarity', JSON.stringify([[globTags.style], [globTags.mood]]), { func: isJSON }, JSON.stringify([[globTags.style], [globTags.mood]])],
	playlistName: ['Playlist name', 'Search...', { func: isString }, 'Search...'],
	presets: ['Presets', JSON.stringify([
		{
			name: 'By Genre', settings: {
				sameBy: JSON.stringify([[globTags.genre.toUpperCase()]])
			}
		},
		{
			name: 'By Style', settings: {
				sameBy: JSON.stringify([[globTags.style.toUpperCase()]])
			}
		},
		{
			name: 'By Mood', settings: {
				sameBy: JSON.stringify([[globTags.mood.toUpperCase()]])
			}
		},
		{
			name: 'By Style - Mood', settings: {
				sameBy: JSON.stringify([[globTags.style.toUpperCase()], [globTags.mood.toUpperCase()]])
			}
		},
		{
			name: 'By Genre - Style - Mood', settings: {
				sameBy: JSON.stringify([[globTags.genre.toUpperCase()], [globTags.style.toUpperCase()], [globTags.mood.toUpperCase()]])
			}
		},
		{ name: 'sep' },
		{
			name: 'By Composer', settings: {
				sameBy: JSON.stringify([[globTags.composer.toUpperCase()]])
			}
		},
		{
			name: 'By Key', settings: {
				sameBy: JSON.stringify([[globTags.key.toUpperCase()]])
			}
		},
		{
			name: 'By Artist',
			settings: {
				sameBy: JSON.stringify([['ARTIST']])
			}
		},
		{
			name: 'By Album Artist',
			settings: {
				sameBy: JSON.stringify([['ALBUM ARTIST']])
			}
		},
	]), { func: isJSON }],
	bIconMode: ['Icon-only mode?', false, { func: isBoolean }, false]
};
newButtonsProperties.presets.push(newButtonsProperties.presets[1]);
setProperties(newButtonsProperties, prefix, 0); //This sets all the panel properties at once
newButtonsProperties = getPropertiesPairs(newButtonsProperties, prefix, 0);
buttonsBar.list.push(newButtonsProperties);

addButton({
	'Search Same By Tags (Queries)': new ThemedButton({ x: 0, y: 0, w: _gr.CalcTextWidth(newButtonsProperties.customName[1], _gdiFont(globFonts.button.name, globFonts.button.size * buttonsBar.config.scale)) + 25 * _scale(1, false) / _scale(buttonsBar.config.scale), h: 22 }, newButtonsProperties.customName[1], function (mask) {
		if (mask === MK_SHIFT) {
			const oldName = this.buttonsProperties.customName[1].toString();
			settingsMenu(
				this, true, ['buttons_search_by_tags_queries.js'],
				{
					bAdvTitle: { popup: globRegExp.title.desc },
					bMultiple: { popup: 'Partial Multi-value tag matching when removing duplicates.' }
				},
				void (0),
				(menu) => {
					menu.newEntry({ entryText: 'sep' });
					const subMenuName = menu.newMenu('Presets');
					JSON.parse(this.buttonsProperties.presets[1]).forEach((entry) => {
						// Add separators
						if (Object.hasOwn(entry, 'name') && entry.name === 'sep') {
							menu.newEntry({ menuName: subMenuName, entryText: 'sep' });
						} else {
							menu.newEntry({
								menuName: subMenuName, entryText: entry.name, func: () => {
									for (const key in entry.settings) {
										if (Object.hasOwn(this.buttonsProperties, key)) {
											this.buttonsProperties[key][1] = entry.settings[key];
										}
									}
									overwriteProperties(this.buttonsProperties);
								}
							});
							menu.newCheckMenuLast(
								() => Object.keys(entry.settings).every(
									(key) => !Object.hasOwn(this.buttonsProperties, key) || this.buttonsProperties[key][1] === entry.settings[key]
								)
							);
						}
					});
					menu.newEntry({ menuName: subMenuName, entryText: 'sep' });
					_createSubMenuEditEntries(menu, subMenuName, {
						name: 'Search Same By Tags (Combinations)',
						list: JSON.parse(this.buttonsProperties.presets[1]),
						defaults: JSON.parse(this.buttonsProperties.presets[3]),
						input: () => {
							const entry = {
								tf: Input.string('string', 'Current settings', 'Enter preset name:', 'Search Same By Tags (Combinations)', 'My name', void (0), true),
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
						onBtnUp: (presets) => {
							this.buttonsProperties.presets[1] = JSON.stringify(presets);
							overwriteProperties(this.buttonsProperties);
						}
					});
				}
			).btn_up(this.currX, this.currY + this.currH);
			const newName = this.buttonsProperties.customName[1].toString();
			if (oldName !== newName) { this.adjustNameWidth(newName); }
		} else {
			searchSameByQueries({
				checkDuplicatesBy: JSON.parse(this.buttonsProperties.checkDuplicatesBy[1]),
				bAdvTitle: this.buttonsProperties.bAdvTitle[1],
				playlistLength: Number(this.buttonsProperties.playlistLength[1]),
				sameBy: JSON.parse(this.buttonsProperties.sameBy[1]),
				bProfile: typeof menu_panelProperties !== 'undefined' ? menu_panelProperties.bProfile[1] : false
			});
		}
	}, null, void (0), (parent) => {
		const bShift = utils.IsKeyPressed(VK_SHIFT);
		const bInfo = typeof menu_panelProperties === 'undefined' || menu_panelProperties.bTooltipInfo[1];
		let info = 'Random playlist matching from currently selected track:';
		info += '\nTF (all):\t' + parent.buttonsProperties.sameBy[1];
		if (bShift || bInfo) {
			info += '\n-----------------------------------------------------';
			info += '\n(Shift + L. Click to open config menu)';
		}
		return info;
	}, prefix, newButtonsProperties, chars.searchPlus, void (0), void (0), void (0), void (0), { scriptName: 'Playlist-Tools-SMP', version }),
});