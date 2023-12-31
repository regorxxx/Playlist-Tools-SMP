'use strict';
//31/12/23

/*
	-> EDIT
*/

// Adjust paths as needed
include('..\\..\\helpers\\helpers_xxx.js');
/* global folders:readable */
include('..\\..\\helpers\\buttons_xxx.js');
/* global buttonsBar:readable */
include('..\\..\\helpers\\helpers_xxx_UI.js');
/* global RGB:readable */

try { window.DefinePanel('EDIT', { author: 'xxx' }); } catch (e) { console.log('EDIT'); }  //May be loaded along other buttons

// Global toolbar color
buttonsBar.config.bToolbar = false; // Change this on buttons bars files to set the background color
buttonsBar.config.toolbarColor = RGB(211, 218, 237);


{	// Buttons
	let buttonsPath = [	 // Add here your buttons path
		folders.xxx + 'buttons\\examples\\_buttons_blank.js',  //+15 w
		folders.xxx + 'buttons\\examples\\_buttons_blank.js'  //+15 w
	];
	for (const path of buttonsPath) {
		if (utils.IsFile(path)) {
			include(path, { always_evaluate: true });
		} else {
			console.log(path + ' not loaded');
		}
	}
}
