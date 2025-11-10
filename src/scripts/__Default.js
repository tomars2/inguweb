/**
 * None
 */
function none() {}

/**
 * InQuery Post Data
 * @param queryType
 * @param tag
 * @param param
 * @returns {{query: string, tag: string, param: string}}
 */
function GetInQueryPostData(queryType, tag, param) {
	if (!/^[A-Za-z0-9.]+$/.test(queryType)) {
		queryType = "";
	}

	if (!/^[A-Za-z0-9_\-]+$/.test(tag)) {
		tag = "";
	}

	if (typeof(param) != "object") {
		param = {};
	}

	return {
		query: queryType,
		tag: tag,
		param: JSON.stringify(param),
	};
}

/**
 * Ajax Command InQuery Select Call Promise
 * @param param
 * @param queryType
 * @param tag
 * @returns {Promise<JSON>}
 */
function commandInQuerySelect(param, queryType, tag) {
	return new Promise(function(resolve, reject) {
		// Object.assign(param, Global);
		// param.action = "R";
		// console.log("commandInQueryParam: ", param);
		$.ajax({
			type: "POST",
			dataType: "text",
			async: true,
			url: __ServerURL + "/command/select/inQuery.do",
			data: GetInQueryPostData(queryType, tag, param),
			headers: {
				"Authorization": "Bearer " + sessionStorage.getItem("token")
			},
			xhrFields: {
				withCredentials: true
			},
			beforeSend: function(xhr) {
				xhr.setRequestHeader('Authorization', 'Bearer ' + userKeyArr[1]);
			},
			success: function(data) {
				var parseData = GetJSON(data);
				var auth = (typeof(parseData.auth) === "boolean") ? parseData.auth : true;

				if (!auth) {
					_ShowError("세션이 종료되었습니다. 로그인을 다시 해주시기 바랍니다.", () => {
						Logout();
					});
				}

				parseData.rows = Array.isArray(parseData.rows) ? parseData.rows : [];
				resolve(parseData);
			},
			error: function(jqXHR, textStatus, errorThrown) {
				reject(__ServerNotConnectMSG);
			}
		});
	});
}

/**
 * Ajax URL Call Promise
 * @param url
 * @param param
 */
function commandCustom(url, param) {
	return commandCustom(url, param, "json", "POST");
}

/**
 * Ajax URL Call Promise
 * @param url
 * @param param
 * @param returnType
 * @param methodType
 */
function commandCustom(url, param, returnType, methodType) {
	Object.assign(param, Global);

	returnType = (typeof(returnType) === "string") ? returnType : "json";
	if (returnType !== "json") returnType = "text";
	methodType = (typeof(methodType) === "string") ? methodType : "POST";
	if (!"/POST/GET/".indexOf("/" + methodType + "/")) methodType = "POST";
	
	data = param.hasOwnProperty('action') ? JSON.stringify(param) : param;
	
	return new Promise(function(resolve, reject) {
		$.ajax({
			type: methodType,
			dataType: "text",
			contentType: "application/json",
			async: true,
			url: __ServerURL + url,
			data: data,
			traditional : true,
			headers: {
				//"Authorization": "Bearer " + sessionStorage.getItem("token")
			},
			xhrFields: {
				withCredentials: true
			},
			beforeSend: function(xhr) {
				xhr.setRequestHeader('Authorization', 'Bearer ' + userKeyArr[1]);
			},
			success: function(data) {
				if (returnType === "json") {
					var parseData = GetJSON(data);
					var auth = (typeof(parseData.auth) === "boolean") ? parseData.auth : true;

					if (!auth) {
						_CloseConfirm(() => {
							_ShowError("세션이 종료되었습니다. 로그인을 다시 해주시기 바랍니다.", () => {
								Logout();
							});
						});

						return;
					}

					resolve(parseData);
				}
				else {
					resolve(data);
				}
			},
			error: function(jqXHR, textStatus, errorThrown) {
				console.error(jqXHR, textStatus, errorThrown);
				reject(__ServerNotConnectMSG);
			}
		});
	});
}

