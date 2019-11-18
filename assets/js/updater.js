const { dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');

let updater;
autoUpdater.autoDownload = false;

autoUpdater.on('error', (error) => {
	dialog.showErrorBox('Error: ', error == null ? "unknown" : (error.stack || error).toString());
});

autoUpdater.on('update-available', () => {
	dialog.showMessageBox({
		type: 'info',
		icon: path.join(__dirname, "/assets/icons/mamd.png"),
		title: 'Update Available',
		message: 'An update to this application was found. Do you want to install it now? The application will be restarted.',
		buttons: ['Yes, Install', 'No']
	}, (buttonIndex) => {
		if (buttonIndex === 0) {
			autoUpdater.downloadUpdate();
		} else {
			updater.enabled = true;
			updater = null;
		}
	});
});

autoUpdater.on('update-not-available', () => {
	dialog.showMessageBox({
		type: 'info',
		icon: path.join(__dirname, "/assets/icons/mamd.png"),
		title: 'No Update Available',
		message: 'The application is currently up-to-date!'
	});
	updater.enabled = true;
	updater = null;
});

autoUpdater.on('update-downloaded', () => {
	dialog.showMessageBox({
		type: 'info',
		icon: path.join(__dirname, "/assets/icons/mamd.png"),
		title: 'Install Update',
		message: 'The application update has been downloaded and will now restart to complete the update.'
	}, () => {
		setImmediate(() => autoUpdater.quitAndInstall());
	});
});

function checkForUpdates(menuItem, focusedWindow, event) {
	updater = menuItem;
	updater.enabled = false;
	autoUpdater.checkForUpdates();
}

module.exports.checkForUpdates = checkForUpdates;