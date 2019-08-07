'use strict';
const Store = require('electron-store');

module.exports = new Store({
	defaults: {
		rscript_path: ""
	}
});
