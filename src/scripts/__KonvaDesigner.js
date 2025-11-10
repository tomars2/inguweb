/**
 * TODO konvaDesigner
 *   -. 0. 최초 선언부 : this.flowDesigner = new konvaDesigner(this, "{container ID}");
 *   -. 1. this.flowDesigner.engineData = this.engineData;      // 왼쪽 프로세스 리스트
 *   -. 2. connector, process 정보를 넘겨주고 디자이너에 그리기 시작
 *   -.     this.flowDesigner.connectors = this.connectors;     // 프로세스간의 연결 선
 * 	 -.     this.flowDesigner.process 	 = this.process;        // 프로세스 정보
 * 	 -.     this.flowDesigner.makeFlows();                      // 디자이너에 그리는 함수
 * 	 -. 3. 필수 리턴 함수
 * 	 -.     makeNodes() : Drag & Drop 시 새로 만들어지는 노드정보 리턴
 */
function konvaDesigner(dThis, container) {
	this.MODE_DEBUG     = false;
	this.IS_DESIGN      = "";
	this.MODE_EDIT      = "EDIT";
	this.MODE_NONE      = "NONE";
	this.isDraggable    = true;
	this.callThis       = dThis;
	this.containerId    = container;

	// Canvas ( Konva.js )
	this.$designArea    = null; // 영역
	this.$designWidth   = null; // 영역 너비
	this.$designHeight  = null; // 영역 높이
	this.$stage         = null;
	this.$layer         = null;
	this.$tempLayer     = null;
	this.$container     = null;

	// 바둑판 그리기
	this.$gridLayer     = null;
	this.blockSize      = 20;   // Grid 크기

	// Data
	this.process	    = null;
	this.connectors	    = null;
	this.startEnds      = null;
	this.$procConn      = null; // Konva Object

	// preFix
	this.preFixGroup    = "GROUP_";
	this.preFixProcNm   = "NAME_";
	this.preFixIcon     = "ICON_";
	this.preFixArIn     = "IN_";
	this.preFixArOut    = "OUT_";
	this.preFixConn	    = "CONN_";
	this.preFixStart    = "S@@";
	this.preFixEnd      = "E@@";
	this.chInAllowed    = "channel-in-allowed";
	this.chOutAllowed   = "channel-out-allowed";

	this.cWaiting 	    = "gray";
	this.cAbort 		= "#ff0000";
	this.cStop 		    = "#ffc000";
	this.cRunning 	    = "#00b050";

	// Process 사이즈
	this.squareSize     = 70;
	this.squareHalf     = (this.squareSize / 2);    // 35
	this.icProcSize     = 50;   // process 내부 이미지 사이즈
	this.ioDiameter     = 10;   // process의 In, Out 지름

	// Start & End 사이즈
	this.ringDiameter   = 20;
	this.icRingSize     = 28;   // process 내부 이미지 사이즈

	this.startProcId    = null; // Drag&Drop 시작 시 시작점의 ID 저장

	// Process Drag & Drop
	this.engineData     = null; // 왼쪽 프로세스 리스트 데이타
	this.icDropProc     = null; // 왼쪽 목록에서 디자이너에 추가되는 Process 아이콘 테그
	this.newConId       = null; // 신규생성 커넥터 ID
	this.selectionId    = null; // 선택된 노드, 빨간색으로 색상 변경

	// Konva 속도 개선
	this.srcList = null; // 이미지 경로를 갖고 있는 배열
	this.imageList = null; // Image() 인스턴스를 갖고 있는 배열

	this.Init();
}

/**
 * TODO 최초 레이아웃 생성
 * @param container id
 */
konvaDesigner.prototype.Init = function() {
	this.containerId    = this.callThis.prefix + this.containerId;
	this.$designArea    = $(`#${ this.containerId }`);
	this.$designWidth   = this.$designArea.width();
	this.$designHeight  = this.$designArea.height();
	this.$stage = new Konva.Stage({
		container	: this.containerId
		, width		: this.$designWidth
		, height	: this.$designHeight
	});
	if (this.MODE_DEBUG) console.log("InitFlowDesigner()====", "w:" + this.$designWidth + ", h:" + this.$designHeight);

	this.drawCheckerboard();   // 바둑판 그리기

	this.$layer = new Konva.Layer({
		cache: true,
	});
	this.$stage.add(this.$layer);

	this.$tempLayer = new Konva.Layer({
		cache: true,
	});
	this.$stage.add(this.$tempLayer);

	this.$container = this.$stage.container();
	this.$container.tabIndex = 1;
	this.$container.focus();


	this.srcList = [
		{
			key: 'ai',
			value: `/images/icon/ic_process_ai.png`,
		}, {
			key: "ci",
			value: `/images/icon/ic_process_ci.png`
		}, {
			key: 'cm',
			value: `/images/icon/ic_process_cm.png`
		}, {
			key: 'dv',
			value: `/images/icon/ic_process_dv.png`,
		}, {
			key: 'ei',
			value: `/images/icon/ic_process_ei.png`,
		} , {
			key: 'end',
			value: `/images/icon/ic_process_end.png`,
		}, {
			key: 'eo',
			value: `/images/icon/ic_process_eo.png`
		}, {
			key: 'fm',
			value: `/images/icon/ic_process_fm.png`
		}, {
			key: 'fs',
			value: `/images/icon/ic_process_fs.png`,
		}, {
			key: 'ft',
			value: `/images/icon/ic_process_ft.png`,
		}, {
			key: 'fw',
			value: `/images/icon/ic_process_fw.png`,
		}, {
			key: 'rt',
			value: `/images/icon/ic_process_rt.png`,
		}, {
			key: 'start',
			value: `/images/icon/ic_process_start.png`,
		}, {
			key: 'uc',
			value: `/images/icon/ic_process_uc.png`,
		}, {
			key: 'vcm',
			value: `/images/icon/ic_process_vcm.png`,
		}, {
			key: 'wi',
			value: `/images/icon/ic_process_wi.png`
		}, {
			key: 'wia',
			value: `/images/icon/ic_process_wia.png`
		}, {
			key: 'rcp',
			value: `/images/icon/ic_process_rcp.png`
		}, {
			key: 'mq',
			value: `/images/icon/ic_process_mq.png`
		}
	];

	this.imageList = this.srcList.map(({key, value}) => {
		const img = new Image();
		img.src = value;

		return {
			key,
			img
		};
	});

	if (this.MODE_DEBUG) console.log("0. Init===========>", "디자이너 최초 생성~~~~~!!!!!");
	this.InitData();
	this.setBind();
};

