'use strict';
//13/10/21

/*
	Save tags
	Utility to compare tags between different sources (for ex. for checking backups).
	- Select source A, and save its tags to a file.
	- Select source B and compare against tags file from Source A.
	- Replace root paths for comparing:
		- Source A may be at: H:\Music\... 				-> 		Root: 'H:\'
		- Source B may be at: D:\Backup\Music\... 		-> 		Root: 'D:\Backup\'
	- Utility will report not matched files and files with differences.
	- Tags from source A may be applied to Source B if desired, for those files which have differences.
 */
 
include('..\\helpers\\helpers_xxx.js');
include('..\\helpers\\helpers_xxx_tags.js');
include('..\\helpers\\helpers_xxx_properties.js');
include('..\\helpers\\helpers_xxx_file.js');

function saveTags({
					selItems = plman.GetPlaylistSelectedItems(plman.ActivePlaylist),
					file = folders.data + 'tags.json',
					} = {}) {
	let tags = [];
	let handleInfo = {};
	let handleTags = {};
	selItems.Sort();
	const count = selItems.Count;
	const selItemsArr = selItems.Convert();
	for (let i = 0; i < count; i++) {
		handleTags = {};
		handleInfo = {};
		const handle = selItemsArr[i];
		const fileInfo = handle.GetFileInfo();
		const metaCount = fileInfo.MetaCount;
		// const file = fso.GetFile(selItemsArr[i].Path).OpenAsTextStream(1, -2).ReadAll();
		// const crc = crc32(file);
		// handleInfo.crc = crc;
		const md5Idx = fileInfo.InfoFind('md5');
		handleInfo.rawPath = handle.RawPath;
		handleInfo.subSong = handle.SubSong;
		handleInfo.md5 = md5Idx !== -1 ? fileInfo.InfoValue(md5Idx) : -1;
		for (let j = 0; j < metaCount; j++) {
			const metaValueCount = fileInfo.MetaValueCount(j);
			const name = fileInfo.MetaName(j).toLowerCase();
			if (metaValueCount > 1) {
				handleTags[name] = [];
				for (let h = 0; h < metaValueCount; h++) {
					handleTags[name].push(fileInfo.MetaValue(j, h));
				}
			} else {
					handleTags[name] = fileInfo.MetaValue(j, 0);
			}
		}
		handleInfo.handleTags = handleTags;
		tags.push(handleInfo);
	}
	if (!_isFolder(folders.data)) {_createFolder(folders.data);}
	_save(file, JSON.stringify(tags, null, 3));
}

function compareTags({
					selItems = plman.GetPlaylistSelectedItems(plman.ActivePlaylist),
					selItemsFolder = 'H:\\',
					toTags = _jsonParseFileCheck(folders.data + 'tags.json', 'Tags json', 'Compare tags', convertCharsetToCodepage('UTF-8')),
					toTagsFolder = 'H:\\',
					} = {}) {
	if (!toTags || !selItems || !selItemsFolder || !toTagsFolder) {return;}
	let tags = [];
	let handleInfo = {};
	let handleTags = {};
	selItems.Sort();
	const count = selItems.Count;
	const selItemsArr = selItems.Convert();
	for (let i = 0; i < count; i++) {
		handleTags = {};
		handleInfo = {};
		const handle = selItemsArr[i];
		const fileInfo = handle.GetFileInfo();
		const metaCount = fileInfo.MetaCount;
		const md5Idx = fileInfo.InfoFind('md5');
		handleInfo.rawPath = handle.RawPath;
		handleInfo.subSong = handle.SubSong;
		handleInfo.md5 = md5Idx !== -1 ? fileInfo.InfoValue(md5Idx) : -1;
		for (let j = 0; j < metaCount; j++) {
			const metaValueCount = fileInfo.MetaValueCount(j);
			const name = fileInfo.MetaName(j).toLowerCase();
			if (metaValueCount > 1) {
				handleTags[name] = [];
				for (let h = 0; h < metaValueCount; h++) {
					handleTags[name].push(fileInfo.MetaValue(j, h));
				}
			} else {
					handleTags[name] = fileInfo.MetaValue(j, 0);
			}
		}
		handleInfo.handleTags = handleTags;
		tags.push(handleInfo);
	}
	const toEditHandles = [];
	const toEditTags = [];
	const toReport = [];
	const toReportNoMatch = [];
	tags.forEach((fileInfo, i) => {
		const idx = toTags.findIndex((fileInfoRef) => {
			return fileInfoRef.rawPath.replace(toTagsFolder, '') === fileInfo.rawPath.replace(selItemsFolder, '') && fileInfoRef.subSong === fileInfo.subSong &&  fileInfoRef.md5 === fileInfo.md5
		});
		if (idx !== -1) {
			if (JSON.stringify(fileInfo.handleTags) !== JSON.stringify(toTags[idx].handleTags)) {
				toReport.push(fileInfo.rawPath);
				toEditHandles.push(selItemsArr[i]);
				toEditTags.push(toTags[idx].handleTags);
			}
		} else {
			toReportNoMatch.push(fileInfo.rawPath);
		}
	});
	if (toReportNoMatch.length) {
		fb.ShowPopupMessage(toReportNoMatch.join('\n'), 'Files without match')
	}
	if (toReport.length) {
		fb.ShowPopupMessage(toReport.join('\n'), 'Report')
		const answer = WshShell.Popup('Do you want to apply reference tags to the currently selected tracks?\n(Only matched reported tracks will be edited)', 0, 'Edit tags', popup.question + popup.yes_no);
		if (answer === popup.yes) {
			const handleList = new FbMetadbHandleList(toEditHandles);
			handleList.UpdateFileInfoFromJSON(JSON.stringify(toEditTags));
		}
	} else {fb.ShowPopupMessage('All matched tracks\' tags are equal to the source tracks\' tags.\n(There may be files wihout match, look for other poppups)', 'Report')}
}