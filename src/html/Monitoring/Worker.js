const GetInQueryPostData = (queryType, tag, param) => {
    if (!/^[A-Za-z0-9.]+$/.test(queryType)) {
        queryType = "";
    }

    if (!/^[A-Za-z0-9_\-]+$/.test(tag)) {
        tag = "";
    }

    if (typeof (param) != "object") {
        param = {};
    }


    
    return {
        query: queryType,
        tag: tag,
        param: JSON.stringify(param),
    };
};

const CheckStatus = (status) => {
    const rtnObj = {
        status: '',
        description: ''
    };

    switch (status.toUpperCase()) {
        case "ABORT": //abort
            rtnObj.status = 'abort';
            rtnObj.description = 'abort';
            break;
        case "STOP": //stopped (by_operator)
            rtnObj.status = 'stop';
            rtnObj.description = 'stopped';
            break;
        case "PS0108": //stopped (by_operator)
            rtnObj.status = 'stop';
            rtnObj.description = 'exit_normal_forced_ok';
            break;
        case "PS0109": //stopped (by_operator)
            rtnObj.status = 'stop';
            rtnObj.description = 'exit_normal_rejected';
            break;
        case "PS0104": //stopped (by_operator)
            rtnObj.status = 'stop';
            rtnObj.description = 'exit_by_operator';
            break;
        case "PS0105": //stopped (by_operator)
            rtnObj.status = 'stop';
            rtnObj.description = 'exit_by_bp';
            break;
        case "PS0106": //stopped (by_operator)
            rtnObj.status = 'stop';
            rtnObj.description = 'exit_by_bp';
            break;
        case "PS0111": //stopped (waiting)
            rtnObj.status = 'waiting';
            rtnObj.description = 'v';
            break;
        case "PS0101": //stopped (waiting)
            rtnObj.status = 'waiting';
            rtnObj.description = 'waiting';
            break;
        case "START": //running
            rtnObj.status = 'running';
            rtnObj.description = 'running';
            break;
        case "PS0110": //running
            rtnObj.status = 'running';
            rtnObj.description = 'confirm';
            break;
        default:
            throw new Error(`정의되지 않은 상태값입니다. : ${status}`);
    }

    return rtnObj;
};

