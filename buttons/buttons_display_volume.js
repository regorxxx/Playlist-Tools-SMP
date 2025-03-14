'use strict';
//13/03/25

/*
	Volume controls and display
 */

/* global menu_panelProperties:readable */
include('..\\helpers\\helpers_xxx.js');
/* global globFonts:readable, checkCompatible:readable, VK_RETURN:readable, FontStyle:readable, MK_SHIFT:readable, VK_SHIFT:readable */
include('..\\helpers\\buttons_xxx.js');
/* global getUniquePrefix:readable, buttonsBar:readable, addButton:readable, ThemedButton:readable, getButtonVersion:readable, buttonStates:readable */
include('..\\helpers\\buttons_xxx_menu.js');
/* global settingsMenu:readable  */
include('..\\helpers\\helpers_xxx_prototypes.js');
/* global isFunction:readable, isBoolean:readable */
include('..\\helpers\\helpers_xxx_UI.js');
/* global _gdiFont:readable, _gr:readable, _scale:readable, chars:readable */
include('..\\helpers\\helpers_xxx_properties.js');
/* global setProperties:readable, getPropertiesPairs:readable */

var prefix = 'dv'; // NOSONAR[global]
var version = getButtonVersion('Playlist-Tools-SMP'); // NOSONAR[global]

try { window.DefineScript('Volume control button', { author: 'regorxxx', version, features: { drag_n_drop: false } }); } catch (e) { /* May be loaded along other buttons */ } // eslint-disable-line no-unused-vars

checkCompatible('1.6.1', 'smp');
checkCompatible('1.4.0', 'fb');

prefix = getUniquePrefix(prefix, ''); // Puts new ID before '_'
var newButtonsProperties = { // NOSONAR[global]
	voldB: ['Display volume in dB', false, { func: isBoolean }, false],
};
setProperties(newButtonsProperties, prefix, 0); //This sets all the panel properties at once
newButtonsProperties = getPropertiesPairs(newButtonsProperties, prefix, 0);
buttonsBar.list.push(newButtonsProperties);

