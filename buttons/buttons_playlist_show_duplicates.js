'use strict';
//07/09/25

/*
	Removes duplicates on active playlist without changing order. It's currently set to title-artist-date,
	that means that any track matching those will be considered a duplicate.

	But it can be set as a playlist filter too just by removing or adding tags.
	You have 3 possible checks, you can delete any of them.
	i.e. Checking artist/date, effectively outputs only 1 track per year for every artist.

	Tooltip texts are changed according to the variables set!
*/

/* global barProperties:readable, menu_panelProperties:readable */
include('..\\helpers\\helpers_xxx.js');
/* global globFonts:readable, MK_SHIFT:readable, VK_SHIFT:readable, globTags:readable, globQuery:readable, VK_CONTROL:readable, MK_CONTROL:readable, globRegExp:readable, MF_GRAYED:readable */
include('..\\helpers\\buttons_xxx.js');
/* global getButtonVersion:readable, getUniquePrefix:readable, buttonsBar:readable, addButton:readable, ThemedButton:readable */
include('..\\helpers\\buttons_xxx_menu.js');
/* global settingsMenu:readable, _menu:readable */
include('..\\helpers\\menu_xxx_extras.js');
/* global _createSubMenuEditEntries:readable */
include('..\\helpers\\helpers_xxx_prototypes.js');
/* global isBoolean:readable, isStringWeak:readable, isJSON:readable */
include('..\\helpers\\helpers_xxx_UI.js');
/* global _gdiFont:readable, _gr:readable, _scale:readable, chars:readable */
include('..\\helpers\\helpers_xxx_properties.js');
/* global setProperties:readable, getPropertiesPairs:readable, overwriteProperties:readable */
include('..\\main\\filter_and_query\\remove_duplicates.js');
/* global showDuplicates:readable, removeDuplicates:readable */

var prefix = 'sd'; // NOSONAR[global]
var version = getButtonVersion('Playlist-Tools-SMP'); // NOSONAR[global]

try { window.DefineScript('Show Duplicates Button', { author: 'regorxxx', version, features: { drag_n_drop: false } }); } catch (e) { /* May be loaded along other buttons */ } // eslint-disable-line no-unused-vars
prefix = getUniquePrefix(prefix, ''); // Puts new ID before '_'

