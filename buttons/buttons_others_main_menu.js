'use strict';
//08/02/23

/* 
	Main Menu shortcut
	----------------
	Runs multiple main menus with one single click, on order.
	Also allows to call such menus before closing foobar, according to button state (enabled/disabled).
	Button state may be saved between sessions and will change when clicking on the button.
 */

include('..\\helpers\\helpers_xxx.js');
include('..\\helpers\\buttons_xxx.js');
include('..\\helpers\\helpers_xxx_file.js');
include('..\\helpers\\helpers_xxx_input.js');
include('..\\helpers\\menu_xxx.js');
include('..\\helpers\\menu_xxx_extras.js');
var prefix = 'mms';

try {window.DefineScript('Main Menu Shortcut Button', {author:'XXX', version: '1.0.0', features: {drag_n_drop: false}});} catch (e) {/* console.log('Main Menu Shortcut Button loaded.'); */} //May be loaded along other buttons

prefix = getUniquePrefix(prefix, ''); // Puts new ID before '_'

var newButtonsProperties = { //You can simply add new properties here
	customName:		['Name for the custom UI button', 'Main Menu', {func: isStringWeak}, 'Main Menu'],
	entries:		['Main menu entries', JSON.stringify([
		{name: 'Playback Statistics', command: 'Library/Playback Statistics/Monitor playing tracks'},
		{name: 'ListenBrainz Statistics', command: 'Playback/Submit to ListenBrainz'}
	]), {func: isJSON}],
	unloadCall: 	['Call menus on unload options', JSON.stringify({enabled: false, disabled: false}), {func: isJSON}],
	indicator: 		['Indicator options', JSON.stringify({init: true, enabled: false}), {func: isJSON}],
	state: 	 		['Current state', false, {func: isBoolean}, false],
	icon:			['Button icon', chars.cogs, {func: isString}, chars.cogs],
	bIconMode:		['Icon-only mode?', false, {func: isBoolean}, false]
};
newButtonsProperties.entries.push(newButtonsProperties.entries[1]);
newButtonsProperties.unloadCall.push(newButtonsProperties.unloadCall[1]);
newButtonsProperties.indicator.push(newButtonsProperties.indicator[1]);

setProperties(newButtonsProperties, prefix, 0); //This sets all the panel properties at once
newButtonsProperties = getPropertiesPairs(newButtonsProperties, prefix, 0);
buttonsBar.list.push(newButtonsProperties);