konvaDesigner.prototype.InitData = function() {
	this.process        = new Array();
	this.connectors     = new Array();
	this.startEnds      = new Array();
	this.$procConn      = new Array();

	this.selectionId    = null;

	// 수정 가능모드
	if ((this.callThis.funcName).startsWith("Process")) {
		this.IS_DESIGN = this.MODE_NONE;
		this.isDraggable = false;
	}
	else {
		this.IS_DESIGN = this.MODE_EDIT;
		this.isDraggable = true;
	}
};

/**
 * TODO 이벤트
 */
konvaDesigner.prototype.setBind = function() {
	const oThis = this;

	// 마우스 오른쪽 클릭 방지
	this.$stage.on("contextmenu", function (e) {
		e.evt.preventDefault();
		if (e.target === this.$stage) {
			return;
		}
	});

	// CONTAINER > 키입력 이벤트
	this.$container.addEventListener("keydown", function (e) {
		if (oThis.MODE_DEBUG) console.log("keydown", e.keyCode);
		if (e.keyCode === 46) {         // Del
			oThis.removeNodes();
		}
		else if (e.keyCode === 27) {    // Esc
			oThis.onSelection(null);
		}
		else {
		}
	});

	// 절대 지우면 안됨
	this.$container.addEventListener("dragover", function (e) {
		e.preventDefault(); // !important
	});

	// 프로세스 추가
	this.$container.addEventListener("drop", function (e) {
		e.preventDefault();

		oThis.makeProcess(e);
	});

	this.$stage.on("dragstart", function (e) {
		if ((e.target.id()).indexOf(oThis.preFixArOut) === -1) return;

		oThis.onStageDragStart(e);
	});

	this.$stage.on("dragmove", function (e) {
		if ((e.target.id()).indexOf(oThis.preFixArOut) === -1) return;

		oThis.onStageDragMove(e);
	});

	this.$stage.on("dragend", function (e) {
		// if ((e.target.id()).indexOf(oThis.preFixArOut) === -1) return;

		oThis.onStageDragEnd(e);
	}, null, true);

	this.$stage.on("drop", function (e) {
		// if ((e.target.id()).indexOf(oThis.preFixArOut) > -1) return;
		if (oThis.MODE_DEBUG) console.log("onStageDrop", "id:" + e.target.id());

		oThis.onStageDrop(e);
	}, null, true);
};

konvaDesigner.prototype.onStageDragStart = function(e) {
	this.startProcId = (e.target.id()).replace(this.preFixArOut, "");
	if (this.MODE_DEBUG) console.log("onStageDragStart.startProcId", this.startProcId);

	e.target.moveTo(this.$tempLayer);
	this.$layer.draw();
};

konvaDesigner.prototype.onStageDragMove = function(e) {
	const pos = this.$stage.getPointerPosition();
	const shape = this.$layer.getIntersection(pos);
	const eParam = { evt: e.evt, };

	if (this.previousShape && shape) {
		if (this.previousShape !== shape) {
			// leave from old targer
			this.previousShape.fire("dragleave", eParam, true);

			// enter new targer
			shape.fire("dragenter", eParam,true);
			this.previousShape = shape;
		}
		else {
			this.previousShape.fire("dragover", eParam, true);
		}
	}
	else if (!this.previousShape && shape) {
		this.previousShape = shape;
		shape.fire("dragenter", eParam,true);
	}
	else if (this.previousShape && !shape) {
		this.previousShape.fire("dragleave", eParam, true);
		this.previousShape = undefined;
	}
};

