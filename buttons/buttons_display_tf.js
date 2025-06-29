'use strict';
//29/06/25

/*
	Volume controls and display
 */

/* global menu_panelProperties:readable */
include('..\\helpers\\helpers_xxx.js');
/* global globFonts:readable, checkCompatible:readable, VK_RETURN:readable, FontStyle:readable, MK_SHIFT:readable, VK_SHIFT:readable, VK_BACK:readable, DT_LEFT:readable, DT_CENTER:readable, DT_RIGHT:readable, DT_VCENTER:readable, DT_CALCRECT:readable, DT_NOPREFIX:readable, DT_END_ELLIPSIS:readable, DT_PATH_ELLIPSIS:readable, DT_WORD_ELLIPSIS:readable, DT_NOCLIP:readable, globTags:readable */
include('..\\helpers\\buttons_xxx.js');
/* global getUniquePrefix:readable, buttonsBar:readable, addButton:readable, ThemedButton:readable, getButtonVersion:readable, Flag:readable, buttonStates:readable */
include('..\\helpers\\buttons_xxx_menu.js');
/* global settingsMenu:readable  */
include('..\\helpers\\helpers_xxx_prototypes.js');
/* global isFunction:readable, isBoolean:readable, isStringWeak:readable, isFloat:readable, isInt:readable, _t:readable */
include('..\\helpers\\helpers_xxx_tags.js');
/* global queryReplaceWithStatic:readable, sanitizeTagTfo:readable */
include('..\\helpers\\helpers_xxx_UI.js');
/* global _gdiFont:readable, _scale:readable, chars:readable */
include('..\\helpers\\helpers_xxx_properties.js');
/* global setProperties:readable, getPropertiesPairs:readable, overwriteProperties:readable */

var prefix = 'dtf'; // NOSONAR[global]
var version = getButtonVersion('Playlist-Tools-SMP'); // NOSONAR[global]

try { window.DefineScript('Display Title Format button', { author: 'regorxxx', version, features: { drag_n_drop: false } }); } catch (e) { /* May be loaded along other buttons */ } // eslint-disable-line no-unused-vars

checkCompatible('1.6.1', 'smp');
checkCompatible('1.4.0', 'fb');

prefix = getUniquePrefix(prefix, ''); // Puts new ID before '_'
var newButtonsProperties = { // NOSONAR[global]
	tf: ['Title Format expression', '$pad($repeat(★,' + _t(globTags.rating) + '), 5,✩)', { func: isStringWeak }, '$pad($repeat(★,' + _t(globTags.rating) + '), 5,✩)'],
	fallback: ['Fallback text', sanitizeTagTfo(chars.loveEmojiV2), { func: isStringWeak }, sanitizeTagTfo(chars.loveEmojiV2)],
	bPlaying: ['Follow now playing', true, { func: isBoolean }, true],
	refreshRate: ['Max. refresh rate (ms)', 50, { func: isInt }, 50],
	buttonSize: ['Display area size', 120, { func: (v) => isFloat(v) || isInt(v) }, 120],
	bRelSize: ['Relative size (window)', false, { func: isBoolean }, false],
	fontSize: ['Font size scale', 1.2, { range: [[0, Infinity]], func: (v) => isFloat(v) || isInt(v) }, 1.2],
	fontStyle: ['Font style', 'Bold', { func: new Function('s', 'return ' + JSON.stringify(Object.keys(FontStyle)) + '.includes(s);') }, 'Bold'],
	textFlags: ['Text flags', DT_LEFT | DT_VCENTER | DT_CALCRECT | DT_NOPREFIX | DT_NOCLIP | DT_END_ELLIPSIS, { func: isInt }, DT_LEFT | DT_VCENTER | DT_CALCRECT | DT_NOCLIP | DT_NOPREFIX | DT_END_ELLIPSIS],
};
setProperties(newButtonsProperties, prefix, 0); //This sets all the panel properties at once
newButtonsProperties = getPropertiesPairs(newButtonsProperties, prefix, 0);
buttonsBar.list.push(newButtonsProperties);

