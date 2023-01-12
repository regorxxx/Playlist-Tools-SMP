﻿'use strict';
//12/01/23

include('..\\..\\helpers\\helpers_xxx.js');
include('..\\..\\helpers\\callbacks_xxx.js');

const onMainMenuEntries = [
	// {name: 'Add SKIP Tag at current playback', funcName: 'skipTagFromPlayback', path: folders.xxx + 'main\\tags\\skip_tag_from_playback.js', icon: 'ui-icon ui-icon-tag'},
	// {name: 'Execute menu entry by name', funcName: 'executeByName' , path: '', icon: 'ui-icon ui-icon-star'}
];

const onMainMenuDynamicEntries = [];

function deleteMainMenuDynamic(parent) {
	onMainMenuDynamicEntries.forEach((_, i) => {
		if (typeof parent === 'undefined' || _.parent === parent) {
			fb.UnregisterMainMenuCommand(i);
		}
	});
	if (typeof parent === 'undefined') {onMainMenuDynamicEntries.splice(0, onMainMenuDynamicEntries.length);}
	else {
		const idx = [];
		for (let i = 0; i < onMainMenuDynamicEntries.length; i++) {
			if (onMainMenuDynamicEntries[i].parent === parent) {idx.push(i);}
		}
		if (idx.length) {
			idx.reverse().forEach(i => onMainMenuDynamicEntries.splice(i, 1));
		}
	}
}

function bindDynamicMenus({
	menu,  /* createFpMenuLeft.bind({buttonsProperties: ppt, prefix: ''})*/
	parentName = window.Name,
	withFlag = true,
	entryCallback = void(0), /* return entry name */
	descrCallback = void(0) /* return entry description */
} = {}) {
	callbacksListener.checkPanelNames();
	if (!menu) {throw 'No parentMenu';}
	const menuSimul = menu(true);
	const mainMenu = menuSimul.getMainMenuName();
	menuSimul.getEntries().forEach((entry, index) => {
		if (entry && (!withFlag || (entry.data && entry.data.bDynamicMenu))) {
			let name = (entry.menuName === mainMenu ? '' : entry.menuName  + '\\') + entry.entryText.replace(/\t.*/, '');
			const idx = onMainMenuDynamicEntries.push({name, parent: parentName, parentMenu: menu}) - 1;
			name = entryCallback ? entryCallback(entry, index) : entry.entryText.replace(/\t.*/, '').replace(/&&/g, '&');
			const descr = descrCallback ? descrCallback(entry, index) : entry.entryText.replace(/\t.*/, '').replace(/&&/g, '&');
			fb.RegisterMainMenuCommand(idx, name, descr);
		}
	});
}

// Callback
addEventListener('on_main_menu_dynamic', (idx) => {
	if (idx < onMainMenuDynamicEntries.length) {
		const entry = onMainMenuDynamicEntries[idx];
		if (entry.onMainMenuEntries) {
			console.log('SMP main menu ' + (idx + 1) + ': ' + entry.name);
			if (entry.hasOwnProperty('path')) {
				if (entry.path.length) {
					try {include(entry.path.replace(folders.xxx  + 'main\\', '..\\'));}
					catch (e) {console.popup(e.message.split('\n').join('\n\t '), 'SMP Dynamic menu');}
					entry.path = '';
				}
				try {eval(entry.funcName)();} 
				catch (e) {console.popup('Error evaluating: ' + entry.funcName + ' from script (' + (entry.path.length ? entry.path : 'parent') + ').', 'SMP Dynamic menu');}
			} else if (entry.hasOwnProperty('menuName')) {
				try {eval(entry.menuName).btn_up(void(0), void(0), void(0), entry.funcName);} 
				catch (e) {console.popup('Error evaluating: ' + entry.funcName + ' from menu (' + entry.menuName + ').', 'SMP Dynamic menu');}
			}
		} else {
			if (entry.hasOwnProperty('parentMenu') && entry.parentMenu) { // Other buttons
				try {entry.parentMenu().btn_up(void(0), void(0), void(0), entry.name);}
				catch (e) {console.popup('Error evaluating: ' + entry.name + '.', 'SMP Dynamic menu');}
			} else { // Playlist Tools
				try {menu.btn_up(void(0), void(0), void(0), entry.name);}
				catch (e) {console.popup('Error evaluating: ' + entry.name + '.', 'SMP Dynamic menu');}
			}
		}
	}
});

addEventListener('on_script_unload', () => {
	deleteMainMenuDynamic();
});