konvaDesigner.prototype.onStageDragEnd = function(e) {
	const pos   = this.$stage.getPointerPosition();
	const shape = this.$layer.getIntersection(pos);

	if ((e.target.id()).indexOf(this.preFixArOut) > -1) {
		if (shape && !isUndefined(this.previousShape)) {
			this.previousShape.fire("drop", { evt: e.evt, }, true);
		}
		this.previousShape = undefined;
		e.target.moveTo(this.$layer);

		this.removeDashConn();
		e.target.remove();  // arrowOut 삭제

		const procId  = (e.target.id()).split("_")[1];
		const startPrefix = ((e.target.id()).startsWith(this.preFixStart)) ? this.preFixStart : "";
		const onGroup = this.$layer.findOne(`#${(startPrefix + this.preFixGroup + procId)}`);
		const onRect  = this.$layer.findOne(`#${procId}`);

		// ArrowOut 원위치에 그리기
		if ("/S/E/".indexOf(this.icDropProc) > 0) {
			this.ringAddArrowOut(onGroup, onRect);
		}
		else {
			this.addArrowOut("NEW", onGroup, onRect);
		}
	}
};

konvaDesigner.prototype.onStageDrop = function(e) {
	const oThis = this;

	const arrTarget = (e.target.id()).split("_");
	let targetId = arrTarget[arrTarget.length - 1];

	// 목적지가 없는 연결선 삭제
	this.connectors = this.connectors.filter((con) => {
		return con.to !== "";
	});

	let isConn = true;
	if (arrTarget.length <= 0 || arrTarget[0].startsWith(this.preFixStart)) {
		if (this.MODE_DEBUG) console.log(`${arrTarget[1]}: 연결할 수 없음!!`, "연결될 목적지가 Start 입니다.");
		isConn = false;
	}

	this.process.forEach((proc) => {
		if (proc.id === targetId) {
			if (isUndefined(proc[this.chInAllowed])) {
				const targetInfo = this.engineData[proc.type];
				proc = mergeObjectValue(proc, targetInfo);
			}

			isConn = proc[this.chInAllowed];

			if (!isConn) {
				console.log("데이타를 받을 수 없는 노드 입니다.");
			}
		}
	});

	this.connectors.forEach((connect) => {
		if (connect.toId === targetId) {
			console.log("연결되어 있는 선이 있어서 연결할 수 없음!!");
			isConn = false;
		}
	});

	if (isConn) {
		console.log("이제 연결해 봅시다!!");
		let frId, toId;
		if ((this.startProcId).startsWith(this.preFixStart)) {
			frId = this.startProcId.replace(this.preFixStart, (this.preFixStart + this.preFixProcNm));
		}
		else {
			frId = (this.preFixProcNm + this.startProcId);
		}

		if (arrTarget[0].startsWith(this.preFixEnd)) {
			toId = this.preFixEnd + this.preFixProcNm + targetId;
		}
		else {
			toId = this.preFixProcNm + targetId;
		}

		const dFrom = this.$layer.findOne(`#${frId}`);    // 시작_프로세스 : 명칭
		const dTo   = this.$layer.findOne(`#${toId}`);
		if (dFrom.text().startsWith("S_")) {
			dFrom.text(`S_${dTo.text()}`);
		}
		if (dFrom.text().startsWith("E_")) {
			dTo.text(`E_${dFrom.text()}`);
		}

		const connInfo = {
			id    : this.newConId
			, name  : (this.preFixConn + this.newConId)
			, from	: dFrom.text()  // 시작_프로세스 : 명칭
			, fromId: (this.startProcId).replace(this.preFixStart, "")  // 시작_프로세스 : 아이디
			, to	: dTo.text()    // 도착_포로세스 : 드레그 하는 좌표로 변경
			, toId	: targetId      // 도착_포로세스 : 드레그 하는 좌표로 변경
			// , type  : ""
			// , properties:{
			// 	  capacity: 1000000
			//   }
		};
		this.connectors.push(connInfo);

		this.addConnector(connInfo, function () {
			// oThis.callThis.makeNodes("connector", connInfo);
			setTimeout(() => {
				oThis.updateObjects();
				oThis.callThis.makeNodes("connector", connInfo);
			}, 10);
		});
	}
};

/**
 * TODO Process Drag & Drop
 *   -. 프로세스 추가
 * @param e
 */
konvaDesigner.prototype.makeProcess = function(e) {
	this.onSelection(null);
	// Canvas 크기
	// const stageBox = this.$stage.container().getBoundingClientRect();
	// if (this.MODE_DEBUG) console.log("makeProcess()====", "w:" + stageBox.width + ", h:" + stageBox.height);
	if (this.MODE_DEBUG) console.log("icDropProc", this.icDropProc);
	this.$stage.setPointersPositions(e);
	const pos = this.$stage.getPointerPosition();
	let target = {
		id    : this.newUUID()
		, name  : `${ this.icDropProc }_${ (Math.floor((Math.random() * 100)) + 10) }`
		, type  : this.icDropProc
		, window: {
			x : pos.x
			, y : pos.y
		}
	};

	if ("/S/E/".indexOf(target.type) > 0) {
		if (target.type === "S") {
			target[this.chInAllowed]  = false;
			target[this.chOutAllowed] = true;
		}
		else {
			target[this.chInAllowed]  = true;
			target[this.chOutAllowed] = false;
		}

		this.startEnds.push(target);
		this.startEndRing(target);

		this.callThis.makeNodes("INOUT", target);
	}
	else {
		target.window.x = (target.window.x - this.squareHalf);
		target.window.y = (target.window.y - this.squareHalf);

		for (const [key, value] of Object.entries(this.engineData)) {
			if (key === "MskChannel" || key === "DefaultMessageStore") continue;

			if (value.label.toLowerCase() === target.type.toLowerCase()) {
				if (this.MODE_DEBUG) console.log("===>", target.type, key, value);
				target = mergeObjectValue(target, value);
				break;
			}
		}

		this.process.push(target);
		this.addProcess(target);

		this.callThis.makeNodes("process", target);
	}
};

