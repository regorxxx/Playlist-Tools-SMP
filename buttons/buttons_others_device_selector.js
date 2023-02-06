'use strict';
//06/02/23

/* 
	Output device selector
	----------------
	Auto-switch according to device priority
 */

include('..\\helpers\\buttons_xxx.js'); 
include('..\\helpers\\helpers_xxx.js');
include('..\\helpers\\helpers_xxx_file.js');
include('..\\helpers\\menu_xxx.js');

try {window.DefineScript('Output device selector button', {author:'XXX', version: '1.1.0', features: {drag_n_drop: false}});} catch (e) {/* console.log('Output device selector Button loaded.'); */} //May be loaded along other buttons

checkCompatible('1.6.1', 'smp');
checkCompatible('1.4.0', 'fb');

buttonsBar.list.push({});

addButton({
	'Output device selector': new themedButton({x: 0, y: 0, w: 78, h: 22}, 'Devices', function () {
		const menu = new _menu();
		menu.newEntry({entryText: 'Select output:', func: null, flags: MF_GRAYED});
		menu.newEntry({entryText: 'sep'});
		const devices = JSON.parse(fb.GetOutputDevices()); // Reformat with tabs
		const menuName = menu.getMainMenuName;
		devices.forEach((device) => {
			let name = device.name || '';
			name = name ? name.replace('DS : ', '').replace('ASIO : ', '').replace('Default : ', '') : '- no name -';
			menu.newEntry({menuName, entryText: name , func: () => {
				fb.SetOutputDevice(device.output_id, device.device_id);
			}});
			menu.newCheckMenu(menuName, name, void(0), () => {return device.active;});
		});
		menu.btn_up(this.currX, this.currY + this.currH);
	}, null, void(0), (parent) => {
		const devices = JSON.parse(fb.GetOutputDevices());
		const currDevice = devices.find((device) => {return device.active;});
		const currDeviceName = currDevice ? currDevice.name : '';
		let info = 'Select output device:';
		info += '\nDevice:\t' + currDeviceName.replace('DS : ', '').replace('ASIO : ', '').replace('Default : ', '');
		// const bShift = utils.IsKeyPressed(VK_SHIFT);
		// const bInfo = typeof menu_panelProperties === 'undefined' || menu_panelProperties.bTooltipInfo[1];
		// if (bShift || bInfo) {
			// info += '\n-----------------------------------------------------';
			// info += '\n(Shift + L. Click to open config menu)';
		// }
		return info;
	}, void(0), void(0), chars.speaker),
});