var CalendarLib = {
	$box: null,
	$disabledBox: null,

	$targetEL: null,
	viewType: "S",
	monthLastDay: null,
	currentDate: null,
	minDate: null,
	maxDate: null,
	callbackFunc: null,

	/**
	 * 달력 표시
	 * @param target Input Object
	 * @param callback 날짜 선택 후 호출되는 함수 지정 (date) => {}
	 * @param viewType 보기형식 (S)단일 / (D)이중
	 * @param minDate 선택안할 최소날짜 (T)오늘날짜
	 * @param maxDate 선택안할 최대날짜 (T)오늘날짜
	 */
	open: function(target, callback, viewType, minDate, maxDate) {
		this.$targetEL = $(target);

		if (this.$targetEL.length === 0) {
			return false;
		}

		if (typeof(callback) == "object" || typeof(callback) == "function") {
			this.callbackFunc = callback;
		}
		else {
			this.callbackFunc = null;
		}

		if(typeof(viewType) == "string"){
			this.viewType = viewType;
		}
		else {
			this.viewType = "S";
		}

		// 최소날짜 확인
		if (minDate === "T") {
			// 오늘날짜 지정
			this.minDate = new Date();
		}
		else if (this.isDate(minDate)) {
			this.minDate = this.convertDate(minDate);
		}
		else {
			this.minDate = null;
		}

		// 최대날짜 확인
		if (maxDate === "T") {
			// 오늘날짜 지정
			this.maxDate = new Date();
		}
		else if (this.isDate(maxDate)) {
			this.maxDate = this.convertDate(maxDate);
		}
		else {
			this.maxDate = null;
		}

		this.createBox();
		this.currentDate = [];

		// 참조객체의 이전 선택된 날짜가 있으면 해당 년월을 시작지점으로 설정
		if (this.isDate(this.$targetEL.val())) {
			var checkString = this.$targetEL.val().split("-");

			// parseInt로 변경시 앞에 0이 있으면 제거, 제거를 안하면 0으로 변경됨
			for (var i = -1; ++i < checkString.length; ) {
				if (checkString[i].substr(0, 1) === "0")
					checkString[i] = checkString[i].substr(1);
			}

			this.currentDate.push(new Date(parseInt(checkString[0]), parseInt(checkString[1]) - 1, parseInt(checkString[2])));
		}
		else {
			this.currentDate.push(new Date());
		}

		this.currentDate.push(new Date(this.currentDate[0].getFullYear(), this.currentDate[0].getMonth() + 1, 1));

		this.$box.show();
		this.$disabledBox.show();
		this.genDate();

		// 달력 위치값 설정
		var boxWidth = this.$box.width();
		var boxHeight = this.$box.height();
		var bodyWidth = $(document).width();
		var bodyHeight = $(document).height();
		var obj = $(target).offset();

		// this.$box.css({ "top": (obj.top + 50 ), "left": (bodyWidth - boxWidth) / 2 });
		// this.$box.css({ "top": (obj.top + this.$targetEL.outerHeight()), "left": obj.left - (this.$targetEL.outerWidth() / 2) });

		this.$box.css({ "top": (bodyHeight - boxHeight) / 2, "left": (bodyWidth - boxWidth) / 2 });
	},

	/**
	 * 닫기
	 */
	close: function() {
		if (this.$box === null) return;

		this.$box.hide("fast");
		this.$disabledBox.hide();
	},

	/**
	 * 내용지우기
	 */
	clearField: function() {
		this.$targetEL.val("");

		if (typeof(this.callbackFunc) == "function") {
			this.callbackFunc(0, 0, 0, this.$targetEL.attr("id"));
		}

		this.close();
	},

	/**
	 * 달력박스 생성 및 전역변수 초기화
	 */
	createBox: function() {
		var oThis = this;

		// 각 달별 마지막날 저장
		this.monthLastDay = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

		if (this.$box === null) {
			var $body = $("body");

			this.$box = $(document.createElement("div"));
			this.$box.attr("id", "CalendarBox");
			this.$box.css("display", "none");
			$body.append(this.$box);

			this.$disabledBox = $(document.createElement("div"));
			this.$disabledBox.attr("id", "CalendarBoxDisabled");
			this.$disabledBox.css("display", "none");
			this.$disabledBox.on("click", function() { oThis.close(); });
			$body.append(this.$disabledBox);
		}
		else {
			this.$box.empty();
		}

		if (this.viewType === "S") {
			this.$box.css("width", "314");
		}
		else {
			this.$box.css("width", "624");
		}

		// 이미지경로 설정
		var imageURL = "/scripts/calendarLib/";

		var html = "<div class=\"Header\">" +
			"<form>" +
			"<img  src=\"" + imageURL + "btn_pre.gif\" width=\"16\" height=\"16\" alt=\"이전달\" />&nbsp;" +
			"<select class=\"select-style\" size=\"1\"></select> 년&nbsp;&nbsp;<select class=\"select-style\" size=\"1\"></select> 월" +
			"&nbsp;<img src=\"" + imageURL + "btn_next.gif\" width=\"16\" height=\"16\" alt=\"다음달\" />" +
			"</form>";

		if (this.viewType === "S") {
			html += "<p style=\"display:none;\">";
		}
		else {
			html += "<p>";
		}

		html += "<strong></strong>년 <strong></strong>월</p></div>" +
				"<div class=\"clear\"></div>";

		this.$box.html(html);

		html = this.$box.html() + "<div class=\"ListBox\">";

		if (this.viewType === "S") {
			html += "<table style=\"margin-right:0;\" ";
		}
		else {
			html += "<table ";
		}

		html += "cellspacing=\"0\" cellpadding=\"0\" border=\"0\">" +
				"<thead>" +
				"<tr>" +
				"<th class=\"Sun\">일</th>" +
				"<th>월</th>" +
				"<th>화</th>" +
				"<th>수</th>" +
				"<th>목</th>" +
				"<th>금</th>" +
				"<th class=\"Sat\">토</th>" +
				"</tr>" +
				"</thead>" +
				"<tbody></tbody>" +
				"</table>";

		if (this.viewType === "S") {
			html += "<table style=\"display:none;\"";
		}
		else {
			html += "<table ";
		}

		html += "class=\"Right\" cellspacing=\"0\" cellpadding=\"0\" border=\"0\">" +
				"<thead>" +
				"<tr>" +
				"<th class=\"Sun\">일</th>" +
				"<th>월</th>" +
				"<th>화</th>" +
				"<th>수</th>" +
				"<th>목</th>" +
				"<th>금</th>" +
				"<th class=\"Sat\">토</th>" +
				"</tr>" +
				"</thead>" +
				"<tbody></tbody>" +
				"</table>" +
				"</div>" +
				"<div class=\"clear\"></div>";

		html += "<div class=\"Btn\" style=\"display:none;\">" +
				"<p class=\"left\"><button class=\"button-style gray\" type=\"button\">내용 지우기</button></p>" +
				"<p class=\"right\"><button class=\"button-style black\" type=\"button\">닫기</button></p>" +
				"</div>";

		this.$box.html(html);

		this.$box.find("div.Header img:eq(0)").on("click", function() {
			oThis.moveMonth('P');
		});

		this.$box.find("div.Header img:eq(1)").on("click", function() {
			oThis.moveMonth('N');
		});

		this.$box.find("div.Header select").on("change", function() {
			oThis.directMove();
		});

		this.$box.find("div.Btn p.left button").on("click", function() {
			oThis.clearField();
		});

		this.$box.find("div.Btn p.right button").on("click", function() {
			oThis.close();
		});
	},

	/**
	 * 선택된 년월에 맞는 날짜 표시
	 */
	genDate: function() {
		var currentYear = this.currentDate[0].getFullYear();
		var currentMonth = this.currentDate[0].getMonth() + 1;
		var html;
		var $selectEL = this.$box.find(".Header select");
		var $strongEL = this.$box.find(".Header strong");
		var $tableEL = this.$box.find("table");
		var selectDate = this.$targetEL.val().split("-");

		html = "";

		for (var i = currentYear - 10; i < currentYear + 11; i++) {
			html = html + "<option value=\"" + i + "\"";
			if (i === currentYear) html = html + " selected=\"selected\"";
			html = html + ">" + i + "</optoin>";
		}

		$selectEL.eq(0).html(html);

		html = "";

		for (var i = 1; i < 13; i++) {
			html = html + "<option value=\"" + i + "\"";
			if (i === currentMonth) html = html + " selected=\"selected\"";
			html = html + ">" + i + "</option>";
		}

		$selectEL.eq(1).html(html);
		$strongEL.eq(0).text(this.currentDate[1].getFullYear());
		$strongEL.eq(1).text(this.currentDate[1].getMonth() + 1);

		var oThis = this;
		var nowDate = new Date(), checkDate;
		var currentLastDay, startPos;
		var i, j, counter, $tr, $td, prtDay, linkOK, dateDiffCnt;

		for (var seq = 0; seq < this.currentDate.length; seq++) {
			currentYear = this.currentDate[seq].getFullYear();
			currentMonth = this.currentDate[seq].getMonth() + 1;
			currentLastDay = this.monthLastDay[currentMonth - 1];

			// 윤년계산
			if (currentMonth === 2) {
				if ((currentYear % 400) === 0) {
					currentLastDay = 29;
				}
				else if (((currentYear % 4) === 0) && ((currentYear % 100) > 0)) {
					currentLastDay = 29;
				}
			}

			// 첫날에 요일 가져오기
			startPos = new Date(currentYear, currentMonth - 1, 1).getDay();

			// 가로 7 , 세로 5~6
			counter = 0;
			$tableEL.eq(seq).find("tbody").empty();

			for (i = 0; i < 6; i++) {
				$tr = $(document.createElement("tr"));

				for (j = 0; j < 7; j++) {
					$td = $(document.createElement("td"));

					// 해당 월의 1일의 시작요일 이하면 공백출력하고 넘어가면 그때부터 일수를 출력함
					if ((i === 0) && (j < startPos)) {
						prtDay = "&nbsp;";
					}
					else {
						linkOK = true;
						++counter;

						// 해당 달의 마지막날 이전까지만 일수 출력
						if (counter <= currentLastDay) {
							checkDate = new Date(currentYear, currentMonth - 1, counter);

							// 해당 요일에 CSS 클래스부여, 일요일:Sun, 토요일:Sat
							switch (checkDate.getDay()) {
								case 0:
									$td.addClass("Sun");
									break;
								case 6:
									$td.addClass("Sat");
									break;
							}

							// 현재일 표시
							if (selectDate.length < 3) {
								if ((currentYear === nowDate.getFullYear()) && (currentMonth === nowDate.getMonth() + 1) && (counter === nowDate.getDate())) {
                                    $td.addClass("Today");
                                }
							}
							else {
								if ((currentYear === parseInt(selectDate[0])) && (currentMonth === parseInt(selectDate[1])) && (counter === parseInt(selectDate[2]))) {
                                    $td.addClass("Today");
                                }
							}

							// 최소날짜 확인
							if (this.minDate != null) {
								dateDiffCnt = Math.ceil((checkDate.getTime() - this.minDate.getTime()) / (1000 * 60 * 60 * 24));
								if (dateDiffCnt < 0) linkOK = false;
							}

							// 최대날짜 확인
							if (this.maxDate != null) {
								dateDiffCnt = Math.ceil((checkDate.getTime() - this.maxDate.getTime()) / (1000 * 60 * 60 * 24));
								if (dateDiffCnt > 0) linkOK = false;
							}

							if (linkOK) {
								$td.attr("year", currentYear);
								$td.attr("month", currentMonth);
								$td.attr("day", counter);
								$td.bind("click", function() { oThis.insert(this); });
								$td.bind("mouseenter", function() { $(this).addClass("Focus"); });
								$td.bind("mouseout", function() { $(this).removeClass("Focus"); });
							}
							else {
								$td.removeClass("Sun");
								$td.removeClass("Sat");
								$td.addClass("Disabled");
							}

							prtDay = counter;
						}
						else {
							i = 6;
							prtDay = "&nbsp;";
						}
					}

					$td.html(prtDay);
					$tr.append($td);
				}

				if (counter === currentLastDay) i = 6;
				$tableEL.eq(seq).find("tbody").append($tr);
			}
		}
	},

	directMove: function() {
		var $selectEL = this.$box.find(".Header select");
		var selectYear = parseInt($selectEL.eq(0).find("option:selected").val());
		var selectMonth = parseInt($selectEL.eq(1).find("option:selected").val());

		this.currentDate[0] = new Date(selectYear, selectMonth - 1, 1);
		this.currentDate[1] = new Date(this.currentDate[0].getFullYear(), this.currentDate[0].getMonth() + 1, 1);
		this.genDate();
	},

	moveMonth: function(tag) {
		var directMethod;

		if (tag === "P") {
			directMethod = -1;
		}
		else {
			directMethod = 1;
		}

		this.currentDate[0] = new Date(this.currentDate[0].getFullYear(), (this.currentDate[0].getMonth() + directMethod), 1);
		this.currentDate[1] = new Date(this.currentDate[0].getFullYear(), this.currentDate[0].getMonth() + 1, 1);
		this.genDate();
	},

	/**
	 * 날짜 선택
	 * @param {*} el 
	 */
	insert: function(el) {
		if (!el) return false;
		el = $(el);
		var selYear = el.attr("year");
		var selMonth = el.attr("month");
		var selDay = el.attr("day");

		if (selMonth.length < 2) selMonth = "0" + selMonth;
		if (selDay.length < 2) selDay = "0" + selDay;
		var selectedDate = selYear + "-" + selMonth + "-" + selDay;

		// Callback 확인
		if (this.callbackFunc !== null) {
			this.callbackFunc(selectedDate);
		}

		this.close();
	},

	/**
	 * 입력 문자열 날짜형식(yyyy-MM-dd) 여부 확인
	 * @param {*} s 
	 */
	isDate: function(s) {
		var tmp, checkString = new Array(3);
		var checkDate;

		if (!s) return false;
		tmp = s.split("-");

		if (tmp.length === 3) {
			for (var i = 0; i < checkString.length; i++) {
				tmp[i] = String(tmp[i]);

				if (tmp[i].length === 2) {
					if (tmp[i].substr(0, 1) === "0")
						tmp[i] = tmp[i].substr(1);
				}

				checkString[i] = parseInt(String(tmp[i]));
				if (isNaN(checkString[i])) checkString[i] = 0;
			}

			checkDate = new Date(checkString[0], checkString[1] - 1, checkString[2]);

			return (checkDate.getFullYear() === checkString[0] && (checkDate.getMonth() + 1) === checkString[1] && checkDate.getDate() === checkString[2]);
		}
		else {
			return false;
		}
	},

	convertDate: function(s) {
		var tmp, checkString = new Array(3);
		var checkDate;

		tmp = s.split("-");

		for (var i = 0; i < checkString.length; i++) {
			tmp[i] = String(tmp[i]);

			if (tmp[i].length === 2) {
				if (tmp[i].substr(0, 1) === "0") {
					tmp[i] = tmp[i].substr(1);
				}
			}

			checkString[i] = parseInt(String(tmp[i]));
		}

		checkDate = new Date(checkString[0], checkString[1] - 1, checkString[2]);
		return checkDate;
	}
};