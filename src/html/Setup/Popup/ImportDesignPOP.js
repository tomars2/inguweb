ImportDesignPOP = {
	vm: null,
	serviceId: null,
	flowDesigner: null,
	engineData: null,

	connectors: null,
	process: null, 
	wholeDesignObj: {},
	inOutInfo: { connectors: [] },
	startEnds: null,

	Init(pageParam) {
		this.engineData = this.getParam("engineData", "");
		this.serviceId = this.getParam("serviceId", "");
		this.SetControl();

		// 검색영역 초기화
		this.SetServerSelectBox();
		this.SetFlowSelectBox();
		this.SetVersionSelectBox();

		this.flowDesigner = new konvaDesigner(/* container id */ this, "flowDesigner");
		this.flowDesigner.engineData = this.engineData;
	},

	SetControl() {
		const oThis = this;

		this.vm = new Vue({
			el: "#" + this.panelID,
			data: () => {
				return {
					serverId: "",
					flowId: "",
					versionId: ""
				}
			},
			methods: {
				btnImport() {
					oThis.Import();
				},
			},
			mounted() { }
		});

		// 팝업에서 레이아웃 다시 잡아주기
		this.reLayout();
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
					this.vm.versionId = "";

					this.SetFlowSelectBox(this.vm.serverId, this.serviceId);
				});
				$selServer.on("select2:clear", (e) => {
					this.vm.serverId = "";
					this.vm.flowId = "";
					this.vm.versionId = "";
					this.SetFlowSelectBox();
					this.SetVersionSelectBox();
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
					this.vm.flowId = e.params.data.id
					this.vm.versionId = "";

					this.SetVersionSelectBox(this.vm.flowId);
				});
				$selFlow.on("select2:clear", (e) => {
					this.vm.flowId = "";
					this.vm.versionId = "";
					this.SetVersionSelectBox();
				});
			})
			.catch((e) => {
				console.error("[{0}] {1}".format("ERROR", "SetFlowSelectBox()"), e);
			});
	},

	/**
	 *  Version 목록 셋팅
	 */
	SetVersionSelectBox(flowId) {
		const $selVersion = $(this.vm.$refs["selVersion"]);
		$selVersion.off();
		let commFlowVersion = new CommListLocal("getVersionByFlow", "commonData", { flowId: flowId });
		commFlowVersion.get($selVersion, true)
			.then(() => {
				$selVersion.select2({
					placeholder: "tempVersion",
					allowClear: true,
					minimumResultsForSearch: Infinity
				});

				$selVersion.val("").trigger("change");
				$selVersion.on("select2:select", (e) => {
					this.vm.versionId = e.params.data.id;

					this.GetFlowDesign();
				});
				$selVersion.on("select2:clear", (e) => {
					this.vm.versionId = "";
				});
			})
			.catch((e) => {
				console.error("[{0}] {1}".format("ERROR", "SetVersionSelectBox()"), e);
			});
	},

	/**
	 * FlowDesign 정보 가져오기
	 */
	GetFlowDesign() {
		const param = {
			flowId: this.vm.flowId,
			versionId: this.vm.versionId,
		};

		commandInQuerySelect(param, "flowDesign", "getFlowDesign")
			.then(({ res, rows, msg }) => {
				if (res) {
					let rowsComponent = null;
					let rowsInOutInfo = null;
					let rowsConnection = [];
					if (this.flowDesigner !== null) {
						this.flowDesigner.Clear();
					}

					this.wholeDesignObj = {};
					this.inOutInfo = { connectors: [] };
					this.connectors = [];
					this.process = [];
					this.startEnds = [];

					if (rows.length === 0) {
						this.flowDesigner.connectors = this.connectors;
						this.flowDesigner.process = this.process;
						return;
					}

					for (let r = 0; r < rows.length; r++) {
						const _raw = JSON.parse(rows[r]._raw);

						if (rows[r].name === "components") {
							rowsComponent = _raw;
							this.wholeDesignObj = rowsComponent;

							if (this.vm.versionId === "") {
								this.vm.deployedVersion = rows[r].deployedVersion;
							}
						}
						else if (rows[r].name === "connections") {
							rowsConnection = _raw;
						}
						else if (rows[r].name === "inOutInfos") {
							rowsInOutInfo = _raw;
						}
					}

					for (let process in rowsComponent) {
						const target = rowsComponent[process];

						if (((target.type).toLowerCase()).indexOf("channel") < 0) {
							this.process.push(target);
						}
					}

					for (let conn of rowsConnection) {
						const row = rowsComponent[conn.channel];

						row.from = conn.from;
						row.to = conn.to;
						row.fromId = rowsComponent[conn.from].id;
						row.toId = rowsComponent[conn.to].id;

						this.connectors.push(row);
					}

					for (let inOut in rowsInOutInfo) {
						// in, out의 위치 및 이름 정보 넘김
						if (inOut !== "connectors") {
							const target = rowsInOutInfo[inOut];
							if (((target.type).toLowerCase()).indexOf("channel") < 0) {
								this.startEnds.push(target);
							}
							this.inOutInfo[target.name] = (target);
						}
						// in, out의 connections 정보 넘김
						else {
							for (let inOutConn of rowsInOutInfo[inOut]) {
								const inOutRow = rowsInOutInfo[inOutConn.channel];

								inOutRow.from = inOutConn.from;
								inOutRow.to = inOutConn.to;
								inOutRow.fromId = rowsInOutInfo[inOutConn.from] === undefined ? rowsComponent[inOutConn.from].id : rowsInOutInfo[inOutConn.from].id;
								inOutRow.toId = rowsInOutInfo[inOutConn.to] === undefined ? rowsComponent[inOutConn.to].id : rowsInOutInfo[inOutConn.to].id;

								this.connectors.push(inOutRow);
							}
						}
					}

					this.flowDesigner.connectors = this.connectors;
					this.flowDesigner.process = this.process;
					this.flowDesigner.startEnds = this.startEnds;
					this.flowDesigner.makeFlows();
				}
				else {
					_ShowErrorAfterLoading("데이터를 가져오지 못했습니다.");
					console.error(msg);
				}
			})
			.catch((err) => {
				if (Object.values(err)[0].toString().includes("konvaDesigner")) {
					console.error("konvaDesigner error!!!");
					this.wholeDesignObj = {};
					this.connectors = new Array();
					this.process = new Array();
				} else {

					_ShowErrorAfterLoading(__ServerNotConnectMSG);
					console.error(err);
				}
			})
			.finally(() => {
				commandCustom("/accessHistory/insertLog.do", { action: "READ" })
					.then(({ res, msg }) => {
						if (!res) {
							console.error("log남기기 실패");
						}
					})
					.catch((err) => {
						console.error("insertLogError");
					});
			});
	},

	Import() {
		/* 데이터 중복 방지 */
		this.connectors = Array.from(new Set(this.connectors));
		this.process = Array.from(new Set(this.process));
		this.startEnds = Array.from(new Set(this.startEnds));

		_ShowConfirm("선택하신 버전의 디자인을 적용 하시겠습니까?", () => {
			if (this.getCallback !== null) {

				/* 중복 제거 */
				if (Array.isArray(this.connectors)) {
					for (const conn of this.connectors) {
						conn.name = `복사_${conn.name}`;
						conn.from = `복사_${conn.from}`;
						conn.to = `복사_${conn.to}`;
					}
				}
				if (Array.isArray(this.process)) {
					this.process.forEach(pro => {
						pro.name = `복사_${pro.name}`;
					});
				}
				if (Array.isArray(this.startEnds)) {
					this.startEnds.forEach(se => {
						se.name = `복사_${se.name}`;
					});
				}
				if (typeof this.wholeDesignObj === 'object' && Object.keys(this.wholeDesignObj).length > 0) {
					for (const key in this.wholeDesignObj) {
						this.wholeDesignObj[`복사_${key}`] = JSON.parse(JSON.stringify(this.wholeDesignObj[key]));

						delete this.wholeDesignObj[key];
					}
				}
				if (typeof this.inOutInfo === 'object' && Object.keys(this.inOutInfo).length > 0) {
					for (const key in this.inOutInfo) {

						if (key === 'connectors') continue;

						this.inOutInfo[`복사_${key}`] = JSON.parse(JSON.stringify(this.inOutInfo[key]));

						delete this.inOutInfo[key];
					}
				}

				this.getCallback(this.connectors, this.process, this.startEnds, this.wholeDesignObj, this.inOutInfo);
			}
			this.Close();
		});
	},

};