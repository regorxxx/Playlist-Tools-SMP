﻿'use strict';
//20/09/25

/* Playlist Tools: Buttons Toolbar
	Loads any button found on the buttons folder. Just load this file and add your desired buttons via R. Click.
	Compatible with:
		- Music Map
		- Playlist Tools
		- Fingerprint Tools
		- ListenBrainz Tools
		...

	Loading single buttons scripts in a panel is allowed but not supported.
*/

// Note this must be added before loading helpers! See buttons_search_by_tags_combinations.js and search_same_by.js
// eslint-disable-next-line no-unused-vars
var bLoadTags = true; // NOSONAR
var version = '2.0.0'; // NOSONAR

try { window.DefineScript('Playlist Tools: Buttons Bar', { author: 'regorxxx', version, features: { drag_n_drop: false } }); } catch (e) { /* May be loaded along other buttons*/ } // eslint-disable-line no-unused-vars

{
	const dependencies = [
		'helpers\\buttons_xxx.js',
		/* global buttonsBar:readable, addButtonSeparator:readable, VK_CONTROL:readable, VK_LWIN:readable */
		'helpers\\helpers_xxx.js',
		/* global globSettings:readable, folders:readable, globFonts:readable, DT_VCENTER:readable, DT_CENTER:readable, DT_END_ELLIPSIS:readable, DT_CALCRECT:readable, DT_NOPREFIX:readable, checkUpdate:readable , globProfiler:readable */
		'helpers\\helpers_xxx_foobar.js',
		'helpers\\helpers_xxx_properties.js',
		/* global setProperties:readable, getPropertiesPairs:readable, overwriteProperties:readable, getPropertiesPairs:readable */
		'helpers\\helpers_xxx_prototypes.js',
		/* global randomString:readable, isString:readable, isInt:readable, isBoolean:readable, isFloat:readable, isJSON:readable, _b:readable, isJSON:readable, clone:readable */
		'helpers\\helpers_xxx_UI.js',
		/* global _scale:readable, _gdiFont:readable */
		'helpers\\helpers_xxx_file.js',
		/* global _open:readable, _isFile:readable, utf8:readable, _save:readable, _jsonParseFileCheck:readable, WshShell:readable , popup:readable */
		'helpers\\helpers_xxx_input.js',
		/* global Input:readable */
		'main\\window\\window_xxx_dynamic_colors.js' // Requires Chroma
		/* global dynamicColors:readable, mostContrastColor:readable */
	];
	let bIncludeRel = true;
	try { include('..\\..\\helpers\\helpers_xxx_dummy.js'); } catch (e) { bIncludeRel = false; } // eslint-disable-line no-unused-vars
	if (bIncludeRel) { dependencies.forEach((file) => { include('..\\..\\' + file); }); }
	else { dependencies.forEach((file) => { include(file); }); }
}
{
	const dependencies = [
		'helpers\\buttons_merged_menu.js' // Loads Chroma
		/* global createButtonsMenu:readable, importSettingsMenu:readable */
	];
	let bIncludeRel = true;
	try { include('..\\helpers\\buttons_dummy.js'); } catch (e) { bIncludeRel = false; } // eslint-disable-line no-unused-vars
	if (bIncludeRel) { dependencies.forEach((file) => { include('..\\' + file); }); }
	else { dependencies.forEach((file) => { include('buttons\\' + file); }); }
}

globProfiler.Print('helpers');

