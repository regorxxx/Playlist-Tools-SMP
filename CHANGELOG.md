# Changelog

## [Table of Contents]
- [Unreleased](#unreleased)
- [1.2.0](#110---2021-05-28)
- [1.1.0](#110---2021-05-26)
- [1.0.1](#101---2021-05-02)
- [1.0.0](#100---2021-05-02)

## [Unreleased][]
### Added
- Pools: playlist creation similar to Random Pools component. Multiple source playlists (pools) can be set to fill a destination playlist. Configurable selection length per playlist, picking method (random, from start, from end) and final sorting of destination playlist. Arbitrary presets can be added / removed.
- Presets: entire user preset list can be exported, for editing on a text editor or later importing in another Playlist Tools panel. (Only works for presets added from this release version and future ones)
- Presets:a preset json file can be imported, merging them with current ones (without overwritting).
- Readmes: Sscatter by tags readme added.
### Changed
- Query filtering: some new default presets.
- Dynamic Queries...: now allow working with multivalue tags by default. i.e. GENRE IS #GENRE# translates into (GENRE IS Folk) AND (GENRE IS World) automatically. When using using TF expressions, multivalue tags are not converted, thus the expression is executed 'as is'.
- Query filtering\Filter playlist by... (query): also converts multivalue tags when using dynamic queries.
- Reset all configuration: resetting all no longer deletes all user presets, but asks to merge them with the default ones (or discards them). Presets can also be exported (previous change) before resetting and later re-imported to do essentially the same.
- Readmes: all readmes entries now follow the same name of the menus automatically.
### Removed
### Fixed
- Search same by tags...\By... (pairs of tags): was using default search paramaters no matter the input.
- Search same by tags...\Add new entry: error when remap tags was empty.
- Query filtering\Filter playlist by... (query): last argument used was not being saved.
- Configuration: setting global forced query or playlist length only updated the properties panel, thus not applying the changes until next script reload.
- Missing font fontawesome-webfont (just cosmetic arrow on button).
- Advanced Sort...\Incremental genre/style (DynGenre): Missing sort_by_dyngenre.js file, so menu entry was not missing on previous release.

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

[Unreleased]: https://github.com/regorxxx/Playlist-Tools-SMP/compare/v1.2.0...HEAD
[1.1.0]: https://github.com/regorxxx/Playlist-Tools-SMP/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/regorxxx/Playlist-Tools-SMP/compare/v1.0.1...v1.1.0
[1.0.1]: https://github.com/regorxxx/Playlist-Tools-SMP/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/regorxxx/Playlist-Tools-SMP/compare/9df4560...v1.0.0
