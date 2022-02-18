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
var prefix = '';

try {window.DefinePanel('Automate Tags', {author:'xxx'});} catch (e) {console.log('Automate Tags Button loaded.');} //May be loaded along other buttons

prefix = getUniquePrefix(prefix, '_'); // Puts new ID before '_'

var newButtonsProperties = {	//You can simply add new properties here
};
setProperties(newButtonsProperties, prefix); //This sets all the panel properties at once
buttonsBar.list.push(getPropertiesPairs(newButtonsProperties, prefix));

addButton({
	automation: new themedButton({x: 0, y: 0, w: 98, h: 22}, 'Auto. Tags', function (mask) {
		const bFired = () => {return tAut.selItems && tAut.countItems && tAut.iStep;}
		if (mask === MK_SHIFT && !bFired() && fb.GetFocusItem(true)) {
			let t0 = Date.now();
			let t1 = 0;
			tagsAutomation();
			t1 = Date.now();
			console.log('Call to Automate Tags took ' + (t1 - t0) + ' milliseconds.');
		} else {
			const menu = new _menu({iMaxEntryLen: 50}); // To avoid collisions with other buttons and check menu
			const firedFlags = () => {return bFired() ? MF_STRING : MF_GRAYED;}
			const focusFlags = () => {return (fb.GetFocusItem(true) ? MF_STRING : MF_GRAYED);}
			const allFlags = () => {return (!bFired() ? focusFlags() : MF_GRAYED);}
			menu.newEntry({entryText: 'Automatize tagging:', func: null, flags: MF_GRAYED});
			menu.newEntry({entryText: 'sep'});
			menu.newEntry({entryText: () => {return 'Add tags on batch to selected tracks' + (bFired() ? ' (running)' : '');}, func: tagsAutomation, flags: allFlags});
			menu.newEntry({entryText: 'sep'});
			menu.newEntry({entryText: () => {return 'Manually force next step' + (bFired() ? '' : ' (not running)');}, func: nextStepTag, flags: firedFlags});
			menu.newEntry({entryText: () => {return 'Stop execution' + (bFired() ? '' : ' (not running)');}, func: stopStepTag, flags: firedFlags});
			menu.newEntry({entryText: 'sep'});
			const subMenuTools = menu.newMenu('Available tools...');
			tAut.tools.forEach((tool) => {
				menu.newEntry({menuName: subMenuTools, entryText: tool.title, func: null, flags: MF_GRAYED});
				menu.newCheckMenu(subMenuTools, tool.title, void(0), () => {return tool.bEnabled});
			});
			menu.btn_up(this.currX, this.currY + this.currH);
		}
	}, null, void(0), 'Automatic tags on selected tracks:\n' + getTagsAutomationDescription(), prefix, newButtonsProperties, chars.tags),
});