let barProperties = {
	name: ['Name of config json file', 'buttons_' + randomString(5), { func: isString }],
	toolbarColor: ['Toolbar color', -1, { func: isInt }],
	textColor: ['Buttons\' text color', buttonsBar.config.textColor, { func: isInt }],
	firstPopup: ['Toolbar: Fired once', false, { func: isBoolean }],
	bShowId: ['Show Ids on tooltip', false, { func: isBoolean }],
	bBgButtons: ['Buttons with background', true, { func: isBoolean }],
	orientation: ['Toolbar orientation', 'x', { func: isString }],
	bReflow: ['Reflow according to width / height', false, { func: isBoolean }],
	bAlignSize: ['Align buttons according to size', true, { func: isBoolean }],
	scale: ['UI scale', _scale(0.7, false), { func: (v) => isFloat(v) || isInt(v) }],
	activeColor: ['Buttons\' active icon color', buttonsBar.config.activeColor, { func: isInt }],
	animationColors: ['Buttons\' animation colors', JSON.stringify(buttonsBar.config.animationColors), { func: isJSON }],
	bIconMode: ['Show only button\'s icons', false, { func: isBoolean }],
	bIconModeExpand: ['Expand to full button on hover', false, { func: isBoolean }],
	buttonColor: ['Buttons\' color', -1, { func: isInt }],
	transparency: ['Buttons\' transparency', 0, { func: isInt, range: [[0, 100]] }],
	offset: ['Buttons\' offset', JSON.stringify({ button: { x: 0, y: 0 }, text: { x: 0, y: 0 }, icon: { x: 0, y: 0 } }), { func: isJSON }],
	bFullSize: ['Full size buttons', false, { func: isBoolean }],
	hoverColor: ['Buttons\' hover color', buttonsBar.config.hoverColor, { func: isInt }],
	bDynHoverColor: ['Buttons\' hover dynamic color', true, { func: isBoolean }],
	bHoverGrad: ['Buttons\' hover gradient', true, { func: isBoolean }],
	bBorders: ['Buttons\' borders', true, { func: isBoolean }],
	bAutoUpdateCheck: ['Automatically check updates', globSettings.bAutoUpdateCheck, { func: isBoolean }, globSettings.bAutoUpdateCheck],
	bLoadAsync: ['Asynchronous loading', true, { func: isBoolean }],
	iconScale: ['UI icon scale', _scale(0.7, false), { func: (v) => isFloat(v) || isInt(v) }],
	textScale: ['UI text scale', _scale(0.7, false), { func: (v) => isFloat(v) || isInt(v) }],
	textPosition: ['UI text position', 'right', { func: isString }],
	bTooltipInfo: ['Show shortcuts on tooltip', true, { func: isBoolean }],
	bOnNotifyColors: ['Adjust colors on panel notify', true, { func: isBoolean }]
};
Object.keys(barProperties).forEach(p => barProperties[p].push(barProperties[p][1]));
setProperties(barProperties);
barProperties = getPropertiesPairs(barProperties);

// Config at buttons_xxx.js
// Global toolbar color
buttonsBar.config.toolbarColor = barProperties.toolbarColor[1];
buttonsBar.config.bToolbar = buttonsBar.config.toolbarColor !== -1; // To set the background color
buttonsBar.config.partAndStateID = barProperties.bBgButtons[1] ? 1 : 6;
buttonsBar.config.textColor = barProperties.textColor[1];
buttonsBar.config.buttonColor = barProperties.buttonColor[1];
buttonsBar.config.hoverColor = barProperties.hoverColor[1];
buttonsBar.config.bDynHoverColor = barProperties.bDynHoverColor[1];
buttonsBar.config.bHoverGrad = barProperties.bHoverGrad[1];
buttonsBar.config.toolbarTransparency = barProperties.transparency[1];
buttonsBar.config.activeColor = barProperties.activeColor[1];
buttonsBar.config.animationColors = JSON.parse(barProperties.animationColors[1]);
buttonsBar.config.bBorders = barProperties.bBorders[1];
// Show Id on tooltips
buttonsBar.config.bShowID = barProperties.bShowId[1];
// Orientation
buttonsBar.config.orientation = barProperties.orientation[1];
// Icon-only mode
buttonsBar.config.bIconMode = barProperties.bIconMode[1];
buttonsBar.config.bIconModeExpand = barProperties.bIconModeExpand[1];
// Reflow
buttonsBar.config.bReflow = barProperties.bReflow[1];
// Align all widths and heights according to orientation
buttonsBar.config.bAlignSize = barProperties.bAlignSize[1];
// Tooltip at empty bar
buttonsBar.config.toolbarTooltip = 'R. Click for toolbar menu' +
	'\nHold R. Click to move buttons' +
	'\nM. Click to show headless buttons (for ' + parseFloat(buttonsBar.config.hiddenTimeout / 1000).toFixed(1) + ' s)' +
	'\n' + '-'.repeat(60) +
	'\n(Shift + Win + R. Click for SMP panel menu)' +
	'\n(Ctrl + Win + R.Click for script panel menu)';
