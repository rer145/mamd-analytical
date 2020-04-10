const os = require('os');
const electron = require('electron');
//const node = require('./node');

const {is} = require('electron-util');
const ua = require('universal-analytics');
const Store = require('electron-store');
const store = new Store();

const usr = ua('UA-73604903-10', store.get("uid"));
usr.set("ds", "app");

//usr.set("electron_version", node.electronVersion);
usr.set("chrome_version", process.versions.chrome.replace(/\.\d+$/, ''));
usr.set("platform", process.platform);
usr.set("arch", process.arch);
usr.set("platform_release", os.release());
//usr.set("locale", api.getLocale());

usr.set("uid", store.get("uid"));
usr.set("app_version", store.get("version"));
usr.set("development", is.development);



const track = store.get("settings.analytics", false) && !is.development;

function trackEvent(category, action, label, value) {
	let d = {
		ec: category,
		ea: action
	};

	if (label != undefined)
		d.el = label;
	if (value != undefined)
		d.ev = value;

	console.log(d);

	if (track)
		usr.event(d).send();
}

function trackScreenView(screenName) {
	let d = {
		cd: screenName,
		an: "MaMD Analytical",
		av: store.get("version")
	};
	console.log(d);

	if (track)
		usr.screenview(d).send();
}

function trackTime(category, variable, time, label) {
	let d = {
		utc: category,
		utv: variable,
		utt: time
	};
	if (label != undefined)
		d.utl = label;

	console.log(d);

	if (track)
		usr.timing(d).send();
}

function trackException(description, fatal) {
	let d = {
		exd: description,
		exf: fatal != undefined ? fatal : false
	};
	console.log(d);

	if (track)
		usr.exception(d).send();
}

module.exports = { trackEvent, trackScreenView, trackTime, trackException };