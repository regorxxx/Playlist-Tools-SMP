// Copyright J. Chris Anderson 2007 
// Retain this notice. 
// Released under the LGPL 3
// http://www.gnu.org/licenses/lgpl.html
'use strict';

const XSPF = {
	XMLfromString: function(string) {
		let doc = null;
		if (window.ActiveXObject || ActiveXObject) {
			doc = new ActiveXObject("Microsoft.XMLDOM");
			doc.async = "false";
			doc.loadXML(string);
		} else {
			let parser = new DOMParser();
			doc = parser.parseFromString(string,"text/xml");
		}
		return doc;
	},
	toJSPF : function(xml_dom) {
		const pl =  this.parse_playlist(xml_dom);
		return {playlist:pl};
	},
	emptyJSPF : function() {
		const pl =  this.parse_playlist(this.XMLfromString(''));
		return {playlist:pl};
	},
	parse_playlist : function(xspf) {
		const playlist = new Object;
		const xspf_playlist = xspf.getElementsByTagName('playlist')[0] || new ActiveXObject("Microsoft.XMLDOM");
		const trackList = xspf_playlist.getElementsByTagName('trackList')[0] || new ActiveXObject("Microsoft.XMLDOM");
		playlist.title = this.get_contents(xspf_playlist, 'title')[0];
		playlist.creator = this.get_contents(xspf_playlist, 'creator')[0];
		playlist.annotation = this.get_contents(xspf_playlist, 'annotation')[0];
		playlist.info = this.strWh(this.get_contents(xspf_playlist, 'info')[0]);
		playlist.location = this.strWh(this.get_contents(xspf_playlist, 'location')[0]);
		playlist.identifier = this.strWh(this.get_contents(xspf_playlist, 'identifier')[0]);
		playlist.image = this.strWh(this.get_contents(xspf_playlist, 'image')[0]);
		playlist.date = this.strWh(this.get_contents(xspf_playlist, 'date')[0]);

		const attrs = this.getDirectChildrenByTagName(xspf_playlist,'attribution')[0];
		if (attrs) playlist.attribution = this.getKeyValuePairs(attrs,['location','identifier']);

		const linknodes = this.getDirectChildrenByTagName(xspf_playlist,'link');
		playlist.link = this.getRelValuePairs(linknodes);
		 
		const metanodes = this.getDirectChildrenByTagName(xspf_playlist,'meta');
		playlist.meta = this.getRelValuePairs(metanodes,true);
		 
	  
		playlist.license = this.strWh(this.get_contents(xspf_playlist, 'license')[0]);

		playlist.extension = {};
		const extnodes = this.getDirectChildrenByTagName(xspf_playlist,'extension');
		for (var i=0; i < extnodes.length; i++) {
			const node = extnodes[i];
			const app = node.getAttribute('application');
			if (app) {
				playlist.extension[app] = playlist.extension[app] || [];
				const extension = this.getExtensionReader(app,'playlist')(node);
				playlist.extension[app].push(extension);
			}
		}
		var test = new FbProfiler('parse_tracks');
		playlist.track = this.parse_tracks(trackList);
		test.Print();
		
		return playlist;
	},
	getExtensionReader: function(appname,pltr) {
		if (XSPF.extensionParsers[pltr][appname]) {
			return XSPF.extensionParsers[pltr][appname];
		} else {
			return function(node) {return XSPF.getUniqueKeyValuePairs(node)};
		}
	},
	extensionParsers: {
		playlist: {},
		track: {}
	},
	getUniqueKeyValuePairs: function(node,filter) {
		let result = {};
		for (let y=0; y < node.childNodes.length; y++) {
			const attr = node.childNodes[y];
			if (attr.tagName) {
				if (!filter || (filter && (filter.indexOf(attr.tagName) != -1))) {
					result[attr.tagName] = this.node_text(attr);
				}
			} 
		}
		return result;
	},
	getKeyValuePairs: function(node,filter,nowrap) {
		let result = [];
		for (let y=0; y < node.childNodes.length; y++) {
			let value = {};
			const attr = node.childNodes[y];
			if (attr.tagName) {
				if (!filter || (filter && (filter.indexOf(attr.tagName) != -1))) {
					value[attr.tagName] = this.node_text(attr);
					result.push(nowrap ? this.node_text(attr) : value);
				}
			} 
		}
		return result;
	},
	getRelValuePairs: function(nodes,preserve_whitespace) {
		let result = [];	
		for (let y=0; y < nodes.length; y++) {
			const ln = nodes[y];
			const rel = ln.getAttribute('rel');
			if (rel) {
				let link = {};
				link[rel] = preserve_whitespace ? this.node_text(ln) : this.strWh(this.node_text(ln));
				result.push(link);
			}
		}
		return result;
	},
	getDirectChildrenByTagName: function(source_node,tag_name) {
		const nodes = source_node.childNodes;
		let matches = [];
		for (let i=0; i < nodes.length; i++) {
			const node = nodes[i];
			if (node.tagName == tag_name) {
				matches.push(node);
			}
		}
		return matches;
	},
	parse_tracks : function(xml) {
		const xspf_tracks = this.getDirectChildrenByTagName(xml,'track');
		const xspf_playlist_length = xspf_tracks.length;
		let tracks = new Array(xspf_playlist_length);
		for (let i=0; i < xspf_playlist_length; i++) {
			let t = new Object;
			const xspf_track = xspf_tracks[i];
			
			t.annotation = this.get_contents(xspf_track, 'annotation', 0)[0];
			t.title = this.get_contents(xspf_track, 'title', 0)[0];
			t.creator = this.get_contents(xspf_track, 'creator', 0)[0];
			t.info = this.strWh(this.get_contents(xspf_track, 'info', 0)[0]);
			t.image = this.strWh(this.get_contents(xspf_track, 'image', 0)[0]);
			t.album = this.get_contents(xspf_track, 'album', 0)[0];
			t.trackNum = this.strWh(this.get_contents(xspf_track, 'trackNum', 0)[0])/1;
			t.duration = this.strWh(this.get_contents(xspf_track, 'duration', 0)[0])/1;
			
			t.location = this.strWh(this.getKeyValuePairs(xspf_track,['location'],true));
			t.identifier = this.strWh(this.getKeyValuePairs(xspf_track,['identifier'],true));
			
			const linknodes = this.getDirectChildrenByTagName(xspf_track,'link');
			t.link = this.getRelValuePairs(linknodes);
			
			const metanodes = this.getDirectChildrenByTagName(xspf_track,'meta');
			t.meta = this.getRelValuePairs(metanodes);
			
			t.extension = new Object;
			const extnodes = this.getDirectChildrenByTagName(xspf_track,'extension');
	
			if (extnodes.length > 0) {
				for (let j=0; j < extnodes.length; j++) {
					const node = extnodes[j];
					const app = node.getAttribute('application');
					if (app) {
						t.extension[app] = t.extension[app] || [];
						const extension = this.getExtensionReader(app,'track')(node);
						t.extension[app].push(extension);
					}
				}
			}

			tracks[i] = t;
		} 
		return tracks; 
	},
	
	get_contents : function(xml_node, tag, val = Infinity) {
		const xml_contents = xml_node.childNodes;
		const xml_contentsLength = xml_contents.length;
		const length = xml_contentsLength >= val ? val : xml_contentsLength;
		let contents = new Array(length);
		for (let i=0; i < length; i++) {
			const xml_content = xml_contents[i];
			if (xml_content.tagName == tag) {
				contents[i] = this.node_text(xml_content);
			}
		}
		return contents;
	},
	node_text : function(node) {
		if (node.childNodes && node.childNodes.length > 1) {
			return node.childNodes[1].nodeValue;
		} else if (node.firstChild) {
			return node.firstChild.nodeValue;
		}
	},
	strWh: function(arr) {
		if (!arr) return;
		let scalar;
		if(typeof arr == 'string') {
			arr = [arr];
			scalar = true;
		} else {
			scalar = false;	   
		}
		let result = [];
		for (let i=0; i < arr.length; i++) {
			let string = arr[i];
			string = string.replace(/^\s*/,'');
			string = string.replace(/\s*$/,'');
			result.push(string);
		}
		if (scalar) {
			return result[0];
		} else {
			return result;
		}
	}
};