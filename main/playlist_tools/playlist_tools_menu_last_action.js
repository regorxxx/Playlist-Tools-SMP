'use strict';
//15/11/24

/* global menusEnabled:readable, readmes:readable, menu:readable, disabledCount:writable, menuAltAllowed:readable, menuDisabled:readable, lastActionEntry:readable , newReadmeSep:readable */

/* global MF_GRAYED:readable, folders:readable */

// Last action
{
	const name = 'Last action';
	if (!Object.hasOwn(menusEnabled, name) || menusEnabled[name] === true) {
		readmes[newReadmeSep()] = 'sep';
		readmes[name] = folders.xxx + 'helpers\\readme\\playlist_tools_last_action.txt';
		menu.newSeparator();
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
			: (Object.hasOwn(entry, 'condFunc')
				? entry.condFunc !== null && menuAltAllowed.has(entry.entryText) // Conditional entry
				: !menu.isSeparator(entry) && entry.func !== null && menuAltAllowed.has(entry.menuName) // Standard entry
			)
		);
	}).length + disabledCount++});} // NOSONAR
}