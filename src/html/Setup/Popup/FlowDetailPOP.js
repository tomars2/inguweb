FlowDetailPOP = {
	$servers: null,

	Init(pageParam) {
		this.SetControl();
		this.SetSelectBox();
	},

	SetControl() {
		const oThis = this;
 
		this.vm = new Vue({
			el: "#" + this.panelID,
			data: () => {
				return {
					isModify: false,
					flowNm: "",
					flowId: "", 
					description: "",
					groupName: "",
					groupId: "",
					serverId: "",
					serverId2: "",
					gridStyle: { height: "200px" }
				}
			},
			methods: {
				btnSave() {
					oThis.Save('I');
				},
				btnModify() {
					oThis.Save('M');
				},
				btnDelete() {
					oThis.delete();
				},

			},
			mounted() {
				if (oThis.getAllParam.flowId !== undefined) {
					this.isModify = true;
					this.flowNm = oThis.getAllParam.flowName;
					this.description = oThis.getAllParam.description;
					this.groupId = oThis.getAllParam.groupId;
					this.groupName = oThis.getAllParam.groupName;
					this.flowId = oThis.getAllParam.flowId;


					oThis.GridInit();
				}
				else {
					this.gridStyle = { height: "0px" };
				}
			}
		});

		// 팝업에서 레이아웃 다시 잡아주기
		this.reLayout();

	},

	GridInit() {
		let oThis = this;
		const colMake = new GridColMake();
		colMake.setOpt("버전", "version", 80, ColAlign.Center);
		colMake.setOpt("만든사람", "created_by", 100, ColAlign.Center);
		colMake.setOpt("만든 날짜", "createdTime", 100, ColAlign.Center);
		colMake.setOpt("삭제", "", 80, ColAlign.Center, {
			formatter: (c, o, r) => {
				if (r.deployed === '') {
					return `<button type="button" class="list-style" data-type="delete">삭제</button>`;
				}
				else {
					return "";
				}
			}
		});
		colMake.setOpt("Deploy", "deployed", 80, ColAlign.Center, {
			formatter: (c, o, r) => {
				if (c === '') {
					return `<button type="button" class="list-style" data-type="deploy">Deploy</button>`;
				}
				else {
					return "";
				}
			}
		});
		colMake.setHidden("versionId");

		const $gridBox = $(`#${this.prefix}grid-box`);
		const gridHeight = $gridBox.height();
		const gridID = `${this.prefix}grid`;

		this.$list = $(`#${gridID}`);
		this.$list.jqGrid({
			autowidth: true,
			height: "125px",
			shrinkToFit: true,
			colNames: colMake.colNames,
			colModel: colMake.colModels,
			url: __ServerURL + "/command/page/inQuery.do",
			postData: GetInQueryPostData("flow", "getFlowVersions", {
				flowId: this.getAllParam.flowId
			}),
			datatype: "json",
			loadonce: true,
			mtype: "POST",
			rownumbers: false,
			rownumWidth: 40,
			rowNum: 5,
			gridview: true,
			viewrecords: true,
			multiselect: false,
			sortname: "version",
			sortorder: "asc",
			pager: `${this.prefix}grid-pager`,
			jsonReader: {
				repeatitems: false,
				id: "_id"
			},
			loadBeforeSend: function (xhr) {
				xhr.setRequestHeader('Authorization', 'Bearer ' + userKeyArr[1]);
			},
			onCellSelect: (rowid, iCol, cellcontent, e) => {
				if (cellcontent.indexOf("<button") > -1) {
					const type = $(cellcontent).attr("data-type");

					if (type === "delete") {
						this.DeleteVersion(rowid);
					}
					else if (type === "deploy") {
						this.PushDeploy(rowid);
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

	GetVersionData() {
		let param = {
			flowId: this.getAllParam.flowId
		};

		this.$list.jqGrid("clearGridData");
		this.$list.jqGrid("setGridParam", {
			url: __ServerURL + "/command/select/inQuery.do",
			postData: GetInQueryPostData("flow", "getFlowVersions", param),
			datatype: "json",
			page: 1
		}).trigger("reloadGrid");
	},

	SetSelectBox() {
		const $selServer = $(this.vm.$refs["selPrimaryServer"]);
		$selServer.off();

		commServerSelectBox.get($selServer, true)
			.then(() => {
				$selServer.select2({
					placeholder: "전체",
					allowClear: true,
					minimumResultsForSearch: Infinity
				});

				$selServer.val("").trigger("change");
				$selServer.on("select2:select", (e) => {
					this.vm.serverId = e.params.data.id;
					this.getAllParam.secondaryId = "";
					this.vm.serverId2 = "";

					this.SetSelectBox2(e.params.data.id);
				});

				$selServer.on("select2:clear", (e) => {
					this.vm.serverId = "";
					$(this.vm.$refs["sel2ndServer"]).val(null).trigger('change');
					this.vm.serverId2 = "";
				});


				if (this.getAllParam.flowId !== undefined) {
					this.vm.serverId = this.getAllParam.primaryId;
					$(this.vm.$refs["selPrimaryServer"]).val(this.vm.serverId).trigger("change");

					this.SetSelectBox2(this.vm.serverId);
				}
			})
			.catch((e) => {
				console.error("[{0}] {1}".format("ERROR", "SetSelServer()"), e);
			});
	},

	SetSelectBox2(e) {
		let serverList = new CommListLocal("getCommAllServer", "commonData", { id: e });
		const $selServer2 = $(this.vm.$refs["sel2ndServer"]);
		$selServer2.off();

		serverList.get($selServer2, true)
			.then(() => {
				$selServer2.select2({
					placeholder: "전체",
					allowClear: true,
					minimumResultsForSearch: Infinity
				});

				$selServer2.val("").trigger("change");
				$selServer2.on("select2:select", (e) => {
					this.vm.serverId2 = e.params.data.id;
				});

				$selServer2.on("select2:clear", (e) => {
					this.vm.serverId2 = "";
				});

				if (this.getAllParam.flowId !== undefined) {
					this.vm.serverId2 = this.getAllParam.secondaryId;
					$(this.vm.$refs["sel2ndServer"]).val(this.vm.serverId2).trigger("change");
				}

			})
			.catch((e) => {
				console.error("[{0}] {1}".format("ERROR", "SetSelServer2()"), e);
			});
	},

	CheckValidation() {
		if (this.vm.flowNm == "") {
			_ShowError("Flow 명을 입력해주세요.");
			return false;
		}

		if (this.vm.serverId == "") {
			_ShowError("Primary Server 명을 선택해주세요.");
			return false;
		}

		if (this.vm.serverId2 == "") {
			_ShowError("Secondary Server 명을 선택해주세요.");
			return false;
		}

		if (this.vm.groupId === '0') {
			_ShowError("groupId에 '0'을 제외한 값을 입력해주세요.");
			return false;
		}

		return true;
	},

	Save(flag) {
		if (!this.CheckValidation()) {
			return;
		}

		let param = {
			name: this.vm.flowNm,
			description: this.vm.description,
			flowId: this.vm.flowId,
			groupId: this.vm.groupId,
			groupName: this.vm.groupName,
			serverIdStr: this.vm.serverId,
			server2IdStr: this.vm.serverId2,
			projectId: this.getAllParam.projectId
		};

		let url = "/project/insertFlow.do";
		let mode = "저장";
		let action = "WRITE";
		if (flag === "M") {
			url = "/project/updateFlow.do";
			mode = "수정";
			action = "UPDATE";
		}

		_ShowConfirm(`${mode}하시겠습니까?`, () => {
			commandCustom(url, JSON.stringify(param))
				.then((data) => {
					const { res: res, msg: msg } = data;

					if (res) {
						_ShowSuccessAfterLoading(`${mode} 했습니다.`, () => {
							if (this.getCallback !== null) {
								this.getCallback();
							}
							this.Close();
						});
					} else {
						_ShowErrorAfterLoading(msg);
						return;
					}
				})
				.catch((error) => {
					_ShowErrorAfterLoading(__ServerNotConnectMSG);
					console.error(error);
				})
				.finally(() => {
					commandCustom("/accessHistory/insertLog.do", { action: action })
						.then(({ res, msg }) => {
							if (!res) {
								console.error("log남기기 실패");
							}
						})
						.catch((err) => {
							console.error("insertLogError");
						});
				});
		});
	},

	delete() {
		let param = {
			flowId: this.getAllParam.flowId
		};

		_ShowConfirm("flow를 삭제 하시겠습니까?", () => {
			commandCustom("/project/deleteFlow.do", JSON.stringify(param))
				.then((data) => {
					const { res: res, msg: msg } = data;

					if (res) {
						_ShowSuccessAfterLoading("삭제 했습니다.", () => {
							if (this.getCallback !== null) {
								this.getCallback();
							}
							this.Close();
						});
					} else {
						_ShowErrorAfterLoading(msg);
						return;
					}
				})
				.catch(function (error) {
					_ShowErrorAfterLoading(__ServerNotConnectMSG);
					console.error(error);
				})
				.finally(() => {
					commandCustom("/accessHistory/insertLog.do", { action: "DELETE" })
						.then(({ res, msg }) => {
							if (!res) {
								console.error("log남기기 실패");
							}
						})
						.catch((err) => {
							console.error("insertLogError");
						});
				});
		});
	},

	/**
	 * Flow Version 삭제
	 */
	DeleteVersion(rowId) {
		const rowData = this.$list.jqGrid("getRowData", rowId);
		const param = {
			version: rowData.versionId,
			flowId: this.vm.flowId
		};

		_ShowConfirm("version을 삭제하시겠습니까?", () => {
			commandCustom("/project/deleteFlowVersion.do", JSON.stringify(param))
				.then(({ res, msg }) => {
					if (res) {
						_ShowSuccessAfterLoading("버전을 삭제했습니다.", () => {
							this.GetVersionData();
						});
					}
					else {
						_ShowErrorAfterLoading(msg);
					}
				})
				.catch((err) => {
					_ShowErrorAfterLoading(__ServerNotConnectMSG);
					console.error(err);
				})
				.finally(() => {
					commandCustom("/accessHistory/insertLog.do", { action: "DELETE" })
						.then(({ res, msg }) => {
							if (!res) {
								console.error("log남기기 실패");
							}
						})
						.catch((err) => {
							console.error("insertLogError");
						});
				});
		});
	},

	/**
	 * Deploy 설정
	 * @constructor
	 */
	PushDeploy(rowId) {
		const rowData = this.$list.jqGrid("getRowData", rowId);
		const param = {
			version: rowData.versionId,
			flowId: this.getAllParam.flowId
		};

		_ShowConfirm("Deploy version을 변경하시겠습니까?", () => {
			commandCustom("/project/changeDeploy.do", JSON.stringify(param))
				.then(({ res, msg }) => {
					if (res) {
						_ShowSuccessAfterLoading("변경했습니다.", () => {
							this.GetVersionData();
						});
					}
					else {
						_ShowErrorAfterLoading(msg);
					}
				})
				.catch((err) => {
					_ShowErrorAfterLoading(__ServerNotConnectMSG);
					console.error(err);
				})
				.finally(() => {
					commandCustom("/accessHistory/insertLog.do", { action: "UPDATE" })
						.then(({ res, msg }) => {
							if (!res) {
								console.error("log남기기 실패");
							}
						})
						.catch((err) => {
							console.error("insertLogError");
						});
				});
		});
	},
};