/**
 * Ajax URL Call Promise
 * @param url
 * @param param
 * @param returnType
 * @param methodType
 */
function commandCustomFormData(url, param, returnType, methodType) {
	returnType = (typeof(returnType) === "string") ? returnType : "json";
	if (returnType !== "json") returnType = "text";
	methodType = (typeof(methodType) === "string") ? methodType : "POST";
	if (!"/POST/GET/".indexOf("/" + methodType + "/")) methodType = "POST";

	return new Promise(function(resolve, reject) {
		$.ajax({
			method: methodType,
			enctype: "multipart/form-data",
			dataType: "JSON",
			async: true,
			url: __ServerURL + url,
			data: param,
			headers: {
				"Authorization": "Bearer " + sessionStorage.getItem("token")
			},
			xhrFields: {
				withCredentials: true
			},
			contentType: false,
			processData: false,
			traditional : true,
			beforeSend: function() {
			},
			success: function(data) {
				if (returnType === "json") {
					resolve(GetJSON(data));
				}
				else {
					resolve(data);
				}
			},
			error: function(jqXHR, textStatus, errorThrown) {
				reject(__ServerNotConnectMSG);
			}
		});
	});
}

/**
 * Get Request Parameters
 * @type {{Get: (function(*, *): *), getParameter: (function(*): string)}}
 */
var Request = {
	getParameter: function (name) {
		var rtnVal = "";
		var currentHref = location.href;
		var parameters = (currentHref.slice(currentHref.indexOf('?') + 1, currentHref.length)).split('&');

		for (var i = -1; ++i < parameters.length;) {
			var temp = parameters[i].split("=");

			if (temp.length === 2) {
				if (temp[0].toLowerCase() === name.toLowerCase()) {
					rtnVal = temp[1];
					break;
				}
			}
		}

		return rtnVal;
	},

	Get: function (name, str) {
		var rtnVal = "";
		var currentHref = str;
		var parameters = (currentHref.slice(currentHref.indexOf('?') + 1, currentHref.length)).split('&');

		for (var i = -1; ++i < parameters.length;) {
			var temp = parameters[i].split("=");

			if (temp.length === 2) {
				if (temp[0].toLowerCase() === name.toLowerCase()) {
					rtnVal = temp[1];
					break;
				}
			}
		}

		return rtnVal;
	}
};

/*
 * MSIE Browser Check
 */
function checkIEBrowser() {
	var agent = navigator.userAgent.toLowerCase();
	return (navigator.appName === "Netscape" && agent.indexOf("trident") !== -1) || (agent.indexOf("msie") !== -1);
}

/**
 * JQuery Extented (contains 대소문자 구분없이 검색)
 */
$.expr[":"].contains = $.expr.createPseudo(function(arg) {
    return function( elem ) {
        return $(elem).text().toUpperCase().indexOf(arg.toUpperCase()) >= 0;
    };
});

/**
 * jqGrid 높이 지정 (Title, Header, Body, Summary, Pager 포함)
 * @param {*} gridID
 * @param {*} height
 */
function SetGridHeight(gridID, height) {
	var $gridBox = $("#gbox_" + gridID);
	if ($gridBox.length === 0) return;
	var gridUsedHeight = 2;

	// Title
	var $el = $gridBox.find(".ui-jqgrid-titlebar");

	if ($el.css("display") !== "none" && $el.length > 0) {
		gridUsedHeight += $el.outerHeight(true);
	}

	// Header
	$el = $gridBox.find(".ui-jqgrid-hdiv");

	if ($el.css("display") !== "none" && $el.length > 0) {
		gridUsedHeight += $el.outerHeight(true);
	}

	// Footer Summary
	$el = $gridBox.find(".ui-jqgrid-sdiv");

	if ($el.css("display") !== "none" && $el.length > 0) {
		gridUsedHeight += $el.outerHeight(true);
	}

	// Pager
	$el = $gridBox.find(".ui-jqgrid-pager");

	if ($el.css("display") !== "none" && $el.length > 0) {
		gridUsedHeight += $el.outerHeight(true);
	}

	$el = $gridBox.find(".ui-jqgrid-bdiv");

	if ($el.length > 0) {
		if ( (height - gridUsedHeight) > 0) $el.css("height", height - gridUsedHeight);
	}

	$el = null;
}

