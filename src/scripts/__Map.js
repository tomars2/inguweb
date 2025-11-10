function HashMap() {
	this.map = [];
}

HashMap.prototype = {
	put: function(key, value) {
		this.map[key] = value;
	},

	get: function(key) {
		return this.map[key];
	},

	getAll: function() {
		return this.map;
	},

	clear: function() {
		this.map = [];
	},

	getKeys: function() {
		var keys = [];

		for (var i in this.map) {
			keys.push(i);
		}

		return keys;
	}
};