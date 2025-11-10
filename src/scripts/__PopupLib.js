function LayerPopup(boxID, step) {
	Object.defineProperty(this, "boxID", { value: "LayerPopup_" + boxID, configurable: false, enumerable: false, writable: false });
	Object.defineProperty(this, "$box", { value: null, configurable: false, enumerable: false, writable: true });
	Object.defineProperty(this, "$popup", { value: null, configurable: false, enumerable: false, writable: true });
	Object.defineProperty(this, "callback", { value: null, configurable: false, enumerable: false, writable: true });
	Object.defineProperty(this, "closeCallBack", { value: null, configurable: false, enumerable: false, writable: true });
	Object.defineProperty(this, "referFunc", { value: null, configurable: false, enumerable: false, writable: true });
	Object.defineProperty(this, "param", { value: null, configurable: false, enumerable: false, writable: true });
	Object.defineProperty(this, "scriptURL", { value: null, configurable: false, enumerable: false, writable: true });
	Object.defineProperty(this, "width", { value: 0, configurable: false, enumerable: false, writable: true });
	Object.defineProperty(this, "height", { value: 0, configurable: false, enumerable: false, writable: true });

	var $panel = $("#LayerPopupBox");

	if ($panel.length === 0) {
		$panel = $("<div id=\"LayerPopupBox\"></div>");
		$("body").append($panel);
	}

	Object.defineProperty(this, "$panel", { value: $panel, configurable: false, enumerable: false, writable: false });

	var currentStep = parseInt(step);
	if (isNaN(currentStep)) currentStep = 1;
	if (currentStep < 1) currentStep = 1;

	Object.defineProperty(this, "step", { value: currentStep, configurable: false, enumerable: false, writable: false });
}

LayerPopup.prototype.Make = function(config) {
	var oThis = this;

	this.$box = this.$panel.find("#popup_" + this.boxID);
	this.$box.remove();

	this.$box = $("<div></div>");
	this.$box.attr("id", this.boxID);
	this.$box.addClass("layer-popup-box");
	var popId = (config.title).split(" ").join("");

	var popupTemplate = "" +
		"<div class=\"disabled-box\"></div>" +
		"<div class=\"layer-popup popup-" + popId + "\">" +
		"	<div class=\"title-bar\">" +
		"		<h3></h3>" +
		"		<p class=\"btn-close\"></p>" +
		"	</div>" +
		"	<div class=\"contents\"></div>" +
		"</div>";

	this.$box.html(popupTemplate);
	this.$panel.append(this.$box);

	this.$popup = this.$box.find("div.layer-popup");
	this.$box.css("zIndex", (this.step) + 20001);
	this.$box.hide();

	if (typeof(config.draggable) !== "boolean") {
		config.draggable = false;
	}

	if (config.draggable) {
		this.$popup.draggable();
	}

	$(window).on("resize.popup_" + this.boxID, function() {
		oThis.SetPosition();
	});
};

LayerPopup.prototype.SetPosition = function() {
	if (this.$box === null) return;
	if (this.$box.css("display") === "none") return;

	var currentWidth = this.width;
	var currentHeight = this.height;

	if (this.width === 0) {
		currentWidth = $(window).width() - (15 * 2) + "px";
		this.$popup.css({
			// "min-width": "1280px"
		});
	}
	else if (this.width === -1) {
		currentWidth = "auto";
	}

	if (this.height === -1) {
		this.$popup.css({
			width: currentWidth,
		});
	}
	else {
		if (this.height === 0) {
			currentHeight = $(window).height() - (15 * 2);
		}
		else {
			currentHeight = currentHeight + 60;
		}

		this.$popup.css({
			width: currentWidth,
			height: currentHeight + "px"
		});
	}

	var boxLeft = ($(window).width() - this.$popup.outerWidth()) / 2;
	var boxTop = ($(window).height() - this.$popup.outerHeight()) / 2;

	if (boxLeft < 0) boxLeft = 10;
	if (boxTop < 0) boxTop = 10;

	this.$popup.css({
		"left": boxLeft + "px",
		"top": boxTop
	});
};