// Assign size and pos
buttonsBar.config.scale = barProperties.scale[1];
buttonsBar.config.textScale = barProperties.textScale[1];
buttonsBar.config.iconScale = barProperties.iconScale[1];
buttonsBar.config.textPosition = barProperties.textPosition[1];
buttonsBar.config.offset = JSON.parse(barProperties.offset[1]);
buttonsBar.config.bFullSize = barProperties.bFullSize[1];

// First popup
if (!barProperties.firstPopup[1]) {
	buttonsBar.firstPopup = true; // For later use
	const readmePath = folders.xxx + 'helpers\\readme\\toolbar.txt';
	barProperties.firstPopup[1] = true;
	overwriteProperties(barProperties); // Updates panel
	const readme = _open(readmePath, utf8);
	if (readme.length) { fb.ShowPopupMessage(readme, 'Toolbar'); }
}

globProfiler.Print('settings');

// Load Buttons
function loadButtonsFile(bStartup = false) {
	let names = [];
	const file = folders.data + barProperties.name[1] + '.json'; // NOSONAR [it's always a string...]
	const presetPopup = () => {
		if (bStartup && !buttonsBar.firstPopup) { return false; }
		// Show popup with presets
		const presets = [
			{
				name: 'Playlist Tools', files:
					['buttons_playlist_tools.js', 'buttons_playlist_tools_submenu_custom.js', 'buttons_playlist_tools_macros.js', 'buttons_playlist_tools_pool.js']
			},
			/* global sbd:readable */
			{
				name: (typeof sbd !== 'undefined' ? sbd.name : 'Music Map') + ' (basic)', files:
					['buttons_music_map_basic.js']
			},
			{
				name: (typeof sbd !== 'undefined' ? sbd.name  : 'Music Map') + ' (customizable)', files:
					['buttons_music_map_customizable.js', 'buttons_music_map_customizable.js', 'buttons_music_map_customizable.js', 'buttons_music_map_customizable.js']
			},
			{
				name: 'Top Tracks', files:
					['buttons_search_top_tracks.js', 'buttons_search_top_tracks_from_date.js', 'buttons_search_top_tracks_from_date.js']
			},
			{
				name: 'Library search', files:
					['buttons_search_by_tags_combinations.js', 'buttons_search_by_tags_queries.js', 'buttons_search_quicksearch.js']
			},
			{
				name: 'Playlist manipulation', files:
					['buttons_playlist_remove_duplicates.js', 'buttons_playlist_filter.js', 'buttons_playlist_filter.js', 'buttons_playlist_history.js']
			},
			{
				name: 'Device priority', files: _isFile(folders.xxx + 'buttons\\buttons_device_switcher.js')
					? ['buttons_device_priority.js', 'buttons_device_switcher.js']
					: ['buttons_device_priority.js']
			},
			{
				name: 'ListenBrainz & Last.fm', files:
					['buttons_listenbrainz_tools.js', 'buttons_lastfm_tools.js']
			},
			{
				name: 'Full', files:
					['buttons_playlist_tools.js', 'buttons_playlist_tools_submenu_custom.js', 'buttons_playlist_tools_macros.js', 'buttons_search_by_tags_combinations.js', 'buttons_playlist_remove_duplicates.js', 'buttons_playlist_filter.js', 'buttons_search_quicksearch.js']
			},
			{
				name: 'Full' + (typeof sbd !== 'undefined' ? '( with ' + sbd.name + ')' : ''), files:
					['buttons_playlist_tools.js', 'buttons_playlist_tools_submenu_custom.js', 'buttons_music_map_customizable.js', 'buttons_music_map_customizable.js', 'buttons_playlist_remove_duplicates.js', 'buttons_playlist_filter.js', 'buttons_search_quicksearch.js']
			},
			{
				name: 'Status bar', files:
					['buttons_display_tf.js', 'separator', 'buttons_display_tf.js', 'separator', 'buttons_display_tf.js', 'separator', 'buttons_display_tf.js'],
				properties: folders.xxx + 'presets\\Playlist Tools\\toolbars\\statusbar.json'
			},
			{ name: 'Blank', files: [] }
		].map((preset) =>
			preset.files.every((file) => _isFile(folders.xxx + 'buttons\\' + file) || file.toLowerCase() === 'separator') ? preset : void (0)
		).filter(Boolean);
		const input = Input.number('int positive', presets.length, 'Choose a preset (by number) from the following list, to load the toolbar with pre-defined buttons (they may be added/removed at any time later):\n' + presets.map((p, i) => '\t' + _b(i + 1) + ' ' + p.name).join('\n') + '\n\nCanceling will load a blank toolbar by default.', 'Toolbar: preset', 1, [(n) => n > 0 && n <= presets.length]);
		if (input == null) { return false; }
		const preset = presets[input - 1];
		if (preset) {
			names = preset.files.map((path) => path.split('\\').pop());
			_save(file, JSON.stringify(names, null, '\t').replace(/\n/g, '\r\n'));
			if (Object.hasOwn(preset, 'properties')) {
				const properties = _jsonParseFileCheck(preset.properties, preset.name, preset.name, utf8);
				if (properties && properties.values) {
					Object.entries(properties.values).forEach(([key, value]) => {
						window.SetProperty(key, value);
					});
					window.Reload();
				}
			}
		}
	};
	if (!_isFile(file)) {
		presetPopup();
	} else {
		const data = _jsonParseFileCheck(file, 'Buttons bar', window.Name, utf8);
		// Strip full path
		if (data) { names = data.map((path) => path.split('\\').pop()); }
		if (!names.length) { presetPopup(); }
	}
	const remap = new Map([
		['buttons_lastfm_list.js', 'buttons_lastfm_tools.js'],
		['buttons_tags_automation.js', 'buttons_tags_batch_tagger.js'],
		['buttons_tags_tagger.js', 'buttons_tags_batch_tagger.js'],
		['buttons_device_selector.js', 'buttons_device_switcher.js'],
		['buttons_search_by_distance.js', 'buttons_music_map_basic.js.'],
		['buttons_search_by_distance_basic.js', 'buttons_music_map_basic.js.'],
		['buttons_search_by_distance_customizable.js', 'buttons_music_map_customizable.js.'],
		['buttons_search_by_distance_info.js', 'buttons_music_map_genre_explorer.js.'],
		['buttons_search_by_distance_genre_explorer.js', 'buttons_music_map_genre_explorer.js.'],
	]);
	buttonsPath = names
		.map((name) => remap.has(name) ? remap.get(name) : name)
		.map((name) => folders.xxx + 'buttons\\' + name);
	return buttonsPath.length;
}