/**
 * TODO 왼쪽 process 리스트 항목 (Start & End)
 *   -. step 1. Drag&Drop 시 신규 생성
 * @param e
 */
konvaDesigner.prototype.startEndRing = function(target) {
	const oThis = this;

	// 1. 프로세스 그룹
	const seGroup = new Konva.Group({
		id 		: `${target.type}@@${this.preFixGroup + target.id}`
		, x			: 0
		, y			: 0
		, opacity   : 1
		, draggable	: this.isDraggable
	});

	// 2. 프로세스 테두리
	const seRing = new Konva.Ring({
		id            : target.id
		, name          : target.name
		, x             : target.window.x
		, y             : target.window.y
		, fill          : "blue"
		// , stroke		: "white"
		, outerRadius   : this.ringDiameter
		, innerRadius   : (this.ringDiameter - 5)
	});
	seGroup.add(seRing);

	// 3. 프로세스 이름
	const seRingNm = new Konva.Text({
		id		: `${target.type}@@${this.preFixProcNm + seRing.id()}`
		, name      : `${seRing.name()}_${this.startEnds.length}`
		, x         : (seRing.x() - 15)
		, y         : (seRing.y() + 25)
		, text      : target.name
		, fontSize  : 12
		, fontFamily: "Arial"
		, fill      : "white"
	});
	seGroup.add(seRingNm);

	// 4. 프로세스 아이콘
	const targetType = (target.type === "S") ? "start" : "end";
	let iconObj = null;

	for (const image of this.imageList) {
		const {key, img} = image;

		if (targetType === key) {
			iconObj = img;
			break;
		}
	}
	const icProcess = new Konva.Image({
		id        : `${target.type}@@${oThis.preFixIcon + seRing.id()}`
		, x         : (seRing.x() - 13)
		, y         : (seRing.y() - 13)
		, image     : iconObj
		, width     : oThis.icRingSize
		, height    : oThis.icRingSize
	});
	seGroup.add(icProcess);

	if (target.type === "S") {
		this.ringAddArrowOut(seGroup, seRing);
	}

	this.$layer.add(seGroup);

	if (this.IS_DESIGN === this.MODE_EDIT) {
		seGroup.on("mousedown", function (e) {
			const arrId = (e.target.id()).split("_");
			const targetId = arrId[arrId.length - 1];

			if ((e.evt.button) === 0) {       // 왼쪽
				if (oThis.MODE_DEBUG) console.log("seGroup click===", "왼쪽 마우스 클릭" + targetId);
				oThis.onSelection(targetId);
			} else if ((e.evt.button) === 2) {  // 오른쪽
				if (oThis.MODE_DEBUG) console.log("seGroup click===", "오른쪽 마우스 클릭");
			}
		});
		seGroup.on("dragmove", function (e) {
			if ((e.target.id()).indexOf(oThis.preFixGroup) > -1) {
				oThis.updateObjects();
			}
		});
	}
}

/**
 * TODO 왼쪽 process 리스트 항목 (Start)
 *   -. step 2. Start 일때 out 원 그리기
 * @param type
 * @param procGroup
 * @param onRect
 */
konvaDesigner.prototype.ringAddArrowOut = function(seGroup, seRing) {
	const oThis = this;
	if (this.IS_DESIGN === this.MODE_NONE) return;

	const arrowOut = new Konva.Circle({
		id			: (this.preFixStart + this.preFixArOut + seRing.id())
		, x				: (seRing.position().x + (this.ringDiameter + this.ioDiameter))
		, y				: seRing.position().y
		, fill			: "green"
		// , stroke		: "white"
		, radius		: this.ioDiameter
		, shadowBlur	: 0
		, opacity		: 0.4
		, draggable	    : true
	});
	seGroup.add(arrowOut);

	arrowOut.on("dragstart", function (e) {
		// LinePointer를 그룹에서 해제
		e.target.moveTo(oThis.$layer);
		oThis.onSelection(null);

		oThis.newConId = oThis.newUUID();

		// 시작_프로세스 아이디 가져오기
		let fromId = (e.target.id()).replace((oThis.preFixStart + oThis.preFixArOut), "");

		// 시작_프로세스 명칭 가져오기
		const startName = oThis.$layer.findOne(`#${(oThis.preFixStart + oThis.preFixProcNm + fromId)}`);

		const newConnInfo = {
			id: oThis.newConId
			, name: ""
			, from: startName.text()  // 시작_프로세스 : 명칭
			, fromId: fromId            // 시작_프로세스 : 아이디
			, to: ""                // 도착_포로세스 : 드레그 하는 좌표로 변경
			, toId: ""                // 도착_포로세스 : 드레그 하는 좌표로 변경
			// , type  : ""
			// , properties:{
			// 	  capacity: 1000000
			//   }
		};

		oThis.icDropProc = "S";
		oThis.connectors.push(newConnInfo);

		// 커넥션 신규생성
		oThis.addConnector("dashLine", null);
	});
	arrowOut.on("dragmove", function (e) {
		oThis.connectors.forEach((connect) => {
			if (connect.id === oThis.newConId) {
				connect.toId = e.target.id();
			}
		});

		oThis.updateObjects(this.getAbsolutePosition());
	});
};

