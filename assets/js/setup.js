'use strict';

window.$ = window.jQuery = require('jquery');
window.Tether = require('tether');
window.Bootstrap = require('bootstrap');

const path = require('path');
const {is} = require('electron-util');
const Q = require('q');
const Store = require('electron-store');
const store = new Store();

const exec = require('./exec');

let scripts_path = path.join(store.get("app.resources_path"), "setup");

// returns if the installation is completed
function check_installation(forceInstall) {
	reset();

	if (is.windows) {
		if (store.get("settings.first_run")) {
			return false;
		} else {
			if (forceInstall) {
				return false;
			} else {
				return true;
			}
		}
	}

	return true;
}

function reset() {
	reset_progress("setup-rtools");
	reset_progress("setup-r");
	reset_progress("setup-packages");
}

function start() {
	reset();
	
	return new Promise(function(resolve, reject) {
		if (is.windows) {
			setTimeout(function() {
				install_rtools()
					.then(function(response) {
						install_rportable()
							.then(function(response) {
								install_packages()
									.then(function(response) {
										resolve();
									}, function(error) {
										reject("Packages install error:", error);
									});
							}, function(error) {
								reject("R install error:", error);
							});
					}, function(error) {
						reject("RTools install error:", error);
					});
			});
		}
		else if (is.macos) {
			resolve("No installation configured for MacOS");
		}
		else {
			resolve("Operating System not compatible.");
		}
	});
}

function install_rtools() {
	return new Promise(function(resolve, reject) {
		resolve();
	});

	// return new Promise(function(resolve, reject) {
	// 	let batch_file = path.join(scripts_path, "install_rtools.bat");
	// 	console.log("Installing RTools:", batch_file);
	
	// 	start_progress("setup-rtools");
	
	// 	const bat = exec.batch(batch_file, []);
	// 	// bat.stdout.on('data', (data) => {
	// 	// 	let str = String.fromCharCode.apply(null, data);
	// 	// 	console.info(str);
	// 	// });
	// 	// bat.stderr.on('data', (data) => {
	// 	// 	let str = String.fromCharCode.apply(null, data);
	// 	// 	console.error(str);
	// 	// });
	
	// 	bat.on('exit', (code) => {
	// 		let msg = "";
	// 		switch (code) {
	// 			case 0:
	// 				msg = "RTools installation was successful.";
	// 				break;
	// 			case 1:
	// 				msg = "There was an error downloading RTools. Please check that you have an internet connection.";
	// 				break;
	// 			default:
	// 				msg = `There was an error installing RTools (${code}).`;
	// 				break;
	// 		}
	// 		end_progress("setup-rtools", code, msg);

	// 		if (code === 0)
	// 			resolve();
	// 		else
	// 			reject(code);
	// 	});
	// });
}

function install_rportable() {
	return new Promise(function(resolve, reject) {
		let batch_file = path.join(scripts_path, "install_rportable.bat");
		console.log("Installing R-Portable:", batch_file);
		start_progress("setup-r");

		const bat = exec.batch(batch_file, []);
		bat.stdout.on('data', (data) => {
			let str = String.fromCharCode.apply(null, data);
			console.info(str);
		});
		bat.stderr.on('data', (data) => {
			let str = String.fromCharCode.apply(null, data);
			console.error(str);
		});
		bat.on('exit', (code) => {
			let msg = "";
			switch (code) {
				case 0:
					msg = "R-Portable (v3.6.2) installation was successful.";
					break;
				// case 1:
				// 	msg = "There was an error setting up R environment.";
				// 	break;
				default:
					msg = `There was an error setting up R environment (${code}).`;
					break;
			}
			end_progress("setup-r", code, msg);

			if (code === 0)
				resolve();
			else
				reject(code);
		});
	});
}

// function install_package(pkg_name, idx, total) {
// 	return new Promise(function(resolve, reject) {
// 		let batch_file = path.join(scripts_path, "install_package.bat");
// 		console.log("Installing Package:", batch_file, pkg_name);
// 		update_progress("setup-packages", pkg_name, idx, total);
		
// 		var params = [
// 			store.get("app.rscript_path"),
// 			store.get("app.r_package_source_path"),
// 			store.get("user.packages_path"),
// 			store.get("app.r_analysis_path"),
// 			pkg_name
// 		];

// 		const bat = exec.batch(batch_file, params);
// 		bat.stdout.on('data', (data) => {
// 			let str = String.fromCharCode.apply(null, data);
// 			console.info(str);
// 		});
// 		bat.stderr.on('data', (data) => {
// 			let str = String.fromCharCode.apply(null, data);
// 			console.error(str);
// 		});
// 		bat.on('exit', (code) => {
// 			let msg = "";
// 			switch (code) {
// 				case 0:
// 					msg = "Installation of " + pkg_name + " was successful.";
// 					break;
// 				case 11:
// 					msg = "Argument 1 is missing -- Full path to Rscript.exe";
// 					break;
// 				case 12:
// 					msg = "Path for Rscript.exe does not exist on file system.";
// 					break;
// 				case 21:
// 					msg = "Argument 2 is missing -- Full path to package source files";
// 					break;
// 				case 22:
// 					msg = "Path for package source files does not exist on file system.";
// 					break;
// 				case 31:
// 					msg = "Argument 3 is missing -- Full path to package installation";
// 					break;
// 				case 32:
// 					msg = "Path for package installation does not exist on file system.";
// 					break;
// 				case 41:
// 					msg = "Argument 1 is missing -- Full path to install/verify scripts";
// 					break;
// 				case 42:
// 					msg = "Path for install script does not exist on file system.";
// 					break;
// 				case 43:
// 					msg = "Path for verify script does not exist on file system.";
// 					break;
// 				case 44:
// 					msg = "Path for install/verify scripts does not exist on file system.";
// 					break;
// 				case 51:
// 					msg = "Argument 5 is missing -- Name of package to install";
// 					break;
// 				default:
// 					msg = `There was an error installing ${pkg_name} (${code}).`;
// 					break;
// 			}
			
