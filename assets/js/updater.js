const { dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const ProgressBar = require('electron-progressbar');

let progressBar;

let updater;
autoUpdater.autoDownload = false;

autoUpdater.on('error', (error) => {
	dialog.showErrorBox('Error: ', error == null ? "unknown" : (error.stack || error).toString());
});

autoUpdater.on('update-available', () => {
	dialog.showMessageBox({
		type: 'info',
		title: 'Update Available',
		message: 'An update to this application was found. Do you want to install it now? The application will be restarted.',
		buttons: ['Yes, Install the update', 'Cancel']
	}, (buttonIndex) => {
		if (buttonIndex === 0) {
			autoUpdater.downloadUpdate();

			progressBar = new ProgressBar({
				indeterminate: false,
				text: 'Downloading Update...',
				detail: 'Downloading Update...'
			});
			
			progressBar.on('completed', function() {
				progressBar.detail = 'Download completed. Exiting...';
			}).on('aborted', function() {
				console.log('Aborted download');
			}).on('progress', function(value) {
				progressBar.detail = `Downloaded ${value}%`;
			});

		} else {
			updater.enabled = true;
			updater = null;
		}
	});
});

autoUpdater.on('download-progress', (progressObj) => {
	if (progressBar != undefined) {
		if (!progressBar.isCompleted()) {
			progressBar.value = progressObj.percent;
		}
	}
});

autoUpdater.on('update-not-available', () => {
	dialog.showMessageBox({
		type: 'info',
		title: 'No Update Available',
		message: 'The application is currently up-to-date!'
	});
	updater.enabled = true;
	updater = null;
});

autoUpdater.on('update-downloaded', () => {
	dialog.showMessageBox({
		type: 'info',
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