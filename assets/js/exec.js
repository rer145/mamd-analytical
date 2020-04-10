'use strict';

const sp = require('sudo-prompt');
const cp = require('child_process');
const fs = require('fs');

function chmod(path, mode, error_callback, result_callback) {
	// fs.access(path, fs.constants.X_OK, (err) => {
	// 	if (err) {
	// 		error_callback(err);
	// 	} else {
			fs.chmod(path, mode, (err2) => {
				if (err2)
					error_callback(err2);
				else
					result_callback();
			});
	// 	}
	// });
}

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

function exec(file, parameters, error_callback, result_callback, unquoteFile) {
	//this should do a UAC prompt
	//let cmd = 'cmd.exe /c "' + file + '"';
	let cmd = '"' + file + '"';
	if (unquoteFile != undefined && unquoteFile) {
		cmd = file;
	}

	$.each(parameters, function(i,v) {
		cmd = cmd + ' "' + v + '"';
	});

	

	console.warn("Executing [" + cmd + "]");

	cp.exec(
		cmd,
		parameters,
		function (error, stdout, stderr) {
			if (error)
				error_callback(error, stdout, stderr);
			else
				result_callback(stdout, stderr);
		}
	);
}

function batch(file, parameters) {
	let params = ['/c', file];
	$.each(parameters, function(k,v) {
		//params.push(v.replace(/\s/g, "+"));
		params.push(v)
	});
	console.log(params);

	return cp.spawn('cmd.exe', params);
}

function execBat(file, parameters, error_callback, result_callback) {
	let cmd = '"' + file + '"';
	$.each(parameters, function(i,v) {
		cmd = cmd + ' "' + v.replace(/\s/g, "+") + '"';
	});

	console.warn("Executing [" + cmd + "]");

	cp.execFile(
		cmd,
		parameters,
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

module.exports = { chmod, sudo, exec, batch, execBat, execFile, spawn };