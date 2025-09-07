﻿'use strict';
//07/09/25

/*
	Main Menu shortcut
	----------------
	Runs multiple main menus with one single click, on order.
	Also allows to call such menus before closing foobar2000, according to button state (enabled/disabled).
	Button state may be saved between sessions and will change when clicking on the button.
 */

/* global barProperties:readable */
include('..\\helpers\\helpers_xxx.js');
/* global globFonts:readable, MK_SHIFT:readable, VK_SHIFT:readable, MF_GRAYED:readable, clone:readable, MF_STRING:readable, tryMethod:readable, compareObjects:readable */
include('..\\helpers\\buttons_xxx.js');
/* global getButtonVersion:readable, getUniquePrefix:readable, buttonsBar:readable, addButton:readable, ThemedButton:readable, showButtonReadme:readable */
include('..\\helpers\\menu_xxx.js');
/* global _menu:readable  */
include('..\\helpers\\menu_xxx_extras.js');
/* global _createSubMenuEditEntries:readable */
include('..\\helpers\\helpers_xxx_prototypes.js');
/* global isBoolean:readable, isJSON:readable, isString:readable, _p:readable, isStringWeak:readable, _b:readable, doOnce:readable */
include('..\\helpers\\helpers_xxx_UI.js');
/* global _gdiFont:readable, _gr:readable, _scale:readable, chars:readable */
include('..\\helpers\\helpers_xxx_properties.js');
/* global setProperties:readable, getPropertiesPairs:readable, overwriteProperties:readable */
include('..\\helpers\\helpers_xxx_input.js');
/* global Input:readable */

var prefix = 'mms'; // NOSONAR[global]
var version = getButtonVersion('Playlist-Tools-SMP'); // NOSONAR[global]

try { window.DefineScript('Main Menu Shortcut Button', { author: 'regorxxx', version, features: { drag_n_drop: false } }); } catch (e) { /* May be loaded along other buttons */ } // eslint-disable-line no-unused-vars

prefix = getUniquePrefix(prefix, ''); // Puts new ID before '_'

var newButtonsProperties = { // NOSONAR[global]
	customName: ['Name for the custom UI button', 'Main Menu', { func: isStringWeak }, 'Main Menu'],
	entries: ['Main menu entries', JSON.stringify([]), { func: isJSON }],
	unloadCall: ['Call menus on unload options', JSON.stringify({ enabled: false, disabled: false }), { func: isJSON }],
	indicator: ['Indicator options', JSON.stringify({ init: true, enabled: false, menuCheck: false, menuCheckInterval: 250 }), { func: isJSON }],
	state: ['Current state', false, { func: isBoolean }, false],
	icon: ['Button icon', chars.console, { func: isString }, chars.console],
	bIconMode: ['Icon-only mode', false, { func: isBoolean }, false]
};
newButtonsProperties.entries.push(newButtonsProperties.entries[1]);
newButtonsProperties.unloadCall.push(newButtonsProperties.unloadCall[1]);
newButtonsProperties.indicator.push(newButtonsProperties.indicator[1]);

setProperties(newButtonsProperties, prefix, 0); //This sets all the panel properties at once
newButtonsProperties = getPropertiesPairs(newButtonsProperties, prefix, 0);
buttonsBar.list.push(newButtonsProperties);