const AdvancedPolling = (data) => {
    const {flowGroup, processType, projectId, pollingSecond, rows, __ServerURL, __Token, blockData} = data;
    const checkStatus = (target, parent) => {
        const {abort, stop, waiting, running} = target;
        if (abort > 0) {
            parent.status = 'abort';
        } else if(running > 0){
            parent.status = 'running';
        } else if (stop > 0) {
            parent.status = 'stop';
        } else {
            parent.waiting = 'waiting';
        } 
    };

    const countStatus = (target, child) => {
        if (child.status === 'running') {
            target.running++;
        } else if (child.status === 'abort') {
            target.abort++;
        } else if (child.status === 'waiting') {
            target.waiting++;
        } else if (child.status === 'stop') {
            target.stop++;
        }
    };
    const getServerStatus = (callback) => {
        const xhr = new XMLHttpRequest();

        xhr.open('POST', `${__ServerURL}/command/select/inQuery.do`);
        xhr.withCredentials = true;

        xhr.setRequestHeader('Authorization', `Bearer ${__Token}`);
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');

        xhr.onload = () => {
            const {status} = xhr;

            try {
                if (status === 200) {
                    const {res, rows, msg} = JSON.parse(xhr.responseText);

                    if(!res) throw new Error('서버와의 통신이 실패하였습니다.');

                    for (const server of flowGroup.server) {
                        const {serverName} = server;

                        for (const row of rows) {
                            const {lsystem_id, server_status} = row;

                            if (Number(serverName) === Number(lsystem_id)) {
                                server.description = server_status;
                            }
                        }
                    }

                    if (typeof callback === 'function') {
                        callback();
                    }
                } else {
                    throw new Error('서버와의 통신이 실패하였습니다');
                }
            } catch (e) {
                console.error(e);
            }
        };

        xhr.send(Object.entries(GetInQueryPostData('serverStatus', 'getServerStatus', {})).map(e => e.join('=')).join('&'));
    };

    const getBpStatus = () => {
        const xhr = new XMLHttpRequest();
        let rtnData = null;

        xhr.open('POST', `${__ServerURL}/command/select/inQuery.do`);
        xhr.withCredentials = true;

        xhr.setRequestHeader('Authorization', `Bearer ${__Token}`);
        // xhr.setRequestHeader("Content-Type", "application/json");
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        xhr.onload = () => {
            const {status} = xhr;

            try {
                if (status === 200) {
                    /**
                     * Flow Group
                     */
                    const {res, rows, msg} = JSON.parse(xhr.responseText);
                    if(!res) throw new Error('서버와의 통신이 실패하였습니다.');

                    const projectStatusObj = {
                        running: 0,
                        abort: 0,
                        waiting: 0,
                        stop: 0,
                    };

                    flowGroup.status = 'waiting';

                    for (const server of flowGroup.server) {
                        const server_serverId = server.serverId;
                        const server_serverName = server.serverName;

                        const serverStatusObj = {
                            running: 0,
                            abort: 0,
                            waiting: 0,
                            stop: 0,
                        };

                        server.description = '';

                        if(server.flow === undefined) continue;
                        for (const flow of server.flow) {
                            const flow_flowId = flow.flowId;
                            const flow_serverId = flow.serverId;

                            const flowStatusObj = {
                                running: 0,
                                abort: 0,
                                waiting: 0,
                                stop: 0,
                            };

                            if(flow.process === undefined) continue;
                            for (const process of flow.process) {
                                const instance = process.properties.instance.instance;
                                const min = process.properties.instance.min;
                                const processStatusObj = {
                                    running: 0,
                                    abort: 0,
                                    waiting: 0,
                                    stop: 0,
                                };

                                for (const i of instance) {
                                    const $flowId = i.flowId;
                                    const $serverId = i.serverId;
                                    const $processName = i.processName;
                                    const $instance = i.name;
                                    
                                    for (const row of rows) {
                                        const {instance,processor,serverId, status, flowId} = row;
                                        if (flowId === $flowId && serverId === $serverId && processor === $processName && $instance === instance) {
                                            const statusObj = CheckStatus(status);

                                            i.status = statusObj.status;
                                            i.description = statusObj.description;

                                            countStatus(processStatusObj, i);
                                        }
                                    }
                                }

                                /* Set Color In Process */
                                const {running, abort, stop, waiting} = processStatusObj;

                                if (abort > 0) {
                                    process.status = 'abort';
                                } else {
                                    if(running >= min) {
                                        process.status = 'running';
                                    } else if (running < min) {
                                        process.status = 'stop';
                                    } else if (running === 0) {
                                        process.status = 'waiting';
                                    }
                                }

                                countStatus(flowStatusObj, process);
                            }

                            /* Set Color In Flow */
                            checkStatus(flowStatusObj, flow);
                            countStatus(serverStatusObj, flow);
                        }

                        /* Set Color In Server */
                        checkStatus(serverStatusObj, server);
                        countStatus(projectStatusObj, server);
                    }
                    /* Set Color In Server */
                    checkStatus(projectStatusObj, flowGroup);
                    
                    /**
                     * ProcessType
                     *
                     */
                        // if (process_flowId === flowId && process_serverName === lsystem_id && instance_instanceId === instanceId && process_bpId === bpId) {
                    const proStatusObj = {
                            running: 0,
                            stop: 0,
                            abort: 0,
                            waiting: 0
                    };

                    for (const key in processType) {
                        if(key === 'status') continue;
                        const pt = processType[key];
                        const ptStatusObj = {
                            running: 0,
                            stop: 0,
                            abort: 0,
                            waiting: 0
                        };

                        for (const pr of pt.process) {
                            const $flowId = pr.flowId;
                            //const $bpId = Number(pr.bpid);
                            const $instance = pr.instance;
                            const $serverId = pr.serverId;
                            const $processName = pr.processName;
                            const {min, serverName} = pr;

                            const prStatusObj = {
                                running: 0,
                                stop: 0,
                                abort: 0,
                                waiting: 0
                            };
                            
                            for (const ins of $instance) {
                                const $instanceId = ins.instanceId;

                                for (const row of rows) {
                                    //const {bpId, instanceId, serverId, status, flowId} = row;
                                    const {instance,processor,serverId, status, flowId} = row;
                                    
                                    if (flowId === $flowId && serverId === $serverId && processor === $processName && $instanceId === instance) {
                                        const statusObj = CheckStatus(status);
                                        ins.status = statusObj.status;
                                        ins.description = statusObj.description;

                                        countStatus(prStatusObj, ins);
                                    }
                                }
                            }
                            
                            const {abort, running} = prStatusObj;
                            if (abort > 0) {
                                pr.status = 'abort';
                            } else {
                                if(running >= min) {
                                    pr.status = 'running';
                                } else if (running < min) {
                                    pr.status = 'stop';
                                } else if (running === 0) {
                                    pr.status = 'waiting';
                                }
                            }

                            if (serverName === '1056') continue;

                            countStatus(ptStatusObj, pr);
                        }
                        
                        checkStatus(ptStatusObj, pt);
                        countStatus(proStatusObj, pt);
                    }

                    checkStatus(proStatusObj, processType);

                    /**
                     * block
                     */
                    if (blockData !== undefined && blockData !== null && Array.isArray(blockData) && blockData.length > 0) {

                        for (const block of blockData) { // flow & server
                            const $serverName = block.serverName;
                            const $flowId = block.flowId;
                            const $process = block.processList;
                            const $serverId = block.serverId;

                            for (const process of $process) { // process
                                const $bpId = Number(process.bpId);
                                const $min = process.min;
                                const $instanceCnt = process.instanceCnt;
                                const processStatusObj = {
                                    running: 0,
                                    abort: 0,
                                    stop: 0,
                                    waiting: 0
                                };
                                const $processName = process.name;

                                for (let $instanceId = 0; $instanceId < $instanceCnt; $instanceId++) { // instance
                                    for (const row of rows) {
                                        const {instance,processor,serverId, status, flowId} = row;
                                        
                                        if (flowId === $flowId && serverId === $serverId && processor === $processName && $instanceId === instance) {
                                            const statusObj = CheckStatus(status);

                                            switch (statusObj.status) {
                                                case 'abort':
                                                    processStatusObj.abort++;
                                                    break;
                                                case 'stop':
                                                    processStatusObj.stop++;
                                                    break;
                                                case 'waiting':
                                                    processStatusObj.waiting++;
                                                    break;
                                                case 'running':
                                                    processStatusObj.running++;
                                                    break;
                                            }
                                        }
                                    }
                                }

                                const {running, abort, waiting, stop} = processStatusObj;

                                if (abort > 0) {
                                    process.status = 'abort';
                                } else {
                                    if(running >= $min) {
                                        process.status = 'running';
                                    } else if (running < $min) {
                                        process.status = 'stop';
                                    } else if (running === 0) {
                                        process.status = 'waiting';
                                    }
                                }
                            }
                        }
                    }

                    getServerStatus(() => {
                        postMessage({
                            flowGroup: flowGroup,
                            processType: processType,
                            blockData
                        });
                    });
                } else {
                    throw new Error('서버와의 통신이 실패하였습니다.');
                }
            } catch (e) {
                console.error(e);
            }
        }

        //console.log("===================1=================");
        xhr.send(Object.entries(GetInQueryPostData('commonData', 'getAllBpStatus', {projectId})).map(e => e.join('=')).join('&'));
        //console.log("===================1=================");
    }

    getBpStatus();
    setInterval(getBpStatus, pollingSecond);
};

/**
 * Main Thread에서 데이터 요청 받았을 경우
 */
self.addEventListener('message', e => {
    const data = e.data;
    const rtnData = {
        res: false,
        msg: '',
        rows: []
    };

    if (!Array.isArray(data)) {
        rtnData.msg = '잘못된 매개변수 형식입니다.';
    } else if(data[4] === undefined || data[4] === null) {
        rtnData.msg = 'ServerURL이 잘못된 데이터입니다.';
    } else if (data[5] === undefined || data[5] === null) {
        rtnData.msg = '정상적인 Token이 아닙니다.';
    }

    const param = {
        flowGroup: data[0],
        processType: data[1],
        projectId: data[2],
        pollingSecond: data[3],
        __ServerURL: data[4],
        __Token: data[5],
        blockData: data[6]
    };
    
    AdvancedPolling(param);
});