LayerPopup.prototype.Close = function() {
	try {
		// 스타일 삭제
		var $styles = $("style");
		if ($styles.length > 0) {
			for (var i = 0, len = $styles.length; i < len; i++) {
				if ($styles.eq(i).attr("data-popupID") === this.boxID) {
					$styles.eq(i).remove();
					break;
				}
			}
		}

		// 객체삭제
		if (this.$popup.data("pageFunc") !== null) {
			if (typeof (this.$popup.data("pageFunc")) == "object" || typeof (this.$popup.data("pageFunc")) == "function") {
				var currentFuncName = this.$popup.data("pageFunc").funcName;

				try {
					// 객체상태값
					// console.log(currentFuncName, Object.getOwnPropertyDescriptor(window, currentFuncName));
					eval("delete " + currentFuncName);
				}
				catch (e) {
					console.error(e);
				}

				this.$popup.removeData("pageFunc");
			}
		}

		// 스크립트 삭제
		var $scripts = $("script");
		for (var i = 0, len = $scripts.length; i < len; i++) {
			if (typeof($scripts.eq(i).attr("data-script-url")) != "undefined") {
				if ($scripts.eq(i).attr("data-script-url").indexOf(this.scriptURL) > -1) {
					$scripts.eq(i).remove();
					break;
				}
			}
		}

		if (this.$box !== null) {
			this.$box.remove();
			this.$box = null;
		}

		$(window).off("resize.popup_" + this.boxID);
	}
	catch (e) {
		console.error(e);
	}
};

LayerPopup.prototype.GetUsedHeight = function(targetID) {
	var $target = $("#" + targetID);
	if ($target.length === 0) return -1;

	var usedHeight = 0;
	var $prevItems = $target.prev();

	while ($prevItems.length > 0) {
		usedHeight += $prevItems.outerHeight(true);
		$prevItems = $prevItems.prev();
	}

	var contentHeight = this.$box.find("div.contents").height();
	usedHeight = contentHeight - usedHeight - 3;

	return usedHeight;
};

/**
 * 팝업 보여주기
 * @param config 설정
 *
 config = {
	pageURL: {페이지 절대주소},
	title: {팝업 제목},
	width: {팝업 가로크기, -1은 팝업내 가로크기, 지정을 하지 않을 경우 가로는 화면에 꽉 채움}
	height: {팝업 세로크기, -1은 팝업내 세로크기, 지정을 하지 않을 경우 가로는 화면에 꽉 채움}
	callback: {팝업내에서 부모창 처리 함수}
	referFunc: {팝업내에서 부모창 참조 함수}
	param: {팝업창으로 보내는 인수객체}
	closeCallBack: 팝업 종료버튼 클릭시 처리 함수,
	hideTitle: {팝업 제목 표시여부, 기본값 false}
 }
 */
LayerPopup.prototype.View = function(config) {
	if (typeof(config) != "object") {
		_ShowError("No configuration information.");
		return;
	}

	this.Make(config);

	var pageURL = (config.pageURL) ? config.pageURL : "";
	var title = (config.title) ? config.title : "";
	var callback = (config.callback) ? config.callback : null;
	var referFunc = (config.referFunc) ? config.referFunc : null;
	var param = (config.param) ? config.param : null;
	var closeCallBack = (config.closeCallBack) ? config.closeCallBack : null;
	var hideTitle = (typeof (config.hideTitle) === "boolean") ? config.hideTitle : false;

	this.width = (config.width) ? parseInt(config.width) : 0;
	this.height = (config.height) ? parseInt(config.height) : 0;

	if (pageURL.length === 0) {
		_ShowError("Please set the page address.");
		return;
	}

	if (isNaN(this.width)) this.width = 0;
	if (isNaN(this.height)) this.height = 0;

	if (typeof(callback) == "object" || typeof(callback) == "function") {
		this.callback = callback;
	}
	else {
		this.callback = null;
	}

	if (typeof(referFunc) == "object" || typeof(referFunc) == "function") {
		this.referFunc = referFunc;
	}
	else {
		this.referFunc = null;
	}

	if (typeof(param) != "object") {
		this.param = null;
	}
	else {
		this.param = param;
	}

	if (typeof(closeCallBack) == "object" || typeof(closeCallBack) == "function") {
		this.closeCallBack = closeCallBack;
	}
	else {
		this.closeCallBack = null;
	}

	this.$popup.attr("data-width-auto", "N");
	this.$popup.attr("data-height-auto", "N");

	var currentWidth = this.width;
	var currentHeight = this.height;

	if (this.width === 0) {
		currentWidth = $(window).width() - (15 * 2) + "px";
	}
	else if (this.width === -1) {
		currentWidth = "auto";

		this.$popup.css("minWidth", 150);
		this.$popup.attr("data-width-auto", "Y");
	}

	if (this.height === -1) {
		this.$popup.css({
			width: currentWidth
		});

		this.$popup.attr("data-height-auto", "Y");
	}
	else {
		if (this.height === 0) {
			currentHeight = $(document).height() - (15 * 2);
		}
		else {
			currentHeight = currentHeight + 42;
		}

		this.$popup.css({
			width: currentWidth,
			height: currentHeight + "px"
		});
	}

	this.$box.show();
	this.$popup.find("div.title-bar h3").html(title);
	this.$popup.find("div.contents").empty();

	if (hideTitle) {
		this.$popup.find("div.title-bar").hide();
		this.$popup.find("div.contents").css("height", "100%");
	}

	var oThis = this;
	this.$popup.find("div.title-bar p.btn-close").on("click", function() {
		oThis.Close();

		if (oThis.closeCallBack != null) {
			oThis.closeCallBack();
		}
	});

	this.PageLoad(pageURL);
};

