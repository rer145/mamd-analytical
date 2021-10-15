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
const { reject } = require('q');

let scripts_path = path.join(store.get("user.userdata_path"));

let sudo_options = {
	name: "MaMD Analytical",
	icns: "./assets/icons/mac/icon.icns"
}

// returns if the installation is completed
function check_installation(forceInstall) {
	reset();

	if (is.windows || is.macos) {
		if (forceInstall)
			return false;
		else
			return !store.get("settings.first_run");
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
		if (is.windows || is.macos) {
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
		if (is.macos) {
			batch_file = path.join(scripts_path, "install_rportable.sh");
		}

		console.log("Installing R-Portable:", batch_file);
		start_progress("setup-r");

		if (is.macos) {
			// check for R installed
			// if installed
			//   check R version
			//     if 3.6.2 = ok
			//     if <3.6.2 = prompt to download/install
			//     if >3.6.2 = give warning
			// if not installed
			//   prompt to download/install

			console.log("Checking for R...");
			check_for_r().then(() => check_r_version());

			let source_root = path.join(store.get("app.resources_path"), "R-Portable");
			let dest_root = path.join(store.get("user.userdata_path"), "R-Portable");

			if (is.development) {
				source_root = path.join(store.get("app.resources_path"), "R-Portable", "R-Portable-Mac");
			}

			batch_file = 'cp -a "' + source_root + '/." "' + dest_root + '/"';
		}

		if (is.windows || is.macos) {
			console.log("Executing", batch_file);
			exec.exec(
				batch_file,
				[],
				function(error, stdout, stderr) {
					console.error(error);
					end_progress("setup-r", -1, stderr);
					reject(stderr);
				},
				function(stdout, stderr) {
					console.log(stdout);
					end_progress("setup-r", 0, "R-Portable (v3.6.2) installation was successful.");
					resolve();
				},
				is.macos);
		}
	});
}

function install_packages() {
	return new Promise(function(resolve, reject) {
		let batch_file = path.join(scripts_path, "install_packages.bat");
		if (is.macos) {
			batch_file = path.join(scripts_path, "install_packages.sh");
		}

		console.log("Installing Packages:", batch_file);
		start_progress("setup-packages");

		var params = [
			store.get("app.rscript_path"),
			store.get("user.packages_path"),
			store.get("app.r_analysis_path")
		];

		if (is.macos) {
			// exec.chmod(
			// 	batch_file,
			// 	0o777,
			// 	function(error) {
			// 		console.error(error);
			// 		end_progress("setup-packages", -1, error);
			// 		reject(error);
			// 	},
			// 	function() {
			// 		console.log("Set execution permissions on install_packages.sh successfully.");
			// 	}
			// );

			exec.chmod(
				store.get("app.rscript_path"),
				0o777,
				function(error) {
					console.error(error);
					end_progress("setup-packages", -1, error);
					reject(error);
				},
				function() {
					console.log("Set execution permissions on RScript successfully.");
				}
			);

			batch_file = '"' + store.get("app.rscript_path") + '" "' + path.join(store.get("app.r_analysis_path"), "install.R") + '" "' + store.get("user.packages_path") + '"';
			params = [];
		}

		if (is.windows || is.macos) {
			console.log("Executing", batch_file);
			exec.exec(
				batch_file,
				params,
				function(error, stdout, stderr) {
					console.error(error);
					end_progress("setup-packages", -1, stderr);
					reject(stderr);
				},
				function(stdout, stderr) {
					console.log(stdout);
					end_progress("setup-packages", 0, "R package installation was successful.");
					resolve();
				},
				is.macos);
		}
	});
}

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

function set_progress(id, value, msg) {
	$("#" + id + " .progress-bar")
		.attr("aria-valuenow", value)
		.addClass("w-" + value)
		.addClass("bg-warning")
		.addClass("progress-bar-striped")
		.addClass("progress-bar-animated");

	$("#" + id + " .err pre").html(msg);
	$("#" + id + " .err").show();
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

function check_for_r() {
	let check_r_path = path.join(scripts_path, "mac-check-r.sh");
	exec.exec(
		check_r_path,
		[],
		function(error, stdout, stderr) {
			console.error(error);
			end_progress("setup-r", -1, stderr);
			reject(stderr);
		},
		function(stdout, stderr) {
			console.log(stdout);
			set_progress("setup-r", 33, "Found R installed, checking version: " + stdout);
			resolve();
		},
		is.macos);
}

function check_r_version() {
	let check_r_version_path = path.join(scripts_path, "mac-check-r-version.sh");
	exec.exec(
		check_r_version_path,
		[],
		function(error, stdout, stderr) {
			console.error(error);
			end_progress("setup-r", -1, stderr);
			reject(stderr);
		},
		function(stdout, stderr) {
			console.log(stdout);
			set_progress("setup-r", 66, "R version installed: " + stdout);
			resolve();
		},
		is.macos);
}

module.exports = {
	check_installation,
	reset,
	start,
	install_rtools,
	install_rportable,
	install_packages
};