var newButtonsProperties = { // NOSONAR[global]
	checkInputA: ['Tag or TitleFormat expression to check (1)', globTags.artist, { func: isStringWeak }, globTags.artist],
	checkInputB: ['Tag or TitleFormat expression to check (2)', globTags.title, { func: isStringWeak }, globTags.title],
	checkInputC: ['Tag or TitleFormat expression to check (3)', globTags.date, { func: isStringWeak }, globTags.date],
	sortBias: ['Track selection bias', globQuery.remDuplBias, { func: isStringWeak }, globQuery.remDuplBias],
	bAdvTitle: ['Advanced RegExp title matching', true, { func: isBoolean }, true],
	bMultiple: ['Partial multi-value tag matching', true, { func: isBoolean }, true],
	presets: ['Presets', JSON.stringify([
		{ name: 'By Artist', settings: { checkInputA: '', checkInputB: globTags.artist, checkInputC: '', bAdvTitle: true, bMultiple: true } },
		{ name: 'By Title', settings: { checkInputA: globTags.title, checkInputB: '', checkInputC: '', bAdvTitle: true, bMultiple: true } },
		{ name: 'By Date', settings: { checkInputA: '', checkInputB: '', checkInputC: globTags.date, bAdvTitle: true, bMultiple: true } },
		{ name: 'sep' },
		{ name: 'By Artist - Title - Date', settings: { checkInputA: globTags.artist, checkInputB: globTags.title, checkInputC: globTags.date, bAdvTitle: true, bMultiple: true } },
		{ name: 'By Artist - Title', settings: { checkInputA: globTags.artist, checkInputB: globTags.title, checkInputC: '', bAdvTitle: true, bMultiple: true } },
		{ name: 'By MBID', settings: { checkInputA: 'MUSICBRAINZ_TRACKID', checkInputB: '', checkInputC: '', bAdvTitle: true, bMultiple: true, sortBias: '' } },
		{ name: 'sep' },
		{ name: 'By Genre', settings: { checkInputA: globTags.genre, checkInputB: '', checkInputC: '', bAdvTitle: true, bMultiple: true } },
		{ name: 'By Style', settings: { checkInputA: globTags.style, checkInputB: '', checkInputC: '', bAdvTitle: true, bMultiple: true } },
		{ name: 'By Genre - Date', settings: { checkInputA: globTags.genre, checkInputB: '', checkInputC: globTags.date, bAdvTitle: true, bMultiple: true } },
		{ name: 'By Style - Date', settings: { checkInputA: globTags.style, checkInputB: '', checkInputC: globTags.date, bAdvTitle: true, bMultiple: true } },
		{ name: 'sep' },
		{ name: 'By Album', settings: { checkInputA: 'ALBUM', checkInputB: '', checkInputC: '', bAdvTitle: true, bMultiple: true } },
		{ name: 'By Album version', settings: { checkInputA: 'ALBUM', checkInputB: 'COMMENT', checkInputC: '', bAdvTitle: true, bMultiple: true, sortBias: '' } },
		{ name: 'By Path', settings: { checkInputA: '$directory(%PATH%,3)\\$directory(%PATH%,2)', checkInputB: '', checkInputC: '', bAdvTitle: true, bMultiple: true, sortBias: '' } },
	]), { func: isJSON }],
	bIconMode: ['Icon-only mode', false, { func: isBoolean }, false]
};
newButtonsProperties.presets.push(newButtonsProperties.presets[1]);
setProperties(newButtonsProperties, prefix, 0); //This sets all the panel properties at once
newButtonsProperties = getPropertiesPairs(newButtonsProperties, prefix, 0);
buttonsBar.list.push(newButtonsProperties);

