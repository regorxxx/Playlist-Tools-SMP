'use strict';
//14/03/25

/*
	Volume controls and display
 */

/* global menu_panelProperties:readable */
include('..\\helpers\\helpers_xxx.js');
/* global globFonts:readable, checkCompatible:readable, VK_RETURN:readable, FontStyle:readable, MK_SHIFT:readable, VK_SHIFT:readable, VK_BACK:readable */
include('..\\helpers\\buttons_xxx.js');
/* global getUniquePrefix:readable, buttonsBar:readable, addButton:readable, ThemedButton:readable, getButtonVersion:readable */
include('..\\helpers\\buttons_xxx_menu.js');
/* global settingsMenu:readable  */
include('..\\helpers\\helpers_xxx_prototypes.js');
/* global isFunction:readable, isBoolean:readable, isStringWeak:readable */
include('..\\helpers\\helpers_xxx_tags.js');
/* global queryReplaceWithStatic:readable */
include('..\\helpers\\helpers_xxx_UI.js');
/* global _gdiFont:readable, _scale:readable, chars:readable */
include('..\\helpers\\helpers_xxx_properties.js');
/* global setProperties:readable, getPropertiesPairs:readable, overwriteProperties:readable */

var prefix = 'dt'; // NOSONAR[global]
var version = getButtonVersion('Playlist-Tools-SMP'); // NOSONAR[global]

try { window.DefineScript('Display Title Format button', { author: 'regorxxx', version, features: { drag_n_drop: false } }); } catch (e) { /* May be loaded along other buttons */ } // eslint-disable-line no-unused-vars

checkCompatible('1.6.1', 'smp');
checkCompatible('1.4.0', 'fb');

prefix = getUniquePrefix(prefix, ''); // Puts new ID before '_'
var newButtonsProperties = { // NOSONAR[global]
	tf: ['Title Format expression', '$pad($repeat(★,%RATING%), 5,✩)', { func: isStringWeak }, '$pad($repeat(★,%RATING%), 5,✩)'],
	bPlaying: ['Follow now playing', true, { func: isBoolean }, true],
	fallback: ['Fallback text', chars.loveEmojiV2, { func: isStringWeak }, chars.loveEmojiV2]
};
setProperties(newButtonsProperties, prefix, 0); //This sets all the panel properties at once
newButtonsProperties = getPropertiesPairs(newButtonsProperties, prefix, 0);
buttonsBar.list.push(newButtonsProperties);

