'use strict';
//21/03/24

/* exported onMainMenuEntries, bindDynamicMenus */

/* global menu:readable */
include('..\\..\\helpers\\helpers_xxx.js');
/* global folders:readable */
include('..\\..\\helpers\\callbacks_xxx.js');
/* global callbacksListener:readable */

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
			idx.reverse().forEach(i => onMainMenuDynamicEntries.splice(i, 1)); // NOSONAR
		}
	}
}

function bindDynamicMenus({
	menu,  /* createFpMenuLeft.bind({buttonsProperties: ppt, prefix: ''})*/
	parentName = window.Name,
	withFlag = true, /* execute only menu entries with bDynamicMenu flag set */
	args = null, /* pass args object to menu func */
	entryCallback = void(0), /* return entry name */
	descrCallback = void(0) /* return entry description */
} = {}) {
	callbacksListener.checkPanelNames();
	if (!menu) {throw new Error('No parentMenu');}
	const menuSimul = menu({bSimulate: true});
	const mainMenu = menuSimul.getMainMenuName();
	menuSimul.getEntries().forEach((entry, index) => {
		if (entry && (!withFlag || (entry.data && entry.data.bDynamicMenu))) {
			let name = (entry.menuName === mainMenu ? '' : entry.menuName  + '\\') + entry.entryText.replace(/\t.*/, '');
			const idx = onMainMenuDynamicEntries.push({name, parent: parentName, parentMenu: menu, args}) - 1;
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
			if (Object.hasOwn(entry, 'path')) {
				if (entry.path.length) {
					try {include(entry.path.replace('.\\', folders.xxx));}
					catch (e) {console.popup(e.message.split(/\r\n|\n\r|\n|\r/).join('\n\t '), 'SMP Dynamic menu');}
					entry.path = '';
				}
				try {eval(entry.funcName)();}
				catch (e) {console.popup('Error evaluating: ' + entry.funcName + ' from script (' + (entry.path.length ? entry.path : 'parent') + ').', 'SMP Dynamic menu');}
			} else if (Object.hasOwn(entry, 'menuName')) {
				try {eval(entry.menuName).btn_up(void(0), void(0), void(0), entry.funcName);}
				catch (e) {console.popup('Error evaluating: ' + entry.funcName + ' from menu (' + entry.menuName + ').', 'SMP Dynamic menu');}
			}
		} else {
			const isFunction = (obj) => !!(obj && obj.constructor && obj.call && obj.apply);
			const name = isFunction(entry.name) ? entry.name() : entry.name;
			if (Object.hasOwn(entry, 'parentMenu') && entry.parentMenu) { // Other buttons
				try {
					(entry.args ? entry.parentMenu(entry.args) : entry.parentMenu()).btn_up(void(0), void(0), void(0), name);
				} catch (e) {console.popup('Error evaluating: ' + name + '.', 'SMP Dynamic menu');}
			} else { // Playlist Tools
				try {menu.btn_up(void(0), void(0), void(0), name);}
				catch (e) {console.popup('Error evaluating: ' + name + '.', 'SMP Dynamic menu');}
			}
		}
	}
});

addEventListener('on_script_unload', () => {
	deleteMainMenuDynamic();
});