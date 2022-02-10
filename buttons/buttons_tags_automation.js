'use strict';
//10/02/22

/* 
	Automatic tagging...
	File processing takes time, specially for some functions (ReplayGain, etc.), so we delay next step execution some ms
	according to step and track selected count. Naive approach but works, no 'blocked file' while processing.
	
	Note there is no way to know when some arbitrary plugin finish their processing. Callbacks for meta changes are dangerous here.
	Some plugins expect user input for final tagging after processing the files (ReplayGain for ex.), so that approach would delay 
	next step until the user press OK on those popups...and then the files would be blocked being tagged! = Error on next step.
 */

include('..\\helpers\\buttons_xxx.js');
include('..\\main\\tags_automation.js');
include('..\\helpers\\helpers_xxx_properties.js');
var prefix = '';

try { //May be loaded along other buttons
	window.DefinePanel('Automate Tags', {author:'xxx'});
	var g_font = _gdiFont('Segoe UI', 12);
	var buttonCoordinates = {x: 0, y: 0, w: 98, h: 22};
} catch (e) {
	buttonCoordinates = {x: 0, y: 0, w: buttonsBar.config.buttonOrientation === 'x' ? 98 : buttonCoordinates.w , h: buttonsBar.config.buttonOrientation === 'y' ? 22 : buttonCoordinates.h}; // Reset 
	console.log('Automate Tags Button loaded.');
}
prefix = getUniquePrefix(prefix, '_'); // Puts new ID before '_'

var newButtonsProperties = {	//You can simply add new properties here
};
setProperties(newButtonsProperties, prefix); //This sets all the panel properties at once
buttonsBar.list.push(getPropertiesPairs(newButtonsProperties, prefix));

var newButtons = {
	Automation: new SimpleButton(buttonCoordinates, 'Auto. Tags', function () {
		let t0 = Date.now();
		let t1 = 0;
        tagsAutomation();
		t1 = Date.now();
		console.log('Call to Automate Tags took ' + (t1 - t0) + ' milliseconds.');
	}, null, g_font, 'Automatic tags on selected tracks: ' + getTagsAutomationDescription(), prefix, newButtonsProperties, chars.tags),
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