/**
 * 두 날짜 차이 비교
 * @type {{Month: (function(*, *): *), Second: (function(*, *): number), Minute: (function(*, *): number), Year: (function(*, *): number), Weeks: (function(*, *): number), Day: (function(*, *): number)}}
 */
var DateDiff = {
	Second: function (d1, d2) {
		if (typeof(d1) === "string") {
			d1 = Str2Date(d1);
		}

		if (typeof(d2) === "string") {
			d2 = Str2Date(d2);
		}


		var t2 = d2.getTime();
		var t1 = d1.getTime();
		return Math.floor((t2 - t1) / 1000);
	},

	Minute: function (d1, d2) {
		if (typeof(d1) === "string") {
			d1 = Str2Date(d1);
		}

		if (typeof(d2) === "string") {
			d2 = Str2Date(d2);
		}

		var t2 = d2.getTime();
		var t1 = d1.getTime();
		return Math.floor((t2 - t1) / 1000 / 60);
	},

	Day: function (d1, d2) {
		if (typeof(d1) === "string") {
			d1 = Str2Date(d1);
		}

		if (typeof(d2) === "string") {
			d2 = Str2Date(d2);
		}

		console.log(d2, d1);

		var t2 = d2.getTime();
		var t1 = d1.getTime();
		return Math.floor((t2 - t1) / (24 * 3600 * 1000));
	},

	Weeks: function (d1, d2) {
		if (typeof(d1) === "string") {
			d1 = Str2Date(d1);
		}

		if (typeof(d2) === "string") {
			d2 = Str2Date(d2);
		}

		var t2 = d2.getTime();
		var t1 = d1.getTime();
		return Math.floor((t2 - t1) / (24 * 3600 * 1000 * 7));
	},

	Month: function (d1, d2) {
		if (typeof(d1) === "string") {
			d1 = Str2Date(d1);
		}

		if (typeof(d2) === "string") {
			d2 = Str2Date(d2);
		}

		var d1Y = d1.getFullYear();
		var d2Y = d2.getFullYear();
		var d1M = d1.getMonth();
		var d2M = d2.getMonth();
		return (d2M + 12 * d2Y) - (d1M + 12 * d1Y);
	},

	Year: function (d1, d2) {
		if (typeof(d1) === "string") {
			d1 = Str2Date(d1);
		}

		if (typeof(d2) === "string") {
			d2 = Str2Date(d2);
		}

		return d2.getFullYear() - d1.getFullYear();
	}
};

/**
 * 두 날짜 사이에 범위 확인
 * @param s1 {string}
 * @param s2 {string}
 * @returns {boolean}
 */
function DateRangeCheck(s1, s2) {
	return DateDiff.Day(Str2Date(s1), Str2Date(s2)) >= 0;
}

/**
 * 문자열을 날짜형식으로 변경
 * @param s
 * @returns {null|Date}
 */
function Str2Date(s) {
	var year = 0, month = 0, day = 0;
	var hour = 0, minute = 0, second = 0;
	var arrDay = null;

	if (s.indexOf(" ") > -1) {
		var items = s.split(" ");

		if (!s.isDate()) {
			return null;
		}

		arrDay = items[0].split("-");
		year = parseInt(arrDay[0]);
		month = parseInt(arrDay[1].replace(/^0(\d)/g,"$1"));
		day = parseInt(arrDay[2].replace(/^0(\d)/g,"$1"));

		if (items[1].split(":").length === 3) {
			var arrTime = items[1].split(":");
			hour = parseInt(arrTime[0]);
			minute = parseInt(arrTime[1]);
			second = parseInt(arrTime[2]);
		}
		else {
			return null;
		}
	}
	else {
		if (!s.isDate()) {
			return null;
		}

		arrDay = s.split("-");
		year = parseInt(arrDay[0]);
		month = parseInt(arrDay[1].replace(/^0(\d)/g,"$1"));
		day = parseInt(arrDay[2].replace(/^0(\d)/g,"$1"));
	}

	return new Date(year, month - 1, day, hour, minute, second)
}

/**
 * 날짜를 yyyy-MM-dd 형식으로 출력
 * @param d
 * @returns {string}
 */
function PrtDate(d) {
	var prtString = d.getFullYear() + "-";
	var month = String(d.getMonth() + 1);
	var day = String(d.getDate());

	if (month.length === 1) {
		prtString += "0" + month;
	}
	else {
		prtString += month;
	}

	prtString += "-";

	if (day.length === 1) {
		prtString += "0" + day;
	}
	else {
		prtString += day;
	}

	return prtString;
}

/**
 * 날짜를 문자열로 변경
 * @param d
 * @param formatter
 * @returns {string}
 */
function PrtDate2Formater(d, formatter) {
	var year = String(d.getFullYear());
	var month = String(d.getMonth() + 1);
	var day = String(d.getDate());

	if (month.length === 1) {
		month = "0" + month;
	}

	if (day.length === 1) {
		day = "0" + day;
	}

	formatter = formatter.replace(/yyyy/gi, "y");
	formatter = formatter.replace(/MM/gi, "M");
	formatter = formatter.replace(/dd/gi, "d");

	var prtString = "";

	for (var i = 0; i < formatter.length; i++) {
		var s = formatter.substr(i, 1);

		if (s === "y") {
			prtString += year;
		}
		else if (s === "M") {
			prtString += month;
		}
		else if (s === "d") {
			prtString += day;
		}
		else if (s === "w") {
			prtString += getWeekName(d);
		}
		else {
			prtString += s;
		}
	}

	return prtString;
}