LayerPopup.prototype.PageLoad = function(currentPageURL) {
	var pageParam = "";

	var pageURL = currentPageURL.substr(0, currentPageURL.indexOf(".html"));
	var pageName = pageURL;
	if (pageURL.lastIndexOf("/") > -1) pageName = pageURL.substr(pageURL.lastIndexOf("/") + 1);
	if (currentPageURL.lastIndexOf("?") > -1 ) pageParam = currentPageURL.substr(currentPageURL.lastIndexOf("?") + 1);

	var $styles = $("style");
	if ($styles.length > 0) {
		for (var i = 0, len = $styles.length; i < len; i++) {
			if ($styles.eq(i).attr("data-popupID") === this.boxID) {
				$styles.eq(i).remove();
				break;
			}
		}
	}

	if (this.$popup.data("pageFunc") !== null) {
		if (typeof (this.$popup.data("pageFunc")) == "object" || typeof (this.$popup.data("pageFunc")) == "function") {
			var currentFuncName = this.$popup.data("pageFunc").funcName;

			try {
				// 객체상태값
				// console.log(currentFuncName, Object.getOwnPropertyDescriptor(window, currentFuncName));
				eval("delete " + currentFuncName);
			}
			catch (e) {
				console.error(e);
			}

			this.$popup.removeData("pageFunc");
		}
	}

	var $scripts = $("script");
	for (var i = 0, len = $scripts.length; i < len; i++) {
		if (typeof($scripts.eq(i).attr("src")) != "undefined") {
			if ($scripts.eq(i).attr("src").indexOf(pageName) > -1) {
				$scripts.eq(i).remove();
				break;
			}
		}
	}

	// Html Load
	__Today = new Date();
	__NewNo = __Today.getFullYear() + __Today.getMonth() + __Today.getDate() + __Today.getHours() + __Today.getMinutes() + __Today.getSeconds() + __Today.getMilliseconds();
	var oThis = this;

	pageName = pageName + "_0000";
	var panelTagID = pageName + "_POPUP";

	$.get(pageURL + ".html?_no=" + __NewNo,
		function(data) {
			var regPtrn;
			var regResult;
			var str;

			// Success
			if (data.indexOf("<body>") > -1) {
				var bodyData = data.substr(data.indexOf("<body>") + 6);
				if (bodyData.indexOf("</body>") > -1) bodyData = bodyData.substr(0, bodyData.indexOf("</body>"));

				if (bodyData.length > 0) {
					bodyData = bodyData.replace(/\r\n/gm, "");
					bodyData = bodyData.replace(/\t/gm, "");

					regPtrn = /id="([A-Za-z0-9_-]+)"/ig;
					regResult = regPtrn.exec(bodyData);
					str = bodyData;

					while (regResult) {
						str = str.replace(regResult[0], "id=\"" + pageName + "_" + regResult[1] + "\"");
						regResult = regPtrn.exec(bodyData);
					}

					bodyData = str;
				}

				var $header = $("head");
				var checkStr = "<style type=\"text/css\"";

				if ($header.length > 0) {
					if (data.indexOf(checkStr + ">") > -1) {
						var styleData = data.substr(data.indexOf(checkStr + ">") + checkStr.length + 1);
						if (styleData.indexOf("</style>") > -1) styleData = styleData.substr(0, styleData.indexOf("</style>"));

						if (styleData.length > 0) {
							styleData = styleData.replace(/\r\n/gm, " ");
							styleData = styleData.replace(/\t/gm, "");

							regPtrn = /[^:]#([A-Za-z0-9_-]+)[ {| ]/ig;
							regResult = regPtrn.exec(styleData);
							str = styleData;

							while (regResult) {
								str = str.replace("#" + regResult[1], "#" + pageName + "_" + regResult[1]);
								regResult = regPtrn.exec(str);
							}

							styleData = str;
							$header.append(checkStr + " data-popupID=\"" + oThis.boxID + "\">" + styleData + "</style>");
						}
					}
				}

				oThis.$popup.find("div.contents").attr("tabindex", Math.floor((Math.random() * 100) + 1)).focus();
				oThis.$popup.find("div.contents").attr("id", panelTagID);

				oThis.$popup.find("div.contents")[0].innerHTML = bodyData;
				oThis.SetPosition();

				$(document).scrollTop(0);

				oThis.scriptURL = __ServerURL + "/common/scriptLoader.do?code=0000&link=" + pageURL + ".html";

				try {
					$.get(oThis.scriptURL)
						.done(function (data) {
							if (checkIEBrowser()) {
								data = Babel.transform(data, { presets: ["es2015"] }).code;
								data = data.replace(/\"use strict\";/, "");
							}

							var script = document.createElement("script");
							script.type = "text/javascript";
							$(script).attr("data-script-url", oThis.scriptURL);

							var inlineScript = document.createTextNode(data);
							script.appendChild(inlineScript);
							$("head").append(script);

							oThis.$popup.data("pageFunc", eval(pageName));

							if (typeof(oThis.$popup.data("pageFunc")) == "object" || typeof(oThis.$popup.data("pageFunc")) == "function") {
								Object.defineProperty(oThis.$popup.data("pageFunc"), "prefix", {
									value: pageName + "_",
									configurable: false,
									enumerable: true,
									writable: false
								});

								Object.defineProperty(oThis.$popup.data("pageFunc"), "funcName", {
									value: pageName,
									configurable: false,
									enumerable: true,
									writable: false
								});

								Object.defineProperty(oThis.$popup.data("pageFunc"), "$popup_contents", {
									value: oThis.$popup.find("div.contents"),
									configurable: false,
									enumerable: true,
									writable: false
								});

								Object.defineProperty(oThis.$popup.data("pageFunc"), "panelID", {
									value: panelTagID,
									configurable: false,
									enumerable: true,
									writable: false
								});

								Object.defineProperty(oThis.$popup.data("pageFunc"), "reLayout", {
									value: function() { oThis.SetPosition(); },
									configurable: false,
									enumerable: true,
									writable: false
								});

								Object.defineProperty(oThis.$popup.data("pageFunc"), "getParam", {
									value: function(fieldName, defaultValue) { return oThis.getParameter(fieldName, defaultValue); },
									configurable: false,
									enumerable: true,
									writable: false
								});

								Object.defineProperty(oThis.$popup.data("pageFunc"), "getAllParam", {
									value: oThis.param,
									configurable: false,
									enumerable: true,
									writable: false
								});

								Object.defineProperty(oThis.$popup.data("pageFunc"), "getCallback", {
									value: oThis.callback,
									configurable: false,
									enumerable: true,
									writable: false
								});

								Object.defineProperty(oThis.$popup.data("pageFunc"), "Close", {
									value: function() { oThis.Close(); },
									configurable: false,
									enumerable: true,
									writable: false
								});

								oThis.$popup.data("pageFunc").Init();
							}
						})
						.fail(function (e) {
							console.log(e);
							_ShowError("페이지를 찾을 수 없습니다.");
							oThis.Close();
						});
				}
				catch (e) {
					console.log(e);
					_ShowError("페이지를 찾을 수 없습니다.");
					oThis.Close();
				}
			}
		}
	).fail(function() {
		_ShowError("Unable to load page.");
		oThis.Close();
	});
};

/**
 * 호출할때 전달할 파라메터 가져오기
 * @param fieldName
 * @param defaultValue
 * @returns {null|*}
 */
LayerPopup.prototype.getParameter = function(fieldName, defaultValue) {
	if (typeof(defaultValue) === "undefined") {
		defaultValue = null;
	}

	if (!isObject(this.param)) {
		return defaultValue;
	}

	if (typeof(this.param[fieldName]) !== "undefined") {
		return this.param[fieldName];
	}

	return defaultValue;
}
