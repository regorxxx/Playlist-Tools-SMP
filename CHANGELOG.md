# Changelog

## [Table of Contents]
- [Unreleased](#unreleased)
- [3.0.0-beta.26](#300-beta26---2023-05-08)
- [3.0.0-beta.25](#300-beta25---2023-03-09)
- [3.0.0-beta.24](#300-beta24---2023-03-08)
- [3.0.0-beta.23](#300-beta23---2023-03-08)
- [3.0.0-beta.22](#300-beta22---2023-03-05)
- [3.0.0-beta.21](#300-beta21---2023-03-04)
- [3.0.0-beta.20](#300-beta20---2023-03-04)
- [3.0.0-beta.19](#300-beta19---2023-02-22)
- [3.0.0-beta.18](#300-beta18---2023-02-21)
- [3.0.0-beta.17](#300-beta17---2023-02-19)
- [3.0.0-beta.16](#300-beta16---2023-02-15)
- [3.0.0-beta.15](#300-beta15---2022-08-22)
- [3.0.0-beta.14](#300-beta14---2022-08-21)
- [3.0.0-beta.13](#300-beta13---2022-08-12)
- [3.0.0-beta.12](#300-beta12---2022-08-10)
- [3.0.0-beta.11](#300-beta11---2022-08-09)
- [3.0.0-beta.10](#300-beta10---2022-08-07)
- [3.0.0-beta.9](#300-beta9---2022-08-06)
- [3.0.0-beta.8](#300-beta8---2022-08-05)
- [3.0.0-beta.7](#300-beta7---2022-05-23)
- [3.0.0-beta.6](#300-beta6---2022-05-04)
- [3.0.0-beta.5](#300-beta5---2022-04-13)
- [3.0.0-beta.4](#300-beta4---2022-03-06)
- [3.0.0-beta.3](#300-beta3---2022-03-02)
- [3.0.0-beta.2](#300-beta2---2022-01-17)
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
- Global Forced Query: 'Top Rated Tracks from...', 'Most played Tracks from...' and  'Most played Tracks' are now also added to the list of toogable forced query application. This addition should cover all existing tools where the forced query is applicable.
- Search by tags (queries): new option to specify a picking bias (instead of using the input order of appearance). i.e. tracks may be preferred by higher rating, etc. Enabled by default.
- Remove duplicates: new setting at button to prefer tracks by a given TF expression. By default by higher rating and not live tracks.
- Show duplicates: new setting at button to prefer tracks by a given TF expression. By default by higher rating and not live tracks.
- Playlist filter: new setting at button to prefer tracks by a given TF expression. By default by higher rating and not live tracks.
- Configuration: new setting to set de-duplication bias is at 'Configuration\Duplicates handling...\'. (this only applies to Playlist Tools button for tools listed below)
### Changed
- Last.fm: button is now animated during all asynchronous tasks.
- Other tools\Import track list: tracks are now also preferred by higher rating (if possible).
- Pools: when removing duplicates, chosen tracks are now preferred by higher rating and not live tracks (if possible). This is apart from the forced query filtering (which may result on this feature being irrelevant in some use cases).
- Top Rated Tracks from...: when removing duplicates, chosen tracks are now preferred by higher rating and not live tracks (if possible). This is apart from the forced query filtering (which may result on this feature being irrelevant in some use cases).
- Most played Tracks from...: when removing duplicates, chosen tracks are now preferred by higher rating and not live tracks (if possible). This is apart from the forced query filtering (which may result on this feature being irrelevant in some use cases).
- Most played Tracks: when removing duplicates, chosen tracks are now preferred by higher rating and not live tracks (if possible). This is apart from the forced query filtering (which may result on this feature being irrelevant in some use cases).
- Search by tags (combinations): when removing duplicates, chosen tracks are now preferred by higher rating and not live tracks (if possible). This is apart from the forced query filtering (which may result on this feature being irrelevant in some use cases).
- Search by tags (queries): when removing duplicates, chosen tracks are now preferred by higher rating and not live tracks (if possible). This is apart from the forced query filtering (which may result on this feature being irrelevant in some use cases).
### Removed
### Fixed
- UI: tooltip flickering while pressing Shift/Ctrl over a button in icon-only mode.

## [3.0.0-beta.26] - 2023-05-08
### Added
- Last.fm: menu entries are now available as dynamic SMP menus (toogable setting).
- Top Rated Tracks from...: pressing shift when clicking the menu entries now randomizes the tracks taken from the pool (according to rating and date), instead of sorting them by play count (which always output the same tracks if play count doesn't change). i.e. if someone wants to listen their top rated tracks from the 2000s but different sets of tracks on every listening session, not always the same most rated and most played tracks, the randomize modifier could be used.
- Pools: new 'smartShuffle' option for pools which mimics 'Selection manipulation\Shuffle' feature on the output by set tag. Check '.\presets\Playlist Tools\pools\allowedKeys.txt' for usage and examples.
- Selection manipulation\Shuffle: additional option to scatter to scatter instrumental, live and other tracks while respecting the smart pattern by tag (usually Artist). For ex. if it can swap tracks without altering the Artist proportion for a given range of tracks, thus moving an instrumental track to another position to soft-limit the appearance of consecutive instrumental tracks. Same rationale applies for live tracks or other special conditions. This somewhat ensures any cluster of tracks is as diverse as possible.
- Selection manipulation\Shuffle: additional options for the Spotify-like smart shuffle to prioritize tracks by Rating, Play Count (original Spotify's behavior), Last played date, randomly...
### Changed
- Last.fm: no longer requires [original package](https://github.com/L3v3L/foo-last-list-smp), fully integrated now. Reason: original package follows a design not fully compatible with some of the new features added.
- Last.fm: better library matching of extra chars (for ex. in original package '.38 Special' would not match '38 Special').
- Last.fm: better library matching removing unwanted title words (remastered, ...).
- Playlist filter: pressing Ctrl + L. Click now outputs all duplicates found (like the remove duplicates button). Pressing Ctrl + Shift + L. Click outputs only N duplicates following the buttons settings.
- Console: multiple improvements when logging to file for FbMetadbHandle, FbMetadbHandleList, Error and unknown instances (totally irrelevant except for debug purposes).
- Console: menu entries are no longer logged to console after clicking (except when pressing Ctrl before opening the button's menu).
- UI: standardized and shortened all current/locked/playing playlist flags text in menu entries related to playlist and selection manipulation. i.e. 'my playlist (current)' instead of 'my playlist (current playlist)' or 'my playlist (current | playing)' instead of 'my playlist (current playlist) (playing playlist)'.
- Buttons: Last.fm button's icon to font, instead of png image; scales better on different DPI settings.
- Buttons: macros button's icon to half hourglass; blends better on dark and light themes.
- Buttons: top tracks button's icon to a heart without filling; blends better on dark and light themes.
- Buttons: Playlist Tools submenu custom button's icon now changes according to the associated submenu.
- Buttons: search same button's icon to magnifying glass with a plus; more intuitive than previous icon (link).
- Buttons: profiler logging for 'search_by_tags_combinations', 'search_by_tags_queries', 'search_top_tracks', 'search_top_tracks_from_date', 'playlist_filter', 'playlist_remove_duplicates' and 'playlist_show_duplicates' button now follows Playlist Tools button config, disabled otherwise.
- Helpers: updated helpers.
### Removed
### Fixed
- Last.fm: tracks are now added preserving last.fm order. Workaround for AddLocations being async, used on original package, which may results on tracks not being inserted on playlist following the original order.
- Last.fm: link caching on input popups not working, regression on original package 1.2 version.
- Other Tools\Write tags: tool was checking for x64 binary existence on x32 systems (thus needing both instead of only the latter).
- Other Tools\Write tags: workaround for [Wine's CMD pipes bug](https://hydrogenaud.io/index.php/topic,120978.msg1024697.html#msg1024697) while using  EBUR 128 Scanner (ffmpeg) tool.
- Selection manipulation\Advanced sort...: harmonic mixing configuration menu not shown if 'Playlist manipulation' and 'Special playlists' submenus were hidden.
- Selection manipulation\Shuffle: 'By...(tag)' entry not working.
- Playlist Manipulation\Query filtering: dynamic queries were not being properly inverted while pressing Ctrl on some edge cases.
- Script Integration\SMP Dynamic menu: crash on init after disabling submenu (and feature) via shift clicking .
- Script Integration\SMP Dynamic menu: feature was not disabled/enabled properly to work with [ajquery-xxx](https://github.com/regorxxx/ajquery-xxx).
- Playlist Manipulation: disabling submenu via shift clicking did not output the proper menu list order.
- Playlist filter: non uniform tabulation on button tooltip.
- Remove Duplicates: skip processing if there is no active playlist.
- Buttons: 'main_menu_shortcut' button's state was not saved properly when using 'Run when closing foobar?' option due to a limit on how [foobar2000/SMP work](https://github.com/TheQwertiest/foo_spider_monkey_panel/issues/205). A workaround has been implemented, considering a button should always be on an specific state at init if these options were used.
- Buttons: removed non needed console logging for 'search_by_tags_queries' button and 'Search same by tags' menu entries.
- Buttons: 'playlist_remove_duplicates' and 'playlist_show_duplicates' now show the keyboard action associated while pressing control (if the mouse shortcuts has been disabled). Previously it only worked with shift.
- Pools: pools using dynamic queries crashed when there was no focus item (on any playlist).
- Pools: pools using standard queries without a focused item (on any playlist) did not output any results.
- Pools: number of tracks output was lower than expected on classic pools mode (_GROUP_X) due to wrong tag handling of special chars.
- Pools: missing harmonic mix dependencies when the 'Selection manipulation' submenu was disabled.
- Macros: updated test macros with latest name changes. There were some entries not working using old names.
- Macros: removed extra separator on edit entries submenu.

## [3.0.0-beta.25] - 2023-03-09
### Added
### Changed
- Presets: in case a custom menu entry has a duplicated name, it will be reported in a popup and skip for menu creation purposes. This should work as workaround to the crash appearing since [3.0.0-beta.20](#300-beta20---2023-03-04) if there were duplicated entries (allowing to remove them without clearing completely the panel). See [here](https://hydrogenaud.io/index.php/topic,120978.msg1023552.html#msg1023552).
- Presets: customizable menu entries no longer allow duplicated names when adding or editing an entry. A popup will be shown as warning.
- Script Integration\SMP Main menu: improved info popup shown for 'Execute menu entry by name'.
### Removed
### Fixed
- Script Integration\Playlist Name Commands: popup text filling entire window (thus making impossible to click yes/no), now reduced to a few lines and pointing to full readme for more info.
- Script Integration\SMP Dynamic menu: entries were not being added/edited properly at some instances.
- UI: crash when using drag n' drop if a button file was loaded (instead of using the toolbar), although this installation method is no longer supported.
- Presets: crash when editing presets at some instances.

## [3.0.0-beta.24] - 2023-03-08
### Added
### Changed
- Helpers: updated helpers
### Removed
### Fixed

## [3.0.0-beta.23] - 2023-03-08
### Added
- Last.fm: added user's recommendations, mix and neighbors entries.
### Changed
- Last.fm: improved and simplified entry names.
### Removed
### Fixed
- Last.fm: icon-only mode not working properly.

## [3.0.0-beta.22] - 2023-03-05
### Added
- Last.fm: supports -full- tag retrieval from [WilB's Biography script](https://github.com/Wil-B/Biography). i.e. genres, styles, locale tags, etc. are added to the file tags on the submenus as available values. Bio tags state is displayed at tooltip, warning when tags are not found (usually requires some seconds).
- Last.fm: supports 'locale' tag retrieval from [World-Map-SMP](https://github.com/regorxxx/World-Map-SMP), independently of Bio panel. i.e. it looks at the local database for matches by artist (so it works even for artists not found by Bio panel, multi-value artists tags and artists manually tagged by user on the panel). Bio and World Map tag retrieval can coexist, duplicates are removed in any case.
- Last.fm: new similar artists sub-menu, to retrieve top tracks by a single selected similar artist. This is different to using the 'Current similar artists to' entry, which creates a playlist mixing all similar artists. Therefore, it's equivalent to using the 'Custom...\By Artist' entry for every single similar artist found.
- Last.fm: supports 'LASTFM_SIMILAR_ARTIST' tag retrieval from [foo_uie_biography](https://foobar2000.xrea.jp/?User+interface/UI+extension#kbe7a3bd), independently of Bio panel. Bio and foo_uie_biography tag retrieval can coexist, duplicates are removed in any case.
- Last.fm: supports 'SIMILAR ARTISTS SEARCHBYDISTANCE' tag retrieval from [Search by Distance-SMP](https://github.com/regorxxx/Search-by-Distance-SMP), independently of Bio panel. Duplicates are removed in any case when merged with other similar artists tags. This tag must be pre-calculated, since it's retrieved from files or database, and its based on similar artists from your library (instead of charts/popularity/other people's listening habits).
### Changed
- Last.fm: updated support for foo-last-list-smp v1.1 (previous version will not work).
- Last.fm: sub-menu tag lists are now split on columns by 8 items.
### Removed
### Fixed

## [3.0.0-beta.21] - 2023-03-04
### Added
### Changed
- Last.fm: renamed button to 'buttons_lastfm_tools.js'. There is no need to do anything user-side on previous installations, it's automatically handled on first load after updating.
- Last.fm: added button to one of the default presets ('ListenBrainz & Last.fm') on empty toolbars.
### Removed
### Fixed
- UI: png icons now use a dark-mode version (if available) or get inverted according to the button text color configuration.
- Last.fm: missing icon file.

## [3.0.0-beta.20] - 2023-03-04
### Added
- Last.fm: support for [foo-last-list-smp](https://github.com/L3v3L/foo-last-list-smp). Requires package to imported within SMP Package manager (no need to be active on a panel). Then add a new button as usual from the 'Last.fm' subfolder. Allows to create playlists from Last.fm urls either matching results with library or YouTube links (requires foo_youtube). It's not an exact clone of the original script, so some features may differ. It does not require a Last.fm account or token.
### Changed
- UI: tweaked and unified buttons weight and margins, adjusted to scale set and DPI.
- UI: minor improvements to readme sub-folders names.
- UI: cursor now changes when over a button.
- UI: cursor now changes while performing buttons drag n' drop. It now clearly indicates when a move is allowed or it's outside the allowed range.
- UI: drag n' drop now only works when the mouse is over a button position. i.e. both the functionality and position rectangle are disabled if the mouse is not on a valid position. Previously moving the button to a blank part of the bar would have simply sent it to the first/last position for ex. This is disallowed now, which makes drag n' drop a bit more intuitive and offers an overall more cohesive experience. It also respects orientation and reflow settings.
- Internal code cleanup of menus.
### Removed
### Fixed
- UI: minor improvements to drag n drop behavior when mouse remains static and R. Click is released. Panel is redrawn immediately instead of waiting to move the mouse, current button remains hovered.
- UI: minor improvements to drag n drop behavior when R. Click menu is called in rapid succession. Panel is redrawn on the background now.
- Select...\Delete selected tracks: didn't allow undo.
- Select...\Delete Non selected tracks: didn't allow undo.
- Console: logging of null value not working properly (totally irrelevant except for debug purposes).

## [3.0.0-beta.19] - 2023-02-22
### Added
- UI: default fonts (buttons, icons, toolbar text and tooltip) may now be changed at '[foobar profile]\js_data\presets\global\globFonts.json'.
### Changed
- UI: improved compatibility with some fonts under Unix systems (using Wine). Sometimes weird chars appeared on menu entries.
### Removed
### Fixed

## [3.0.0-beta.18] - 2023-02-21
### Added
### Changed
- Helpers: updated helpers
### Removed
### Fixed
- Buttons: fixed 'buttons_playlist_tools_submenu_custom' behavior when trying to call entries related to some special submenus (like those related to editing/adding/removing entries from menus). For ex. setting it to call the 'Playlist manipulation\Query filtering', all filter entries worked fine... but trying to use 'Edit entries from list...\xxxxxxxxx\Edit entry...' didn't work and reported menu entry not found at console log (although the menu was clearly named the same and it existed).
- Buttons: properties were sometimes reset/mixed/not saved properly moving buttons using the 'Change buttons position' menu. It worked fine using drag n' drop though.

## [3.0.0-beta.17] - 2023-02-19
### Added
- UI: added settings for buttons color (the border and filling).
- UI: added settings for buttons transparency (the filling).
### Changed
- Quicksearch: entries are now configurable. New ones may be added and existing ones edited. 'Partial match' and 'Begins with' entries are automatically created.
- UI: enhanced colors and shading for buttons on mouse over/down when using custom toolbar color modes, etc.
- UI: pressing Ctrl resets selected setting on buttons bar colors submenu.
- Helpers: updated helpers
### Removed
### Fixed
- Pools: duplicated 'Current genre/style and instrumentals' pool entry removed.
- Buttons: fixed 'Restore default buttons' entry crash (not needed anymore since there are no more 'default buttons'), now replaced with 'Restore all buttons' (which simply restores back default settings for every button).

## [3.0.0-beta.16] - 2023-02-15
### Added
- Configuration: added user configurable files at '[FOOBAR PROFILE FOLDER]\js_data\presets\global' to edit default queries and tags for multiple tools. Usually used internally or on properties panel. Don't forget to reload the panels/restart foobar and restore defaults on all relevant buttons and menus to use the new values. It's recommended to do it upon installation of this update.
- Playlist locks: new menu entries at Playlist manipulation to switch playlists locked status. It's meant to be used via Dynamic menus in a button, allowing to lock/unlock specific playlists with the same button.
- Selection manipulation\Shuffle: shuffles tracks according to tags (for ex. artist) in a semi-random pattern, ensuring no 2 consecutive tracks have the same tag. Follows [Spotify design](https://engineering.atspotify.com/2014/02/how-to-shuffle-songs/). Differs from 'Scatter by tags' (intercalate) in the way tracks are ordered (without strict alternation), i.e. it doesn't follow a pattern ABCABAA when it's possible to ensure no A tracks are together (ABACABA). Note contrary to [Spotify's preferences to recently played/loved tracks](https://thetab.com/uk/2021/11/17/spotify-shuffle-explained-228639), this algorithm is truly "random" in the sense that there is no preference for any track, it just ensures artists are distributed evenly with some randomness.
- Pools: new 'Top recently played tracks' and 'Top recently added tracks' pools entries.
- Pools: pools now also allow harmonic mixing. Key tag used follows tag remapping of the button. Check '50_random_artists_harmonic.json' for a preset example and 'Top tracks mix (harmonic)' within pools menu.
- Presets: new presets 'Classic Pools (20 random albums)' and 'Classic Pools (20 random tracks)' for pools. Meant to solve situations like [this](https://hydrogenaud.io/index.php/topic,77460.msg1014047.html#msg1014047) or [this](https://hydrogenaud.io/index.php/topic,77460..html#msg1013926).
- Presets: new preset 'Similar artists (G)' to make use of Similar Artists analysis. Similar artists calculation is -obviously- required first.
- Buttons: added 'main_menu_shortcut' button which allows to call [multiple] native main menus (dynamically generated ones too). Some kind of automation is allowed by configuring states and unloading actions. For ex. to easily switch playback statistics monitoring on demand for multiple components (database, ListenBrainz, Last.Fm, ...) with a single click, and also ensure they are enabled back when closing Foobar200. Before every menu action a custom timeout can be added (for asynchronous actions).
- Buttons: added 'search_by_tags_queries' button which is a generic version of the old 'search_same_style' button, but applicable to any tag. An arbitrary num of tags may be used to create queries.
- Buttons: added 'quicksearch' button which is a shortcut to the "dynamic queries" functionality, more in line with [foo_quicksearch](https://wiki.hydrogenaud.io/index.php?title=Foobar2000:Components/Quicksearch_UI_Element_%28foo_quicksearch%29#Context_menu). Allows searching for tracks with same tag values, beginning with them or by partial matching (i.e. adds a lot of more functionality than the original one). Results may be sent to a playlist, Autoplaylist or search window.
- Advanced sort: decremental sort by DynGenre entry added.
- Advanced sort: harmonic mix entry added (in place, not new playlist).
- Tags: menu entries to -only- reset tag remapping.
- Readmes: new 'allowedKeys.txt' file explaining pools presets, variables used, sources, etc.
- Fingerprinting: added compare selection entry by FooId (previously only ChromaPrint was available).
- Fingerprinting: added setting to enable back ChromaPrint tools (at your own responsibility). Check [Foobar2000 and SMP engine](https://hydrogenaud.io/index.php?topic=120978.msg1011036#msg1011036). There should be no problems on x64 systems.
- Fingerprinting: added setting to read directly from files the ChromaPrint tag using [ffprobe](https://ffmpeg.org/ffprobe.html) instead of using Foobar2000 tag database. This bypasses the tag limitations due to big tag files, not requiring to edit the 'LargeFieldsConfig.txt\' file (at profile folder) on foobar v1.6.X. In foobar2000 v2+, there is no such limitation.
- Fingerprinting: added setting for the max selection allowed when running the tools.
- Last Action: added new entry at main menu to execute the last action used. Cleared out at startup.
- Other Tools\Write tags: added 'Folksonomy' tag calculation from multiple sources: genre, styles, locale, etc. Meant to be used along the Picard scripts found at presets.
- UI: added icons-only mode for toolbar buttons at the toolbar configuration menu ('Other UI configuration'). Tooltip is adjusted to show the button's name there instead. Handy when creating a compact toolbar and icons are good enough to recognize the tools.
### Changed
- Fingerprinting: multiple improvements on comparison report formatting.
- Fingerprinting: performance improvements when comparing selection (uses binary search now).
- Fingerprinting: tool warns when the fingerprint tag is not readable (see limitations above) or selection/library has no such tags.
- Playlist locks: menu entry to lock playlists also blocks playlist removal now (not only its items).
- Playlist locks: lock types applied are now shown on the header of the submenu.
- Selection manipulation\Scatter by tags: split the tool into intercalate (associated to matching any value) and scatter (for specif values) submenus.
- Selection manipulation\Scatter by tags: now allow to customize and edit the menu entries.
- Top Rated Tracks from...: now use the greater value between play count and Last.Fm play count for sorting to account for scrobbles. i.e. '$max(%PLAY_COUNT%,%LASTFM_PLAY_COUNT%)'.
- Most played Tracks...: now use the greater value between play count and Last.Fm play count for sorting to account for scrobbles. i.e. '$max(%PLAY_COUNT%,%LASTFM_PLAY_COUNT%)'.
- Most Played Tracks from...: now also includes scrobbles from Last.Fm. So in case tracks have been played at Spotify or other players, as long as scrobbles as synced by 'Enhanced playback statistics' plugin, those tracks are considered eligible the same than any track played within Foobar2000.
- Other tools\Playlist revive: 'ACOUSTID_ID' and 'MUSICBRAINZ_TRACKID' are now checked to find exact matches, if MD5 and all other exact match rules fail.
- Other tools\Check Tags: added 'TITLE' to the list of default tags to be checked. Added special conditions to title tags.
- Script Integration\SMP Dynamic menu: now replaces all functionality previously found at Script Integration\SMP Main menu. Custom menus and functions may still be added, and device/DSP selector is no longer required (since it requires CMD and therefore can also be changed directly with it).
- Script Integration\SMP Dynamic menu: the panel warns about other panels having the same name if the feature is enabled at startup or when enabling it. Panel flashes for some seconds while the popup is shown.
- Script Integration\Add SKIP tag at current playback: pressing Shift while calling the menu now adds a skip tag to the existing ones, instead of replacing them. 
- Script Integration\Add SKIP tag at current playback: will now change playback to next track after tagging, instead of waiting for the component foo_skip to do it, resulting in smoother tagging process.
- Online controllers integration: reworked and updated all code for full integration with [foo_httpcontrol](https://hydrogenaud.io/index.php/topic,62218.0.html) has been added when using the preset [ajquery-xxx](https://github.com/regorxxx/ajquery-xxx) now using dynamic menus.
- Pools: duplicates are now removed, per group, in Classic Pools mode (when using _GROUP_# as source). That should bring the best of both worlds, mimicking foo_random_pools behavior while not duplicating tracks when there are multiple versions of them (for ex. original and remastered album, etc.).
- Pools: improved and expanded console logging.
- Pools: minor change to default pool entries to ensure final playlist length matches the global playlist length set at button. There were some rounding errors before with even track numbers.
- Remove duplicates: Ctrl + L. Click on button will show duplicates instead of removing them (i.e. the inverse function). This allows to use both functionalities without having to use multiple buttons.
- Remove duplicates: all uses of function changed to make use of '$year(%DATE%)' and '$ascii($lower($trim(%TITLE%))' instead of 'DATE' and 'TITLE'. This is a changed ported from Search by Distance, to ensure the most matches possible.
- Remove duplicates: advanced RegEx title matching option. For example, tracks like these would be considered to be duplicates: 'My track (live)', 'My track (acoustic)', 'My track (2022 remix)', ' My track [take 3]', ... but not those with keywrods like 'part', 'pt.', 'act' or Roman numerals.
- Remove duplicates: advanced RegEx title matching option. Words with "-in'" and a list of verbs ending in "-in" are matched against "-ing" verbs to further refine the search. For ex. "walkin", "walkin'" and "walking" are all considered equivalent.
- Show duplicates: Ctrl + L. Click on button will remove duplicates instead of showing them (i.e. the inverse function). This allows to use both functionalities without having to use multiple buttons.
- Show duplicates: advanced RegEx title matching option. See above.
- Playlist filter: advanced RegEx title matching option. See above.
- Search by tags (combinations): duplicates advanced RegEx title matching option. See above.
- Search by tags (queries): duplicates advanced RegEx title matching option. See above.
- Playlist Manipulation\Query filtering: pressing Ctrl while clicking on a menu entry will invert the query and append 'NOT' at the beginning. i.e. if a filter is used to display tracks with rating > 3, pressing control will do the opposite and show tracks with rating < 3. Note global forced queries are added after the inversion.
- Selection manipulation\Scatter by tags: now conserves selection and focus.
- Top rated tracks from: is now automatically built by decades from 1950 onwards, up to 20 entries.
- Top rated tracks from: a new entry is added to include all tracks before the lowest date.
- Top rated tracks from: a new entry is added to include all tracks between the current date and last 2 decades.
- Other tools\Import track list: improved popup descriptions for filters.
- Other tools\Import track list: custom path can now be directly configured using the appropriate menu entry (instead of using the properties panel). Path will be checked for validity.
- Other tools\Import track list: importing will now throw a popup when file is not found (instead of logging the error to console).
- Other tools\Import track list: custom path may also point to a web page.
- Other tools\Playlist Revive: cleaned up a bit the console logging when tags are missing for dead items (it doesn't give any useful info for the user).
- Buttons: default method of installation requires now to load the toolbar (no more single buttons support), from there, any button can be loaded as desired.
- Buttons: the buttons bar now shows a message when no buttons have been added, left clicking shows a popup with available buttons presets. Right clicking opens the menu to configure the toolbar or add buttons manually.
- Buttons: added new categories at the 'Add buttons' sub-menu, for Search by Distance tools, output devices, etc. and reordered items acordingly. Cosmetic change.
- Buttons: 'search_same_by' has been renamed to 'search_by_tags_combinations'. Console will warn about it when loading the toolbar. Replace it as needed.
- Buttons: 'search_same_style' has been replaced with'search_by_tags_queries' (generic version). Console will warn about it when loading the toolbar. Remove the old button on the toolbar and add the new version, then set it to use it only style tag to mimic its behavior.
- Buttons: 'search_same_style_moods' has been replaced with 'search_by_tags_combinations' (generic version). Console will warn about it when loading the toolbar. Remove the old button on the toolbar and add the new version, then set it to use {"STYLE":2,"MOOD":6} to mimic its behavior.
- Buttons: 'search_by_tags_queries' and 'search_by_tags_combinations' can now be renamed.
- Buttons: internal changes to also allow images as icons on buttons. Previously only chars were allowed.
- Buttons: reworked buttons configuration menu to show when a 'true/falsse' option is checked. Some options now output a popup giving a description or tip. Also, a popup is thrown when an input value is non valid.
- Buttons: improved 'no background mode' on buttons toolbar with colors and shades adapted to the toolbar background color and following the design of native Foobar2000 buttons for a seamless integration.
- Buttons: improved 'no background mode' on buttons toolbar with proper animations (no longer a bad looking rectangle gradient).
- UI: unified tooltip structure and available info on all buttons (short description + relevant settings + keyboard modifiers).
- UI: custom playlist Tools menu renaming does not require a panel reload anymore to adjust the width.
- UI: exposed the TF/tag expression to match duplicates along the advanced RegEx title matching option. See above. Used on all tools within Playlist Tools menu.
- UI: menu entries for most tools may now be edited and moved too, instead of only added/removed. Making easier its customization. The edit entries submenu has been changed to include all options within the same submenu.
- UI: all menus involving playlists name now also have a radio check at the left for the current playlist.
- UI: reworked 'Remove duplicates' and 'Show duplicates' buttons tooltip.
- UI: playlist revive tools now set back the focus to the latest selected track (instead of the start of the playlist).
- UI: buttons now show info about background processing if any is being done (usually also animated).
- UI: unified buttons size normalization settings and behavior for all axis modes. 
- UI: unified button icon alignment on reflow modes.
- Macros: buttons is now animated while recording a macro. The 'start recording entry' also shows a warning about it.
- Tags: Key and Stylegenre tags now also allow TF functions instead of just tag names.
- Presets: updated all Picard scripts with comments, setting examples, new scripts (for folksonomy tags, performers, ...), code improvements, etc.
- Other Tools\Write tags: changed default tools on first init.
- Readmes: updated pools readme.
- Readmes: readme is now available in config menus for individual buttons too (and not only the toolbar).
- Helpers: updated helpers.
- Helpers: rewritten [Camelot-Wheel-Notation](https://github.com/regorxxx/Camelot-Wheel-Notation) helper.
- Properties: additional checks to properties. In case a previous property is not valid, reset to default using menus where applicable.
- Properties: remapped tags properties have been rewritten, previous config will be lost. Tags now follow a JSON format, which will be more compatible with TF functions in any field.
- Minor performance improvement (usually on subsequent calls) caching all TitleFormat expressions.
### Removed
- Search by Distance: removed the 3 submenus on Playlist Tools button, to minimize redundancy. Only left the 'Special playlist 'entries, for any other Search by Distance usage, use directly their dedicated buttons. The 'Special playlist' entries are only available in case 'Search by distance' scripts are [installed](https://github.com/regorxxx/Search-by-Distance-SMP).
- Buttons: removed all 'Search by Distance' buttons. Install scripts from its [repository](https://github.com/regorxxx/Search-by-Distance-SMP) to make them available (no longer releasing all mixed here).
- Buttons: 'search_same_by' button. See warning above for replacement.
- Buttons: 'search_same_style' button. See warning above for replacement.
- Buttons: 'search_same_style_moods' button. See warning above for replacement.
- Script Integration\SMP Main menu: all functionality removed. Replace it as needed with custom Dynamic menus.
### Fixed
- Other Tools\Write tags: audio formats without a MD5 info tag are now skipped when using the MD5 tag (not the AUDIOMD5 tag). Not requiring anymore to manually force next step.
- Other Tools\Write tags: fixed bug introduced on [3.0.0-beta.9]. Tags not being deleted before writing the new ones in some cases due to a typo.
- Other Tools\Write tags: LRA tagging now uses [Sed](https://gnuwin32.sourceforge.net/packages/sed.htm) tool to extract the tag, which seems to give less problems with some tracks. This is due to a buggy behavior of ffmpeg which outputs a full tag report whenever the tool is used... binaries are already included on download. In case one desires to use the old FINDSTR command instead, just change useSed=TRUE to FALSE on the bat files at '.\helpers-external\ffmpeg'.
- Macros: no longer allows to save a macro without any action. A popup is shown in such case.
- Macros: 'start recording' entry is now disabled while it is already recording a macro.
- Macros: 'stop recording' entry is now disabled in case it is not recording.
- Fingerprinting: when comparing a list of tracks against itself (for ex. 'compare selection' tool), the analysis no longer checks every track against itself but only against the other tracks. Previously it always reported a 100% similarity against the original track, which is obvious. Note this doesn't apply when checking a list of tracks against the library, if a track is compared against itself, the result is considered valid (a match was found).
- Playlist locks: SMP locked playlists were not properly identified (and thus not shown on the locked menu list).
- Selection manipulation\Advanced sort: sort by key now properly differentiates between major (A) an minor keys (B), putting firt the major key and then the minor one when sorting (instead of mixing them when having the same number).
- Selection manipulation\Advanced sort: sort by DynGenre now properly creates an undo backup point on the modified playlist before being applied, allowing to restore the previous state with Ctrl + Z. It should have worked that way, the same than any other tool, from the beginning.
- Selection manipulation\Scatter by tags: skips reordering items when interval is smaller than 2 (previously due to a rounding error, values over 1.5 tried to reorder the selection, leaving untouched tracks at the end, contrary to the documentation).
- Dynamic queries: duplicated queries are removed before joining them with 'OR'. i.e. selecting 10 tracks by 'Mdou Moctar' for a query 'ARTIST IS #ARTIST#' will not output 10 time the same query, but only once. While functionality and final results don't change at all, it seems processing time greatly speeds up with shorter queries.
- Dynamic queries: parentheses, commas and quotes on tag values not working on some instances.
- Dynamic queries: in case query was non-valid, tracks with 'null' string on standard tags (title, artist, ...) were output. This is a [SMP bug](https://github.com/TheQwertiest/foo_spider_monkey_panel/issues/196).
- Script Integration\SMP Dynamic menu: excluded some entries which were not supposed to be exposed after changes on latest versions.
- Script Integration: fixed some inconsistencies on ajquery-xxx export files.
- UI: custom macro button width is now adjusted to button's custom name (instead of being fixed, which was never intended).
- UI: don't show tooltip during buttons drag n drop.
- UI: background color mismatch when resizing windows and using custom background colors.
- UI: fixed reflow mode in some cases when resizing back to the required width/height to show all buttons on a single row/column.
- UI: fixed reflow mode in some cases when normalization mode was not active and buttons had different size; non needed empty space was added in some rows/columns.
- Advanced sort...\Decremental key (Camelot Wheel): inverse order was not working as intended.
- Pools: some additional checks to ensure non ASCII chars, casing or numbers are correctly identified as equivalent. For ex. 'Classic Pools (3 tracks per artist letter)' would output an artist starting with A and another with a as 2 different letters. Same applies to ASCII equivalences, etc. Now all the values are reduced to an ASCII lowercase string.
- Pools: 'Current genre/style and instrumentals' query had a typo.
- Script Integration\SMP Dynamic menu: crash when 'Script integration' sub-menu was disabled but the option was enabled. The entire feature is now disabled as consequence, as it should be.
- Top rated tracks from: is now invariant to date order. i.e. 2012,2013 will output the same than 2013,2012 (previously empty output).
- Buttons: fixed 'buttons_playlist_tools_submenu_custom' button, which was breaking buttons' properties when moving or deleting buttons. Long time issue which only appeared when this button was on the toolbar.
- Buttons: forbid multiple copies of some buttons (missed on previous releases).
- Buttons: crash when adding buttons files not associated to a category by their filename. Only relevant for developers.
- Buttons: no background on buttons configuration for toolbar was not properly set on script init/reloading.
- Readmes: separators not being properly identified on readme files checking.
- Presets: fixed variable typos on '.\presets\Playlist Tools\pools\intercalate_artists.json' file, now working as intended.
- Rating related scripts not compatible with foobar2000 2.0+.
- Some fixes to queries containing parentheses on the values, which should have been quoted.
- Multiple foobar2000 v2+ compatibility fixes.

## [3.0.0-beta.15] - 2022-08-22
### Added
- Playlist locks: new menu entries at Playlist manipulation to lock/unlock playlists. Currently switches 'add, remove, replace and reorder' locks (all at once). Use [Playlist-Manager-SMP](https://github.com/regorxxx/Playlist-Manager-SMP) for a fine-grained control of lock types. Note playlist locked by other components or main program can not be edited via SMP.
### Changed
- UI: minor improvements to word lists within popups in some instances. Now split in new lines after X elements.
- Helpers: updated helpers.
### Removed
### Fixed

## [3.0.0-beta.14] - 2022-08-21
### Added
- Dynamic queries: added a few new default queries to menu. Cover versions, acoustic versions, >2 rated tacks by artist. (may need to restore defaults on the menu to enable it)
- Search by Distance: added 'User descriptors' readme.
### Changed
- Search by Distance: user file has been moved to profile folder at 'js_data/helpers/music_graph_descriptors_xxx_user.js'. This will ensure it doesn't get overwritten on script updates. Using the menu entries to open the descriptor will automatically create a copy there and open it if it's not found. Users who have been adding changes and being careful to not overwrite the file at the current location only have to copy it manually or use the menu entry to apply the change (and future edits must be done on the data folder). This step is only required once.
- Search by Distance: all style/genres on the graph use now ASCII only values, so it should be easier to match any value to them if required.
- Search by Distance: default genre and style tags use now '$ascii()' TF function. This will ensure a match when using accents, etc. See change above. On previous installations, change tags to (without quotes): '$ascii(%genre%)' & '$ascii(%style%)'
- Search by Distance: after tag remapping, a popup asks to rebuild the cache.
- Search by Distance: improved graph links cache asynchronous calculation.
- HTML: tries to load the user descriptors file from data folder first, then from helpers folder if not found. Will give a warning on console on the latter.
### Removed
### Fixed
- Search by Distance: minor fix about 'Tuareg Music'.
- Search by Distance: fixed warnings about non ASCII values on the descriptors.
- Console: fixed console logging to file (lines were not being split properly).

## [3.0.0-beta.13] - 2022-08-12
### Added
- Search by Distance: diagrams explaining the design logic of similar artists calculation with 3 different methods ('_images\search_by_distance_SIMILAR_ARTISTS(R|V|W)_diagram.png').
- Search by Distance: added 'Dembow' and 'Renaissance Rock', along their influences, to descriptors.
### Changed
- Search by Distance: when calculating similar artists, library tracks are now filtered by nearest genre/styles to tracks by selected artist for every track, instead of using only the first track as reference. This should better reflect the works of an artist without depending on the reference track at all. Previously, output score would be heavily dependent on the reference track.
- Search by Distance: when calculating similar artists, scores are now weighted with genre/style appearance on all artist's tracks. i.e. if 'Mdour Moctar' has 1 Reggae track on your library and 99 Rock tracks, then if the Reggae track is chosen for the calcs, it's score is weighted as 1% of the total score (instead of averaging all N scores).
- Search by Distance: when calculating similar artists, current method uses the 2 above changes, named 'weighted'. Using only the filter change is 'variable'. Previous method based on reference track is named 'reference'. This is an internal change, but functionality -based on names- can be seen on the diagrams. 'Weighted' will be the default method from now on, not meant to be changed (unless the script 'search_bydistance_extra.js' is edited). In resume, this change is aimed to better reflect the entire work of an artist, instead of specific tracks or being tied to random variations.
- Console: reworked console logging to group buttons loading info into one line.
- Console: reduced console logging at startup.
- Helpers: switched all callbacks to [event listeners](https://github.com/regorxxx/Callbacks-Framework-SMP).
### Removed
### Fixed
- Search by Distance: when calculating similar artists, before choosing N random tracks, from selected artist, duplicates are now removed (to ensure no track is selected twice if it appears at different albums for ex.). Checks for Title + Artist + Date.
- Presets: updated Picard AcousticBrainz presets with fixes to output when values used scientific notation and other weird situations.
- Workaround for some instances where the scripts would warn about some feature not being supported by the OS (due to an OS or SMP bug). 

## [3.0.0-beta.12] - 2022-08-10
### Added
- Search by Distance: new menu entry, on custom button, to reset entire button configuration to default values.
### Changed
- Search by Distance: minor update to diagram to clarify a few things ('_images\search_by_distance_GRAPH_diagram.png').
- Helpers: updated helpers.
### Removed
### Fixed
- Search by Distance: composer tag was not being properly used on queries and scoring, leading to wrong results or query errors.
- Search by Distance: custom string tag was not being properly used on queries and scoring, leading to wrong results or query errors.
- Search by Distance: date, BPM and custom num tag was being skipped on calculations when equal to zero. While that may make sense for Date or BPM in real use-cases, the custom tag could be used to also store zero values. Now it will also compare the tags when set to zero, and only skip them when not found.

## [3.0.0-beta.11] - 2022-08-09
### Added
- Search by Distance: new menu entry on customizable button to show all hidden presets (recipes or themes).
- Search by Distance: new option to hide selected preset (Shift + Click).
### Changed
- Search by Distance: any recipe or theme file starting with 'test_' or 'int_' will be hidden everytime when opening the customizable button's menu.
### Removed
### Fixed
- Search by Distance: None preset was not being shown as current preset when there were no more presets on the list.
- Search by Distance: 'test_with_forcedThemePath.json' recipe is no longer available by default (see change above). Previously a warning popup was shown everytime the menus were called due to inline forced theme path being wrong.

## [3.0.0-beta.10] - 2022-08-07
### Added
### Changed
- Other Tools\Write tags: added menu entry to invert tools selected.
- Other Tools\Write tags: pressing shift while clicking on a tool will disable the other tools and enable only the selected one.
### Removed
### Fixed
- Search by Distance: graph variable 'Exclude any track with graph distance greater than (only GRAPH method' was not being parsed properly when set to a string.
- Buttons: crash when trying to move a button when only a single button script was loaded on the panel.

## [3.0.0-beta.9] - 2022-08-06
### Added
### Changed
- Search by Distance: minor improvements to console logging when reporting track list.
### Removed
### Fixed
- Forced query: forced query was not being properly saved when using pre-defined filters.
- Search by Distance: fix to theme checking. Themes were being reported as non valid when they were fine.
- Search by Distance: forced query was not being properly saved when using pre-defined filters.

## [3.0.0-beta.8] - 2022-08-05
### Added
- Forced query: added new submenu with pre-defined filters (queries) to easily configure the forced query.
- Device selector: new button to select output device.
- Show duplicates: new button to show duplicates by tags (the inverse of Remove duplicates). See https://hydrogenaud.io/index.php?topic=110958
- Show duplicates: new menu entry at 'Duplicates and tag filtering' to show duplicates by tags. See previous note.
- Other Tools\Write tags: added KEY tagging, using [Essentia](https://essentia.upf.edu/reference/streaming_Key.html). Same algorithms than Picard / AcousticBrainz. 2 methods available. It's recommended to use the non-fast version when also computing the other essentia tags.
- Other Tools\Write tags: added BPM tagging, using [Essentia](https://essentia.upf.edu/reference/streaming_RhythmExtractor2013.html). Same algorithms than Picard / AcousticBrainz.
- Other Tools\Write tags: added LRA tagging, using [Essentia](https://essentia.upf.edu/reference/streaming_LoudnessEBUR128Filter.html). Same algorithms than AcousticBrainz.
- Other Tools\Write tags: added DANCENESS tagging, using [Essentia](https://essentia.upf.edu/reference/std_Danceability.html). Same algorithms than AcousticBrainz.
- Script Integration\Dynamic menus: new dynamic menus available with [SMP 1.6.1](https://github.com/TheQwertiest/foo_spider_monkey_panel/releases/tag/v1.6.1) which allow to execute panel actions via main menus and even associate them to a keyboard shortcut or toolbar buttons. There is no limit (the old method was limited to 10 entries), so it can be used independently to other panels. It also allows to control the tools via CMD. Most menu entries has been replicated this way. Every panel has its own set of associated actions, so every panel must have different panel names to work (usually not a problem for a toolbar panel). Entries may be found at 'File\Spider Monkey Panel\Script Commands\\[Panel Name]\\...'.
- Online controllers integration: full integration with [foo_httpcontrol](https://hydrogenaud.io/index.php/topic,62218.0.html) has been added when using the preset [ajquery-xxx](https://github.com/regorxxx/ajquery-xxx). Most menu entries can be used with the online controller, allowing to: load pools, apply queries, playlist revive, ... [foo_runcmd](https://foosion.foobar2000.org/components/?id=runcmd) and [foo_run_main](https://marc2k3.github.io/run-main/) are needed. It makes use of the new dynamic menus from [SMP 1.6.1](https://github.com/TheQwertiest/foo_spider_monkey_panel/releases/tag/v1.6.1) (only has been tested with foobar 1.6.11). Every panel has its own set of associated actions, so every panel must have different panel names to work (usually not a problem for a toolbar panel).
- Readmes: new readmes for 'Tagging requisites', 'Tags sources' and 'Other tag notes'. They should cover most frequently asked questions about tagging compatible with the tools or tag remapping.
### Changed
- Other Tools\Write tags: will show a popup with tips when selection of tools can be optimized (for ex. when using Essentia).
- Shortcuts: have been reworked to make use of Dynamic menus (instead of a global hack like previously). In other words, to assign a menu entry, just use the default method at 'Preferences\Keyboard shortcuts', following the same steps than any other native menu entry. Obviously, to assign a Playlist Tool entry to a keyboard shortcut, the menu entry must exist first at 'File\Spider Monkey Panel\Script Commands\\[Panel Name]\\...', i.e. Dynamic menus must be enabled. Previous functionality has been removed. Readme has been changed to reflect the changes.
- UI: themed buttons are replaced with manually drawn buttons when the first method fails (on Wine for ex.). Console will output: "window.CreateThemeManager('Button') failed, using experimental buttons" in such case.
- UI: enforced SMP version checking via popups.
- Script Integration\Dynamic menus: more entries has been exposed as main menus. Some config related menus -not meant to be there- have been removed. Also the list of entries is now different to the exported list for online controllers. i.e. previously any entry which required an input popup was skipped to ensure compatibility with online controllers; now they are also exposed as main menus but disabled for online controllers, covering all possible use-cases.
- Search by Distance: added new entry. on customizable button, to open the file to set pre-defined filters (queries). In case the file is deleted, clicking on the menu entry will recreate it.
- Search by Distance: influences filter doesn't overwrite score filter or graph distance filter now. Although it was designed to do so (to output any influence without considering score), it did not work in a logical way since those filters can be manually tuned to achieve the same result while also allowing other options.
- Search by distance: Updated descriptors.
- Readmes: reworked readmes submenu, now spanned horizontally. Also added separators by category.
- Readmes: rewritten readmes to avoid line wrapping wen showing them within popup for a cleaner presentation.
- Helpers: moved all temp files temp files are now written at 'js_data\temp' instead of 'js_data'. For ex. for Other Tools\Write tags:. Any file there may be safely removed in case there is a crash (contrary to the 'js_data' folder).
- Helpers: updated helpers.
- Minor speed optimization on multiple tools/buttons using duplicates removal code.
### Removed
### Fixed
- Search by distance: crash when using composer tag for similarity.
- Other Tools\Write tags: crash when mixing ISO and cue files with standard ones for some tools.
- Other Tools\Write tags: tools with missing dependencies are no longer enabled when using "enable all".
- UI: crash due to themed buttons not being available on wine.
- Helpers: added additional checks for 32 bits systems to use 32 bits binaries for external tools. Should solve multiple issues on Wine when using 32 prefix.
- Readmes: some minor fixes to names displayed and missing entries.
- Online controllers integration: cosmetic error. Some separators where not displayed properly on the list of menus.
- Online controllers integration: some useless entries being shown (configuration entries, those which required popups, etc.).
- Fixed crash due to missing file when opening settings menu on multiple buttons.
- Shift menu, to disable/enable menu entries, was not displayed properly (order) when some entries were disabled.
- Shift menu to disable/enable menu entries was missing some tools.

## [3.0.0-beta.7] - 2022-05-23
### Added
- Fingerprinting: added buttons for tagging with ChromaPrint and FooID. Added button for searching similar tracks in library by fingerprint with FooID. All other ChromaPrint tools are greyed out due to limitations on current [Foobar2000 and SMP engine](https://hydrogenaud.io/index.php?topic=120978.msg1011036#msg1011036).
### Changed
- Other Tools\Write tags: ISO and cue files are now skipped for tagging when using tools which require an external executable since subsongs can not be piped. i.e. ChromaPrint Fingerprinting, MD5, AUDIOMD5 and EBUR 128 Scanner.
- Other Tools\Write tags: expanded popup info when ISO files are checked or there are errors, pointing to the wiki.
- Other Tools\Write tags: checks to automate steps have been reworked to be more robust, instead of using callbacks and library changes. It should not require manually forcing a step anymore.
- Search by distance: more warnings on customizable button when forced theme is not found, with popups instead of only logging to console.
- Helpers: Updated helpers.
### Removed
### Fixed
- Search by distance: configuration menu on customizable button was not showing forced theme applied by recipe and disabling the other entries.
- Profiler: configuration was not being applied until script was reloaded.

## [3.0.0-beta.6] - 2022-05-04
### Added
- Pools: added new classic pools presets using a new source method based on TF grouping (like foo_random_pools). Restore defaults to load them. It can also be used along (dynamic) query filtering (which was one of the main reasons to create this as an alternative to the plugin), for ex: a pool with 2 tracks by 50 different artists which also match the genre of the currently selected track. See also 'presets\Playlist Tools\pools\classic_pool_*.json' for more examples.
### Changed
- Other tools\Write Tags: EBU tagging is now done per groups of 25 tracks (previously 100) and ChromaPrint tagging for 100 tracks (previously 500). Rationale: in case something goes wrong, it would be easier to re-tag missing files and less time would have been lost.
### Removed
### Fixed
- Advanced sort...\Incremental genre/styles (DynGenre): tracks containing special chars (%, $, [, ], or ') on the path or title were not being correctly parsed.
- Dynamic queries: fixed queries with values after evaluation containing %, $, [, ], or '. Now they are correctly escaped within TF expressions. For ex. "$stricmp($ascii(%TITLE%),$ascii(#TITLE#))" IS 1 AND ARTIST IS #ARTIST# evaluates to "$stricmp($ascii(%TITLE%),$ascii(Didn''t want to have to do it))" IS 1 AND ARTIST IS Lovin' Spoonful. Previously it would not work as expected due to the apostrophe on the parenthesis not being escaped. Note the apostrophe at the #ARTIST# statement is left untouched though.
- Other tools\Import track list: fixed queries with tag values containing ], now are correctly escaped.
- Search similar by...: crash in some cases when pool of selected tracks was empty.

## [3.0.0-beta.5] - 2022-04-13
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
- Other tools\Import track list: improved title and artist detection consider also ASCII equivalences For ex. 'Lo que sobra de mí' will match values with and without accents.
- Dynamic Queries: new preset 'Same title [...]' which outputs only tracks with same title than selection (no matter the date or artist). Restore defaults to load it.
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
- Console: Progress code in multiple tools have been fixed to display more accurately the percentage progress in the log.
- Console: non needed warning about 'name' variable not being recognized on recipes.
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
- Helpers: file recycling has been overhauled to bypass Unix errors and shift pressing limitation (file was being deleted permanently). Now it tries 3 different methods, the last one requires an external executable and permissions may be asked by the OS.
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
- Console: Added option to switch console logging at configuration submenu.
- Console: Added option to switch profiler logging at configuration submenu.
- Console: Added option to show/hide tooltip shortcuts at configuration submenu.
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
- Import Track List: while reading text files, they are now split by lines using any of the possible [escape sequence combinations](https://en.wikipedia.org/wiki/Newline) and not only windows ones (\r\n). This should allow to correctly read any file created in any OS (no longer limited to Windows ecosystem).
- Pools: output playlist was not being checked for locked status properly.
- Pools: Playlist files from [Playlist-Manager-SMP](https://github.com/regorxxx/Playlist-Manager-SMP) were not being read properly due to a typo on path detection.
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
- Top rated Tracks from...\From year: crash on input.
- Most Played Tracks from Date: crash.

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

[Unreleased]: https://github.com/regorxxx/Playlist-Tools-SMP/compare/v3.0.0-beta.26...HEAD
[3.0.0-beta.26]: https://github.com/regorxxx/Playlist-Tools-SMP/compare/v3.0.0-beta.25...v3.0.0-beta.26
[3.0.0-beta.25]: https://github.com/regorxxx/Playlist-Tools-SMP/compare/v3.0.0-beta.24...v3.0.0-beta.25
[3.0.0-beta.24]: https://github.com/regorxxx/Playlist-Tools-SMP/compare/v3.0.0-beta.23...v3.0.0-beta.24
[3.0.0-beta.23]: https://github.com/regorxxx/Playlist-Tools-SMP/compare/v3.0.0-beta.22...v3.0.0-beta.23
[3.0.0-beta.22]: https://github.com/regorxxx/Playlist-Tools-SMP/compare/v3.0.0-beta.21...v3.0.0-beta.22
[3.0.0-beta.21]: https://github.com/regorxxx/Playlist-Tools-SMP/compare/v3.0.0-beta.20...v3.0.0-beta.21
[3.0.0-beta.20]: https://github.com/regorxxx/Playlist-Tools-SMP/compare/v3.0.0-beta.19...v3.0.0-beta.20
[3.0.0-beta.19]: https://github.com/regorxxx/Playlist-Tools-SMP/compare/v3.0.0-beta.18...v3.0.0-beta.19
[3.0.0-beta.18]: https://github.com/regorxxx/Playlist-Tools-SMP/compare/v3.0.0-beta.17...v3.0.0-beta.18
[3.0.0-beta.17]: https://github.com/regorxxx/Playlist-Tools-SMP/compare/v3.0.0-beta.16...v3.0.0-beta.17
[3.0.0-beta.16]: https://github.com/regorxxx/Playlist-Tools-SMP/compare/v3.0.0-beta.15...v3.0.0-beta.16
[3.0.0-beta.15]: https://github.com/regorxxx/Playlist-Tools-SMP/compare/v3.0.0-beta.14...v3.0.0-beta.15
[3.0.0-beta.14]: https://github.com/regorxxx/Playlist-Tools-SMP/compare/v3.0.0-beta.13...v3.0.0-beta.14
[3.0.0-beta.13]: https://github.com/regorxxx/Playlist-Tools-SMP/compare/v3.0.0-beta.12...v3.0.0-beta.13
[3.0.0-beta.12]: https://github.com/regorxxx/Playlist-Tools-SMP/compare/v3.0.0-beta.11...v3.0.0-beta.12
[3.0.0-beta.11]: https://github.com/regorxxx/Playlist-Tools-SMP/compare/v3.0.0-beta.10...v3.0.0-beta.11
[3.0.0-beta.10]: https://github.com/regorxxx/Playlist-Tools-SMP/compare/v3.0.0-beta.9...v3.0.0-beta.10
[3.0.0-beta.9]: https://github.com/regorxxx/Playlist-Tools-SMP/compare/v3.0.0-beta.8...v3.0.0-beta.9
[3.0.0-beta.8]: https://github.com/regorxxx/Playlist-Tools-SMP/compare/v3.0.0-beta.7...v3.0.0-beta.8
[3.0.0-beta.7]: https://github.com/regorxxx/Playlist-Tools-SMP/compare/v3.0.0-beta.6...v3.0.0-beta.7
[3.0.0-beta.6]: https://github.com/regorxxx/Playlist-Tools-SMP/compare/v3.0.0-beta.5...v3.0.0-beta.6
[3.0.0-beta.5]: https://github.com/regorxxx/Playlist-Tools-SMP/compare/v3.0.0-beta.4...v3.0.0-beta.5
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