{
	const newButton = {
		'Main Menu': new ThemedButton({
			coordinates: { x: 0, y: 0, w: _gr.CalcTextWidth(newButtonsProperties.customName[1], _gdiFont(globFonts.button.name, globFonts.button.size * buttonsBar.config.scale)) + 30 * _scale(1, false) / _scale(buttonsBar.config.scale), h: 22 },
			text: newButtonsProperties.customName[1],
			func: function (mask) {
				const list = JSON.parse(this.buttonsProperties.entries[1]);
				const unloadCall = JSON.parse(this.buttonsProperties.unloadCall[1]);
				const indicator = JSON.parse(this.buttonsProperties.indicator[1]);
				const specialKeys = ['PlaybackFollowCursor', 'CursorFollowPlayback', 'idx', 'timeout'];
				if (mask === MK_SHIFT || !list.length) {
					const menu = new _menu();
					menu.newEntry({ entryText: 'Select output:', func: null, flags: MF_GRAYED });
					menu.newSeparator();
					_createSubMenuEditEntries(menu, void (0), {
						name: 'Main Menu Shortcut',
						list,
						defaults: JSON.parse(this.buttonsProperties.entries[3]),
						input: () => {
							const entry = {
								command: Input.string('string', '', 'Enter complete menu name:\nEx: Library/Playback Statistics/Monitor playing tracks', window.Name + 'Main Menu Shortcut', 'Library/Playback Statistics/Monitor playing tracks', void (0), true),
								timeOut: Input.number('int positive', 0, 'Time (ms) to wait before running command:', window.Name + 'Main Menu Shortcut', 10) || 0,
							};
							if (!entry.command) { return; }
							return entry;
						},
						bNumbered: true,
						onBtnUp: (entries) => {
							this.buttonsProperties.entries[1] = JSON.stringify(entries);
							overwriteProperties(this.buttonsProperties);
						}
					});
					{
						const menuName = menu.newMenu('Built-in presets');
						const options = [
							{
								entryText: 'Playback statistics',
								entries: [
									{ name: 'Playback Statistics', command: 'Library/Playback Statistics/Monitor playing tracks' },
									{ name: 'ListenBrainz Statistics', command: 'Playback/Submit to ListenBrainz' },
									{ name: 'Last.fm Statistics', command: 'Playback/Scrobble tracks' }
								],
								indicator: { init: true, enabled: true, menuCheck: true },
								unloadCall: { enabled: false, disabled: true },
								state: true,
								icon: chars.music
							},
							{
								entryText: 'Shuffle and play',
								entries: [
									{ name: 'ReplayGain track', command: 'Playback/Replay Gain/Source mode/track' },
									{ name: 'Shuffle', command: 'Edit/Sort/Randomize' },
									{ name: 'Playback order', command: 'Order/Default' },
									{ name: 'Play current pls', command: 'Playback/Play', idx: 0, PlaybackFollowCursor: true }
								],
								indicator: { init: false, enabled: false, menuCheck: false },
								unloadCall: { enabled: false, disabled: false },
								icon: chars.shuffle
							},
							{
								entryText: 'Async clear test',
								entries: [
									{ name: 'Clear', command: 'Edit/Clear' },
									{ name: 'Undo', command: 'Edit/Undo', timeout: 1000 }
								],
								indicator: { init: false, enabled: false },
								unloadCall: { enabled: false, disabled: false },
								icon: chars.tasks
							},
						];
						options.forEach((option) => {
							menu.newEntry({
								menuName, entryText: option.entryText, func: () => {
									// Entries
									list.length = 0;
									clone(option.entries).forEach(e => list.push(e));
									fb.ShowPopupMessage(list.reduce((total, curr, i) => {
										const extra = specialKeys.map(k => { return Object.hasOwn(curr, k) ? k + ':' + curr[k] : null; }).filter(Boolean).join(', ');
										return total + (total ? '\n' : '') + (i + 1) + '. ' + curr.name + ' -> ' + curr.command + (extra ? ' ' + _p(extra) : '');
									}, ''), 'Main Menu Shortcut');
									// Rename
									this.icon = this.buttonsProperties.icon[1] = option.icon || this.buttonsProperties.icon[3];
									this.text = this.buttonsProperties.customName[1] = option.entryText;
									this.w = _gr.CalcTextWidth(option.entryText, _gdiFont('Segoe UI', 12 * buttonsBar.config.scale)) + 30;
									this.w *= buttonsBar.config.scale;
									this.changeScale(buttonsBar.config.scale);
									// Other config
									if (Object.hasOwn(option, 'indicator')) {
										for (let key in option.indicator) {
											indicator[key] = option.indicator[key];
										}
										this.buttonsProperties.indicator[1] = JSON.stringify(indicator);
									}
									if (Object.hasOwn(option, 'unloadCall')) {
										for (let key in option.unloadCall) {
											unloadCall[key] = option.unloadCall[key];
										}
										this.buttonsProperties.unloadCall[1] = JSON.stringify(unloadCall);
									}
									this.switchActive(option.state || false);
									this.buttonsProperties.state[1] = this.active;
									this.buttonsProperties.entries[1] = JSON.stringify(list);
									overwriteProperties(this.buttonsProperties); // Force overwriting
									window.Repaint();
								}
							});
							menu.newCheckMenuLast(() => compareObjects(list, option.entries) && compareObjects(indicator, option.indicator));
						});
					}
					menu.newSeparator();
					{
						const menuName = menu.newMenu('Run when closing foobar');
						menu.newEntry({
							menuName, entryText: 'If state is enabled', func: () => {
								unloadCall.enabled = !unloadCall.enabled;
								this.buttonsProperties.unloadCall[1] = JSON.stringify(unloadCall);
								overwriteProperties(this.buttonsProperties); // Force overwriting
							}, flags: indicator.enabled ? MF_STRING : MF_GRAYED
						});
						menu.newCheckMenuLast(() => unloadCall.enabled);
						menu.newEntry({
							menuName, entryText: 'If state is disabled', func: () => {
								unloadCall.disabled = !unloadCall.disabled;
								this.buttonsProperties.unloadCall[1] = JSON.stringify(unloadCall);
								overwriteProperties(this.buttonsProperties); // Force overwriting
							}
						});
						menu.newCheckMenuLast(() => unloadCall.disabled);
					}
					{
						const menuName = menu.newMenu('Button states');
						menu.newEntry({
							menuName, entryText: 'Use button states', func: () => {
								indicator.enabled = !indicator.enabled;
								this.buttonsProperties.indicator[1] = JSON.stringify(indicator);
								overwriteProperties(this.buttonsProperties); // Force overwriting
								if (indicator.enabled) {
									fb.ShowPopupMessage('Button\'s icon will be highlighted according to tracked state. States can be saved between sessions using the appropriate config.\n\nNote button states should be enabled after syncing with the desired configuration/action to track.\n\ni.e. The default action for the button switches different playback statistics settings. In order to track such settings, enable button states while they are disabled (the button is set to disabled by default at init). Then click on the button to enable them back (while state is set to enabled at the same time). As result, both the button and the desired settings to track will be in sync.', 'Main Menu Shortcut');
								} else {
									this.switchActive(false);
									this.buttonsProperties.state[1] = this.active;
									overwriteProperties(this.buttonsProperties); // Force overwriting
								}
							}
						});
						menu.newCheckMenu(menuName, 'Use button states', void (0), () => { return indicator.enabled; });
						menu.newEntry({
							menuName, entryText: 'Save between sessions' + (indicator.menuCheck ? '\t[forced]' : ''), func: () => {
								indicator.init = !indicator.init;
								this.buttonsProperties.indicator[1] = JSON.stringify(indicator);
								overwriteProperties(this.buttonsProperties); // Force overwriting
							}, flags: indicator.enabled && !indicator.menuCheck ? MF_STRING : MF_GRAYED
						});
						menu.newCheckMenuLast(() => indicator.init);
						menu.newSeparator(menuName);
						{
							const subMenuName = menu.newMenu('State checking', menuName, indicator.enabled ? MF_STRING : MF_GRAYED);
							const options = [
								{ entryText: 'Save states internally', val: false },
								{ entryText: 'Sync with main menu checks', val: true }
							];
							options.forEach((opt) => {
								menu.newEntry({
									menuName: subMenuName, entryText: opt.entryText, func: () => {
										indicator.menuCheck = opt.val;
										if (this.interval) {
											clearInterval(this.interval);
											this.interval = null;
										}
										if (indicator.menuCheck) {
											indicator.init = true;
											// Force check of current state
											this.switchActive(indicator.menuCheck ? this.stateCheck().check : void (0));
											this.buttonsProperties.state[1] = this.active;
											if (indicator.menuCheckInterval) {
												this.interval = setInterval(() => this.switchActive(this.stateCheck().check), indicator.menuCheckInterval);
											}
										}
										this.buttonsProperties.indicator[1] = JSON.stringify(indicator);
										overwriteProperties(this.buttonsProperties); // Force overwriting
									}, flags: indicator.enabled ? MF_STRING : MF_GRAYED
								});
							});
							menu.newCheckMenuLast(() => indicator.menuCheck ? 1 : 0, options);
							menu.newSeparator(subMenuName);
							menu.newEntry({
								menuName: subMenuName, entryText: 'Syncing interval\t' + _b(indicator.menuCheckInterval), func: () => {
									const input = Input.number('int positive', indicator.menuCheckInterval, 'Set syncing interval (in ms):\n(0 to disable)', 'Main menu checking interval', 250);
									if (input !== null) {
										indicator.menuCheckInterval = input;
										this.buttonsProperties.indicator[1] = JSON.stringify(indicator);
										overwriteProperties(this.buttonsProperties); // Force overwriting
										if (this.interval) {
											clearInterval(this.interval);
											this.interval = null;
										}
										if (indicator.menuCheckInterval) {
											this.interval = setInterval(() => this.switchActive(this.stateCheck().check), indicator.menuCheckInterval);
										}
									}
								}, flags: indicator.enabled ? MF_STRING : MF_GRAYED
							});
						}
					}
					menu.newSeparator();
					menu.newEntry({
						entryText: 'Rename button...', func: () => {
							const input = Input.string('string', this.buttonsProperties.customName[1], 'Enter button name:', window.Name + 'Main Menu Shortcut', this.buttonsProperties.customName[3], void (0), false);
							if (input === null) { return; }
							this.text = this.buttonsProperties.customName[1] = input;
							overwriteProperties(this.buttonsProperties); // Force overwriting
							this.w = _gr.CalcTextWidth(input, _gdiFont('Segoe UI', 12 * buttonsBar.config.scale)) + 30;
							this.w *= buttonsBar.config.scale;
							this.changeScale(buttonsBar.config.scale);
							window.Repaint();
						}
					});
					menu.newEntry({
						entryText: 'Configure icon...', func: () => {
							const input = Input.string('unicode', this.buttonsProperties.icon[1], 'Enter button\'s icon: (unicode)\n\nLook for values at:\nhttps://www.fontawesomecheatsheet.com', window.Name + 'Main Menu Shortcut', this.buttonsProperties.icon[3], void (0), false);
							if (input === null) { return; }
							this.icon = this.buttonsProperties.icon[1] = input;
							overwriteProperties(this.buttonsProperties); // Force overwriting
							window.Repaint();
						}
					});
					menu.newSeparator();
					menu.newEntry({ entryText: 'Readme...', func: () => showButtonReadme('buttons_utils_main_menu.js') });
					menu.btn_up(this.currX, this.currY + this.currH);
				} else {
					const bValidState = indicator.menuCheck ? this.stateCheck().bValid : true;
					const serial = funcs =>
						funcs.reduce((promise, func) =>
							promise.then(result => func().then(Array.prototype.concat.bind(result))), Promise.resolve([]));
					const step = (entry) => {
						const extra = specialKeys.map(k => { return Object.hasOwn(entry, k) ? k + ':' + entry[k] : null; }).filter(Boolean).join(', ');
						console.log('Main Menu button: ' + entry.name + ' -> ' + entry.command + (extra ? ' ' + _p(extra) : '')); // DEBUG
						let cache = {};
						if (Object.hasOwn(entry, 'PlaybackFollowCursor') && entry.PlaybackFollowCursor !== fb.PlaybackFollowCursor) {
							cache.PlaybackFollowCursor = fb.PlaybackFollowCursor;
							fb.PlaybackFollowCursor = entry.PlaybackFollowCursor;
						}
						if (Object.hasOwn(entry, 'CursorFollowPlayback') && entry.CursorFollowPlayback !== fb.CursorFollowPlayback) {
							cache.CursorFollowPlayback = fb.CursorFollowPlayback;
							fb.CursorFollowPlayback = entry.CursorFollowPlayback;
						}
						if (Object.hasOwn(entry, 'idx')) {
							plman.SetPlaylistFocusItem(plman.ActivePlaylist, entry.idx);
						}
						if (!bValidState) {
							const menuState = tryMethod('IsMainMenuCommandChecked', fb, null)(entry.command);
							if (menuState !== null && menuState !== this.active) {
								console.log('Main Menu button: fixing entry state mismatch...');
								return;
							}
						}
						try { fb.RunMainMenuCommand(entry.command); } catch (e) { console.log(e); }
						setTimeout(() => {
							for (let key in cache) { fb[key] = cache[key]; }
						}, 1000);
					};
					const funcs = list.map((entry) => {
						return () => new Promise((resolve) => {
							if (entry.timeout) { setTimeout(() => { step(entry); resolve(); }, entry.timeout); } else { step(entry); resolve(); }
						});
					});
					serial(funcs).then(() => {
						if (indicator.enabled) {
							this.switchActive(indicator.menuCheck ? this.stateCheck().check : void (0));
							if (indicator.init) {
								this.buttonsProperties.state[1] = this.active;
								overwriteProperties(this.buttonsProperties); // Force overwriting
							}
						}
					});
				}
			},
			description: function () {
				const bShift = utils.IsKeyPressed(VK_SHIFT);
				const bInfo = typeof barProperties === 'undefined' || barProperties.bTooltipInfo[1];
				let info = 'Executes Main menu assigned entries:';
				// Entries
				const entries = JSON.parse(this.buttonsProperties.entries[1]);
				const indicator = JSON.parse(this.buttonsProperties.indicator[1]);
				if (indicator.enabled) {
					const results = entries.map((e) => { return { name: e.name, check: tryMethod('IsMainMenuCommandChecked', fb, null)(e.command) }; })
						.filter((e) => e.check !== null)
						.map((e) => e.name + ': ' + e.check);
					info += '\nEntries:\n--->' + results.join('\n--->');
				} else {
					info += '\nEntries:\t' + entries.map(e => e.name).joinEvery(', ', 2, '\n\t');
				}
				if (bShift || bInfo) {
					info += '\n-----------------------------------------------------';
					info += '\n(Shift + L. Click to open config menu)';
				}
				return info;
			},
			prefix, buttonsProperties: newButtonsProperties,
			icon: newButtonsProperties.icon[1],
			variables: {
				defText: 'Main menu shortcut',
				stateCheck: function (parent, bPopup) {
					const entries = JSON.parse(this.buttonsProperties.entries[1]);
					const results = entries.map((e) => {
						return { command: e.command, check: tryMethod('IsMainMenuCommandChecked', fb, null)(e.command) };
					}).filter((e) => e.check !== null);
					const bValid = new Set(results.map((e) => e.check)).size === 1;
					if (!bValid && bPopup) {
						doOnce('Menu check mismatch', () => fb.ShowPopupMessage(
							'Main menu button: ' + this.buttonsProperties.customName[1] +
							'\nEntries:' +
							'\n\t' + results.map((e) => e.command + ' -> ' + e.check).join('\n\t') +
							'\n\nCheck every menu entry listed above manually and click on them until all are set to the same state.',
							'Main Menu button state mismatch'
						))();
					}
					return { bValid, check: results.every((result) => result.check) };
				},
				interval: null,
			},
			listener: {
				'on_script_unload': (parent) => {
					if (this.interval) { clearInterval(this.interval); }
					// Properties are not saved on unload
					// https://github.com/TheQwertiest/foo_spider_monkey_panel/issues/205
					const unloadCall = JSON.parse(parent.buttonsProperties.unloadCall[1]);
					if (unloadCall.disabled && !parent.active || unloadCall.enabled && parent.active) {
						parent.onClick();
					}
				}
			},
			onInit: function () { // Default state on init
				const indicator = JSON.parse(this.buttonsProperties.indicator[1]);
				const unloadCall = JSON.parse(this.buttonsProperties.unloadCall[1]);
				let bActive;
				// Check defaults
				if (!Object.hasOwn(indicator, 'menuCheckInterval')) {
					indicator.menuCheckInterval = 0;
					this.buttonsProperties.indicator[1] = JSON.stringify(indicator);
				}
				if (indicator.menuCheck) {
					bActive = this.stateCheck().check;
					if (indicator.menuCheckInterval) { this.interval = setInterval(() => this.switchActive(this.stateCheck().check), indicator.menuCheckInterval); }
				} else {
					bActive = this.buttonsProperties.state[1];
					// On unload properties are not saved but some states are not possible and must be fixed
					// Otherwise just load previous state
					if (unloadCall.disabled && !bActive || unloadCall.enabled && bActive) {
						bActive = !bActive;
					}
				}
				if (indicator.enabled && indicator.init) { this.switchActive(bActive); }
				this.buttonsProperties.state[1] = this.active;
				overwriteProperties(this.buttonsProperties);
			},
			update: { scriptName: 'Playlist-Tools-SMP', version }
		})
	};
	addButton(newButton);
}