addButton({
	'Title Format display': new ThemedButton({
		coordinates: {
			x: 0, y: 0,
			w: function () {
				return this.buttonsProperties.bRelSize[1]
					? Math.min(this.buttonsProperties.buttonSize[1] / 100 * window.Width, window.Width - this.currX)
					: _scale(this.buttonsProperties.buttonSize[1]) * buttonsBar.config.scale;
			},
			h: 22
		},
		text: function () { return this.displayFunc(); },
		func: function (mask) {
			if (mask === MK_SHIFT) {
				settingsMenu(
					this, true, ['buttons_display_tf.js', 'Dynamic queries'],
					{
						tf: {
							input: 'Enter TF expression:\n\nAlso allowed dynamic variables (which don\'t require a selection), like #NOW#, which will be replaced before execution.\n(see \'Dynamic queries\' readme for more info)'
						},
						fallback: {
							input: 'Enter TF expression or text:\n\nAlso allowed dynamic variables (which don\'t require a selection), like #NOW#, which will be replaced before execution.\n(see \'Dynamic queries\' readme for more info)'
						},
						buttonSize: {
							input: 'Enter display size:\n(px)\n\nNote this value is scaled with DPI and also the buttons bar scaling.',
							bSep: true
						},
						fontSize: {
							input: 'Enter font size scale:\n(real number > 0)'
						},
						fontStyle: {
							input: 'Enter font style:\n\nAvailable styles: ' + Object.keys(FontStyle).join(', '),
							bHide: true
						},
						textFlags: {
							input: 'Enter text flags:\n\nDon\'t edit here, use the text submenus settings instead.',
							bHide: true
						}
					},
					{
						'*':
							(value, key) => { // eslint-disable-line no-unused-vars
								if (['fontSize', 'fontStyle'].includes(key)) {
									this.gFont = _gdiFont(
										globFonts.button.name,
										globFonts.button.size * this.buttonsProperties.fontSize[1] * buttonsBar.config.textScale,
										FontStyle[this.buttonsProperties.fontStyle[1]]
									);
								} else if (key === 'textFlags') {
									this.textFlags = new Flag(value);
								} else if (key === 'tf') {
									this.tfSet();
								}
								this.repaint();
							}
					}, (menu, parent) => { // eslint-disable-line no-unused-vars
						menu.newSeparator();
						{
							const menuName = menu.newMenu('Text style');
							const options = Object.keys(FontStyle);
							options.forEach((style) => {
								menu.newEntry({
									menuName, entryText: style, func: () => {
										this.gFont = _gdiFont(
											globFonts.button.name,
											globFonts.button.size * this.buttonsProperties.fontSize[1] * buttonsBar.config.textScale,
											FontStyle[style]
										);
										this.buttonsProperties.fontStyle[1] = style;
										overwriteProperties(this.buttonsProperties);
										this.repaint();
									}
								});
							});
							menu.newCheckMenuLast(() => options.indexOf(this.buttonsProperties.fontStyle[1]), options);
						}
						{
							const menuName = menu.newMenu('Text alignment');
							const options = [
								{ entryText: 'Left', flag: DT_LEFT },
								{ entryText: 'Center', flag: DT_CENTER },
								{ entryText: 'Right', flag: DT_RIGHT }
							];
							options.forEach((o) => {
								menu.newEntry({
									menuName, entryText: o.entryText, func: () => {
										[DT_LEFT, DT_CENTER, DT_RIGHT].forEach((f) => this.textFlags.delete(f));
										if (o.flag !== null) { this.textFlags.add(o.flag); }
										this.buttonsProperties.textFlags[1] = this.textFlags.get();
										overwriteProperties(this.buttonsProperties);
										this.repaint();
									}
								});
							});
							menu.newCheckMenuLast(() => { // It fails for DT_LEFT === 0
								const idx = options.findIndex((o) => this.textFlags.has(o.flag));
								return idx !== -1 ? idx : 0;
							}, options);
						}
						{
							const menuName = menu.newMenu('Text truncation');
							const options = [
								{ entryText: 'None', flag: null },
								{ entryText: 'End', flag: DT_END_ELLIPSIS },
								{ entryText: 'Path', flag: DT_PATH_ELLIPSIS },
								{ entryText: 'Word', flag: DT_WORD_ELLIPSIS }
							];
							options.forEach((o) => {
								menu.newEntry({
									menuName, entryText: o.entryText, func: () => {
										[DT_END_ELLIPSIS, DT_PATH_ELLIPSIS, DT_WORD_ELLIPSIS].forEach((f) => this.textFlags.delete(f));
										if (o.flag !== null) { this.textFlags.add(o.flag); }
										this.buttonsProperties.textFlags[1] = this.textFlags.get();
										overwriteProperties(this.buttonsProperties);
										this.repaint();
									}
								});
							});
							menu.newCheckMenuLast(() => { // It fails for none
								const idx = options.findIndex((o) => this.textFlags.has(o.flag));
								return idx !== -1 ? idx : 0;
							}, options);
						}
					}, { parentName: 'Title Format display' }
				).btn_up(this.currX, this.currY + this.currH);
			} else if (!this.isInput) { this.startInput(); }
			else { this.applyInput(); }
		},
		gFont: _gdiFont(globFonts.button.name, globFonts.button.size * newButtonsProperties.fontSize[1] * buttonsBar.config.textScale, FontStyle[newButtonsProperties.fontStyle[1]]),
		description: function () {
			const bShift = utils.IsKeyPressed(VK_SHIFT);
			const bInfo = typeof menu_panelProperties === 'undefined' || menu_panelProperties.bTooltipInfo[1];
			let info = this.buttonsProperties.bPlaying[1] && fb.IsPlaying
				? 'Playing item:'
				: 'Focused item:';
			info += '\n' + this.tfEval();
			const np = fb.IsPlaying && plman.GetPlayingItemLocation().IsValid;
			if (np || bShift || bInfo) {
				info += '\n-----------------------------------------------------';
				if (np) {
					info += '\n(Double + L. Click to show now playing)';
				}
				if (bShift || bInfo) {
					info += '\n(Shift + L. Click to open config menu)';
				}
			}
			return info;
		},
		prefix, buttonsProperties: newButtonsProperties,
		variables: {
			textFlags: new Flag(newButtonsProperties.textFlags[1]),
			tf: fb.TitleFormat(queryReplaceWithStatic(newButtonsProperties.tf[1])),
			handle: function () {
				return this.buttonsProperties.bPlaying[1]
					? fb.GetNowPlaying() || fb.GetFocusItem(true)
					: fb.GetFocusItem(true) || fb.GetNowPlaying();
			},
			tfSet: function () { // Call when strictly needed, may require evaluation of entire selection
				this.tf = fb.TitleFormat(queryReplaceWithStatic(this.buttonsProperties.tf[1]));
			},
			fallbackGet: function () {
				return fb.TitleFormat(queryReplaceWithStatic(this.buttonsProperties.fallback[1]));
			},
			tfEval: function () {
				const selItem = fb.GetFocusItem(true);
				return fb.IsPlaying && (this.buttonsProperties.bPlaying[1] || !selItem)
					? this.tf.Eval()
					: selItem
						? this.tf.EvalWithMetadb(selItem)
						: this.fallbackGet().Eval(true);
			},
			throttleRefresh: (() => {
				let timerId;
				return function () {
					if (timerId) { return; }
					timerId = setTimeout(() => {
						this.tfSet();
						this.repaint();
						timerId = null;
					}, this.buttonsProperties.refreshRate[1]);
				};
			})(),
			hasDynamicQueries: function () {
				return this.buttonsProperties.tf[1].includes('#') || this.buttonsProperties.fallback[1].includes('#');
			},
			displayFunc: function () {
				const val = String(this.tfEval());
				return val.length ? val : ' ';
			},
			inputFunc: function () { return this.tf.Expression + this.sep; },
			restoreDisplay: function () {
				this.isInput = false;
				this.text = this.displayFunc;
			},
			sep: '‎|‎',
			inputRe: /([\x20-\xFF]+)/,
			startInput: function () {
				this.isInput = true;
				this.text = this.inputFunc();
				this.repaint();
				this.setTimeout();
				this.setAnimation();
			},
			applyInput: function () {
				this.clearTimeout();
				if (isFunction(this.text)) { return; }
				this.buttonsProperties.tf[1] = this.text.replace(this.sep, '');
				this.restoreDisplay();
				overwriteProperties(this.buttonsProperties);
			},
			abortInput: function () {
				if (isFunction(this.text)) { this.isInput = false; }
				else if (this.text.length) { this.applyInput(); }
			},
			inputInterval: null,
			inputTimeout: null,
			setTimeout: function () {
				this.inputTimeout = setTimeout(() => {
					if (this.isInput && this.state === buttonStates.hover) {
						this.setTimeout();
					} else if (this.isInput) {
						this.abortInput();
						this.clearTimeout();
						this.restoreDisplay();
						this.tfSet();
						this.repaint();
					}
				}, 2000);
			},
			setAnimation: function () {
				this.inputInterval = setInterval(() => {
					this.text = this.text.includes(this.sep)
						? this.text.replace(this.sep, '')
						: this.text.replace(this.inputRe, '$1' + this.sep);
					this.repaint();
				}, 400);
			},
			clearTimeout: function () {
				if (this.inputTimeout) {
					clearTimeout(this.inputTimeout);
					this.inputTimeout = null;
					clearInterval(this.inputInterval);
					this.inputInterval = null;
				}
			}
		},
		listener: {
			on_volume_change: function () {
				if (/#(VOLUME|VOLUMEDB)#/i.test(this.buttonsProperties.tf[1])) { this.throttleRefresh(); }
			},
			on_item_focus_change: function () {
				if (!this.buttonsProperties.bPlaying[1] || !fb.IsPlaying || this.hasDynamicQueries()) { this.throttleRefresh(); }
			},
			on_playback_new_track: function () {
				if (this.buttonsProperties.bPlaying[1] || !fb.GetFocusItem(true)) { this.throttleRefresh(); }
			},
			on_playback_time: function () {
				if (this.buttonsProperties.bPlaying[1] || !fb.GetFocusItem(true)) { this.throttleRefresh(); }
			},
			on_playback_stop: function () {
				if (this.buttonsProperties.bPlaying[1] || !fb.GetFocusItem(true)) { this.throttleRefresh(); }
			},
			on_playback_pause: function () {
				if (this.buttonsProperties.bPlaying[1] || !fb.GetFocusItem(true)) { this.throttleRefresh(); }
			},
			on_selection_changed: function () {
				if (!this.buttonsProperties.bPlaying[1] || !fb.IsPlaying || this.hasDynamicQueries()) { this.throttleRefresh(); }
			},
			on_playlist_switch: function () {
				if (!this.buttonsProperties.bPlaying[1] || !fb.IsPlaying || this.hasDynamicQueries()) { this.throttleRefresh(); }
			},
			on_mouse_lbtn_dblclk: function () {
				if (fb.IsPlaying) {
					const loc = plman.GetPlayingItemLocation();
					if (loc.IsValid) {
						plman.ActivePlaylist = loc.PlaylistIndex;
						plman.SetPlaylistFocusItem(loc.PlaylistIndex, loc.PlaylistItemIndex);
					}
				}
			},
			on_key_up: function (parent, vkey) {
				if (this.isInput && vkey === VK_RETURN) { this.applyInput(); this.throttleRefresh(); }
			},
			on_char: function (parent, code) {
				if (this.isInput) {
					const char = String.fromCharCode(code);
					if (isFunction(this.text)) { this.text = this.buttonsProperties.tf[1]; }
					if (this.inputRe.test(char)) {
						this.text = this.text.replace(this.sep, '') + char + this.sep;
						this.repaint();
						this.clearTimeout();
						this.setTimeout();
						this.setAnimation();
					} else if (code === VK_BACK) {
						this.text = this.text.replace(this.sep, '').slice(0, -1) + this.sep;
						this.repaint();
						this.clearTimeout();
						this.setTimeout();
						this.setAnimation();
					} else if (code !== VK_RETURN) {
						this.abortInput();
						this.clearTimeout();
						this.restoreDisplay();
						this.repaint();
					}
				}
			}
		},
		update: { scriptName: 'Playlist-Tools-SMP', version }
	}),
});