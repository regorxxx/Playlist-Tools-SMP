'use strict';
//07/08/25

/*
	Automatic tagging...
	File processing takes time, specially for some functions (ReplayGain, etc.), so we delay next step execution some ms
	according to step and track selected count. Naive approach but works, no 'blocked file' while processing.

	Note there is no way to know when some arbitrary plugin finish their processing. Callbacks for meta changes are dangerous here.
	Some plugins expect user input for final tagging after processing the files (ReplayGain for ex.), so that approach would delay
	next step until the user press OK on those popups...and then the files would be blocked being tagged! = Error on next step.
 */

/* global menu_panelProperties:readable */
include('..\\helpers\\menu_xxx.js');
/* global _menu:readable  */
include('..\\helpers\\helpers_xxx.js');
/* global globFonts:readable, soFeat:readable, MK_CONTROL:readable, MF_STRING:readable, MF_GRAYED:readable, VK_SHIFT:readable, VK_CONTROL:readable */
include('..\\helpers\\buttons_xxx.js');
/* global getButtonVersion:readable, getUniquePrefix:readable, buttonsBar:readable, addButton:readable, ThemedButton:readable, showButtonReadme:readable */
include('..\\helpers\\helpers_xxx_prototypes.js');
/* global isBoolean:readable, isJSON:readable, isString:readable,  */
include('..\\helpers\\helpers_xxx_UI.js');
/* global _gdiFont:readable, _gr:readable, _scale:readable, chars:readable */
include('..\\helpers\\helpers_xxx_input.js');
/* global Input:readable */
include('..\\helpers\\helpers_xxx_properties.js');
/* global setProperties:readable, getPropertiesPairs:readable, overwriteProperties:readable */
include('..\\main\\tags\\tagger.js');
/* global Tagger:readable  */

var prefix = 'ta'; // NOSONAR[global]
var version = getButtonVersion('Playlist-Tools-SMP'); // NOSONAR[global]

try { window.DefineScript('Tagger', { author: 'regorxxx', version, features: { drag_n_drop: false } }); } catch (e) { /* May be loaded along other buttons */ } // eslint-disable-line no-unused-vars

prefix = getUniquePrefix(prefix, ''); // Puts new ID before '_'

var newButtonsProperties = { // NOSONAR[global]
	toolsByKey: ['Tools enabled', JSON.stringify(new Tagger({ bOutputDefTools: true }))],
	quietByKey: ['Quiet mode', JSON.stringify({})],
	menuByKey: ['Tools tagging menu entries', JSON.stringify({})],
	menuRemoveByKey: ['Tools remove tags menu entries', JSON.stringify({})],
	tagsByKey: ['Tags per tool', JSON.stringify({})],
	bIconMode: ['Icon-only mode', false, { func: isBoolean }, false],
	bWineBug: ['Wine ffmpeg bug workaround', !soFeat.x64 && !soFeat.popup, { func: isBoolean }, !soFeat.x64 && !soFeat.popup],
	bFormatPopups: ['Show format warning popups', true, { func: isBoolean }, true],
	bToolPopups: ['Show tool warning popups', true, { func: isBoolean }, true],
	bRunPopup: ['Ask confirmation before running', true, { func: isBoolean }, true]
};
newButtonsProperties.toolsByKey.push({ func: isJSON }, newButtonsProperties.toolsByKey[1]);
newButtonsProperties.quietByKey.push({ func: isJSON }, newButtonsProperties.quietByKey[1]);
newButtonsProperties.menuByKey.push({ func: isJSON }, newButtonsProperties.menuByKey[1]);
setProperties(newButtonsProperties, prefix, 0); //This sets all the panel properties at once
newButtonsProperties = getPropertiesPairs(newButtonsProperties, prefix, 0);
buttonsBar.list.push(newButtonsProperties);

