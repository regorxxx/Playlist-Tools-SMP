'use strict';
//06/03/23

class InputError extends Error {
    constructor(message) {
        super(message);
        this.name = "InputError";
    }
}