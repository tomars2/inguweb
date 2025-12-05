/**
 * TODO 브라우저 호환성으로 ES5 형식으로 작성해야 함 
 */
Login = {
	vm: null, 

	Init: function(pageParam) {
		this.SetControl();
		this.popup = new LayerPopup(this.funcName, 1);
	},

	SetControl: function() {
		var oThis = this;

		var savedID = Cookies.Get("__SavedID__");
		if (typeof(savedID) === "undefined") savedID = "";

		this.vm = new Vue({
			el: "#login-box",
			data: function() {
				return {
					memberId: savedID,
					memberPw: "",
					saveID: (savedID.length > 0) ? "Y" : "N"
				}
			},
			methods: {
				login: function() {
					oThis.Login();
				},
				join: function() {
					oThis.popup.View({
						pageURL: "/html/JoinPOP.html",
						title: "회원가입",
						width: -1,
						height: -1,
						param: {},
						callback: (() => {
						}),
						referFunc: null,
						closeCallBack: ((data) => {
						}),
					});
				},
			}
		});

		if (this.vm.memberId.length === 0) {
			$(this.vm.$refs["memberId"]).trigger("focus");
		}
		else {
			$(this.vm.$refs["memberPw"]).trigger("focus");
		}
	},

	Login: function() {
		if (this.vm.memberId.length === 0) {
			_ShowWarning("아이디를 입력해주세요.");
			return;
		}

		if (this.vm.memberPw.length === 0) {
			_ShowWarning("비밀번호를 입력해주세요.");
			return;
		}

		var oThis = this;

		var reqParam = {
			username: this.vm.memberId,
			password: this.vm.memberPw
		};

		_ShowLoading("로그인중...");

		commandCustom("/auth/authorize", JSON.stringify(reqParam))
			.then(function(data) {
				var res = data;
				var msg = "The account does not exist, or the username or password is incorrect.";

				if (res) {
					if (oThis.vm.saveID === "Y") {
						Cookies.Set("__SavedID__", reqParam.username, 150);
					}
					else {
						Cookies.Set("__SavedID__", "");
					}

					sessionStorage.setItem("token", data);
					Cookies.Set("userKey", reqParam.username+'|'+data);

					location.replace("/html/PagePanel.html?_no=" + __NewNo);
				}
				else {
					_ShowError(msg);
				}
			})
			.catch(function(error) {
				console.error(error);
			})
			.finally(function() {
				_HideLoading();
			});
	}
}
