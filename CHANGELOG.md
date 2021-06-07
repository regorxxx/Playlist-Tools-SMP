# Changelog

## [Table of Contents]
- [Unreleased](#unreleased)
- [1.4.0](#140---2021-06-07)
- [1.3.0](#130---2021-05-31)
- [1.2.0](#120---2021-05-28)
- [1.1.0](#110---2021-05-26)
- [1.0.1](#101---2021-05-02)
- [1.0.0](#100---2021-05-02)

## [Unreleased][]
### Added
### Changed
### Removed
### Fixed

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
- Search by Distance Cache: gets automatically refreshed whenever the descriptors crc change. i.e. it will be recalculated with any change by the user too.
- Search by Distance Descriptors: Multiple new additions.
- Portable: Additional checks for portable installations.
### Changed
- Harmonic mixing: small changes and optimizations.
- Harmonic mixing: code for pattern creation moved to camelot_wheel.js.
- Harmonic mixing: code for sending to playlist moved to helpers and reused in multiple scripts.
- Search by Distance: updated with latest changes.
- Search by Distance Debug: Greatly expanded the debug functions to check possible errors or inconsistencies in the descriptors. It should be foolproof now.
- Split tools menu into 3 submenus: Playlist\Selection\Other tools.
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

[Unreleased]: https://github.com/regorxxx/Playlist-Tools-SMP/compare/v1.4.0...HEAD
[1.4.0]: https://github.com/regorxxx/Playlist-Tools-SMP/compare/v1.3.0...v1.4.0
[1.3.0]: https://github.com/regorxxx/Playlist-Tools-SMP/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/regorxxx/Playlist-Tools-SMP/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/regorxxx/Playlist-Tools-SMP/compare/v1.0.1...v1.1.0
[1.0.1]: https://github.com/regorxxx/Playlist-Tools-SMP/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/regorxxx/Playlist-Tools-SMP/compare/9df4560...v1.0.0