/**
 * 날짜의 요일을 반환
 * @param d
 * @returns {string}
 */
function getWeekName(d) {
	var week = d.getDay();
	var weekNameArr = ["일", "월", "화", "수", "목", "금", "토"];
	return weekNameArr[week];
}

/**
 * 날짜를 yyyyMMdd 형식으로 출력
 * @param d
 * @returns {string}
 */
function PrtDateNoDash(d) {
	var prtString = String(d.getFullYear());
	var month = String(d.getMonth() + 1);
	var day = String(d.getDate());

	if (month.length === 1) {
		prtString += "0" + month;
	}
	else {
		prtString += month;
	}

	if (day.length === 1) {
		prtString += "0" + day;
	}
	else {
		prtString += day;
	}

	return prtString;
}

/**
 * 날짜를 yyyy-MM-dd hh:mm:ss 형식으로 출력
 * @param d
 * @returns {string}
 */
function PrtDateTime(d) {
	var prtString = d.getFullYear() + "-";
	var month = String(d.getMonth() + 1);
	var day = String(d.getDate());
	var hours = String(d.getHours());
	var minutes = String(d.getMinutes());
	var seconds = String(d.getSeconds());

	if (month.length === 1) {
		prtString += "0" + month;
	}
	else {
		prtString += month;
	}

	prtString += "-";

	if (day.length === 1) {
		prtString += "0" + day;
	}
	else {
		prtString += day;
	}

	if (hours.length === 1) {
		prtString += " 0" + hours;
	}
	else {
		prtString += " " + hours;
	}

	if (minutes.length === 1) {
		prtString += ":0" + minutes;
	}
	else {
		prtString += ":" + minutes;
	}

	if (seconds.length === 1) {
		prtString += ":0" + seconds;
	}
	else {
		prtString += ":" + seconds;
	}

	return prtString;
}

/**
 * 해당월의 마지막일을 가져오기
 * @param y
 * @param m
 * @returns {number}
 */
function GetMonthLastDay(y, m) {
	if (y + "-" + m + "1".isDate() === false) return 0;
	y = parseInt(y);
	m = parseInt(m);

	var monthLastDay = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]; //각 달별 마지막날 저장
	var currentLastDay = monthLastDay[m - 1];

	// 윤년계산
    if (m === 2) {
        if ((y % 400) === 0) {
			currentLastDay = 29;
		}
        else if (((y % 4) === 0) && ((y % 100) > 0)) {
			currentLastDay = 29;
		}
    }

    return currentLastDay;
}

/**
 * 초단위로 시간단위 환산
 * @param secs
 * @returns {{s: number, d: number, dh: number, h: number, m: number}}
 */
function secondsToTime(secs) {
	var hours = Math.floor(secs / (60 * 60));
	var divisor4minutes = secs % (60 * 60);
	var minutes = Math.floor(divisor4minutes / 60);

	if (minutes > 0 && minutes < 10)  minutes = "0" + minutes;

	var divisor4seconds = divisor4minutes % 60;
	var seconds = Math.floor(divisor4seconds);
	if (seconds < 10) seconds = "0" + seconds;

	var days = Math.floor(hours / 24);
	var daysHour = hours % 24;
	if (daysHour < 10) daysHour = "0" + daysHour;

	return {
		h: hours,
		m: minutes,
		s: seconds,
		d: days,
		dh: daysHour
	};
}


/**
 * 초단위로 시간단위 환산 -- 추가 :: hours 로직 수정
 * @param secs
 * @returns {{s: number, d: number, dh: number, h: number, m: number}}
 */
function secondsToTime_2(secs) {
	var hours = ((secs / (60 * 60)) + "").split('.')[0];
	var divisor4minutes = secs % (60 * 60);
	var minutes = Math.floor(divisor4minutes / 60);

	if (minutes > 0 && minutes < 10)  minutes = "0" + minutes;

	var divisor4seconds = divisor4minutes % 60;
	var seconds = Math.floor(divisor4seconds);
	if (seconds < 10) seconds = "0" + seconds;

	var days = Math.floor(hours / 24);
	var daysHour = hours % 24;
	if (daysHour < 10) daysHour = "0" + daysHour;

	return {
		h: hours,
		m: minutes,
		s: seconds,
		d: days,
		dh: daysHour
	};
}

/*
 * 초단위로 시간단위 문자열 변환
 * return : 0일 0시간 0분 0초
 */
function secondsToTimeStr(secs) {
	secs = parseInt(secs);

	if (isNaN(secs)) {
		return "-";
	}

	var res = "";

	if (secs === 0) {
		res = "0시간 0분 0초";
	}
	else {
		var ti = secondsToTime(secs);
		res = "";

		if (ti.d > 0) res += ti.d + "일 ";
		if (ti.dh > 0) res += ti.dh + "시간 ";
		if (ti.m > 0) res += ti.m + "분 ";
		if (ti.s > 0) res += ti.s + "초";
	}

	return res;
}