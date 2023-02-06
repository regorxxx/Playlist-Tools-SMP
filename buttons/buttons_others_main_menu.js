'use strict';
//05/02/23

/* 
	Main Menu shortcut
	----------------
	Runs multiple main menus with one single click, on order.
	Also allows to call such menus before closing foobar, according to button state (enabled/disabled).
	Default button state may be set at startup, and will change when clicking on the button.
	There is no fancy tracking between sessions though...
 */

include('..\\helpers\\helpers_xxx.js');
include('..\\helpers\\buttons_xxx.js');
include('..\\helpers\\helpers_xxx_file.js');
include('..\\helpers\\helpers_xxx_input.js');
include('..\\helpers\\menu_xxx.js');
include('..\\helpers\\menu_xxx_extras.js');
var prefix = 'mms';

try {window.DefineScript('Main Menu Shortcut Button', {author:'XXX', version: '1.0.0', features: {drag_n_drop: false}});} catch (e) {/* console.log('Main Menu Shortcut Button loaded.'); */} //May be loaded along other buttons

prefix = getUniquePrefix(prefix, ''); // Puts new ID before '_'

var newButtonsProperties = { //You can simply add new properties here
	customName:		['Name for the custom UI button', 'Main Menu', {func: isString}, 'Main Menu'],
	entries:		['Main menu entries', JSON.stringify([
		{name: 'Playback Statistics', command: 'Library/Playback Statistics/Monitor playing tracks'},
		{name: 'ListenBrainz Statistics', command: 'Playback/Submit to ListenBrainz'}
	]), {func: isJSON}],
	unloadCall: 	['Call menus on unload options', JSON.stringify({enabled: false, disabled: false}), {func: isJSON}],
	indicator: 		['Indicator options', JSON.stringify({init: true, enabled: false}), {func: isJSON}]
};
newButtonsProperties.entries.push(newButtonsProperties.entries[1]);
newButtonsProperties.unloadCall.push(newButtonsProperties.unloadCall[1]);
newButtonsProperties.indicator.push(newButtonsProperties.indicator[1]);

setProperties(newButtonsProperties, prefix, 0); //This sets all the panel properties at once
newButtonsProperties = getPropertiesPairs(newButtonsProperties, prefix, 0);
buttonsBar.list.push(newButtonsProperties);

