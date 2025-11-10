MappingTablePOP = {

	flowId: null,
	versionId: null,
	processes: [],

	Init(pageParam) {
		this.flowId = this.getParam("flowId", "");
		this.versionId = this.getParam("versionId", "");
		this.processes = this.getParam("processes", []);
		this.SetControl();
	},

	SetControl() {
		const oThis = this;

		this.vm = new Vue({
			el: "#" + this.panelID,
			data: () => {
				return {
					rows: [
						{ field: "", rename: "", function: "" } // Initial row
					],

				};
			},
			methods: {
				addRow() {
					oThis.addTableRow();
				},
				save(){
					oThis.saveToDB();
				},
				testshow(){
					oThis.test();
				}
			},
			mounted() {}
		});
	},


/*
	addRow() {
		// Get the table body
		const tableBody = document.querySelector('#mappingTable tbody');

		// Create a new row
		const newRow = document.createElement('tr');

		// Add cells with input fields
		newRow.innerHTML = `
        <td><input type="text" class="text" placeholder="Map Table"></td>
        <td><input type="text" class="text" placeholder="Field"></td>
        <td><input type="text" class="text" placeholder="From"></td>
        <td><input type="text" class="text" placeholder="To"></td>
        <td><input type="text" class="text" placeholder="Convert"></td>
      `;

		// Append the new row to the table body
		tableBody.appendChild(newRow);
	}
*/

	addTableRow() {
		this.vm.rows.push({ field: "", rename: "", function: "" });
	},

	test() {
	alert(JSON.stringify(this.vm.rows));
	},
	saveToDB() {
		if (this.flowId === "") {
			_ShowWarning("Flow명을 선택해주세요.");
			return;
		}
		if (this.processes.length === 0) {
			_ShowWarning("ST를 선택해주세요.");
			return;
		}

		if (this.vm.rows.indexOf(0).valueOf() === "") {
			_ShowWarning("저장할 데이터가 없습니다.");
			return;
		}
		let processName = [];
		processName = this.processes.map(value => {
			return value.processor;
		});

		const apiUrl = "/api/saveMappingTable"; // Replace with your backend API URL

		console.log(processName);

		const param = {
			row: this.vm.rows,
			processName
		};
		/*
                axios
                    .post(apiUrl, { rows: this.rows })
                    .then((response) => {
                        alert("Data saved successfully!");
                    })
                    .catch((error) => {
                        console.error("Error saving data:", error);
                        alert("Failed to save data.");
                    });*/

			_ShowConfirm("저장하시겠습니까?", () => {
				if (this.getCallback !== null) {
					this.getCallback(param);
				}
				this.Close();
			});


	/*	commandCustom("/flowDesign/makeMappingTable.do", JSON.stringify(param))
			.then(({res, msg}) => {
				if (res) {
					_ShowSuccessAfterLoading("테이블이 생성되었습니다.", msg);
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
			});*/
	}

	/**
	 * 유효성 체크    --> 필요하면 만들것
	 */
/*	CheckValidation() {
		if (this.vm.newVersion === "") {
			_ShowWarning("버전명을 입력해주세요.");
			return false;
		}
		return true;
	},*/
};