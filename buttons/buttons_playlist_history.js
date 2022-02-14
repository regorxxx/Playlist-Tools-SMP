'use strict';
//11/02/22

/* 
	Playlist History
	----------------
	Switch to previous playlists.
 */

include('..\\helpers\\buttons_xxx.js'); 
try { //May be loaded along other buttons
	window.DefinePanel('Playlist Tools History', {author:'xxx'});
	var g_font = _gdiFont('Segoe UI', 12);
	var buttonCoordinates = {x: 0, y: 0, w: 98, h: 22};
} catch (e) {
	buttonCoordinates = {x: 0, y: 0, w: buttonsBar.config.buttonOrientation === 'x' ? 98 : buttonCoordinates.w, h: buttonsBar.config.buttonOrientation === 'y' ? 22 : buttonCoordinates.h}; // Reset 
	console.log('Playlist Tools History Button loaded.');
}
include('..\\helpers\\playlist_history.js');

buttonsBar.list.push({});

var newButtons = {
	menuButton: new SimpleButton(buttonCoordinates, 'Prev. Playlist', function (mask) {
		if (mask === MK_SHIFT) {
			createHistoryMenu().btn_up(this.currX, this.currY + this.currH);
		} else {
			goPrevPls();
		}
	}, null, g_font, () => {
		return 'Switch to previous playlist:\n' + getPrevPlsName() + (typeof menu_panelProperties === 'undefined' || menu_panelProperties.bTooltipInfo[1] ? '\n-----------------------------------------------------\n(Shift + L. Click to see entire history)' : '');
	}, null, null, chars.history),
};

// Check if the button list already has the same button ID
for (var buttonName in newButtons) {
	if (buttons.hasOwnProperty(buttonName)) {
		Object.defineProperty(newButtons, buttonName + Object.keys(buttons).length, Object.getOwnPropertyDescriptor(newButtons, buttonName));
		delete newButtons[buttonName];
	}
}
// Adds to current buttons
buttons = {...buttons, ...newButtons};