/**
 * jqGrid 넒이 변경
 * @param $grid jqGrid Object
 * @param parentID 대상 아이디
 */
function setGridWidth($grid, parentID) {
	var $parent = $("#" + parentID);

	if ($parent.length === 0) {
		return;
	}

	$grid.setGridWidth($parent.width());
}

/**
 * jqGrid Row 높이 가져오기
 * @param targetGrid
 * @returns {number}
 */
function getGridRowHeight(targetGrid) {
	var height = 0;

	try {
		height = $("#" + targetGrid).find("tbody").find("tr.jqgrow:first").outerHeight();
	}
	catch (e) {}

	if (typeof(height) === "undefined") {
		height = 0;
	}

	return height;
}

/**
 * 로딩창 표시
 * @param message
 * @returns
 */
function _ShowLoading(message) {
	var $box = $("#__Loading_Box");

	if ($box.length === 0) {
		var str = "" +
			"<div id=\"__Loading_Box\" style=\"display:none;\">" +
			"	<div class=\"inner-box\">" +
			"		<div class=\"message-box\">" +
			"			<div class=\"icon-box\">" +
			"				<span class=\"icon icon1\"></span>" +
			"				<span class=\"icon icon2\"></span>" +
			"				<span class=\"icon icon3\"></span>" +
			"				<span class=\"icon icon4\"></span>" +
			"				<span class=\"icon icon5\"></span>" +
			"			</div>" +
			"			<p class=\"message\"></p>" +
			"		</div>" +
			"		<div class=\"disabled-box\"></div>" +
			"	</div>" +
			"</div>";

		$box = $(str);
		$("body").append($box);
	}

	$box.find("div.message-box p.message").html(message);
	$box.show();
}

/**
 * 로딩창 숨김
 * @param {*} callback
 */
function _HideLoading(callback) {
	var $box = $("#__Loading_Box");

	if ($box.length === 0) return;
	if ($box.css("display") === "none") return;

	if (!isObject(callback)) {
		callback = null;
	}

	window.setTimeout(function () {
		$box.fadeOut("fast", function() {
			$box.hide();

			if (callback !== null) callback();
		});
	}, 500);
}

/**
 * 에러 알림창 표시
 * @param message
 * @param callback
 */
function _ShowError(message, callback) {
	_ShowAlert("error", message, callback);
}

/**
 * 경고 알림창 표시
 * @param message
 * @param callback
 */
function _ShowWarning(message, callback) {
	_ShowAlert("warning", message, callback);
}

/**
 * 성공 알림창 표시
 * @param message
 * @param callback
 */
function _ShowSuccess(message, callback) {
	_ShowAlert("success", message, callback);
}

/**
 * 정보 알림창 표시
 * @param message
 * @param callback
 */
function _ShowInfo(message, callback) {
	_ShowAlert("info", message, callback);
}

/**
 * 알림창 표시
 * @param {*} type warning, error, success, info
 * @param {*} message
 * @param {*} callback
 */
function _ShowAlert(type, message, callback) {
	if (typeof(swal) == "undefined") return;

	if ((typeof(callback) == "object" || typeof(callback) == "function") === false) {
		callback = null;
	}

	swal({
		title: "",
		text: message,
		type: type,
		confirmButtonText: "OK"
	},
	function(isConfirm) {
		if (callback !== null) callback();
	});
}

/**
 * 사용자 확인창 표시
 * @param message
 * @param confirmCallback
 * @param cancelCallback
 */
