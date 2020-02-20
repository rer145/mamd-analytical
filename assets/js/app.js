'use strict';
window.$ = window.jQuery = require('jquery');
window.Tether = require('tether');
window.Bootstrap = require('bootstrap');

const fs = require('fs');
const find = require('find');
const path = require('path');
const {ipcMain, ipcRenderer} = require('electron');
const {dialog, shell} = require('electron').remote;
const {is} = require('electron-util');
//const win = require('electron').BrowserWindow;

const Store = require('electron-store');
//const lib = require('./assets/js/modules');

//var sudo = require('sudo-prompt');
var exec = require('./assets/js/exec');

var Chart = require('chart.js');
var ColorSchemes = require('chartjs-plugin-colorschemes');
// color schemes: https://nagix.github.io/chartjs-plugin-colorschemes/colorchart.html

const store = new Store();
const requiredPackages = [
	'ModelMetrics',
	'nnet',
	'dplyr',
	'caret',
	'e1071'
];

var probs_chart = null;

// const groups = [
// 	{"short": "AmericanBlack", "long": "American Black"},
// 	{"short": "AmericanWhite", "long": "American White"},
// 	{"short": "Amerindian", "long": "American Indian"},
// 	{"short": "Asian", "long": "Asian"},
// 	{"short": "Guatemalan", "long": "Guatemalan"},
// 	{"short": "SWHispanic", "long": "Southwestern Hispanic"},
// 	{"short": "Thailand", "long": "Thailand"}
// ];

