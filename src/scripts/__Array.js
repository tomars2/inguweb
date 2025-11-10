/**
 * Array.indexOf
 * 배열내에 속한 객체의 인덱스 가져오기
 */
if (!Array.prototype.indexOf) {
	Array.prototype.indexOf = function(searchElement) {
		"use strict";

		if (this === void 0 || this === null) throw new TypeError();
		var t = Object(this);
		var len = t.length >>> 0;
		if (len === 0) return -1;
		var n = 0;

		if (arguments.length > 0) {
			n = Number(arguments[1]);

			if (n !== n) n = 0;
			else if (n !== 0 && n !== (1 / 0) && n !== -(1 / 0))
				n = (n > 0 || -1) * Math.floor(Math.abs(n));
		}

		if (n >= len) return -1;

		var k = n >= 0 ? n : Math.max(len - Math.abs(n), 0);

		for (; k < len; k++) {
			if (k in t && t[k] === searchElement) return k;
		}

		return -1;
	};
}

/**
 * 객채형식의 배열에 Key, Value에 속한 객체 반환
 */
if (!Array.prototype.getObject) {
	Array.prototype.getObject = function(key, value) {
		for (var i = 0; i < this.length; i++) {
			for (var currentKey in this[i]) {
				if (currentKey === key && this[i][currentKey] === value) {
					return this[i];
				}
			}
		}

		return null;
	}
}