const includeButton = (() => {
	const bProcessed = new Set();
	return function includeButton(buttonPath) {
		if (_isFile(buttonPath)) {
			include(buttonPath, { always_evaluate: true });
			const newKeys = [];
			Object.keys(buttonsBar.buttons).forEach((key) => {
				if (!bProcessed.has(key)) {
					bProcessed.add(key);
					newKeys.push(key);
				}
			});
			buttonsBar.listKeys.push(newKeys);
			globProfiler.Print('button - ' + buttonPath.split('\\').pop());
		} else if (buttonPath.toLowerCase().endsWith('separator')) {
			const newKeys = Object.keys(addButtonSeparator());
			buttonsBar.listKeys.push(newKeys);
			globProfiler.Print('button - ' + buttonPath.split('\\').pop());
		} else {
			console.log(buttonPath + ' not loaded'); // DEBUG
		}
	};
})();

function includeButtons() {
	if (buttonsPath.length) {
		for (const path of buttonsPath) { includeButton(path); }
		console.log('Buttons loaded: ' + buttonsBar.listKeys.flat(Infinity).join(', '));
		return true;
	}
	return false;
}

function includeButtonsAsync(timeout = 100) {
	if (buttonsPath.length) {
		return Promise.serial(buttonsPath, includeButton, timeout)
			.then(() => console.log('Buttons loaded: ' + buttonsBar.listKeys.flat(Infinity).join(', ')));
	}
	return Promise.resolve(false);
}

