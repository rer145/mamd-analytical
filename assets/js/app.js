'use strict';
window.$ = window.jQuery = require('jquery');
window.Tether = require('tether');
window.Bootstrap = require('bootstrap');

const fs = require('fs');
const find = require('find');
const path = require('path');
const {ipcRenderer} = require('electron');
const {dialog} = require('electron').remote;

const Store = require('electron-store');
const lib = require('./assets/js/modules');

var sudo = require('sudo-prompt');

const store = new Store();
const requiredPackages = [
	'ModelMetrics',
	'nnet',
	'dplyr'
];

$(document).ready(function() {
	window.appdb = app_preload();
	window.is_dirty = false;
	app_init();

	$('[data-toggle="tooltip"]').tooltip();

	$("#new-button").on('click', function(e) {
		e.preventDefault();
		new_case();
	});

	$("#open-button").on('click', function(e) {
		e.preventDefault();
		open_case();
	});

	$("#save-button").on('click', function(e) {
		e.preventDefault();
		save_case();
	});

	$("#analysis-button").on('click', function(e) {
		e.preventDefault();
		$("html, body").animate({ scrollTop: 0 }, "fast");
		$('#tabs a[href="#results"]').tab('show');
		run_analysis();
	});

	$("#settings-rscript-button").on('change', function(e) {
		//console.log(document.getElementById("settings-rscript-button").files[0].path);
		store.set("rscript_path", document.getElementById("settings-rscript-button").files[0].path);
		check_settings();
	});

	$(document).on('click', "input.group-checkbox", function(e) {
		var group = $(this).val();
		if ($(this).is(':checked')) {
			toggleSelection(group, 1, true);
		} else {
			toggleSelection(group, 0, true);
		}
	});

	$(document).on('click', ".trait-image-button", function(e) {
		e.preventDefault();
		
		var code = $(this).parent().attr("data-trait");
		var value = $(this).parent().attr("data-value");
		toggleTraitUISelection($(this), code, value);
	});

	$(document).on('click', ".r-package-install-button", function(e) {
		e.preventDefault();

		var parent = $(this).parent();
		var pkg = $(this).attr("data-package");
		var badge = parent.find(".badge");

		var success = install_package(pkg);

		if (success) {
			//verify_package_install(package);
			badge.removeClass("badge-danger")
				.addClass("badge-success")
				.html("Installed");

		} else {
			badge.removeClass("badge-success")
				.addClass("badge-danger")
				.html("Not Installed");
			// TODO: notify user of failed install
			//   message box?
		}
	});

	// ipcRenderer.on('userdata-path', (event, message) => {
	// 	//console.log('UserData Path: ' + message);
	// 	settings.set('config.userdata_path', message);
	// });
});


function app_preload() {
	var db = JSON.parse(fs.readFileSync(path.join(__dirname, "/assets/db/db.json")).toString());
	return db;
}

function app_setupselections() {
	var output = {};
	
	var traits = window.appdb["traits"];
	for (var i = 0; i < traits.length; i++) {
		output[traits[i].abbreviation] = "NA";
	}
	
	// var groups = window.appdb["groups"];
	// for (var i = 0; i < groups.length; i++) {
	// 	output[groups[i].code] = 0;
	// }

	return output;
}

function app_init() {
	show_suggested_rscript_paths();
	//show_groups();
	show_traits();
	//check_offline_status();
	check_settings();
	//check_packages();

	//disable_button("save-button");
	//disable_button("open-button");
	//disable_button("new-button");

	$("#app-version").text(store.get("version"));

	new_case();
}

function new_case() {
	window.selections = app_setupselections();
	window.is_dirty = false;
	init_results();
	show_traits();
	$('#tabs a[href="#analysis"]').tab('show');
}