function _ShowConfirm(message, confirmCallback, cancelCallback) {
	if ((typeof(confirmCallback) == "object" || typeof(confirmCallback) == "function") === false) {
		confirmCallback = null;
	}

	if ((typeof(cancelCallback) == "object" || typeof(cancelCallback) == "function") === false) {
		cancelCallback = null;
	}

	swal({
		title: "",
		text: message + "<br/>계속하려면 확인을 중지하려면 취소를 누르세요.",
		type: "info",
		showCancelButton: true,
		confirmButtonText: "확인",
		cancelButtonText: "취소",
		closeOnConfirm: false,
		closeOnCancel: false,
		showLoaderOnConfirm: true,
		allowOutsideClick: false
	},
	function(isConfirm) {
		if (isConfirm) {
			if (confirmCallback !== null) {
				confirmCallback();
			}
		}
		else {
			swal.close();

			if (cancelCallback !== null) {
				cancelCallback();
			}
		}
	});
}

/**
 * 사용자 확인창에서 작업 성공인 경우 성공 경고창 표시
 * @param message
 * @param callback
 */
function _ShowSuccessAfterLoading(message, callback) {
	if ((typeof(callback) == "object" || typeof(callback) == "function") === false) {
		callback = null;
	}

	window.setTimeout(function () {
		swal({
			title: "",
			text: message,
			type: "success"
		},
		function (isConfirm) {
			if (callback !== null) {
				callback();
			}
		});
	}, 1000);
}

/**
 * 사용자 확인창에서 작업 실패한 경우 에러 경고창 표시
 * @param message
 * @param callback
 */
function _ShowErrorAfterLoading(message, callback) {
	if ((typeof(callback) == "object" || typeof(callback) == "function") === false) {
		callback = null;
	}

	window.setTimeout(function () {
		swal({
			title: "",
			text: message,
			type: "error"
		},
		function (isConfirm) {
			if (callback !== null) {
				callback();
			}
		});
	}, 1000);
}

function _CloseConfirm(callback) {
	if (typeof(swal) == "undefined") return;

	if ((typeof(callback) == "object" || typeof(callback) == "function") === false) {
		callback = null;
	}

	swal.close();

	if (callback !== null) {
		window.setTimeout(callback, 301);
	}
}

/**
 * 브라우저 세로 스크롤바 가로크기 가져오기
 * @returns {number}
 */
function getScrollBarWidth () {
	var inner = document.createElement('p');
	inner.style.width = "100%";
	inner.style.height = "200px";

	var outer = document.createElement('div');
	outer.style.position = "absolute";
	outer.style.top = "0px";
	outer.style.left = "0px";
	outer.style.visibility = "hidden";
	outer.style.width = "200px";
	outer.style.height = "150px";
	outer.style.overflow = "hidden";
	outer.appendChild (inner);

	document.body.appendChild (outer);
	var w1 = inner.offsetWidth;
	outer.style.overflow = 'scroll';
	var w2 = inner.offsetWidth;
	if (w1 === w2) w2 = outer.clientWidth;

	document.body.removeChild (outer);

	return (w1 - w2);
}

/**
 * 숫자형 데이터 정수형 여부 확인
 * @param n
 * @returns {boolean}
 */
function isInt(n) {
	return Number(n) === n && n % 1 === 0;
}

/**
 * 숫자형 데이터 실수형 여부 확인
 * @param n
 * @returns {boolean}
 */
function isFloat(n) {
	return Number(n) === n && n % 1 !== 0;
}

/**
 * 빈객체여부 확인
 * @param obj
 * @returns {boolean}
 */
function isEmptyObject(obj) {
	return Object.keys(obj).length === 0 && obj.varructor === Object;
}

/**
 * Object여부 확인
 * @param obj
 * @returns {boolean}
 */
function isObject(obj) {
	return ( obj !== null && ((typeof(obj) == "object" || typeof(obj) == "function")) );
}

/* 현재 페이지의 엑셀 값을 가져오는 Function
 *  @Param : Object, Array, Array, Array, String
 *  @Return : Excel Download
 * */
