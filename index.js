'use strict';
const path = require('path');
const {app, BrowserWindow, Menu, ipcMain, dialog, shell} = require('electron');
// const {autoUpdater} = require('electron-updater');
// const log = require('electron-log');
const {is, openNewGitHubIssue, debugInfo} = require('electron-util');
const unhandled = require('electron-unhandled');
const debug = require('electron-debug');
const contextMenu = require('electron-context-menu');
const windowStateKeeper = require('electron-window-state');
const fs = require('fs');

//const config = require('./config');
const menu = require('./menu');

const Store = require('electron-store');
const store = new Store();

const cla = require('./assets/js/cla');
const uuid = require('uuid/v4');
const { 
	trackEvent, 
	trackScreenView,
	trackTime,
	trackException
} = require('./assets/js/analytics');

unhandled({
	reportButton: error => {
		openNewGitHubIssue({
			user: 'rer145',
			repo: 'mamd-analytical',
			body: `\`\`\`\n${error.stack}\n\`\`\`\n\n---\n\n${debugInfo()}`
		});
	}
});

debug();
contextMenu();

// Note: Must match `build.appId` in package.json
app.setAppUserModelId('edu.msu.MaMDAnalytical');

// global.trackEvent = trackEvent;
// global.trackScreenView = trackScreenView;
// global.trackTime = trackTime;
// global.trackException = trackException;


// Prevent window from being garbage collected
let mainWindow;

const createMainWindow = async () => {
	let mainWindowState = windowStateKeeper({
		defaultWidth: 1024,
		defaultHeight: 768
	});

	const win = new BrowserWindow({
		title: app.getName(),
		// width: 1024, 
		// height: 768,
		x: mainWindowState.x,
		y: mainWindowState.y,
		width: mainWindowState.width,
		height: mainWindowState.height,
		backgroundColor: '#4e5d6c',
		transparent: false,
		show: false,
		icon: path.join(__dirname, 'assets/icons/png/64x64.png'),
		webPreferences: {
			nodeIntegration: true,
			defaultEncoding: 'UTF-8',
			disableBlinkFeatures: 'Auxclick'
		}
	});

	mainWindowState.manage(win);

	win.on('closed', () => {
		// Dereference the window
		// For multiple windows store them in an array
		mainWindow = undefined;
	});

	win.webContents.on('did-finish-load', () => {
        win.webContents.setZoomFactor(1);
	});
	
	win.once('ready-to-show', () => {
        //win.setMenu(null);
        win.show();
    });

	await win.loadFile(path.join(__dirname, 'index.html'));

	

	return win;
};

// Prevent multiple instances of the app
if (!app.requestSingleInstanceLock()) {
	app.quit();
}

app.on('second-instance', () => {
	if (mainWindow) {
		if (mainWindow.isMinimized()) {
			mainWindow.restore();
		}

		mainWindow.show();
	}
});

app.on('window-all-closed', () => {
	if (!is.macos) {
		app.quit();
	}
});

app.on('activate', () => {
	if (!mainWindow) {
		mainWindow = createMainWindow();
	}
});

(async () => {
	prep_files_and_settings();
	
	await app.whenReady();
	Menu.setApplicationMenu(menu);
	mainWindow = await createMainWindow();

	trackEvent("Application", "Launch", "OS", process.platform);

	mainWindow.webContents.send('application-ready', cla.options);
})();