addButton({
	'Show Duplicates': new ThemedButton({
		coordinates: { x: 0, y: 0, w: _gr.CalcTextWidth('Show duplicates', _gdiFont(globFonts.button.name, globFonts.button.size * buttonsBar.config.scale)) + 25 * _scale(1, false) / _scale(buttonsBar.config.scale), h: 22 },
		text: 'Show duplicates',
		func: function (mask) {
			if (mask === MK_SHIFT) {
				settingsMenu(
					this, true, ['buttons_playlist_show_duplicates.js'],
					{
						bAdvTitle: { popup: globRegExp.title.desc },
						bMultiple: {
							popup: 'When this option is enabled, multi-value tags are parsed independently and a track may be considered a duplicate if at least one of those values match (instead of requiring all to match in the same order).\n\nSo for \'[ARTIST, DATE, TITLE]\' tags, these are duplicates with this option enabled:\n' +
								'\nJimi Hendrix - 1969 - Blabla' +
								'\nJimi Hendrix experience, Jimi Hendrix - 1969 - Blabla' +
								'\nBand of Gypsys, Jimi Hendrix - 1969 - Blabla' +
								'\n\nWith multi-value parsing disabled, these are considered non-duplicated tracks since not all artists match.'
						},
						presets: { bHide: true }
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
											this.buttonsProperties[key][1] = entry.settings[key];
										}
										overwriteProperties(this.buttonsProperties);
									}
								});
								menu.newCheckMenuLast(
									() => Object.keys(entry.settings).every(
										(key) => this.buttonsProperties[key][1] === entry.settings[key]
									)
								);
							}
						});
						menu.newSeparator(subMenuName);
						_createSubMenuEditEntries(menu, subMenuName, {
							name: 'Show Duplicates',
							list: JSON.parse(this.buttonsProperties.presets[1]),
							defaults: JSON.parse(this.buttonsProperties.presets[3]),
							input: () => {
								const entry = {
									settings: {
										checkInputA: this.buttonsProperties.checkInputA[1],
										checkInputB: this.buttonsProperties.checkInputB[1],
										checkInputC: this.buttonsProperties.checkInputC[1],
										bAdvTitle: this.buttonsProperties.bAdvTitle[1],
										bMultiple: this.buttonsProperties.bMultiple[1],
										sortBias: this.buttonsProperties.sortBias[1]
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
			} else {
				const checkKeys = Object.keys(this.buttonsProperties).filter((key) => { return key.startsWith('check'); })
					.map((key) => { return this.buttonsProperties[key][1]; }).filter((n) => n); //Filter the holes, since they can appear at any place!
				const sortBias = this.buttonsProperties.sortBias[1];
				const bAdvTitle = this.buttonsProperties.bAdvTitle[1];
				const bMultiple = this.buttonsProperties.bMultiple[1];
				if (mask === MK_CONTROL) {
					removeDuplicates({ checkKeys, sortBias, bAdvTitle, bMultiple, bProfile: typeof menu_panelProperties !== 'undefined' ? menu_panelProperties.bProfile[1] : false });
				} else if (mask === (MK_SHIFT + MK_CONTROL)) {
					const menu = new _menu();
					menu.newEntry({ entryText: 'Select a preset to apply:', flags: MF_GRAYED });
					menu.newSeparator();
					JSON.parse(this.buttonsProperties.presets[1]).forEach((entry) => {
						// Add separators
						if (menu.isSeparator(entry)) {
							menu.newSeparator();
						} else {
							menu.newEntry({
								entryText: entry.name, func: () => {
									const preset = { ...entry.settings };
									['checkInputA', 'checkInputB', 'checkInputC'].forEach((k) => {
										if (Object.hasOwn(preset, k) && preset[k].length) {
											if (!Object.hasOwn(preset, 'checkKeys')) { preset.checkKeys = []; }
											preset.checkKeys.push(preset[k]);
											delete preset[k];
										}
									});
									showDuplicates({ checkKeys, bAdvTitle, bMultiple, bProfile: typeof menu_panelProperties !== 'undefined' ? menu_panelProperties.bProfile[1] : false, ...preset });
								}
							});
						}
					});
					menu.btn_up(this.currX, this.currY + this.currH);
				} else {
					showDuplicates({ checkKeys, bAdvTitle, bMultiple, bProfile: typeof menu_panelProperties !== 'undefined' ? menu_panelProperties.bProfile[1] : false });
				}
			}
		},
		description: function () {
			const checkKeys = Object.keys(this.buttonsProperties).filter((key) => { return key.startsWith('check'); })
				.map((key) => { return this.buttonsProperties[key][1]; }).filter((n) => n); //Filter the holes, since they can appear at any place!
			const bShift = utils.IsKeyPressed(VK_SHIFT);
			const bCtrl = utils.IsKeyPressed(VK_CONTROL);
			const bInfo = typeof barProperties === 'undefined' || barProperties.bTooltipInfo[1];
			const preset = JSON.parse(this.buttonsProperties.presets[1]).filter((entry) => Object.hasOwn(entry, 'settings'))
				.find((entry) =>
					Object.keys(entry.settings).every(
						(key) => !Object.hasOwn(this.buttonsProperties, key) || this.buttonsProperties[key][1] === entry.settings[key]
					)
				);
			let info = 'Show duplicates according to equal:';
			info += preset ? '\nName:\t' + preset.name : '';
			info += '\nTF:\t' + checkKeys.join('|').cut(50);
			info += '\nBias:\t' + this.buttonsProperties.sortBias[1].cut(50);
			info += '\nRegExp:\t' + this.buttonsProperties.bAdvTitle[1];
			if (bShift || bCtrl || bInfo) {
				info += '\n-----------------------------------------------------';
				info += '\n(Ctrl + L. Click to remove duplicates)';
				info += '\n(Shift + L. Click to open config menu)';
				info += '\n(Shift + Ctrl + L. Click to show duplicates by preset)';
			}
			return info;
		},
		prefix, buttonsProperties: newButtonsProperties,
		icon: chars.duplicates,
		update: { scriptName: 'Playlist-Tools-SMP', version }
	}),
});