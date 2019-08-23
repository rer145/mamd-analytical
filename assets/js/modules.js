'use strict';
const Store = require('electron-store');

const store = new Store();

function reset_analysis() {
	console.log("In module file");
	$("#app-version").text(store.get("version"));
}

module.exports = { reset_analysis };