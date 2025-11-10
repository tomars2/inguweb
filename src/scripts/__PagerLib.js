function PageLib() {
	Object.defineProperty(this, "$container", { value: $("#content"), configurable: false, enumerable: true, writable: false });
	Object.defineProperty(this, "currentMenuCD", { value: null, configurable: false, enumerable: true, writable: true });
}

/**
 * 페이지 조회
 */
PageLib.prototype.View = function (config, isReload) {
	if (!isObject(config) || isEmptyObject(config)) {
		console.error("설정값이 없습니다.");
		return;
	}

	this.$container.removeClass("main");

	isReload = (typeof(isReload) === "boolean") ? isReload : false;
	var pageFuncName = "";
	var pageFunc = null;

	if (this.currentMenuCD !== null) {
		if (this.currentMenuCD !== config.menuCode) {
			// 이전에 보여진 패널 숨김
			// --------------------------------------------------
			var $prevPanel = this.$container.find("div.page-panel[data-cd='" + this.currentMenuCD + "']");

			if ($prevPanel.length > 0) {
				try {
					pageFuncName = $prevPanel.attr("data-funcName");
					pageFunc = eval(pageFuncName);
					pageFunc.OnDisappear();
				}
				catch (e) {
					console.error(e);
				}

				$prevPanel.hide();
			}
			// --------------------------------------------------
		}
	}

	// 이전에 생성된 패널여부 확인
	// --------------------------------------------------
	var $currentPanel = this.$container.find("div.page-panel[data-cd='" + config.menuCode + "']");

	if ($currentPanel.length > 0) {
		if (isReload) {
			this.DelPageData($currentPanel);
		}
		else {
			if (this.currentMenuCD === config.menuCode) {
				return;
			}

			$currentPanel.show();

			try {
				pageFuncName = $currentPanel.attr("data-funcName");
				pageFunc = eval(pageFuncName);
				pageFunc.OnResume();
			}
			catch (e) {
				console.error(e);
			}

			this.currentMenuCD = config.menuCode;
			return;
		}
	}
	// --------------------------------------------------

	this.currentMenuCD = String(config.menuCode);
	new PageLoader(this.$container, config);
};

/**
 * 현재 활성화된 패널 가져오기
 */
PageLib.prototype.GetActivePanel = function() {
	return this.$container.find("div.page-panel:visible");
};

PageLib.prototype.GetPanel = function(code) {
	return this.$container.find("div.page-panel[data-cd='" + code + "']");
}

/**
 * Page 삭제
 */
PageLib.prototype.DelPageData = function ($panel) {
	if ($panel === null || $panel.length === 0) return;
	var panelID = $panel.attr("data-cd");

	try {
		// 스타일 삭제
		var $styles = $("style");

		if ($styles.length > 0) {
			for (var i = 0, len = $styles.length; i < len; i++) {
				if ($styles.eq(i).attr("data-pageID") === panelID) {
					$styles.eq(i).remove();
					break;
				}
			}
		}

		// 객체삭제
		var pageFuncName = $panel.attr("data-funcName");
		var pageFunc = eval(pageFuncName);

		if (typeof(pageFunc) == "object" || typeof(pageFunc) == "function") {
			try {
				pageFunc.OnDisappear();
			}
			catch (e) {
				console.error(e);
			}
		}

		try {
			// 객체상태값
			// console.log(pageFuncName, Object.getOwnPropertyDescriptor(window, pageFuncName));
			eval("delete " + pageFuncName);
		}
		catch (e) {
			console.error(e);
		}

		// 스크립트 삭제
		var scriptURL = $panel.attr("data-script-url");
		var $scripts = $("script");

		for (var i = 0, len = $scripts.length; i < len; i++) {
			if (typeof ($scripts.eq(i).attr("data-script-url")) != "undefined") {
				if ($scripts.eq(i).attr("data-script-url").indexOf(scriptURL) > -1) {
					$scripts.eq(i).remove();
					break;
				}
			}
		}

		$panel.remove();

		if (this.$container.find("div.page-panel").length === 0) {
			this.$container.addClass("main");
		}
	}
	catch (e) {
		console.error(e);
	}
};

/**
 * 동적으로 HTML, JS 로드하는 함수
 * @param {*} $container
 * @param {*} config
 */