{
	const newButton = {
		'Tagger': new ThemedButton({
			coordinates: { x: 0, y: 0, w: _gr.CalcTextWidth('Tagger', _gdiFont(globFonts.button.name, globFonts.button.size * buttonsBar.config.scale)) + 30 * _scale(1, false) / _scale(buttonsBar.config.scale), h: 22 },
			text: 'Tagger',
			func: function (mask) {
				const handleList = plman.GetPlaylistSelectedItems(plman.ActivePlaylist);
				if (mask === MK_CONTROL) {
					if (!this.tAut.isRunning() && handleList.Count) { this.tAut.run(); }
					else { this.tAut.nextStepTag(); }
				} else {
					const menu = new _menu({ iMaxEntryLen: 50 }); // To avoid collisions with other buttons and check menu
					const selFlags = handleList.Count ? MF_STRING : MF_GRAYED;
					const allFlags = () => !this.tAut.isRunning() ? selFlags : MF_GRAYED;
					menu.newEntry({
						entryText: () => { return 'Tag selected tracks' + (this.tAut.isRunning() ? ' (running)' : ''); }, func: () => {
							this.tAut.run();
							this.switchAnimation('Automate Tags', true, () => { return !this.tAut.isRunning(); });
						}, flags: allFlags
					});
					if (this.tAut.isRunning()) {
						menu.newSeparator();
						menu.newEntry({ entryText: () => { return 'Force next step'; }, func: this.tAut.nextStepTag });
						menu.newEntry({ entryText: () => { return 'Stop execution'; }, func: this.tAut.stopStepTag });
					}
					menu.newSeparator();
					{
						const subMenu = menu.newMenu('Available tools', void (0), !this.tAut.isRunning() ? MF_STRING : MF_GRAYED);
						menu.newEntry({ menuName: subMenu, entryText: 'Toggle (click) / Single (Shift + click):', func: null, flags: MF_GRAYED });
						menu.newSeparator(subMenu);
						this.tAut.tools.forEach((tool) => {
							const key = tool.key;
							const flags = tool.bAvailable ? MF_STRING : MF_GRAYED;
							menu.newEntry({
								menuName: subMenu, entryText: tool.title, func: () => {
									// Disable all other tools when pressing shift
									if (utils.IsKeyPressed(VK_SHIFT)) {
										this.tAut.tools.filter((_) => { return _.key !== key; }).forEach((_) => { this.tAut.toolsByKey[_.key] = false; });
										this.tAut.toolsByKey[key] = true;
									} else {
										this.tAut.toolsByKey[key] = !this.tAut.toolsByKey[key];
										// Warn about incompatible tools
										if (this.tAut.toolsByKey[key]) {
											if (this.tAut.incompatibleTools.has(key)) {
												const toDisable = this.tAut.incompatibleTools.get(key);
												if (this.tAut.toolsByKey[toDisable]) {
													this.tAut.toolsByKey[toDisable] = false;
													console.popup(this.tAut.titlesByKey[toDisable] + ' has been disabled.', 'Tags Automation');
												}
											}
										}
									}
									this.tAut.checkIncompatibleTools(true);
									// Save
									this.buttonsProperties.toolsByKey[1] = JSON.stringify(this.tAut.toolsByKey);
									overwriteProperties(this.buttonsProperties); // Force overwriting
									this.tAut.loadDependencies();
								}, flags
							});
							menu.newCheckMenu(subMenu, tool.title, void (0), () => !!this.tAut.toolsByKey[key]);
						});
						menu.newSeparator(subMenu);
						['Enable all', 'Disable all'].forEach((entryText, i) => {
							menu.newEntry({
								menuName: subMenu, entryText, func: () => {
									this.tAut.tools.forEach((tool) => { this.tAut.toolsByKey[tool.key] = i ? false : tool.bAvailable && tool.bDefault; });
									this.tAut.incompatibleTools.uniValues().forEach((tool) => { this.tAut.toolsByKey[tool] = false; });
									this.tAut.checkIncompatibleTools(true);
									this.buttonsProperties.toolsByKey[1] = JSON.stringify(this.tAut.toolsByKey);
									overwriteProperties(this.buttonsProperties); // Force overwriting
									this.tAut.loadDependencies();
								}
							});
						});
						menu.newSeparator(subMenu);
						menu.newEntry({
							menuName: subMenu, entryText: 'Invert selected tools', func: () => {
								this.tAut.tools.forEach((tool) => { this.tAut.toolsByKey[tool.key] = tool.bAvailable ? !this.tAut.toolsByKey[tool.key] : false; });
								this.tAut.incompatibleTools.uniValues().forEach((tool) => { this.tAut.toolsByKey[tool] = false; });
								this.tAut.checkIncompatibleTools(true);
								this.buttonsProperties.toolsByKey[1] = JSON.stringify(this.tAut.toolsByKey);
								overwriteProperties(this.buttonsProperties); // Force overwriting
								this.tAut.loadDependencies();
							}
						});
					}
					menu.newSeparator();
					{
						const subMenu = menu.newMenu('Settings', void (0), !this.tAut.isRunning() ? MF_STRING : MF_GRAYED);
						{
							const subMenuTwo = menu.newMenu('Quiet mode', subMenu);
							menu.newEntry({ menuName: subMenuTwo, entryText: 'Disable user input and reports:', flags: MF_GRAYED });
							menu.newSeparator(subMenuTwo);
							Object.keys(this.tAut.quietByKey).forEach((key) => {
								menu.newEntry({
									menuName: subMenuTwo, entryText: this.tAut.titlesByKey[key], func: () => {
										const quietByKey = JSON.parse(this.buttonsProperties.quietByKey[1]);
										this.tAut.quietByKey[key] = quietByKey[key] = !this.tAut.quietByKey[key];
										this.buttonsProperties.quietByKey[1] = JSON.stringify(quietByKey);
										overwriteProperties(this.buttonsProperties);
									}, flags: ['biometric', 'masstagger'].includes(key) || !this.tAut.availableByKey[key] ? MF_GRAYED : MF_STRING
								});
								menu.newCheckMenuLast(() => this.tAut.quietByKey[key]);
							});
							menu.newSeparator(subMenuTwo);
							menu.newEntry({
								menuName: subMenuTwo, entryText: 'Switch all', func: () => {
									const quietByKey = JSON.parse(this.buttonsProperties.quietByKey[1]);
									const keys = Object.keys(this.tAut.quietByKey);
									const current = keys.every((key) => this.tAut.quietByKey[key] || !this.tAut.availableByKey[key]);
									keys.forEach((key) => {
										if (['biometric', 'masstagger'].includes(key) || !this.tAut.availableByKey[key]) { return; }
										this.tAut.quietByKey[key] = quietByKey[key] = !current;
									});
									this.buttonsProperties.quietByKey[1] = JSON.stringify(quietByKey);
									overwriteProperties(this.buttonsProperties);
								}, flags: MF_STRING
							});
						}
						[
							{ menu: 'Tagging menu entries', key: 'menuByKey', tip: 'Contextual menu entries called:' },
							{ menu: 'Remove tags menu entries', key: 'menuRemoveByKey', tip: 'Contextual menu entries called:' },
							{ menu: 'Tags per tool', key: 'tagsByKey', tip: 'Associated tags:' },

						].forEach((opt) => {
							const subMenuTwo = menu.newMenu(opt.menu, subMenu);
							menu.newEntry({ menuName: subMenuTwo, entryText: opt.tip, flags: MF_GRAYED });
							menu.newSeparator(subMenuTwo);
							for (const key in this.tAut[opt.key]) {
								if (this.tAut[opt.key][key]) {
									menu.newEntry({
										menuName: subMenuTwo, entryText: this.tAut.titlesByKey[key] + '...', func: () => {
											const input = Input.json(
												'array strings', this.tAut[opt.key][key],
												key === 'tagsByKey'
													? 'Enter associated tag(s):\n(JSON array of strings)\n\nThe script will check if these tags are successfully removed/added.'
													: 'Enter menu entry(s):\n(JSON array of strings)\n\nThe script will try to run all until any of them is successful.',
												this.tAut.titlesByKey[key],
												key === 'tagsByKey'
													? '["REPLAYGAIN_ALBUM_GAIN", "REPLAYGAIN_ALBUM_PEAK", "REPLAYGAIN_TRACK_GAIN", "REPLAYGAIN_TRACK_PEAK"]'
													: '["Utilities/Create Audio MD5 checksum"]',
												void (0), true
											);
											if (input === null) { return; }
											const prop = JSON.parse(this.buttonsProperties[opt.key][1]);
											prop[key] = this.tAut[opt.key][key] = input;
											this.buttonsProperties[opt.key][1] = JSON.stringify(prop);
											overwriteProperties(this.buttonsProperties);
										}
									});
								}
							};
						});
						menu.newSeparator(subMenu);
						menu.newEntry({
							menuName: subMenu, entryText: 'Wine ffmpeg bug workaround', func: () => {
								this.buttonsProperties.bWineBug[1] = !this.buttonsProperties.bWineBug[1];
								this.tAut.bWineBug = this.buttonsProperties.bWineBug[1];
								overwriteProperties(this.buttonsProperties);
							}
						});
						menu.newCheckMenu(subMenu, 'Wine ffmpeg bug workaround', void (0), () => { return this.buttonsProperties.bWineBug[1]; });
						menu.newEntry({
							menuName: subMenu, entryText: 'Show format warning popups', func: () => {
								this.buttonsProperties.bFormatPopups[1] = !this.buttonsProperties.bFormatPopups[1];
								this.tAut.bFormatPopups = this.buttonsProperties.bFormatPopups[1];
								overwriteProperties(this.buttonsProperties);
							}
						});
						menu.newCheckMenu(subMenu, 'Show format warning popups', void (0), () => this.buttonsProperties.bFormatPopups[1]);
						menu.newEntry({
							menuName: subMenu, entryText: 'Show tool info popups', func: () => {
								this.buttonsProperties.bToolPopups[1] = !this.buttonsProperties.bToolPopups[1];
								this.tAut.bToolPopups = this.buttonsProperties.bToolPopups[1];
								overwriteProperties(this.buttonsProperties);
							}
						});
						menu.newCheckMenu(subMenu, 'Show tool info popups', void (0), () => this.buttonsProperties.bToolPopups[1]);
						menu.newEntry({
							menuName: subMenu, entryText: 'Ask confirmation before running', func: () => {
								this.buttonsProperties.bRunPopup[1] = !this.buttonsProperties.bRunPopup[1];
								this.tAut.bRunPopup = this.buttonsProperties.bRunPopup[1];
								overwriteProperties(this.buttonsProperties);
							}
						});
						menu.newCheckMenu(subMenu, 'Ask confirmation before running', void (0), () => this.buttonsProperties.bRunPopup[1]);
					}
					menu.newSeparator();
					menu.newEntry({ entryText: 'Readme...', func: () => showButtonReadme('buttons_tags_tagger.js') });
					menu.btn_up(this.currX, this.currY + this.currH);
				}
			},
			description: function () {
				// Retrieve list of tools and wrap lines with smaller width
				let info = 'Tag selected tracks:';
				info += '\n' + this.tAut.description();
				const font = buttonsBar.tooltipButton.font;
				info = _gr.EstimateLineWrap(info, _gdiFont(font.name, font.size), 400).filter(isString).join('\n');
				// Modifiers
				const bCtrl = utils.IsKeyPressed(VK_CONTROL);
				const bInfo = typeof menu_panelProperties === 'undefined' || menu_panelProperties.bTooltipInfo[1];
				if (bCtrl || bInfo) {
					info += '\n-----------------------------------------------------';
					info += this.tAut.isRunning() ? '\n(Ctrl + L. Click to force next step)' : '\n(Ctrl + L. Click to directly run on selection)';
				}
				return info;
			},
			prefix, buttonsProperties: newButtonsProperties,
			icon: chars.tags,
			update: { scriptName: 'Playlist-Tools-SMP', version }
		}),
	};
	newButton['Tagger'].tAut = new Tagger({
		toolsByKey: JSON.parse(newButtonsProperties.toolsByKey[1]),
		quietByKey: JSON.parse(newButtonsProperties.quietByKey[1]),
		menuByKey: JSON.parse(newButtonsProperties.menuByKey[1]),
		menuRemoveByKey: JSON.parse(newButtonsProperties.menuRemoveByKey[1]),
		tagsByKey: JSON.parse(newButtonsProperties.tagsByKey[1]),
		bWineBug: newButtonsProperties.bWineBug[1],
		bFormatPopups: newButtonsProperties.bFormatPopups[1],
		bToolPopups: newButtonsProperties.bToolPopups[1],
		bRunPopup: newButtonsProperties.bRunPopup[1]
	});
	addButton(newButton);
}