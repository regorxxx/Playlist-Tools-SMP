'use strict';
//13/10/21

include('..\\helpers\\helpers_xxx.js');

const onMainMenuEntries = {
	'1': {name: 'Add skip Tag at current playback', funcName: 'skipTagFromPlayback', path: folders.xxx + 'main\\skip_tag_from_playback.js', icon: 'ui-icon ui-icon-tag'},
	'2': {name: 'Pools Top Tracks Mix', funcName: 'Pools\\Top tracks mix', menuName: 'menu', icon: 'ui-icon ui-icon-circle-zoomout'},
};

const onMainMenuDynamicEntries = [];

function deleteMainMenuDynamic() {
	onMainMenuDynamicEntries.forEach((_, i) => {fb.UnregisterMainMenuCommand(i)});
	onMainMenuDynamicEntries.splice(0, onMainMenuDynamicEntries.length);
}

// Callback
// Meant to replace any other
function on_main_menu(idx) {
    if (onMainMenuEntries.hasOwnProperty(idx)) {
		const entry = onMainMenuEntries[idx];
		console.log('SMP main menu ' + idx + ': ' + entry.name);
		if (entry.hasOwnProperty('path')) {
			if (entry.path.length) {
				include(entry.path);
				entry.path = '';
			}
			try {eval(entry.funcName)();} 
			catch (e) {console.log('Error evaluating: ' + entry.funcName + ' from script (' + (entry.path.length ? entry.path : 'parent') + ').');}
		} else if (entry.hasOwnProperty('menuName')) {
			try {eval(entry.menuName).btn_up(void(0), void(0), void(0), entry.funcName);} 
			catch (e) {console.log('Error evaluating: ' + entry.funcName + ' from menu (' + entry.menuName + ').');}
		}
	}
}

function on_main_menu_dynamic(idx) {
	if (idx < onMainMenuDynamicEntries.length) {
		const entry = onMainMenuDynamicEntries[idx];
		try {menu.btn_up(void(0), void(0), void(0), entry.name);}
		catch (e) {console.log('Error evaluating: ' + entry.name + '.');}
	}
}