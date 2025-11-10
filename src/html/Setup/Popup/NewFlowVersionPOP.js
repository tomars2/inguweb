/*
 * 파라메터 가져오기
 * const test = this.getParam("test", "");
 *
 * 호출시 선언된 Callback 가져오기
 * if (this.getCallback !== null) this.getCallback();
 */
NewFlowVersionPOP = {
	flowId: "",
	
	Init(pageParam) {
		this.flowId = this.getParam("flowId", "");
		this.SetControl();
	},
	
	SetControl() {
		const oThis = this;
		
		this.vm = new Vue({
			el: "#" + this.panelID,
			data: function() {
				return {
					lastVersion: "",
					newVersion: ""
				}
			},
			methods: {
				btnMake(){
					oThis.MakeNewVersion();
				}
			},
			mounted() {
				oThis.GetNowVersion();
			},
		});
	},
	
	/**
	 * 저장되어있는 마지막버전 불러오기
	 */
	//TODO log 남겨야하는지 고민필요!!
	GetNowVersion() {
		const param = { flowId: this.flowId };
		
		commandInQuerySelect(param, "flowDesign", "getFlowLastVersion")
			.then(({res, rows, msg}) => {
				if (res) {
					if (rows.length > 0) {
						this.vm.lastVersion = rows[0].version;
					}
					else {
						this.vm.lastVersion = "none";
					}
				}
			})
			.catch((err) => {
				_ShowErrorAfterLoading(__ServerNotConnectMSG);
				console.error(err);
			});
	},
	
	/**
	 * 입력된 버전 저장
	 */
	MakeNewVersion() {
		if (this.CheckValidation()) {
			_ShowConfirm("버전을 생성하시겠습니까?", () => {
				if (this.getCallback !== null) {
					this.getCallback(this.vm.newVersion);
				}
				this.Close();
			});
		}
	},
	
	/**
	 * 유효성 체크
	 */
	CheckValidation() {
		if (this.vm.newVersion === "") {
			_ShowWarning("새로 생성할 버전을 입력해주세요.");
			return false;
		}
		
		return true;
	},
	
};