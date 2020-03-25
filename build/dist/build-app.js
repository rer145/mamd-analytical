const builder = require('electron-builder');
const Platform = builder.Platform;
const path = require('path');

const win32Targets = [{target: 'nsis', arch: ['x64', 'ia32']}]

/*
	--dir
	--mac
	--win
*/
let flags = process.argv;
let buildTargets;
let onlyDir = false;
const filenameFormat = 'mamd-${version}-${arch}.${ext}';

//process.chdir(path.resolve(__dirname, '../'));
console.log(`CWD is: ${process.cwd()}`);

if (flags.length > 2) {
	flags = flags.slice(2)
	onlyDir = flags.includes('--dir')
}

buildTargets = flags.filter(el => ['--mac', '--win'].includes(el));
if (buildTargets.length === 0) {
	switch(process.platform) {
		case 'darwin':
			buildTargets.push('--mac');
			break;
		case 'win32':
			buildTargets.push('--win');
			break;
	}
}

if (buildTargets.length === 0) {
	console.error("NO build targets");
	process.exit(0);
}

console.log("Starting build process");
console.log(`Building for: ${buildTargets.map(el => el.substr(2)).join(', ')}`);

const config = {
	appId: 'edu.msu.MaMDAnalytical',
	productName: 'mamd-analytical',
	npmRebuild: false,
	directories: {
		output: 'dist',
		buildResources: 'build'
	},
	afterSign: './build/dist/after-sign.js',
	mac: {
		category: 'public.app-category.education',
		darkModeSupport: false,
		icon: './build/icon.icns',
		target: (onlyDir) ? 'dir' : 'dmg',
		artifactName: filenameFormat,
		hardenedRuntime: true,
		gatekeeperAssess: false,
		entitlements: path.join(__dirname, './build/entitlements.plist'),
		entitlementsInherit: path.join(__dirname, './build/entitlements.plist'),
		extraResources: [
			{
				"from": "./build/R-Portable/R-Portable-Mac",
				"to": "R-Portable"
			},
			{
				"from": "./build/scripts",
				"to": "scripts"
			}
		]
	},
	win: {
		target: (onlyDir) ? 'dir' : win32Targets,
		artifactName: filenameFormat,
		icon: './build/icon.png',
		extraResources: [
			{
				"from": "./build/R-Portable/R-Portable-Win",
				"to": "R-Portable"
			},
			{
				"from": "./build/scripts",
				"to": "scripts"
			},
			{
				"from": "./build/setup",
				"to": "setup"
			}
		]
	},
	dmg: {
		icon: './build/icon.icns',
		contents: [
			{
				x: 130,
				y: 220
			},
			{
				x: 410,
				y: 220,
				type: 'link',
				path: '/Applications'
			}
		],
		window: {
			width: 540,
			height: 400
		}
	},
	nsis: {
		oneClick: false,
		perMachine: false,
		allowElevation: true,
		allowToChangeInstallationDirectory: true,
		uninstallDisplayName: '${productName}'
	}
};

runBuilder().then(() => {
	// all done
	console.log("Build run complete");
}).catch((err) => {
	console.log("Build failed");
	console.error(err);
	process.exit(1);
});

async function runBuilder() {
	for (let flag of buildTargets) {
		let target;
		if (flag === '--mac') target = Platform.MAC.createTarget();
		if (flag === '--win') target = Platform.WINDOWS.createTarget();
		await builder.build({'targets': target, 'config': config});
		console.log(`Build for ${flag.substr(2)} complete`);
	}
};