addButton({
	'Title Format display': new ThemedButton({
		coordinates: { x: 0, y: 0, w: 20 * globFonts.button.size * buttonsBar.config.scale + 8 * _scale(1, false) / _scale(buttonsBar.config.scale), h: 22 },
		text: function () { return this.displayFunc(); },
		func: function (mask) {
			if (mask === MK_SHIFT) {
				settingsMenu(
					this, true, ['buttons_display_tf.js'],
					{
						tf: {
							input: 'Enter TF expression:\n\nAlso allowed dynamic variables (which don\'t require a selection), like #NOW#, which will be replaced before execution.\n(see \'Dynamic queries\' readme for more info)'
						},
						fallback: {
							input: 'Enter TF expression or text:\n\nAlso allowed dynamic variables (which don\'t require a selection), like #NOW#, which will be replaced before execution.\n(see \'Dynamic queries\' readme for more info)'
						}
					},
					{
						'*':
							(value) => { // eslint-disable-line no-unused-vars
								this.repaint();
							}
					}
				).btn_up(this.currX, this.currY + this.currH);
			} else if (!this.isInput) { this.startInput(); }
			else { this.applyInput(); }
		},
		gFont: _gdiFont(globFonts.button.name, globFonts.button.size * 1.2 * buttonsBar.config.textScale, FontStyle.Bold),
		description: function () {
			const bShift = utils.IsKeyPressed(VK_SHIFT);
			const bInfo = typeof menu_panelProperties === 'undefined' || menu_panelProperties.bTooltipInfo[1];
			let info = this.buttonsProperties.bPlaying[1] && fb.IsPlaying
				? 'Playing item:'
				: 'Focused item:';
			info += '\n' + this.tfEval();
			if (bShift || bInfo) {
				info += '\n-----------------------------------------------------';
				info += '\n(Shift + L. Click to open config menu)';
			}
			return info;
		},
		prefix, buttonsProperties: newButtonsProperties,
		variables: {
			tf: fb.TitleFormat(queryReplaceWithStatic(newButtonsProperties.tf[1])),
			handle: function () {
				return this.buttonsProperties.bPlaying[1]
					? fb.GetNowPlaying() || fb.GetFocusItem(true)
					: fb.GetFocusItem(true) || fb.GetNowPlaying();
			},
			tfSet: function () {
				this.tf =  fb.TitleFormat(queryReplaceWithStatic(this.buttonsProperties.tf[1]));
			},
			fallbackGet: function () {
				return queryReplaceWithStatic(this.buttonsProperties.fallback[1]);
			},
			tfEval: function () {
				this.tfSet();
				const selItem = fb.GetFocusItem(true);
				return fb.IsPlaying && (this.buttonsProperties.bPlaying[1] || !selItem)
					? this.tf.Eval()
					: selItem
						? this.tf.EvalWithMetadb(selItem)
						: this.fallbackGet();
			},
			displayFunc: function () {
				return String(this.tfEval()).cut(38);
			},
			inputFunc: function () { return this.tf.Expression + '|'; },
			restoreDisplay: function () {
				this.isInput = false;
				this.text = this.displayFunc;
			},
			startInput: function () {
				this.isInput = true;
				this.text = this.inputFunc;
				this.setTimeout();
			},
			applyInput: function () {
				this.clearTimeout();
				if (isFunction(this.text)) { return; }
				const sep = '‎|‎';
				this.buttonsProperties.tf[1] = this.text.replace(sep, '');
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
					if (this.isInput) {
						this.abortInput();
						this.clearTimeout();
						this.restoreDisplay();
						this.repaint();
					}
				}, 2000);
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
				if (/#(VOLUME|VOLUMEDB)#/i.test(this.buttonsProperties.tf[1])) { this.repaint(); }
			},
			on_item_focus_change: function () {
				if (!this.buttonsProperties.bPlaying[1] || !fb.IsPlaying) { this.repaint(); }
			},
			on_playback_new_track: function () {
				if (this.buttonsProperties.bPlaying[1] || !fb.GetFocusItem(true)) { this.repaint(); }
			},
			on_selection_changed: function () {
				if (!this.buttonsProperties.bPlaying[1] || !fb.IsPlaying) { this.repaint(); }
			},
			on_playlist_switch: function () {
				if (!this.buttonsProperties.bPlaying[1] || !fb.IsPlaying) { this.repaint(); }
			},
			on_key_up: function (parent, vkey) {
				if (this.isInput && vkey === VK_RETURN) { this.applyInput(); this.repaint(); }
			},
			on_char: function (parent, code) {
				if (this.isInput) {
					const char = String.fromCharCode(code);
					const re = /([\x20-\xFF]+)/;
					const sep = '‎|‎';
					if (isFunction(this.text)) { this.text = this.buttonsProperties.tf[1]; }
					if (re.test(char)) {
						this.text = this.text.replace(sep, '') + char + sep;
						this.repaint();
						this.clearTimeout();
						this.setTimeout();
						this.inputInterval = setInterval(() => {
							this.text = this.text.includes(sep)
								? this.text.replace(sep, '')
								: this.text.replace(re, '$1' + sep);
							this.repaint();
						}, 400);
					} else if (code === VK_BACK) {
						this.text = this.text.replace(sep, '').slice(0, -1) + sep;
						this.repaint();
						this.clearTimeout();
						this.setTimeout();
						this.inputInterval = setInterval(() => {
							this.text = this.text.includes(sep)
								? this.text.replace(sep, '')
								: this.text.replace(re, '$1' + sep);
							this.repaint();
						}, 400);
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