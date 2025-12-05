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

const ajax = (method, url, tag, queryName, token, param, callback, errorCallback) => {
	try {
		if (!method) throw new Error('method가 없습니다.');
		if (!url) throw new Error('url이 없습니다.');
		if (!tag) throw new Error('tag가 없습니다.');
		if (!queryName) throw new Error('queryName이 없습니다.');
		if (!token) throw new Error('token이 없습니다.');
		if (!param) throw new Error('param이 없습니다.');
		if (!callback) throw new Error('callback이 없습니다.');
		if (!errorCallback) throw new Error('errorCallback이 없습니다.');

		const xhr = new XMLHttpRequest();

		xhr.open(method, url);

		xhr.withCredentials = true;

		xhr.setRequestHeader('Authorization', `Bearer ${token}`);
		xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');

		xhr.onload = () => {
			const {status} = xhr;

			if (status === 200) {
				callback(JSON.parse(xhr.responseText));
			} else {
				throw new Error('서버와의 통신이 실패하였습니다.');
			}
		};
 
		xhr.send(Object.entries(GetInQueryPostData(tag, queryName, param)).map(e => e.join('=')).join('&'));
	} catch (e) {
		errorCallback(e);
	}
};

self.addEventListener('message', e => {
	CheckingAlert(e);
	setInterval(()=>{
		CheckingAlert(e);
	}, 10000);
});

const CheckingAlert = (e) =>{
	const {data} = e;
	const token = data[0];
	const serverUrl = data[1];
	const success = ({res, rows, msg}) => {
		try {
			if (!res) rows = [];

			postMessage({
				res,
				msg,
				errorCnt: rows.length
			});

		} catch (e) {
			_ShowErrorAfterLoading(e.message());
		}
	};
	const error = (e) => {
		console.error(e);
		postMessage({
			res: false,
			msg: e.message
		});
	};

	//ajax("POST", `${serverUrl}/command/select/inQuery.do`, "log", "watchAlert", token, {}, success, error);
}