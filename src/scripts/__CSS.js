/**
 * 투명효과적용
 * @param $el
 * @param opacity
 */
function SetOpacity($el, opacity) {
    if (checkIEBrowser()) {
    	$el.css("filter", "alpha(opacity=" + (opacity * 100) + ")");
    }

	$el.css("opacity", opacity);
}

/**
 * 객체 회전
 * @param $el
 * @param degree
 */
function SetRotate($el, degree) {
	$el.css({
		"-ms-transform": "rotate(" + degree + "deg)",
		"-webkit-transform": "rotate(" + degree + "deg)",
		"transform": "rotate(" + degree + "deg)"
	});
}