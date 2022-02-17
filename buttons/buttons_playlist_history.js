'use strict';
//17/02/22

/* 
	Playlist History
	----------------
	Switch to previous playlists.
 */

include('..\\helpers\\buttons_xxx.js'); 
try {window.DefinePanel('Playlist Tools History', {author:'xxx'});} catch (e) {console.log('Playlist Tools History Button loaded.');} //May be loaded along other buttons
include('..\\helpers\\playlist_history.js');

buttonsBar.list.push({});

addButton({
	menuButton: new themedButton({x: 0, y: 0, w: 98, h: 22}, 'Prev. Playlist', function (mask) {
		if (mask === MK_SHIFT) {
			createHistoryMenu().btn_up(this.currX, this.currY + this.currH);
		} else {
			goPrevPls();
		}
	}, null, void(0), () => {
		return 'Switch to previous playlist:\n' + getPrevPlsName() + (typeof menu_panelProperties === 'undefined' || menu_panelProperties.bTooltipInfo[1] ? '\n-----------------------------------------------------\n(Shift + L. Click to see entire history)' : '');
	}, null, null, chars.history),
});