function PageLoader($container, config) {
	if ((typeof (config) == "object" || typeof (config) == "function") === false) {
		return;
	}

	var panelCode = (typeof(config.menuCode) === "string") ? config.menuCode : "";
	var panelURL = (typeof(config.url) === "string") ? config.url : "";
	var panelTitle = (typeof(config.title) === "string") ? config.title : "";
	var panelParam = isObject(config.param) ? config.param : {};

	if (panelURL === null || panelURL.length === 0) {
		return;
	}

	Object.defineProperty(this, "panelParam", { value: panelParam, configurable: false, enumerable: true, writable: false });

	var pageURL = panelURL;
	var pageURLNoExt = pageURL.substr(0, pageURL.indexOf(".html"));
	var pageName = pageURLNoExt;
	if (pageURLNoExt.lastIndexOf("/") > -1) pageName = pageURLNoExt.substr(pageURLNoExt.lastIndexOf("/") + 1);
	var pageParam = "";
	if (pageURL.indexOf(".html?") > -1) pageParam = pageURL.substr(pageURL.indexOf(".html?") + 6);

	var $panel = $("<div><div class=\"box layout-container\"></div></div>");
	$panel.hide();
	$panel.attr("data-cd", panelCode);
	$panel.attr("data-title", panelTitle);
	$panel.attr("data-url", panelURL);
	$panel.attr("data-urlQuery", pageParam);
	$panel.addClass("page-panel");
	$container.append($panel);

	/* Html Load */
	__Today = new Date();
	__NewNo = __Today.getFullYear() + __Today.getMonth() + __Today.getDate() + __Today.getHours() + __Today.getMinutes() + __Today.getSeconds() + __Today.getMilliseconds();

	var oThis = this;

	_ShowLoading("Page Loading...");

	try {
		pageName = pageName + "_" + panelCode;
		var panelTagID = pageName + "_PANEL";

		$panel.attr("data-funcName", pageName);

		$(document).scrollTop(0);

		$.get(pageURLNoExt + ".html?_no=" + __NewNo)
			.done(function (data) {
				var regPtrn = null, regResult = null, str = "";

				if (data.indexOf("<body>") > -1) {
					var bodyData = data.substr(data.indexOf("<body>") + 6);
					if (bodyData.indexOf("</body>") > -1) bodyData = bodyData.substr(0, bodyData.indexOf("</body>"));

					if (bodyData.length > 0) {
						bodyData = bodyData.replace(/\r\n/gm, "");
						bodyData = bodyData.replace(/\t/gm, "");

						regPtrn = / id="([A-Za-z0-9_-]+)"/ig;
						regResult = regPtrn.exec(bodyData);
						str = bodyData;

						while (regResult) {
							str = str.replace(regResult[0], " id=\"" + pageName + "_" + regResult[1] + "\"");
							regResult = regPtrn.exec(bodyData);
						}

						bodyData = str;
					}

					var $header = $("head"), checkStr = "<style type=\"text/css\"";

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

								styleData = str.Trim();

								if (styleData.length > 0) {
									$header.append(checkStr + " data-pageID=\"" + panelCode + "\">" + styleData + "</style>");
								}
							}
						}
					}

					$panel.show();
					$panel.attr("tabindex", Math.floor((Math.random() * 100) + 1)).focus();
					$panel.attr("id", panelTagID);

					var $loadBox = $("<div>" + bodyData + "</div>");
					$panel.hide();
					$panel.find("div.box").html($loadBox.html());

					var scriptURL = __ServerURL + "/common/scriptLoader.do?code=" + panelCode + "&link=" + pageURLNoExt + ".html";
					$panel.attr("data-script-url", scriptURL);

					$.get(scriptURL)
						.done(function (data) {
							if (checkIEBrowser()) {
								try {
									data = Babel.transform(data, {presets: ["es2015"]}).code;
									data = data.replace(/\"use strict\";/, "");
								}
								catch (e) {
									console.error(e);
								}
							}

							var script = document.createElement("script");
							script.type = "text/javascript";
							$(script).attr("data-script-url", scriptURL);

							var inlineScript = document.createTextNode(data);
							script.appendChild(inlineScript);
							$("head").append(script);
							
							try {
								var pageFunc = eval(pageName);

								if (typeof(pageFunc) == "object" || typeof(pageFunc) == "function") {
									Object.defineProperty(pageFunc, "$panel", {
										value: $panel,
										configurable: false,
										enumerable: true,
										writable: false
									});

									Object.defineProperty(pageFunc, "panelID", {
										value: panelTagID,
										configurable: false,
										enumerable: true,
										writable: false
									});

									Object.defineProperty(pageFunc, "prefix", {
										value: pageName + "_",
										configurable: false,
										enumerable: true,
										writable: false
									});

									Object.defineProperty(pageFunc, "funcName", {
										value: pageName,
										configurable: false,
										enumerable: true,
										writable: false
									});

									Object.defineProperty(pageFunc, "title", {
										value: panelTitle,
										configurable: false,
										enumerable: true,
										writable: false
									});

									Object.defineProperty(pageFunc, "popup", {
										value: new LayerPopup(pageName, 1),
										configurable: false,
										enumerable: true,
										writable: false
									});

									Object.defineProperty(pageFunc, "getParam", {
										value: function(fieldName, defaultValue) { return oThis.getParameter(fieldName, defaultValue); },
										configurable: false,
										enumerable: true,
										writable: false
									});

									Object.defineProperty(pageFunc, "getAllParam", {
										value: oThis.panelParam,
										configurable: false,
										enumerable: true,
										writable: false
									});

									Object.defineProperty(pageFunc, "config", {
										value: config,
										configurable: false,
										enumerable: true,
										writable: false
									});

									_HideLoading(function () {
										$panel.show();
										setLayoutWeight($panel);
										pageFunc.Init(pageParam);

										$("#content").scrollTop(0);
									});
								}
							}
							catch (e) {
								console.error(e);

								_HideLoading(function () {
									_ShowError(e);
								});
							}
						})
						.fail(function () {
							_HideLoading(function () {
								_ShowError("페이지를 찾을 수 없습니다.");
							});
						});
				}
				else {
					_HideLoading(function () {
						_ShowError("페이지 내용이 없습니다.");
					});
				}
			})
			.fail(function () {
				_HideLoading(function () {
					_ShowError("페이지를 찾을 수 없습니다.");
				});
			});
	}
	catch (e) {
		console.error(e);

		_HideLoading(function () {
			_ShowError(e);
		});
	}
}