let buttonsPath = [];
if (barProperties.bLoadAsync[1]) {
	loadButtonsFile(true) && includeButtonsAsync().finally(() => {
		if (barProperties.bOnNotifyColors[1]) { // Ask color-servers at init
			setTimeout(() => {
				window.NotifyOthers('Colors: ask color scheme', 'Toolbar: set color scheme');
				window.NotifyOthers('Colors: ask color', 'Toolbar: set colors');
			}, 1000);
		}
	});
} else {
	loadButtonsFile(true) && includeButtons();
	if (barProperties.bOnNotifyColors[1]) { // Ask color-servers at init
		setTimeout(() => {
			window.NotifyOthers('Colors: ask color scheme', 'Toolbar: set color scheme');
			window.NotifyOthers('Colors: ask color', 'Toolbar: set colors');
		}, 1000);
	}
}

addEventListener('on_paint', (gr) => {
	if (!buttonsPath.length) {
		gr.GdiDrawText('L. Click to load a preset / R. Click to add buttons manually', _gdiFont(globFonts.standard.name, _scale(globFonts.standard.size)), 0xFF000000, 0, 0, window.Width, window.Height, DT_VCENTER | DT_CENTER | DT_END_ELLIPSIS | DT_CALCRECT | DT_NOPREFIX); // Font is being cached, no problems here...
	}
});

addEventListener('on_mouse_lbtn_up', (x, y, mask) => { // eslint-disable-line no-unused-vars
	!buttonsPath.length && loadButtonsFile() && includeButtons();
	window.Repaint();
});

addEventListener('on_mouse_rbtn_up', (x, y, mask) => { // eslint-disable-line no-unused-vars
	if (utils.IsKeyPressed(VK_CONTROL) && utils.IsKeyPressed(VK_LWIN)) {
		return importSettingsMenu().btn_up(x, y);
	}
	return createButtonsMenu(barProperties.name[1]).btn_up(x, y);
});

