'use strict';
//08/02/23

/* 
	Playlist Tools Menu
	-------------------
	Merges different playlist tools in one menu, called when pressing the button.
	If any script or plugin is missing, then the menu gets created without those entries.
	So the menu is created dynamically according to the foobar user's config.

	NOTE: 'on_mouse_lbtn_up(x, y)' is simply replaced with a button to call the menu.
 */

try {include('..\\helpers\\buttons_xxx.js');} catch (e) {include('helpers\\buttons_xxx.js');}
try {window.DefineScript('Playlist Tools: Button', {author:'XXX', version: '3.0.0-beta.16', features: {drag_n_drop: false}});} catch (e) {/* console.log('Playlist Tools Menu Button loaded.'); */} //May be loaded along other buttons

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
	'Playlist Tools': new themedButton({x: 0, y: 0, w: 98, h: 22}, 'Playlist Tools', function (mask) {
		if (!defaultArgs.parent) {defaultArgs.parent = this;} // Register this button as parent
		if (mask === MK_SHIFT) { // Enable/disable menus
			menuAlt.btn_up(this.currX, this.currY + this.currH);
		} else if (mask === MK_CONTROL) { // Simulate menus to get names
			menu.btn_up(this.currX, this.currY + this.currH, void(0), void(0), false, _setClipboardData);
		} else { // Standard use
			menu.btn_up(this.currX, this.currY + this.currH);
		}
	}, null, void(0), menuTooltip, prefix, newButtonsProperties, chars.wrench),
});