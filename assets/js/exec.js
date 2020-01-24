'use strict';

var sp = require('sudo-prompt');
var cp = require('child_process');

function sudo(command, options, error_callback, result_callback) {
	sp.exec(
		command, 
		options, 
		function (error, stdout, stderr) {
			if (error)
				error_callback(error, stdout, stderr);
			else
				result_callback(stdout, stderr);
		}
	);
}

function execFile(file, parameters, error_callback, result_callback) {
	cp.execFile(
		file, 
		parameters, 
		function (error, stdout, stderr) {
			if (error)
				error_callback(error, stdout, stderr);
			else
				result_callback(stdout, stderr);
		}
	);
}

function spawn(file, parameters, error_callback, result_callback) {
	// cp.spawn(
	// 	file, 
	// 	parameters, 
	// 	function (error, stdout, stderr) {
	// 		if (error)
	// 			error_callback(error, stdout, stderr);
	// 		else
	// 			result_callback(stdout, stderr);
	// 	}
	// );
}

module.exports = { sudo, execFile, spawn };