{
	var newButton = {
		'Main Menu': new themedButton({x: 0, y: 0, w: _gr.CalcTextWidth(newButtonsProperties.customName[1], _gdiFont('Segoe UI', 12 * buttonsBar.config.scale)) + 35, h: 22}, newButtonsProperties.customName[1], function (mask) {
			const list = JSON.parse(this.buttonsProperties.entries[1]);
			const unloadCall = JSON.parse(this.buttonsProperties.unloadCall[1]);
			const indicator = JSON.parse(this.buttonsProperties.indicator[1]);
			if (mask === MK_SHIFT) {
				const menu = new _menu({onBtnUp: () => {
					this.buttonsProperties.entries[1] = JSON.stringify(list);
					overwriteProperties(this.buttonsProperties);
				}});
				menu.newEntry({entryText: 'Select output:', func: null, flags: MF_GRAYED});
				menu.newEntry({entryText: 'sep'});
				_createSubMenuEditEntries(menu, void(0), {
					name: 'Main Menu',
					list, 
					defaults: JSON.parse(this.buttonsProperties.entries[3]), 
					input : () => {return Input.string('string', '', 'Enter complete menu name:\nEx: Library/Playback Statistics/Monitor playing tracks', window.Name + 'Main Menu Shortcut' , 'Library/Playback Statistics/Monitor playing tracks', void(0), true);}
				});
				{
					const menuName = menu.newMenu('Run when closing foobar?');
					menu.newEntry({menuName, entryText: 'If state is enabled', func: () => {
						unloadCall.enabled = !unloadCall.enabled;
						this.buttonsProperties.unloadCall[1] = JSON.stringify(unloadCall);
						overwriteProperties(this.buttonsProperties); // Force overwriting
					}, flags: indicator.enabled ? MF_STRING : MF_GRAYED});
					menu.newCheckMenu(menuName, 'If state is enabled', void(0), () => {return unloadCall.enabled;});
					menu.newEntry({menuName, entryText: 'If state is disabled', func: () => {
						unloadCall.disabled = !unloadCall.disabled;
						this.buttonsProperties.unloadCall[1] = JSON.stringify(unloadCall);
						overwriteProperties(this.buttonsProperties); // Force overwriting
					}});
					menu.newCheckMenu(menuName, 'If state is disabled', void(0), () => {return unloadCall.disabled;});
				}
				{
					const menuName = menu.newMenu('Button states');
					menu.newEntry({menuName, entryText: 'Use button states', func: () => {
						indicator.enabled = !indicator.enabled;
						this.buttonsProperties.indicator[1] = JSON.stringify(indicator);
						overwriteProperties(this.buttonsProperties); // Force overwriting
					}});
					menu.newCheckMenu(menuName, 'Use button states', void(0), () => {return indicator.enabled;});
					menu.newEntry({menuName, entryText: 'Set as enabled at startup', func: () => {
						indicator.init = !indicator.init;
						this.buttonsProperties.indicator[1] = JSON.stringify(indicator);
						overwriteProperties(this.buttonsProperties); // Force overwriting
					}});
					menu.newCheckMenu(menuName, 'Set as enabled at startup', void(0), () => {return indicator.init;});
				}
				menu.newEntry({entryText: 'sep'});
				menu.newEntry({entryText: 'Rename button...', func: () => {
					const input = Input.string('string', this.buttonsProperties.customName[1], 'Enter button name:', window.Name + 'Main Menu Shortcut' , this.buttonsProperties.customName[3], void(0), false);
					if (input === null) {return;}
					this.buttonsProperties.customName[1] = input;
					overwriteProperties(this.buttonsProperties); // Force overwriting
					this.text = input;
					this.w = _gr.CalcTextWidth(input, _gdiFont('Segoe UI', 12 * buttonsBar.config.scale)) + 30;
					this.w *= buttonsBar.config.scale;
					this.changeScale(buttonsBar.config.scale);
					window.Repaint();
				}});
				menu.btn_up(this.currX, this.currY + this.currH);
			} else {
				list.forEach((entry) => {
					console.log(entry.name + ' -> ' + entry.command);
					try {fb.RunMainMenuCommand(entry.command)} catch (e) {console.log(e);}
				});
				if (indicator.enabled) {this.switchActive();}
			}
		}, null, void(0), (parent) => {
			const bShift = utils.IsKeyPressed(VK_SHIFT);
			const bInfo = typeof menu_panelProperties === 'undefined' || menu_panelProperties.bTooltipInfo[1];
			let info = 'Main menu';
			// Entries
			const list = JSON.parse(parent.buttonsProperties.entries[1]);
			info += '\nEntries:\t' + list.map(e => e.name).joinEvery(', ', 2, '\n\t');
			if (bShift || bInfo) {
				info += '\n-----------------------------------------------------';
				info += '\n(Shift + L. Click to open config menu)';
			}
			return info;
		}, void(0), newButtonsProperties, chars.music, void(0), void(0),
		{
			'on_script_unload': (parent) => {
				const unloadCall = JSON.parse(parent.buttonsProperties.unloadCall[1]);
				if (unloadCall.disabled && !parent.active || unloadCall.enabled && parent.active) {
					parent.onClick();
				}
			}
		}),
	};
	// Default state
	const indicator = JSON.parse(newButton['Main Menu'].buttonsProperties.indicator[1]);
	if (indicator.init) {newButton['Main Menu'].active = true;}
	addButton(newButton);
}