/**
 * TODO Flow 그리기
 *   -. DB 조회된 값으로 그리기
 */
konvaDesigner.prototype.makeFlows = function() {
	if (this.MODE_DEBUG) console.log("this.process", this.process);
	if (this.MODE_DEBUG) console.log("this.startEnds", this.startEnds);
	if (this.MODE_DEBUG) console.log("this.connectors", this.connectors);
	if (this.MODE_DEBUG) console.log("this.engineData", this.engineData);

	this.process.forEach((target) => {
		const targetInfo = this.engineData[target.type];
		target = mergeObjectValue(target, targetInfo);

		this.addProcess(target);
	});
	if (this.MODE_DEBUG) console.log("1. addProcess=====>", "process 추가 완료~~~~~!!!!!");

	this.startEnds.forEach((target) => {
		this.startEndRing(target);
	});
	if (this.MODE_DEBUG) console.log("2. startEndRing===>", "Start/End 추가 완료~~~!!!!!");

	this.$procConn = Array();
	this.connectors.forEach((target) => {
		this.addConnector(target, null);
	});
	if (this.MODE_DEBUG) console.log("3. addConnector===>", "connectors 추가 완료~~!!!!!");

	this.updateObjects();
};

/**
 * TODO 프로세스 추가
 * @param target
 */
konvaDesigner.prototype.addProcess = function(target) {
	const oThis = this;

	// 1. 프로세스 그룹
	const procGroup = new Konva.Group({
		id 		: (this.preFixGroup + target.id)
		, x			: 0
		, y			: 0
		, opacity   : 1
		, draggable	: this.isDraggable
		, cache: true
		, perfectDrawEnabled : false
	});

	// 2. 프로세스 테두리
	const mProcess = new Konva.Rect({
		id			: target.id
		, x			    : target.window.x
		, y			    : target.window.y
		, fill			: "gray"
		, stroke		: "white"
		, width			: this.squareSize
		, height		: this.squareSize
		, shadowBlur	: 10
		, cache: true
		, perfectDrawEnabled : false
	});
	procGroup.add(mProcess);

	// 3. 프로세스 이름
	const nmProcess = new Konva.Text({
		id		: (this.preFixProcNm + mProcess.id())
		, x         : mProcess.x()
		, y         : (mProcess.y() + this.squareSize + 5)
		, text      : target.name
		, fontSize  : 13
		, fontFamily: "Arial"
		, fill      : "white"
		, cache: true
		, perfectDrawEnabled : false
	});
	procGroup.add(nmProcess);

	// 4. 프로세스 아이콘
	const tLabel = isUndefined(target.label) ? "ai" : target.label.toLowerCase();
	const iconMargin = (((this.squareSize - this.icProcSize) / 2)); // Margin
	let iconObj = null;

	for (const image of this.imageList) {
		const {key, img} = image;

		if (tLabel === key) {
			iconObj = img;
			break;
		}
	}

	const icProcess = new Konva.Image({
		id        : (oThis.preFixIcon + mProcess.id())
		, x         : (mProcess.x() + iconMargin)
		, y         : (mProcess.y() + iconMargin)
		, image     : iconObj
		, width     : oThis.icProcSize
		, height    : oThis.icProcSize
		, cache: true
		, perfectDrawEnabled : false
	});
	procGroup.add(icProcess);

	// 5. 프로세스 In
	const arrowIn = new Konva.Circle({
		id			: (this.preFixArIn + mProcess.id())
		, x				: mProcess.x()
		, y				: (mProcess.y() + this.squareHalf)
		, fill			: "red"
		// , stroke		: "white"
		, radius		: this.ioDiameter
		, shadowBlur	: 0
		, opacity		: 0 // 투명
		, cache: true
		, perfectDrawEnabled : false
	});
	procGroup.add(arrowIn);

	const chOutAllow = isUndefined(target[this.chOutAllowed]) ? false : target[this.chOutAllowed];
	if (chOutAllow) {
		this.addArrowOut("DB", procGroup, mProcess);
	}

	// 7. 레이어에 추가
	this.$layer.add(procGroup);

	// 8. 이벤트
	//  8-1. 마우스 클릭
	//   -. 0-Left  : 오른쪽에 프로세스 정보 표시
	//   -. 2-Right : Start, Stop, Status
	procGroup.on("mousedown", function (e) {
		const arrId = (e.target.id()).split("_");
		const targetId = arrId[arrId.length - 1];

		if ((e.evt.button) === 0) {       // 왼쪽
			if (oThis.MODE_DEBUG) console.log("procGroup click===", "왼쪽 마우스 클릭" + targetId);
			oThis.onSelection(targetId);

			if ((oThis.callThis.funcName).startsWith("Process")) {
				oThis.callThis.PopChangeStatus(e);
			}
		} else if ((e.evt.button) === 2) {  // 오른쪽
			if (oThis.MODE_DEBUG) console.log("procGroup click===", "오른쪽 마우스 클릭");
		}
	});
	procGroup.on("mouseover", function () {
		oThis.$designArea.css("cursor", "pointer");
	});
	procGroup.on("mouseout", function () {
		oThis.$designArea.css("cursor", "default");
	});

	//  8-2. 프로세스 그룹 드래그할때 In, Out 정보 갱신
	procGroup.on("dragmove", function (e) {
		if ((e.target.id()).indexOf(oThis.preFixGroup) > -1) {
			oThis.updateObjects();
		}
	});
};

