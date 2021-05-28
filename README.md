# Playlist-Tools-SMP
[![version][version_badge]][changelog]
[![CodeFactor][codefactor_badge]](https://www.codefactor.io/repository/github/regorxxx/Playlist-Tools-SMP/overview/main)
[![CodacyBadge][codacy_badge]](https://www.codacy.com/gh/regorxxx/Playlist-Tools-SMP/dashboard?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=regorxxx/Playlist-Tools-SMP&amp;utm_campaign=Badge_Grade)
![GitHub](https://img.shields.io/github/license/regorxxx/Playlist-Tools-SMP)  
A collection of [Spider Monkey Panel](https://theqwertiest.github.io/foo_spider_monkey_panel) Scripts for [foobar2000](https://www.foobar2000.org), built within a menu, which serves as a hub for 'usage examples' and shortcuts to the most requested foobar missing functionalities: remove duplicates by tags, revive dead items, check errors on tags, spotify-like playlist creation, advanced queries, etc.

![Animation7](https://user-images.githubusercontent.com/83307074/116756221-471e8500-a9fb-11eb-96c9-2c269bf91fef.gif)

## Features

![Animation9](https://user-images.githubusercontent.com/83307074/116756215-44239480-a9fb-11eb-8489-b56a178c70f4.gif)

It's impossible to offer a complete list of the things that can be done with these tools, in a few words: anything related to playlist creation, sorting, library maintenance, automation, etc. but a readme for every utility can be found using the corresponding menu (on configuration). The collection of scripts provided here are not only a direct replacement of [Random Pools](https://www.foobar2000.org/components/view/foo_random_pools) or [MusicIp](https://www.spicefly.com/section.php?section=musicip) but an improvement in many aspects of those tools.

* Macros: allows to record and save the menus entries used as a macro to be called later. Works with all tools. (only limitation are popups, which still require user input)
* Fully configurable submenu entries: shift + left click on menu button allows to switch tools functionality. Individual tools or entire submenus may be disabled/enabled. When all entries from a tool are disabled, the entire script files associated are omitted at loading.
* User configurable presets: many tools allow you to add your own presets (for ex. Standard Queries) as menu entries for later use. They may be used along macros to greatly expand their functionality.

The sky is the limit once you use the current scripts to create your own buttons and tools. Currently contains pre-defined use-cases for these scripts:
* Most played tracks from... :
	.\xxx*scripts\top_tracks.js  
	.\xxx*scripts\top_tracks_from_date.js  
* Top Rated tracks from...: date or range of dates.
	.\xxx*scripts\top_rated_tracks.js  
* Search same by tags...: dynamic queries matching X tags from selection.
	.\xxx*scripts\search_same_by.js
* Standard Queries: like foobar search but allowing presets.
	.\xxx*scripts\dynamic_query.js
* Dynamic Queries: queries with placeholders evaluated with selection.
	.\xxx*scripts\dynamic_query.js
* Similar by...: aka [Search-by-Distance-SMP](https://github.com/regorxxx/Search-by-Distance-SMP)
	.\xxx*scripts\search_bydistance.js
* Special Playlists...: contains functionality from the other scripts
	.\xxx*scripts\search_bydistance.js  
	.\xxx*scripts\search_same_by.js  
* Playlist manipulation: multiple tools for playlist edits
	* Remove duplicates: using configurable tags
		.\xxx*scripts\remove_duplicates.js
	* Query filtering: filters current playlist with a query
		.\xxx*scripts\filter_by_query.js
	* Harmonic mix: aka [Camelot-Wheel-Notation](https://github.com/regorxxx/Camelot-Wheel-Notation)
		.\xxx*scripts\harmonic_mixing.js
	* Find or create playlist
	* Cut playlist length (for macros) 
	* Send playlist's tracks to (for macros) 
	* Go to playlist (for macros) 
	* Close playlist (for macros) 
* Selection manipulation 
	* Harmonic mix: aka [Camelot-Wheel-Notation](https://github.com/regorxxx/Camelot-Wheel-Notation)
		.\xxx*scripts\harmonic_mixing.js
	* Sort  
		* Randomize  
		* Reverse  
		* By Mood  
		* By Date  
		* By BPM  
		* By key: aka [Camelot-Wheel-Notation](https://github.com/regorxxx/Camelot-Wheel-Notation)
			.\xxx*scripts\sort_by_key.js
		* By Dyngenre: aka [Search-by-Distance-SMP](https://github.com/regorxxx/Search-by-Distance-SMP)
			.\xxx*scripts\search_bydistance.js
	* Scatter by tags: reorders selection to avoid consecutive tracks with the same configurable tag.
		.\xxx*scripts\scatter_by_tags.js
	* Find now playling track in...  
		.\xxx*scripts\find_remove_from_playlists.js
	* Find track(s) in...  
		.\xxx*scripts\find_remove_from_playlists.js
	* Remove track(s) from...  
		.\xxx*scripts\find_remove_from_playlists.js
	* Send selection to playlist... (for macros)  
	* Select (for macros)  
		* By halves
		* By thirds
		* By quarters
		* First / Last track
		* Random track / Random # tracks
		* Delete selected / non selected tracks
* Other tools  
	* Check tags: checks selection to find errors on tags (useful on entire library).
		.\xxx*scripts\check_library_tags.js
	* Write tags: "macro" to write some tags.
		.\xxx*scripts\tags_automation.js
	* Playlist Revive: replaces and expands playlist revive component.
		.\xxx*scripts\playlist_revive.js
* Pools (WIP)  
* Macros  

The menus are highly customizable. They are created on demand according to the selected tracks or current playlist, and many entries can be added, removed or edited to suit your needs. Also if some scripts are missing, the menu is rebuilt skipping those entries (letting you to install selectively what you need).

![Animation8](https://user-images.githubusercontent.com/83307074/116756213-4259d100-a9fb-11eb-9452-657389977f69.gif)

![Animation10](https://user-images.githubusercontent.com/83307074/116756219-4685ee80-a9fb-11eb-80be-413f0e691dd4.gif)

### Also integrates
 1. [Search-by-Distance-SMP](https://github.com/regorxxx/Search-by-Distance-SMP): creates intelligent "spotify-like" playlist using high-level data from tracks and computing their similarity using genres/styles.
 2. [Music-Graph](https://github.com/regorxxx/Music-Graph): An open source graph representation of most genres and styles found on popular, classical and folk music.
 3. [Camelot-Wheel-Notation](https://github.com/regorxxx/Camelot-Wheel-Notation): Javascript implementation of the Camelot Wheel, ready to use "harmonic mixing" rules and translations for standard key notations.
 4. [Menu-Framework-SMP](https://github.com/regorxxx/Menu-Framework-SMP): Helper which allows to easily create customizable and dynamic menus.

![playlist_tools_menu_05](https://user-images.githubusercontent.com/83307074/116759000-cebac280-aa00-11eb-8a81-9a450e13205a.gif)

## Installation
Copy all files from the zip into YOUR_FOOBAR_PROFILE_PATH\scripts\SMP\xxx-scripts  
Any other path WILL NOT work without editing the scripts. (see images\_Installation_*jpg)  
For ex: mine is c:\Users\xxx\AppData\Roaming\foobar2000\scripts\SMP\xxx-scripts\...  
For portable installations >= 1.6: .\foobar2000\profile\scripts\SMP\xxx-scripts\...  
For portable installations <= 1.5: .\foobar2000\scripts\SMP\xxx-scripts\...  
Then load any button script into a SMP panel within foobar.  

There are buttons bars and independent buttons for each script and the playlist tools menu. 'buttons_playlist_tools_menu.js' is associated to the tools menu seen on the gifs, while '_buttons_merged.js' is the entire bar.

[changelog]: CHANGELOG.md
[version_badge]: https://img.shields.io/github/release/regorxxx/Playlist-Tools-SMP.svg
[codacy_badge]: https://api.codacy.com/project/badge/Grade/e04be28637dd40d99fae7bd92f740677
[codefactor_badge]: https://www.codefactor.io/repository/github/regorxxx/Playlist-Tools-SMP/badge/main
