'use strict';
//07/05/24

/* exported LastListHelpers */

class LastListHelpers {
	static cleanString(str) {
		return str.replace(/&#39;/g, '\'')
			.replace(/&#38;/g, '&')
			.replace(/&#34;/g, '"')
			.replace(/&#60;/g, '<')
			.replace(/&#62;/g, '>')
			.replace(/&amp;/g, '&')
			.replace(/&quot;/g, '"')
			.replace(/&lt;/g, '<')
			.replace(/&gt;/g, '>')
			.replace(/&nbsp;/g, ' ')
			.replace(/remastered/gi, '')
			.trim();
	}

	static cleanId(str) {
		return str.replace(/['"&\\<> .,-]/g, '');
	}

	static hashCode(str, seed = 0) {
		let h1 = 0xdeadbeef ^ seed,
			h2 = 0x41c6ce57 ^ seed;
		for (let i = 0, ch; i < str.length; i++) {
			ch = str.charCodeAt(i);
			h1 = Math.imul(h1 ^ ch, 2654435761);
			h2 = Math.imul(h2 ^ ch, 1597334677);
		}

		h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
		h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);

		return 4294967296 * (2097151 & h2) + (h1 >>> 0);
	}
}