function open_case() {
	dialog.showOpenDialog({
		properties: ['openFile']
	}, function(files) {
		if (files != undefined) {
			if (files.length == 1) {
				new_case();
				var filePath = files[0];
			
				fs.readFile(filePath, 'utf8', (err, data) => {
					if (err) console.error(err);
			
					var json = JSON.parse(data);

					// TODO: populate case info
			
					$.each(json['traits'], function(key, data) {
						if (data != "NA") {
							var row = $("#trait-" + key);
							console.log("searching in " + key);
							$.each(row.find(".trait-image-button"), function (i, v) {
								if ($(this).attr("data-trait") === key && 
									$(this).attr("data-value") === data) {
										toggleTraitUISelection($(this), key, data);
									}
							});
						}
					});

					// TODO: populate results if applicable
				});
			}
		}
	})
}

function save_case() {

}

function search_for_rscript(path) {
	var span = $("#settings-found-rscript");
    find.file(/Rscript.exe/, path, function(files) {
		if (files.length > 0) {
			for (var i = 0; i < files.length; i++) {
				span.append(
					$("<a></a>")
						.attr("href", "#")
						.addClass("rscript-settings-link")
						.text(files[i])
						.on("click", function(e) {
							e.preventDefault();
							store.set("rscript_path", $(this).text());
							check_settings();
						})
				).append($("<br></br>"));
			}
		}
	})
    .error(function(err) { console.error(err); });
}

function init_results() {
	$("#analysis-pending").show();
	$("#analysis-loading").hide();
	$("#analysis-error").hide();
	$("#analysis-results").hide();
}

function check_offline_status() {
	// TODO: if offline, show warning message (no impact)
	window.is_offline = false;

	if (window.is_offline)
		$("#offline-alert").show();
	else
		$("#offline-alert").hide();
}

function check_for_updates() {
	// TODO: show message if updates are available
	if (!window.is_offline) {
		//do check
	}
}

function check_settings() {
	// TODO: if no rscript selected, 
	//   go to settings tab
	//   disable run analysis button
	if (store.get("rscript_path") === undefined) {
		$("#settings-alert").show();
		disable_button("analysis-button");
		$('#tabs a[href="#settings"]').tab('show');
	} else {
		$("#settings-alert").hide();
		$('#tabs a[href="#analysis"]').tab('show');
		enable_button("analysis-button");
	}
}

function check_packages() {
	var div = $("#settings-r-packages");
	div.empty();

	$.each(requiredPackages, function(i, v) {
		//verify_package_install(v);
		var template = $("#r-package-template").clone();
		template.removeClass("template");
		template.removeAttr("id");

		template.find(".r-package-name").html(v);
		
		var badge = template.find(".badge");
		var button = template.find(".r-package-install-button");
		button.attr("data-package", v);

		var installed = verify_package_install(v);
		if (installed) {
			badge.removeClass("badge-danger").addClass("badge-success").html("Installed");
			button.hide();
		} else {
			badge.removeClass("badge-success").addClass("badge-danger").html("Not Installed");
			button.show();
		}

		div.append(template);
	});
}

function show_suggested_rscript_paths() {
	var span = $("#settings-found-rscript");
	span.empty().html('<p class="loading">Loading suggested paths...</p>');

	if (process.platform === "win32" || process.platform === "win64") {
		search_for_rscript('C:\\Program Files\\R');
		search_for_rscript('C:\\Program Files\\Microsoft\\R Open');
	}

	if (process.platform === "darwin") {
        search_for_rscript('/Library/Frameworks/R.framework/Resources/bin');
		search_for_rscript('/usr/bin/Rscript');
        search_for_rscript("/Library/Frameworks/R.framework/Versions/3.5.1-MRO/Resources/bin/");
	}
	
	span.find("p.loading").remove();
}

function show_groups() {
	var div = $("#group-list");
	div.empty();

	var groups = window.appdb["groups"];

	for (var i = 0; i < groups.length; i++) {
		var wrapper = $("<div></div>");
		wrapper.addClass("form-check").addClass("form-check-inline");
		
		var input = $("<input></input>");
		input
			.addClass("form-check-input")
			.addClass("group-checkbox")
			.attr("type", "checkbox")
			.attr("id", "chk" + groups[i].code)
			.attr("value", groups[i].code);
		
		var label = $("<label></label>");
		label
			.addClass("form-check-label")
			.attr("for", "chk" + groups[i].code)
			.text(groups[i].display);

		wrapper.append(input).append(label);
		div.append(wrapper);
	}
}

