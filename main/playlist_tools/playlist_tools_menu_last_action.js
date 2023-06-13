'use strict';
//12/06/23

// Last action
{
	const name = 'Last action';
	if (!menusEnabled.hasOwnProperty(name) || menusEnabled[name] === true) {
		readmes[newReadmeSep()] = 'sep';
		readmes[name] = folders.xxx + 'helpers\\readme\\playlist_tools_last_action.txt';
		menu.newEntry({entryText: 'sep'});
		menu.newCondEntry({entryText: name, condFunc: () => {
			const {entryText, fullName, flags} = lastActionEntry();
			menu.newEntry({entryText, func: () => {
				menu.btn_up(void(0), void(0), void(0), fullName); // Don't clear menu on last call
			}, flags: entryText !== null ? flags : MF_GRAYED});
		}});
	// This part changes compared to the other files due to being a cond entry...
	} else {menuDisabled.push({entryText: name, condFunc: true, subMenuFrom: menu.getMainMenuName(), index: menu.getEntries().filter((entry) => {
		return (entry.bIsMenu 
			? menuAltAllowed.has(entry.subMenuFrom) // menu
			: (entry.hasOwnProperty('condFunc')
				? entry.condFunc !== null && menuAltAllowed.has(entry.entryText) // Conditional entry
				: entry.entryText !== 'sep' && (entry.func !== null) && menuAltAllowed.has(entry.menuName) // Standard entry
			)
		);
	}).length + disabledCount++});}
}