function prep_files_and_settings() {
	const appVersion = require(path.join(app.getAppPath(), "package.json")).version;
	//store.set("version", appVersion);

	let uid = store.get("uuid", uuid());
	let analytics = store.get("settings.analytics", true);

	let autoUpdates = !store.has("settings.auto_check_for_updates") ? true : store.get("settings.auto_check_for_updates");
	let firstRun = !store.has("settings.first_run");
	if (cla.options.forceInstall)
		firstRun = true;

	let devMode = store.has("settings.dev_mode");
	
	// store.set("settings", {
	// 	"auto_check_for_updates": autoUpdates,
	// 	"first_run": firstRun,
	// 	"dev_mode": devMode
	// });

	let resourcesPath = process.resourcesPath;

	if (cla.options && cla.options.resources && cla.options.resources.length > 0) {
		resourcesPath = cla.options.resources;
	} else {
		if (is.development) {
			resourcesPath = path.join(__dirname, "build");	
		}
	}

	let RPortablePath = path.join(resourcesPath, "R-Portable", "bin", "RScript.exe");
	let RPath = path.join(resourcesPath, "R-Portable", "bin", "R.exe");
	//let RToolsPath = path.join(resourcesPath, "R-Portable", "Rtools.exe");
	let RPackageSourcePath = path.join(resourcesPath, "packages");
	let RAnalysisPath = path.join(resourcesPath, "scripts");
	
	if (is.development) {
		RPortablePath = path.join(
			resourcesPath, 
			"R-Portable", 
			is.macos ? "R-Portable-Mac" : "R-Portable-Win",
			"bin", 
			"RScript.exe");

		RPath = path.join(
			resourcesPath, 
			"R-Portable", 
			is.macos ? "R-Portable-Mac" : "R-Portable-Win",
			"bin", 
			"R.exe");

		// RToolsPath = path.join(
		// 	resourcesPath, 
		// 	is.macos ? "R-Portable-Mac" : "R-Portable-Win",
		// 	"Rtools.exe");

		// RPackageSourcePath = path.join(
		// 	resourcesPath,
		// 	"packages"
		// );

		// RAnalysisPath = path.join(
		// 	resourcesPath,
		// 	"scripts"
		// );
	}

	// store.set("app", {
	// 	"resources_path": resourcesPath,
	// 	"rscript_path": RPortablePath,
	// 	"r_path": RPath,
	// 	"r_package_source_path": RPackageSourcePath,
	// 	"r_analysis_path": RAnalysisPath
	// });


	//let userDataPath = path.join(app.getPath("userData");
	let userDataPath = path.join(app.getPath("home"), "MaMD");
	make_directory(userDataPath);

	let userPackagesPath = path.join(userDataPath, "packages");
	let userAnalysisPath = path.join(userDataPath, "analysis");

	// store.set("user", {
	// 	"userdata_path": userDataPath,
	// 	"packages_path": userPackagesPath,
	// 	"analysis_path": userAnalysisPath
	// });

	make_directory(userPackagesPath);
	make_directory(userAnalysisPath);


	// save settings to disk in one shot
	let settings = {
		"version": appVersion,
		"uuid": uid,
		"settings": {
			"analytics": analytics,
			"auto_check_for_updates": autoUpdates,
			"first_run": firstRun,
			"dev_mode": devMode
		},
		"app": {
			"resources_path": resourcesPath,
			"rscript_path": RPortablePath,
			"r_path": RPath,
			"r_package_source_path": RPackageSourcePath,
			"r_analysis_path": RAnalysisPath
		},
		"user": {
			"userdata_path": userDataPath,
			"packages_path": userPackagesPath,
			"analysis_path": userAnalysisPath
		}
	};
	store.set(settings);

	// // check if packages path is empty, if so, consider it the first run
	// fs.readdirSync(userPackagesPath, function(err, files) {
	// 	console.log("checking for packages", err, files);
	// 	if (!err) {
	// 		if (!files.length) {
	// 			store.set("settings.first_run", true);
	// 		}
	// 	}
	// });
	
	// var r_path = path.join(__dirname, "assets/r");
	// copy_file(
    //     path.join(r_path, "mamd.csv"), 
    //     path.join(analysis_path, "mamd.csv"), 
	// 	true);
	// copy_file(
	// 	path.join(r_path, "Geo.Origin.csv"), 
	// 	path.join(analysis_path, "Geo.Origin.csv"), 
	// 	true);
	// copy_file(
	// 	path.join(r_path, "mamd.R"), 
	// 	path.join(analysis_path, "mamd.R"), 
	// 	true);
	// copy_file(
	// 	path.join(r_path, "install_package.R"), 
	// 	path.join(analysis_path, "install_package.R"), 
	// 	true);
	// copy_file(
	// 	path.join(r_path, "verify_package.R"), 
	// 	path.join(analysis_path, "verify_package.R"), 
	// 	true);
};


function make_directory(dir) {
	if (!fs.existsSync(dir)){ 
		try {
			fs.mkdirSync(dir);
		} catch (err) {
			trackException(err, true);
			console.log("Unable to create directory: " + err);
		}
	}
};

function copy_file(src, dest, replace) {
	var do_replace = replace;
	if (!replace) {
		do_replace = !fs.existsSync(dest);
	}

	if (do_replace) {
		fs.copyFile(src, dest, (err) => {
			if (err) {
                console.error("Error copying over " + src + " to " + dest);
                console.error(err);
            } else {
                console.log(src + " was copied to " + dest);
            }
		});
	}
};


ipcMain.on('pdf-export', event => {
	var options = {
		title: "Save PDF Export",
		buttonLabel : "Save PDF File",
		filters :[
			{name: 'PDF File', extensions: ['pdf']}
		]
	};
	
	const pdfPath = dialog.showSaveDialog(null, options);
	const win = BrowserWindow.fromWebContents(event.sender);
	mainWindow.webContents.printToPDF({}, (error, data) => {
		if (error) return console.error(error.message);

		fs.writeFile(pdfPath, data, err => {
			if (err) {
				trackException(err, false);
				return console.error(err.message);
			}
			//shell.openExternal('file://' + pdfPath);
			event.sender.send('pdf-export-complete', pdfPath);
		});
	});

});


ipcMain.on('track-event', (event, args) => {
	trackEvent(args.category, args.action, args.label, args.value);
});
ipcMain.on('track-screenview', (event, args) => {
	trackScreenView(args.screenName);
});
ipcMain.on('track-time', (event, args) => {
	trackTime(args.category, args.variable, args.time, args.label);
});
ipcMain.on('track-exception', (event, args) => {
	trackException(args.description, args.fatal);
});