addButton({
	'Volume control mute': new ThemedButton({
		coordinates: { x: 0, y: 0, w: 0, h: 22 },
		func: function () {
			fb.VolumeMute();
		},
		description: () => fb.Volume > -100 ? 'Mute' : 'Unmute',
		prefix, buttonsProperties: newButtonsProperties,
		icon: () => fb.Volume > -100 ? chars.speaker : chars.speakerOff,
		listener: {
			on_volume_change: function () { this.repaint(); },
		},
	}),
	'Volume control down': new ThemedButton({
		coordinates: { x: 0, y: 0, w: 0, h: 22 },
		func: function () {
			fb.VolumeDown();
		},
		description: function () {
			const bInfo = typeof menu_panelProperties === 'undefined' || menu_panelProperties.bTooltipInfo[1];
			let info = 'Volume down';
			if (bInfo) {
				info += '\n-----------------------------------------------------';
				info += '\n(Double L. Click to set min volume)';
			}
			return info;
		},
		prefix, buttonsProperties: newButtonsProperties,
		icon: chars.minus,
		listener: {
			on_mouse_lbtn_down: function () {
				setTimeout(() => {
					if (this.state === buttonStates.down) {
						const id = setInterval(() => {
							if (this.state === buttonStates.down) { fb.VolumeDown(); }
							else { clearInterval(id); }
						}, 60);
					}
				}, 100);
			},
			on_mouse_lbtn_dblclk: function () {
				if ([buttonStates.down, buttonStates.hover].includes(this.state)) { fb.Volume = -100; }
			}
		}
	}),
	'Volume control up': new ThemedButton({
		coordinates: { x: 0, y: 0, w: 0, h: 22 },
		func: function () {
			fb.VolumeUp();
		},
		description: function () {
			const bInfo = typeof menu_panelProperties === 'undefined' || menu_panelProperties.bTooltipInfo[1];
			let info = 'Volume up';
			if (bInfo) {
				info += '\n-----------------------------------------------------';
				info += '\n(Double L. Click to set max volume)';
			}
			return info;
		},
		prefix, buttonsProperties: newButtonsProperties,
		icon: chars.plus,
		listener: {
			on_mouse_lbtn_down: function () {
				setTimeout(() => {
					if (this.state === buttonStates.down) {
						const id = setInterval(() => {
							if (this.state === buttonStates.down) { fb.VolumeUp(); }
							else { clearInterval(id); }
						}, 60);
					}
				}, 100);
			},
			on_mouse_lbtn_dblclk: function () {
				if ([buttonStates.down, buttonStates.hover].includes(this.state)) { fb.Volume = 0;}
			}
		}
	}),
	'Volume display': new ThemedButton({
		coordinates: { x: 0, y: 0, w: _gr.CalcTextWidth(newButtonsProperties.voldB[1] ? ' -100 dB ' : ' 100 ', _gdiFont(globFonts.button.name, globFonts.button.size * buttonsBar.config.scale)) + 8 * _scale(1, false) / _scale(buttonsBar.config.scale), h: 22 },
		text: function () { return this.volumeFunc(); },
		func: function (mask) {
			if (mask === MK_SHIFT) {
				settingsMenu(
					this, true, ['buttons_display_volume.js'], void (0),
					{
						voldB:
							(value) => {
								this.adjustButtonWidth(value ? ' -100 dB ' : ' 100 ', 8 * _scale(1, false) / _scale(buttonsBar.config.scale));
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
			let info = 'Current volume: ' + fb.Volume.toFixed(2) + ' dB';
			if (bShift || bInfo) {
				info += '\n-----------------------------------------------------';
				info += '\n(Shift + L. Click to open config menu)';
			}
			return info;
		},
		prefix, buttonsProperties: newButtonsProperties,
		variables: {
			volumeFunc: function () {
				return this.buttonsProperties.voldB[1]
					? fb.Volume.toFixed(0) + ' dB'
					: (100 + fb.Volume).toFixed(0);
			},
			inputFunc: () => '|',
			getVolume: (parent, v) => {
				v = v.replace(/[-db |]/gi, '');
				return Math.max(0, Math.min(Number(v), 100));
			},
			restoreDisplay: function () {
				this.isInput = false;
				this.text = this.volumeFunc;
			},
			startInput: function () {
				this.isInput = true;
				this.text = this.inputFunc;
				this.setTimeout();
				this.inputInterval = setInterval(() => {
					this.text = this.text === this.inputFunc ? ' ' : this.inputFunc;
					this.repaint();
				}, 400);
			},
			applyInput: function () {
				this.clearTimeout();
				if (isFunction(this.text)) { return; }
				const volume = this.getVolume(this.text);
				this.restoreDisplay();
				fb.Volume = this.buttonsProperties.voldB[1]
					? -volume
					: volume - 100;
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
			on_volume_change: function () { this.repaint(); },
			on_key_up: function (parent, vkey) {
				if (this.isInput && vkey === VK_RETURN) { this.applyInput(); }
			},
			on_char: function (parent, code) {
				if (this.isInput) {
					const char = String.fromCharCode(code);
					if (/\d/.test(char)) {
						if (isFunction(this.text)) { this.text = ''; }
						const volume = this.getVolume(this.text + '' + char);
						this.text = this.buttonsProperties.voldB[1]
							? '-' + volume.toFixed(0) + '| dB'
							: volume.toFixed(0) + '|';
						this.repaint();
						if (volume === 100 || volume === 0) { this.abortInput(); }
						else {
							this.clearTimeout();
							this.setTimeout();
							this.inputInterval = setInterval(() => {
								this.text = this.text.includes('|')
									? this.text.replace(/\|/gi,'')
									: this.text.replace(/(\d+)/, '$1|');
								this.repaint();
							}, 400);
						}
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