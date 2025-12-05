Flow = {
	vm: null,
	projectId: Global.projectId,

	Init(pageParam) {
		this.SetControl();
		this.SetServerSelectBox(); 
		this.SetFlowSelectBox();
		this.SetStatusSelectBox();
	},
 
	OnResume() {
	}, 

	OnDisappear() {
	},

	SetControl() {
		const oThis = this;

		this.vm = new Vue({
			el: "#" + this.panelID,
			data: () => {
				return {
					flowNm: "",
					serverId: "",  // 검색영역 - Server
					flowId: "",      // 검색영역 - Flow
					groupName: "",     // 검색영역 - Group
					status: ""		// 검색영역 - Status
				}
			},
			methods: {
				btnSearch() {
					oThis.GetFlowData();
				},
				btnNew() {
					oThis.ShowPopup();
				}
			},
			mounted() {
				oThis.GridInit();
			},
		});
	},

	/**
	 * Server 목록 셋팅
	 */
	SetServerSelectBox() {
		const $selServer = $(this.vm.$refs["selServer"]);
		$selServer.off();
		commServerSelectBox.get($selServer, false)
			.then(() => {
				$selServer.select2({
					placeholder: "전체",
					allowClear: true,
					minimumResultsForSearch: Infinity
				});

				$selServer.val("").trigger("change");
				$selServer.on("select2:select", (e) => {
					this.vm.serverId = e.params.data.id;
					this.vm.flowId = "";

					this.SetFlowSelectBox(this.vm.serverId, this.projectId);
				});
				$selServer.on("select2:clear", (e) => {
					this.vm.serverId = "";
					this.vm.flowId = "";
					this.SetFlowSelectBox();
				});
			})
			.catch((e) => {
				console.error("[{0}] {1}".format("ERROR", "SetServerSelectBox()"), e);
			});
	},

	/**
	 *  Flow 목록 셋팅
	 */ 
	SetFlowSelectBox(serverId, projectId) {
		const $selFlow = $(this.vm.$refs["selFlow"]);
		$selFlow.off();
		let commProcessFlow = new CommListLocal("getFlowByServer", "commonData", { serverId: serverId, projectId: projectId });
		commProcessFlow.get($selFlow, true)
			.then(() => {
				$selFlow.select2({
					placeholder: "전체",
					allowClear: true,
					minimumResultsForSearch: Infinity
				});

				$selFlow.val("").trigger("change");
				$selFlow.on("select2:select", (e) => {
					this.vm.flowId = e.params.data.id;
				});
				$selFlow.on("select2:clear", (e) => {
					this.vm.flowId = "";
				});
			})
			.catch((e) => {
				console.error("[{0}] {1}".format("ERROR", "SetFlowSelectBox()"), e);
			});
	},

	SetStatusSelectBox() {
		const $selStatus = $(this.vm.$refs["selStatus"]);

		$selStatus.select2({
			placeholder: "All",
			allowClear: true,
			minimumResultsForSearch: Infinity
		});

		$selStatus.val("").trigger("change");
		$selStatus.on("select2:select", (e) => {
			this.vm.status = e.params.data.id;
		});
		$selStatus.on("select2:clear", (e) => {
			this.vm.status = "";
		});
	},

	GridInit() {
		let oThis = this;
		const colMake = new GridColMake();
		colMake.setOpt("Flow명", "flowName", 120, ColAlign.Center);
		colMake.setOpt("Deployed version", "version", 120, ColAlign.Center);

		colMake.setOpt("Primary Server", "primaryName", 120, ColAlign.Center);
		colMake.setOpt("Secondary Server", "secondaryName", 120, ColAlign.Center);
		colMake.setOpt("Description", "description", 120, ColAlign.Center);
		colMake.setOpt("편집", "", 80, ColAlign.Center, {
			formatter: (c, o, r) => {
				return `<button type="button" class="list-style" data-type="detail">편집</button>`;
			}
		});

		colMake.setHidden("flowId");
		colMake.setHidden("primaryId");
		colMake.setHidden("secondaryId");
		colMake.setHidden("groupName");
		colMake.setHidden("groupId");

		const $gridBox = $(`#${this.prefix}grid-box`);
		const gridHeight = $gridBox.height();
		const gridID = `${this.prefix}grid`;
console.log(this.projectId);
		this.$list = $(`#${gridID}`);
		this.$list.jqGrid({
			autowidth: true,
			height: "auto",
			shrinkToFit: true,
			colNames: colMake.colNames,
			colModel: colMake.colModels,
			url: __ServerURL + "/command/page/inQuery.do",
			postData: GetInQueryPostData("flow", "getFlowList", {
				projectId: this.projectId,
				serverId: "",
				flowId: "",
				groupId: "",
				status: ""
			}),
			loadBeforeSend: function (xhr) {
				xhr.setRequestHeader('Authorization', 'Bearer ' + userKeyArr[1]);
			},
			datatype: "json",
			loadonce: false,
			mtype: "POST",
			rownumbers: false,
			rownumWidth: 40,
			rowNum: 20,
			gridview: true,
			viewrecords: true,
			multiselect: false,
			sortname: "flowName",
			sortorder: "asc",
			//pager: `${this.prefix}grid-pager`,
			jsonReader: {
				repeatitems: false, total: "totalPage", page: "size", root: "rows", records: "totalCount"
				//id: "_id"
			},
			onCellSelect: (rowid, iCol, cellcontent, e) => {
				if (cellcontent.indexOf("<button") > -1) {
					const type = $(cellcontent).attr("data-type");

					if (type === "detail") {
						this.ShowPopup(rowid);
					}
				}
			},
			onSelectRow: (rowid, status, e) => {
			},
			gridComplete: () => {
				if (typeof ($gridBox.attr("data-first")) === "undefined") {
					$gridBox.attr("data-first", "Y");
					SetGridHeight(gridID, gridHeight);
				}
			},
			loadComplete: (data) => {
				if (!Array.isArray(data.userdata)) {
					data.userdata = [];
				}

				this.$list.data("rows", data.userdata);


				commandCustom("/accessHistory/insertLog.do", { action: "READ" })
					.then(({ res, msg }) => {
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

	GetFlowData() { 
		let param = {
			projectId: this.projectId,
			serverId: "",
			flowId: "",
			groupName: "",
			status: ""
		};

		copyObjectValue(param, this.vm.$data);

		this.$list.jqGrid("clearGridData");
		this.$list.jqGrid("setGridParam", {
			url: __ServerURL + "/command/page/inQuery.do",
			postData: GetInQueryPostData("flow", "getFlowList", param),
			datatype: "json",
			page: 1
		}).trigger("reloadGrid");
	},

	ShowPopup(rowid) {
		let param = {};
		let title = "신규 Flow";

		if (rowid != "" && rowid != null) {
			param = this.$list.getRowData(rowid);
			title = "Flow 상세정보";
		}
		param['projectId'] = this.projectId;

		this.popup.View({
			title: title,
			pageURL: "/html/Setup/Popup/FlowDetailPOP.html",
			width: -1,
			height: -1,
			callback: () => {
				this.GetFlowData();
			},
			referFunc: null,
			param: param,
			closeCallBack: (() => {
				this.GetFlowData();
			}),
		});
	},

};
