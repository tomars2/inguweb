function TabLib() {
	this.$box = $("#tabBarContainer");
	this.$tabs = this.$box.find("ul.tab-navi");
	this.tabMinWidth = this.$tabs.width();
	this.currentLeft = 0;

	var oThis = this;

	if (this.$box.length > 0) {
		// 오른쪽 버튼 이벤트 바인딩
		var $tabNaviBox = this.$box.find("ul.tab-navi-btn");

		if ($tabNaviBox.length > 0) {
			var $buttons = $tabNaviBox.find("li");
			$buttons.eq(0).on("click", function() { oThis.Prev(); });
			$buttons.eq(1).on("click", function() { oThis.Next(); });
		}

		$tabNaviBox = null;
	}
}

/**
 * 탭 추가
 * @param config {{CODE: (string|*|string), LINK: (string|*|string), TITLE: (string|*|string)}}
 */
TabLib.prototype.Add = function(config) {
	if (!isObject(config) || isEmptyObject(config)) {
		return;
	}

	var $tab = this.$tabs.find("li[data-code='" + config.CODE + "']");

	if ($tab.length > 0) {
		this.$tabs.find("li").removeClass("on");
		$tab.addClass("on");
		$tab.find("em").html(config.TITLE);
		return;
	}

	var oThis = this;
	this.$tabs.find("li").removeClass("on");

	$tab = $("<li><em>" + config.TITLE + "</em><span></span></li>");
	$tab.find("span").on("click", function(event) { var $parent = $(event.currentTarget).parent(); oThis.Close($parent); });
	$tab.data("config", config);
	$tab.attr("data-code", config.CODE);
	$tab.addClass("on");

	if (this.$tabs.find("li").length === 0) {
		this.$tabs.append($tab);
	}
	else {
		this.$tabs.find("li:last").after($tab);
	}

	var currentWidth = 0;
	var $tabItems = this.$tabs.find("li");
	for (var i = 0, len = $tabItems.length; i < len; i++) currentWidth += $tabItems.eq(i).outerWidth(true);
	currentWidth += 100;

	if (currentWidth > this.tabMinWidth) {
		this.$tabs.width(currentWidth);
	}

	var oThis = this;
	$tab.on("click", function() { oThis.Select(this); });
};

/**
 * 탭 선택
 * @param el
 */
TabLib.prototype.Select = function(el) {
	if (!el) return;

	this.$tabs.find("li").removeClass("on");

	var $currentItem = $(el);
	$currentItem.addClass("on");

	// 위치이동
	// var tabLeft = parseInt(this.$tabs.css("left").replace("px", ""));
	// tabLeft = (isNaN(tabLeft) ? 0 : Math.abs(tabLeft));

	var currentLeft = $currentItem.position().left;
	currentLeft += $currentItem.outerWidth(true);

	if (currentLeft > this.tabMinWidth) {
		currentLeft = this.tabMinWidth - currentLeft;
		this.$tabs.css("left", currentLeft + "px");
	}
	else {
		this.$tabs.css("left", 0);
	}

	PagePanel.Open($currentItem.data("config"));
};

/**
 * 이전탭 선택
 */
TabLib.prototype.Prev = function() {
	var $currentItem = this.$tabs.find("li.on");

	if ($currentItem.length === 0) {
		this.$tabs.find("li.first").trigger("click");
	}
	else {
		if ($currentItem.prev().length > 0) {
			$currentItem.prev().trigger("click");
		}
	}
};

/**
 * 다음탭 선택
 */
TabLib.prototype.Next = function() {
	var $currentItem = this.$tabs.find("li.on");

	if ($currentItem.length === 0) {
		this.$tabs.find("li.first").trigger("click");
	}
	else if ($currentItem.next().length > 0) {
		$currentItem.next().trigger("click");
	}
};

/**
 * 현재탭 새로고침
 */
TabLib.prototype.Reload = function() {
	var $currentItem = this.$tabs.find("li.on");

	if ($currentItem.length > 0) {
		PagePanel.Reload();
	}
};

/**
 * 탭 닫기
 */
TabLib.prototype.Close = function(el) {
	var $currentItem = $(el);

	if ($currentItem.attr("data-code") === "000") {
		return;
	}

	if ($currentItem.length > 0) {
		PagePanel.Close($currentItem.attr("data-code"));

		var $prevItem = $currentItem.prev();
		var $nextItem = $currentItem.next();

		if ($nextItem.length > 0) {
			$currentItem.remove();
			$nextItem.trigger("click");
		}
		else if ($prevItem.length > 0) {
			$currentItem.remove();
			$prevItem.trigger("click");
		}
		else {
			$currentItem.remove();
		}
	}
};

TabLib.prototype.CloseFromCode = function(code) {
	var $currentItem = this.$tabs.find("li[data-code='" + code + "']");
	this.Close($currentItem[0]);
}