/**
 * TODO Out 동그라미 그리기
 * @param type
 * @param procGroup
 * @param onRect
 */
konvaDesigner.prototype.addArrowOut = function(type, procGroup, onRect) {
	const oThis = this;
	if (this.IS_DESIGN === this.MODE_NONE) return;

	const newCircle = {
		id			: (this.preFixArOut + onRect.id())
		, x				: ""
		, y				: ""
		, fill			: "green"
		// , stroke		: "white"
		, radius		: this.ioDiameter
		, shadowBlur	: 0
		, opacity		: 0.4
		, draggable	    : true
	};

	if (type === "NEW") {
		newCircle.x  = onRect.position().x;
		newCircle.y  = onRect.position().y;
	}
	else {
		newCircle.x = onRect.x();
		newCircle.y = onRect.y();
	}
	newCircle.x = newCircle.x + (this.squareSize - this.ioDiameter);
	newCircle.y = newCircle.y + (this.squareHalf);

	const arrowOut = new Konva.Circle(newCircle);
	procGroup.add(arrowOut);

	arrowOut.on("dragstart", function (e) {
		// LinePointer를 그룹에서 해제
		e.target.moveTo(oThis.$layer);
		oThis.onSelection(null);

		oThis.newConId = oThis.newUUID();

		// 시작_프로세스 아이디 가져오기
		const fromId = (e.target.id()).replace(oThis.preFixArOut, "");

		// 시작_프로세스 명칭 가져오기
		const procName = oThis.$layer.findOne(`#${(oThis.preFixProcNm + fromId)}`);

		const newConnInfo = {
			id    : oThis.newConId
			, name  : ""
			, from	: procName.text()   // 시작_프로세스 : 명칭
			, fromId: fromId            // 시작_프로세스 : 아이디
			, to	: ""                // 도착_포로세스 : 드레그 하는 좌표로 변경
			, toId	: ""                // 도착_포로세스 : 드레그 하는 좌표로 변경
			// , type  : ""
			// , properties:{
			// 	  capacity: 1000000
			//   }
		};
		oThis.icDropProc = "";
		oThis.connectors.push(newConnInfo);

		// 커넥션 신규생성
		oThis.addConnector("dashLine", null);
	});
	arrowOut.on("dragmove", function (e) {
		oThis.connectors.forEach((connect) => {
			if (connect.id === oThis.newConId) {
				connect.toId = e.target.id();
			}
		});

		oThis.updateObjects(this.getAbsolutePosition());
	});
};

/**
 * TODO 커넥터 추가
 * @param target
 * @param callback
 */
konvaDesigner.prototype.addConnector = function(target, callback) {
	const oThis = this;
	let connData;
	if (target === "dashLine") {
		connData = {
			id            : (this.preFixConn + oThis.newConId)
			, fill          : "red"
			, stroke        : "red"
			, dash          : [5, 5]
			, pointerWidth  : 0
		};
	}
	else {
		connData = {
			id            : (this.preFixConn + target.id)
			, fill          : "white"
			, stroke        : "white"
			, pointerWidth  : 10   // 화살표 굵기(기본:10)
			, strokeWidth   : 3
		};
	}

	const connector = new Konva.Arrow(connData);

	this.$layer.add(connector);
	this.$procConn.push(connector);

	if (this.IS_DESIGN === this.MODE_EDIT) {
		connector.on("mousedown", function (e) {
			const arrId = (e.target.id()).split("_");
			const targetId = arrId[arrId.length - 1];

			if ((e.evt.button) === 0) {       // 왼쪽
				if (oThis.MODE_DEBUG) console.log("connector click===", "왼쪽 마우스 클릭" + targetId);
				oThis.onSelection(targetId);
			} else if ((e.evt.button) === 2) {  // 오른쪽
				if (oThis.MODE_DEBUG) console.log("connector click===", "오른쪽 마우스 클릭");
			}
		});
	}

	if (callback !== null) {
		callback();
	}
};

/**
 * TODO Connection 위치 수정
 * @param from
 * @param to
 * @returns {(*|number)[]}
 */
konvaDesigner.prototype.getConnectorPoints = function(from, to) {
	const radius = 5;
	const dx     = to.x - from.x;
	const dy     = to.y - from.y;
	let angle    = Math.atan2(-dy, dx);

	const result = [
		from.x + -radius * Math.cos(angle + Math.PI)
		, from.y + radius * Math.sin(angle + Math.PI)
		, to.x + -radius * Math.cos(angle)
		, to.y + radius * Math.sin(angle)
	];

	return result;
};

/**
 * TODO 위치 갱신
 * @param absPos
 */