function show_traits() {
	var div = $("#trait-list");
	div.empty();

	var traits = window.appdb["traits"];

	for (var i = 0; i < traits.length; i++) {
		var ttemplate = $("#trait-template").clone();
		ttemplate.removeClass("template")
			.attr("id", "trait-" + traits[i].abbreviation);
		ttemplate.find(".trait-name").text(traits[i].name);
		ttemplate.find(".trait-abbreviation").text(traits[i].abbreviation);
		ttemplate.find(".trait-title").attr("title", traits[i].title);
		
		for (var j = 0; j < traits[i].images.length; j++) {
			var itemplate = $("#trait-image-template").clone();
			itemplate.removeClass("template")
				.attr("id", traits[i].abbreviation + "-trait-image-" + j)
				.attr("data-trait", traits[i].abbreviation)
				.attr("data-value", traits[i].images[j].value);
			itemplate.find(".trait-image-button")
				.attr("data-trait", traits[i].abbreviation)
				.attr("data-value", traits[i].images[j].value);
			itemplate.find(".trait-image")
				.attr("src", path.join(__dirname, "/assets/img/" + traits[i].images[j].filename))
				.attr("alt", traits[i].images[j].text + " " + j);

			var col = ttemplate.find(".trait-col" + (j+1).toString());
			col.append(itemplate);
		}
		div.append(ttemplate);
	}
}

function toggleTraitUISelection(obj, code, value) {
	var parent = $("#trait-" + code);

	if (obj.hasClass("btn-primary")) {
		obj.removeClass("btn-primary");
		toggleSelection(code, "NA", false);
	} else {
		$.each(parent.find(".trait-image-button"), function(i,v) {
			$(v).removeClass("btn-primary").addClass("btn-default");
		});
		obj.addClass("btn-primary");
		toggleSelection(code, value, false);
	}
}

function toggleSelection(code, value, isExplicit) {
	window.is_dirty = true;
	
	if (isExplicit) {
		window.selections[code] = value;
	} else {
		if (window.selections[code] === value) 
			window.selections[code] = "NA";
		else
			window.selections[code] = value;
	}
	
	console.log(window.selections);
}

function toggleIsDirty() {
	if (window.is_dirty) {
		window.is_dirty = false;
		disable_button("save-button");
	} else {
		window.is_dirty = true;
		enable_button("save-button");
	}
}

function generate_inputfile() {
	console.log("Generating input file...");
	console.log(window.selections);

	var keys = [];
	var values = [];
	for (var key in window.selections) {
		keys.push(key);
		values.push(window.selections[key]);
	}

	var header = keys.join(",");
	var inputs = values.join(",");

	try {
		var filepath = path.join(store.get("analysis_path"), new Date().valueOf().toString() + "-input.csv");
		fs.writeFileSync(filepath, header + '\n' + inputs + '\n');
		return filepath;
	} catch(err) { 
		console.log(err);
		return "";
	}
}

function generate_outputfile(input_file) {
	var ts = input_file.replace("-input.csv", "").replace(store.get("analysis_path"), "");
	var filepath = path.join(store.get("analysis_path"), ts + "-output.txt");
	return filepath;
}

