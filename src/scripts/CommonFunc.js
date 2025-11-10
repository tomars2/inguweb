/**
 * TODO 브라우저 호환성으로 ES5 형식으로 작성해야 함
 */
/**
 * 기본상수
 */
var __ServerNotConnectMSG = "서버 연결 대기 시간이 초과되었습니다.";
var __ServerURL = "http://" + location.hostname +":8080";
var __DEBUG = false;

jQuery.support.cors = true;

/**
 * 회원확인
 */
var Global = {
	menuId: "",
	menuTitle: "",
	pageName: "",
	projectId: "",
	role: '',
	changePwTime: ''
};

var userKeyArr = "";

function checkMember2() {
	userKeyArr = Cookies.Get("userKey").split('|');

	if(!checkUserKey()) __continue = false;

	if (__continue) {
		$.ajax({
			type: "GET",
			dataType: "text",
			url: __ServerURL+"/account/" + userKeyArr[0],
			async: false,
			beforeSend: function (xhr) {
				xhr.setRequestHeader('Authorization', 'Bearer ' + userKeyArr[1]);
			},
			success: function (data) {
				var parseData = GetJSON(data);
				var userNM = (parseData.username) ? parseData.username : "";
				var isAdmin = parseData.admin;

				//console.log('parseData.id: ' + parseData.id);
				// 사용자 정보 설정
				if (userNM.length > 0) {
					Object.defineProperty(Global, "ID", { value: parseData.id.Trim(), configurable: false, enumerable: false, writable: false });
					Object.defineProperty(Global, "USERNAME", { value: parseData.username.Trim(), configurable: false, enumerable: false, writable: false });
					Object.defineProperty(Global, "ISADMIN", { value: isAdmin, configurable: false, enumerable: false, writable: false });
				}

				// 역할/권한 설정
				var roles = [], privileges = [];
				for (var i = 0; i < parseData.roles.length; i++) {
					var role = parseData.roles[i];
					roles.push(role.role);

					for (var j = 0; j < role.privileges.length; j++) {
						var privilege = role.privileges[j];
						privileges.push(privilege.privilege);
					}
				}

				//Object.defineProperty(Global, "ROLES", { value: roles, configurable: false, enumerable: false, writable: false });
				//Object.defineProperty(Global, "PRIVILEGES", { value: privileges, configurable: false, enumerable: false, writable: false });

			},
			error: function (xhr, ajaxOptions, thrownError) {
				handleErrorMessage(xhr);
				__continue = false;
			}
		});
	}
}

function checkUserKey() {
	if (userKeyArr.length != 2) {
		$("body").empty();
		alert("The session has ended. Please log in again.");		// 세션이 종료되었습니다. 로그인을 다시 해주시기 바랍니다.
		location.href = "/html/Login.html?_no=" + __NewNo;
		return false;
	}

	return true;
}

/**
 * 로그인 확인
 * @param {*} callback
 */
function CheckMember(callback) {
	if (!isObject(callback)) callback = null;

	commandCustom("/auth/checkAuth", {})
		.then(function(data) {
			var res = (typeof(data.res) === "boolean") ? data.res : false;
			var msg = (typeof(data.msg) === "string") ? data.msg : "알수없는오류";
			var data = (typeof(data.data) === "object") ? data.data : null;

			if (res && isObject(data)) {
				Object.defineProperty(Global, "name", { value: data.name, configurable: false, enumerable: false, writable: false });
				Object.defineProperty(Global, "email", { value: data.email, configurable: false, enumerable: false, writable: false });
				Object.defineProperty(Global, "userId", { value: data.userId, configurable: false, enumerable: false, writable: false });
				Object.defineProperty(Global, "role", { value: data.role, configurable: false, enumerable: false, writable: false });
				Object.defineProperty(Global, "changePwTime", { value: data.changePwTime, configurable: false, enumerable: false, writable: false });
				sessionStorage.setItem("token", data.token);

				if (callback !== null) {
					callback(true, "");
				}
			}
			else {
				if (callback !== null) {
					callback(false, msg);
				}
			}
		})
		.catch(function(error) {
			if (callback !== null) {
				callback(false, __ServerNotConnectMSG);
			}
		});
}

/**
 * 로그아웃
 */
function Logout() {
	/*commandCustom(__ServerURL + "/member/logout.do", {})
		.then(function(data) {
			Global = {};
			sessionStorage.clear();
			location.href = "/";
		})
		.catch(function(error) {
			Global = {};
			sessionStorage.clear();
			location.href = "/";
		});*/
	Global = {};
	sessionStorage.clear();
	Cookies.Set("userKey", "");
	location.href = "/";
}

/**
 * 문자열을 날짜형식으로 변환
 * @param s yyyyMMdd
 * @returns {string|*} yyyy-MM-dd
 */
function str2DateFormat(s) {
	if (typeof(s) == "undefined") {
		return "";
	}
	if (s.length !== 8) {
		return s;
	}

	return s.substr(0, 4) + "-" + s.substr(4, 2) + "-" + s.substr(6);
}

/**
 * 문자열을 시간형식으로 변환
 * @param s hhmm / hhmmss
 * @returns {string|*} hh:mm / hh:mm:ss
 */