function ExcelDownload($list, gridRows, acceptHeader, acceptData, excelName) {
	// 현 페이지의 jQGrid Id Array
	const dataIds = $list.getDataIDs();
	// 전체 페이지의 jQGrid Id Object
	const idToDataIndex = $list.jqGrid('getGridParam','_index');
	const data = $list.getRowData(dataIds[0]);
	const colNames = [];
	const fileName = excelName;

	// idToDataIndex는 Object이기 때문에 Array로 변경
	let idsArr = [];

	for (let id in idToDataIndex) {
		if (idToDataIndex.hasOwnProperty(id)) {
			idsArr.push(id);
		}
	}

	let index = 0;

	for (let element in data) {
		for (let i = 0; i < acceptData.length; i++) {
			const acceptKey = acceptData[i];

			if (element === acceptKey) {
				colNames[index++] = element;
			}
		}
	}

	// 컬럼 헤더 가져오기
	const columnHeader = $list.jqGrid('getGridParam', 'colNames') + '';
	const arrHeader = columnHeader.split(',');

	let html = '<table border=1><tr>';

	/* 정해진 Header 입력 */
	for (let i = 0; i < acceptHeader.length; i++) {
		html += `<td><b>${acceptHeader[i]}</b></td>`;
	}
	html += '</tr>';

	// 값 불러오기
	for (let i = 0; i < idsArr.length; i++) {
		const rowData = gridRows[i];
		/**
		 * 이 부분에서 데이터 수정 처리하기
		 **/

		html = html + "<tr>";
		for (let j = 0; j < colNames.length; j++) {
			/* rowData의 값이 null일 경우를 방지 */
			if (rowData[colNames[j]] === null) {
				rowData[colNames[j]] = '';
			}

			html += `<td>${rowData[colNames[j]]}</td>`;
		}
		html += '</tr>';
	}

	html += '</table>';

	/* DownLoad */
	const dataType = 'data:application/vnd.ms-excel;charset=utf-8';
	const tableHtml = encodeURIComponent(html);
	const a = document.createElement('a');
	a.href = dataType + ',%EF%BB%BF' + tableHtml;
	a.download = fileName + '.xls';
	a.click();
}

/**
 * Config 설정
 * @param config = {
	title: "",
	fileName: "",
	headers: [{
		startCol: 0,
		range: 0,
		title: ""
	}],
	columns: [{
		title: "",
		field: "",
		type: {auto,text,integer}
	}]
 * }
 *
 */
ExcelExport.prototype.export2 = function(config) {
	if (!isObject(config)) {
		return;
	}

	_ShowLoading("엑셀로 내보내는중...");

	var $iframe = $("#__DataExportIFrame");

	if ($iframe.length === 0) {
		$("body").append("<iframe name=\"__DataExportIFrame\" id=\"__DataExportIFrame\" style=\"display:none;\"></iframe>");
		$iframe = $("#__DataExportIFrame");
	}

	var $form = $("#__DataExportForm");

	if ($form.length === 0) {
		$iframe.after("<form id=\"__DataExportForm\" method=\"post\" action=\"\" target=\"__DataExportIFrame\"></form>");
		$form = $("#__DataExportForm");
		$form.append("<input type=\"hidden\" name=\"query\" value=\"\" />");
		$form.append("<input type=\"hidden\" name=\"tag\" value=\"\" />");
		$form.append("<input type=\"hidden\" name=\"param\" value=\"\" />");
		$form.append("<input type=\"hidden\" name=\"data\" value=\"\" />");
	}

	$form.attr("action", "/common/export/excel.do")
	$form.find("input[name='query']").val(this.inQueryParam.query);
	$form.find("input[name='tag']").val(this.inQueryParam.tag);
	$form.find("input[name='param']").val(this.inQueryParam.param);
	$form.find("input[name='data']").val(JSON.stringify(config));
	$form.trigger("submit");

	window.setTimeout(function() {
		_HideLoading();
	}, 1000 * 3);
}

/**
 * 엑셀로 내보내기 (사용자 지정 URL)
 * @param url
 * @param param
 */
