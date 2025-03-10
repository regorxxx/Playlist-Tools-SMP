﻿'use strict';
//08/03/25

/*
	Output device selector
	----------------
	Auto-switch according to device priority
 */

include('..\\helpers\\helpers_xxx.js');
/* global globFonts:readable, checkCompatible:readable, VK_RETURN:readable, FontStyle:readable */
include('..\\helpers\\buttons_xxx.js');
/* global getUniquePrefix:readable, buttonsBar:readable, addButton:readable, ThemedButton:readable, getButtonVersion:readable, buttonStates:readable */
include('..\\helpers\\helpers_xxx_prototypes.js');
/* global isFunction:readable */
include('..\\helpers\\helpers_xxx_UI.js');
/* global _gdiFont:readable, _gr:readable, _scale:readable, chars:readable */
include('..\\helpers\\helpers_xxx_properties.js');
/* global setProperties:readable, getPropertiesPairs:readable */

var prefix = 'ds'; // NOSONAR[global]
var version = getButtonVersion('Playlist-Tools-SMP'); // NOSONAR[global]

try { window.DefineScript('Volume control button', { author: 'regorxxx', version, features: { drag_n_drop: false } }); } catch (e) { /* May be loaded along other buttons */ }

checkCompatible('1.6.1', 'smp');
checkCompatible('1.4.0', 'fb');

prefix = getUniquePrefix(prefix, ''); // Puts new ID before '_'
var newButtonsProperties = { // NOSONAR[global]
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
	}),
	'Volume control down': new ThemedButton({
		coordinates: { x: 0, y: 0, w: 0, h: 22 },
		func: function () {
			fb.VolumeDown();
		},
		description: () => 'Volume down',
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
			}
		}
	}),
	'Volume control up': new ThemedButton({
		coordinates: { x: 0, y: 0, w: 0, h: 22 },
		func: function () {
			fb.VolumeUp();
		},
		description: () => 'Volume up',
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
			}
		}
	}),
	'Volume display': new ThemedButton({
		coordinates: { x: 0, y: 0, w: _gr.CalcTextWidth('100', _gdiFont(globFonts.button.name, globFonts.button.size * buttonsBar.config.scale)) + 8 * _scale(1, false) / _scale(buttonsBar.config.scale), h: 22 },
		text: () => (100 + fb.Volume).toFixed(0),
		func: function () {
			if (!this.isInput) { this.startInput(); }
			else { this.applyInput(); }
		},
		gFont: _gdiFont(globFonts.button.name, globFonts.button.size * 1.2 * buttonsBar.config.textScale, FontStyle.Bold),
		description: () => 'Current volume: ' + fb.Volume.toFixed(2) + ' dB',
		prefix, buttonsProperties: newButtonsProperties,
		variables: {
			volumeFunc: () => (100 + fb.Volume).toFixed(0),
			inputFunc: () => '|',
			getVolume: (parent, v) => Math.max(0, Math.min(Number(v), 100)),
			startInput: function () {
				this.isInput = true;
				this.text = this.inputFunc;
				this.setTimeout();
			},
			applyInput: function () {
				this.clearTimeout();
				if (isFunction(this.text)) { return; }
				const volume = this.getVolume(this.text);
				this.isInput = false;
				this.text = this.volumeFunc;
				fb.Volume = volume - 100;
			},
			abortInput: function () {
				if (isFunction(this.text)) { this.isInput = false; return; }
				else if (this.text.length) { this.applyInput(); }
			},
			inputTimeout: null,
			setTimeout: function () {
				this.inputTimeout = setTimeout(() => this.isInput && this.abortInput(), 2000);
			},
			clearTimeout: function () {
				if (this.inputTimeout) { clearTimeout(this.inputTimeout); this.inputTimeout = null; }
			}
		},
		listener: {
			on_volume_change: () => window.Repaint(),
			on_key_up: function (parent, vkey) {
				if (this.isInput && vkey === VK_RETURN) { this.applyInput(); }
			},
			on_char: function (parent, code) {
				if (this.isInput) {
					const char = String.fromCharCode(code);
					if (/\d/.test(char)) {
						if (isFunction(this.text)) { this.text = ''; }
						const volume = this.getVolume(this.text + '' + String.fromCharCode(code));
						this.text = volume.toFixed(0);
						if (volume === 100 || volume === 0) { this.abortInput(); }
						else {
							window.Repaint();
							this.clearTimeout();
							this.setTimeout();
						}
					}
				}
			}
		},
		update: { scriptName: 'Playlist-Tools-SMP', version }
	}),
});