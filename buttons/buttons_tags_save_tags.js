'use strict';
//30/12/23

/*
	-> EDIT
 */

include('..\\helpers\\helpers_xxx.js');
/* global globFonts:readable, folders:readable */
include('..\\helpers\\buttons_xxx.js');
/* global getButtonVersion:readable, getUniquePrefix:readable, buttonsBar:readable, addButton:readable, themedButton:readable */
include('..\\helpers\\helpers_xxx_file.js');
/* global _open:readable, utf8:readable, _jsonParseFileCheck:readable */
include('..\\helpers\\helpers_xxx_prototypes.js');
/* global isBoolean:readable */
include('..\\helpers\\helpers_xxx_UI.js');
/* global _gdiFont:readable, _gr:readable, _scale:readable, chars:readable */
include('..\\helpers\\helpers_xxx_properties.js');
/* global setProperties:readable, getPropertiesPairs:readable */
include('..\\main\\tags\\save_tags.js');
/* global saveTags:readable, compareTags:readable */

var prefix = 'st_'; // NOSONAR[global]
var version = getButtonVersion('Playlist-Tools-SMP'); // NOSONAR[global]

try { window.DefineScript('Save tags button', { author: 'regorxxx', version, features: { drag_n_drop: false } }); } catch (e) { /* May be loaded along other buttons */ }

prefix = getUniquePrefix(prefix, ''); // Puts new ID before '_'
var newButtonsProperties = { // NOSONAR[global]
	bIconMode: ['Icon-only mode?', false, { func: isBoolean }, false]
};
setProperties(newButtonsProperties, prefix, 0); //This sets all the panel properties at once
newButtonsProperties = getPropertiesPairs(newButtonsProperties, prefix, 0);
buttonsBar.list.push(newButtonsProperties);

addButton({
	'Save tags': new themedButton({ x: 0, y: 0, w: _gr.CalcTextWidth('Save tags', _gdiFont(globFonts.button.name, globFonts.button.size * buttonsBar.config.scale)) + 25 * _scale(1, false) / _scale(buttonsBar.config.scale), h: 22 }, 'Save tags', function () {
		const readmePath = folders.xxx + 'helpers\\readme\\save_tags.txt';
		const readme = _open(readmePath, utf8);
		if (readme.length) { fb.ShowPopupMessage(readme, 'Save tags and comparison'); }
		let file;
		try { file = utils.InputBox(window.ID, 'Path to save tags file:', 'Tags file', folders.data + 'tags.json', true); }
		catch (e) { return; }
		if (!file.length) { return; }
		saveTags({ file });
	}, null, void (0), 'Save all tags from selected tracks to json', prefix, newButtonsProperties, chars.save),
	'Compare tags': new themedButton({ x: 0, y: 0, w: _gr.CalcTextWidth('Compare tags', _gdiFont(globFonts.button.name, globFonts.button.size * buttonsBar.config.scale)) + 25 * _scale(1, false) / _scale(buttonsBar.config.scale), h: 22 }, 'Compare tags', function () {
		let file;
		try { file = utils.InputBox(window.ID, 'Path to tags file to load:', 'Tags file', folders.data + 'tags.json', true); }
		catch (e) { return; }
		if (!file.length) { return; }
		const toTags = _jsonParseFileCheck(file, 'Tags file', 'Save tags', utf8);
		if (!toTags || !toTags.length) { return; }
		let toTagsFolder;
		try { toTagsFolder = utils.InputBox(window.ID, 'Root path of the original file tracks:', 'Original root path', toTags[0].rawPath.replace('file://', '').split('\\')[0] + '\\', true); }
		catch (e) { return; }
		if (!toTagsFolder.length) { return; }
		let selItemsFolder;
		try { selItemsFolder = utils.InputBox(window.ID, 'Root path of the current tracks:', 'Current root path', toTagsFolder, true); }
		catch (e) { return; }
		if (!selItemsFolder.length) { return; }
		compareTags({ toTags, toTagsFolder, selItemsFolder });
	}, null, void (0), 'Compares all tags from selected tracks with tags from a json file\nFor backup comparison purporse or to copy tags between libraries.', prefix, newButtonsProperties, chars.exchange, void (0), void (0), void (0), void (0), { scriptName: 'Playlist-Tools-SMP', version }),
});