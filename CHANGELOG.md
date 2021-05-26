# Changelog

## [Table of Contents]
- [Unreleased](#unreleased)
- [1.1.0](#110---2021-05-26)
- [1.0.1](#101---2021-05-02)
- [1.0.0](#100---2021-05-02)

## [Unreleased][]
### Added
### Changed
### Removed
### Fixed

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

[Unreleased]: https://github.com/regorxxx/Playlist-Tools-SMP/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/regorxxx/Playlist-Tools-SMP/compare/v1.0.1...v1.1.0
[1.0.1]: https://github.com/regorxxx/Playlist-Tools-SMP/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/regorxxx/Playlist-Tools-SMP/compare/9df4560...v1.0.0
