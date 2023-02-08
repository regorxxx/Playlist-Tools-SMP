'use strict';
//08/02/23

/* 
	Automatic tagging...
	File processing takes time, specially for some functions (ReplayGain, etc.), so we delay next step execution some ms
	according to step and track selected count. Naive approach but works, no 'blocked file' while processing.
	
	Note there is no way to know when some arbitrary plugin finish their processing. Callbacks for meta changes are dangerous here.
	Some plugins expect user input for final tagging after processing the files (ReplayGain for ex.), so that approach would delay 
	next step until the user press OK on those popups...and then the files would be blocked being tagged! = Error on next step.
 */

include('..\\helpers\\buttons_xxx.js');
include('..\\helpers\\menu_xxx.js');
include('..\\main\\tags\\tags_automation.js');
include('..\\helpers\\helpers_xxx_properties.js');
var prefix = 'ta';

try {window.DefineScript('Automate Tags', {author:'xxx', features: {drag_n_drop: false}});} catch (e) {/* console.log('Automate Tags Button loaded.'); */} //May be loaded along other buttons

prefix = getUniquePrefix(prefix, ''); // Puts new ID before '_'

var newButtonsProperties = {	//You can simply add new properties here
	toolsByKey:	['Tools enabled', JSON.stringify(new tagAutomation(void(0), false, true))],
	bIconMode:	['Icon-only mode?', false, {func: isBoolean}, false]
};
newButtonsProperties['toolsByKey'].push({func: isJSON}, newButtonsProperties['toolsByKey'][1]);
setProperties(newButtonsProperties, prefix, 0); //This sets all the panel properties at once
newButtonsProperties = getPropertiesPairs(newButtonsProperties, prefix, 0);
buttonsBar.list.push(newButtonsProperties);

