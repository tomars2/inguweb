ServerStatus = {
    vm: null, /* Vue Instance */
    cnt: 0, /* 웹소켓 응답 횟수를 계산하기 위한 전역 변수 */
    pollingSecond: 60000, /* 폴링주기 */

    /**
     * Entry Point
     */
    Init() {
        this.SetVue();
    },

    /**
     * Vue Instance 생성
     */
    SetVue() {
        const oThis = this;

        this.vm = new Vue({
            el: `#${this.panelID}`,
            data() {
                return {
                    temp: {
                        tree: {
                            flowGroup: {},
                            processType: {}
                        }
                    },
                    view: { /* 화면에 보여줄 값 */
                        tree: { /* 좌측 사이드바 트리 */
                            flowGroup: {},
                            processType: {}
                        },
                        treeTabName: 'FlowGroup',
                        isCheckedFlowGroup: false, /* Flow Group 체크박스 */
                        tabName: 'Block', /* 활성화된 탭 이름 */
                        blockRow: [], /* 조회 시 block 데이터*/
                        isFold: false, /* 사이드바 접는 Flag */
                        sideTarget:null, /* 사이드바 우클릭 시 굵게 표시된 타겟*/
                    },
                    selectBox: { /* Select Box */
                        serverName: null, /* 서버 이름 */
                        serviceEl: null, // 서비스 jQuery 요소
                        serverEl: null, // 서버 jQuery 요소
                        flowEl: null, // 플로우 jQuery 요소
                        flowGroupEl: null, // 플로우 그룹 jQuery 요소

                        serviceVal: null, // Service SelectBox 값
                        serverVal: null, // Server SelectBox 값
                        flowVal: null, // Flow SelectBox 값
                        flowGroupVal: null, // Flow Group SelectBox 값

                        serviceValEl: null, /* Service SelectBox Select2 객체*/
                        serverValEl: null, /* Server SelectBox Select2 객체*/
                        flowValEl: null, /* Flow SelectBox Select2 객체*/
                        flowGroupValEl: null, /* FlowGroup SelectBox Select2 객체*/
                        data: { /* 탭마다 Select Box 값을 공유하지 않도록 */
                            block: {
                                server: null,
                                flow: null,
                                flowGroup: null
                            },
                            diagram: {
                                server: null,
                                flow: null,
                                flowGroup: null
                            },
                            grid: {
                                server: null,
                                flow: null,
                                flowGroup: null
                            }
                        }
                    },
                    grid: { /* 그리드 */
                        el: null, /* 그리드 HTML 요소(jQuery) */
                        elBox: null, /* 그리드를 감싸는 요소 */
                        data: null, /* 그리드에 들어간 데이터 */
                    },
                    style: { /* CSS */
                        hide: 'display: none;',
                        searchNav: { /* 검색 조건 Navigation */
                            target: 'display: flex; justify-content: right;',
                            flowGroupCheckBox: 'display: flex; align-items: center;',
                            flowGroupCheckBoxLabel: 'margin-right: 10px;',
                            florGroupTextStyle: 'padding-right: 8px; width: 100px;',
                        },
                        canvas: 'width: 2000px; height: 2000px', /* Designer 캔버스 */
                        service: 'margin: 10px 0',
                    },
                    designer: { /* Konva Designer */
                        flowDesigner: null, /* Designer 객체 */
                        engineData: null, /* 엔진에서 가져오는 데이터 */
                        engineProcess: [], /* 엔진에서 가져온 프로세스 타입 */
                        changeProcess:  {/* 바뀌어야 할 Process List */
                            running: [],
                            stop: [],
                            abort: [],
                            waiting: []
                        },
                    },
                    socket: {
                        stompClient: null, /* Stomp JS 객체 */
                        isFirstConnected: false, /* 최초 연결 */
                        isConnectedWithServer: false, /* 스프링 컨테이너와의 웹소켓 연결 여부 체크*/
                        isConnectedWithOAgent: false, /* oAgent외의 웹소켓 연결 여부 체크 */
                        polling: null, /* T_BP_STATUS Polling Object */
                        worker: null, /* Web Worker */
                    }
                };
            },
            methods: { /* 이벤트 */
                reload() {
                    _ShowLoading('BP_STATUS를 Polling합니다.');
                    oThis.CallWorker(this);

                    setTimeout(() => {
                        _HideLoading();
                    }, 1500);
                },
                setClassWithStatus(type, item) {
                    const rtnClass = {
                        'abort': false,
                        'stop': false,
                        'waiting': false,
                        'running': false,
                    };

                    switch (item.status) {
                        case 'abort':
                            rtnClass.abort = true;
                            break;
                        case 'stop':
                            rtnClass.stop = true;
                            break;
                        case 'waiting':
                            rtnClass.waiting = true;
                            break;
                        case 'running':
                            rtnClass.running = true;
                            break;
                        default:
                            rtnClass.waiting = true;
                    }

                    return rtnClass;
                },
                selectTabInSideBar(e) { /* Flow-Group과 Process-Type을 바꾸는 함수*/
                    const target = $(e.target);
                    const siblings = target.siblings();
                    const flowGroupTree = this.$refs.flowGroupTree;
                    const processTypeTree = this.$refs.processTypeTree;

                    siblings.removeClass('active');
                    target.addClass('active');

                    if (target.text() === 'Flow-Group') {
                        this.view.treeTabName = 'FlowGroup';
                        processTypeTree.style.display = 'none';
                        flowGroupTree.style.display = 'block';
                    } else {
                        this.view.treeTabName = 'ProcessType';
                        flowGroupTree.style.display = 'none';
                        processTypeTree.style.display = 'block';
                    }
                },
                handleContextMenu(e) {
                    // 원하는 작업 수행
                    const target = $(e.target);
                    target.css("font-weight","bold");
                    this.view.sideTarget = target;
                    window.addEventListener('mouseup', this.handleMouseUp);
                },
                handleMouseUp() {
                    this.view.sideTarget.css("font-weight","initial");
                    window.removeEventListener('mouseup', this.handleMouseUp);
                },
                fold() { /* 사이드 바 접기 이벤트 */
                    this.view.isFold = !this.view.isFold;
                    
                    if(this.view.tabName === 'Grid') {
                        this.$nextTick(() => { /* 화면 렌더링 이후 */
                            this.grid.el.jqGrid('setGridWidth', this.grid.elBox.width());
                        });
                    }
                },
                selectTab(tabName, e) { /* 탭 선택 이벤트 및 화면 로드 */
                    const currentTarget = $(e.currentTarget);
                    const liList = $(`.tab li`);

                    liList.removeClass('active');
                    currentTarget.addClass('active');

                    this.view.tabName = tabName;

                    if (tabName === 'Diagram') { /* 플로우 디자이너 크기 재지정을 위한 재생성*/
                        if(this.view.isCheckedFlowGroup) this.view.isCheckedFlowGroup = false;

                        if (this.view.isFold) {
                            this.designer.flowDesigner = null;

                            oThis.DrawFlowDesigner(this, () => {
                                if(this.projectId !== null && this.projectId !== '' && this.serverId !== null
                                    && this.serverId !== '' && this.flowId !== null && this.flowId !== '') {
                                    oThis.SearchDiagram(this);
                                }
                            });
                        } else {
                            oThis.DrawFlowDesigner(this);
                        }
                    } else if(tabName === 'Grid') {
                        if(this.view.isCheckedFlowGroup) this.view.isCheckedFlowGroup = false;

                        if(this.grid.el === null && this.grid.elBox === null) {
                            this.$nextTick(() => {
                                oThis.GridInit(this);
                            });
                        } else {
                            this.$nextTick(() => { /* 화면 렌더링 이후 */
                                this.grid.el.jqGrid('setGridWidth', this.grid.elBox.width());
                            });
                        }
                    }
                },
                excel() {  /* 엑셀 다운로드 */
                    oThis.ExcelDownload(this)
                },
                search(e) { /* 조회 기능 */
                    const projectId = this.projectId;
                    const serverId = this.serverId;
                    const flowId = this.flowId;

                    switch (this.view.tabName) {
                        case 'Block':
                            oThis.SearchBlock(this)
                            break;
                        case 'Diagram':
                            if (e) {
                                if(projectId === null || projectId === '') return _ShowInfo('Project를 지정해주세요');
                                if(serverId === null || serverId === '') return _ShowInfo('Server를 지정해주세요');
                                if (flowId === null || flowId === '') return _ShowInfo('Flow를 지정해주세요');
                            }
                            oThis.SearchDiagram(this);
                            break;
                        case 'Grid':
                            oThis.SearchGrid(this)
                            break;
                    }
                },
                foldInSideBar(e) { /* Side Bar 트리 구조 열고 접고 */
                    e.preventDefault();
                    const currentTarget = e.currentTarget;

                    if (currentTarget.classList.contains('active')) {
                        if (currentTarget.classList.contains('instance')) return
                        currentTarget.classList.remove('active');
                    } else {
                        // 트리 플러스 버튼 클릭 시 우측 search select 에 값 셋팅
                        if(currentTarget.classList.contains('server') || currentTarget.classList.contains('processType')) {
                            const settingServerId = currentTarget.getAttribute('data-serverId');

                            /* Select2에 값 부여 및 화면 렌더링 */
                            this.selectBox.serverEl.val(settingServerId).trigger('change');
                            this.selectBox.serverVal = settingServerId;

                            for (const key in this.selectBox.data) { /* SideBar active했을 때 값을 selectBox에 값 지정 */
                                const tabSelectBoxInfo = this.selectBox.data[key];

                                tabSelectBoxInfo.server = settingServerId;
                            }

                            oThis.SetSelectBoxOfFlow(this);

                        } else if(currentTarget.classList.contains('flow')) {
                            const settingServerId = currentTarget.getAttribute('data-serverId');
                            /* Select2에 값 부여 및 화면 렌더링 */
                            this.selectBox.serverEl.val(settingServerId).trigger('change');
                            this.selectBox.serverVal = settingServerId;

                            oThis.SetSelectBoxOfFlow(this);

                            const settingFlowId = currentTarget.getAttribute('data-flowId');

                            for (const key in this.selectBox.data) { /* SideBar active했을 때 값을 selectBox에 값 지정 */
                                const tabSelectBoxInfo = this.selectBox.data[key];

                                tabSelectBoxInfo.server = settingServerId;
                                tabSelectBoxInfo.flow = settingFlowId;
                            }

                            setTimeout(() => { /* 화면 렌더링에 필요한 시간 */
                                this.selectBox.flowEl.val(settingFlowId).trigger('change');
                                this.selectBox.flowVal = settingFlowId;
                            },300);
                        }

                        currentTarget.classList.add('active');
                    }
                },
            },
            mounted() { /* 화면 Mounted */
                oThis.SetData(this);
            },
            watch: { /* 데이터 감시 */
                'selectBox.serviceVal' () { /* 서비스 셀렉트 값 변경 감시 */
                    /* Main Logic 시작점 */
                    oThis.SetSelectBoxOfServer(this);
                   // oThis.SetSelectBoxOfFlowGroup(this);
                    oThis.SetSideTree(this);
                },
                'selectBox.serverVal' (c) { /* 서버 셀렉트 값 변경 감시 */
                    if (this.selectBox.serverVal === '') { /* Remove Flow Value */
                        this.selectBox.flowVal = '';
                        oThis.SetSelectBoxOfServer(this);
                    } else {
                        oThis.SetSelectBoxOfFlow(this);
                    }
                },
                'selectBox.flowVal'(c) { /* 플로우 셀릭트 값 변경 감시 */
                    if (this.view.tabName === 'Diagram') {
                        oThis.SearchDiagram(this);
                    }
                },
                /*'view.isCheckedFlowGroup'(c) { /!* FlowGroup 체크 여부 감시(SelectBox 초기화) *!/
                    if(c) { // FlowGroup Checked
                        this.selectBox.serverEl.val('').select2();
                        this.selectBox.serverVal = '';
                        this.selectBox.flowEl.val('').select2();
                        this.selectBox.flowVal = '';
                    } else {// FlowGroup UnChecked
                        this.selectBox.flowGroupEl.val('').select2();
                        this.selectBox.flowGroupVal = '';

                        oThis.SetSelectBoxOfFlowGroup(this);
                    }
                },*/
                'view.tabName'(currentTab, prevTab) { /* 활성화된 Tab*/
                    const prevTabName = prevTab.toLowerCase();
                    const currentTabName = currentTab.toLowerCase();

                    /* 이전 탭의 Select Box 값 보관 */
                    this.selectBox.data[prevTabName].server = this.selectBox.serverVal;
                    this.selectBox.data[prevTabName].flow = this.selectBox.flowVal;
                    this.selectBox.data[prevTabName].flowGroup = this.selectBox.flowGroupVal;

                    /* 현재 탭에 해당하는 값을 Select Box 값으로 세팅 */
                    this.selectBox.serverVal = this.selectBox.data[currentTabName].server;
                    this.selectBox.flowVal = this.selectBox.data[currentTabName].flow;
                    this.selectBox.flowGroupVal = this.selectBox.data[currentTabName].flowGroup;

                    /* Select2 라이브러리 null 호환 안되므로 방지*/
                    if (this.selectBox.serverVal === null) this.selectBox.serverVal = '';
                    if (this.selectBox.flowVal === null) this.selectBox.flowVal = '';
                    if (this.selectBox.flowGroupVal === null) this.selectBox.flowGroupVal = '';

                    /* Select2에 값 부여 및 화면 렌더링 */
                    this.selectBox.serverEl.val(this.selectBox.serverVal).trigger('change');

                    setTimeout(() => { /* 화면 렌더링에 필요한 시간 */
                        this.selectBox.flowEl.val(this.selectBox.flowVal).trigger('change');
                        this.selectBox.flowGroupEl.val(this.selectBox.flowGroupVal).trigger('change');

                        // this.search();
                    },300);
                },
                'socket.isConnectedWithServer'(c) { /* 스프링 컨테이너와의 웹소켓 연결 체크 */
                    if(!c) {
                        oThis.ConnectToWebSocket(this);
                    }
                },
                'socket.isConnectedWithOAgent'(c) { /* oAgent와의 웹소켓 연결 체크*/
                    if(!c) { /* oAgent외의 연결이 끊어졌을 경우 */
                        _ShowErrorAfterLoading('oAgent와의 웹소켓 연결이 끊어졌습니다.');
                        const tree = $(this.$refs.flowGroupTree);

                        const emList = tree.find('em.state');

                        emList.removeClass('ok');
                        emList.addClass('stop');
                    }
                },
            },
            computed: { /* 데이터 계산 */
                projectId() { /* 프로젝트 id ( = Service id) */
                    return this.selectBox.serviceVal;
                },
                serverId() { /* 서버 id */
                    return this.selectBox.serverVal;
                },
                flowId() { /* 플로우 id */
                    return this.selectBox.flowVal;
                },
                flowGroup() { /* 플로우 그룹 id */
                    return this.selectBox.flowGroupVal;
                },
                serverName() { /* 서버 이름 */
                    return this.selectBox.serverName;
                },
            }
        });
    },

    /**
     * Vue 데이터 메서드에 바인딩
     * @param $this: Vue Instance
     */
    SetData($this) {
        _ShowLoading('데이터를 로드하고 있습니다.');
        /* Select Box 값 세팅 */
        $this.selectBox.serviceEl = $($this.$refs.service);
        $this.selectBox.serverEl = $($this.$refs.server);
        $this.selectBox.flowEl = $($this.$refs.flow);
        $this.selectBox.flowGroupEl = $($this.$refs.flowGroup);

        $this.selectBox.serviceVal = Global.projectId;

        this.ConnectToWebSocket($this);
    },

    /**
     * SelectBox 세팅(Server)
     * @param $this: Vue Instance
     */
    SetSelectBoxOfServer($this) {
        const server = $this.selectBox.serverEl;
        const param = {
            projectId: $this.projectId
        };

        new CommListLocal("commonSearchServer", "commonData", param).get(server, true)
            .then(() => {
                this.SetEventInSelectBox(server, $this, 'serverVal', 'Select Server');
            })
            .catch(e => {
                _ShowErrorAfterLoading(e.message);
                console.error(e);
            });
    },

    /**
     * SelectBox 세팅(Flow)
     * @param $this: Vue Instance
     */
    SetSelectBoxOfFlow($this) {
        const flow = $this.selectBox.flowEl;
        const param = {
            projectId: $this.projectId,
            serverId: $this.serverId
        };

            new CommListLocal("commonSearchFlow", "commonData", param).get(flow, true)
            .then(() => {
                this.SetEventInSelectBox(flow, $this, 'flowVal', 'Select Flow');
            })
            .catch(e => {
                _ShowErrorAfterLoading(e.message);
                console.error(e);
            });
    },

    /**
     * SelectBox 세팅(Flow Group)
     * @param $this: Vue Instance
     */
    SetSelectBoxOfFlowGroup($this) {
        const flowGroup = $this.selectBox.flowGroupEl;

        new CommListLocal("commonSearchFlowGroup", "commonData", {projectId: $this.projectId, serverId: $this.serverId}).get(flowGroup, true)
            .then(() => {
                this.SetEventInSelectBox(flowGroup, $this, 'flowGroupVal', 'Select Flow Group');
            })
            .catch(e => {
                _ShowErrorAfterLoading(e.message);
                console.error(e);
            });
    },

    /**
     * Select Box 이벤트 등록
     * @param target: jQuery DOM 요소
     * @param $this: 이벤트 발생 시 값을 담고 있을 객체
     * @param targetName: 객체에 담을 변수
     * @param placeHolder: Select Box에 보여줄 Place Hodler
     */
    SetEventInSelectBox(target, $this, targetName, placeHolder) {
        target.off();
        target.select2({placeholder: placeHolder, allowClear: true});

        target.val('').trigger('change');

        target.on("select2:select", e => {
            if(e.params.data.id === undefined) e.params.data.id = e.params.data.CODE_CD;
            $this.selectBox[targetName] = e.params.data.id;

            if (targetName === 'serverVal') {
                $this.selectBox.serverName = e.params.data.text;
            }
        });

        target.on("select2:clear", () => {
            $this.selectBox[targetName] = "";
        });

        $this.selectBox[`${targetName}El`] = target;
    },

    /**
     * jQgrid 화면에 렌더링
     * @param $this: Vue Instance
     */
    GridInit($this) {
        const oThis = this;
        const colMake = new GridColMake();

        $this.grid.elBox = $(`#${this.prefix}grid-box`);
        $this.grid.el = $(`#${this.prefix}grid`);

        colMake.setOpt("Server Name", "serverName", 200, ColAlign.Center);
        colMake.setOpt("Flow Group Name", "flowGroupName", 210, ColAlign.Center);
        colMake.setOpt("Flow Name", "flowName", 300, ColAlign.Center);
        colMake.setOpt("Process Name", "processName", 300, ColAlign.Center);
        colMake.setOpt("InstanceCount", "instanceCount", 100, ColAlign.Center); //instance 개수
        colMake.setOpt("Start_time", "startTime", 100, ColAlign.Center); //instance 개수
        colMake.setOpt("End_time", "endTime", 100, ColAlign.Center); //instance 개수
        colMake.setOpt("설정보기", "", 200, ColAlign.Center, {
            formatter: (c, o, r) => {
                return `<button type="button" class="list-style">설정보기</button>`;
            }
        });
        colMake.setHidden("  processId"); // processId
        colMake.setHidden("processType"); // processType
        colMake.setHidden("flowId"); // flowId
        colMake.setHidden("instanceMin"); // Min
        colMake.setHidden("bpId"); // bpId
        colMake.setHidden("delayTime"); // delayTime
        colMake.setHidden("parameter"); // parameter
        colMake.setHidden("runOnStart"); // runOnStart

        $this.grid.el.jqGrid({
            autowidth: true,
            height: "auto",
            shrinkToFit: true,
            colNames: colMake.colNames,
            colModel: colMake.colModels,
            datatype: "local",
            page: 1,
            loadonce: false,
            rownumbers: true,
            rownumWidth: 40,
            rowNum: 20,
            gridview: true,
            viewrecords: true,
            multiselect: false,
            sortname: "Status",
            sortorder: "asc",
            pager: `#${this.prefix}grid-pager`,
            jsonReader: {
                repeatitems: false,
                id: "_id"
            },
            gridComplete: () => {
                const elBox = $this.grid.elBox;
                const el = $this.grid.el;

                if (typeof (elBox.attr("data-first")) === "undefined") {
                    elBox.attr("data-first", "Y");
                    SetGridHeight(el.attr("id"), elBox.height());
                }
            },
            onCellSelect(rowId, iCol, cellContent, e) {
                const tagName = e.target.tagName;

                if (tagName === "BUTTON") {
                    oThis.ShowSettingPopup(rowId, $this);
                }
            },
            loadComplete: (data) => {
                $this.grid.data = data.rows;
            }
        })
    },

    /**
     * 그리드에서 설정 버튼을 누르면 보여주는 팝업
     * @param rowId: jQgrid 내부적으로 관리하는 row별 고유 id
     */
    ShowSettingPopup(rowId,$this) {
        const rowData = $this.grid.el.jqGrid("getRowData", rowId);

        Object.assign(rowData, {tabType: 'process'});
        this.ShowPOP("/html/popup/ProcessSettingPOP.html", "process setting", -1, 330, rowData);
    },

    /**
     * 팝업창을 여는 함순
     * @param url - 팝업 HTML 파일 경로
     * @param title - 팝업 타이틀
     * @param width - 팝업 가로
     * @param height - 팝업 세로
     * @param param - 파라미터
     * @param callback - 콜백
     * @param closeCallBack - 닫힘 콜백
     */
    ShowPOP(url, title, width, height, param, callback, closeCallBack) {
        this.popup.View({
            pageURL: url,
            title: title,
            width: width,
            height: height,
            param: param,
            callback: ((data) => {
                if (typeof callback === 'function') {
                    callback(data);
                }
            }),
            referFunc: null,
            closeCallBack: (() => {
                if (typeof closeCallBack === 'function') {
                    closeCallBack();
                }
            }),
        });
    },

    /**
     * 블록 조회 버튼
     * @param $this: Vue Instance
     */
    SearchBlock($this) {

        _ShowLoading('데이터를 로드하고 있습니다.');

        let serverVal = "";
        let flowVal = "";
        let flowGroupVal = "";

        serverVal = $this.selectBox.serverVal;
        flowVal = $this.selectBox.flowVal;
        flowGroupVal = $this.selectBox.flowGroupVal;

        const param = {
            projectId : $this.projectId,
            serverId : serverVal,
            flowId : flowVal,
            flowGroupId : flowGroupVal
        };

        let processNameList = null;

        const changeProcessNameWithProcessType = (bpName) => {
            for (const mapBpApraw of processNameList) {
                const {app, bp} = mapBpApraw;

                if (bpName !== bp) continue;

                return app;
            }
            return bpName;
        };

        commandInQuerySelect({}, 'common', 'getProcessNameWithProcessType')
            .then(({res, rows, msg}) => {
                if (!res) throw new Error('서버와 연결 하지 못했습니다.');

                processNameList = rows;

                return commandInQuerySelect(param, 'commonData', 'commonSearchProcess')
            })
            .then(({res, msg, rows}) => { // Block
                if (!res) throw new Error('서버와 연결 하지 못했습니다.');

                $this.view.blockRow = [];

                for (const obj of rows) {
                    const item = {};
                    const raw = JSON.parse(obj.raw);
                    item.serverName = obj.serverName;
                    item.flowName = obj.flowName;
                    item.flowId = obj.flowId;
                    item.serverId = obj.serverId;

                    const processList = [];

                    for (const key in raw) {
                        const processItem = {};
                        const type = raw[key].type;

                        if(type!=="MskChannel" && type !== "KafkaChannel") {
                            const fst = raw[key].name.split('_')[0];
                            const sec = raw[key].name.split('_')[1];
                            // processItem.Name = raw[key].name;
                            processItem.instanceCnt = raw[key].properties.instance.count;
                            // processItem.type = raw[key].type;
                            processItem.type = fst + "_" + sec;
                            processItem.bpId = raw[key].properties.bpid;
                            processItem.status = '';
                            processItem.min = raw[key].properties.instance.min;
                            processItem.name = changeProcessNameWithProcessType(processItem.type);

                            processList.push(processItem);
                        }
                    }

                    // bpId 기준으로 정렬
                    processList.sort(function (a, b) {
                        if (a.hasOwnProperty('bpId')) {
                            return a.bpId - b.bpId;
                        }
                    });

                    item.processList = processList;

                    $this.view.blockRow.push(item);
                }

                /* 정렬 조건 추가 */
                $this.view.blockRow.sort((a, b) => {
                    const aServerName = Number(a.serverName);
                    const bServerName = Number(b.serverName);

                    if (aServerName === bServerName) {
                        return a.flowName.localeCompare(b.flowName);
                    } else {
                        return aServerName - bServerName;
                    }
                });

                $this.$nextTick(() => {
                    this.SetDesign($this);
                });
                this.CallWorker($this);
            })
            .catch(e => {
                _ShowErrorAfterLoading('서버와 연결을 하지 못했습니다.');
                console.error(e);
            })
            .finally(() => {
                _HideLoading();
            });
    },

    /**
     *  모니터링 화면의 디자인 세팅
     *  @param $this: Vue Instance
     */
    SetDesign($this) {
        const blockBox = $this.$refs['block_box'];
        const flowList = blockBox.querySelectorAll(".flow");
        const articleList = blockBox.querySelectorAll('.block_item');
        
        /* Step block에서 flow 정렬 */
        const flowWidthList = [...flowList].map(item => {
            return item.clientWidth;
        });

        const flowMaxWidth = Math.max(...flowWidthList);

        for (const flow of flowList) {
            const span = flow.querySelector('.flow-name');

            flow.style.width = `${flowMaxWidth}px`;
            span.style.display = 'inline-block';
            span.style.width = '100%';
        }

        /* Step 2 block의 article 정렬 */
        const articleWidthList = [...articleList].map(item => {
            return item.clientWidth;
        });

        const articleMaxWidth = Math.max(...articleWidthList);

        for (const article of articleList) {
            article.style.width = `${articleMaxWidth + 350}px`;
        }
    },

    /**
     * 그리드 조회 버튼
     * @param $this: Vue Instnace
     */
    SearchGrid($this) {
        $this.grid.el.jqGrid("clearGridData");

        _ShowLoading('데이터를 로드하고 있습니다.');

        let serverVal = "";
        let flowVal = "";
        let flowGroupVal = "";

        serverVal = $this.selectBox.serverVal;
        flowVal = $this.selectBox.flowVal;
        flowGroupVal = $this.selectBox.flowGroupVal;

        const param = {
            projectId : $this.projectId,
            serverId : serverVal,
            flowId : flowVal,
            flowGroupId : flowGroupVal
        };

        commandInQuerySelect(param, 'commonData', 'commonSearchProcess')
            .then(({res, msg, rows}) => { // Block
                if (!res) throw new Error('서버와 연결 하지 못했습니다.');

                const processList = [];

                for (const obj of rows) {

                    const raw = JSON.parse(obj.raw);

                    for (const key in raw) {

                        const type = raw[key].type;

                        if(type!=="MskChannel" || type !== "KafkaChannel") {
                            processList.push({
                                serverId: obj.serverId,
                                serverName: obj.serverName,
                                flowGroupId: obj.groupId,
                                flowGroupName: obj.groupName,
                                flowId: obj.flowId,
                                flowName: obj.flowName,
                                processId: raw[key].id,
                                processName: raw[key].name,
                                processType: raw[key].type,
                                instanceCount: raw[key].properties.instance.count,
                                instanceMin: raw[key].properties.instance.min,
                                bpId: raw[key].properties.bpid,
                                delayTime: raw[key].properties.delayTime,
                                parameter: raw[key].properties.parameter,
                                runOnStart: raw[key].properties.runOnStart,
                                properties: raw[key].properties
                            });
                        }
                    }
                }

                $this.grid.data = [];
                for(let i = 0; i < processList.length; i++) {
                    $this.grid.el.addRowData(i, processList[i]);
                    $this.grid.data.push(processList[i]);
                }

                $this.grid.el.trigger("reloadGrid")
            })
            .catch(e => {
                _ShowErrorAfterLoading('서버와 연결을 하지 못했습니다.');
                console.error(e);
            })
            .finally( () => {
                _HideLoading();
            });
    },

    /**
     * 엑셀 다운로드 기능
     * @param $this: Vue Instance
     */
    ExcelDownload($this) {
        if ($this.grid.data.length < 1) {
            _ShowWarning("조회된 내용이 없습니다.");
            return;
        }

        const reqParam = {
            projectId : $this.projectId,
            serverId : $this.selectBox.serverVal,
            flowId : $this.selectBox.flowVal,
            flowGroupId : $this.selectBox.flowGroupVal
        };
        const data = {
            queryType: "commonData",
            tag: "commonSearchProcess",
            params: reqParam,
            config: {
                pageName: "Flow/Process",
                title: "Flow/Process",
                fileName: "FlowProcess",
                columns: [
                    { title: "Server Name", field: "serverName", type: "text" },
                    { title: "Flow Group Name", field: "groupName", type: "text" },
                    { title: "Flow Name", field: "flowName", type: "text" },
                    { title: "Process Name", field: "processName", type: "text" },
                    { title: "InstanceCount", field: "instanceCount", type: "text" },
                    { title: "Start time", field: "startTime", type: "text" },
                    { title: "End time", field: "endTime", type: "text" }
                ]
            }
        };

        _ShowConfirm("엑셀다운로드를 할까요?", () => {
            const excelExport = new ExcelExport(data.queryType, data.tag, data.params);
            excelExport.export(data.config);

            _CloseConfirm();
        });
    },

    /**
     * 웹소켓 상태 변경
     * @param $this: Vue Instance
     * @param status: 상태(start or stop)
     * @param command: WebSocket에 넘길 파라미터
     */
    ChangeStatus($this, status, command) {
        try {
            if(!command) throw new Error('Websocket command is not valid.')

            this.SendCommand($this,`/app/command/${status}/${command.server}`, command);

            if (command.level !== 'processor') {
                this.SaveServerMessage($this, status, command);
            }
        } catch (e) {
            _ShowErrorAfterLoading(e.message);
            console.error(e);
        }
    },

    /**
     * 웹소켓으로 커맨드 전달
     * @param $this: Vue Instance
     * @param uri: 전달할 경로
     * @param command: 전달할 파라미터
     * @param type: 최초 진입 시 Polling을 한 곳으로
     */
    SendCommand($this, uri, command, type) {
        if ($this.socket.stompClient === null) {
            console.error("The transmission channel is not activated.");
            return _ShowErrorAfterLoading("Arkruz oAgent Connection Error!!");
        }

        if (__DEBUG) {
            console.log('=========================================================');
            console.log('Send command: ' , command);
            console.log('Send uri: ' , uri);
            console.log('Click: ' , new Date());
            console.log('=========================================================');
        }

        $this.socket.stompClient.send(uri, {}, JSON.stringify(command));
    },

    /**
     * 컨텍스트 메뉴 생성
     * @param $this: Vue Instance
     * @param range: 범위(Project, Server, Flow, Process, Instance)
     * @param selector: 컨텍스트 메뉴를 만들 선택자
     * @param callback: status에 실행할 콜백
     */ 
    SetContextMenu($this, range, selector, callback) {
        const oThis = this;
        const lazyPolling = () => {
            setTimeout(() => {
                this.CallWorker($this);
            }, 5000);
        };
 
        const items = {
            'start': {
                name: 'Start',
                disabled() {
                    let rtnFlag = false;

                    if ($(this).hasClass('running')) rtnFlag = true;
                    oThis.cnt = 0;
                    return rtnFlag;
                },
                callback(key, opt) {
                    if (!$this.socket.isFirstConnected) oThis.ConnectToWebSocket($this);
                    const rtnData = callback(key, opt, status);
                    let command = null;
                    let name = null;
                    let min = 0;
                    const em = opt.$trigger[0].childNodes[0];
                    const currentTarget = opt.$trigger[0];
                    if (currentTarget.classList.contains('instance')) {
                        if (em.classList.contains('running')) {
                            return;
                        }
                    }
                    let iterCnt = 0;

                    if (key === 'start' && currentTarget.classList.contains('process')) {
                        const processLi = opt.$trigger[0]
                        const instanceList = processLi.querySelectorAll('li.instance');
                        console.log(instanceList);
                        instanceList.forEach(instance => {
                            const em = instance.childNodes[0];
                            console.log(instance);
                            if (em.classList.contains('running')) {
                                iterCnt++;
                            }
                            console.log(iterCnt);
                        })
                    }

                    if (Array.isArray(rtnData)) {
                        if(rtnData.length > 0) min = rtnData[0].min;
                        console.log(rtnData);
                        for (let i = 0; i < (min - iterCnt); i++) {
                       // for (let i = 0; i < rtnData.length; i++) {
                            const param = rtnData[i];
                            command = param.command;
                            name = param.name;

                            console.log(command);

                            oThis.ChangeStatus($this, name, command);
                        }
                    } else {
                        command = rtnData.command;
                        name = rtnData.name;
                        console.log(command);

                        oThis.ChangeStatus($this, name, command);
                    }
 
                    if (command !== null) {
                        if (command.range === 'processor' || command.range === 'instance') {
                            lazyPolling();
                        }
                    }
                },
            },
            'stop': {
                name: 'Stop',
                disabled() {
                    let rtnFlag = false;

                    if ($(this).hasClass('running')) rtnFlag = true;

                    return rtnFlag;
                },
                callback(key, opt) {
                    if (!$this.socket.isFirstConnected) oThis.ConnectToWebSocket($this);
                    const rtnData = callback(key, opt, status);
                    let command = null;
                    let name = null;
                    let min = 0;
                    const em = opt.$trigger[0].childNodes[0];
                    const currentTarget = opt.$trigger[0];
                    if (currentTarget.classList.contains('instance')) {
                        if (em.classList.contains('stop') || em.classList.contains('waiting')) {
                            return;
                        }
                    }

                    let iterCnt = 0;

                    if (key === 'start' && currentTarget.classList.contains('process')) {
                        const processLi = opt.$trigger[0]
                        const instanceList = processLi.querySelectorAll('li.instance');

                        instanceList.forEach(instance => {
                            const em = instance.childNodes[0];

                            if (em.classList.contains('running')) {
                                iterCnt++;
                            }
                        })
                    }

                    if (Array.isArray(rtnData)) {
                        if(rtnData.length > 0) min = rtnData[0].min;

                        for (let i = 0; i < (min - iterCnt); i++) {
                        //for (let i = 0; i < rtnData.length; i++) {
                            const param = rtnData[i];
                            command = param.command;
                            name = param.name;

                            console.log(command);

                            oThis.ChangeStatus($this, name, command);
                        }
                    } else {
                        command = rtnData.command;
                        name = rtnData.name;
                        console.log(command);

                        oThis.ChangeStatus($this, name, command);
                    }

                    if (command.range === 'processor' || command.range === 'instance') {
                        lazyPolling();
                    }
                },
            },
            'status': {
                name: 'Status',
                disabled() {
                    let rtnFlag = false;

                    if ($(this).hasClass('running')) rtnFlag = true;

                    return rtnFlag;
                },
                callback(key, opt) {
                    if (!$this.socket.isFirstConnected) oThis.ConnectToWebSocket($this);
                    const rtnData = callback(key, opt, status);
                    let command = null;
                    let name = null;
                    let min = 0;
                    if (Array.isArray(rtnData)) {
                        if(rtnData.length > 0) min = rtnData[0].min;

                        for (let i = 0; i < rtnData.length; i++) {
                            const param = rtnData[i];
                            command = param.command;
                            name = param.name;

                            console.log(command);

                            oThis.ChangeStatus($this, name, command);
                        }
                    } else {
                        command = rtnData.command;
                        name = rtnData.name;
                        console.log(command);

                        oThis.ChangeStatus($this, name, command);
                    }

                    if (command.range === 'processor' || command.range === 'instance') {
                        lazyPolling();
                    }
                },
            }
        };

        if (range === "server") {
            items.reload = {
                name: 'Reload',
                disabled() {
                    let rtnFlag = false;

                    if ($(this).hasClass('running')) rtnFlag = true;
                    oThis.cnt = 0;
                    return rtnFlag;
                },
                callback(key, opt) {
                    if (!$this.socket.isFirstConnected) oThis.ConnectToWebSocket($this);

                    const {command, name} = callback(key, opt, status);

                    command.command = 'reload';

                    console.log(command);
                    oThis.ChangeStatus($this, name, command);
                    lazyPolling();
                },
            };
            items.init_status = {
                name: 'Init Status',
                disabled() {
                    let rtnFlag = false;

                    if ($(this).hasClass('running')) rtnFlag = true;
                    oThis.cnt = 0;
                    return rtnFlag;
                },
                callback(key, opt) {
                    if (!$this.socket.isFirstConnected) oThis.ConnectToWebSocket($this);

                    const {command, name} = callback(key, opt, status);

                    command.command = 'init_status';

                    console.log(command);
                    oThis.ChangeStatus($this, name, command);
                }
            }
        } else if (range === 'flow') {
            items.init_status = {
                name: 'Init Status',
                disabled() {
                    let rtnFlag = false;

                    if ($(this).hasClass('running')) rtnFlag = true;
                    oThis.cnt = 0;
                    return rtnFlag;
                },
                callback(key, opt) {
                    if (!$this.socket.isFirstConnected) oThis.ConnectToWebSocket($this);

                    const {command, name} = callback(key, opt, status);

                    command.command = 'init_status';

                    console.log(command);
                    oThis.ChangeStatus($this, name, command);
                }
            }
        } else if (range === "process") {
            items.init_status = {
                name: 'Init Status',
                disabled() {
                    let rtnFlag = false;

                    if ($(this).hasClass('running')) rtnFlag = true;
                    oThis.cnt = 0;
                    return rtnFlag;
                },
                callback(key, opt) {
                    if (!$this.socket.isFirstConnected) oThis.ConnectToWebSocket($this);
                    const rtnData = callback(key, opt, status);
                    let command = null;
                    let name = null;
                    let min = 0;
                    if (Array.isArray(rtnData)) {
                        if(rtnData.length > 0) min = rtnData[0].min;

                        for (let i = 0; i < rtnData.length; i++) {
                            const param = rtnData[i];
                            command = param.command;
                            name = param.name;
                            command.command = 'init_status';
                            console.log(command);

                            oThis.ChangeStatus($this, name, command);
                        }
                    } else {
                        command = rtnData.command;
                        name = rtnData.name;
                        command.command = 'init_status';
                        console.log(command);

                        oThis.ChangeStatus($this, name, command);
                    }

                    lazyPolling();
                }
            }
        } else if (range === "instance") {
            items.init_status = {
                name: 'Init Status',
                disabled() {
                    let rtnFlag = false;

                    if ($(this).hasClass('running')) rtnFlag = true;
                    oThis.cnt = 0;
                    return rtnFlag;
                },
                callback(key, opt) {
                    if (!$this.socket.isFirstConnected) oThis.ConnectToWebSocket($this);

                    const {command, name} = callback(key, opt, status);

                    command.command = 'init_status';

                    console.log(command);
                    oThis.ChangeStatus($this, name, command);

                    lazyPolling();
                }
            }
        }

        $.contextMenu({
            selector: selector,
            trigger: 'right',
            items: items
        });
    },

    /**
     * 웹소켓에 연결하는 메서드
     * @param: @this: Vue Instance
     */
    ConnectToWebSocket($this) {
        const socket = new SockJS(`${__ServerURL}/command`);
        const command = {project: $this.projectId};

        $this.socket.stompClient = Stomp.over(socket);
        $this.socket.stompClient.debug = null;

        /* APP에서 subscribe할 필요 없음 */
        $this.socket.stompClient.connect({}, () => {});

        $this.socket.isFirstConnected = true;
        $this.socket.isConnectedWithOAgent = true;
    },

    /**
     * 좌측 사이드 바의 트리구조를 만드는 함수
     * @param $this: Vue Instance
     */
    SetSideTree($this) {
        const param = {projectId: $this.projectId};
        _ShowLoading('좌측 트리의 데이터를 로드하고 있습니다.');

        // Service 가져오기
        commandInQuerySelect(param, 'commonData', 'commonService')
            .then(({res, rows}) => { // Service
                if (!res) throw new Error('서버와 연결 하지 못했습니다.');
                const row = rows[0];

                Object.assign($this.temp.tree.flowGroup, row);

                // Server 가져오기
                return commandInQuerySelect(param, 'commonData', 'commonSearchServer');
            })
            .then(({res, rows}) => {
                if (!res) throw new Error('서버와 연결 하지 못했습니다.');

                $this.temp.tree.flowGroup.server = rows;

                $this.temp.tree.flowGroup.server.sort((a, b) => {
                    return a.serverName - b.serverName;
                });
                // Flow 가져오기
                return commandInQuerySelect(param, 'commonData', 'commonFlow');
            })
            .then(({res, rows}) => { // Flow
                if (!res) throw new Error('서버와 연결 하지 못했습니다.');

                for (const server of $this.temp.tree.flowGroup.server) {
                    const {serverId} = server;

                    for (const row of rows) {
                        const flowServerId = row.serverId

                        if (flowServerId === serverId) {
                            if (server.flow === undefined) server.flow = [];

                            server.flow.push(row);
                        }
                    }

                    server.flow.sort((a, b) => {
                        return a.flowGroupId - b.flowGroupId;
                    });
                }

                // Process 가져오기
                return commandInQuerySelect(param, 'commonData', 'commonProcessOnlyProjectId');
            })
            .then(({res, rows}) => { // Process
                if (!res) throw new Error('서버와 연결 하지 못했습니다.');

                for (const server of $this.temp.tree.flowGroup.server) {
                    const {serverId} = server;

                    for (const flow of server.flow) {
                        const {flowId} = flow;

                        for (const row of rows) {
                            const rowServerId = row.serverId;
                            const rowFlowId = row.flowId;

                            if (serverId === rowServerId && flowId === rowFlowId) {
                                const raw = JSON.parse(row.raw);

                                for (const key in raw) {
                                    const type = raw[key].type;

                                    if (flow.process === undefined) flow.process = [];

                                    if (type !== "KafkaChannel" ) { // type !== "MskChannel"
                                        const {count} = raw[key].properties.instance;
                                        const bpid = raw[key].properties.bpid;

                                        raw[key].properties.instance.instance = [];

                                        for (let i = 0; i <= count; i++) {   //인스턴스 숫자  let i = 0
                                            raw[key].properties.instance.instance.push({
                                                name: i,
                                                status: '',
                                                description: '',
                                                flowId: flowId,
                                                serverId: serverId,
                                                processName: raw[key].name,
                                                projectId: $this.view.tree.flowGroup.projectId,
                                                bpId: Number(bpid)
                                            });
                                        }

                                        flow.process.push(raw[key]);
                                    }
                                }
                            }
                        }
                    }
                }

                this.SetSideProcessType($this);
            })
            .catch(e => {
                _ShowErrorAfterLoading('서버와 연결을 하지 못했습니다.');
                console.error(e);
            });
    },

    /**
     * 좌측 사이드 바의 ProcessType을 만드는 함수
     * @param $this
     */
    SetSideProcessType($this) {
        const param = {projectId: $this.projectId};
        _ShowLoading('좌측 트리의 데이터를 로드하고 있습니다..');

        commandCustom("/flowDesign/components.do", {})
            .then(data => {
                const keys = Object.keys(data);

                if (data.length < 1) throw new Error('조회된 정보가 없습니다');

                $this.view.tree.processType = {};

                for (const key in data) {
                    const label = data[key].label;

                    if (key === 'MskChannel') continue;
                    if (key === 'DefaultMessageStore') continue;

                    $this.view.tree.processType[key] = {
                        status: '',
                        process: [],
                        label
                    };
                }

                for (const server of $this.temp.tree.flowGroup.server) {
                    const {serverName, serverId} = server;

                    if(server.flow === undefined) continue;
                    for (const flow of server.flow) {
                        const {flowId, flowGroupId} = flow;

                        if(flow.process === undefined) continue;
                        for (const process of flow.process) {
                            const {type, id, name} = process;
                            const {instance, bpid} = process.properties;
                            const {count, min} = instance;

                            $this.view.tree.processType[type].process.push({
                                name: `${server.serverName} - ${flow.flowName}`,
                                bpid,
                                min,
                                serverName,
                                flowId,
                                processId: id,
                                processName: name,
                                instance: [],
                                count,
                                flowGroupId,
                                serverId
                            });
                        }
                    }
                }

                for(const type in $this.view.tree.processType) {

                    for (const proc of $this.view.tree.processType[type].process) {
                        const {count, instance, url, bpid, processId, serverId, serverName, processName} = proc;

                        for (let i = 0; i <= count; i++) {
                            instance.push({
                                processName: processName,
                                processId: processId,
                                bpId: bpid,
                                url: url,
                                instanceId: i,
                                serverName: serverName,
                                serverId: serverId,
                                status: ''
                            });
                        }
                    }
                }

                if (__DEBUG) console.log('Process-Type Tree : ', $this.view.tree.processType);

                this.CallWorker($this);
                this.SearchBlock($this);
                this.SetEventInSideBar($this);
            })
            .catch(e => {
                _ShowErrorAfterLoading('process icon 정보를 가져오지 못했습니다.');
                console.error(e);
            });
    },

    /**
     * SideBar에 이벤트를 등록하는 함수
     * @param $this: Vue Instance
     */
    SetEventInSideBar($this) {
        const oThis = this;
        const lazyPolling = () => {
            setTimeout(() => {
                this.CallWorker($this);
            }, 5000);
        };

        // processType > processType
        $.contextMenu({
            selector: 'li.processType.type',
            trigger: 'right',
            items: {
                'start': {
                    name: 'Start',
                    disabled() {
                        let rtnFlag = false;

                        if ($(this).hasClass('running')) rtnFlag = true;
                        return rtnFlag;
                    },
                    callback(key, opt) {
                        const currentTarget = opt.$trigger[0];
                        const processList = currentTarget.querySelectorAll('li.process');

                        const commandArr = [];
                        for (const process of processList) {
                            const min = Number(process.getAttribute('data-min'));
                            const instanceList = process.querySelectorAll('li.processType.instance');

                            for (let i = 0; i < min; i++) {
                                const instance = instanceList[i];
                                const serverName = instance.getAttribute("data-serverName");
                                const flowId = instance.getAttribute("data-flowId");
                                const processName = instance.getAttribute("data-processName");
                                const instanceId = instance.getAttribute("data-instanceId");
                                //const bpId = instance.getAttribute("data-bpId");
                                //const groupId = instance.getAttribute("data-flowGroupId");
                                const serverId = instance.getAttribute('data-serverId');
                                const properties = instance.getAttribute('data-properties');
                                const command = {
                                    project: $this.projectId,
                                    server: serverName,
                                    flow: flowId,
                                    processor: processName,
                                    instance: instanceId,
                                    range: "instance",
                                    GROUP_ID: groupId,
                                    LSYSTEM_ID: serverName,
                                    Properties : properties,
                                    BP_ID: bpId,
                                    serverId
                                };
                                command.level = 'processor';

                                commandArr.push(command);
                                oThis.ChangeStatus($this, key, command);

                                if (i === (instanceList.length - 1)) {
                                    oThis.SaveServerMessage($this, key, command);
                                }
                            }
                        }

                        console.log(commandArr);
                        lazyPolling();
                    },
                },
                'stop': {
                    name: 'Stop',
                    disabled() {
                        let rtnFlag = false;

                        if ($(this).hasClass('running')) rtnFlag = true;
                        return rtnFlag;
                    },
                    callback(key, opt) {
                        const currentTarget = opt.$trigger[0];
                        const processList = currentTarget.querySelectorAll('li.process');
                        const commandArr = [];

                        for (const process of processList) {
                            const instanceList = process.querySelectorAll('li.processType.instance');


                            for (let i = 0; i < instanceList.length; i++) {
                                const instance = instanceList[i];
                                const serverName = instance.getAttribute("data-serverName");
                                const flowId = instance.getAttribute("data-flowId");
                                const processName = instance.getAttribute("data-processName");
                                const instanceId = instance.getAttribute("data-instanceId");
                                const bpId = instance.getAttribute("data-bpId");
                                const groupId = instance.getAttribute("data-flowGroupId");
                                const serverId = currentTarget.getAttribute('data-serverId');
                                const properties = instance.getAttribute('data-properties');
                                const command = {
                                    project: $this.projectId,
                                    server: serverName,
                                    flow: flowId,
                                    processor: processName,
                                    instance: instanceId,
                                    range: "instance",
                                    GROUP_ID: groupId,
                                    LSYSTEM_ID: serverName,
                                    Properties: properties,
                                    BP_ID: bpId,
                                    serverId
                                };
                                command.level = 'processor';

                                commandArr.push(command);
                                oThis.ChangeStatus($this, key, command);

                                if (i === (instanceList.length - 1)) {
                                    oThis.SaveServerMessage($this, key, command);
                                }
                            }
                        }

                        console.log(commandArr);
                        lazyPolling();
                    },
                },
                'status': {
                    name: 'Status',
                    disabled() {
                        let rtnFlag = false;

                        if ($(this).hasClass('running')) rtnFlag = true;
                        return rtnFlag;
                    },
                    callback(key, opt) {
                        const currentTarget = opt.$trigger[0];
                        const processList = currentTarget.querySelectorAll('li.process');

                        const commandArr = [];
                        for (const process of processList) {
                            const instanceList = process.querySelectorAll('li.processType.instance');


                            for (let i = 0; i < instanceList.length; i++) {
                                const instance = instanceList[i];
                                const serverName = instance.getAttribute("data-serverName");
                                const flowId = instance.getAttribute("data-flowId");
                                const processName = instance.getAttribute("data-processName");
                                const instanceId = instance.getAttribute("data-instanceId");
                                const bpId = instance.getAttribute("data-bpId");
                                const groupId = instance.getAttribute("data-flowGroupId");
                                const serverId = currentTarget.getAttribute('data-serverId');
                                const properties = instance.getAttribute('data-properties');

                                const command = {
                                    project: $this.projectId,
                                    server: serverName,
                                    flow: flowId,
                                    processor: processName,
                                    instance: instanceId,
                                    range: "instance",
                                    GROUP_ID: groupId,
                                    LSYSTEM_ID: serverName,
                                    Properties: properties,
                                    BP_ID: bpId,
                                    serverId
                                };
                                command.level = 'processor';

                                commandArr.push(command);
                                oThis.ChangeStatus($this, key, command);

                                if (i === (instanceList.length - 1)) {
                                    oThis.SaveServerMessage($this, key, command);
                                }
                            }
                        }

                        console.log(commandArr);
                        lazyPolling();
                    },
                },
                init_status: {
                    name: 'Init Stauts',
                    disabled() {
                        let rtnFlag = false;

                        if ($(this).hasClass('running')) rtnFlag = true;
                        return rtnFlag;
                    },
                    callback(key, opt) {
                        const currentTarget = opt.$trigger[0];
                        const processList = currentTarget.querySelectorAll('li.process');

                        const commandArr = [];
                        for (const process of processList) {
                            const instanceList = process.querySelectorAll('li.processType.instance');


                            for (let i = 0; i < instanceList.length; i++) {
                                const instance = instanceList[i];
                                const serverName = instance.getAttribute("data-serverName");
                                const flowId = instance.getAttribute("data-flowId");
                                const processName = instance.getAttribute("data-processName");
                                const instanceId = instance.getAttribute("data-instanceId");
                                const bpId = instance.getAttribute("data-bpId");
                                const groupId = instance.getAttribute("data-flowGroupId");
                                const serverId = currentTarget.getAttribute('data-serverId');
                                const properties = instance.getAttribute('data-properties');

                                const command = {
                                    project: $this.projectId,
                                    server: serverName,
                                    flow: flowId,
                                    processor: processName,
                                    instance: instanceId,
                                    range: "instance",
                                    GROUP_ID: groupId,
                                    LSYSTEM_ID: serverName,
                                    BP_ID: bpId,
                                    Properties: properties,
                                    serverId
                                };
                                command.level = 'processor';

                                commandArr.push(command);
                                oThis.ChangeStatus($this, key, command);

                                if (i === (instanceList.length - 1)) {
                                    oThis.SaveServerMessage($this, key, command);
                                }
                            }
                        }

                        console.log(commandArr);
                        lazyPolling();
                    },
                }
            }
        })

        // processType > process
        $.contextMenu({
            selector: 'li.processType.process',
            trigger: 'right',
            items: {
                'start': {
                    name: 'Start',
                    disabled() {
                        let rtnFlag = false;

                        if ($(this).hasClass('running')) rtnFlag = true;
                        return rtnFlag;
                    },
                    callback(key, opt) {
                        const currentTarget = opt.$trigger[0];
                        const min = Number(currentTarget.getAttribute('data-min'));
                        const instanceList = currentTarget.querySelectorAll('li.processType.instance');
                        const commandArr = [];

                        for (let i = 0; i < min; i++) {
                            const instance = instanceList[i];
                            const serverName = instance.getAttribute("data-serverName")
                            const flowId = instance.getAttribute("data-flowId")
                            const processName = instance.getAttribute("data-processName")
                            const instanceId = instance.getAttribute("data-instanceId");
                            const bpId = instance.getAttribute("data-bpId");
                            const groupId = instance.getAttribute("data-flowGroupId");
                            const serverId = currentTarget.getAttribute('data-serverId');
                            const properties = instance.getAttribute('data-properties');
                            const command = {
                                project: $this.projectId,
                                server: serverName,
                                flow: flowId,
                                processor: processName,
                                instance: instanceId,
                                range: "instance",
                                GROUP_ID: groupId,
                                LSYSTEM_ID: serverName,
                                BP_ID: bpId,
                                Properties: properties,
                                serverId
                            };
                            command.level = 'processor';

                            commandArr.push(command);
                            oThis.ChangeStatus($this, key, command);

                            if (i === (instanceList.length - 1)) {
                                oThis.SaveServerMessage($this, key, command);
                            }
                        }
                        lazyPolling();
                        console.log(commandArr);
                    },
                },
                'stop': {
                    name: 'Stop',
                    disabled() {
                        let rtnFlag = false;

                        if ($(this).hasClass('running')) rtnFlag = true;
                        return rtnFlag;
                    },
                    callback(key, opt) {
                        const currentTarget = opt.$trigger[0];
                        const instanceList = currentTarget.querySelectorAll('li.processType.instance');
                        const commandArr = [];

                        for (let i = 0; i < instanceList.length; i++) {
                            const instance = instanceList[i];
                            const serverName = instance.getAttribute("data-serverName")
                            const flowId = instance.getAttribute("data-flowId")
                            const processName = instance.getAttribute("data-processName")
                            const instanceId = instance.getAttribute("data-instanceId");
                            const bpId = instance.getAttribute("data-bpId");
                            const groupId = instance.getAttribute("data-flowGroupId");
                            const serverId = currentTarget.getAttribute('data-serverId');
                            const properties = instance.getAttribute('data-properties');

                            const command = {
                                project: $this.projectId,
                                server: serverName,
                                flow: flowId,
                                processor: processName,
                                instance: instanceId,
                                range: "instance",
                                GROUP_ID: groupId,
                                LSYSTEM_ID: serverName,
                                BP_ID: bpId,
                                Properties: properties,
                                serverId
                            };
                            command.level = 'processor';

                            commandArr.push(command);
                            oThis.ChangeStatus($this, key, command);
                            if (i === (instanceList.length - 1)) {
                                oThis.SaveServerMessage($this, key, command);
                            }
                        }
                        lazyPolling();
                        console.log(commandArr);
                    },
                },
                'status': {
                    name: 'Status',
                    diabled() {
                        let rtnFlag = false;

                        if ($(this).hasClass('running')) rtnFlag = true;
                        return rtnFlag;
                    },
                    callback(key, opt) {
                        const currentTarget = opt.$trigger[0];
                        const instanceList = currentTarget.querySelectorAll('li.processType.instance');
                        const commandArr = [];

                        for (let i = 0; i < instanceList.length; i++) {
                            const instance = instanceList[i];
                            const serverName = instance.getAttribute("data-serverName")
                            const flowId = instance.getAttribute("data-flowId")
                            const processName = instance.getAttribute("data-processName")
                            const instanceId = instance.getAttribute("data-instanceId");
                            const bpId = instance.getAttribute("data-bpId");
                            const groupId = instance.getAttribute("data-flowGroupId");
                            const serverId = currentTarget.getAttribute('data-serverId');
                            const properties = instance.getAttribute('data-properties');

                            const command = {
                                project: $this.projectId,
                                server: serverName,
                                flow: flowId,
                                processor: processName,
                                instance: instanceId,
                                range: "instance",
                                GROUP_ID: groupId,
                                LSYSTEM_ID: serverName,
                                BP_ID: bpId,
                                Properties: properties,
                                serverId
                            };
                            command.level = 'processor';

                            commandArr.push(command);
                            oThis.ChangeStatus($this, key, command);

                            if (i === (instanceList.length - 1)) {
                                oThis.SaveServerMessage($this, key, command);
                            }
                        }
                        lazyPolling();
                        console.log(commandArr);
                    },
                },
                'init_status': {
                    name: 'Init Status',
                    disabled() {
                        let rtnFlag = false;

                        if ($(this).hasClass('running')) rtnFlag = true;
                        return rtnFlag;
                    },
                    callback(key, opt) {
                        const currentTarget = opt.$trigger[0];
                        const instanceList = currentTarget.querySelectorAll('li.processType.instance');
                        const commandArr = [];

                        for (let i = 0; i < instanceList.length; i++) {
                            const instance = instanceList[i];
                            const serverName = instance.getAttribute("data-serverName");
                            const flowId = instance.getAttribute("data-flowId");
                            const processName = instance.getAttribute("data-processName");
                            const instanceId = instance.getAttribute("data-instanceId");
                            const bpId = instance.getAttribute("data-bpId");
                            const groupId = instance.getAttribute("data-flowGroupId");
                            const serverId = currentTarget.getAttribute('data-serverId');
                            const properties = instance.getAttribute('data-properties');
                            const command = {
                                project: $this.projectId,
                                server: serverName,
                                flow: flowId,
                                processor: processName,
                                instance: instanceId,
                                range: "instance",
                                GROUP_ID: groupId,
                                LSYSTEM_ID: serverName,
                                BP_ID: bpId,
                                Properties: properties,
                                serverId
                            };
                            command.level = 'processor';

                            commandArr.push(command);
                            oThis.ChangeStatus($this, key, command);

                            if (i === (instanceList.length - 1)) {
                                oThis.SaveServerMessage($this, key, command);
                            }
                        }
                        lazyPolling();
                        console.log(commandArr);
                    }
                }
            }
        });

        // processType > instance
        this.SetContextMenu($this, 'instance', 'li.processType.instance',
            (key, opt, name) => {
                const currentTarget = opt.$trigger[0];
                const serverName = currentTarget.getAttribute("data-serverName");
                const serverId = currentTarget.getAttribute('data-serverId');
                const flowId = currentTarget.getAttribute("data-flowId");
                const processName = currentTarget.getAttribute("data-processName");
                const instanceId = currentTarget.getAttribute("data-instanceId");
                const bpId = currentTarget.getAttribute("data-bpId");
                const groupId = currentTarget.getAttribute("data-flowGroupId");
                const properties = currentTarget.getAttribute('data-properties');

                return {
                    command: {
                        project: $this.projectId,
                        server: serverName,
                        flow: flowId,
                        processor: processName,
                        instance: instanceId,
                        range: "instance",
                        GROUP_ID: groupId,
                        LSYSTEM_ID: serverName,
                        BP_ID: bpId,
                        Properties: properties,
                        serverId
                    },
                    name: key
                };
            });

        // // Project
        // this.SetContextMenu($this, 'project', 'h4.project',
        //     (key, opt, name) => {
        //         const currentTarget = opt.$trigger[0];
        //
        //         const command = {
        //             project: $this.projectId,
        //             range: 'project',
        //         };
        //
        //         console.log(command);
        //         this.ChangeStatus($this, name, command);
        //         return $(opt.$trigger[0]);
        //     });

        // Server
        this.SetContextMenu($this, 'server', 'li.flowGroup.server',
            (key, opt, name) => {
                const currentTarget = opt.$trigger[0];
                const serverName = currentTarget.getAttribute("data-serverName");
                const serverId = currentTarget.getAttribute('data-serverId');

                return {
                    command: {
                        project: $this.projectId,
                        server: serverName,
                        range: 'server',
                        LSYSTEM_ID: serverName,
                        serverId,
                        level: 'server',
                    },
                    name: key
                }
            });

        // Flow
        this.SetContextMenu($this, 'flow', 'li.flowGroup.flow',
            (key, opt, name) => {
                const currentTarget = opt.$trigger[0];
                const serverName = currentTarget.getAttribute("data-serverName");
                const flowId = currentTarget.getAttribute("data-flowId")
                const processName = currentTarget.getAttribute("data-processName")
                const groupId = currentTarget.getAttribute('data-flowGroupId');
                const serverId = currentTarget.getAttribute('data-serverId');

                return {
                    command: {
                        project: $this.projectId,
                        server: serverName,
                        flow: flowId,
                        range: "flow",
                        GROUP_ID: groupId,
                        LSYSTEM_ID: serverName,
                        process: processName,
                        serverId,
                        level: 'flow',
                    },
                    name: key
                };
            });

        // Process
        this.SetContextMenu($this, 'process', 'li.flowGroup.process',
            (key, opt, name) => {
                const currentTarget = opt.$trigger[0];
                const processLi = opt.$trigger[0];
                const instanceList = processLi.querySelectorAll('li.instance');
                const min = processLi.getAttribute('data-min');
                const sendProcessParamArr = [];

                for (let i = 0; i < instanceList.length; i++) {
                    const instance = instanceList[i];
                    const serverName = instance.getAttribute("data-serverName");
                    const flowId = instance.getAttribute("data-flowId")
                    const processName = instance.getAttribute("data-processName")
                    const instanceNo = instance.getAttribute("data-instanceName");
                    const groupId = instance.getAttribute('data-flowGroupId');
                    const bpId = instance.getAttribute('data-bpId');
                    const serverId = currentTarget.getAttribute('data-serverId');
                    const properties = instance.getAttribute('data-properties');
                    const command = {
                        project: $this.projectId,
                        server: serverName,
                        flow: flowId,
                        processor: processName,
                        instance: instanceNo,
                        range: "instance",
                        GROUP_ID: groupId,
                        LSYSTEM_ID: serverName,
                        BP_ID: bpId,
                        Properties: properties,
                        serverId
                    };
                    command.level = 'processor';

                    sendProcessParamArr.push({
                        command,
                        min,
                        name: key
                    });

                    if (i === (instanceList.length - 1)) {
                        oThis.SaveServerMessage($this, key, command);
                    }
                }

                return sendProcessParamArr;
            });

        // Instance
        this.SetContextMenu($this, 'instance', 'li.flowGroup.instance',
            (key, opt, name) => {
                const currentTarget = opt.$trigger[0];
                const serverName = currentTarget.getAttribute("data-serverName");
                const flowId = currentTarget.getAttribute("data-flowId")
                const processName = currentTarget.getAttribute("data-processName")
                const instanceNo = currentTarget.getAttribute("data-instanceName");
                const groupId = currentTarget.getAttribute('data-flowGroupId');
                const bpId = currentTarget.getAttribute('data-bpId');
                const serverId = currentTarget.getAttribute('data-serverId');
                const properties = currentTarget.getAttribute('data-properties');

                return {
                    command: {
                        project: $this.projectId,
                        server: serverName,
                        flow: flowId,
                        processor: processName,
                        instance: instanceNo,
                        range: "instance",
                        GROUP_ID: groupId,
                        LSYSTEM_ID: serverName,
                        BP_ID: bpId,
                        Properties: properties,
                        serverId
                    },
                    name: key
                }
            });
    },

    OnResume() {
    },

    /**
     * 해당 화면에서 떠날 때
     * vm을 초기화 및 웹소켓 disconnected
     */
    OnDisappear() {
        if (this.vm !== null) { /* Vue Instance 초기화 */
            this.vm.socket.stompClient.unsubscribe();
            this.vm.socket.stompClient.disconnect();
            clearInterval(this.vm.socket.polling);
            this.vm.socket.worker.terminate();
            this.vm = null;
            this.cnt = 0;
        }
    },

    /**
     * Desinger가 그려지지 않은 경우에 한해 Desinger를 그림
     * @param $this: Vue Instance
     * @param callback: Function
     */
    DrawFlowDesigner($this, callback) {
        if ($this.designer.flowDesigner === null) {
            const interval = setInterval(() => {
                const canvas = $(`#${this.prefix}canvas`);

                if (canvas.height() > 0) { /* 가상 돔 반영 시간을 위하여*/
                    $this.designer.flowDesigner = new konvaDesigner(this, 'canvas');
                    this.GetProcessIcon($this);

                    if(typeof callback === 'function') callback();

                    clearInterval(interval);
                }
            }, 100);
        }
    },

    /**
     * processIcon setting
     * @param $this: Vue Instance
     */
    GetProcessIcon($this) {
        commandCustom("/flowDesign/components.do", {})
            .then((data) => {
                if (Object.keys(data).length > 0) {
                    $this.designer.engineData = data;

                    for (const [key, value] of Object.entries(data)) {
                        // asis에 안나오는거 제거
                        if (key === "MskChannel" || key === "DefaultMessageStore") {
                            continue;
                        }

                        $this.designer.engineProcess.push(value);
                    }

                    $this.designer.flowDesigner.engineData = $this.designer.engineData;
                    // this.SetCanvasStyle();
                } else {
                    _ShowError("process icon 정보를 가져오지 못했습니다.");
                }
            })
            .catch((err) => {
                _ShowErrorAfterLoading(__ServerNotConnectMSG);
                console.error(err);
            });
    },

    /**
     * Flow Desinger에 해당 값을 넣어줌
     * @param $this : Vue Instance
     */
    SearchDiagram($this) {
        const projectId = $this.projectId;
        const serverId = $this.serverId;
        const flowId = $this.flowId;
        console.log(projectId, ' ', serverId, ' ', flowId, ' ')
        /* ProjectId, ServerId, FlowId가 없을 때는 Grid가 실행되지 않도록 */
        if (projectId === null || serverId === null || flowId === null || projectId === '' ) {
            return;
        }

        if (serverId === '' || flowId === '') {
            return $this.designer.flowDesigner.Clear();
        }

        const param = {projectId, flowId, versionId: ''};

        commandInQuerySelect(param, "flowDesign", "getFlowDesignSearch")
            .then(({res, rows, msg}) => {

                if (!res) return _ShowErrorAfterLoading("데이터를 가져오지 못했습니다.");

                let rowsComponent = null;
                let rowsInOutInfo = null;
                let rowsConnection = [];
                const startEndProcess = [];

                let wholeDesignObj = {};
                const inOutInfo = {connectors: []};
                const connectors = [];
                const process = [];
                const startEnds = [];
                const componentArr = [];

                $this.designer.flowDesigner.Clear();

                if (rows.length === 0) {
                    $this.designer.flowDesigner.connectors = connectors;
                    $this.designer.flowDesigner.process = process;
                    console.error("조회된 데이터가 없습니다.");
                    return;
                }

                for (let r = 0; r < rows.length; r++) {
                    const _raw = JSON.parse(rows[r]._raw);

                    if (rows[r].name === "components") {
                        rowsComponent = _raw;
                        wholeDesignObj = rowsComponent;

                        for (const processName in rowsComponent) {
                            componentArr.push([processName, rowsComponent[processName]])
                        }
                    } else if (rows[r].name === "connections") {
                        rowsConnection = _raw;
                    } else if (rows[r].name === "inOutInfos") {
                        rowsInOutInfo = _raw;
                    } else {
                        console.error("잘못된 타입의 데이터가 확인되었습니다 : ", rows[r].name);
                    }
                }

                for (let proc in rowsComponent) {
                    const target = rowsComponent[proc];

                    if (((target.type).toLowerCase()).indexOf("channel") < 0) {
                        process.push(target);
                    }
                }

                for (let conn of rowsConnection) {
                    const row = rowsComponent[conn.channel];

                    row.from = conn.from;
                    row.to = conn.to;
                    row.fromId = rowsComponent[conn.from].id;
                    row.toId = rowsComponent[conn.to].id;

                    connectors.push(row);
                }

                for (let inOut in rowsInOutInfo) {
                    // in, out의 위치 및 이름 정보 넘김
                    if (inOut !== "connectors") {
                        const target = rowsInOutInfo[inOut];

                        if (((target.type).toLowerCase()).indexOf("channel") < 0) {
                            startEnds.push(target);
                        }

                        inOutInfo[target.name] = (target);
                    }
                    // in, out의 connections 정보 넘김
                    else {
                        for (const inOutConn of rowsInOutInfo[inOut]) {
                            const inOutRow = rowsInOutInfo[inOutConn.channel];

                            inOutRow.from = inOutConn.from;
                            inOutRow.to = inOutConn.to;
                            inOutRow.fromId = rowsInOutInfo[inOutConn.from] === undefined ? rowsComponent[inOutConn.from].id : rowsInOutInfo[inOutConn.from].id;
                            inOutRow.toId = rowsInOutInfo[inOutConn.to] === undefined ? rowsComponent[inOutConn.to].id : rowsInOutInfo[inOutConn.to].id;

                            connectors.push(inOutRow);
                        }
                    }
                }

                $this.designer.flowDesigner.connectors = connectors;
                $this.designer.flowDesigner.process = process;
                $this.designer.flowDesigner.startEnds = startEnds;
                $this.designer.flowDesigner.makeFlows();

                this.SetStatusOfDiagram($this);
            })
            .catch(err => {
                if (Object.values(err)[0].toString().includes("konvaDesigner")) {
                    console.error("konvaDesigner error!!! : ", err);
                    this.flowDesigner.Clear(); // 기존 Layer 정보를 지움
                    this.wholeDesignObj = {};
                    this.connectors = new Array();
                    this.process = new Array();
                } else {
                    _ShowErrorAfterLoading(__ServerNotConnectMSG);
                    console.error(err);
                }
            })
            .finally(() => {
                _HideLoading();
            });
    },

    /**
     * Worker를 호출하는 함수
     * @param $this: Vue Instance
     */
    CallWorker($this) {
        if ($this.socket.worker !== null) $this.socket.worker.terminate();

        $this.socket.worker = new Worker("Monitoring/Worker.js");

        $this.socket.worker.postMessage(
            [
                $this.temp.tree.flowGroup,
                $this.view.tree.processType,
                $this.projectId,
                this.pollingSecond,
                __ServerURL,
                //sessionStorage.getItem('token'),
                userKeyArr[1],
                $this.view.blockRow
            ]
        );

        $this.socket.worker.onmessage = (message) => {
            const {data} = message;

            if (data === undefined || data === null || Object.keys(data).length < 1) return;

            const {flowGroup, processType, blockData} = data;

            $this.view.tree.flowGroup = JSON.parse(JSON.stringify(flowGroup));
            $this.view.tree.processType = JSON.parse(JSON.stringify(processType));
            $this.view.blockRow = JSON.parse(JSON.stringify(blockData));
            this.SetStatusOfDiagram($this);
            $this.$nextTick(() => {

                const processTypeList = Array.from($this.$refs['processTypeList']);

                processTypeList.sort((a, b) => {
                    const aSpan = a.querySelector('span');
                    const bSpan = b.querySelector('span');

                    return aSpan.innerText.localeCompare(bSpan.innerText);
                });

                $($this.$refs['processTypUl']).empty();

                for (const processType of processTypeList) {
                    $($this.$refs.processTypUl).append(processType);
                }
                _HideLoading();
            });
        };
    },

    /**
     * Diagram 색상 입히기
     * @param $this
     * @constructor
     */
    SetStatusOfDiagram($this) {
        if($this.view.tabName !== 'Diagram') return;

        for (const key in $this.designer.changeProcess) { // changeProcess 초기화
            $this.designer.changeProcess[key] = []
        }

        for (const server of $this.view.tree.flowGroup.server) {
            const {serverId} = server;
            for (const flow of server.flow) {
                const {flowId} = flow;

                if ($this.serverId !== serverId || $this.flowId !== flowId) continue;

                for (const process of flow.process) {
                    const {status, id} = process;
                    $this.designer.changeProcess[status].push(id);
                }
            }
        }

        if(__DEBUG) console.log("[Change Color In Designer] : ", $this.designer.changeProcess);

        /* 변경할 프로세스를 디자이너에 넘김 (designer가 만들어진 이후)*/
        if($this.designer.flowDesigner !== null) {
            const {children} = $this.designer.flowDesigner.$layer;

            if (children.length > 0) { /* 디자이너에 프로세스가 그려진 이후 */
                $this.designer.flowDesigner.changeProcess($this.designer.changeProcess);
            }
        }
    },
    PopChangeStatus() {},
    /**
     * 서버 이력 추가 함수
     * @param $this: Vue Instance
     * @param status: oAgetn에 내리는 명령 Type
     * @param param
     */
    SaveServerMessage($this, status, param) {
        const pam = {
            createdBy: Global.userId,
            command: status,
            telegram: JSON.stringify(param),
            serverId: param.serverId,
            flowId: !param.flow ? null : param.flow,
            bpId: !param.BP_ID ? null : param.BP_ID,
            instance: !param.instance? null : param.instance,
            level: !param.level? param.range : param.level
        };


        const {level} = param;

        if (level === 'processor') {
            pam.instance = null;
        } else if (level === 'flow') {
            pam.bpId = null;
        } else if (level === 'server') {
            pam.bpId = null;
            pam.flowId = null;
        }

        /*commandCustom("/log/addServerMsgLog.do", pam)
            .then(({res, msg}) => {
                if(!res) throw new Error('서버 이력을 저장하지 못했습니다.')
            })
            .catch(e => {
                console.error(e, pam);
            });*/
    }
};