function run_analysis() {
	$("#analysis-pending").hide();
	$("#analysis-results").hide();
	$("#analysis-error").hide();
	$("#analysis-loading").show();
	
	var packages_path = store.get("packages_path");
	//var data_path = store.get("userdata_path");
	var analysis_path = store.get("analysis_path");
	var input_file = generate_inputfile();
	var output_file = generate_outputfile(input_file);
	var r_script = path.join(analysis_path, "mamd.R");

	var proc = require('child_process');
	var parameters = [
		r_script,
		packages_path,
		analysis_path,
		input_file,
		output_file
	];

	// D:\work\hefner\hefner-electron-boilerplate\assets\r\mamd.r
	// C:\Users\ronri\AppData\Roaming\MaMD Analytical
	// C:\Users\ronri\AppData\Roaming\MaMD Analytical\1565151398636-input.csv
	// C:\Users\ronri\AppData\Roaming\MaMD Analytical\1565151398636-output.txt

	$("#analysis-parameters").empty();
	$.each(parameters, function(i,v) {
		$("#analysis-parameters").append(v).append("<br />");
	});
	
	if (input_file.length > 0) {
		// proc.execFile(store.get("rscript_path"), parameters, function(err, data) {
		// 	if(err){
		// 		$("#analysis-error-message").empty().text(err);
		// 		$("#analysis-error").show();
		// 		return;
		// 	}

		// 	$("#analysis-results-1").text(data);
		// 	show_results(output_file);
		// });

		var options = {
			name: 'MaMD Analysis Subprocess'
		};
		var cmd = '"' + store.get("rscript_path") + '"';
		$.each(parameters, function(i,v) {
			cmd = cmd + ' "' + v + '"';
		});
		//cmd = cmd.replace("\\", "\\\\g");

		sudo.exec(cmd, options,
			function(error, stdout, stderr) {
				if (error) {
					console.error(error);
					console.log(stderr);
					$("#analysis-error-message").empty().text(error);
					$("#analysis-error").show();
					return;
				}
				console.log('stdout: ' + JSON.stringify(stdout));
				console.log('stderr: ' + JSON.stringify(stderr));
				$("#analysis-results-1").text(stdout);
				show_results(output_file);
			}
		);

	} else {
		$("#analysis-error-message").empty().text("No inut file was generated.");
		$("#analysis-error").show();
		return;
	}

	//var timeout = setTimeout(show_results, 5000);
}

function show_results(output_file) {
	// TODO: read output_file and parse
	//   populate #analysis-results-1, 2, 3
	
	$("#analysis-loading").hide();
	$("#analysis-error").hide();
	$("#analysis-results").show();
	enable_button("save-button");
}

function enable_button(id) {
	$("#" + id).removeAttr("disabled").removeClass("disabled");
}

function disable_button(id) {
	$("#" + id).attr("disabled", "disabled").addClass("disabled");
}

function install_package(pkg) {
	var proc = require('child_process');

	var analysis_path = store.get("analysis_path");
	var r_script = path.join(analysis_path, "install_package.R");
	var parameters = [
		r_script,
		pkg
	];

	proc.execFile(store.get("rscript_path"), parameters, function(err, data) {
		if(err){
			console.error(err);
			return false;
		}
		console.log("exec done");
		return true;
	});
}

function verify_package_install(pkg) {
	console.log("Verifying package install: " + pkg);

	var proc = require('child_process');

	var analysis_path = store.get("analysis_path");
	var r_script = path.join(analysis_path, "verify_package.R");
	var parameters = [
		r_script,
		pkg
	];

	proc.execFile(store.get("rscript_path"), parameters, function(err, data) {
		if(err){
			console.error(err);
			return false;
		} else {
			console.log(pkg + " INCLUDES FALSE: " + data.includes("FALSE"));
			console.log(pkg + " INCLUDES TRUE: " + data.includes("TRUE"));
			if (data.includes("FALSE"))
				return false;
			if (data.includes("TRUE"))
				return true;
		}
		
		// fallthrough
		return false;
	});

	console.log("Done verifying " + pkg);
}








/***** IPC RENDERER *****/
ipcRenderer.on('new-case', (event, arg) => {
	new_case();
});

ipcRenderer.on('open-case', (event, arg) => {
	open_case();
});

ipcRenderer.on('save-case', (event, arg) => {
	save_case();
});

ipcRenderer.on('settings', (event, arg) => {
	$('#tabs a[href="#settings"]').tab('show');
});