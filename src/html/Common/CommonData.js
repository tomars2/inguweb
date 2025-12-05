function getCodeList(queryType, tag, param, callback) {
    if (!isObject(param)) param = {};
    if (!isObject(callback)) callback = null;

    commandInQuerySelect(param, tag, queryType)
        .then(({rows, res, msg}) => {
            if (res) {
                callback(rows);
            } else {
                console.error(msg);
            }
        })
        .catch((err) => {
            if (callback !== null) {
                callback([]);
            }
            console.error(err);
        });
    // $.ajax({
    //     type: "POST",
    //     dataType: "text",
    //     async: true,
    //     url: __ServerURL + "/command/select/inQuery.do",
    //     data: GetInQueryPostData(queryType, tag, param),
    //     beforeSend: function() {
    //     },
    //     success: function(data) {
    //         const { rows: rows } = GetJSON(data);
    //
    //         if (callback !== null) {
    //             callback(rows);
    //         }
    //     },
    //     error: function(jqXHR, textStatus, errorThrown) {
    //         if (callback !== null) {
    //             callback([]);
    //         }
    //     }
    // });
}

/**
 * 공통코드 
 * @param tag
 */
function CommCodeLocal(tag, param) {
    Object.defineProperty(this, "data", { value: new HashMap(), configurable: false, enumerable: true, writable: true });
    Object.defineProperty(this, "queryType", { value: "commonData", configurable: false, enumerable: true, writable: false });
    Object.defineProperty(this, "tag", { value: tag, configurable: false, enumerable: true, writable: false });
}

CommCodeLocal.prototype.get = function(element, reload, groupCd) {
    var oThis = this;

    if (typeof(groupCd) === "undefined") groupCd = "-";

    return new Promise(function(resolve, reject) {
        if (typeof(reload) !== "boolean") reload = false;

        if (!reload) {
            if (Array.isArray(oThis.data.get(groupCd)) && oThis.data.get(groupCd).length > 0) {
                oThis.make(element, groupCd);
                resolve({ rows: oThis.data.get(groupCd), element: element });
                return;
            }
        }

        var reqParam = { groupCode: groupCd };

        getCodeList(oThis.queryType, oThis.tag, reqParam, function(rows) {
            oThis.data.put(groupCd, rows.slice());
            oThis.make(element, groupCd);
            resolve({ rows: rows, element: element });
        });
    });
}

CommCodeLocal.prototype.make = function(element, groupCd) {
    if (element === null) {
        return;
    }

    if (!Array.isArray(element)) {
        element = [element];
    }

    var rows = this.data.get(groupCd);

    for (var i = 0; i < element.length; i++) {
        var $el = $(element[i]);

        if ($el.length === 0) {
            continue;
        }

        $el.empty();

        var $opt = $("<option value=\"\">All</option>");

        for (var j = 0; j < rows.length; j++) {
            var row = rows[j];

            $opt = $("<option></option>");
            $opt.attr("value", row.CODE_CD);
            $opt.html(row.CODE_NM);
            $el.append($opt);
        }
    }
}
/* ------------------------------ */

/**
 * 공통코드 조회
 * @param cd01
 */
var commCode = new CommCodeLocal("getCommCodeList");


/**
 * common_code table 이외
 * @param queryType
 * @param tag 
 * @param param
 */
function CommListLocal(queryType, tag, param) {
    Object.defineProperty(this, "rows", { value: [], configurable: false, enumerable: true, writable: true });
    Object.defineProperty(this, "queryType", { value: queryType, configurable: false, enumerable: true, writable: false });
    Object.defineProperty(this, "tag", { value: tag, configurable: false, enumerable: true, writable: false });
    Object.defineProperty(this, "param", { value: param, configurable: false, enumerable: true, writable: false });
}

CommListLocal.prototype.get = function(element, reload) {
    var oThis = this;

    return new Promise(function(resolve, reject) {
        if (typeof(reload) !== "boolean") reload = false;

        if (!reload && oThis.rows.length > 0) {
            resolve({ rows: oThis.rows, element: element });
            oThis.make(element);
            return;
        }
    
        getCodeList(oThis.queryType, oThis.tag, oThis.param, function(rows) {
            oThis.rows = rows.slice();
            oThis.make(element);
            resolve({ rows: rows, element: element });
        });
    });
}

CommListLocal.prototype.make = function(element) {
    if (element === null) {
        return;
    }

    if (!Array.isArray(element)) {
        element = [element];
    }

    for (var i = 0; i < element.length; i++) {
        var $el = $(element[i]);

        if ($el.length === 0) {
            continue;
        }

        $el.empty();

        var $opt = $("<option value=\"\">All</option>");

        for (var j = 0; j < this.rows.length; j++) {
            var row = this.rows[j];

            $opt = $("<option></option>");
            $opt.attr("value", row.CODE_CD);
            $opt.html(row.CODE_NM);
            $el.append($opt);
        }
    }
}
/* ------------------------------ */

/**
 * menu selectBox 
 */
var commMenuSelectBox = new CommListLocal("getCommMenuList", "commonData", {});

/**
 * account selectBox
 */
var commAccountSelectBox = new CommListLocal("getCommAccountList", "commonData", {});

/**
 * project selectBox
 */
var commProjectSelectBox = new CommListLocal("getCommProjectList", "commonData", {});

/**
 * status selectBox
 */
var commStatusSelectBox = new CommListLocal("getCommStatusList", "commonData", {baseCd: "MST"});

/**
 * flowGroup selectBox
 */
var commFlowGroupSelectBox = new CommListLocal("getCommFlowGroupList", "commonData", {});

/**
 * server selectBox
 */
var commServerSelectBox = new CommListLocal("getCommAllServer", "commonData", {});

/**
 * appId selectBox
 */
var commAppIdSelectBox = new CommListLocal("getCommAllAppId", "commonData", {});

/**
 * processingLevel selectBox
 */
var commProcessingLevelSelectBox = new CommListLocal("getCommProcessingLevels", "commonData", {});

/**
 * processingLevel selectBox
 */
var commBpidSelectBox = new CommListLocal("getCommBpid", "commonData", {});

/**
 * alarmType selectBox 
 */
var commAlarmTypeSelectBox = new CommListLocal("getAlarmType", "commonData", {});

/**
 * alarmLevel selectBox
 */
var commAlarmLevelSelectBox = new CommListLocal("getAlarmLevel", "commonData", {});

/**
 * alarmStatus selectBox
 */
var commAlarmStatusSelectBox = new CommListLocal("getAlarmStatus", "commonData", {});

/**
 * flow(전체_server와 관련X) selectBox 
 */
var commAllFlowsSelectBox = new CommListLocal("getCommAllFlows", "commonData", {});

/**
 * topicLag selectBox
 */
var commTopicLagSelectBox = new CommListLocal("getCommTopicLag", "commonData", {});

var commProcessService = new CommListLocal("getCommService", "commonData", {userId: Global.userId});


var commonService = new CommListLocal('commonSearchService', 'commonData', {});
