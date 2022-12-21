'use strict';
//19/12/22

/* 
	-> EDIT
 */
 
include('..\\helpers\\buttons_xxx.js');
include('..\\main\\tags\\save_tags.js');
include('..\\helpers\\helpers_xxx_properties.js');
 
try {window.DefinePanel('Save tags button', {author:'xxx'});} catch (e) {/* console.log('Sace Tags Buttons loaded.'); */} //May be loaded along other buttons

buttonsBar.list.push({});

addButton({
	'Save tags': new themedButton({x: 0, y: 0, w: 98, h: 22}, 'Save tags', function () {
		const readmePath = folders.xxx + 'helpers\\readme\\save_tags.txt';
		const readme = _open(readmePath, utf8);
		if (readme.length) {fb.ShowPopupMessage(readme, 'Save tags and comparison');}
		let file;
		try {file = utils.InputBox(window.ID, 'Path to save tags file:', 'Tags file', folders.data + 'tags.json', true);}
		catch (e) {return;}
		if (!file.length) {return;}
		saveTags({file});
	}, null, void(0),'Save all tags from selected tracks to json', void(0), void(0), chars.save),
	'Compare tags': new themedButton({x: 0, y: 0, w: 98, h: 22}, 'Compare', function () {
		let file;
		try {file = utils.InputBox(window.ID, 'Path to tags file to load:', 'Tags file', folders.data + 'tags.json', true);}
		catch (e) {return;}
		if (!file.length) {return;}
		const toTags =  _jsonParseFileCheck(file, 'Tags file', 'Save tags', utf8);
		if (!toTags || !toTags.length) {return;}
		let toTagsFolder;
		try {toTagsFolder = utils.InputBox(window.ID, 'Root path of the original file tracks:', 'Original root path', toTags[0].rawPath.replace('file://', '').split('\\')[0] + '\\', true);}
		catch (e) {return;}
		if (!toTagsFolder.length) {return;}
		let selItemsFolder;
		try {selItemsFolder = utils.InputBox(window.ID, 'Root path of the current tracks:', 'Current root path', toTagsFolder, true);}
		catch (e) {return;}
		if (!selItemsFolder.length) {return;}
		compareTags({toTags, toTagsFolder, selItemsFolder});
	}, null, void(0),'Compares all tags from selected tracks with tags from a json file\nFor backup comparison purporse or to copy tags between libraries.', void(0), void(0), chars.exchange),
});