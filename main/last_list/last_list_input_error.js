'use strict';
//07/05/24

/* exported InputError */

class InputError extends Error {
	constructor(message) {
		super(message);
		this.name = 'InputError';
	}
}