konvaDesigner.prototype.updateObjects = function(absPos) {
	this.connectors.forEach((connect) => {
		const line      = this.$layer.findOne(`#${(this.preFixConn + connect.id)}`);
		const conFrom   = this.$layer.findOne(`#${connect.fromId}`);
		const conTo     = this.$layer.findOne(`#${connect.toId}`);

		const seFromNode = this.startEnds.filter((seNodes) => {
			return seNodes.id === connect.fromId;
		});
		const seToNode = this.startEnds.filter((seNodes) => {
			return seNodes.id === connect.toId;
		});

		const posFrom = {
			x: (conFrom.absolutePosition().x)
			, y: (conFrom.absolutePosition().y)
		};
		// START & END 정보일때는 위치 변경
		if (seFromNode.length === 0) {
			posFrom.x = posFrom.x + this.squareSize;
			posFrom.y = posFrom.y + this.squareHalf;
		}
		else {
			posFrom.x = posFrom.x + 13;
			posFrom.y = posFrom.y;
		}

		const posTo = new Object();
		if (isUndefined(conTo)) {
			if (this.MODE_DEBUG) console.log("원래 undefined가 아니여야 하는데...>>", connect.toId, conTo);
			posTo.x = absPos.x;
			posTo.y = absPos.y;
		}
		else {
			if (seToNode.length === 0) {
				posTo.x = (conTo.absolutePosition().x);
				posTo.y = (conTo.absolutePosition().y + this.squareHalf);
			}
			else {
				posTo.x = (conTo.absolutePosition().x) - 20;
				posTo.y = (conTo.absolutePosition().y);
			}
		}

		const points = this.getConnectorPoints(posFrom, posTo);
		line.points(points);
	});
};

/**
 * TODO 선택된 노드 색상 변경
 * @param targetId
 */
konvaDesigner.prototype.onSelection = function(targetId) {
	if (this.IS_DESIGN === this.MODE_NONE) return;
	this.selectionId = targetId;

	const fillArr = [];

	this.process.forEach((proc) => {
		const obj = {
			key: 'process',
			id: `#${proc.id}`,
		};

		if (targetId === proc.id) {
			obj.color = 'red';
		}
		else {
			obj.color = 'white';
		}

		fillArr.push(obj);
	});

	this.connectors.forEach((connect) => {
		const obj = {
			key: 'connectors',
			id: `#${(this.preFixConn + connect.id)}`
		};

		if (targetId === connect.id) {
			obj.color = 'red';
		}
		else {
			obj.color = 'white';
		}

		fillArr.push(obj);
	});

	this.startEnds.forEach((se) => {
		const obj = {
			key: 'startEnds',
			id: `#${se.id}`
		};

		if (targetId === se.id) {
			obj.color = 'red';
		}
		else {
			obj.color = 'blue';
		}

		fillArr.push(obj);
	});

	fillArr.forEach(({key, color, id}) => {
		const item = this.$layer.findOne(id);

		switch (key) {
			case 'process':
				item.stroke(color);
				break;
			case 'connectors':
				item.fill(color);
				item.stroke(color);
				break;
			case 'startEnds':
				item.fill(color);
				break;
		}
	});
};

/**
 * TODO Process의 상태에 따라 색상 변경
 * waiting  : 대기상태
 * running  : 정상
 * abort    : 정지(사용자)
 * stop     : 정지(에러)
 * @param arrProcStatus : object
 */
konvaDesigner.prototype.changeProcess = function(procStatus) {
	// waiting : 대기상태
	procStatus.waiting.forEach((procId) => {
		let sbArrow = this.$layer.findOne(`#${procId}`);
		sbArrow.fill(this.cWaiting);
	});
	// running : 정상
	procStatus.running.forEach((procId) => {
		let sbArrow = this.$layer.findOne(`#${procId}`);
		sbArrow.fill(this.cRunning);
	});
	// abort : 정지(사용자)
	procStatus.abort.forEach((procId) => {
		let sbArrow = this.$layer.findOne(`#${procId}`);
		sbArrow.fill(this.cAbort);
	});
	// stop : 정지(에러)
	procStatus.stop.forEach((procId) => {
		let sbArrow = this.$layer.findOne(`#${procId}`);
		sbArrow.fill(this.cStop);
	});
};

/**
 * TODO 커넥터 점선 삭제
 */
konvaDesigner.prototype.removeDashConn = function() {
	const connId = this.preFixConn + this.newConId;
	const newConn = this.$procConn.find((con) => {
		return con.id() == connId;
	});
	newConn.destroy();

	// 목적지가 없는 연결선 삭제
	this.connectors = this.connectors.filter((con) => {
		return con.to !== "";
	});
};

/**
 * TODO 선택된 노드와 관련된 선까지 같이 삭제
 */
