'use strict';
//17/02/22

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
var prefix = 'ta';

try {window.DefinePanel('Automate Tags', {author:'xxx'});} catch (e) {console.log('Automate Tags Button loaded.');} //May be loaded along other buttons

prefix = getUniquePrefix(prefix, ''); // Puts new ID before '_'

var newButtonsProperties = {	//You can simply add new properties here
	toolsByKey: ['Tools enabled', JSON.stringify(new tagAutomation(void(0), true))]
};
setProperties(newButtonsProperties, prefix, 0); //This sets all the panel properties at once
newButtonsProperties = getPropertiesPairs(newButtonsProperties, prefix, 0);
buttonsBar.list.push(newButtonsProperties);

{
	var newButton = {
		automation: new themedButton({x: 0, y: 0, w: 98, h: 22}, 'Auto. Tags', function (mask) {
			const bFired = () => {return this.tAut.selItems && this.tAut.countItems && this.tAut.iStep;}
			const handleList = plman.GetPlaylistSelectedItems(plman.ActivePlaylist);
			if (mask === MK_SHIFT) {
				if (!bFired() && handleList.Count) {this.tAut.run();} 
				else {this.tAut.nextStepTag();}
			} else {
				const menu = new _menu({iMaxEntryLen: 50}); // To avoid collisions with other buttons and check menu
				const firedFlags = () => {return bFired() ? MF_STRING : MF_GRAYED;}
				const selFlags = handleList.Count ? MF_STRING : MF_GRAYED;
				const allFlags = () => {return (!bFired() ? selFlags : MF_GRAYED);}
				menu.newEntry({entryText: 'Automatize tagging:', func: null, flags: MF_GRAYED});
				menu.newEntry({entryText: 'sep'});
				menu.newEntry({entryText: () => {return 'Add tags on batch to selected tracks' + (bFired() ? ' (running)' : '');}, func: this.tAut.run, flags: allFlags});
				menu.newEntry({entryText: 'sep'});
				menu.newEntry({entryText: () => {return 'Manually force next step' + (bFired() ? '' : ' (not running)');}, func: this.tAut.nextStepTag, flags: firedFlags});
				menu.newEntry({entryText: () => {return 'Stop execution' + (bFired() ? '' : ' (not running)');}, func: this.tAut.stopStepTag, flags: firedFlags});
				menu.newEntry({entryText: 'sep'});
				const subMenuTools = menu.newMenu('Available tools...');
				this.tAut.tools.forEach((tool) => {
					const flags = tool.bAvailable ? MF_STRING : MF_GRAYED;
					menu.newEntry({menuName: subMenuTools, entryText: tool.title, func: () => {
						this.tAut.toolsByKey[tool.key] = !this.tAut.toolsByKey[tool.key];
						this.buttonsProperties.toolsByKey[1] = JSON.stringify(this.tAut.toolsByKey);
						overwriteProperties(this.buttonsProperties); // Force overwriting
						this.tAut.loadDependencies();
					}, flags});
					menu.newCheckMenu(subMenuTools, tool.title, void(0), () => {return this.tAut.toolsByKey[tool.key];});
				});
				menu.btn_up(this.currX, this.currY + this.currH);
			}
		}, null, void(0), (parent) => {
			const bFired = () => {return parent.tAut.selItems && parent.tAut.countItems && parent.tAut.iStep;}
			// Retrieve list of tools and wrap lines with smaller width
			let info = 'Automatic tags on selected tracks:\n' + parent.tAut.description();
			const font = buttonsBar.tooltipButton.font;
			info = _gr.EstimateLineWrap(info, _gdiFont(font.name, font.size), 400).filter(isString).join('\n');
			// Modifiers
			const bShift = utils.IsKeyPressed(VK_SHIFT);
			const bInfo = typeof menu_panelProperties === 'undefined' || menu_panelProperties.bTooltipInfo[1];
			if (bShift || bInfo) {
				info += '\n-----------------------------------------------------';
				info += bFired() ? '\n(Shift + L. Click to force next step)' : '\n(Shift + L. Click to directly run on selection)';
			}
			return info;
		}, prefix, newButtonsProperties, chars.tags),
	};
	newButton.automation.tAut = new tagAutomation(JSON.parse(newButtonsProperties['toolsByKey'][1]));

	addButton(newButton);
}