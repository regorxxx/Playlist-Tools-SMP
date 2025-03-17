'use strict';
//17/03/25

/*
	Output device selector
	----------------
	Auto-switch according to device priority
 */

include('..\\helpers\\helpers_xxx.js');
/* global globFonts:readable, MF_GRAYED:readable, checkCompatible:readable */
include('..\\helpers\\buttons_xxx.js');
/* global getUniquePrefix:readable, buttonsBar:readable, addButton:readable, ThemedButton:readable, getButtonVersion:readable */
include('..\\helpers\\menu_xxx.js');
/* global _menu:readable  */
include('..\\helpers\\helpers_xxx_prototypes.js');
/* global isBoolean:readable */
include('..\\helpers\\helpers_xxx_UI.js');
/* global _gdiFont:readable, _gr:readable, _scale:readable, chars:readable */
include('..\\helpers\\helpers_xxx_properties.js');
/* global setProperties:readable, getPropertiesPairs:readable */

var prefix = 'ds'; // NOSONAR[global]
var version = getButtonVersion('Playlist-Tools-SMP'); // NOSONAR[global]

try { window.DefineScript('Output device switcher button', { author: 'regorxxx', version, features: { drag_n_drop: false } }); } catch (e) { /* May be loaded along other buttons */ } // eslint-disable-line no-unused-vars

checkCompatible('1.6.1', 'smp');
checkCompatible('1.4.0', 'fb');

prefix = getUniquePrefix(prefix, ''); // Puts new ID before '_'
var newButtonsProperties = { // NOSONAR[global]
	bIconMode: ['Icon-only mode', false, { func: isBoolean }, false]
};
setProperties(newButtonsProperties, prefix, 0); //This sets all the panel properties at once
newButtonsProperties = getPropertiesPairs(newButtonsProperties, prefix, 0);
buttonsBar.list.push(newButtonsProperties);

addButton({
	'Output device switcher': new ThemedButton({
		coordinates: { x: 0, y: 0, w: _gr.CalcTextWidth('Devices', _gdiFont(globFonts.button.name, globFonts.button.size * buttonsBar.config.scale)) + 30 * _scale(1, false) / _scale(buttonsBar.config.scale), h: 22 },
		text: 'Devices',
		func: function () {
			const menu = new _menu();
			menu.newEntry({ entryText: 'Select output:', func: null, flags: MF_GRAYED });
			menu.newSeparator();
			const devices = JSON.parse(fb.GetOutputDevices()); // Reformat with tabs
			const menuName = menu.getMainMenuName;
			devices.forEach((device) => {
				let name = device.name || '';
				name = name ? name.replace('DS : ', '').replace('ASIO : ', '').replace('Default : ', '') : '- no name -';
				menu.newEntry({
					menuName, entryText: name, func: () => {
						fb.SetOutputDevice(device.output_id, device.device_id);
					}
				});
				menu.newCheckMenu(menuName, name, void (0), () => { return device.active; });
			});
			menu.btn_up(this.currX, this.currY + this.currH);
		},
		description: function () {
			const devices = JSON.parse(fb.GetOutputDevices());
			const currDevice = devices.find((device) => { return device.active; });
			const currDeviceName = currDevice ? currDevice.name : '';
			let info = 'Select output device:';
			info += '\nDevice:\t' + currDeviceName.replace('DS : ', '').replace('ASIO : ', '').replace('Default : ', '');
			return info;
		},
		prefix, buttonsProperties: newButtonsProperties,
		icon: chars.speaker,
		update: { scriptName: 'Playlist-Tools-SMP', version }
	}),
});