konvaDesigner.prototype.removeNodes = function() {
	if (this.IS_DESIGN === this.MODE_NONE) return;
	if (this.selectionId === null) return;

	// 지우기 시작
	const sNode = this.$layer.findOne(`#${this.selectionId}`);
	let selNodeNm = (isUndefined(sNode)) ? "" : sNode.name();

	let sePrefix = this.preFixGroup;
	if (selNodeNm.startsWith("S_")) {
		sePrefix = this.preFixStart + sePrefix;
	}
	else if (selNodeNm.startsWith("E_")) {
		sePrefix = this.preFixEnd + sePrefix;
	}

	let selectNode = this.$layer.findOne(`#${sePrefix + this.selectionId}`);
	if (!isUndefined(selectNode)) {
		selectNode.destroy();
	}

	this.connectors.forEach((connect) => {
		if (("/{0}/{1}/{2}/".format(connect.id, connect.fromId, connect.toId)).indexOf(this.selectionId) > 0) {
			const connectId = (this.preFixConn + connect.id);
			let selArrow = this.$layer.findOne(`#${connectId}`);
			selArrow.destroy();

			this.$procConn = this.$procConn.filter((pcCon) => {
				return pcCon.id() !== connectId;
			});
		}
	});

	const arrDelNodes = new Array();
	const tempProc = new Array();
	this.process.forEach((proc) => {
		if (proc.id === this.selectionId) {
			if (this.MODE_DEBUG) console.log("proc.name", proc.name);
			arrDelNodes.push(proc.name);
		}
		else {
			tempProc.push(proc);
		}
	});
	this.process = tempProc;

	const tempSe = new Array();
	this.startEnds.forEach((se) => {
		if (se.id === this.selectionId) {
			if (this.MODE_DEBUG) console.log("se.name", se.name);
			arrDelNodes.push(se.name);
		}
		else {
			tempSe.push(se);
		}
	});
	this.startEnds = tempSe;

	const tempConn = new Array();
	this.connectors.forEach((conn) => {
		if ((("/{0}/{1}/{2}/".format(conn.id, conn.fromId, conn.toId)).indexOf(this.selectionId) > -1)) {
			if (this.MODE_DEBUG) console.log("conn.name", conn);
			arrDelNodes.push(conn.name);
		}
		else {
			tempConn.push(conn);
		}
	});
	this.connectors = tempConn;

	this.callThis.deleteNodes(arrDelNodes);
};

/**
 * TODO 디자이너 초기화
 * @param callback
 * @constructor
 */
konvaDesigner.prototype.Clear = function(callback) {
	if (this.MODE_DEBUG) console.log("*. Clear==========>", "디자이너 초기화~~~~~~~~!!!!!");
	if (this.$layer != null) {
		this.$layer.destroyChildren();
	}
	if (this.$tempLayer != null) {
		this.$tempLayer.destroyChildren();
	}

	// Data
	this.InitData();

	if (callback != null) {
		callback("디자이너 초기화 완료~!");
	}
};

/**
 * TODO 레이어 위에 바둑판 그리기
 */
konvaDesigner.prototype.drawCheckerboard = function() {
	this.$gridLayer = new Konva.Layer({
		cache: true,
	});
	const gridConfig = {
		stroke        : "#bbb"
		, strokeWidth   : 0.5
	};

	// 세로선
	for (let i = 0; i < (this.$designWidth / this.blockSize) ; i++) {
		const points = [Math.round(i * this.blockSize) + 0.5, 0, Math.round(i * this.blockSize) + 0.5, this.$designHeight];

		this.$gridLayer.add(new Konva.Line({
			points        : points
			, stroke        : gridConfig.stroke
			, strokeWidth   : gridConfig.strokeWidth
		}));
	}
	// 가로선
	for (let j = 0; j < (this.$designHeight / this.blockSize) ; j++) {
		const points = [0, Math.round(j * this.blockSize), this.$designWidth, Math.round(j * this.blockSize)];

		this.$gridLayer.add(new Konva.Line({
			points        : points
			, stroke        : gridConfig.stroke
			, strokeWidth   : gridConfig.strokeWidth
		}));
	}
	this.$stage.add(this.$gridLayer);
};

/**
 * TODO UUID 생성
 */
konvaDesigner.prototype.newUUID = function() {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
		return v.toString(16);
	});
};

/**
 * TODO Layer에 있는 값을 얻어올 때 사용
 * @param findId : String
 * @return findItem : Object
 */
konvaDesigner.prototype.findById = function(findId) {
	const {$layer} = this;
	const {children} = $layer;
	let findItem = null;
	if (children.length < 1) return null;
	for (const child of children) { // 자식 노드들 중에 원하는 Id 값을 찾음
		const id = child.id();
		const item = $layer.findOne(`#${id}`);
		if (id !== findId) continue;
		findItem = item;
		break;
	}
	return findItem;
}

/**
 * TODO 특정 아이템의 타입으로 요소를 찾는 타입
 * @param elType : String
 * @return elList : Array
 */
konvaDesigner.prototype.findAll = function(elType) {
	const {$layer} = this;
	const {children} = $layer;
	const elList = [];
	if (children.length < 1) return null;

	elType = elType.toUpperCase();

	for (const child of children) { // 자식 노드들 중에 원하는 Id 값을 찾음
		const id = child.id();
		const item = $layer.findOne(`#${id}`);
		const itemType = item.getType().toUpperCase();

		if (itemType === "GROUP") {
			if (elType === itemType) {
				elList.push(item);
			}
		}
		else { // Shape
			const itemClassName = item.className.toUpperCase();
			if (elType === itemClassName) {
				elList.push(item);
			}
		}
	}

	return elList;
};

/**
 * TODO 요소 단위로 이벤트를 지정하는 함수
 * @param els : Array/Object
 * @param eventType : String
 * @param handler : Function
 */
konvaDesigner.prototype.on = function(els, eventType, handler) {
	if (typeof els !== "object") return;

	if (!Array.isArray(els)) { // 단수일 경우
		els.on(eventType, handler, null, true);
	}
	else { // 배열일 경우
		for (const el of els) {
			el.on(eventType, (e) => {
				const {currentTarget, evt} = e;
				handler(currentTarget, evt);
			}, null, true);
		}
	}
};