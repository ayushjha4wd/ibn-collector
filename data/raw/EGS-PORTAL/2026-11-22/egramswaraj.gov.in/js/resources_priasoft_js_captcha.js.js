function refreshCaptcha() {
	var img = document.getElementById('img_Capatcha');
    img.src="captchaImage?Id=" + Math.random();
    $('#captchaAnswer').val('');
    $('#captchaAnswer').focus();
}

function validateCaptcha(captchaValue) {
	var flag = false;
	captchaValidator.validateCaptcha(null, captchaValue,{
		callback:function(data) {
			flag = data;
		}
		 ,preHook:function() {$(".process").fadeIn(500); },
		 postHook:function() { $(".process").fadeOut();},
		 timeout:50000,
		 async:false,
		 errorHandler:function(message) { bootbox.alert("Oops: " + message);}
	});
	return flag;
}