addEventListener('on_notify_data', (name, info) => { // eslint-disable-line no-unused-vars
	if (name === 'bio_imgChange' || name === 'biographyTags' || name === 'bio_chkTrackRev' || name === 'xxx-scripts: panel name reply') { return; }
	switch (name) { // NOSONAR
		case 'Toolbar: share settings': {
			if (info) {
				for (let key in buttonsBar.buttons) {
					if (Object.hasOwn(buttonsBar.buttons, key)) {
						buttonsBar.buttons[key].switchHighlight(true);
					}
				}
				const answer = WshShell.Popup('Apply current settings to highlighted toolbar?\nCheck UI.', 0, window.Name + ': Toolbar', popup.question + popup.yes_no);
				if (answer === popup.yes) {
					['toolbarColor', 'buttonColor', 'textColor', 'hoverColor', 'activeColor', 'transparency', 'scale', 'iconScale', 'textScale'].forEach((key) => {
						buttonsBar.config[key] = barProperties[key][1] = Number(info[key][1]);
					});
					buttonsBar.config.bToolbar = buttonsBar.config.toolbarColor !== -1;
					['bDynHoverColor', 'bHoverGrad', 'bBorders'].forEach((key) => {
						buttonsBar.config[key] = barProperties[key][1] = !!info[key][1];
					});
					['animationColors'].forEach((key) => {
						barProperties[key][1] = String(info[key][1]);
						buttonsBar.config[key] = JSON.parse(info[key][1]);
					});
					barProperties.offset[1] = String(info.offset[1]);
					const offset = JSON.parse(barProperties.offset[1]);
					buttonsBar.config.offset.button = offset.button;
					buttonsBar.config.offset.text = offset.button;
					barProperties.bBgButtons[1] = !!info.bBgButtons[1];
					buttonsBar.config.partAndStateID = info.bBgButtons[1] ? 1 : 6;
					overwriteProperties(barProperties);
				}
				for (let key in buttonsBar.buttons) {
					if (Object.hasOwn(buttonsBar.buttons, key)) {
						buttonsBar.buttons[key].switchHighlight(false);
					}
				}
				window.Repaint();
			}
			break;
		}
		case 'Toolbar: set colors': { // Needs an array of 5 colors or an object {toolbar, text, button, hover, active}
			if (info && barProperties.bOnNotifyColors[1]) {
				const colors = clone(info);
				const getColor = (key) => Object.hasOwn(colors, key) ? colors.background : colors[['toolbar', 'text', 'button', 'hover', 'active'].indexOf(key)];
				const hasColor = (key) => typeof getColor(key) !== 'undefined';
				const bar = buttonsBar.config;
				if (bar.bToolbar && hasColor('toolbar')) { bar.toolbarColor = getColor('toolbar'); }
				if (bar.textColor !== -1 && hasColor('text')) { bar.textColor = getColor('text'); }
				if (bar.buttonColor !== -1 && hasColor('button')) { bar.buttonColor = getColor('button'); }
				if (bar.hoverColor !== -1 && hasColor('hover')) { bar.hoverColor = getColor('hover'); }
				if (bar.activeColor !== -1 && hasColor('active')) { bar.activeColor = getColor('active'); }
				window.Repaint();
			}
			break;
		}
		case 'Colors: set color scheme':
		case 'Toolbar: set color scheme': { // Needs an array of at least 6 colors to automatically adjust dynamic colors
			if (info && barProperties.bOnNotifyColors[1]) {
				const bar = buttonsBar.config;
				const { main, sec, note, mainAlt, secAlt } = dynamicColors( // eslint-disable-line no-unused-vars
					clone(info),
					bar.bToolbar
						? bar.toolbarColor
						: (window.InstanceType === 0 ? window.GetColourCUI(1) : window.GetColourDUI(1)),
					true
				);
				if (bar.bToolbar) { bar.toolbarColor = main; }
				if (bar.textColor !== -1 && bar.bToolbar) { bar.textColor = mostContrastColor(bar.toolbarColor).color; }
				if (bar.buttonColor !== -1) { bar.buttonColor = note; }
				if (bar.hoverColor !== -1) { bar.hoverColor = mainAlt; }
				if (bar.activeColor !== -1) { bar.activeColor = sec; }
				window.Repaint();
			}
			break;
		}
	}
});

// Update check
if (barProperties.bAutoUpdateCheck[1]) {
	{
		const dependencies = [
			'helpers\\helpers_xxx_web_update.js',
		];
		let bIncludeRel = true;
		try { include('..\\..\\helpers\\helpers_xxx_dummy.js'); } catch (e) { bIncludeRel = false; } // eslint-disable-line no-unused-vars
		if (bIncludeRel) { dependencies.forEach((file) => { include('..\\..\\' + file); }); }
		else { dependencies.forEach((file) => { include(file); }); }
	}
	buttonsBar.getUpdateList().forEach((btn, i) => {
		setTimeout(checkUpdate, 120000 + 60000 * i, {
			...(btn.scriptName ? { scriptName: btn.scriptName } : {}),
			...(btn.repository ? { repository: btn.repository } : {}),
			...(btn.version ? { version: btn.version } : {}),
			bDownload: globSettings.bAutoUpdateDownload, bOpenWeb: globSettings.bAutoUpdateOpenWeb
		});
	});
}

globProfiler.Print('callbacks');