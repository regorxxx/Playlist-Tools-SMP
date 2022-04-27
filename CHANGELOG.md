# Changelog

## [Table of Contents]
- [Unreleased](#unreleased)
- [3.0.0-beta.5](#300-beta5---2021-01-13)
- [3.0.0-beta.4](#300-beta4---2021-03-06)
- [3.0.0-beta.3](#300-beta3---2021-03-02)
- [3.0.0-beta.2](#300-beta2---2021-01-17)
- [3.0.0-beta.1](#300-beta1---2021-12-23)
- [2.0.2](#202---2021-06-20)
- [2.0.1](#201---2021-06-17)
- [2.0.0](#200---2021-06-15)
- [1.4.0](#140---2021-06-07)
- [1.3.0](#130---2021-05-31)
- [1.2.0](#120---2021-05-28)
- [1.1.0](#110---2021-05-26)
- [1.0.1](#101---2021-05-02)
- [1.0.0](#100---2021-05-02)

## [Unreleased][]
### Added
### Changed
- Other tools\Write Tags: EBU tagging is now done per groups of 25 tracks (previously 100) and chromaprint tagging for 100 tracks (previously 500). Rationale: in case something goes wrong, it would be easier to re-tag missing files and less time would have been lost.
### Removed
### Fixed
- Dynamic queries: fixed queries with values after evaluation containing %, $, [, ], or '. Now they are correctly escaped within TF expressions. For ex. "$stricmp($ascii(%TITLE%),$ascii(#TITLE#))" IS 1 AND ARTIST IS #ARTIST# evaluates to "$stricmp($ascii(%TITLE%),$ascii(Didn''t want to have to do it))" IS 1 AND ARTIST IS Lovin' Spoonful. Previously it would not work as expected due to the apostrophe on the parenthesis not being escaped. Note the apostrophe at the #ARTIST# statement is left untouched though.
- Import track list: fixed queries with tag values containing ], now are correctly escaped.

## [3.0.0-beta.4] - 2022-03-06
### Added
- Buttons: split 'playlist_remove_duplicates' buttons on two; new one is named 'playlist_filter'. Now it should be easier to add multiple copies of those buttons without having to use both at the same time.
- Buttons: 'playlist_remove_duplicates', 'playlist_filter', 'search_same_by', 'search_same_style', 'search_same_style_moods', 'search_top_tracks' and 'search_top_tracks_from_date' now have a configuration menu which can be called using Shift + L. Click to set button variables (previously only available at the properties panel).
- Search similar by...: added All Music and Last.fm support by linking all their genre/styles to the graph with substitutions.
- HTML: Added statistics calculation. To run it, use the associated button, results will be shown on a popup and cached for the current session. Statistics button is now animated while processing
- HTML: Added reset view button.
- HTML: SuperGenre legend is now dragable.
- HTML: Selecting a node and pressing shift while hovering another node shows the distance (+ influences) between them.
- HTML: Selecting a node and pressing shift while hovering another node highlights the shortest path between them.
- HTML: Added favicon.
- Search similar by...: added multiple letter case checks at debug.
- Search similar by...: added accent checks (instead of single quotes) at debug.
- Search similar by...: added ASCII compatibility checks at debug.
### Changed
- Top rated tracks from...: minor menu changes. Added also previous year to current one.
- Other tools\Playlist Revive: improved items identification further using path similarity. Also added additional checks for dead items without tags and a new menu entry to find alternative tracks (with same filename) from different paths; usually used for dead items on plain-text playlists.
- Other tools\Write Tags: available tools can now be selectively enabled/disabled. 'tags_automation' button uses now its own config and multiple copies can be put on the bar (with different tools enabled).
- Other tools\Write Tags: button is now animated while using the tool on background. Also applies to the independent tool button ('buttons_tags_automation.js').
- Other tools\Check Tags: button is now animated while using the tool on background (on Async mode).
- Import track list: improved title and artist detection consider also ASCII equivalences For ex. 'Lo que sobra de mí' will match values with and without accents.
- Dynamic Queries: new preset 'Same title [...]' which outputs only tracks with same title than selection (no matter the date or artist).
- Dynamic Queries: [old and new] presets which involved usage of %title% tag have been reworked to also consider ASCII equivalences.
- Search same by tags: comparison of tags values which involve strings now also consider ASCII equivalences.
- Search similar by.: Greatly optimized console logging when sending selected tacks to console. It now outputs the entire list at once (instead of one entry per track). This reduces processing time by +2 secs for +50 tracks (the standard playlist size)... so total processing time has been reduced in most cases by half just with the logging optimization.
- Buttons: 'buttons_search_same_by', 'search_same_style', 'search_same_style_moods' have also implemented ASCII equivalences (see previous entry).equivalences.
- Buttons: Playlist Tools buttons now are shown in their own sub-folder at the button bar 'Add buttons' menu.
- Buttons: reworked 'playlist_remove_duplicates', 'search_same_by', 'search_same_style', 'search_same_style_moods', 'search_top_tracks' and 'search_top_tracks_from_date' button code. Old properties may be lost on update.
- HTML: Changed CSS layout to adjust sizes according to window.
- Presets: Minor improvements on UI presets.
- Helpers: improved sort and query expressions validity checks.
### Removed
### Fixed
- Dynamic Queries: menu is now disabled when there is no selection.
- Write tags: menu is now disabled when there is no selection.
- Search similar by...: Crash when using double pass on harmonic mixing.
- Search similar by...:: fixed multiple letter case errors.
- Search similar by...:: fixed accent usage instead of single quote.
- Helpers: rewritten sorting analysis to account for quotes not being needed at sorting for functions.
- Helpers: rewritten query analysis to fix some problems with extra spaces, quotes, etc.
- Helpers: avoid file reading crashing in any case (even if it's locked by another process).
- Helpers: fixed query checking not working due to upper/lower case mixing in some cases, should now be pretty robust with RegEx.
- Helpers: fixed UI slowdowns when required font is not found (due to excessive console logging). Now a warning popup is shown and logging is only done once per session.
- Dynamic Queries: menu is now disabled when there is no selection (instead of only requiring a track in focus).
- Other Tools\Write tags: menu is now disabled when there is no selection (instead of only requiring a track in focus).
- Other tools\Check Tags: fixed multiple crashes on menu calling.
- Logging: Progress code in multiple tools have been fixed to display more accurately the percentage progress in the log.
- Logging: non needed warning about 'name' variable not being recognized on recipes.
- Recipes: 'name' was not being excluded when trying to save a recipe from current properties.
- Properties were not being properly renumbered on some cases when moving buttons.

## [3.0.0-beta.4] - 2022-03-06
### Added
### Changed
### Removed
### Fixed
- Crash when using harmonic mixing due to a typo on the code.

## [3.0.0-beta.3] - 2022-03-02
### Added
- Dynamic queries: new option at configuration to allow evaluation of dynamic queries on multiple selected tracks, instead of only the focused item. Enabled now by default, disable it to follow the previous behavior. For ex (on 3 tracks): 'TITLE IS #TITLE#' --> '(TITLE IS O Dromos To Gramma) OR (TITLE IS Gyal Bad) OR (TITLE IS Say Me)'
- Buttons bar: menu entry to change buttons scale (for high resolution screens or non standard DPI settings).
- Buttons bar: menu entry to enable/disable properties ID on button s' tooltip.
- Buttons bar: menu entry to change toolbar orientation: Horizontal / Vertical.
- Buttons bar: menu entry to change how max button size is set according to the orientation.
- Buttons bar: buttons can now be freely moved clicking and holding the right mouse button while moving them. This is equivalent to using the menu entry to change buttons position.
- Buttons bar: menu entry to place buttons on new rows / columns if they fill the entire width or height of the panel. Does not require a reload of the panel.
- Other Tools\Write tags: added LRA calculation (Loudness Range) via ffmpeg. ffmpeg executable must be [downloaded](https://ffmpeg.org/download.html) and put into 'helpers-external\ffmpeg'.
- Harmonic mixing: new option to perform a double pass on harmonic mixing which increases the number of tracks selected for the final mix. Enabled by default.
### Changed
- Playlist history: button now has shortcuts added to tooltip. Can be hidden setting the appropriate config at Playlist Tools button. Note it will always be shown when Playlist Tools button is not being used (since config can not be changed).
- Search by distance: shortcuts info on customizable button is now configurable, i.e. can be hidden.
- Search by distance: Updated to match [2.1.0](https://github.com/regorxxx/Search-by-Distance-SMP/releases/tag/v2.1.0)
- Other Tools\Write tags: list of available tools is now shown in a submenu.
- Other Tools\Write tags: independent button now fires the same submenu found at Playlist Tools. Shift + L.Click tags files directly. Rationale: the stop and next step actions were not available if the button only performed tagging.
- Other Tools\Write tags: rewritten readme with dependencies installation instructions and a more useful description of the features.
- Buttons bar: buttons scale is now set by default according to system's DPI instead of using a fixed size. If the resulting button size is found to be greater than the panel size, a warning popup is shown.
- Playlist manipulation: merge, intersect and difference now output to console the number of added/removed tracks.
- Helpers: updated helpers.
- General cleanup of code and json file formatting.
- Removed all code and compatibility checks for SMP <1.4.0.
### Removed
### Fixed
- Playlist filtering: last input query was not being saved properly when using a dynamic query, it saved the actual values ('TITLE IS 01 - xxx') instead of the query placeholder ('TITLE IS #TITLE#').
- Selection manipulation\Jump\Next: crash when selecting last item of a playlist.
- Selection manipulation\Expand: crash when canceling input popup.
- Selection manipulation\Jump: crash when canceling input popup.
- Top rated Tracks from...: added a missing decade range and fixed another one which was inverted.
- Other Tools\Check Tags: crash due to a typo.
- Search similar by...: entries where not using proper values for some variables (like pool filtering which was supposed to be disabled).
- Search similar by...: fixed crash on pool filtering when tags where not set. Warns with a popup when config is wrong.
- Forced query: config menu to enable/disable it on specific tools did not save properly after restarting.
- Buttons bar: fixed some instances where the buttons json file was missing and the default one was used.
- Buttons bar: fixed some instances where the buttons properties were not properly moved along the button when changing position.
- Buttons bar: fixed properties bugs on 'buttons_search_same_style_moods' and 'buttons_search_same_style'.
- Helpers: file deletion failed when file was read-only.
- Helpers: file recycling has been overhauled to bypass Unix errors and shift pressing limitation (file was being deleted permanently). Now it tries 3 different methods, the last one requires an external executable and permissions may be asked by the SO.
- Other Tools\Write tags: readme was missing on the readme menu.
- Fixed some panel crashes when there was no available playlist on Foobar, so the active playlist was null.

## [3.0.0-beta.2] - 2022-01-17
### Added
### Changed
- Playlist Revive: for items already deleted from cache, only filename and path are maintained on playlists. Playlist Revive will try to compare those to find matches: using Levenshtein distance for string comparison, comparing track numbers on filenames if possible, ..., even if tags can not be compared. That should cover cases where the files were deleted long time ago or renamed. Only available when the similarity threshold is set below 100%, since they are not exact matches by definition.
- Other Tools\Write tags: menu entry to process selection is now disabled when the tool is already running on other tracks.
- Config: tag remap menu entries now show the current tag value(s).
### Removed
### Fixed
- Buttons bar: menu entry to change buttons position was not working properly.
- Other Tools\Write tags: crash due to missing Chromaprint dependency.

## [3.0.0-beta.1] - 2021-12-23
### Added
- Helpers: added full script console logging to file at foobar profile folder ('console.log'). File is reset when reaching 5 MB. Logging is also sent to foobar2000's console (along other components logging).
- Playlist manipulation: Merge, intersect and compute difference between playlists. New tools to join the tracks from 2 playlists (without duplicates), make an intersection of both or the difference. Overwrites currently selected playlist.
- Pools: added new property to pools named 'insertMethod' which may be assigned a value. 'standard' or 'intercalate' methods are currently allowed. Standard works as previous behavior, where items from sources are added to the end of the previous sources (before final sorting), therefore the list being source 1 tracks then Source 2 tracks then... Intercalate method inserts items from each source intercalating them (Source 1 Track 1, Source 2  Track 2, Source 3  Track 3, Source 1 Track 2, ...). Note intercalate method is meant to be used without final sorting, otherwise it would be overridden. This may be used to alternately play one song from a set of playlists [(instead of using foo_scheduler which has some problems for that specific use-case)](https://hydrogenaud.io/index.php?topic=121432.msg1002053;topicseen#new).
- Pools: added new default pool preset 'Top tracks mix (intercalate)' to the default list (may need to restore defaults on the menus to enable it). It's equivalent to the 'Top tracks mix' default pool but intercalating the tracks by rate instead of using a final random sorting.
- Presets: added new presets for the new 'insertMethod' pools' feature. See 'presets\Playlist Tools\pools\intercalate_playlists.json'.
- Selection manipulation\Move selection to...: new tool to move selection within current playlist to different positions (delta value, middle of the playlist or after now playing track). Readme included at readmes menu.
- Selection manipulation\Expand...: new tool to expand selection on current playlist with tracks matching a set of tags or TF expression (artist, date, ...). For ex. used to select all tracks by same artist on the playlist. Note this is equivalent to 'Playlist manipulation\Query filtering' entry, but instead of creating a new playlist, just selects the matched tracks. Readme included at readmes menu.
- Selection manipulation\Jump...: new tool to jump to next/previous track which doesn't match a set of tags or TF expression (artist, date, ...). For ex. used to jump to next album. Readme included at readmes menu.
- Selection manipulation\Scatter by tags: new tool to avoid consecutive tracks with same artist, genre or style... instead of scattering an specific tag value ('instrumental' tracks), tries to intercalate any value without repetitions for the given tag ('genre'). As seen [here](https://hydrogenaud.io/index.php?topic=121029.msg1004396#msg1004396) or [here](https://hydrogenaud.io/index.php?topic=121432.msg1002053#msg1002053) This is the selection counterpart to pool's intercalate insertion method. Readme at config is also updated.
- Selection manipulation\Select...: new entry 'Select next tracks...' which allows to select the X next/previous tracks to the focused track according to input. Negative input will select previous tracks. Remember the focused track is always displayed on the tooltip, even for multiple selected items.
- Select...\Invert selection: inverts current selection on active playlist.
- Other tools\Import track list: Reads a txt file containing a track list and finds matches, if possible, on library. The results are output to a new playlist ('Import'). The input path may be a file path or an url pointing to a txt file. Specially useful to easily create playlists (with matches from your library) from online playlists, charts, etc. (like '100 greatest rock songs', ...), skipping the need to manually add one by one the tracks to your own version of the playlist. Not found tracks are reported with a popup. Format mask is saved between calls. Also configurable filters may be set, which are not a requisite but only a preference. i.e. a track satisfying all of them is preferred over one which only satisfies a few.
- Buttons: new button. Customizable macro, which calls an specific macro of Playlist tools. Just a shortcut, to create your own buttons with arbitrary macros. Note a macro allows to simply call a single menu entry, so this is a simple way to create a button for any tool preset without requiring Js knowledge.
- Buttons: new button. Macros list, which emulates the macros sub-menu of Playlist tools showing the entire list. It's just a shortcut of it, for easy access of custom tools.
- Buttons: buttons' text color can now be customized via menus on the bar menu (R. Click on the bar).
- Script Integration\SMP Main menu: the nine Spider Monkey Panel menu entries ('File\Spider Monkey Panel') are now directly configurable within playlist tools. If you prefer to set them with other script, just disable the entire functionality (Shift + L. Click). Alternatively, you can either import your script 'Script Integration\Include script' as is or assign your own functions/scripts to the menus using Playlist Tools. This functionality is meant as an easy way to change SMP menus, instead of requiring coding everytime you want to change anything... Any Playlist Tools functionality can be assigned to the nine menus. Furthermore this is the list of available actions (popups explain what they do too):
	- Custom Menu: Assigns any Playlist Tool entry to an SMP menu. This includes macros (you can then assign an standard foobar button to a macro).
	- Custom Function: Assigns any function (by name) and allows to include a script (which can contain the assigned function). i.e. load sub-modules.
	- Skip tag from playback: Adds a 'SKIP' tag using current playback, with an intelligent switch according to time. Meant to be used along Skip Track (foo_skip) component.
	- Execute menu entry by name: Meant to be used along online controllers, like ajquery-SMP, to call an arbitrary number of tools by their menu names.
	- Device selector: Meant to be used along online controllers, like ajquery-SMP, to set ouput device by name.
	- DSP selector: Meant to be used along online controllers, like ajquery-SMP, to set DSP by name.
- Online controllers integration: see also ajquery-SMP(). When Playlist Tools is installed on a foobar server (foo_http_control), menu entries, output devices and DSP list will be available on the online controller to be executed or changed on demand. In other words, you will be able to do almost anything you do at the PC when using ajquery-SMP or another compatible online controller: dynamic queries, harmonic mixing, macros, pools, setting the output device, ... Furthermore, the nine SMP menu entries will have associated buttons on the controller, with descriptions, tooltips and dynamic icons according to what they do.
- Script Integration\Playlist Name Commands: 'Playlist listener' to execute macros\menu actions according to playlist name. Is intended as a workaround to the main limitations of SMP (main menu entries are limited in number -9-) and foobar (custom UI buttons or scripts can not be called with online controllers without coding an specific controller to do so), integrating Playlist Tools with any online controllers (compatible or not).  Playlist Names Commands allows to bypass that limitation checking current playlist names regularly for "special" names. When a playlist name starts with 'PT:', the callback fires and anything after those 3 chars is treated as a special command which will be compared to a list of known commands or tried to execute as a full menu name. For ex: 'PT:Duplicates' would be equivalent to 'Duplicates and tag filtering\Remove duplicates by...', whenever a playlist is named that way, the command is applied to the tracks contained within the playlist. There is also a readme explaining the available shortcuts and functionality.
- Search by GRAPH\WEIGHT\DYNGENRE: Key tag can now be remapped to another tag (uses 'key' by default). Configurable at properties panel. It's also directly configurable on the Search by Distance customizable button, via menus
- Search by GRAPH\WEIGHT\DYNGENRE: BPM tag can now be remapped to another tag (uses 'bpm' by default). Configurable at properties panel. It's also directly configurable on the Search by Distance customizable button, via menus
- Tag Remapping: Added option at config menu to remap key (for Harmonic Mixing and Key sorting) tag and syle/genre tags (for Dyngenre sorting). Tools based on queries are already directly configurable, so remap doesn't apply there.
- Tag Remapping: Added option at config menu to remap tags for Search By distance tool. Note changes on those tags only apply there. Key tag is shared with the other tools (and previously mentioned config menu), so changes apply on both places.
- Harmonic Mixing: now works with Open Keys too (in addition to Camelo Keys and standard notation keys).
- Logging: Added option to switch console logging at configuration submenu.
- Logging: Added option to switch profiler logging at configuration submenu.
- Logging: Added option to show/hide tooltip shortcuts at configuration submenu.
- Search by Distance: cache now gets refreshed not only when the descriptors change ('music_graph_descriptors_xxx.js' & 'music_graph_descriptors_xxx_user.js') but also when the 2 functions used to calculate the paths or the own graph constructor change and the influences method. Even if changing those functions is not planned, it ensures the cache reflects the actual state of the graph in any case. In particular, the 'influences bugfix' would have required a manual cache reset by the user without this change which now will be performed automatically. The properties panel now tracks the CRC32 of those 6 items as merged strings (instead of only the first 2).
- Search by Distance: Added 4 methods top check influences: 'fullPath', 'adjacentNodes', 'zeroNodes' and 'direct'. 'direct' is the previous behavior ("bugged") checking only the first against the last node. 'zeroNodes' the fix listed bellow. 'adjacentNodes' works like zeroNodes but without forcing the adjacent nodes to be substitutions (checks (A,B) against (Y,Z), i.e. max. 4 possible links). 'fullPath' checks all consecutive links on the path (A->B), (B->C), ...) and also applies 'adjacentNodes' logic (to check the origin and final nodes). 'adjacentNodes' is now the default behavior.
- Search by Distance: Checks graph links cache size on startup and warns when file size > 40 Mb. This is done to avoid memory leaks, since the file is fully loaded on memory and a corrupted file may increase the map size indefinitely until crashing the panel.
- Search by Distance: Customizable button now has all additional menu entries found at Playlist Tools button: debug graph, find genre/styles not on graph, reset cache, etc. i.e. both now should offer the same degree of customization and advanced tools.
- Search by distance: added new presets for Search by Distance customizable button. Added Acoustic, Instrumental and Female Vocal versions for 'Similar tracks (G)' recipe which forces only acoustic, instrumental or female vocal tracks as output. Style, genre and Picard tags (acousticness, speechiness, gender) -see below- are taken into consideration.
- Search by distance: added a submenu on customizable button to set additional query filters (along the forced query): Acoustic, Instrumental and Female Vocal tracks. They can work in conjunction with any recipe as long as the recipe does not force a query too. Filters may be added or edited on 'xxx-scripts\presets\Search by\filters\custom_button_filters.json'.
- Presets: scripts for Picard to retrieve high level tags (gender, valence, danceability, speechiness, ...) from AcousticBrainz high level data. Tags are easily configurable. AcousticBrainz Tags plugin 2.2+ is required (within Picard). Those tags are meant as a direct replacement, using an open source data model, of Spotify's tags... which can only be retrieved with an API in some software and rely on closed source models and data (new data can not be added by users). If some tracks are not in AcousticBrainz database, they may be [analyzed locally to then send send the results to their server](https://musicbrainz.org/doc/How_to_Submit_Analyses_to_AcousticBrainz) and later get the results on Picard.
### Changed
- Import Track List: caches query results for searches performed afterwards.
- Remove duplicates: optimized the code, now runs at least x2 times faster. Updated all instances where the functions were being used to call the new version (playlist revive, search by distance, queries, etc).
- All tool entries now have specific lock status checks according to their functionality (adding items, reordering, etc.) instead of checking if playlist is globally locked. Therefore some entries may now work on locked playlist, as long as the action to be performed is allowed.
- Requisites: Script requires at minimum SMP 1.5.2. now.
- Check tags: can now be set to be executed asynchronously, on the background, having a minimum impact on UI responsiveness. This is now the default behavior. Code has also been optimized, requiring now x0.96 the previous time (on synchronous mode). In async mode it takes x1.35 the previous time, a bit more but without blocking the UI. (tests done with 75.6K tracks)
- Check tags: when comparing tag values between different tags (genre -> style) to find possible errors, instead of comparing all tags with all other tags, only related groups are used (faster and more useful): [genre,style], [composer, involvedpeople, artist], etc. Configurable at properties panel.
- Macros: Are executed on synchronous mode by default (previous behavior but enforced now even for async tools).
- Macros: Possibility to set async mode on recorded macros (via popups), to execute all possible entries asynchronously (the list of async tools can be found on 'Configuration\Asynchronous processing'. Those tools will be executed on the set mode independently of the global configuration. If you want to selectively set entries in async mode, just create single macros for them and call those with another macro: Global macro -> Macro 1 (async), Macro 2 (sync), Macro 3 (sync)
- Macros: Macros set to be executed async have a flag on the menu entry to warn about it.
- Dynamic Queries: queries now only require a track on current playlist if they contain '#' char. Otherwise they are treated as standard queries and therefore don't need a selection.
- Send selection to playlist / Send playlist to playlist: omit locked playlists in their menu lists (since you can't send anything to those anyway). Contrary to the 'Remove tracks from...' behavior, this one is not configurable, since target playlists names doesn't give any info about the currently selected track (at remove menu, it tells you where that track resides, even if you can't delete it at locked playlists).
- Pools: greatly improved speed of random picking method (took easily +30 seconds for +20K tracks, now it's just a few ms).
- Search by GRAPH\WEIGHT\DYNGENRE: greatly improved speed of harmonic mixing when the pool had thousands of tracks (same code than previous change, improved shuffle method).
- Check tags: Split popup report on 3 different popups according to their content (queries, errors and exclusions).
- Alt Menu: Reworked menu to enable/disable tools (Shift + L. Click). List is split in multiple columns (instead of one big vertical list), separators have also been added to differentiate easily menus and submenus.
- Properties: property names have been changed to omit the number before the description, this should allow to reuse properties even if the menus are disabled or loaded in different order (otherwise they would be re-numbered).
- Buttons: toolbar configuration menu now is opened with R. Click (instead of Shift + L. Click on empty space). This is done to allow opening the menu anywhere even when the bar has no empty space left anymore.
- Buttons: button toolbar now saves only button filenames on json (instead of the absolute path), working now on portable installations which different drive letters too.
- Buttons: colors are changed without reloading the panel.
- Buttons framework: default icon size is now bigger.
- Buttons: loading buttons using the customizable toolbar will show their associated readme (if it exists).
- Buttons: restoring defaults buttons on the toolbar will show the readme of all the restored buttons.
- Buttons: replaced the readme entry on the toolbar menu with a submenu pointing to all readmes of every button (note this does not replace but complement the Playlist Tools' readmes).
- Buttons: submenu custom button now also allows to set nested submenus, not only the main ones. Therefore any tool may be easily accessible on its own button. For ex: 'Playlist Manipulation\Select...\' instead of only 'Playlist Manipulation\'.
- Buttons: tooltips for buttons associated to Playlist Tools now follow the global "show shortcuts" config. i.e. if shortcuts are hidden in the main button's tooltip, then they will also be hidden on the associated buttons' tooltip.
- Buttons: key modifiers are always shown on the tooltip as long as the key is being pressed, independently of the "show shortcuts" config. i.e. they can be hidden by default but will be shown as soon as you press the right key.
- Buttons: the list of buttons when adding a new one is now split by categories to easily found them according to their functionality. Same with their readme popup.
- Search by Distance: influences were not being correctly parsed when the original or the final node was a substitution (zero weight). Now adjacent nodes which may be substitutions are also checked at both sides, for ex for this path: Hip-Hop <- Rap_supergenre <- Rap_cluster <- Rythm Music_supercluster <- Blue_Note_cluster <- Blues_supergenre <- Blues. Where Hip-Hop is a substitution for Rap_supergenre,  Rap_supergenre is checked against Blues_supergenre and/or Blues for (anti)influences. Note it doesn't check for links at Hip-Hop since the influences link are always added to the generic items by design (in this case Rap_supergenre_supergenre), so there is max. 1 possible link. (note this may be overridden by the default behavior listed at top)
- Search by Distance: Graph links cache is now calculated asynchronously whenever it's required (on first initialization or when manually forced to do so, thus improving the startup time the first time the panel it's loaded and not blocking the UI on posterior updates.
- Search by distance: Custom Search by Distance button rewritten, no functionality changes. Theme/recipe info values are now saved without the entire text, cleaner.
- Search by distance: Custom Search by Distance button now has a menu entry to rename it after the first time (instead of using the properties panel).
- Search by distance: changed debug to show popup even after test passing (meant to be used along Playlist Tools). Default behavior remains the same, popup only appears if errors are found. When calling the menu entry to test the graph, it shows a popup with the results in any case.
- Search by distance: Updated descriptors. Added multiple genre and styles to punk, rock, pop, folk, industrial, downtempo and metal super-genres, along their style clusters, substitutions and influence relations.
- Menu framework: added bool variable (bExecute) to .btn_up(x, y, object, forcedEntry = '', bExecute = true, replaceFunc = null) which allows to simulate the menu without executing any related entry function. 
- Menu framework: added func variable (replaceFunc) to .btn_up(x, y, object, forcedEntry = '', bExecute = true, replaceFunc = null) which allows to replace the related entry function with a custom one, whenever bExecute is also false. Can be used to paste to clipboard entry names easily simulating the menu usage. Used along macro recording, allows to save a macro without actually executing the menu tools selected. Also meant to make easier setting the main SMP menus.
- Installation: Installation path may now be changed by editing 'folders.xxxName' variable at '.\helpers\helpers_xxx.js'. This is a workaround for some SMP limitations when working with relative paths and text files, images or dynamic file loading.
- Helpers: updated. Whenever a folder needs to be created to save a new file, the entire tree is now created if needed. Previously it would fail as soon as any folder did not exist. This greatly speeds up setting panels since now the final folder does not need to exists at all to work, since it will be created on the fly.
- Helpers: Split 'helpers_xxx_playlists.js' into 2 files (new one is 'helpers_xxx_playlists_files.js').
- Helpers: additional checks at json loading on all scripts. Warnings via popup when a corrupted file is found.
- Properties: added extensive checks to most properties (specially to check json strings).
- All json files are now saved as UTF-8 without BOM. All json files are now read as UTF-8 (forced).
### Removed
### Fixed
- Import Track List: while reading text files, they are now split by lines using any of the possible [escape sequence combinations](https://en.wikipedia.org/wiki/Newline) and not only windows ones (\r\n). This should allow to correctly read any file created in any SO (no longer limited to Windows ecosystem).
- Pools: output playlist was not being checked for locked status properly.
- Pools: Playlist files from Playlist-Manager-SMP were not being read properly due to a typo on path detection.
- Macros: Typo on one of the entries of the 'Test tools' macro (so it was being skipped instead of executed).
- Macros: Crash when trying to save a macro with duplicated name.
- Most played tracks from...\From last...: was reporting tracks less played in a given period, instead of the most played due to a typo. Now fixed (most played tracks within the given period will be first).
- Playlist manipulation: 'Go to/close playlist' entries were greyed out when current playlist had no items when they should have been available
- Other tools\Playlist Revive: undefined queries when file didn't had AUDIOMD5 tag (from foo_md5) are now skipped. The plugin was never a requirement, but an extra to find faster matches by query. If you use the plugin, their tags will also be used; otherwise, the tool queries by title and compares md5 file info first (if available) or file size (for exact match) and then all tags to compute similarity.
- Other tools\Playlist Revive: reviving selection (instead of entire playlist) no longer outputs only the selected items, but recreates the entire playlists; dead items with matches are replaced and dead items without a match or other items are left untouched. Current item selection will also remain selected after processing.
- Other tools\Playlist Revive: bug on reviving All playlists which made only active playlist to be actually changed (the rest was analyzed but not touched).
- Other tools\Playlist Revive: crash if some track had zero tags.
- Other tools\Playlist Revive: tracks with commas (',') on title were not being recognized as intended due to tag splitting as soon as that char was found, now fixed. There may be other instances/tools where a tag value has a comma but is not supposed to be 2 different values, although they require to be treated on a case by case basis so the default behavior has been left untouched. Rationale: title format already list tag values separated by comma; replacing that behavior would require to edit all tags within TF scripts like this %artist% -> $meta_sep(artist,###). It would also affect user configurable tags and remapping within scripts and become a nightmare to cover all possible use-cases.
- Queries: Fixed 'ALL' using global forced queries at some points (see 2.0.1 changes), and empty queries not allowed at input popups.
- Callbacks: wrapped and merged all callbacks at Playlist Tools or any other script, so they can easily merged. Previously at least one of them was being overridden by the last one loaded (only affected people wich used Search By Distance buttons at different panels at the same time).
- Buttons: toolbar had a typo on the property. After updating the old property will be unused, thus recreating the entire bar again. If you want to restore the old one, just copy the old filename at the properties panel to the new property.
- Buttons: toolbar now also deletes unused properties when removing buttons.
- Buttons: toolbar now also rewrites properties of buttons which have multiple copies, instead of requiring to set up them everytime a copy at the left is removed. It considers multiple copies of the same button get their properties indexed according to their positions too; thus, removing the 2nd copy of a button, will shift by one all copies at greater indexes (at its right) along their properties. The same applies when moving them instead of removing.
- Buttons: Fixed multiple button names while logging loading on console.
- Menu framework: '&' char not showing (or making next char underscored) on created dynamic menus (when it was part of a playlist name for ex.), since they were not doubled. Now the framework automatically checks for names with '&' and doubles them ('&&' are skipped), so they are displayed right.
- Search by distance: Fixed crash while trying to parse the cache file if it's being edited at the same time or corrupt.
- Multiple minor improvements and fixes on path handling for portable installations.
- Multiple minor improvements and fixes when saving files on non existing folders.

## [2.0.2] - 2021-06-20
### Added
### Changed
- Duplicates of main buttons files are now on the root, instead of using symlinks. Some file archivers, like 7zip, did not decompress correctly the releases... 
### Removed
### Fixed

## [2.0.1] - 2021-06-17
### Added
- Shortcuts: now saved as json file (at '.\profile\js_data\playlistTools_shortcuts.json'), to be easily configurable. Shortcuts can be arbitrarily added, changed or deleted. Menu entries linked to a shortcut will show the keys in their name tabbed to the right. See popup when enabling them. New entry to open shortcuts file.
- Standard queries...: New default standard queries to retrieve entire library with or without forced query. Restore defaults to load them. (To be used with macros)
- Macros: New default macros to check all library tags (automates retrieving entire library and using check tags). Restore defaults to load them.
- Global Forced Query: 'Playlist Manipulation\Query filtering' is now also added to the list of toogable forced query application.
### Changed
- Queries behavior on Standard queries, Dynamic queries, Query filtering and Pools menus is now unified. 'ALL' always retrieves entire source, no matter if global forced query is enabled or not. Empty retrieves source filtered with forced query (or behaves as 'ALL' if it's disabled). Updated related readmes with the changes.
- Config menu: reworked a bit the menus for Global forced query, Shortcuts and presets.
### Removed
### Fixed
- Check tags: Fixed typo on dictionaries path after file restructuring on latest release. Recommended to reset folder calling 'Other Tools\Check tags\Configure dictionary...\Sets dictionaries folder...' and deleting the current value. Then the default one will be restored.
- Duplicates and Tag filtering:  User settings (tags and number allowed) were not being loaded at startup.
- Standard queries...: menu error when using a query with 'ALL' and global forced query was enabled.
- Typo on 'Top rated Tracks from...\From year...'. Adjusted 'Test Tools (with input)' macro with the change. Recommended to restore defaults for macros to apply the change (and change any user-set macro with that entry).

## [2.0.0] - 2021-06-15
### Added
- Playlist Manager Integration: Listeners to retrieve tracked playlist paths from Playlist Manager panels.
- Pools & Playlist Manager Integration: May now use playlist files tracked by Playlist Manager panels as source. i.e. Playlist A would match first a playlist within foobar with same name, then a playlist file with matching '#PLAYLIST:Playlist A' tag and finally any playlist file named 'Playlist A.m3u8'. Autoplaylists are excluded (use queries instead) and fpl files too. This feature allows to use virtual playlists as containers, where you can easily collect tracks (since Playlist Manager allows to send tracks directly to a file without loading it) to be used later on pools without polluting the UI with tons of dummy playlists.
- Pools & Search by GRAPH\WEIGHT\DYNGENRE: May now use the output from 'Search by (method)' as source, setting source name as '_SEARCHBYGRAPH_X', '_SEARCHBYWEIGHT_X', etc. (where X is any number). Therefore it allows intelligent playlist creation instead of using queries for the pool. Multiple sources can be set this way (beware of computing time) and mixed with the other sources (library and playlists). This new source may only be used by creating a preset pool with a text editor, since it requires to set so many arguments that is not reasonable to do it via popups. 'recipe' and 'theme' (see below) keys must be set when using this type of source (a recipe may force a theme too). Both may point to a filename (i.e. another preset like themes -see below-) or contain the arguments object. Examples are offered in the presets folder for all use-cases.
- Search by GRAPH\WEIGHT\DYNGENRE: now allows user configurable menus (which can only be added using the properties panel or loading presets). Reasoning: it's not practical to add so many popups to just set a new entry but it makes sense to be able to add new entries to the tool... so it's left to the user to add them manually. The presets may link to recipes and themes as arguments too (see below).
- Search by distance: Recipes presets may be used to set variables of the function. Whenever the argument is set, it's used instead of related property. Custom button now allows to use a recipe file. Once set, button would always use the recipe as arguments instead of the properties variables. A recipe may force the use of a theme.
- Search by distance: custom button now allows to set the recipe file used by pressing Ctrl + L. Click. 'None' would use the current properties variables, which is the default behavior.
- Search by distance: themes presets may be used as reference instead of tracks. Whenever the argument is set, it's used instead of the selection. Custom button now allows to use a theme file. Once set, button would always use the theme as reference instead of the current selection.
- Search by distance: custom button now allows to set the theme file used by pressing Shift + L. Click. 'None' would use the current selection, which is the default behavior.
- Search by distance: custom button now allows to create a theme file using the currently focused track's tags.
- Configuration\Search by distance: new entry to create a theme file using the currently focused track's tags.
- Readmes: for Presets usage, Global Shortcuts, Include Script, Search by GRAPH\WEIGHT\DYNGENRE (specific readmes for each method) and Recipes\Themes.
- Presets: new presets for Search by GRAPH\WEIGHT\DYNGENRE.
- Buttons: new 'buttons_toolbar.js' toolbar which can be customized without editing the js file. Allows to enable/disable buttons -even add multiple copies- on demand and customize toolbar background color (L. Click on the bar).
- Buttons: new 'buttons_playlist_history.js' button. On click switches to previous playlist (since it's a switch, pressing it indefinitely always switches between the same 2 playlists). Shift + L. Click shows the entire list of previous playlists.
### Changed
- Popups: all titles renamed to script name + sub menu name.
- Presets: current date is added as description when exporting user presets or creating a backup.
- Presets: now include a description ('readme' key) which is shown after importing them. Property associated is also shown (the one linked to each configurable menu), along the entries -ny name- which will be imported. Presets are not imported until popup is accepted.
- Search by distance: shows on console the track or theme used as reference (name and path).
- Search by distance: custom button code cleanup and improvements on name changing.
- Search by distance: custom button tooltip shows the theme and recipe being used, along tips to change them.
- Readmes: updated pools readme with latest changes.
- Data: json file for presets is now formatted to be readable.
- Portable: when properties are set for the first time, now use relative paths on profile folder for portable installations (>= 1.6). When possible, any other stored path is also stored as relative paths (for example themes or recipes on buttons).
- Buttons: icons to all buttons.
- Buttons framework: skip icon drawing if font is not found.
- Buttons framework: allow a menu when clicking on the panel (and not on buttons).
- Helpers: warn about missing font on console if trying to load a font and is not found.
- Code refactoring and cleanup.
- Split all buttons into examples, toolbar and buttons folder. 'buttons_toolbar.js' is now the main script -in root folder- which can be loaded within a panel for easy configuration of buttons from this repository or any other. 'buttons_playlist_tools.js' is the independent button.
### Removed
### Fixed
- Presets: after resetting all config, presets were not being deleted.
- Presets: duplication after adding multiple presets.
- Pools: crash removing entries due to a typo.
- Search by distance: setting both genre and style weights to zero output nothing with GRAPH method instead of using the values for the graph and not for weighting.
- Search by distance: when playlist length is set to Infinite, warnings are no longer shown about number of tracks being less than it (which obviously always happened).

## [1.4.0] - 2021-06-07
### Added
- Search by Distance: 4 sets of buttons, one for each method: GRAPH, WEIGHT, DYNGENRE + ONE CONFIGURABLE (method at properties). (This in addition to the fully customizable buttons)
- Shortcuts: Some shortcuts have been added (global shortcuts without requiring panel to be in focus). Are shown on the related menu entries tabbed to the right. Experimental feature, read the popup before activating it at config menu.
- Other tools\Include Scripts: easily include ('merge') multiple SMP scripts into the same panel, thus not wasting multiple panels. Useful for those scripts that don't require any UI, user interaction,... like scripts which set the main menu SPM entries (File\\Spider Monkey Panel). Experimental feature, read the popup before activating.
- Configuration: pools have toogable forced query now.
- Presets: All Music and Last FM presets which use their genre/mood tags (for Search by tags, Dynamic Queries, Playlist Filters and Pools). Pools moods presets (Happy Mix, Sad Mix, Angry Mix, Chill Mix and Slow Chill Mix). Pools genre presets (Rock mix, Hip-Hop mix, etc.).
- Macros: 2 macros examples to test all tools (with or without input). Since all input box have defaults, you can simply press enter and process all without reading for testing.
### Changed
- Search by Distance\GRAPH: mean distance is now also divided by the number of genre/styles of the reference track. That should give more results for tracks with too many tags, while not changing so much for the rest. Distance filters have been updated accordingly in all buttons to reflect the change (and users should do the same in their customized buttons).
- Search by Distance: All buttons have not needed properties deleted to not confuse users about things changed on properties not being reflected on the buttons.
- Buttons framework: updated for better shortcuts and macros compatibility.
- Helpers: Moved all external libraries to 'helpers-external'.
- Helpers: Split 'helpers_xxx.js' file into multiple ones for easier future maintenance.
- Moved all SMP scripts without UI (those not meant to be loaded directly on panels) to 'main'.
### Removed
### Fixed
- Search Same By: button did not work correctly due to bad property parsing.
- Search Same By: bypass query checking if current track has no tags configured on new entry addition. Previously it was not saved due to checking error.
- Playlist manipulation\Harmonic mix: was not working on entire playlist, only on selection in both cases.
- Search by Distance: crashes when trying to access non present properties on the arguments (found while applying the previous changes).
- Search by Distance: crash when sharing cache between 2 panels due to a typo.
- Search by Distance: crash when pool was smaller than set playlist length.
- Pools: using random picking method, sometimes the last element was omitted, thus resulting on (total length - 1) tracks per source choosen.
- Pools: when only 1 track is retrieved from a source, skips picking methods and adds it directly to the final playlist. Previously it was simply skipped (due to previous bug).
- Pools: not working when current playlist was empty. It tried to check for dynamic queries even when there was none, thus failing wihtout a track to check against.
- Pools: random picking method was not really random due to using sort + random method. Using an array shuffle now instead.
- Select...\Select random...: not really random due to using sort + random method. Using an array shuffle now instead.
- Search by Distance: in key mixing and random picking not really random due to using sort + random method. Using an array shuffle now instead.
- Harmonic mix\Harmonic mix from...: not really random due to using sort + random method. Using an array shuffle now instead.
- Tooltip: missing new line before shortcuts tips.

## [1.3.0] - 2021-05-31
### Added
- Pools: playlist creation similar to Random Pools component. Multiple playlists sources (pools) can be set to fill a destination playlist. Configurable selection length per source, query filtering, picking method (random, from start, from end) and final sorting of destination playlist. Arbitrary presets can be added / removed.
- Pools: the library becomes a source when no playlist name is given. In that case the query is used to retrieve items from the library. At that point is equivalent to using a playlist as a source. i.e. you can mix sources using playlists and library, or even using multiple times the library as source. (This is obviously a shorthand to recreate first the source playlists with macros using queries)
- Pools: queries can also use dynamic queries format, where #TAG# is replaced with value for the currently focused track. i.e. it can create dinamic pools where the query changes according to the selection, thus not forcing an specific playlist type. A 'GENRE IS #GENRE#' source would translate into a rock, jazz, ... playlist according to current selecion. (This is obviously a shorthand to recreate first the source playlists with macros using dynamic queries)
- Presets: entire user preset list can be exported, for editing on a text editor or later importing in another Playlist Tools panel. (Only works for presets added from this release version and future ones)
- Presets: a presets json file can be imported, merging them with current ones (without overwritting).
- Readmes: Sscatter by tags readme added.
- Playlist history: New tool to traverse through the last active playlists by name or simply previous one (useful for macros since you can go back and forth between 2 arbitrary playlists without knowing their names). The tool tries to track playlists even if they are reordered after saving them to the history, only possible if names are unique.
### Changed
- Query filtering: some new default presets.
- Dynamic Queries...: now allow working with multivalue tags by default. i.e. 'GENRE IS #GENRE#' translates into '(GENRE IS Folk) AND (GENRE IS World)' automatically. When using using TF expressions, multivalue tags are not converted, thus the expression is executed 'as is'.
- Dynamic Queries...: standard queries may be added -only- to the end of a dynamic query expression. i.e. 'GENRE IS #GENRE# AND NOT (%rating% EQUAL 2 OR %rating% EQUAL 1)' translates into '(GENRE IS Psychedelic Rock) AND (GENRE IS Hard Rock) AND NOT (%rating% EQUAL 2 OR %rating% EQUAL 1)'. Merging both types of expressions in other positions will not work as intended.
- Dynamic Queries...: to work reliably with multiple dynamic queries on the same expression they must be enclosed on parenthesis, that way the code knows up to what point it must expand the queries. i.e. '((GENRE IS #GENRE#) OR (STYLE IS #STYLE#))' translates into '(((GENRE IS Psychedelic Rock) AND (GENRE IS Hard Rock)) OR ((STYLE IS Acid Rock) AND (STYLE IS Live)))'. Doing it in any other way will not work as intended.
- Query filtering\Filter playlist by... (query): also converts multivalue tags when using dynamic queries.
- Reset all configuration: resetting all no longer deletes all user presets, but asks to merge them with the default ones (or discards them). Presets can also be exported (previous change) before resetting and later re-imported to do essentially the same. If merging is not chosen, then a backup is automatically created.
- Readmes: all readmes entries now follow the same name of the menus automatically.
- Readmes: Dynamic Queries's readme updated with examples and usage rules.
### Removed
### Fixed
- Search same by tags...\By... (pairs of tags): was using default search paramaters no matter the input.
- Search same by tags...\Add new entry: error when remap tags was empty.
- Query filtering\Filter playlist by... (query): last argument used was not being saved.
- Configuration: setting global forced query or playlist length only updated the properties panel, thus not applying the changes until next script reload.
- Missing font fontawesome-webfont (just cosmetic arrow on button).
- Advanced Sort...\Incremental genre/style (DynGenre): Missing sort_by_dyngenre.js file, so menu entry was missing on previous release.
- Changing Global Forced Query via menus also changed Global Playlist Length.

## [1.2.0] - 2021-05-28
### Added
- Dynamic Queries: sorting can be set (on user configured presets).
- Alt Menu: Shift + L. Click on menu button allows to switch some entries functionality. Individual tools or entire submenus may be disabled/enabled. When all entries from a tool are disabled, the entire script files associated are omitted at loading.
- Standard Queries: new menu to apply standard queries and save user configured presets. Sorting too. (meant to be used along macros as an "autoplaylist" tool combined with other tools)
- Selection: added Global Playlist length as random # selection.
- Cut playlist length: added Global Playlist length as option (from start and end).
- Configuration: can set to which tools Forced Query is applied: Standad Queries, Dynamic Queries, Search same by tags. In any other case, it's always applied (if not empty).
### Changed
- Macros: Entry name for last call and forced entries now omits ('main\' or the main menu name) when the entry resides on the main menu. i.e. just use the entry name for main menu entries, and submenu\entry name for the rest.
- Menu framework: updated.
- Legacy Sort: arbitrary sort presets can be added / removed. Standard foobar sorting. Can be undone.
- Advanced Sort: Can be undone.
### Removed
### Fixed
- Dynamic Queries: adding a new entry no longer executes it (thus creating a playlist too).
- Search same by tags: didn't apply user set playlistLength and forcedQuery to created playlists (using functions defaults instead).
- Cut playlist length: didn't allow undo.
- Send playlist's tracks to...: didn't allow undo.
- Remove tracks from...: didn't allow undo.
- Send selection to...: didn't allow undo.

## [1.1.0] - 2021-05-26
### Added
- Macros: Pre-recorded multiple calls to different menu entries. Save clicked entries by name.
- Select Menu: New menu meant to be used along macros. Select All / Clear selection. Select first / last track. Select random track (single) /random # tracks (multiple). Delete selected tracks / Non selected tracks. Select by halves. Select by thirds. Select by quarters.
- Cut playlist Menu: New menu meant to be used along macros. From start. From end. (multiple numbers)
- Sort Menu: New menu meant to be used along macros. Randomize, reverse, by BPM, by Mood, by Date, by Key (Camelot Wheel), by genre/style (DynGenre)
- Send playlist to playlist: New menu meant to be used along macros. Sends all tracks from current playlist to another playlist.
- Close playlist: New menu meant to be used along macros.
- Go to playlist: New menu meant to be used along macros.
- Find or create playlist: New menu meant to be used along macros.
- Send selection to playlist: New menu meant to be used along macros.
- Harmonic mixing: multiple debug additions.
- Search by Distance: New config menu.
- Search by Distance: Entry to compute and show graph on browsers.
- Search by Distance: Entries to descriptors.
- Search by Distance: New tool to find genre or styles not set on the graph (descriptors).
- Search by Distance: New entry to test the Graph on demand for errors.
- Search by Distance: New entry to test the Graph on demand against a set of paths predefined on 'music_graph_test_xxx.js'.
- Search by Distance: New entry to reset the Graph cache on demand.
- Search by Distance Cache: is now saved to a json file and reused between different sessions. Cuts loading time by 4 secs for 70K tracks on startup (!).
- Search by Distance Cache: gets automatically refreshed whenever the descriptors CRC change. i.e. it will be recalculated with any change by the user too.
- Search by Distance Descriptors: Multiple new additions.
- Portable: Additional checks for portable installations.
### Changed
- Harmonic mixing: small changes and optimizations.
- Harmonic mixing: code for pattern creation moved to camelot_wheel.js.
- Harmonic mixing: code for sending to playlist moved to helpers and reused in multiple scripts.
- Search by Distance: updated with latest changes.
- Search by Distance Debug: Greatly expanded the debug functions to check possible errors or inconsistencies in the descriptors. It should be foolproof now.
- Split tools menu into 3 sub-menus: Playlist\Selection\Other tools.
### Removed
- Removed all lodash dependence and deleted helper.
### Fixed
- Search by Distance Descriptors: Multiple fixes on descriptors found with the new debug code.
- Buttons framework: icon bugfix.
- 'Top rated Tracks from...\From year' crash on input.
- 'Most Played Tracks from Date' crash.

## [1.0.1] - 2021-05-02
### Added
### Changed
### Removed
### Fixed
- Hotfix for harmonic mixing. Adds limits to key searching and playlist length.

## [1.0.0] - 2021-05-02
### Added
- First release.
### Changed
### Removed
### Fixed

[Unreleased]: https://github.com/regorxxx/Playlist-Tools-SMP/compare/v3.0.0-beta.5...HEAD
[3.0.0-beta.4]: https://github.com/regorxxx/Playlist-Tools-SMP/compare/v3.0.0-beta.4...v3.0.0-beta.5
[3.0.0-beta.4]: https://github.com/regorxxx/Playlist-Tools-SMP/compare/v3.0.0-beta.3...v3.0.0-beta.4
[3.0.0-beta.3]: https://github.com/regorxxx/Playlist-Tools-SMP/compare/v3.0.0-beta.2...v3.0.0-beta.3
[3.0.0-beta.2]: https://github.com/regorxxx/Playlist-Tools-SMP/compare/v3.0.0-beta.1...v3.0.0-beta.2
[3.0.0-beta.1]: https://github.com/regorxxx/Playlist-Tools-SMP/compare/v2.0.2...v3.0.0-beta.1
[2.0.1]: https://github.com/regorxxx/Playlist-Tools-SMP/compare/v2.0.1...v2.0.2
[2.0.1]: https://github.com/regorxxx/Playlist-Tools-SMP/compare/v2.0.0...v2.0.1
[2.0.0]: https://github.com/regorxxx/Playlist-Tools-SMP/compare/v1.4.0...v2.0.0
[1.4.0]: https://github.com/regorxxx/Playlist-Tools-SMP/compare/v1.3.0...v1.4.0
[1.3.0]: https://github.com/regorxxx/Playlist-Tools-SMP/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/regorxxx/Playlist-Tools-SMP/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/regorxxx/Playlist-Tools-SMP/compare/v1.0.1...v1.1.0
[1.0.1]: https://github.com/regorxxx/Playlist-Tools-SMP/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/regorxxx/Playlist-Tools-SMP/compare/9df4560...v1.0.0
