/*! @ryanmorr/fastmap v0.1.2 | https://github.com/ryanmorr/fastmap */
(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.fastmap = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = fastmap;

/**
 * Define a constructor with a null prototype,
 * instantiating this is much faster than explicitly
 * calling `Object.create(null)` to get a "bare"
 * empty object. Then emulate the basics of a map.
 * has, set, get, forEach
 * A valid value can not be null or undefined
 */
function EmptyObject() {}
EmptyObject.prototype = Object.create(null);
EmptyObject.prototype.has = function has(key) {return (this[key] ? true : (this[key] === 0 ? true : false));};
EmptyObject.prototype.set = function set(key, value) {return this[key] = value;};
EmptyObject.prototype.get = function get(key) {return this[key];};
EmptyObject.prototype.forEach = function forEach(fn) {return Object.entries(this).forEach((pair) => {return fn(pair[1], pair[0]);});};
EmptyObject.prototype.concat = function concat(fastmap) {Object.entries(fastmap).forEach((pair) => {this.set(pair[0], pair[1]);}); return this;};

/**
 * Create an accelerated hash map
 *
 * @param {...Object} props (optional)
 * @return {Object}
 * @api public
 */

function fastmap() {
	var map = new EmptyObject();
	const argsLen = arguments.length;
	if (arguments.length > 1) {throw new error('Constructor only accepts a single iterable or array [[key, value], ...]');}
	else if (argsLen === 1) {
		const iterator = arguments[0];
		for (var _len = iterator.length, props = new Array(_len), _key = 0; _key < _len; _key++) {
			props[_key] = {[iterator[_key][0]]: iterator[_key][1]};
		}
		
		if (props.length) {
			Object.assign.apply(Object, [map].concat(props));
		}
	}
	return map;
}

module.exports = exports.default;

},{}]},{},[1])(1)
});