// 			if (code === 0)
// 				resolve();
// 			else
// 				reject(code);
// 		});
// 	});
// }

function install_packages() {
	return new Promise(function(resolve, reject) {
		let batch_file = path.join(scripts_path, "install_packages.bat");
		console.log("Installing Packages:", batch_file);
		start_progress("setup-packages");
		
		var params = [
			store.get("app.rscript_path"),
			store.get("app.r_package_source_path"),
			store.get("user.packages_path"),
			store.get("app.r_analysis_path")
		];

		const bat = exec.batch(batch_file, params);
		bat.stdout.on('data', (data) => {
			let str = String.fromCharCode.apply(null, data);
			console.info(str);
		});
		bat.stderr.on('data', (data) => {
			let str = String.fromCharCode.apply(null, data);
			console.error(str);
		});
		bat.on('exit', (code) => {
			let msg = "";
			switch (code) {
				case 0:
					msg = "Installation of packages were successful.";
					break;
				case 11:
					msg = "Argument 1 is missing -- Full path to Rscript.exe";
					break;
				case 12:
					msg = "Path for Rscript.exe does not exist on file system.";
					break;
				case 21:
					msg = "Argument 2 is missing -- Full path to package source files";
					break;
				case 22:
					msg = "Path for package source files does not exist on file system.";
					break;
				case 31:
					msg = "Argument 3 is missing -- Full path to package installation";
					break;
				case 32:
					msg = "Path for package installation does not exist on file system.";
					break;
				case 41:
					msg = "Argument 1 is missing -- Full path to install/verify scripts";
					break;
				case 42:
					msg = "Path for install script does not exist on file system.";
					break;
				case 43:
					msg = "Path for verify script does not exist on file system.";
					break;
				case 44:
					msg = "Path for install/verify scripts does not exist on file system.";
					break;
				default:
					msg = `There was an error installing the R packages (${code}).`;
					break;
			}
			
			if (code === 0)
				resolve();
			else
				reject(code);
		});
	});
}

// function install_packages() {
// 	let total = 5;
// 	return install_package("ModelMetrics", 1, total)
// 			.then(function(response) {
// 				install_package("nnet", 2, total)
// 					.then(function(response) {
// 						install_package("dplyr", 3, total)
// 							.then(function(response) {
// 								install_package("caret", 4, total)
// 									.then(function(response) {
// 										install_package("e1071", 5, total)
// 											.then(function(response) {
// 												resolve(response);
// 											}, function(error) {
// 												reject(error);
// 											});
// 									}, function(error) {
// 										reject(error);
// 									});
// 							}, function(error) {
// 								reject(error);
// 							});
// 					}, function(error) {
// 						reject(error);
// 					});
// 			}, function(error) {
// 				reject(error);
// 			});
// }

function reset_progress(id) {
	$("#" + id + " .setup-item-status").html("");
	$("#" + id + " .setup-item-package").html("");
		
	$("#" + id + " .progress-bar")
		.attr("aria-valuenow", 0)
		.removeClass("w-100")
		.removeClass("w-50")
		.removeClass("bg-warning")
		.removeClass("bg-success")
		.removeClass("progress-bar-striped")
		.removeClass("progress-bar-animated");
}

function start_progress(id) {
	$("#" + id + " .progress-bar")
		.attr("aria-valuenow", 50)
		.addClass("w-50")
		.addClass("bg-warning")
		.addClass("progress-bar-striped")
		.addClass("progress-bar-animated");
}

function update_progress(id, pkg_name, idx, total) {
	console.log("BEGIN");
	let percentage = idx / total;
	
	$("#" + id + " .setup-item-status").html(`${idx} of ${total}`);
	$("#" + id + " .setup-item-package").html(`(${pkg_name})`);
	
	$("#" + id + " .progress-bar")
		.attr("aria-valuenow", percentage)
		.attr("style", "width: " + percentage + "%")
		.addClass("bg-warning")
		.addClass("progress-bar-striped")
		.addClass("progress-bar-animated");

	console.log("END");
}

function end_progress(id, code, msg) {
	if (code === 0) {
		$("#" + id + " .setup-item-status").html("OK");
		
		$("#" + id + " .progress-bar")
			.attr("aria-valuenow", 100)
			.addClass("w-100")
			.removeClass("bg-warning")
			.addClass("bg-success")
			.removeClass("progress-bar-striped")
			.removeClass("progress-bar-animated");
	} else {
		$("#" + id + " .setup-item-status").html("FAILED!");

		$("#" + id + " .progress-bar")
			.attr("aria-valuenow", 100)
			.addClass("w-100")
			.removeClass("bg-success")
			.addClass("bg-danger")
			.removeClass("progress-bar-striped")
			.removeClass("progress-bar-animated");+

		$("#" + id + " .err pre").html(msg);
		$("#" + id + " .err").show();
	}
}

module.exports = { 
	check_installation, 
	reset,
	start, 
	install_rtools, 
	install_rportable, 
	install_packages,
	install_package
};