$(document).ready(function() {
	window.appdb = app_preload();
	window.is_dirty = false;
	window.current_file = "";
	window.current_results = "";
	
	//$('[data-toggle="tooltip"]').tooltip();
	//$('[data-toggle="popover"]').popover();

	app_init();

	$(document).on('click', "#test", function(e) {
		e.preventDefault();
		alert("test");
	});

	$('[data-toggle="tooltip"]').tooltip({
		trigger: 'focus'
	});

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

	$("#export-results-pdf").on('click', function(e) {
		e.preventDefault();
		export_to_pdf();
	});

	$("#settings-rscript-button").on('change', function(e) {
		//console.log(document.getElementById("settings-rscript-button").files[0].path);
		store.set("app.rscript_path", document.getElementById("settings-rscript-button").files[0].path);
		$("#rscript-current-path").text(store.get("app.rscript_path"));
		check_settings();
	});

	// $('a[data-toggle="tab"]').on('show.bs.tab', function(e) {
	// 	// console.log(e.target.id);
	// 	// console.log(e.relatedTarget.id);
		
	// });

	$("#settings-modal").on('show.bs.modal', function(e) {
		$("#rscript-current-path").text(store.get("app.rscript_path"));
		
		if (store.has("settings.auto_check_for_updates")) {
			$("#settings-auto-update-check").prop("checked", Boolean(store.get("settings.auto_check_for_updates")));
		} else {
			$("#settings-auto-update-check").prop("checked", true);
			store.set("settings.auto_check_for_updates", true);
		}
		check_packages();
	});

	$(document).on('click', "#settings-auto-update-check", function(e) {
		store.set("settings.auto_check_for_updates", $(this).is(':checked'));
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

		var success = install_package(pkg, parent);

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

	$(document).on('click', '#install-update-button', function(e) {
		e.preventDefault();
		//updater.performUpdate();
		ipcRenderer.send('update-start');
	});

	$(document).on('click', '#dismiss-update-button', function(e) {
		e.preventDefault();
		$("#update-alert").hide();
	});

	$(document).on('click', '#view-pdf-button', function(e) {
		e.preventDefault();
		shell.openExternal('file://' + $(this).attr("data-path"));
		$("#generic-alert").hide();
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
	//show_suggested_rscript_paths();
	//show_groups();
	show_traits();
	//check_offline_status();
	
	check_installation();
	//check_settings();
	//check_for_updates();
	
	//check_packages();

	//disable_button("save-button");
	//disable_button("open-button");
	//disable_button("new-button");

	$("#app-version").text(store.get("version"));


	probs_chart = new Chart(document.getElementById("results-probabilities"), {
		type: 'bar',
		options: {
			responsive: true,
			legend: {
				display: false
			}
		},
		data: {
			labels: [],
			datasets: [{
				labels: 'Accuracy',
				data: []
			}]
		}
	});

	new_case();
}

function new_case() {
	window.selections = app_setupselections();
	window.is_dirty = false;
	window.current_file = "";
	window.current_results = "";
	disable_button("save-button");

	init_case_info();
	init_results();
	show_traits();
	$('#tabs a[href="#analysis"]').tab('show');
}

function open_case() {
	dialog.showOpenDialog({
		properties: ['openFile'],
		title: "Open MaMD Analytical File",
		buttonLabel : "Open MaMD File",
		filters :[
			{name: 'MaMD Analytical', extensions: ['mamd']}
		]
	}, function(files) {
		if (files != undefined) {
			if (files.length == 1) {
				new_case();
				var filePath = files[0];
			
				fs.readFile(filePath, 'utf8', (err, data) => {
					if (err) console.error(err);
			
					var json = JSON.parse(data);

					// TODO: populate case info
					$("#case_number_input").val(json['properties']['case_number']);
					$("#observation_date_input").val(json['properties']['observation_date']);
					$("#analyst_input").val(json['properties']['analyst']);
			
					$.each(json['traits'], function(key, data) {
						if (data != "NA") {
							var row = $("#trait-" + key);
							//console.log("searching in " + key);
							$.each(row.find(".trait-image-button"), function (i, v) {
								if ($(this).attr("data-trait") === key && 
									$(this).attr("data-value") === data) {
										toggleTraitUISelection($(this), key, data);
									}
							});
						}
					});

					// TODO: populate results if applicable
					if (json["results"] != undefined) {
						show_results(json, json["results"]);
						// $("#analysis-results-1").html(json["results"]["ancestry"]);
						// $("#analysis-results-2").html(json["results"]["probabilities"]);
						// $("#analysis-results-3").html(json["results"]["matrix"]);

						// $("#analysis-pending").hide();
						// $("#analysis-loading").hide();
						// $("#analysis-error").hide();
						// $("#analysis-results").show();
					}

					// set properties for file checking
					window.current_file = filePath;
				});
			}
		}
	})
}

function save_case() {
	// TODO: encode results strings to form valid JSON
	var output = '{"traits":' + JSON.stringify(window.selections) + ',';
	output += '"properties":{"case_number":"' + $("#case_number_input").val() + '",';
	output += '"analyst":"' + $("#analyst_input").val() + '",';
	output += '"observation_date":"' + $("#observation_date_input").val() + '"}';

	if (JSON.stringify(window.current_results).length > 0) {
		output += ', "results": ' + JSON.stringify(window.current_results);
	}

	// output += '"results":{"ancenstry":"' + JSON.stringify($("#analysis-results-1").html()) + '",';
	// output += '"probabilities":"' + JSON.stringify($("#analysis-results-2").html()) + '",';
	// output += '"matrix":"' + JSON.stringify($("#analysis-results-3").html()) + '"}';
	output += '}';

	console.log(output);

	if (window.current_file == "") {
		var options = {
			title: "Save MaMD Analytical File",
			buttonLabel : "Save MaMD File",
			filters :[
				{name: 'MaMD Analytical', extensions: ['mamd']}
			]
		};
		window.current_file = dialog.showSaveDialog(null, options);
	}

	fs.writeFile(window.current_file, output, function(err) {
		if (err) {
			console.error(err);
		}
		console.log("File saved");
	});
	
	window.is_dirty = false;
	disable_button("save-button");
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
							store.set("app.rscript_path", $(this).text());
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

function init_case_info() {
	$("#case_number_input").val("");
	$("#observation_date_input").val("");
	$("#analyst_input").val("");
}

function check_offline_status() {
	// TODO: if offline, show warning message (no impact)
	window.is_offline = false;

	if (window.is_offline)
		$("#offline-alert").show();
	else
		$("#offline-alert").hide();
}

function check_installation() {
	let runInstallation = false;
	if (store.get("settings.first_run")) {
		runInstallation = true;
	}

	if (is.windows) {
		if (runInstallation) {
			setTimeout(function() {
				new Promise(function(resolve, reject) {
					disable_button("analysis-button");
					resolve();
				}).then(function(result) {
					return new Promise(function(resolve, reject) {
						$("#generic-alert").removeClass()
							.addClass("alert")
							.addClass("alert-warning")
							.html("Since this is the first time running the application, a few extra items need to be downloaded and installed. This will take a few minutes and will occur in the background, but until it is finished, the analysis won't be able to be run. Another notification will appear once the installation is complete.")
							.show();
						resolve();
					});
				}).then(function(result) {
					return new Promise(function(resolve, reject) {
						let cmd = path.join(store.get("app.resources_path"), "install.bat");
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

						exec.execBat(
							cmd,
							params, 
							function(error, stdout, stderr) {
								console.error(error);
								console.error(stderr);
								$("#generic-alert").removeClass()
									.addClass("alert")
									.addClass("alert-danger")
									.html("<p>There was an error while attempting to install the supplemental items. The error received was:</p><p>" + error + "</p><p>" + stderr + "</p>")
									.show();
								reject();
							},
							function(stdout, stderr) {
								$("#generic-alert").removeClass()
									.addClass("alert")
									.addClass("alert-success")
									.html("The installation has completed successfully! You may now run an analysis. This notification will disappear in 5 seconds...")
									.show()
									.delay(5000)
									.slideUp(200, function() {
										$(this).hide();
									});
								resolve();
							}
						);
					});
				}).then(function(result) {
					return new Promise(function(resolve, reject) {
						enable_button("analysis-button");
						resolve();
					});
				});
			}, 1000);
		}
	}
}

function check_for_updates() {
	let checkForUpdates = true;
	if (store.has("settings.auto_check_for_updates")) {
		checkForUpdates = Boolean(store.get("settings.auto_check_for_updates"));
	}

	if (checkForUpdates) {
		setTimeout(function() {
			ipcRenderer.send('update-check');
		}, 3000);
	}
}

function check_settings() {
	// TODO: if no rscript selected, 
	//   go to settings tab
	//   disable run analysis button
	console.log("RPath", store.get("app.rscript_path"));
	console.log("RPackageSource", store.get("r_package_source_path"));
	if (store.get("app.rscript_path") === undefined) {
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
		verify_package_install(v, template);
		div.append(template);
	});
}

function toggle_package_status(pkg, template, installed) {
	var badge = template.find(".badge");
	var button = template.find(".r-package-install-button");
	button.attr("data-package", pkg);
	
	if (installed) {
		badge.removeClass("badge-danger").addClass("badge-success").html("Installed");
		button.hide();
	} else {
		badge.removeClass("badge-success").addClass("badge-danger").html("Not Installed");
		button.show();
	}

	return template;
}

function show_suggested_rscript_paths() {
	var span = $("#settings-found-rscript");
	span.empty().html('<p class="loading">Loading suggested paths...</p>');

	//if (process.platform === "win32" || process.platform === "win64") {
	if (is.windows) {
		search_for_rscript('C:\\Program Files\\R');
		search_for_rscript('C:\\Program Files\\Microsoft\\R Open');
	}

	//if (process.platform === "darwin") {
	if (is.macos) {
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
		// ttemplate.find(".trait-title").attr("title", traits[i].name + " (" + traits[i].abbreviation + ")");
		// ttemplate.find(".trait-title").attr("data-content", traits[i].description);
		
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
	enable_button("save-button");
	
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

// function toggleIsDirty() {
// 	if (window.is_dirty) {
// 		window.is_dirty = false;
// 		disable_button("save-button");
// 	} else {
// 		window.is_dirty = true;
// 		enable_button("save-button");
// 	}
// }

function generate_inputfile() {
	console.log("Generating input file...");
	console.log(window.selections);

	var keys = ['Group'];
	var values = ['Unknown'];
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
	
	var source_path = store.get("r_package_source_path");
	var packages_path = store.get("packages_path");
	//var data_path = store.get("userdata_path");
	var analysis_path = store.get("analysis_path");
	var input_file = generate_inputfile();
	var output_file = generate_outputfile(input_file);
	var r_script = path.join(analysis_path, "mamd.R");

	var parameters = [
		r_script,
		source_path,
		packages_path,
		is.macos ? "mac.binary" : "win.binary",
		analysis_path,
		input_file,
		output_file
	];

	// D:\work\hefner\hefner-electron-boilerplate\assets\r\mamd.r
	// C:\Users\ronri\AppData\Roaming\MaMD Analytical
	// C:\Users\ronri\AppData\Roaming\MaMD Analytical\1565151398636-input.csv
	// C:\Users\ronri\AppData\Roaming\MaMD Analytical\1565151398636-output.txt

	// $("#analysis-parameters").empty();
	// $.each(parameters, function(i,v) {
	// 	$("#analysis-parameters").append(v).append("<br />");
	// });
	
	if (input_file.length > 0) {
		// proc.execFile(store.get("app.rscript_path"), parameters, function(err, data) {
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
		var cmd = '"' + store.get("app.rscript_path") + '"';
		$.each(parameters, function(i,v) {
			cmd = cmd + ' "' + v + '"';
		});
		//cmd = cmd.replace("\\", "\\\\g");

		exec.execFile(store.get("app.rscript_path"), parameters, 
			function(error, stdout, stderr) {
				console.error(error);
				console.log(stderr);
				$("#analysis-error-message").empty().text(error);
				$("#analysis-error").show();
				return;
			},
			function(stdout, stderr) {
				fs.readFile(output_file, 'utf8', (err, data) => {
					if (err) console.error(err);
					show_results(null, data);
				});
			});

		// sudo.exec(cmd, options,
		// 	function(error, stdout, stderr) {
		// 		if (error) {
		// 			console.error(error);
		// 			console.log(stderr);
		// 			$("#analysis-error-message").empty().text(error);
		// 			$("#analysis-error").show();
		// 			return;
		// 		}
		// 		// console.log('stdout: ' + JSON.stringify(stdout));
		// 		// console.log('stderr: ' + JSON.stringify(stderr));
		// 		//$("#analysis-results-1").text(stdout);

		// 		fs.readFile(output_file, 'utf8', (err, data) => {
		// 			if (err) console.error(err);
		// 			show_results(null, data);
		// 		});
		// 	}
		// );

	} else {
		$("#analysis-error-message").empty().text("No inut file was generated.");
		$("#analysis-error").show();
		return;
	}

	//var timeout = setTimeout(show_results, 5000);
}

function show_results(fullJson, data) {
	var json = data;
	try {
		json = JSON.parse(data);
	} catch { }
	window.current_results = json;

	var pred = json['prediction'];
	var sens = json['sensitivity'];
	var spec = json['specificity'];
	var probs = json['probabilities'];
	var prob = 0;
	var stats = json['statistics'];
	var matrix = json['matrix'];
	var groups = window.appdb["groups"];
	var traits = window.appdb["traits"];

	var acc = (parseFloat(stats[' Accuracy ']) * 100).toFixed(2) + "%";
	var ci = "(" + parseFloat(stats[' AccuracyLower ']).toFixed(4) + ", " + parseFloat(stats[' AccuracyUpper ']).toFixed(4) + ")";
	var sensitivity = parseFloat(sens).toFixed(4);
	var specificity = parseFloat(spec).toFixed(4);

	$("#results-ancestry").text(get_group_name(pred));
	$("#results-accuracy").text(acc);
	$("#results-ci").text(ci);
	$("#results-sensitivity").text(sensitivity);
	$("#results-specificity").text(specificity);

	probs.sort(function(a, b) {
		return parseFloat(b.probability) - parseFloat(a.probability);
	});
	console.log(probs);
	var probs_labels = [];
	var probs_data = [];
	for (var i = 0; i < probs.length; i++) {
		probs_labels.push(probs[i]["group"]);
		probs_data.push(Number(probs[i]["probability"]));

		if (Number(probs[i]["probability"]) > prob) {
			prob = Number(probs[i]["probability"]);
		}
	}

	$("#results-probability").text(parseFloat(prob).toFixed(4));

	probs_chart.clear();
	console.log(probs_chart.data.datasets.length);

	probs_chart.data.labels = probs_labels;
	probs_chart.data.datasets[0].data = probs_data;
	probs_chart.update();


	var trait_table = $("#results-traits").find("tbody");
	trait_table.empty();
	for (var i = 0; i < traits.length; i++) {
		var trait = get_trait_name(traits[i].abbreviation);
		var score = window.selections[traits[i].abbreviation];
		var row = $("<tr></tr>");
		var col1 = $("<td></td>");
		var col2 = $("<td></td>");
		col1.text(trait + " (" + traits[i].abbreviation + ")");
		col2.addClass("text-center").text(score);
		row.append(col1).append(col2);
		trait_table.append(row);
	}

	var matrix_head = $("#results-matrix").find("thead");
	matrix_head.empty();
	var matrix_body = $("#results-matrix").find("tbody");

	var matrix_head_row = $("<tr></tr>");
	matrix_head_row.append($("<th></th>"));
	
	for (var i = 0; i < groups.length; i++) {
		matrix_head_row.append($("<th></th>").addClass("text-center").text(groups[i].display));
	}
	matrix_head.addClass("thead-dark").append(matrix_head_row);

	matrix_body.empty();
	for (var i = 0; i < groups.length; i++) {
		var row = $("<tr></tr>");
		row.append($("<td></td>").text(groups[i].display));

		var group_key_i = " " + groups[i].code + " ";
		for (var j = 0; j < groups.length; j++) {
			var group_key_j = " " + groups[j].code + " ";
			var temp = "0";

			for (var k = 0; k < matrix[group_key_i].length; k++) {
				if (matrix[group_key_i][k].group === group_key_j) {
					temp = matrix[group_key_i][k].score;
				}
			}

			row.append($("<td></td>").addClass("text-center").text(temp));
		}

		matrix_body.append(row);
	}


	// export information
	$("#results-app-version").html("v" + store.get('version'));
	if (fullJson != null) {
		$("#results-case-number").html(fullJson['properties']['case_number']);
		$("#results-observation-date").html(fullJson['properties']['observation_date']);
		$("#results-analyst").html(fullJson['properties']['analyst']);
	}
	
	// handle messaging
	$("#analysis-pending").hide();
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

function install_package(pkg, template) {
	console.log('installing : ' + pkg);
	var analysis_path = store.get("analysis_path");
	var r_script = path.join(analysis_path, "install_package.R");
	var parameters = [
		r_script,
		pkg
	];

	var options = {
		name: 'MaMD Analysis Subprocess'
	};
	var cmd = '"' + store.get("app.rscript_path") + '"';
	$.each(parameters, function(i,v) {
		cmd = cmd + ' "' + v + '"';
	});

	exec.execFile(store.get("app.rscript_path"), parameters, 
		function(error, stdout, stderr) {
			console.error(error);
			console.log(stderr);
			toggle_package_status(pkg, template, false);
			return false;
		},
		function(stdout, stderr) {
			console.log('stdout:', JSON.stringify(stdout));
			console.log('stderr:', JSON.stringify(stderr));
			toggle_package_status(pkg, template, true);
			return true;
		});

	// exec.sudo(
	// 	cmd, 
	// 	options, 
	// 	function(error, stdout, stderr) {
	// 		console.error(error);
	// 		console.log(stderr);
	// 		toggle_package_status(pkg, template, false);
	// 		return false;
	// 	},
	// 	function(stdout, stderr) {
	// 		console.log('stdout:', JSON.stringify(stdout));
	// 		console.log('stderr:', JSON.stringify(stderr));
	// 		toggle_package_status(pkg, template, true);
	// 		return true;
	// 	});

	// sudo.exec(cmd, options, 
	// 	function(error, stdout, stderr) {
	// 		if (error) {
	// 			console.error(error);
	// 			console.log(stderr);
	// 			toggle_package_status(pkg, template, false); 
	// 			return false;
	// 		}
	// 		console.log('stdout: ' + JSON.stringify(stdout));
	// 		console.log('stderr: ' + JSON.stringify(stderr));
	// 		toggle_package_status(pkg, template, true);
	// 		return true;
	// 	}
	// );

	// proc.execFile(store.get("app.rscript_path"), parameters, function(err, data) {
	// 	if(err){
	// 		console.error(err);
	// 		return false;
	// 	}
	// 	console.log("exec done");
	// 	return true;
	// });
}

function verify_package_install(pkg, template) {
	//console.log("Verifying package install: " + pkg);

	var proc = require('child_process');

	var analysis_path = store.get("analysis_path");
	var r_script = path.join(analysis_path, "verify_package.R");
	var parameters = [
		r_script,
		pkg
	];

	var options = {
		name: 'MaMD Analysis Subprocess'
	};
	var cmd = '"' + store.get("app.rscript_path") + '"';
	$.each(parameters, function(i,v) {
		cmd = cmd + ' "' + v + '"';
	});

	

	// exec.sudo(cmd, options, 
	// 	function(error, stdout, stderr) {
	// 		console.error(error);
	// 		console.error(stdout);
	// 		console.error(stderr);
	// 		return false;
	// 	},
	// 	function(stdout, stderr) {
	// 		var output = JSON.stringify(stdout);
	// 		console.log("verify stdout:", output);
	// 		toggle_package_status(pkg, template, output.includes("TRUE"));
	// 	});

	// sudo.exec(cmd, options, 
	// 	function(error, stdout, stderr) {
	// 		if (error) {
	// 			console.error(error);
	// 			console.error(stderr);
	// 			return false;
	// 		}
	// 		var output = JSON.stringify(stdout);
	// 		console.log("verify stdout: " + output);
	// 		toggle_package_status(pkg, template, output.includes("TRUE"));
	// 		// if (output.includes("TRUE"))
	// 		// 	return true;
	// 		// else
	// 		// 	return false;
	// 	}
	// );

	exec.execFile(store.get("app.rscript_path"), parameters, 
		function(error, stdout, stderr) {
			console.error(error);
			console.error(stdout);
			console.error(stderr);
			return false;
		},
		function(stdout, stderr) {
			var output = JSON.stringify(stdout);
			console.log("verify stdout:", output);
			toggle_package_status(pkg, template, output.includes("TRUE"));
		});

	// proc.execFile(store.get("app.rscript_path"), parameters, function(err, data) {
	// 	if(err){
	// 		console.error(err);
	// 		return false;
	// 	} else {
	// 		//console.log(pkg + " INCLUDES FALSE: " + data.includes("FALSE"));
	// 		//console.log(pkg + " INCLUDES TRUE: " + data.includes("TRUE"));
	// 		if (data.includes("FALSE"))
	// 			return false;
	// 		if (data.includes("TRUE"))
	// 			return true;
	// 	}
		
	// 	// fallthrough
	// 	return false;
	// });

	//console.log("Done verifying " + pkg);
}

function export_to_pdf() {
	var today = new Date();
	var date = today.getFullYear() + '-' + (today.getMonth()+1) + '-' + today.getDate();
	var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
	var dateTime = date + ' ' + time;
	
	$("#results-export-on").html(dateTime);

	$("#generic-alert").removeClass()
		.addClass("alert")
		.addClass("alert-info")
		.html("Please wait while the PDF file is being exported.")
		.show();
	
	ipcRenderer.send('pdf-export');
}

function get_group_name(key) {
	var groups = window.appdb['groups'];
	key = key.trim();
	for (var i = 0; i < groups.length; i++) {
		if (groups[i].code === key) {
			return groups[i].display;
		}
	}
	return key;
}

function get_trait_name(key) {
	var traits = window.appdb['traits'];
	key = key.trim();
	for (var i = 0; i < traits.length; i++) {
		if (traits[i].abbreviation === key) {
			return traits[i].name;
		}
	}
	return key;
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
	//$('#tabs a[href="#settings"]').tab('show');
	$("#settings-modal").modal('show');
});

ipcRenderer.on('message', (event, arg) => {
	console.log(arg);
});

ipcRenderer.on('update-error', (event, arg) => {
	console.error(event);
	$("#update-alert").removeClass()
		.addClass("alert")
		.addClass("alert-danger")
		.html("<p>There was an error while performing an update check.</p>")
		.show();
});
ipcRenderer.on('update-checking', (event, arg) => {
	$("#update-alert").removeClass()
		.addClass("alert")
		.addClass("alert-info")
		.html("Checking remote servers for available updates...")
		.show();
});
ipcRenderer.on('update-available', (event, arg) => {
	console.log(arg);
	$("#update-alert").removeClass()
		.addClass("alert")
		.addClass("alert-warning")
		.html(`<p>Update Available: Version ${arg.version} is available for download.</p><p><a id="install-update-button" href="#" class="btn btn-warning alert-link">Install Update Now</a> <a id="dismiss-update-button" href="#" class="btn btn-default">Dismiss</a></p>`)
		.show();
});
ipcRenderer.on('update-progress', (event, arg) => {
	console.log("download progress", arg);
	$("#update-alert").removeClass()
		.addClass("alert")
		.addClass("alert-info")
		.html(`<p>Downloading Update: The application is downloading an update.</p><p><div class="progress"><div class="progress-bar" role="progressbar" aria-valuenow="${arg.percent}" aria-valuemin="0" aria-valuemax="100"><span class="sr-only">${arg.percent}% Complete</div></div></p>`)
		.show();
});
ipcRenderer.on('update-not-available', (event, arg) => {
	$("#update-alert").removeClass()
		.addClass("alert")
		.addClass("alert-success")
		.html(`No Update Available: You are currently running version ${arg.version}, which is the most up to date version that is available.`)
		.show()
		.delay(4000)
		.slideUp(200, function() {
			$(this).hide();
		});
});
ipcRenderer.on('update-downloaded', (event, arg) => {
	$("#update-alert").removeClass()
		.addClass("alert")
		.addClass("alert-info")
		.html(`Install Update: The application update has been downloaded and will restart in 5 seconds to complete the update.`)
		.show()
		.delay(5000)
		.queue(function() {
			//updater.finishUpdate();
			ipcRenderer.send('update-finish');
		});
});

ipcRenderer.on('pdf-export-complete', (event, arg) => {
	$("#generic-alert").removeClass()
		.addClass("alert")
		.addClass("alert-success")
		.html(`The PDF file has been exported successfully. <a id="view-pdf-button" class="alert-link" data-path="${arg}">Click here</a> to view the file.`)
		.show();
});