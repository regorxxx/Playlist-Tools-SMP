# Playlist-Tools-SMP
A collection of [Spider Monkey Panel](https://theqwertiest.github.io/foo_spider_monkey_panel) Scripts for [foobar200](https://www.foobar2000.org), built within a menu, which serves as a hub for 'usage examples' and shortcuts to the most requested foobar missing functionalities: remove duplicates by tags, revive dead items, check errors on tags, spotify-like playlist creation, advanced queries, etc.

![Animation7](https://user-images.githubusercontent.com/83307074/116756221-471e8500-a9fb-11eb-96c9-2c269bf91fef.gif)

# Features: 

![Animation9](https://user-images.githubusercontent.com/83307074/116756215-44239480-a9fb-11eb-8489-b56a178c70f4.gif)

It's impossible to offer a complete list of the things that can be done with these tools, in a few words: anything related to playlist creation, sorting, library maintenance, automation, etc. But a readme for every utility can be found using the corresponding menu.

The sky is the limit once you use the current scripts to create your own buttons and tools. Currently contains pre-defined use-cases for these scripts:
* Most played tracks from...  
	.\xxx*scripts\top_tracks.js  
	.\xxx*scripts\top_tracks_from_date.js  
* Top Rated tracks from..  
	.\xxx*scripts\top_rated_tracks.js  
* Same by...  
	.\xxx*scripts\search_same_by.js
* Similar by... (aka [Search-by-Distance-SMP](https://github.com/regorxxx/Search-by-Distance-SMP/blob/main/README.md))  
	.\xxx*scripts\search_bydistance.js
* Special Playlists... (contains functionality from the other scripts)  
	.\xxx*scripts\search_bydistance.js  
	.\xxx*scripts\search_same_by.js  
* Tools...  
	* Remove duplicates  
		.\xxx*scripts\remove_duplicates.js
	* Query filtering  
		.\xxx*scripts\filter_by_query.js
	* Harmonic mix  
		.\xxx*scripts\harmonic_mixing.js
	* Sort by key  
		.\xxx*scripts\sort_by_key.js
	* Scatter by tags  
		.\xxx*scripts\scatter_by_tags.js
	* Check tags  
		.\xxx*scripts\check_library_tags.js
	* Write tags  
		.\xxx*scripts\tags_automation.js
	* Find track(s) in...  
		.\xxx*scripts\find_remove_from_playlists.js
	* Remove track(s) from...  
		.\xxx*scripts\find_remove_from_playlists.js
	* Playlist Revive  
		.\xxx*scripts\playlist_revive.js

The menus are highly customizable. They are created on demand according to the selected tracks or current playlist, and many entries can be added, removed or edited to suit your needs. Also if some scripts are missing, the menu is rebuilt skipping those entries (letting you to install selectively what you need).

![Animation8](https://user-images.githubusercontent.com/83307074/116756213-4259d100-a9fb-11eb-9452-657389977f69.gif)

![Animation10](https://user-images.githubusercontent.com/83307074/116756219-4685ee80-a9fb-11eb-80be-413f0e691dd4.gif)

# Installation: 
Copy all files from the zip into YOUR_FOOBAR_PROFILE_PATH\scripts\SMP\xxx-scripts  
Any other path WILL NOT work without editing the scripts.  
For ex: mine is c:\Users\xxx\AppData\Roaming\foobar2000\scripts\SMP\xxx-scripts\...  
For portable installations: .\foobar2000\profile\scripts\SMP\xxx-scripts\...  
Then load any button script into a SMP panel within foobar.  
There are buttons bars and independent buttons for the individual scripts and the playlist tools menu. 'buttons_playlist_tools_menu.js' is associated to the tools menu.
