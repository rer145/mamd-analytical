'use strict';
const path = require('path');
const {app, BrowserWindow, Menu} = require('electron');
/// const {autoUpdater} = require('electron-updater');
const {is} = require('electron-util');
const unhandled = require('electron-unhandled');
const debug = require('electron-debug');
const contextMenu = require('electron-context-menu');
const fs = require('fs');

//const config = require('./config');
const menu = require('./menu');

const Store = require('electron-store');
const store = new Store();

unhandled();
debug();
contextMenu();

// Note: Must match `build.appId` in package.json
app.setAppUserModelId('com.company.AppName');

// Uncomment this before publishing your first version.
// It's commented out as it throws an error if there are no published versions.
// if (!is.development) {
// 	const FOUR_HOURS = 1000 * 60 * 60 * 4;
// 	setInterval(() => {
// 		autoUpdater.checkForUpdates();
// 	}, FOUR_HOURS);
//
// 	autoUpdater.checkForUpdates();
// }

// Prevent window from being garbage collected
let mainWindow;

// var image = electron.nativeImage.createFromPath(__dirname + '/assets/img/icons/icon.png'); 
// image.setTemplateImage(true);

const createMainWindow = async () => {
	const win = new BrowserWindow({
		title: app.getName(),
		width: 1024, 
		height: 768,
		backgroundColor: '#4e5d6c',
		transparent: false,
		show: false,
		//icon: image,
		webPreferences: {
			nodeIntegration: true,
            defaultEncoding: 'UTF-8'
		}
	});

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
	await app.whenReady();
	Menu.setApplicationMenu(menu);
	mainWindow = await createMainWindow();

	store.set("userdata_path", app.getPath("userData"));

	var packages_path = path.join(app.getPath("userData"), "packages");
	make_directory(packages_path);
	store.set("packages_path", packages_path);

	// const favoriteAnimal = config.get('favoriteAnimal');
	// mainWindow.webContents.executeJavaScript(`document.querySelector('section.main').textContent = 'Your favorite animal is ${favoriteAnimal}'`);
})();




function make_directory(dir) {
	if (!fs.existsSync(dir)){ 
		try {
			fs.mkdirSync(dir);
		} catch (err) {
			console.log("Unable to create directory: " + err);
		}
	}
};