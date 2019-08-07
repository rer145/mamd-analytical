'use strict';
window.$ = window.jQuery = require('jquery')
window.Tether = require('tether')
window.Bootstrap = require('bootstrap')

const settings = require('electron-settings');

const fs = require('fs');
const find = require('find');
const { ipcRenderer } = require('electron');
const path = require('path');

const Store = require('electron-store');
const store = new Store();

$(document).ready(function() {
	window.appdb = app_preload();
	window.selections = app_setupselections();
	app_init();

	$("#analysis-button").on('click', function(e) {
		e.preventDefault();
		$("html, body").animate({ scrollTop: 0 }, "fast");
		$('#tabs a[href="#results"]').tab('show');
		run_analysis();
	});

	$(".trait-image-button").on('click', function(e) {
		e.preventDefault();
		
		var code = $(this).parent().attr("data-trait");
		var value = $(this).parent().attr("data-value");
		var currentValue = window.selections[code];
		var parent = $("#trait-" + code);

		if ($(this).hasClass("btn-primary")) {
			$(this).removeClass("btn-primary");
			toggleSelection(code, -1);
		} else {
			$.each(parent.find(".trait-image-button"), function(i,v) {
				$(v).removeClass("btn-primary").addClass("btn-default");
			});
			$(this).addClass("btn-primary");
			toggleSelection(code, value);
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
		output[traits[i].abbreviation] = -1;
	}
	return output;
}

function app_init() {
	show_suggested_rscript_paths();
	show_groups();
	show_traits();
	init_results();
	//check_offline_status();
	check_settings();

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

function show_suggested_rscript_paths() {
	var span = $("#settings-found-rscript");
	span.empty().html('<p class="loading">Loading suggested paths...</p>');

	if (process.platform === "win32" || process.platform === "win64") {
		search_for_rscript('C:\\Program Files\\R');
		search_for_rscript('C:\\Program Files\\Microsoft\\R Open');
	}

	if (process.platform === "darwin") {
		search_for_rscript('/usr/bin/Rscript');
        search_for_rscript('/Library/Frameworks/R.framework/Resources/bin');
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
		
		for (var j = 0; j < traits[i].images.length; j++) {
			var itemplate = $("#trait-image-template").clone();
			itemplate.removeClass("template")
				.attr("id", "trait-image-" + j)
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

function toggleSelection(code, value) {
	if (window.selections[code] === value) 
		window.selections[code] = -1;
	else
		window.selections[code] = value;
		
	console.log(window.selections);
}

function generate_inputfile() {
	var filepath = path.join(store.get("userdata_path"), new Date().valueOf().toString() + "-input.csv");
	// TODO: write window.selections to file
	return filepath;
}

function generate_outputfile(input_file) {
	var ts = input_file.replace("-input.csv", "").replace(store.get("userdata_path"), "");
	var filepath = path.join(store.get("userdata_path"), ts + "-output.txt");
	return filepath;
}

function run_analysis() {
	$("#analysis-pending").hide();
	$("#analysis-results").hide();
	$("#analysis-error").hide();
	$("#analysis-loading").show();
	
	var r_script = path.join(__dirname, "/assets/r/mamd.R");
	var packages_path = store.get("packages_path");
	var data_path = store.get("userdata_path");
	var input_file = generate_inputfile();
	var output_file = generate_outputfile(input_file);

	var proc = require('child_process');
	var parameters = [
		r_script,
		packages_path,
		data_path,
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
	

	proc.execFile(store.get("rscript_path"), parameters, function(err, data) {
		if(err){
			$("#analysis-error-message").empty().text(err);
			$("#analysis-error").show();
			return;
		}

		$("#analysis-results-1").text(data);
		show_results(output_file);
	});

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