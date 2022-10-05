'use strict';
//03/10/22

include('..\\helpers\\helpers_xxx.js');
include('..\\helpers\\callbacks_xxx.js');

const onMainMenuEntries = [
	{name: 'Add SKIP Tag at current playback', funcName: 'skipTagFromPlayback', path: folders.xxx + 'main\\skip_tag_from_playback.js', icon: 'ui-icon ui-icon-tag'},
	{name: 'Execute menu entry by name', funcName: 'executeByName' , path: '', icon: 'ui-icon ui-icon-star'}
];

const onMainMenuDynamicEntries = [];

function deleteMainMenuDynamic() {
	onMainMenuDynamicEntries.forEach((_, i) => {fb.UnregisterMainMenuCommand(i)});
	onMainMenuDynamicEntries.splice(0, onMainMenuDynamicEntries.length);
}

// Callback
addEventListener('on_main_menu_dynamic', (idx) => {
	if (idx < onMainMenuDynamicEntries.length) {
		const entry = onMainMenuDynamicEntries[idx];
		if (entry.onMainMenuEntries) {
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
		} else {
			try {menu.btn_up(void(0), void(0), void(0), entry.name);}
			catch (e) {console.log('Error evaluating: ' + entry.name + '.');}
		}
	}
});

addEventListener('on_script_unload', () => {
	deleteMainMenuDynamic();
});