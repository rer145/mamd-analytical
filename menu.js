'use strict';
const path = require('path');
const {app, Menu, shell} = require('electron');
const win = require('electron').BrowserWindow;
const {
	is,
	appMenu,
	aboutMenuItem,
	showAboutWindow,
	openUrlMenuItem,
	openNewGitHubIssue,
	debugInfo
} = require('electron-util');
//const config = require('./config');

const Store = require('electron-store');
const store = new Store();
const cla = require('./assets/js/cla');

//window.$ = window.jQuery = require('jquery');
//const lib = require('./assets/js/modules');
const updater = require('./assets/js/updater');

const appName = app.getName();

const showPreferences = () => {
	win.getFocusedWindow().webContents.send('settings');
};

const helpSubmenu = [
	openUrlMenuItem({
		label: 'Website',
		url: 'http://macromorphoscopic.com/'
	}),
	// openUrlMenuItem({
	// 	label: 'Source Code',
	// 	url: 'https://github.com/rer145/mamd-analytical'
	// }),
	{
		label: 'Help File',
		click(menuItem, focusedWindow, event) {
			const PDFWindow = require('electron-pdf-window');
			const pdfWin = new PDFWindow({
				width: 800,
				height: 600,
				title: app.getName() + " - Help File",
				backgroundColor: '#ffffff',
				transparent: false,
				icon: path.join(__dirname, '/assets/img/icons/icon.png')
			});
			pdfWin.loadURL(path.join(__dirname, '/assets/pdf/helpfile.pdf'));
		}
	},
	{
		label: 'Report an Issue…',
		click() {
			const body = `
<!-- Please succinctly describe your issue and steps to reproduce it. -->


---

${debugInfo()}`;

			openNewGitHubIssue({
				user: 'rer145',
				repo: 'mamd-analytical',
				body
			});
		}
	},
	{ type: 'separator' },
	{
		label: 'Check for Updates',
		click(menuItem, focusedWindow, event) {
			updater.checkForUpdates(menuItem, focusedWindow, event);
		}
	},
	{ type: 'separator' },
	{
		label: 'Delete Settings',
		click() {
			store.clear();
			app.relaunch();
			app.quit();
		}
	},
	{
		label: 'Run Installer',
		click() {
			store.set("settings.first_run", true);
			app.relaunch();
			app.quit();
			//win.getFocusedWindow().webContents.send('check-installation');
		}
	}
];

if (!is.macos) {
	helpSubmenu.push({ type: 'separator' });
	helpSubmenu.push(
		aboutMenuItem({
			icon: path.join(__dirname, "assets", "icons", "png", "96x96.png"),
			//copyright: "",
			text: "Created by Dr. Joe Hefner (Michigan State University) and Ron Richardson"
		})
	);
}

const debugSubmenu = [
	//{ role: 'reload' },
	{
		label: 'Force Reload',
		click() {
			app.relaunch();
			app.quit();
		},
		accelerator: 'CmdOrCtrl+Shift+R'
	},
	{
		label: 'Developer Tools',
		click() {
			win.getFocusedWindow().toggleDevTools()
		},
		accelerator: 'CmdOrCtrl+Shift+I'
	},
	{ type: 'separator' },
	{
		label: 'Show App Data',
		click() {
			shell.openItem(app.getPath('userData'));
		}
	},
	{
		label: 'Delete App Data',
		click() {
			shell.moveItemToTrash(app.getPath('userData'));
			app.relaunch();
			app.quit();
		}
	},
	{
		type: 'separator'
	},
	// {
	// 	label: 'Show Settings',
	// 	click() {
	// 		config.openInEditor();
	// 	}
	// },
	{
		label: 'Delete Settings',
		click() {
			store.clear();
			app.relaunch();
			app.quit();
		}
	},
	{
		label: 'Run Installer',
		click() {
			store.set("settings.first_run", true);
			app.relaunch();
			app.quit();
			//win.getFocusedWindow().webContents.send('check-installation');
		}
	}
];

const macosTemplate = [
	// appMenu([
	// 	{
	// 		label: 'Preferences…',
	// 		accelerator: 'Command+,',
	// 		click() {
	// 			showPreferences();
	// 		}
	// 	}
	// ]),
	{
		label: appName,
		submenu: [
			// aboutMenuItem({
			// 	icon: path.join(__dirname, "assets", "icons", "mac", "icon.icns"),
			// 	text: "Created by Dr. Joe Hefner (Michigan State University) and Ron Richardson"
			// }),
			// { type: 'separator' },
			// {
			// 	label: 'Preferences...',
			// 	accelerator: 'Command+,',
			// 	click() {
			// 		showPreferences();
			// 	}
			// },
			// { type: 'separator' },
			{ role: 'services', submenu: [] },
			{ type: 'separator' },
			{ role: 'hide' },
			{ role: 'hideothers' },
			{ role: 'unhide' },
			{ type: 'separator' },
			{ role: 'quit' }
		]
	},
	{
		role: 'fileMenu',
		submenu: [
			{
				label: 'New',
				click() {
					win.getFocusedWindow().webContents.send('new-case');
				},
				accelerator: 'CmdOrCtrl+N'
			},
			{
				label: 'Open',
				click() {
					win.getFocusedWindow().webContents.send('open-case');
				},
				accelerator: 'CmdOrCtrl+O'
			},
			{
				label: 'Save',
				click() {
					win.getFocusedWindow().webContents.send('save-case');
				},
				accelerator: 'CmdOrCtrl+S'
			},
			// {
			// 	type: 'separator'
			// },
			// {
			// 	label: 'Settings',
			// 	accelerator: 'Control+,',
			// 	click() {
			// 		showPreferences();
			// 	}
			// },
			{
				type: 'separator'
			},
			{
				role: 'quit'
			}
		]
	},
	{
		role: 'editMenu'
	},
	{
		role: 'viewMenu'
	},
	{
		role: 'windowMenu'
	},
	{
		role: 'help',
		submenu: helpSubmenu
	}
];

// Linux and Windows
const otherTemplate = [
	{
		role: 'fileMenu',
		submenu: [
			{
				label: 'New',
				click() {
					win.getFocusedWindow().webContents.send('new-case');
				},
				accelerator: 'CmdOrCtrl+N'
			},
			{
				label: 'Open',
				click() {
					win.getFocusedWindow().webContents.send('open-case');
				},
				accelerator: 'CmdOrCtrl+O'
			},
			{
				label: 'Save',
				click() {
					win.getFocusedWindow().webContents.send('save-case');
				},
				accelerator: 'CmdOrCtrl+S'
			},
			// {
			// 	type: 'separator'
			// },
			// {
			// 	label: 'Settings',
			// 	accelerator: 'Control+,',
			// 	click() {
			// 		showPreferences();
			// 	}
			// },
			{
				type: 'separator'
			},
			{
				role: 'quit'
			}
		]
	},
	{
		role: 'editMenu'
	},
	{
		role: 'viewMenu'
	},
	{
		role: 'help',
		submenu: helpSubmenu
	}
];

const template = process.platform === 'darwin' ? macosTemplate : otherTemplate;

if (is.development || store.get("settings.dev_mode") || cla.options.debug) {
	template.push({
		label: 'Debug',
		submenu: debugSubmenu
	});
}

module.exports = Menu.buildFromTemplate(template);
