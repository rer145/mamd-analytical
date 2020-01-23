'use strict';
const path = require('path');
const {app, BrowserWindow, Menu, ipcMain, dialog, shell} = require('electron');
// const {autoUpdater} = require('electron-updater');
// const log = require('electron-log');
const {is} = require('electron-util');
const unhandled = require('electron-unhandled');
const debug = require('electron-debug');
const contextMenu = require('electron-context-menu');
const windowStateKeeper = require('electron-window-state');
const fs = require('fs');

//const config = require('./config');
const menu = require('./menu');

const Store = require('electron-store');
const store = new Store();

unhandled();
debug();
contextMenu();

// Note: Must match `build.appId` in package.json
app.setAppUserModelId('edu.msu.MaMDAnalytical');


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
})();


function prep_files_and_settings() {
	const appVersion = require(path.join(app.getAppPath(), "package.json")).version;
	store.set("version", appVersion);

	let RPortablePath = path.join(process.resourcesPath, "R-Portable", "bin", "RScript.exe");

	if (is.development) {
		RPortablePath = path.join(
			__dirname, 
			"build", 
			"R-Portable", 
			is.macos ? "R-Portable-Mac" : "R-Portable-Win",
			"bin", 
			"RScript.exe");
	}

	// if (!is.macos) {
	// 	RPortablePath = path.join(RPortablePath, "R-Portable-Win", "bin", "RScript.exe");
	// 	store.set("rscript_path", RPortablePath);
	// } else {
	// 	RPortablePath = path.join(RPortablePath, "R-Portable-Mac", "bin", "RScript.exe");
	// 	store.set("rscript_path", RPortablePath);
	// }
	store.set("rscript_path", RPortablePath);

	
	store.set("userdata_path", app.getPath("userData"));

	var packages_path = path.join(app.getPath("userData"), "packages");
	make_directory(packages_path);
	store.set("packages_path", packages_path);

	var analysis_path = path.join(app.getPath("userData"), "analysis");
	make_directory(analysis_path);
	store.set("analysis_path", analysis_path);

	var r_path = path.join(__dirname, "assets/r");
	copy_file(
        path.join(r_path, "mamd.csv"), 
        path.join(analysis_path, "mamd.csv"), 
		true);
	copy_file(
		path.join(r_path, "Geo.Origin.csv"), 
		path.join(analysis_path, "Geo.Origin.csv"), 
		true);
	copy_file(
		path.join(r_path, "mamd.R"), 
		path.join(analysis_path, "mamd.R"), 
		true);
	copy_file(
		path.join(r_path, "install_package.R"), 
		path.join(analysis_path, "install_package.R"), 
		true);
	copy_file(
		path.join(r_path, "verify_package.R"), 
		path.join(analysis_path, "verify_package.R"), 
		true);
};


function make_directory(dir) {
	if (!fs.existsSync(dir)){ 
		try {
			fs.mkdirSync(dir);
		} catch (err) {
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
			if (err) return console.error(err.message);
			//shell.openExternal('file://' + pdfPath);
			event.sender.send('pdf-export-complete', pdfPath);
		});
	});

});