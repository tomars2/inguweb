var __Today = new Date();
var __NewNo = __Today.getFullYear() + __Today.getMonth() + __Today.getDate() + __Today.getHours() + __Today.getMinutes() + __Today.getSeconds() + __Today.getMilliseconds();

var __continue = true;

$LAB.setOptions({AlwaysPreserveOrder:true})
	.script("/scripts/jquery-3.2.1.min.js")
	.script("/scripts/jquery.form.js")
	.script("/scripts/vue-2.6.11.min.js")
	.script([
		"/jqGrid/jquery.jqGrid.js",
		"/jqGrid/grid.locale-kr.js",
		"/jqUI/jquery-ui-1.10.4.custom.min.js"
	])
	.script("/scripts/jquery.contextMenu.2.9.2.js")
	.script("/scripts/babel.6.26.0.min.js")
	.script("/scripts/promise.polyfill.min.js")
	.script(function() {
		return [
			"/scripts/__Array.js?_no=" + __NewNo,
			"/scripts/__CSS.js?_no=" + __NewNo,
			"/scripts/__Date.js?_no=" + __NewNo,
			"/scripts/__Storage.js?_no=" + __NewNo,
			"/scripts/__String.js?_no=" + __NewNo,
			"/scripts/__Map.js?_no=" + __NewNo
		];
	})
	.script(function() {
		return [
			"/scripts/__Default.js?_no=" + __NewNo,
			"/scripts/__PagerLib.js?_no=" + __NewNo,
			"/scripts/__TabLib.js?_no=" + __NewNo,
			"/scripts/__PopupLib.js?_no=" + __NewNo
		];
	})
	.script("/scripts/calendarLib/calendarLib.js?_no=" + __NewNo)
	.script("/sweetalert/sweetalert-dev.js?_no=" + __NewNo)
	.script("/select2/select2.full.js?_no=" + __NewNo)
	.script("/scripts/CommonFunc.js?_no=" + __NewNo)
	.script("/html/Common/CommonData.js?_no=" + __NewNo)
	.script("/scripts/Hash_SHA256.js?_no=" + __NewNo)
	.script("/scripts/konva.js?_no=" + __NewNo)
	.script("/scripts/sockjs.min.js")
	.script("/scripts/stomp.min.js")
	.script("/scripts/CustomError.js")
	// .script("/scripts/lodash.js?_no=" + __NewNo)
	.script("/scripts/__KonvaDesigner.js?_no=" + __NewNo)
	.script(function() {
		var loadScriptsList = [];

		if (typeof(pageLoaderOption) == "object") {
			if (pageLoaderOption.pageLogic) {
				var typeOf = typeof(pageLoaderOption.pageLogic);

				if (typeOf === "string") {
					loadScriptsList.push(pageLoaderOption.pageLogic + "?_no" + __NewNo);
				}
				else if (typeOf === "object") {
					for (var i = 0; i < pageLoaderOption.pageLogic.length; i++) {
						loadScriptsList.push(pageLoaderOption.pageLogic[i] + "?_no=" + __NewNo);
					}
				}
			}
		}

		return loadScriptsList;
	})
	.wait(function() {
		Vue.config.devtools = true;

		//Application_Init();
		if (__continue) {
			Global = {};
			sessionStorage.clear();
			
			Application_Init();
		}
	});