{
	var newButton = {
		'Automate Tags': new themedButton({x: 0, y: 0, w: 98, h: 22}, 'Auto. Tags', function (mask) {
			const handleList = plman.GetPlaylistSelectedItems(plman.ActivePlaylist);
			if (mask === MK_SHIFT) {
				if (!this.tAut.isRunning() && handleList.Count) {this.tAut.run();} 
				else {this.tAut.nextStepTag();}
			} else {
				const menu = new _menu({iMaxEntryLen: 50}); // To avoid collisions with other buttons and check menu
				const firedFlags = () => {return this.tAut.isRunning() ? MF_STRING : MF_GRAYED;}
				const selFlags = handleList.Count ? MF_STRING : MF_GRAYED;
				const allFlags = () => {return (!this.tAut.isRunning() ? selFlags : MF_GRAYED);}
				menu.newEntry({entryText: 'Automatize tagging:', func: null, flags: MF_GRAYED});
				menu.newEntry({entryText: 'sep'});
				menu.newEntry({entryText: () => {return 'Add tags on batch to selected tracks' + (this.tAut.isRunning() ? ' (running)' : '');}, func: () => {
					this.tAut.run();
					this.switchAnimation('Automate Tags' ,true, () => {return !this.tAut.isRunning();});
				}, flags: allFlags});
				menu.newEntry({entryText: 'sep'});
				menu.newEntry({entryText: () => {return 'Manually force next step' + (this.tAut.isRunning() ? '' : ' (not running)');}, func: this.tAut.nextStepTag, flags: firedFlags});
				menu.newEntry({entryText: () => {return 'Stop execution' + (this.tAut.isRunning() ? '' : ' (not running)');}, func: this.tAut.stopStepTag, flags: firedFlags});
				menu.newEntry({entryText: 'sep'});
				const subMenuTools = menu.newMenu('Available tools...', void(0), !this.tAut.isRunning() ? MF_STRING : MF_GRAYED);
				menu.newEntry({menuName: subMenuTools, entryText: 'Toogle (click) / Single (Shift + click):', func: null, flags: MF_GRAYED});
				menu.newEntry({menuName: subMenuTools, entryText: 'sep'});
				this.tAut.tools.forEach((tool) => {
					const key = tool.key;
					const flags = tool.bAvailable ? MF_STRING : MF_GRAYED;
					menu.newEntry({menuName: subMenuTools, entryText: tool.title, func: () => {
						// Disable all other tools when pressing shift
						if (utils.IsKeyPressed(VK_SHIFT)) {
							this.tAut.tools.filter((_) => {return _.key !== key}).forEach((_) => {this.tAut.toolsByKey[_.key] = false;});
							this.tAut.toolsByKey[key] = true;
						} else {
							this.tAut.toolsByKey[key] = !this.tAut.toolsByKey[key];
							// Warn about incompatible tools
							if (this.tAut.toolsByKey[key]) {
								if (this.tAut.incompatibleTools.has(key)) {
									const toDisable = this.tAut.incompatibleTools.get(key);
									if (this.tAut.toolsByKey[toDisable]) {
										this.tAut.toolsByKey[toDisable] = false; 
										console.popup(this.tAut.titlesByKey[toDisable] + ' has been disabled.', 'Tags Automation');
									}
								}
							}
						}
						// Save
						this.buttonsProperties.toolsByKey[1] = JSON.stringify(this.tAut.toolsByKey);
						overwriteProperties(this.buttonsProperties); // Force overwriting
						this.tAut.loadDependencies();
					}, flags});
					menu.newCheckMenu(subMenuTools, tool.title, void(0), () => {return this.tAut.toolsByKey[key];});
				});
				menu.newEntry({menuName: subMenuTools, entryText: 'sep'});
				['Enable all', 'Disable all'].forEach((entryText, i) => {
					menu.newEntry({menuName: subMenuTools, entryText, func: () => {
						this.tAut.tools.forEach((tool) => {this.tAut.toolsByKey[tool.key] = i ? false : tool.bAvailable && tool.bDefault ? true : false;});
						this.tAut.incompatibleTools.uniValues().forEach((tool) => {this.tAut.toolsByKey[tool] = false;});
						this.buttonsProperties.toolsByKey[1] = JSON.stringify(this.tAut.toolsByKey);
						overwriteProperties(this.buttonsProperties); // Force overwriting
						this.tAut.loadDependencies();
					}});
				});
				menu.newEntry({menuName: subMenuTools, entryText: 'Invert selected tools', func: () => {
					this.tAut.tools.forEach((tool) => {this.tAut.toolsByKey[tool.key] = tool.bAvailable ? !this.tAut.toolsByKey[tool.key] : false;});
					this.tAut.incompatibleTools.uniValues().forEach((tool) => {this.tAut.toolsByKey[tool] = false;});
					this.buttonsProperties.toolsByKey[1] = JSON.stringify(this.tAut.toolsByKey);
					overwriteProperties(this.buttonsProperties); // Force overwriting
					this.tAut.loadDependencies();
				}});
				menu.btn_up(this.currX, this.currY + this.currH);
			}
		}, null, void(0), (parent) => {
			// Retrieve list of tools and wrap lines with smaller width
			let info = 'Automatic tags on selected tracks:'
			info += '\n' + parent.tAut.description();
			const font = buttonsBar.tooltipButton.font;
			info = _gr.EstimateLineWrap(info, _gdiFont(font.name, font.size), 400).filter(isString).join('\n');
			// Modifiers
			const bShift = utils.IsKeyPressed(VK_SHIFT);
			const bInfo = typeof menu_panelProperties === 'undefined' || menu_panelProperties.bTooltipInfo[1];
			if (bShift || bInfo) {
				info += '\n-----------------------------------------------------';
				info += parent.tAut.isRunning() ? '\n(Shift + L. Click to force next step)' : '\n(Shift + L. Click to directly run on selection)';
			}
			return info;
		}, prefix, newButtonsProperties, chars.tags),
	};
	newButton['Automate Tags'].tAut = new tagAutomation(JSON.parse(newButtonsProperties['toolsByKey'][1]));

	addButton(newButton);
}