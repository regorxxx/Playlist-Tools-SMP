'use strict';
//15/11/23

/* 
	Playlist Tools Menu
	-------------------
	Merges different playlist tools in one menu, called when pressing the button.
	If any script or plugin is missing, then the menu gets created without those entries.
	So the menu is created dynamically according to the foobar2000 user's config.

	NOTE: 'on_mouse_lbtn_up(x, y)' is simply replaced with a button to call the menu.
 */
 
var version = window.ScriptInfo.Version || utils.ReadTextFile(folders.xxx + 'buttons_toolbar.js', 65001).match(/var version = '(.*)'/mi)[1] || 'x.x.x';

try {include('..\\helpers\\buttons_xxx.js');} catch (e) {include('helpers\\buttons_xxx.js');}
try {window.DefineScript('Playlist Tools: Button', {author:'regorxxx', version, features: {drag_n_drop: false}});} catch (e) {/* console.log('Playlist Tools Menu Button loaded.'); */} //May be loaded along other buttons

{
	const dependencies = [
		'helpers\\helpers_xxx_properties.js',
		'helpers\\helpers_xxx_clipboard.js',
		'main\\playlist_tools\\playlist_tools_menu.js'];
	let bIncludeRel = true;
	try {include('..\\helpers\\helpers_xxx_dummy.js');} catch(e) {bIncludeRel = false;}
	if (bIncludeRel) {dependencies.forEach((file) => {include('..\\' + file);});}
	else {dependencies.forEach((file) => {include(file);});}
}

var prefix = menu_prefix;
prefix = getUniquePrefix(prefix, ''); // Puts new ID before '_'
menu_prefix = prefix; // update var for internal use of playlist_tools_menu

var newButtonsProperties = {
	...menu_properties,
	bIconMode:		['Icon-only mode?', false, {func: isBoolean}, false]
};

{
	setProperties(newButtonsProperties, prefix, 0); // This sets all the panel properties at once
	const properties = getPropertiesPairs(newButtonsProperties, prefix, 0);
	updateMenuProperties(properties); // Update manually the default args
	buttonsBar.list.push({...properties, ...getPropertiesPairs(menu_panelProperties, menu_prefix_panel, 0)});
	if (typeof updateCache !== 'undefined') {
		// Update cache with user set tags
		doOnce('Update SBD cache', debounce(updateCache, 3000))({properties});
	}
	newButtonsProperties = properties;
}

addButton({
	'Playlist Tools': new themedButton({x: 0, y: 0, w: _gr.CalcTextWidth('Playlist Tools', _gdiFont(globFonts.button.name, globFonts.button.size * buttonsBar.config.scale)) + 25 * _scale(1, false) /_scale(buttonsBar.config.scale), h: 22}, 'Playlist Tools', function (mask) {
		if (!defaultArgs.parent) {defaultArgs.parent = this;} // Register this button as parent
		if (mask === MK_SHIFT) { // Enable/disable menus
			menuAlt.btn_up(this.currX, this.currY + this.currH);
		} else if (mask === MK_CONTROL) { // Simulate menus to get names
			menu.btn_up(this.currX, this.currY + this.currH, void(0), void(0), false, (val) => {console.log('Called: ' + val); _setClipboardData(val);});
		} else { // Standard use
			menu.btn_up(this.currX, this.currY + this.currH);
		}
	}, null, void(0), menuTooltip, prefix, newButtonsProperties, chars.wrench, void(0), void(0), void(0), void(0), {scriptName: 'Playlist-Tools-SMP', version}),
});