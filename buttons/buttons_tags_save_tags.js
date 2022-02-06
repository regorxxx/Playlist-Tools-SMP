'use strict';
//03/02/22

/* 
	-> EDIT
 */
 
include('..\\helpers\\buttons_xxx.js');
include('..\\main\\save_tags.js');
include('..\\helpers\\helpers_xxx_properties.js');
 
try { //May be loaded along other buttons
	window.DefinePanel('Save tags button', {author:'xxx'});
	var g_font = _gdiFont('Segoe UI', 12);
	var buttonCoordinates = {x: 0, y: 0, w: 98, h: 22};
} catch (e) {
	buttonCoordinates = {x: 0, y: 0, w: buttonsBar.config.buttonOrientation === 'x' ? 98 : buttonCoordinates.w , h: buttonsBar.config.buttonOrientation === 'y' ? 22 : buttonCoordinates.h}; // Reset 
	console.log('Sace Tags Buttons loaded.');
}

buttonsBar.list.push({});
// we change the default coordinates here to accommodate text for x orientation. Apply this on vertical as global!
// if (buttonsBar.config.buttonOrientation === 'x') {buttonCoordinates.w += 0;}
// if (buttonsBar.config.buttonOrientation === 'y') {buttonCoordinates.h += 0;}

var newButtons = {
	OneButton: new SimpleButton(calcNextButtonCoordinates(buttonCoordinates, buttonsBar.config.buttonOrientation).x, calcNextButtonCoordinates(buttonCoordinates, buttonsBar.config.buttonOrientation,false).y, buttonCoordinates.w, buttonCoordinates.h, 'Save tags', function () {
		const readmePath = folders.xxx + 'helpers\\readme\\save_tags.txt';
		if (_isFile(readmePath)) {
			const readme = utils.ReadTextFile(readmePath, convertCharsetToCodepage('UTF-8'));
			if (readme.length) {fb.ShowPopupMessage(readme, 'Save tags and comparison');}
		}
		let file;
		try {file = utils.InputBox(window.ID, 'Path to save tags file:', 'Tags file', folders.data + 'tags.json', true);}
		catch (e) {return;}
		if (!file.length) {return;}
		saveTags({file});
	}, null, g_font,'Save all tags from selected tracks to json', void(0), void(0), chars.save),
	TwoButton: new SimpleButton(calcNextButtonCoordinates(buttonCoordinates, buttonsBar.config.buttonOrientation).x, calcNextButtonCoordinates(buttonCoordinates, buttonsBar.config.buttonOrientation,false).y, buttonCoordinates.w, buttonCoordinates.h, 'Compare', function () {
		let file;
		try {file = utils.InputBox(window.ID, 'Path to tags file to load:', 'Tags file', folders.data + 'tags.json', true);}
		catch (e) {return;}
		if (!file.length) {return;}
		const toTags =  _jsonParseFileCheck(file, 'Tags file', 'Save tags', convertCharsetToCodepage('UTF-8'));
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
	}, null, g_font,'Compares all tags from selected tracks with tags from a json file\nFor backup comparison purporse or to copy tags between libraries.', void(0), void(0), chars.exchange),
};
// Check if the button list already has the same button ID
for (var buttonName in newButtons) {
	if (buttons.hasOwnProperty(buttonName)) {
		// fb.ShowPopupMessage('Duplicated button ID (' + buttonName + ') on ' + window.Name);
		// console.log('Duplicated button ID (' + buttonName + ') on ' + window.Name);
		Object.defineProperty(newButtons, buttonName + Object.keys(buttons).length, Object.getOwnPropertyDescriptor(newButtons, buttonName));
		delete newButtons[buttonName];
	}
}
// Adds to current buttons
buttons = {...buttons, ...newButtons};