'use strict';
//12/05/25

/*
	-> EDIT
 */

include('..\\helpers\\helpers_xxx.js');
/* global globFonts:readable, folders:readable */
include('..\\helpers\\buttons_xxx.js');
/* global getButtonVersion:readable, getUniquePrefix:readable, buttonsBar:readable, addButton:readable, ThemedButton:readable */
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

try { window.DefineScript('Save tags button', { author: 'regorxxx', version, features: { drag_n_drop: false } }); } catch (e) { /* May be loaded along other buttons */ } // eslint-disable-line no-unused-vars

prefix = getUniquePrefix(prefix, ''); // Puts new ID before '_'
var newButtonsProperties = { // NOSONAR[global]
	bIconMode: ['Icon-only mode', false, { func: isBoolean }, false]
};
setProperties(newButtonsProperties, prefix, 0); //This sets all the panel properties at once
newButtonsProperties = getPropertiesPairs(newButtonsProperties, prefix, 0);
buttonsBar.list.push(newButtonsProperties);

addButton({
	'Save tags': new ThemedButton({
		coordinates: { x: 0, y: 0, w: _gr.CalcTextWidth('Save tags', _gdiFont(globFonts.button.name, globFonts.button.size * buttonsBar.config.scale)) + 25 * _scale(1, false) / _scale(buttonsBar.config.scale), h: 22 },
		text: 'Save tags',
		func: function () {
			const readmePath = folders.xxx + 'helpers\\readme\\save_tags.txt';
			const readme = _open(readmePath, utf8);
			if (readme.length) { fb.ShowPopupMessage(readme, 'Save tags and comparison'); }
			let file;
			try { file = utils.InputBox(window.ID, 'Path to save JSON tags file:', 'Tags file', folders.data + 'tags.json', true); }
			catch (e) { return; } // eslint-disable-line no-unused-vars
			if (!file.length) { return; }
			saveTags({ file });
		},
		description: 'Save all tags from selected tracks to json.',
		prefix, buttonsProperties: newButtonsProperties,
		icon: chars.save
	}),
	'Compare tags': new ThemedButton({
		coordinates: { x: 0, y: 0, w: _gr.CalcTextWidth('Compare tags', _gdiFont(globFonts.button.name, globFonts.button.size * buttonsBar.config.scale)) + 25 * _scale(1, false) / _scale(buttonsBar.config.scale), h: 22 },
		text: 'Compare tags',
		func: function () {
			let file;
			try { file = utils.InputBox(window.ID, 'JSON tags file to load:', 'Tags file', folders.data + 'tags.json', true); }
			catch (e) { return; } // eslint-disable-line no-unused-vars
			if (!file.length) { return; }
			const toTags = _jsonParseFileCheck(file, 'Tags file', 'Save tags', utf8);
			if (!toTags || !toTags.length) { return; }
			let toTagsFolder;
			try { toTagsFolder = utils.InputBox(window.ID, 'Root of the source tracks:', 'Original root path', toTags[0].rawPath.replace(/^file(-relative)?:\/\//i, '').split('\\')[0] + '\\', true); }
			catch (e) { return; } // eslint-disable-line no-unused-vars
			if (!toTagsFolder.length) { return; }
			let selItemsFolder;
			try { selItemsFolder = utils.InputBox(window.ID, 'Root of the destination tracks:', 'Current root path', toTagsFolder, true); }
			catch (e) { return; } // eslint-disable-line no-unused-vars
			if (!selItemsFolder.length) { return; }
			compareTags({ toTags, toTagsFolder, selItemsFolder });
		},
		description: 'Compare all tags from selected tracks with tags from a JSON file.\nFor backup comparison or to copy tags between libraries.',
		prefix, buttonsProperties: newButtonsProperties,
		icon: chars.exchange,
		update: { scriptName: 'Playlist-Tools-SMP', version }
	}),
});