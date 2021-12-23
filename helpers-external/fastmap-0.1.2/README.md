# fastmap

[![Version Badge][version-image]][project-url]
[![Build Status][build-image]][build-url]
[![License][license-image]][license-url]

> Accelerated hash maps

Creates an efficient key/value store by instantiating a constructor function with an empty prototype. This is much faster than using either an object literal (`{}`) or a "bare" empty object (`Object.create(null)`), making it the superior alternative for hash maps in memory intensive tasks. Full credit to [Node.js](https://github.com/nodejs/node/blob/983775d457a8022c271488a9eaac56caf8944aed/lib/events.js#L5) for the technique.

## Install

Download the [development](http://github.com/ryanmorr/fastmap/raw/master/dist/fastmap.js) or [minified](http://github.com/ryanmorr/fastmap/raw/master/dist/fastmap.min.js) version, or install via NPM:

``` sh
npm install @ryanmorr/fastmap
```

## Usage

Use just like an object literal:

``` javascript
const map = fastmap();

map.foo = 1;
map.bar = 2;

{}.toString.call(map); //=> "[object Object]"
JSON.stringify(map); //=> "{\"foo\":1,\"bar\":2}"
```

Unlike object literals, the object is empty:

``` javascript
'toString' in {}; //=> true
'toString' in hashmap(); //=> false

for (const key in map) {
    // `hasOwnProperty` check is unnecessary
}
```

Provide objects as arguments to pre-populate the map:

``` javascript
const map = fastmap({foo: 1}, {bar: 2}, {foo: 10, baz: 3});

map.foo; //=> 10
map.bar; //=> 2
map.baz; //=> 3
```

## License

This project is dedicated to the public domain as described by the [Unlicense](http://unlicense.org/).

[project-url]: https://github.com/ryanmorr/fastmap
[version-image]: https://badge.fury.io/gh/ryanmorr%2Ffastmap.svg
[build-url]: https://travis-ci.org/ryanmorr/fastmap
[build-image]: https://travis-ci.org/ryanmorr/fastmap.svg
[license-image]: https://img.shields.io/badge/license-Unlicense-blue.svg
[license-url]: UNLICENSE