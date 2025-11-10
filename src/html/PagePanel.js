/**
 * TODO 브라우저 호환성으로 ES5 형식으로 작성해야 함
 */
PagePanel = {
	pageLib: null,
	menuData: [],
 
	$header: null,
	$container: null,
	$content: null,
	popup: null,
	worker: null,
	alertInfo: null,

	Init: function() {
		// 뒤로가기 이벤트 제외
		$(document).bind("keydown", function(e) {
			if (e.which === 8) {
				var nodeName = e.target.nodeName.toUpperCase();

				if ((nodeName === "INPUT" || nodeName === "SELECT" || nodeName === "TEXTAREA"|| nodeName === "DIV") === false) {
					e.preventDefault();
					return false;
				}
			}

			return true;
		});

		$("#userName").html(Global.name);
		$("#projectSelect").css("display", "none");

		// 페이지 로드 라이브러리 할당
		this.pageLib = new PageLib();
		this.popup = new LayerPopup(this.funcName, 1);

		this.$header = $("#header");
		this.$container = $("#container");
		this.$content = $("#content");

		this.EventBind();
		this.SetProjectSelect();
		//this.RotatePasswordPeriodically();
		this.GetMenu();

		// 비밀번호 초기화 사용자의 경우 최초 알림
		//this.AlertResetPassword();
	},

	/**
	 * 비밀번호 초기화 사용자의 경우 알림
	 * @constructor
	 */
	AlertResetPassword() {
		commandCustom("/member/checkResetYn.do", {memberId: Global.userId})
			.then(({res, msg, isReset}) => {
				if (!res) throw new Error(msg);
				console.log(res, msg, isReset);
				if (isReset) {
					return _ShowInfo('비밀번호가 초기화되었습니다. 비밀번호를 변경해주세요.');
				}
			})
			.catch(e => {
				_ShowErrorAfterLoading(e.message);
				console.error(e);
			});
	},

	EventBind() {
		var oThis = this;
		var $user = this.$header.find("div.user");

		$user.find("li.notice").on("click", function() {});

		$user.find("li.logout").on("click", function() {
			_ShowConfirm("로그아웃을 합니다.", function() {
				Logout();
			});
		});

		$user.find("li.setting").on("click", function() {
			oThis.ShowMyInfoPOP();
		});

		$user.find("span.user_name").html(Global.name);
		$user.find("span.user_time").html( "접속시간 " + PrtDateTime(new Date()).substring(0, 16) );

		window.setInterval(function() {
			$user.find("span.user_time").html( "접속시간 " + PrtDateTime(new Date()).substring(0, 16) );

			/*CheckMember(function(isCheck) {
				if (!isCheck) {
					_ShowConfirm("세션이 종료되었습니다. 로그인을 다시 해주시기 바랍니다.", function() {
						Logout();
					});
				}
			});*/
			checkMember2();

		}, 1000 * 30);
	},

	GetMenu: function() {
		_ShowLoading("메뉴목록 조회중...");

		var oThis = this;
		var $menu = this.$header.find("nav.gnb > ul");
		$menu.empty();

		$.ajax({
			type: "GET",
			dataType: "text",
			async: false,
			url: __ServerURL + "/menu",
			data: {},
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
				var parseData = Array.isArray(GetJSON(data)) ? GetJSON(data) : [];
				var makeData = oThis.makeMenuTree(parseData);
				
				oThis.menuData = makeData;
				
				for (var i = 0; i < oThis.menuData.length; i++) {
					var $item = $("<li><a href=\"javascript:none()\"></a><ul></ul></li>");
					$item.find("> a").html(oThis.menuData[i].TITLE);
					$item.attr("data-index", i);
					
					var SUB1 = oThis.menuData[i].SUB1;

					for (var j = 0; j < SUB1.length; j++) {
						const {MENU_ID} = SUB1[j];
						
						if(Global.role !== 'A' && MENU_ID === "sys_user") continue;
						
						var $subItem = $("<li><a href=\"javascript:none()\"></a></li>");
						$subItem.find("a").html(SUB1[j].TITLE);
						$subItem.data("menu", Object.assign({}, SUB1[j]));
						
						$item.find("> ul").append($subItem);
						
						if (SUB1[j].TITLE === "Alert 이력") {
							oThis.alertInfo = SUB1[j];
						}
					}
					
					$menu.append($item);
				} 
				
				// 서브메뉴 최대 높이 지정
				// ------------------------------
				var menuBoxHeight = 0;
				
				$menu.find("> li > ul").each(function(index, element) {
					var $el = $(element);
					
					if (menuBoxHeight < $el.outerHeight(true)) {
						menuBoxHeight = $el.outerHeight(true);
					}
				});
				
				$menu.find("> li > ul").each(function(index, element) {
					var $el = $(element);
					$el.css("height", menuBoxHeight);
				});
				// ------------------------------
				
				// 이벤트 설정
				// ------------------------------
				var headerHeight = oThis.$header.height();
				var $gnb = oThis.$header.find("> nav.gnb");
				$gnb.attr("data-close", headerHeight);
				$gnb.attr("data-open", menuBoxHeight);
				
				$gnb.on("mouseenter", function(event) {
					var $target = $(event.currentTarget);
					var boxHeight = parseInt($target.attr("data-open")) + parseInt($target.attr("data-close")) + 3;
					
					$target.addClass("active");
					$target.css("height", boxHeight + "px");
				});
				
				$gnb.on("mouseleave", function(event) {
					var $target = $(event.currentTarget);
					var boxHeight = parseInt($target.attr("data-close"));
					
					$target.removeClass("active");
					$target.css("height", boxHeight + "px");
				});
				
				$menu.find("> li > ul > li").on("click", function(event) {
					oThis.ShowPage(event.currentTarget);
				});
				// ------------------------------
				
				// 모니터링 - Process 표시
				oThis.ShowPageById("FLOW");
				
				oThis.GetDangerous();
				_HideLoading();
			},
			error: function(jqXHR, textStatus, errorThrown) {
				_HideLoading();
				_ShowError(__ServerNotConnectMSG);
			}
		});
	},
	
	makeMenuTree: function(parseData){
		var MENUS = SUB0 = SUB1 = SUB2 = [];
		var mainCode = sub1Code = sub2Code = sub3Code = -1;					
		for (var i = 0; i < parseData.length; i++) {
			var menu = parseData[i];
			if(menu.mainCode != 1) break;

			var vMenu = {
				LINK: menu.menuUrl,
				MENU_ID: menu.menuId,
				TITLE: menu.menuName,
				MENU_CODE: menu.sub1Code+""+menu.sub2Code+""+menu.sub3Code,
				MAIN_CODE: menu.sub1Code,
				SUB1_CODE: menu.sub2Code,
				SUB2_CODE: menu.sub3Code
			};

			if (mainCode != menu.mainCode) {
				mainCode = menu.mainCode;
				sub1Code = sub2Code = sub3Code = -1;
				SUB0 = SUB1 = SUB2 = [];
				MENUS.push(vMenu);
				continue;
			}
			else {
				if (sub1Code != menu.sub1Code) {
					if (SUB2.length > 0) {
						SUB1[SUB1.length - 1].SUB2 = SUB2;
					}

					if (SUB1.length > 0) {
						SUB0[SUB0.length - 1].SUB1 = SUB1;
					} else {
						SUB0.pop();
					}

					if (SUB0.length > 0) {
						MENUS[MENUS.length - 1].SUB0 = SUB0;
					}
					
					sub1Code = menu.sub1Code;
					sub2Code = sub3Code = -1;
					SUB1 = SUB2 = [];

					SUB0.push(vMenu);
					continue;
				}
				else if (sub2Code != menu.sub2Code) {
					if (SUB2.length > 0) {
						SUB1[SUB1.length - 1].SUB2 = SUB2;
					}
					if (SUB1.length > 0) {
						SUB0[SUB0.length - 1].SUB1 = SUB1;
					}
					
					sub2Code = menu.sub2Code;
					sub3Code = -1;
					SUB2 = [];

					SUB1.push(vMenu);
					continue;								
				}
				else {
					if (SUB2.length > 0) {
						SUB1[SUB1.length - 1].SUB2 = SUB2;
					}
					SUB2.push(vMenu);
				}
			}
		}
		if (SUB2.length > 0) {
			SUB1[SUB1.length - 1].SUB2 = SUB2;
		}

		if (SUB1.length > 0) {
			SUB0[SUB0.length - 1].SUB1 = SUB1; 
		} else {
			SUB0.pop();
		}

		if (SUB0.length > 0) {
			MENUS[MENUS.length - 1].SUB0 = SUB0;
		}

		return MENUS[0].SUB0;
	},

	ShowPageById(menuID) {
		for (let i = 0; i < this.menuData.length; i++) {
			var SUB1 = this.menuData[i].SUB1;

			for (let j = 0; j < SUB1.length; j++) {
				if (SUB1[j].MENU_ID === menuID) {
					this.Open({
						MAIN: SUB1[j].MAIN_CODE,
						CODE: SUB1[j].MENU_CODE,
						TITLE: SUB1[j].TITLE,
						LINK: SUB1[j].LINK,
					});
					
					const linkArr = SUB1[j].LINK.split("/");
					Global.menuId = SUB1[j].MENU_ID;
					Global.menuTitle = SUB1[j].TITLE;
					Global.pageName = linkArr[linkArr.length - 1];
					
					return;
				}
			}
		}
	},

	ShowPage: function(target) {
		var $target = $(target);
		var menu = $target.data("menu");

		if (!isObject(menu)) {
			return;
		}

		this.Open({
			MAIN: menu.MAIN_CODE,
			CODE: menu.MENU_CODE,
			TITLE: menu.TITLE,
			LINK: menu.LINK
		});
		
		const linkArr = menu.LINK.split("/");
		Global.menuId = menu.MENU_ID;
		Global.menuTitle = menu.TITLE;
		Global.pageName = linkArr[linkArr.length - 1];
	},

	Open: function(param) {
		if (!isObject(param)) {
			return;
		}

		var mainTitle = "";

		for (var i = 0; i < this.menuData.length; i++) {
			if (this.menuData[i].MAIN_CODE === param.MAIN) {
				mainTitle = this.menuData[i].TITLE;
				break;
			}
		}

		var menuCode = (typeof(param.CODE) === "string") ? param.CODE : "";
		var pageTitle = (typeof(param.TITLE) === "string") ? param.TITLE : "";
		var pageURL = (typeof(param.LINK) === "string") ? param.LINK : "";

		if (pageURL.length === 0) {
			return;
		}

		this.$container.find("h2.title > span:first").html(param.TITLE);
		this.$container.find("h2.title > span.location").html("HOME > " + mainTitle + " > " + param.TITLE);

		this.pageLib.View({
			menuCode: menuCode,
			title: pageTitle,
			url: pageURL,
			param: {}
		}, true);
	},

	/**
	 * TODO 상세정보
	 *   -. 팝업
	 */
	ShowMyInfoPOP(type) {
		const oThis = this;
		const param = {
			callType: "myInfo",
			memberId: Global.userId
		};

		this.popup.View({
			pageURL: "/html/System/Popup/MemberDtlPOP.html",
			title: "사용자 상세정보",
			width: -1,
			height: -1,
			param: param,
			callback: (() => {
				location.reload();
			}),
			referFunc: null,
			closeCallBack: (data => {}),
		});
	},

	/**
	 * 3개월 주기마다 비밀번호를 바꿀 수 있도록
	 * @author jsKim
	 */
	RotatePasswordPeriodically() {
		const {changePwTime} = Global;

		if(changePwTime === undefined || changePwTime === null) return;

		const changePwTimeList = changePwTime.split("-");
		const changePwDt = new Date(Number(changePwTimeList[0]), Number(changePwTimeList[1]), Number(changePwTimeList[2]));
		const prevThreeMonthDt = new Date();

		prevThreeMonthDt.setMonth(new Date().getMonth() - 3);

		if (changePwDt < prevThreeMonthDt) {
			_ShowInfo("비밀번호 변경일이 3개월을 초과하였습니다.\n비밀번호를 변경하세요.", () => {
				this.ShowMyInfoPOP('changePw');

				$('p.btn-close').hide();
			});
		}

	},

	/**
	 * project 선택
	 */
	SetProjectSelect: function() {
		var oThis = this;
		var $selProject = $(`#selProject`);

		commProjectSelectBox.get($selProject, false)
			.then(data => {
				const {rows} = data;
				$selProject.select2({
					placeholder: "선택해주세요.",
					allowClear: true,
					// minimumResultsForSearch: Infinity
				});
console.log(rows[0].code_cd);
				if (rows.length > 0) {
					//Global.projectId = rows[0].CODE_CD;
					Global.projectId = rows[0].code_cd || rows[0].CODE_CD;
				} else {
					Global.projectId = "85336111-2d68-4376-a42a-ba63917e915a";
				}

				$selProject.val(Global.projectId).trigger("change");
				$selProject.on("select2:select", function (e) {
					Global.projectId = e.params.data.id;
					oThis.ShowPageById("mon_process");
				});

				$selProject.on("select2:clear", function (e) {
					Global.projectId = "";
					$selProject.text("선택해주세요.");
				});
			})
			.catch((e) => {
				console.error("[{0}] {1}".format("ERROR", "SetProjectSelectBox()"), e);
			});
	},

	/**
	 * getDangerous
	 */
	GetDangerous: function() {
		if (this.worker !== null) this.worker.terminate();

		var oThis = this;
		var alert = $("#alert");

		alert.on("click", function (e) {
			const $target = $(e.currentTarget);

			$target.data("menu", oThis.alertInfo);
			oThis.ShowPage(e.currentTarget);
		});
		this.worker = new Worker("Watch.js");
		this.worker.postMessage(
			[
				sessionStorage.getItem("token"),
				__ServerURL
			]
		);

		this.worker.onmessage = function (message) {
			var data = message.data;
			if (!data.res) {
				$(alert.children()[0]).show();
				$(alert.children()[0]).text("E");
				$(alert.children()[0]).css({
					"text-weight": "bold",
					"background-color": "yellow"
				});
			} else { // true
				if (data.errorCnt === 0) {
					$(alert.children()[0]).hide();
				}
				else {
					$(alert.children()[0]).show();
					$(alert.children()[0]).text(data.errorCnt);
				}
			}
		};
	},
};
