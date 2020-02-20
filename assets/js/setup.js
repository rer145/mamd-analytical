'use strict';

//var exec = require('./assets/js/exec');

function full_install(error_callback, result_callback) {
	var params = [
		// location of RScript.exe
		store.get("app.rscript_path"),

		// ignored
		"",

		// location of R package source files
		store.get("app.r_package_source_path"),

		// location to install R packages
		store.get("user.packages_path"),

		// location of R install/verify scripts
		store.get("user.analysis_path")
	];

	let cmd = path.join(store.get("app.resources_path"), "install.bat");

	exec.execFile(
		cmd, 
		params, 
		error_callback,
		result_callback
	);
}

module.exports = { full_install };