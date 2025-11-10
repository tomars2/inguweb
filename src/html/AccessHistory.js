/**
 * 시스템관리_접속이력
 */
AccessHistory = {
	vm: null,
 
	//TODO query 변경 필요!! table 바뀔것!!(access_history => member_access_history)

	Init(pageParam) {
		
		const today = new Date();
		const prevDay = new Date(today.getFullYear(), today.getMonth()-1, today.getDate());
		
		this.SetControl(prevDay, today);
		this.SetCommonCode();

		// this.popup.View({}); //@@@@ 팝업 바로 열기 가능
	},

	OnResume() {
	},

	OnDisappear() {
	},

	SetCommonCode() {
		// menu select box 설정
		const $selMenu = $(this.vm.$refs["selMenu"]);
		$selMenu.off();
		
		commMenuSelectBox.get($selMenu, false)
			.then(() => {
				$selMenu.select2({
					placeholder: "전체",
					allowClear: true,
					minimumResultsForSearch: Infinity
				});

				$selMenu.val("").trigger("change");
				$selMenu.on("select2:select", (e) => {
					this.vm.menuId = e.params.data.id;
				});
				$selMenu.on("select2:clear", (e) => {
					this.vm.menuId = "";
				});
			});

		//행위 select box event 설정
		const $selAction = $(this.vm.$refs["selAction"]);
		$selAction.off();

		$selAction.select2({
			placeholder: "전체",
			allowClear: true,
			minimumResultsForSearch: Infinity
		});

		$selAction.val("").trigger("change");
		$selAction.on("select2:select", (e) => { this.vm.action = e.params.data.id; });
		$selAction.on("select2:clear", (e) => { this.vm.action = ""; });
	},

	SetControl(prevDay, today) {
		const oThis = this;
		
		this.vm = new Vue({
			el: "#" + this.panelID,
			data: () => {
				return {
					startDt: PrtDate(prevDay),
					endDt: PrtDate(today),
					menuId: "",
					userName: "",
					action: ""
				}
			},
			methods: {
				showCalendar(event, dataName) {
					CalendarLib.open(event.currentTarget, (date) => {
						const fields = dataName.split(".");

						if (fields.length === 1) {
							this.$data[dataName] = date;
						}
						else if (fields.length === 2) {
							this.$data[fields[0]][fields[1]] = date;
						}
						else if (fields.length === 3) {
							this.$data[fields[0]][fields[1]][fields[2]] = date;
						}
					}, "D");
				},
				btnSearch() {
					oThis.Search();
				},
				btnExcelDown() {
					oThis.ExcelDownload(this)
				},
			},
			mounted() {
				oThis.GridInit(prevDay, today);
			},
		});
	},

	GridInit(prevDay, today) {
		const oThis = this;
		
		const colMake = new GridColMake();
		colMake.setOpt("접속일시", "created_time", 100, ColAlign.Center);
		colMake.setOpt("접속자", "user_name", 120, ColAlign.Center);
		colMake.setOpt("메뉴", "menu_name", 100, ColAlign.Center);
		colMake.setOpt("행위", "action", 100, ColAlign.Center, {
			formatter: (c, o, r) => {
				if (c === 2) {
					return "수정";
				}
				else if (c === 0) {
					return "읽기";
				}
				else if (c === 1) {
					return "삽입";
				}
				else if (c === 3) {
					return "삭제";
				}
				else if (c === 4) {
					return "승인";
				}
				else if (c === 5) {
					return "거절";
				}
				else if (c === 6) {
					return "엑셀다운";
				}
				else {
					return "-";
				}
			}
		});
		colMake.setOpt("Access IP", "access_ip", 100, ColAlign.Center);

		const $gridBox = $(`#${this.prefix}grid-box`);
		const gridHeight = $gridBox.height();
		const gridID = `${this.prefix}grid`;
		
		this.$list = $(`#${gridID}`);
		this.$list.jqGrid({
			autowidth: true,
			height: "auto",
			shrinkToFit: true,
			colNames: colMake.colNames,
			colModel: colMake.colModels,
			url: __ServerURL + "/command/page/inQuery.do",
			postData: GetInQueryPostData("accessHistory", "getHistoryList", {
				projectId: Global.projectId,
				menuId: "",
				userName: "",
				action: "",
				startDt: PrtDate(prevDay).replace(/-/g, ""),
				endDt: PrtDate(today).replace(/-/g, "")
			}),
			loadBeforeSend: function (xhr) {
				xhr.setRequestHeader('Authorization', 'Bearer ' + userKeyArr[1]);
			},
			datatype: "json",
			page: 1,
			loadonce: false,
			mtype: "POST",
			rownumbers: true,
			rownumWidth: 40,
			rowNum: 20,
			gridview: true,
			viewrecords: true,
			multiselect: false,
			sortname: "created_time",
			sortorder: "desc",
			pager: `${this.prefix}grid-pager`,
			jsonReader: {
				repeatitems: false,
				id: "_id"
			},
			onCellSelect: (rowid, iCol, cellcontent, e) => {
			},
			onSelectRow: (rowid, status, e) => {
			},
			gridComplete: () => {
				if (typeof($gridBox.attr("data-first")) === "undefined") {
					$gridBox.attr("data-first", "Y");
					SetGridHeight(gridID, gridHeight);
				}
			},
			loadComplete: (data) => {
				if (!Array.isArray(data.userdata)) {
					data.userdata = [];
				}

				this.$list.data("rows", data.userdata);
				// log 기록
				commandCustom("/accessHistory/insertLog.do", { action: "READ" })
					.then(({res, msg}) => {
						if (!res) {
							console.error("log남기기 실패");
						}
					})
					.catch((err) => {
						console.error("insertLogError");
					});
			}
		});
	},

	/**
	 * 조회버튼 클릭시
	 */
	Search() {
		const reqParam = {
			projectId: Global.projectId,
			menuId: "",
			userName: "",
			action: "",
			startDt: "",
			endDt: ""
		};

		copyObjectValue(reqParam, this.vm.$data);

		if (!reqParam.startDt.isDate() && !reqParam.endDt.isDate()) {
			_ShowWarning("Access Date 기간을 설정해주세요.");
			return;
		}

		if (DateDiff.Day(reqParam.startDt, reqParam.endDt) < 0) {
			_ShowWarning("Access Date 조회범위가 잘못되었습니다.");
			return;
		}

		if (DateDiff.Day(reqParam.startDt, reqParam.endDt) > 180) {
			_ShowWarning("Access Date 조회범위는 최대 180일까지 가능합니다.");
			return;
		}

		reqParam.startDt = reqParam.startDt.replace(/-/g, "");
		reqParam.endDt = reqParam.endDt.replace(/-/g, "");
		console.log("reqParam: ", reqParam);

		this.$list.jqGrid("setGridParam", {
			url: __ServerURL + "/command/page/inQuery.do",
			postData: GetInQueryPostData("accessHistory", "getHistoryList", reqParam),
			datatype: "json",
			page: 1
		}).trigger("reloadGrid");
	},

	/**
	 * 엑셀 다운로드 기능
	 * @param $this: Vue Instance
	 */
	ExcelDownload($this) {
		if (this.$list.getGridParam("records") < 1) {
			_ShowWarning("조회된 내용이 없습니다.");
			return;
		}

		const reqParam = {
			projectId: Global.projectId,
			menuId: "",
			userName: "",
			action: "EXCELDOWN",
			startDt: "",
			endDt: "",
			_sort:"created_time DESC"
		};

		copyObjectValue(reqParam, this.vm.$data);

		reqParam.startDt = reqParam.startDt.replace(/-/g, "");
		reqParam.endDt = reqParam.endDt.replace(/-/g, "");

		console.log("reqParam.startDt >>" + reqParam.startDt);
		console.log("reqParam.endDt >>" + reqParam.endDt);
		const data = {
			queryType: "accessHistory",
			tag: "getHistoryListExcel",
			params: reqParam,
			config: {
				pageName: "접속이력",
				title: "접속이력",
				fileName: "HistoryList",
				columns: [
					{ title: "접속일시", field: "created_time", type: "text" },
					{ title: "접속자", field: "user_name", type: "text" },
					{ title: "메뉴", field: "menu_name", type: "text" },
					{ title: "행위", field: "action", type: "text" },
					{ title: "AccessIp", field: "access_ip", type: "text" },
				]
			}
		};

		_ShowConfirm("엑셀다운로드를 할까요?", () => {
			const excelExport = new ExcelExport(data.queryType, data.tag, data.params);
			excelExport.export(data.config);

			_CloseConfirm();
		});
	},
};