/**
 * 호출할때 전달할 파라메터 가져오기
 * @param fieldName
 * @param defaultValue
 * @returns {null|*}
 */
PageLoader.prototype.getParameter = function(fieldName, defaultValue) {
	if (typeof(defaultValue) === "undefined") {
		defaultValue = null;
	}

	if (!isObject(this.panelParam)) {
		return defaultValue;
	}

	if (typeof(this.panelParam[fieldName]) !== "undefined") {
		return this.panelParam[fieldName];
	}

	return defaultValue;
}

function setLayoutWeight($panel) {
	if ($panel === null || $panel.length === 0) {
		return;
	}

	var $container = $panel.find("> div.layout-container");

	if ($container.length === 0) {
		return;
	}

	var $subs = $container.children();
	var $sub;
	var usedHeight = 0;
	var i, j;

	for (i = 0; i < $subs.length; i++) {
		$sub = $($subs.get(i));

		if ($sub.hasClass("layout-weight-box")) {
			continue;
		}

		usedHeight += $sub.outerHeight(true);
	}

	var $boxs = $container.find("> div.layout-weight-box");

	for (i = 0; i < $boxs.length; i++) {
		var $box = $($boxs.get(i));
		var marginTop = parseInt($box.css("margin-top").replace("px", "").replace("'", ""));

		if (marginTop > 0) {
			$box.css("height", "calc(100% - " + usedHeight + "px - " + marginTop + "px)");
		}
		else {
			$box.css("height", "calc(100% - " + usedHeight + "px)");
		}

		$subs = $box.children();
		var boxUsedHeight = 0;
		var $weightList = [];

		for (j = 0; j < $subs.length; j++) {
			$sub = $($subs.get(j));

			if ($sub.hasClass("layout-weight")) {
				$weightList.push($sub);
				continue;
			}

			boxUsedHeight += $sub.outerHeight(true);
		}

		for (j = 0; j < $weightList.length; j++) {
			var $weight = $weightList[j];
			var weight = $weight.attr("data-weight");

			if (typeof(weight) === "undefined") {
				weight = "";
			}

			if (weight === "100%" || weight === "0") {
				if (boxUsedHeight > 0) {
					$weight.css("height", "calc(100% - " + boxUsedHeight + "px)");
				}
				else {
					$weight.css("height", "100%");
				}
			}
			else if (weight.indexOf("%") > -1) {
				weight = weight.replace("%", "");
				$weight.css("height", "calc( (100% - " + boxUsedHeight + "px) / (100 / " + weight + ") )" );
				console.log( "calc( (100% - " + boxUsedHeight + "px) / (100 / " + weight + ") )" );
			}
			else if (!isNaN(parseInt(weight))) {
				$weight.css("height", weight + "px");
			}

			$weight.removeAttr("data-weight");
		}
	}
}

function SetTabEvent(selector, callback, firstIndex) {
	var $tab = $("#" + selector);
	if ($tab.length === 0) return;

	if (!(callback !== null && (typeof(callback) == "object" || typeof(callback) == "function"))) {
		callback = null;
	}

	if (typeof(firstIndex) !== "number") firstIndex = 0;

	$tab.data("callback", callback);
	var $tabItems = $tab.find("> ul.tab li");
	var seq = 0;

	for (var i = 0; i < $tabItems.length; i++) {
		var $item = $($tabItems.eq(i));

		$item.attr("data-tab-no", seq++);
		$item.on("click", function(event) {
			var $target = $(event.currentTarget);
			var tabNo = parseInt($target.attr("data-tab-no"));
			var $parent = null;

			for (var j = 0; j < $target.parents().length; j++) {
				var $el = $($target.parents()[j]);

				if ($el.hasClass("tab-style") || $el.hasClass("subTab-style")) {
					$parent = $el;
					break;
				}
			}

			if ($parent === null) {
				return;
			}

			$parent.find("> ul.tab li").removeClass("selected");
			$target.addClass("selected");
			$parent.find("> div.tab-panel").hide();

			var $panel = $parent.find(`> div.tab-panel:eq(${tabNo})`);
			$panel.show();
			// $parent.find(`> div.tab-panel:eq(${tabNo})`).attr("tabindex", 101).focus().blur();

			if ($parent.data("callback") !== null) {
				$parent.data("callback")(tabNo, $panel);
			}
		});
	}

	$tab.find("> ul.tab li:eq(" + firstIndex + ")").trigger("click");
}