{
	var newButton = {
		'Main Menu': new themedButton({x: 0, y: 0, w: _gr.CalcTextWidth(newButtonsProperties.customName[1], _gdiFont('Segoe UI', 12 * buttonsBar.config.scale)) + 35, h: 22}, newButtonsProperties.customName[1], function (mask) {
			const list = JSON.parse(this.buttonsProperties.entries[1]);
			const unloadCall = JSON.parse(this.buttonsProperties.unloadCall[1]);
			const indicator = JSON.parse(this.buttonsProperties.indicator[1]);
			const specialKeys = ['PlaybackFollowCursor', 'CursorFollowPlayback', 'idx', 'timeout'];
			if (mask === MK_SHIFT) {
				const menu = new _menu({onBtnUp: () => {
					this.buttonsProperties.entries[1] = JSON.stringify(list);
					overwriteProperties(this.buttonsProperties);
				}});
				menu.newEntry({entryText: 'Select output:', func: null, flags: MF_GRAYED});
				menu.newEntry({entryText: 'sep'});
				_createSubMenuEditEntries(menu, void(0), {
					name: 'Main Menu Shortcut',
					list, 
					defaults: JSON.parse(this.buttonsProperties.entries[3]), 
					input : () => {
						return {
							command : Input.string('string', '', 'Enter complete menu name:\nEx: Library/Playback Statistics/Monitor playing tracks', window.Name + 'Main Menu Shortcut' , 'Library/Playback Statistics/Monitor playing tracks', void(0), true),
							timeOut : Input.number('int positive', 0, 'Time (ms) to wait before running command:', window.Name + 'Main Menu Shortcut' , 10) || 0,
						};
					},
					bNumbered: true
				});
				{
					const menuName = menu.newMenu('Built-in presets...');
					const options = [
						{
							entryText: 'Playback statistics',
							entries : [
								{name: 'Playback Statistics', command: 'Library/Playback Statistics/Monitor playing tracks'},
								{name: 'ListenBrainz Statistics', command: 'Playback/Submit to ListenBrainz'},
								{name: 'Last.fm Statistics', command: 'Playback/Scrobble tracks'}
							],
							indicator: {init: true, enabled: true},
							unloadCall: {enabled: false, disabled: true},
							state: true,
							icon: chars.music
						},
						{
							entryText: 'Shuffle and play',
							entries : [
								{name: 'ReplayGain track', command: 'Playback/Replay Gain/Source mode/track'},
								{name: 'Shuffle', command: 'Edit/Sort/Randomize'},
								{name: 'Playback order', command: 'Order/Default'},
								{name: 'Play current pls', command: 'Playback/Play', idx: 0, PlaybackFollowCursor: true}
							],
							indicator: {init: false, enabled: false},
							unloadCall: {enabled: false, disabled: false},
							icon: chars.shuffle
						},
						{
							entryText: 'Async clear test',
							entries : [
								{name: 'Clear', command: 'Edit/Clear'},
								{name: 'Undo', command: 'Edit/Undo', timeout: 1000}
							],
							indicator: {init: false, enabled: false},
							unloadCall: {enabled: false, disabled: false},
							icon: chars.tasks
						},
					];
					options.forEach((option) => {
						menu.newEntry({menuName, entryText: option.entryText, func: () => {
							// Entries
							list.length = 0;
							clone(option.entries).forEach(e => list.push(e));
							fb.ShowPopupMessage(list.reduce((total, curr, i) => {
								const extra = specialKeys.map(k => {return curr.hasOwnProperty(k) ? k + ':' + curr[k] : null;}).filter(Boolean).join(', ');
								return total + (total ? '\n' : '') + (i + 1) + '. ' + curr.name + ' -> ' + curr.command + (extra ? ' ' + _p(extra) : '');
							}, ''), 'Main Menu Shortcut');
							// Rename
							this.icon = this.buttonsProperties.icon[1] = option.icon || this.buttonsProperties.icon[3];
							this.text = this.buttonsProperties.customName[1] = option.entryText;
							this.w = _gr.CalcTextWidth(option.entryText, _gdiFont('Segoe UI', 12 * buttonsBar.config.scale)) + 30;
							this.w *= buttonsBar.config.scale;
							this.changeScale(buttonsBar.config.scale);
							// Other config
							if (option.hasOwnProperty('indicator')) {
								for (let key in option.indicator) {
									indicator[key] = option.indicator[key];
								}
								this.buttonsProperties.indicator[1] = JSON.stringify(indicator);
							}
							if (option.hasOwnProperty('unloadCall')) {
								for (let key in option.unloadCall) {
									unloadCall[key] = option.unloadCall[key];
								}
								this.buttonsProperties.unloadCall[1] = JSON.stringify(unloadCall);
							}
							this.switchActive(option.state || false);
							this.buttonsProperties.state[1] = this.active;
							overwriteProperties(this.buttonsProperties); // Force overwriting
							window.Repaint();
						}});
					});
				}
				menu.newEntry({entryText: 'sep'});
				{
					const menuName = menu.newMenu('Run when closing foobar?');
					menu.newEntry({menuName, entryText: 'If state is enabled', func: () => {
						unloadCall.enabled = !unloadCall.enabled;
						this.buttonsProperties.unloadCall[1] = JSON.stringify(unloadCall);
						overwriteProperties(this.buttonsProperties); // Force overwriting
					}, flags: indicator.enabled ? MF_STRING : MF_GRAYED});
					menu.newCheckMenu(menuName, 'If state is enabled', void(0), () => {return unloadCall.enabled;});
					menu.newEntry({menuName, entryText: 'If state is disabled', func: () => {
						unloadCall.disabled = !unloadCall.disabled;
						this.buttonsProperties.unloadCall[1] = JSON.stringify(unloadCall);
						overwriteProperties(this.buttonsProperties); // Force overwriting
					}});
					menu.newCheckMenu(menuName, 'If state is disabled', void(0), () => {return unloadCall.disabled;});
				}
				{
					const menuName = menu.newMenu('Button states...');
					menu.newEntry({menuName, entryText: 'Use button states', func: () => {
						indicator.enabled = !indicator.enabled;
						this.buttonsProperties.indicator[1] = JSON.stringify(indicator);
						overwriteProperties(this.buttonsProperties); // Force overwriting
						if (indicator.enabled) {
							fb.ShowPopupMessage('Button\'s icon will be highlighted according to tracked state. States can be saved between sessions using the apropiate config.\n\nNote button states should be enabled after syncing with the desired configuration/action to track.\n\ni.e. The default action for the button switches different playback statistics settings. In order to track such settings, enable button states while they are disabled (the button is set to disabled by default at init). Then click on the button to enable them back (while state is set to enabled at the same time). As result, both the button and the desired settings to track will be in sync.', 'Main Menu Shortcut');
						} else {
							this.switchActive(false);
							this.buttonsProperties.state[1] = this.active;
							overwriteProperties(this.buttonsProperties); // Force overwriting
						}
					}});
					menu.newCheckMenu(menuName, 'Use button states', void(0), () => {return indicator.enabled;});
					menu.newEntry({menuName, entryText: 'Save between sessions', func: () => {
						indicator.init = !indicator.init;
						this.buttonsProperties.indicator[1] = JSON.stringify(indicator);
						overwriteProperties(this.buttonsProperties); // Force overwriting
					}, flags: indicator.enabled ? MF_STRING : MF_GRAYED});
					menu.newCheckMenu(menuName, 'Save between sessions', void(0), () => {return indicator.init;});
				}
				menu.newEntry({entryText: 'sep'});
				menu.newEntry({entryText: 'Rename button...', func: () => {
					const input = Input.string('string', this.buttonsProperties.customName[1], 'Enter button name:', window.Name + 'Main Menu Shortcut' , this.buttonsProperties.customName[3], void(0), false);
					if (input === null) {return;}
					this.text = this.buttonsProperties.customName[1] = input;
					overwriteProperties(this.buttonsProperties); // Force overwriting
					this.w = _gr.CalcTextWidth(input, _gdiFont('Segoe UI', 12 * buttonsBar.config.scale)) + 30;
					this.w *= buttonsBar.config.scale;
					this.changeScale(buttonsBar.config.scale);
					window.Repaint();
				}});
				menu.newEntry({entryText: 'Configure icon...', func: () => {
					const input = Input.string('unicode', this.buttonsProperties.icon[1], 'Enter button\'s icon: (unicode)\n\nLook for values at:\nhttps://www.fontawesomecheatsheet.com', window.Name + 'Main Menu Shortcut' , this.buttonsProperties.icon[3], void(0), false);
					if (input === null) {return;}
					this.icon = this.buttonsProperties.icon[1] = input;
					window.Repaint();
				}});
				menu.btn_up(this.currX, this.currY + this.currH);
			} else {
				const serial = funcs =>
					funcs.reduce((promise, func) =>
						promise.then(result => func().then(Array.prototype.concat.bind(result))), Promise.resolve([]));
				const step = (entry) => {
					const extra = specialKeys.map(k => {return entry.hasOwnProperty(k) ? k + ':' + entry[k] : null;}).filter(Boolean).join(', ');
					console.log(entry.name + ' -> ' + entry.command + (extra ? ' ' + _p(extra) : ''));
					let cache = {};
					if (entry.hasOwnProperty('PlaybackFollowCursor') && entry.PlaybackFollowCursor !== fb.PlaybackFollowCursor) {
						cache.PlaybackFollowCursor = fb.PlaybackFollowCursor;
						fb.PlaybackFollowCursor = entry.PlaybackFollowCursor; 
					}
					if (entry.hasOwnProperty('CursorFollowPlayback') && entry.CursorFollowPlayback !== fb.CursorFollowPlayback) {
						cache.CursorFollowPlayback = fb.CursorFollowPlayback;
						fb.CursorFollowPlayback = entry.CursorFollowPlayback;
					}
					if (entry.hasOwnProperty('idx')) {
						plman.SetPlaylistFocusItem(plman.ActivePlaylist, entry.idx);
					}
					try {fb.RunMainMenuCommand(entry.command)} catch (e) {console.log(e);}
					setTimeout(() => {
						for (let key in cache) {fb[key] = cache[key];}
					}, 1000);
				}
				const funcs = list.map((entry) => {
					return () => new Promise((resolve) => {
						if (entry.timeout) {setTimeout(() => {step(entry); resolve();}, entry.timeout);} else {step(entry); resolve();}
					});
				});
				serial(funcs).then(() => {
					if (indicator.enabled) {
						this.switchActive();
						if (indicator.init) {
							this.buttonsProperties.state[1] = this.active;
							overwriteProperties(this.buttonsProperties); // Force overwriting
						}
					}
				});
			}
		}, null, void(0), (parent) => {
			const bShift = utils.IsKeyPressed(VK_SHIFT);
			const bInfo = typeof menu_panelProperties === 'undefined' || menu_panelProperties.bTooltipInfo[1];
			let info = 'Executes Main menu assigned entries:';
			// Entries
			const list = JSON.parse(parent.buttonsProperties.entries[1]);
			info += '\nEntries:\t' + list.map(e => e.name).joinEvery(', ', 2, '\n\t');
			if (bShift || bInfo) {
				info += '\n-----------------------------------------------------';
				info += '\n(Shift + L. Click to open config menu)';
			}
			return info;
		}, prefix, newButtonsProperties, newButtonsProperties.icon[1], void(0), {defText: 'Main menu shortcut'},
		{
			'on_script_unload': (parent) => {
				const unloadCall = JSON.parse(parent.buttonsProperties.unloadCall[1]);
				const indicator = JSON.parse(parent.buttonsProperties.indicator[1]);
				if (unloadCall.disabled && !parent.active || unloadCall.enabled && parent.active) {
					parent.onClick();
				}
			}
		}),
	};
	
	// Default state: previous state or disabled
	const indicator = JSON.parse(newButton['Main Menu'].buttonsProperties.indicator[1]);
	if (indicator.enabled && indicator.init) {
		newButton['Main Menu'].switchActive(newButton['Main Menu'].buttonsProperties.state[1]);
	}
	
	addButton(newButton);
}