'use strict';
//04/01/24
/*
	You can merge sets of merged buttons too, mix them with individual buttons files, etc.
	The same than buttons, you can include multiple times the same merged bar.
*/

// Adjust paths as needed
include('..\\..\\helpers\\helpers_xxx.js');
/* global folders:readable */
include('..\\..\\helpers\\buttons_xxx.js');
/* global buttonsBar:readable */
include('..\\..\\helpers\\helpers_xxx_UI.js');
/* global RGB:readable */

try { window.DefinePanel('Merged Buttons bar', { author: 'xxx' }); } catch (e) { console.log('Merged Buttons loaded.'); }  //May be loaded along other buttons

// Global toolbar color
buttonsBar.config.bToolbar = true; // Change this on buttons bars files to set the background color
buttonsBar.config.toolbarColor = RGB(211, 218, 237);

{	// Buttons
	let buttonsPath = [	 // Add here your buttons path
		folders.xxx + 'buttons\\examples\\_buttons_example_merged.js',
		folders.xxx + 'buttons\\examples\\_buttons_example.js',
		folders.xxx + 'buttons\\examples\\_buttons_example_merged.js',
	];
	for (const path of buttonsPath) {
		if (utils.IsFile(path)) {
			include(path, { always_evaluate: true });
		} else {
			console.log(path + ' not loaded'); // DEBUG
		}
	}

	/*
		OR just add them manually:
		include(folders.xxx + 'buttons\\buttons_search_by_tags_combinations.js', {always_evaluate: true});
		...
	*/
}