function ExcelExportCustom(url, param) {
	if (!isObject(param)) {
		console.error("Parameter not defined.");
		return;
	}

	_ShowLoading("엑셀로 내보내는중...");

	var $iframe = $("#__DataExportIFrame");

	if ($iframe.length === 0) {
		$("body").append("<iframe name=\"__DataExportIFrame\" id=\"__DataExportIFrame\" style=\"display:none;\"></iframe>");
		$iframe = $("#__DataExportIFrame");
	}

	var $form = $("#__DataExportForm");

	if ($form.length === 0) {
		$iframe.after("<form id=\"__DataExportForm\" method=\"post\" action=\"\" target=\"__DataExportIFrame\"></form>");
		$form = $("#__DataExportForm");
	}
	else {
		$form.empty();
	}

	$form.attr("action", url);

	var keys = Object.keys(param);

	for (var i = 0; i < keys.length; i++) {
		$form.append("<input type=\"hidden\" name=\"" + keys[i] + "\" value=\"" + param[keys[i]] + "\" />");
	}

	$form.trigger("submit");

	window.setTimeout(function() {
		_HideLoading();
	}, 500);
}

/**
 * 엑셀로 내보내기
 */
function ExcelExport(queryType, tag, param) {
	var reqParam = GetInQueryPostData(queryType, tag, param);
	Object.defineProperty(this, "inQueryParam", { value: reqParam, configurable: false, enumerable: true, writable: false });
}

ExcelExport.prototype.export = function(config) {
	if (!isObject(config)) {
		return;
	}

	_ShowLoading("엑셀로 내보내는중...<br />(데이터에 따라서 수분이 소요될 수 있습니다.)");

	var $iframe = $("#__DataExportIFrame");

	if ($iframe.length === 0) {
		$("body").append("<iframe name=\"__DataExportIFrame\" id=\"__DataExportIFrame\" style=\"display:none;\"></iframe>");
		$iframe = $("#__DataExportIFrame");
	}

	var $form = $("#__DataExportForm");

	if ($form.length === 0) {
		$iframe.after("<form id=\"__DataExportForm\" method=\"post\" action=\"\" target=\"__DataExportIFrame\"></form>");
		$form = $("#__DataExportForm");
		$form.append("<input type=\"hidden\" name=\"query\" value=\"\" />");
		$form.append("<input type=\"hidden\" name=\"tag\" value=\"\" />");
		$form.append("<input type=\"hidden\" name=\"param\" value=\"\" />");
		$form.append("<input type=\"hidden\" name=\"data\" value=\"\" />");
	}

	$form.attr("action", __ServerURL + "/common/export/excel.do");
	$form.find("input[name='query']").val(this.inQueryParam.query);
	$form.find("input[name='tag']").val(this.inQueryParam.tag);
	$form.find("input[name='param']").val(this.inQueryParam.param);
	$form.find("input[name='data']").val(JSON.stringify(config));

	var callType = "fetch";   // form, fetch

	if ("form" === callType) {
		$form.trigger("submit");
	}
	else if ("fetch" === callType) {
		fetch(__ServerURL + "/common/export/excel.do?" + $form.serialize(), {
			method: "POST",
			headers: {
				"Authorization": "Bearer " + sessionStorage.getItem("token")
			}
			})
			.then(function(response) {
				return response.blob();
			})
			.then(function(blob) {
				var file = new Blob([blob], { type: "application/vnd.ms-excel" });
				var fileURL = URL.createObjectURL(blob);

				var fileLink = document.createElement("a");
				fileLink.href = fileURL;
				fileLink.download = config.fileName + ".xlsx";
				fileLink.click();
			})
			.catch(function(error) {
				console.error(error);
			});
	}

	window.setTimeout(function() {
		_HideLoading();
	}, 1000 * 3);
}

/**
 * 객체내 값 복사 (target Key 기준)
 * @param target
 * @param source
 */
function copyObjectValue(target, source) {
	if (typeof(target) !== "object" || typeof(source) !== "object") {
		return;
	}

	if (target === null || source === null) {
		return;
	}

	for (var key in target) {
		if (source.hasOwnProperty(key)) {
			target[key] = source[key];
		}
	}
}

/**
 * 엑셀 다운로드
 * @param popup LayerPopup
 * @param param
 * @param callback Function
 */
