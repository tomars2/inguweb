Api = {
    Init() {
        this.SetControl();
    },
 

    SetControl() {
        const oThis = this;
        this.vm = new Vue({
            el: "#" + this.panelID,
            methods: {
                // 버튼 - 검색
                btnSearch() {
                    oThis.Getapis();
                },
            }
        });

    },
    Getapis($this) {
        commandCustom("/safemap/runapi", {})
            .then((data) => {
                alert("성공");
            })
            .catch((err) => {
                _ShowErrorAfterLoading(__ServerNotConnectMSG);
                console.error(err);
            });
    }

};