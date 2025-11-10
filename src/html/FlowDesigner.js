/**
 * 수정본(flow_element table에 사용하지 않는 데이터가 너무 많이 쌓여서 사용하는 데이터만 저장하는 로직으로 수정)
 */
FlowDesigner = {
	vm: null,

	// 가운데 디자이너 영역
	flowDesigner	: null,
 
	// Data
	connectors		: null,
	process			: null,

	// 검색영역
	$sbService      : null, // Service명
	$sbFlow          : null, // Flow명

	componentArr    : [],
	wholeDesignObj  : {},
	engineInfo      : [],
	engineData      : {},
	beforeConnectInOut: {}, // 선이 연결되지 않은 In, Out 정보가 잠시 보관되는 곳
	inOutInfo: {connectors: []},
	requiredArray: [],   //properties의 필수 값 배열

	Init() {
		this.SetControl();		// vue 초기화
		this.GetProcessIcon();  // icon 세팅

		// 검색영역 초기화
		this.SetServerSelectBox();
		this.SetFlowSelectBox();
		this.SetVersionSelectBox();

		this.flowDesigner = new konvaDesigner(/* container id */ this, "flowDesigner");
		this.SetEventBind(); // 이벤트 등록
	},

	OnResume() {
	},

	OnDisappear() {
	},

	SetEventBind() {
	},

	SetControl() {
		const oThis = this;

		this.vm = new Vue({
			el: "#" + this.panelID,
			data() {
				return {
					propTabIndex: 0		// property 탭 선택
					, serviceId	: Global.projectId	// 검색영역 - Service
					, serverId  : ""    // 검색영역 - Server
					, flowId	: ""	// 검색영역 - Flow
					, versionId	: ""	// 검색영역 - Version
					, deployedVersion: "" // 검색영역 - Deployed

					, existProperties   : true
					, processName       : ""    // 설정창에 표시할 프로세스명
					, componentArr		: oThis.componentArr
					, engineProcess     : []
					, componentDetailArr: []
					, propertiesArr     : []
					, propertiesGroupArr: []
				};
			},
			methods: {
				// 버튼 - 검색
				btnSearch() {
					oThis.GetFlowDesign();
				},
				// 버튼 - 신규
				btnClear() {
					_ShowConfirm("기존 정보가 없어집니다.\n새로운 Flow Design을 만드시겠습니까?", () => {
						oThis.flowDesigner.Clear(); // 기존 Layer 정보를 지움
						oThis.wholeDesignObj = {};
						oThis.connectors = [];
						oThis.process = [];
						_ShowSuccessAfterLoading("새로운 Flow Design을 만드실 수 있습니다.");
					});
				},
				// 버튼 - 저장
				btnSave() {
					if (Object.keys(oThis.wholeDesignObj).length === 0) {
						_ShowWarning("저장할 내용이 없습니다.");
						return;
					}
					if (oThis.CheckValidation()) {
						_ShowConfirm("Flow를 저장하시겠습니까?", () => {
							oThis.FlowSave(null);
						});
					}
				},
				// 버튼 - 버전생성
				btnAddVersion() {
					oThis.MakeNewVersion();
				},
				// 버튼 - 불러오기
				btnGetFlowDesign() {
					oThis.GetAllDesign();
				},
				// 버튼 - 매핑테이블
				btnAddMappingTable() {
					oThis.AddMapping();
				},
				// property 탭 선택
				togglePropTab(index) {
					this.propTabIndex = index;
				},
				setProperties(e, info) { // dragstart
					if (this.flowId === "") return _ShowWarning("데이터를 조회해주세요.");

					if (typeof (info) === "object") {
						oThis.flowDesigner.icDropProc = info.label;
					}
					else {
						oThis.flowDesigner.icDropProc = info;
					}
				},
				changeProperties(processName, mainKey, subKey, subValue) {
					// console.log("mainKey: ", mainKey, ", subKey: ", subKey);
					let infoArr = oThis.wholeDesignObj;
					if (!Object.keys(oThis.wholeDesignObj).includes(processName)) {
						infoArr = oThis.inOutInfo;
					}

					if (mainKey === "") {
						infoArr[processName]["properties"][subKey] = subValue;
					}
					// TODO 현재 properties중에 배열 없어서 고려 안함...
					// else if (mainKey.includes("columns")) {
					// 	let columnIndex = 0;
					// 	if (mainKey.length > 7) {
					// 		columnIndex = mainKey.substring(7);
					// 	}
					// 	oThis.wholeDesignObj[processName]["properties"]["columns"][columnIndex][subKey] = subValue;
					// }
					else {
						infoArr[processName]["properties"][mainKey][subKey] = subValue;
					}
				},
				changeBasicInfo(processName, itemKey, itemValue, itemId) {
					//connectors 정보 변경
					let changedConnection = false;
					for (const [key, connector] of Object.entries(oThis.flowDesigner.connectors)) {

						if (connector.id === itemId) {
							oThis.flowDesigner.connectors[key]["name"] = itemValue;
							changedConnection = true;
						}
					}

					let infoArr = oThis.wholeDesignObj;

					if (!Object.keys(oThis.wholeDesignObj).includes(processName)) {
						infoArr = oThis.inOutInfo;
					}

					infoArr[processName][itemKey] = itemValue;

					if (itemKey === "name") {
						if (itemValue.trim() === "") {
							_ShowWarning("process이름은 공백일 수 없습니다.");
							return;
						}

						infoArr[itemValue] = infoArr[processName];
						delete infoArr[processName];
						this.processName = itemValue.trim();

						// process 정보 변경
						if (!changedConnection) {
							const findOne = oThis.flowDesigner.findById(`GROUP_${itemId}`);
							const {children} = findOne;

							for (const child of children) {
								const className = child.className.toUpperCase();
								if (className === "TEXT") {
									child.text(itemValue);
									break;
								}
							}
						}
					}
				},
			}
		});

		this.$sbService	= $(this.vm.$refs["selService"]);
		this.$sbFlow 	= $(this.vm.$refs["selFlow"]);
	},

	/**
	 * TODO Drag&Drop 으로 생성 후 리턴 됨
	 * process 및 화살표 생성시 저장할때 필요한 data 추가
	 * @param type
	 * @param typeInfo
	 */
	makeNodes(type, typeInfo) {
		// process 생성시
		if (type === "process") {
			// engine에서 process type, properties 가져오기
			let processType = "";
			let properties = [];

			for (const [key, value] of Object.entries(this.engineData)) {
console.log(typeInfo.type.toUpperCase());
console.log(value.label);
				if (value.label === typeInfo.type.toUpperCase()) {
					processType = key;
					properties = value.properties;
				}
			}

			// save param에 넘겨줄 데이터 생성
			this.wholeDesignObj[typeInfo.name] = {
				id: typeInfo.id,
				name: typeInfo.name,
				type: processType,
				window: {x: typeInfo.window.x, y: typeInfo.window.y},
				properties: {}
			};

			if (Object.keys(properties).length > 0) {
				for (const key in properties) {

					// Default값이 있으면 값 넣어주고 없으면 ""
					let defaultVal = "";
					if ("defaultValue" in properties[key]) {
						defaultVal = properties[key].defaultValue;
						if (properties[key].type === "string") defaultVal = defaultVal.replace(/\n/g, '\\n');
						else if (properties[key].type === "int") defaultVal = Number(defaultVal.replace(/\n/g, '\\n'));
					}

					this.wholeDesignObj[typeInfo.name]["properties"][key] = defaultVal.includes('{')? JSON.parse(defaultVal) : defaultVal;

				}
			}

			this.SetClickEvent();
		}
		// 화살표 생성시
		else if (type === "connector") {
			// properties data 정렬
			let properties = [];

			for (const [key, value] of Object.entries(this.engineData)) {
				if (key === "MskChannel" || key === "KafkaChannel") {
					properties = value.properties;
				}
			}
			const propertiesKeys = Object.keys(properties);

			// in, out에 연결된 connection이 아닐때만!
			if (typeInfo.from.substring(0, 2) !== "S_" && typeInfo.from.substring(0, 2) !== "E_" && typeInfo.to.substring(0, 2) !== "S_" && typeInfo.to.substring(0, 2) !== "E_") {
				this.wholeDesignObj[typeInfo.name] = {
					//type: "MskChannel",
					type: "KafkaChannel",
					properties: {},
					id: typeInfo.id,
					name: typeInfo.name
				};

				if (propertiesKeys.length > 0) {
					for (const key in properties) {

						// Default값이 있으면 값 넣기, 없으면 ""
						let defaultVal = "";
						if ("defaultValue" in properties[key]) {
							defaultVal = properties[key].defaultValue;
							if (properties[key].type === "string") defaultVal = defaultVal.replace(/\n/g, '\\n');
						}

						this.wholeDesignObj[typeInfo.name]["properties"][key] = defaultVal.includes('{')? JSON.parse(defaultVal) : defaultVal;
					}
				}
			}

			// In에 connector 연결시 connections 정보에 in, out에 대한 properties 추가
			if (typeInfo.from.substring(0,2) === "S_" || typeInfo.from.substring(0,2) === "E_") {
				for (const [inOutId, inOutInfo] of Object.entries(this.beforeConnectInOut)) {

					if (typeInfo.fromId === inOutId) {
						inOutInfo.name = typeInfo.from;
						this.inOutInfo[typeInfo.from] = inOutInfo;
						this.inOutInfo[typeInfo.name] = {
							//type: "MskChannel",
							type: "KafkaChannel",
							properties: {},
							id: typeInfo.id,
							name: typeInfo.name
						};
					}
				}

				if (propertiesKeys.length > 0) {
					for (const key in properties) {

						// Default값이 있으면 값 넣기, 없으면 ""
						let defaultVal = "";
						if ("defaultValue" in properties[key]) {
							defaultVal = properties[key].defaultValue;
							if (properties[key].type === "string") defaultVal = defaultVal.replace(/\n/g, '\\n');
						}

						this.inOutInfo[typeInfo.name]["properties"][key] = defaultVal.includes('{')? JSON.parse(defaultVal) : defaultVal;
					}
				}
			}
			// Out에 connector 연결 시 connections 정보에 in, out에 대한 properties 추가
			else if (typeInfo.to.substring(0, 2) === "S_" || typeInfo.to.substring(0, 2) === "E_") {
				for (const [inOutId, inOutInfo] of Object.entries(this.beforeConnectInOut)) {
					if (typeInfo.toId === inOutId) {
						inOutInfo.name = typeInfo.to;
						this.inOutInfo[typeInfo.to] = inOutInfo;
						this.inOutInfo[typeInfo.name] = {
							//type: "MskChannel",
							type: "KafkaChannel",
							properties: {},
							id: typeInfo.id,
							name: typeInfo.name
						};
					}
				}

				if (propertiesKeys.length > 0) {
					for (const key in properties) {

						// Default값이 있으면 값 넣기, 없으면 ""
						let defaultVal = "";
						if ("defaultValue" in properties[key]) {
							defaultVal = properties[key].defaultValue;
							if (properties[key].type === "string") defaultVal = defaultVal.replace(/\n/g, '\\n');
						}

						this.inOutInfo[typeInfo.name]["properties"][key] = defaultVal.includes('{')? JSON.parse(defaultVal) : defaultVal;
					}
				}
			}

			this.SetArrowClickEvent();
		}
		// In, Out 생성시
		else if(type === "INOUT") {
			this.beforeConnectInOut[typeInfo.id] = {
				id: typeInfo.id,
				name: "",
				type: typeInfo.type,
				window: typeInfo.window,
				properties: {}
			};

			this.SetClickEvent();
		}
	},

	/**
	 * TODO node선택 후 삭제 시 호출 됨
	 * @param delNodes
	 */
	deleteNodes(delNodes) {
		for (const nodeName of delNodes) {
			delete this.wholeDesignObj[nodeName];
			delete this.inOutInfo[nodeName];
		}
	},

	/**
	 * TODO Flow 정보를 가져와서 그려준다.
	 */
	GetFlowDesign() {
		if (this.vm.serverId === "") {
			_ShowWarning("서버명을 선택해주세요.");
			return;
		}
		if (this.vm.flowId === "") {
			_ShowWarning("Flow명을 선택해주세요.");
			return;
		}

		const param = {
			projectId : this.vm.serviceId
			, flowId    : this.vm.flowId
			, versionId : this.vm.versionId
		};

		this.vm.componentDetailArr = [];
		this.vm.propertiesGroupArr = [];

		commandInQuerySelect(param, "flowDesign", "getFlowDesign")
			.then(({res, rows, msg}) => {
				if (res) {
					let rowsComponent = null;
					let rowsInOutInfo = null;
					let rowsConnection = [];

					this.flowDesigner.Clear(); // 기존 Layer 정보를 지움
					this.wholeDesignObj = {};
					this.inOutInfo = {connectors: []};
					this.connectors = [];
					this.process = [];
					const startEnds = [];

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

							for (const processName in rowsComponent) {
								this.componentArr.push([processName, rowsComponent[processName]])
							}

							if (this.vm.versionId === "") {
								this.vm.deployedVersion = rows[r].deployedVersion;
							}
						} else if (rows[r].name === "connections") {
							rowsConnection = _raw;
						} else if (rows[r].name === "inOutInfos") {
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
								startEnds.push(target);
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
					this.flowDesigner.startEnds = startEnds;
					this.flowDesigner.makeFlows();

					this.SetClickEvent();
					this.SetArrowClickEvent();
				} else {
					_ShowErrorAfterLoading("데이터를 가져오지 못했습니다.");
					console.error(msg);
				}
			})
			.catch((err) => {
				if (Object.values(err)[0].toString().includes("konvaDesigner")) {
					console.error("konvaDesigner error!!!");
					this.flowDesigner.Clear(); // 기존 Layer 정보를 지움
					this.wholeDesignObj = {};
					this.connectors = [];
					this.process = [];
				} else {
					_ShowErrorAfterLoading(__ServerNotConnectMSG);
					console.error(err);
				}
			})
			.finally(() => {
				commandCustom("/accessHistory/insertLog.do", { action: "READ" })
					.then(({res, msg}) => {
						if (!res) {
							console.error("log남기기 실패");
						}
					})
					.catch((err) => {
						console.error("insertLogError");
					});
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
					this.vm.versionId = "";
console.log(this.vm);
					this.SetFlowSelectBox(this.vm.serverId, this.vm.serviceId);
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
		let commProcessFlow = new CommListLocal("getFlowByServer", "commonData", {serverId: serverId, projectId: projectId});
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
console.log(this.vm.flowId);
					this.SetVersionSelectBox(this.vm.flowId);
					this.GetFlowDesign();
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
		let commFlowVersion = new CommListLocal("getVersionByFlow", "commonData", {flowId: flowId});
	
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
	 * processIcon setting
	 */
	GetProcessIcon() {
		commandCustom("/system/component", {}, "json", "GET")
			.then((data) => {
console.log(data);
				if (Object.keys(data).length > 0) {
					this.engineData = data;
					// console.log("engineData: ", this.engineData);

					for (const [key, value] of Object.entries(data)) {
						// asis에 안나오는거 제거
						if (key === "MskChannel" || key === "DefaultMessageStore" || key === "KafkaChannel") {
							continue;
						}
						this.vm.engineProcess.push(value);
					}
					// console.log("engineProcess: ", this.vm.engineProcess);
					this.flowDesigner.engineData = this.engineData;
				}
				else {
					_ShowError("process icon 정보를 가져오지 못했습니다.");
				}
			})
			.catch((err) => {
				_ShowErrorAfterLoading(__ServerNotConnectMSG);
				console.error(err);
			});
	},

	/**
	 * process의 이름, 속성 등 정보 출력(오른쪽 사이드)
	 */
	ShowProcessInfo(processName, processType) {
		this.vm.processName = processName;

		let infoArr = this.wholeDesignObj;
		if (!Object.keys(this.wholeDesignObj).includes(processName)) {
			infoArr = this.inOutInfo;
		}

		const objValue = infoArr[processName];

		//name, type만 기본, 나머지는 설정(window는 안보이게)
		//설정값 세팅
		this.MakeShowProperties(processType, objValue);

		//기본값 세팅
		for (let detailValue in objValue) {
			if (detailValue === "name" || detailValue === "type") {
				this.vm.componentDetailArr.push({
					id: objValue["id"],
					key: detailValue,
					value: objValue[detailValue]
				});
			}
		}
	},

	/**
	 * 설정값 setting
	 */
	MakeShowProperties(processType, objValue) {
		console.log(processType);
		console.log(objValue);
		const propertyFromEngine = this.engineData[processType]["properties"];
		const currProperties = objValue["properties"];
		let propertiesIndex = 0;

		if (Object.keys(propertyFromEngine).length === 0) {
			this.vm.existProperties = false;
		} else {
			for (const [key, value] of Object.entries(propertyFromEngine)) {
				let propertiesGroupName = "";
				const subKeys = Object.keys(value);

				if (subKeys.toString().includes("properties")) {
					propertiesGroupName = key;
				}

				this.vm.propertiesGroupArr.push({
					groupName: propertiesGroupName,
					valuesArr: []
				});

				this.MakeValueArr(key, value, propertiesIndex, currProperties);
				propertiesIndex++;
			}
		}
	},

	/**
	 * engine에서 properties의 각 value 속성 가져오기
	 */
	MakeValueArr(subKey, subProperties, propertiesIndex, currProperties) {

		if (this.vm.$refs.table !== undefined && $(this.vm.$refs.table).length > 0) {
			$(this.vm.$refs.table).find('.select2').remove();
		}

		// 필수 여부 세팅
		let requiredInfo = false;
		if (Object.keys(subProperties).toString().includes("required")) {
			requiredInfo = subProperties["required"];
			if (!this.requiredArray.includes(subKey)) {
				this.requiredArray.push(subKey);
			}
			// console.log("subKey: ", subKey, ", subProperties: ", subProperties, ", propertiesIndex: ", propertiesIndex, ", currProperties: ", currProperties);
		}

		if (Object.keys(subProperties).toString().includes("properties")) {
			for (const [key, value] of Object.entries(subProperties.properties)) {
				this.MakeValueArr(key, value, propertiesIndex, currProperties[subKey]);
			}
		}
		else {
			let processType = subProperties["type"];
			let inputType = "text";

			if (subProperties.type === "integer") {
				inputType = "number";
			}

			this.vm.propertiesGroupArr[propertiesIndex]["valuesArr"].push({
				subKey: subKey,
				defaultValue: currProperties[subKey],
				required: requiredInfo,
				type: processType,
				inputType: inputType
			});
		}

/*
		if (subkey === "mapTable") {
			this.vm.$nextTick(() => {
				const $selBpid = $(this.vm.$refs["selBpid"]);

				$selBpid.off();

				commBpidSelectBox.get($selBpid, false)
					.then(() => {
						$selBpid.select2({
							placeholder: "전체",
							allowClear: true
						});

						$selBpid.val(currProperties[subKey]).trigger("change");
						$selBpid.on("select2:select", (e) => {
							// this.vm.bpId = e.params.data.id;
							let infoArr = this.wholeDesignObj;
							if (!Object.keys(this.wholeDesignObj).includes(this.vm.processName)) {
								infoArr = this.inOutInfo;
							}
							infoArr[this.vm.processName]["properties"]["mapTable"] = e.params.data.id;
						});
						$selBpid.on("select2:clear", (e) => {
							let infoArr = this.wholeDesignObj;
							if (!Object.keys(this.wholeDesignObj).includes(this.vm.processName)) {
								infoArr = this.inOutInfo;
							}
							infoArr[this.vm.processName]["properties"]["mapTable"] = "";
						});
					})
					.catch((e) => {
						console.error("[{0}] {1}".format("ERROR", "SetBpidSelectBox()"), e);
					});
			});
		}*/
		//BPID selectBox
		/*
		if (subKey === "bpid") {
			this.vm.$nextTick(() => {
				const $selBpid = $(this.vm.$refs["selBpid"]);

				$selBpid.off();

				commBpidSelectBox.get($selBpid, false)
					.then(() => {
						$selBpid.select2({
							placeholder: "전체",
							allowClear: true
						});

						$selBpid.val(currProperties[subKey]).trigger("change");
						$selBpid.on("select2:select", (e) => {
							// this.vm.bpId = e.params.data.id;
							let infoArr = this.wholeDesignObj;
							if (!Object.keys(this.wholeDesignObj).includes(this.vm.processName)) {
								infoArr = this.inOutInfo;
							}
							infoArr[this.vm.processName]["properties"]["bpid"] = e.params.data.id;
						});
						$selBpid.on("select2:clear", (e) => {
							let infoArr = this.wholeDesignObj;
							if (!Object.keys(this.wholeDesignObj).includes(this.vm.processName)) {
								infoArr = this.inOutInfo;
							}
							infoArr[this.vm.processName]["properties"]["bpid"] = "";
						});
					})
					.catch((e) => {
						console.error("[{0}] {1}".format("ERROR", "SetBpidSelectBox()"), e);
					});
			});
		}

		if (subKey === "queueId") {
			this.vm.$nextTick(() => {
				const $selTopicLag = $(this.vm.$refs["selTopicLag"]);
				$selTopicLag.off();

				commTopicLagSelectBox.get($selTopicLag, false)
					.then(() => {
						$selTopicLag.select2({
							placeholder: "전체",
							allowClear: true
						});

						$selTopicLag.val(currProperties[subKey]).trigger("change");
						$selTopicLag.on("select2:select", (e) => {
							// this.vm.bpId = e.params.data.id;
							let infoArr = this.wholeDesignObj;
							if (!Object.keys(this.wholeDesignObj).includes(this.vm.processName)) {
								infoArr = this.inOutInfo;
							}

							infoArr[this.vm.processName]["properties"]["queueId"] = e.params.data.id;
						});
						$selTopicLag.on("select2:clear", (e) => {
							let infoArr = this.wholeDesignObj;
							if (!Object.keys(this.wholeDesignObj).includes(this.vm.processName)) {
								infoArr = this.inOutInfo;
							}
							infoArr[this.vm.processName]["properties"]["queueId"] = "";
						});
					})
					.catch((e) => {
						console.error("[{0}] {1}".format("ERROR", "SetTopicLagSelectBox()"), e);
					});
			});
		}
		*/

	},

	/**
	 * 프로세스 정보를 가져오는 함수
	 * @param target : Object
	 * @param e : Object
	 * @return Object {processId : String , children : Array, processName : String}
	 */
	GetProcessInfo(target, e) {
		const {children} = target;
		const id = target.id();
		let processName = "";

		for (const child of children) {
			if (child.getType().toUpperCase() === "SHAPE") {
				const {text} = child.attrs;

				if (text !== undefined) {
					processName = child.getText();
					break;
				}
			}
		}

		return {
			processId: id,
			children: children,
			processName: processName,
		};

	},

	/**
	 * 필수값 빠진부분 없는지 체크
	 */
	CheckValidation() {
		// 각 process 필수 값 입력 여부 확인
		for (const [processKey, processValue] of Object.entries(this.wholeDesignObj)) {
			for (const property of Object.keys(processValue["properties"])) {
				const engineProperty = this.engineData[processValue.type]["properties"][property];
				if (engineProperty.type !== "object") { // instance제외 모든 properties가 들어오는 곳
					if (Object.keys(engineProperty).includes("required")) {
						if (processValue["properties"][property].toString().trim() === "") {
							_ShowErrorAfterLoading(`${processKey}의 ${property}값을 입력해주세요.`);
							return false;
						}
					}
				}
				else { // instance, min, count가 들어옴..
					for (const subProperty of Object.keys(engineProperty["properties"])) {
						if (Object.keys(engineProperty["properties"][subProperty]).includes("required")) {
							if (processValue["properties"][property][subProperty].toString().trim() === "") {
								_ShowErrorAfterLoading(`${processKey}의 ${property}값을 입력해주세요.`);
								return false;
							}
						}
					}
				}
			}
		}

		// 연결 선 필수값 입력여부 확인
		for (const connectInfo of this.flowDesigner.connectors) {
			for (const property in connectInfo.properties) {
				const engineProperty = this.engineData[connectInfo.type]["properties"][property];
				if (Object.keys(engineProperty).includes("required")) {
					if (connectInfo["properties"][property] === "") {
						_ShowErrorAfterLoading(`${connectInfo.name}의 ${property}값을 입력해주세요.`);
						return false;
					}
				}
			}
		}

		return true;
	},

	/**
	 * 저장 param만들기
	 */
	MakeSaveParam() {
		// connector 정보 필요한 것만 정렬 및 in, out에 연결된 connection 제거
		const connections = [];
		const inOutNameArr = [];
		const connectorsArr = this.flowDesigner.connectors;
		for (const inOut of Object.values(this.inOutInfo)) {
			inOutNameArr.push(inOut.name);
		}

		for (let i = 0; i < connectorsArr.length; i++) {
			if (inOutNameArr.includes(connectorsArr[i].from) || inOutNameArr.includes(connectorsArr[i].to)) {
				this.inOutInfo.connectors.push({
					from: connectorsArr[i].from,
					to: connectorsArr[i].to,
					channel: connectorsArr[i].name
				});
			}
			else {
				connections.push({
					fromId: connectorsArr[i].fromId,
					toId: connectorsArr[i].toId,
					from: connectorsArr[i].from,
					to: connectorsArr[i].to,
					channel: connectorsArr[i].name
				});
			}

		}

		// 전체 component 중 connection정보 필요한 부분만 저장하도록 정렬 수정
		const wholeFlow = {};
		for (let key in this.wholeDesignObj) {
			const processInfo = this.wholeDesignObj[key];

			if (processInfo.type.includes("Channel")) {
				wholeFlow[processInfo.name] = {
					id: processInfo.id,
					name: processInfo.name,
					properties: processInfo.properties,
					type: processInfo.type,
					// __type: "channel"
				};
			}
			else {
				// processInfo.__type = "process";
				wholeFlow[processInfo.name] = processInfo;
			}
		}

		// tParameter 저장 위한 data가공  -- properties 가공
		const processes = [];

		for (let key in this.wholeDesignObj) {
			const processInfo = this.wholeDesignObj[key];

			if (!processInfo.type.includes("Channel")) {
				processes.push({
					processor: processInfo.name,
					type: processInfo.type,
					parameter: processInfo.properties,
				});
			}
		}

		connections.forEach(conn => {
			const {channel, fromId, toId} = conn;

			for (const key in wholeFlow) {
				const item = wholeFlow[key];
				const itemId = item.id;
				const itemName = item.name;
				const itemType = item.type;

				if (item !== "MskChannel" || item !== "KafkaChannel") {
					if (fromId === itemId) {
						conn.from = itemName;
					} else if (toId === itemId) {
						conn.to = itemName;
					}
				}
			}

			delete conn.fromId;
			delete conn.toId;
		});

		return {
			projectId: this.vm.serviceId,
			flowId: this.vm.flowId,
			componentsStr: JSON.stringify(wholeFlow),
			connectionsStr: JSON.stringify(connections),
			inOutInfoStr: JSON.stringify(this.inOutInfo),
			inOutConnectionsStr: JSON.stringify(this.inOutInfo.connectors),
			versionId: this.vm.versionId,
			//tParam parameter
			processesStr: JSON.stringify(processes),
			flag: "N",
			version: ""
		};
	},

	/**
	 * 저장 t_parameter table용 param만들기
	 */
	MakeSaveTParam() {
		const processes = [];

		for (let key in this.wholeDesignObj) {
			const processInfo = this.wholeDesignObj[key];

			if (!processInfo.type.includes("Channel")) {
				processes.push({
					processor: processInfo.name,
					type: processInfo.type,
					bpid: processInfo.properties.bpid,
					parameter: processInfo.properties.parameter,
					runOnStart: processInfo.properties.runOnStart,
					maxInstance: processInfo.properties.instance.count,
					minInstance: processInfo.properties.instance.min
				});
			}
		}

		const param = {
			flowId: this.vm.flowId, //flow랑 동일
			projectId: this.vm.serviceId, //flow랑 동일
			processesStr: JSON.stringify(processes),
			flag: "N",
			version: ""
		};

		return param;
	},


	/**
	 * 전체 flow 저장
	 */
	FlowSave(newVersion){
		// if (!this.CheckValidation()) {
		// 	return;
		// }

		const param = this.MakeSaveParam();
		console.log(param);
		commandCustom("/flowDesign/saveOnlyUsedFlow.do", JSON.stringify(param))
			.then(({res, msg}) => {
				if (res) {
					if (newVersion !== null) {
						param.flowVersion = newVersion;
						param.versionId = "";
						param.version = newVersion;

						commandCustom("/flowDesign/makeNewFlowVersion.do", JSON.stringify(param))
							.then(({res, msg}) => {
								if (res) {
									_ShowSuccessAfterLoading("버전이 생성되었습니다.", () => {
										this.GetFlowDesign();
										this.SetVersionSelectBox(this.vm.flowId);
									});
								}
								else {
									_ShowErrorAfterLoading("versionError: ", msg);
								}
							})
							.catch((err) => {
								_ShowErrorAfterLoading("versionError: ", __ServerNotConnectMSG);
							});
					}
					else {
						_ShowSuccessAfterLoading("저장되었습니다.", () => {
							this.GetFlowDesign();
							this.SetVersionSelectBox(this.vm.flowId);
						});
					}
				}
				else {
					_ShowErrorAfterLoading("저장하지 못했습니다.", msg);
				}
			})
			.catch((err) => {
				_ShowErrorAfterLoading(__ServerNotConnectMSG);
				console.error(err);
			})
			.finally(() => {
				// history insert app에서 해결
			});
	},

	MapTableSave(row) {
		const params = this.MakeSaveParam();
		const rows = row.row;
		const flowId = params.flowId;
		const processName =  row.processName.toString();
		const versionId = params.versionId;
		const versionId2 = params.version;
		const field = null;
		const funstion = null;
		const rename = null;
		params.rows = row.row;
		//params.processName = row.processName;
		console.log(params);
		const param = { flowId ,processName,versionId,rows};
		console.log(param);

		//alert(rows);
		commandCustom("/flowDesign/makeMappingTable.do", JSON.stringify(param))
			.then(({res,msg}) => {
			if (res) {
				_ShowSuccessAfterLoading("저장되었습니다.", () => {
					this.GetFlowDesign();
					this.SetVersionSelectBox(this.vm.flowId);
				});
			}
			else {
				_ShowErrorAfterLoading("저장하지 못했습니다.", msg);
			}
		}).catch((err) => {
			_ShowErrorAfterLoading("versionError: ", __ServerNotConnectMSG);
		});
	},

	SetClickEvent() {
		const findList = this.flowDesigner.findAll("group");

		this.flowDesigner.on(findList, "click", (target, e) => { // Process 클릭 시 정보 갖고 올 수 있도록 세팅
			const processData = this.GetProcessInfo(target, e);
			console.log(processData);
			console.log(this.wholeDesignObj);
			if (!Object.keys(this.wholeDesignObj).includes(processData.processName)) {
				return;
			}
			const processType = this.wholeDesignObj[processData.processName]["type"];
			const processName = processData.processName;

			this.vm.propertiesGroupArr = [];
			this.vm.componentDetailArr = [];
			this.ShowProcessInfo(processName, processType);
		});

		// process 위치 변경되는것 감지 및 데이터 변경
		this.flowDesigner.on(findList, "dragend", (target,e ) => {
			const {children} = target;
			let processName = null;
			let positions = {};

			for (const child of children) {
				if (child.className === "Rect" || child.className === "Ring") {
					positions = child.getAbsolutePosition();
				}
				if (child.className === "Text") {
					processName = child.attrs.text;
				}
			}

			let infoArr = this.wholeDesignObj;
			if (!Object.keys(this.wholeDesignObj).includes(processName)) {
				infoArr = this.inOutInfo;
			}
			infoArr[processName]["window"] = positions;
		});
	},

	SetArrowClickEvent() {
		const findConnections = this.flowDesigner.findAll("arrow");

		this.flowDesigner.on(findConnections, "click", (target, e) => { // connections 클릭 시 정보 갖고 올 수 있도록 세팅
			const id = target.id().substr(5);
			let processName = "";
			let processType = "";
			const arrowIds = [];

			for (const value of Object.values(this.wholeDesignObj)) {
				arrowIds.push(value.id);
			}

			let infoArr = this.wholeDesignObj;
			if (!arrowIds.includes(id)) {
				infoArr = this.inOutInfo;
			}

			for (const key of Object.keys(infoArr)) {
				if (id === infoArr[key]["id"]) {
					processName = infoArr[key]["name"];
					processType = infoArr[processName]["type"];
				}
			}

			this.vm.propertiesGroupArr = [];
			this.vm.componentDetailArr = [];
			this.ShowProcessInfo(processName, processType);
		});
	},

	/**
	 * 버전생성 팝업
	 */
	MakeNewVersion() {
		if (Object.keys(this.wholeDesignObj).length === 0) {
			_ShowWarning("저장할 내용이 없습니다.");
			return;
		}
		if (!this.CheckValidation()) {
			return;
		}

		this.popup.View({
			pageURL: "/html/Setup/Popup/NewFlowVersionPOP.html",
			title: "Make Version",
			width: 380,
			height: -1,
			param: {
				flowId: this.vm.flowId
			},
			callback: ((versionName) => {
				this.FlowSave(versionName);
			}),
			referFunc: null,
			closeCallBack: null
		});
	},

	/**
	 * import Flow Design
	 */
	GetAllDesign() {
		if (this.vm.serverId === "") {
			_ShowWarning("서버명을 선택해주세요.");
			return;
		}
		if (this.vm.flowId === "") {
			_ShowWarning("Flow명을 선택해주세요.");
			return;
		}

		this.popup.View({
			pageURL: "/html/Setup/Popup/ImportDesignPOP.html",
			title: "Make Version",
			width: "inherit",
			height: -1,
			param: {
				engineData: this.engineData,
				serviceId: this.vm.serviceId
			},
			callback: ((connectors, process, startEnds, wholeDesignObj, inOutInfo) => {
				if (this.flowDesigner !== null) {
					this.flowDesigner.Clear();
				}
				this.flowDesigner.connectors = connectors;
				this.flowDesigner.process = process;
				this.flowDesigner.startEnds = startEnds;
				this.flowDesigner.makeFlows();

				this.wholeDesignObj = wholeDesignObj;
				this.inOutInfo = inOutInfo;

				this.SetClickEvent();
				this.SetArrowClickEvent();

				_ShowSuccessAfterLoading("불러오기를 완료 했습니다.");
			}),
			referFunc: null,
			closeCallBack: null
		});
	},
	/**
	 * import Flow Design
	 */
	AddMapping() {


		// data가공  -- properties 가공
		const processes = [];

		for (let key in this.wholeDesignObj) {
			const processInfo = this.wholeDesignObj[key];
console.log(processInfo.type);
			if (processInfo.type === "St") {
				processes.push({
					processor: processInfo.name,
					type: processInfo.type,
					parameter: processInfo.properties,
				});
			}
		}
console.log(processes);
		this.popup.View({
			pageURL: "/html/Setup/Popup/MappingTablePOP.html",
			title: "Add MappingTable",
			width: 1000,
			height: -1,
			param: {
				engineData: this.engineData,
				flowId: this.vm.flowId,
				version: this.vm.versionId,
				processes
			},
			callback: ((param) => {
				this.MapTableSave(param);
				console.log("maptabletest");
				//alert(JSON.stringify(param));
				_ShowSuccessAfterLoading("임시 완료창");
			}),
			referFunc: null,
			closeCallBack: null
		});
	},

	OnClickDesigner(text) {
		console.log(text);
	}
};