function str2TimeFormat(s) {
	if (s.length < 4 || s.length > 6) {
		return s;
	}

	if (s.length === 4) {
		return s.substr(0, 2) + ":" + s.substr(2);
	}
	else {
		return s.substr(0, 2) + ":" + s.substr(2, 2) + ":" + s.substr(4);
	}
}

/**
 * 문자열을 날짜시간형식으로 변환
 * @param s yyyyMMddhhmm 혹은 yyyyMMddhhmmss
 * @returns {string|*} yyyy-MM-dd hh:mm 혹은 yyyy-MM-dd hh:mm:ss
 */
function str2DateTimeFormat(s) {
	if (!(s.length === 12 || s.length === 14)) {
		return s;
	}

	if (s.length === 12) {
		return s.substr(0, 4) + "-" + s.substr(4, 2) + "-" + s.substr(6, 2) + " " +
			s.substr(8, 2) + ":" + s.substr(10, 2);
	}
	else {
		return s.substr(0, 4) + "-" + s.substr(4, 2) + "-" + s.substr(6, 2) + " " +
			s.substr(8, 2) + ":" + s.substr(10, 2) + ":" + s.substr(12);
	}
}

/**
 * 날짜 변환용 함수
 */
function DateFormat(date){
	var year = date.getFullYear();              //yyyy
	var month = (1 + date.getMonth());          //M
	month = month >= 10 ? month : '0' + month;  //month 두자리로 저장
	var day = date.getDate();                   //d
	day = day >= 10 ? day : '0' + day;          //day 두자리로 저장
	return year + '-' + month + '-' + day;
}

/**
 * 연월일시분초를 가져오는 함수
 */
function DateString(date){
	var year = date.getFullYear();              	//yyyy
	var month = (1 + date.getMonth());          	//M
	month = month >= 10 ? month : '0' + month;  	//month 두자리로 저장
	var day = date.getDate();                   	//d
	day = day >= 10 ? day : '0' + day;          	//day 두자리로 저장
	var hour = date.getHours();                 	//h
	hour = hour >= 10 ? hour : '0' + hour;      	//hour 두자리로 저장
	var minute = date.getMinutes();                 //m
	minute = minute >= 10 ? minute : '0' + minute;	//minute 두자리로 저장
	var second = date.getSeconds();                 //s
	second = second >= 10 ? second : '0' + second;  //second 두자리로 저장
	return year + '' + month + '' + day + '' + hour + '' + minute + '' + second;
}


/**
 * Hash SHA256 암호화 Encoding
 */
function encode_sha256(str) {
	return SHA256(str);
}

/**
 * 포멧 형식
 * console.error("[{0}] {1}".format("ERROR", "SetSbService()"), e);
 * @returns {String}
 */
String.prototype.format = function() {
	var formatted = this;
	for(var arg in arguments) {
		formatted = formatted.replace("{" + arg + "}", arguments[arg]);
	}
	return formatted;
}

function isUndefined(obj) {
	let rtnFlag = false;
	if (typeof(obj) === "undefined") {
		rtnFlag = true;
	}

	return rtnFlag;
}

function isEmpty(str) {
	var rtnStr = "";
	if (!isUndefined(str)) {
		rtnStr = str.Trim();
	}
	return rtnStr;
}

/**
 * 비밀번호 체크
 * @param inID : 아이디
 * @param inPW : 비밀번호
 * @param inCfPW : 비밀번호확인
 */
function isPassword(inID, inPW, inCfPW) {
	var number  = inPW.search(/[0-9]/g);
	var english = inPW.search(/[a-z]/ig);
	var spece   = inPW.search(/[`~!@@#$%^&*|₩₩₩'₩";:₩/?]/gi);
	var reg     = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/;

	if (inPW.length < 8 || inPW.length > 20) {
		_ShowWarning("비밀번호는 8자리 ~ 20자리 이내로 입력해주세요.");
		return false;
	}
	else if (inPW !== inCfPW) {
		_ShowWarning("비밀번호가 일치하지 않습니다.");
		return false;
	}
	else if (inPW.search(/\s/) != -1) {
		_ShowWarning("비밀번호는 공백 없이 입력해주세요.");
		return false;
	}
	else if (/(\w)\1\1\1/.test(inPW)) {
		_ShowWarning("비밀번호는 같은 문자를 4번 이상 사용하실 수 없습니다.");
		return false;
	}
	else if (inPW.search(inID) > -1) {
		_ShowWarning("비밀번호에 아이디가 포함되었습니다.");
		return false;
	}
	// else if (number < 0 || english < 0 || spece < 0) {
	// 	_ShowWarning("비밀번호는 영문,숫자,특수문자를 혼합하여 입력해주세요.");
	// 	return false;
	// }
	// else if ((number < 0 && english < 0) || (english < 0 && spece < 0) || (spece < 0 && number < 0)) {
	// 	_ShowWarning("비밀번호는 영문,숫자,특수문자 중 2가지 이상을 혼합하여 입력해주세요.");
	// 	return false;
	// }

	if (!reg.test(inPW)) {
		_ShowWarning("비밀번호는 8자 이상이어야 하며, 숫자/대문자/소문자/특수문자를 모두 포함해야 합니다.");
		return false;
	} 

	return true;
}