function showExportExcel(popup, param, callback) {
	if (!isObject(callback)) callback = null;

	popup.View({
		pageURL: "/html/popup/ExportExcelPOP.html",
		title: "엑셀다운로드",
		width: -1,
		height: -1,
		callback: callback,
		referFunc: null,
		param: param,
		closeCallBack: null
	});
}

/**
 * 객체내 값 통합 - (target Key 기준 복사 후 나머지는 source에 복사)
 * @param target
 * @param source
 */
function mergeObjectValue(target, source) {
	if (typeof(target) !== "object" || typeof(source) !== "object") {
		return {};
	}

	if (target === null || source === null) {
		return {};
	}

	var obj = {};
	var key, i;

	for (key in target) {
		if (Array.isArray(target[key])) {
			for (i = 0; i < target[key].length; i++) {
				obj[key + "_" + (i + 1)] = target[key][i];
			}
		}
		else {
			obj[key] = target[key];
		}
	}

	for (key in source) {
		if (!obj.hasOwnProperty(key)) {
			obj[key] = source[key];
		}
	}

	return obj;
}

/**
 * 객체내 값 초기화
 * @param target
 */
function clearObjectValue(target) {
	if (typeof(target) !== "object") {
		return;
	}

	if (target === null) {
		return;
	}

	var key, i;

	for (key in target) {
		if (Array.isArray(target[key])) {
			for (i = 0; i < target[key].length; i++) {
				var v = target[key][i];
				v = (typeof(v) === "number") ? 0 : "";
			}
		}
		else {
			if (typeof(target[key]) === "number") {
				target[key] = 0;
			}
			else if (typeof(target[key]) === "boolean") {
				target[key] = false;
			}
			else {
				target[key] = "";
			}
		}
	}
}

/**
 * jqGird 정렬 상수
 */
var ColAlign = {
	Left: "left",
	Right: "right",
	Center: "center"
};

/**
 * jqGrid ColName, ColModel 생성
 */
function GridColMake() {
	Object.defineProperty(this, "colNames", { value: [], configurable: false, enumerable: true, writable: true });
	Object.defineProperty(this, "colModels", { value: [], configurable: false, enumerable: true, writable: true });
}

GridColMake.prototype.setOpt = function(title, index, width, align, opts) {
	this.colNames.push(title);

	var colModel = {
		name: index,
		index: index,
		width: width,
		align: align,
		title: false
	};

	if (isObject(opts)) {
		colModel = Object.assign({}, mergeObjectValue(colModel, opts));
	}

	this.colModels.push(colModel);
}

GridColMake.prototype.setHidden = function(index) {
	this.colNames.push(index);

	var colModel = {
		name: index,
		index: index,
		width: 0,
		align: "center",
		title: false
	};

	var opts = {
		hidden: true
	};

	if (isObject(opts)) {
		colModel = Object.assign({}, mergeObjectValue(colModel, opts));
	}

	this.colModels.push(colModel);
}

GridColMake.prototype.clear = function() {
	this.colNames = [];
	this.colModels = [];
}

/**
 * 객체내 Key 명칭을 Camelcase 형식으로 변경
 * @param obj
 * @returns {{}}
 */
function convertKey2CamelCase(obj) {
	if (!isObject(obj)) return {};

	var key;
	var convertedObj;

	if (Array.isArray(obj)) {
		convertedObj = [];

		for (let i = 0; i < obj.length; i++) {
			var item = obj[i];
			var convertedItem = {};

			for (key in item) {
				convertedItem[key.toCamelCase()] = item[key];
			}

			convertedObj.push(convertedItem);
		}
	}
	else {
		convertedObj = {};

		for (key in obj) {
			convertedObj[key.toCamelCase()] = obj[key];
		}
	}

	return convertedObj;
}

/**
 * 원하는 key의 값만 출력
 */
function getObjectFromKey(obj, findKey) {
	const keys = Object.keys(obj);
	
	for (let i = 0; i < keys.length; i++) {
		if (keys[i] === findKey) {
			return obj[findKey];
		}
	}
	
	return {};
}