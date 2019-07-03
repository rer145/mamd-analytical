'use strict';
window.$ = window.jQuery = require('jquery')
window.Tether = require('tether')
window.Bootstrap = require('bootstrap')

//const { ipcRenderer } = require('electron');
const settings = require('electron-settings');

const fs = require('fs');
const find = require('find');
//const log = require('electron-log');
const { ipcRenderer } = require('electron');
const path = require('path');
//const walk = require('walk');

$(document).ready(function() {
	//window.appdb = app_preload();
	app_init();

	// ipcRenderer.on('userdata-path', (event, message) => {
	// 	//console.log('UserData Path: ' + message);
	// 	settings.set('config.userdata_path', message);
	// });
});


function app_preload() {
	var db = JSON.parse(fs.readFileSync(path.join(__dirname, "/assets/db/db.min.json")).toString());
	return db;
}

function app_init() {
    show_suggested_rscript_paths();
}

function search_for_rscript(path) {
	var span = $("#settings-found-rscript");
    find.file(/Rscript.exe/, path, function(files) {
		if (files.length > 0) {
			for (var i = 0; i < files.length; i++) {
				span.append(
					$("<a></a>")
						.addClass("rscript-settings-link")
						.text(files[i])
				).append($("<br></br>"));
			}
		}
	})
    .error(function(err) { console.error(err); });
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