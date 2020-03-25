const {notarize} = require('electron-notarize');

exports.default = async function(context) {
	if (context.electronPlatformName !== 'darwin') return;

	if (!process.env.APPLE_ID || !process.env.APPLE_ID_PASS) {
		//skip notarization
		return;
	}

	const appName = context.packager.appInfo.productFileName;

	return notarize({
		appBundleId: 'edu.msu.MaMDAnalytical',
		appPath: `${context.appOutDir}/${appName}.app`,
		appleId: process.env.APPLE_ID,
		appleIdPassword: process.env.APPLE_ID_PASS
	});
};