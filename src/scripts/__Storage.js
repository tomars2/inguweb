function setSessionStorage(keyname, keyvalue) {
	sessionStorage.setItem(keyname, keyvalue);
}

function getSessionStorage(keyname) {
	var keydata = sessionStorage.getItem(keyname);
	if (keydata === null || typeof(keydata) === "undefined") keydata = "";
	return keydata;
}

function removeSessionStorage(keyname) {
	sessionStorage.removeItem(keyname);
}

function setLocalStorage(keyname, keyvalue) {
   window.localStorage[keyname] = keyvalue;
}

function getLocalStorage(keyname) {
	var keydata = window.localStorage[keyname];
	if (keydata === null || typeof(keydata) === "undefined") keydata = "";
	return keydata;
}

function removeLocalStorage(keyname) {
	window.localStorage.removeItem(keyname);
}

var Cookies = {
	Set: function (name, value, day) {
		var expire = new Date();
		var cookies = name + "=" + escape(value) + "; path=/;";

		expire.setDate(expire.getDate() + day);

		if (typeof day != "undefined") {
			cookies += "expires=" + expire.toGMTString() + ";";
		}

		document.cookie = cookies;
	},

	Get: function (cname) {
		var name = cname + "=";
		var decodedCookie = decodeURIComponent(document.cookie);
		var ca = decodedCookie.split(';');

		for (var i = 0; i <ca.length; i++) {
			var c = ca[i];

			while (c.charAt(0) == ' ') {
				c = c.substring(1);
			}

			if (c.indexOf(name) == 0) {
				return c.substring(name.length, c.length);
			}
		}

		return "";
	}
};