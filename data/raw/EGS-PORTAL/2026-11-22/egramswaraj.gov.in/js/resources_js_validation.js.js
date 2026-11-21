// JavaScript Document
//Validation API by sumit kumar sharma 
//Methods 
//validateOnKeyPessDown(event,Id Of field,Type Of Input You want to validate)
//vlidateOnblur(Field id,Minimum length of field,Maximumm Length of field)

function onClear(){
	document.getElementById('imagePreview').style.display="none";
	document.getElementById('imagePreviewS').style.display="none";
}

function fileValidation(id,file){
	
    var fileInput = document.getElementById(id);
    var filePath = fileInput.value;
   /* var allowedExtensions = /(\.jpg|\.jpeg|\.png|\.JPG)$/i;
    if(!allowedExtensions.exec(filePath)){
        alert('Please upload file having extensions .jpeg/.jpg/.png only.');
        fileInput.value = '';
       return false;
    }*/
    
    var match = (new RegExp('[~#%\&_{}() +\|]|\\.\\.|^\\.|\\.$')).test(filePath);

    if (match) {
        alert("File Name should not contain space and special characters");
        fileInput.value = '';
    }
    
    //var FileSize = file.files[0].size / 1024; // in KB
    if (file.files[0].size > 2097152) {
        alert('File size should be less than 2 MB');
        
        return false;
    }
    else{
        //Image preview
    	
        /*if (fileInput.files && fileInput.files[0]) {*/
            var reader = new FileReader();
            var image = new Image();
            //setTimeout(function(){ myWindow.close() }, 3000); 
            reader.onload = function(e) {
          /*  setTimeout(function(){*/
            	image.src=e.target.result;
            	//alert(image.height);
            	//alert("Click Ok");
            	if(image.height <= 300 && image.width <= 300){
            	if(id == 'fileName'){
            		document.getElementById('imagePreview').style.display="block";
                document.getElementById('imagePreview').innerHTML = '<img src="'+e.target.result+'" class="img-thumbnail" height="150" width="150"/>';
            	}else{
            		document.getElementById('imagePreviewS').style.display="block";
            		document.getElementById('imagePreviewS').innerHTML = '<img src="'+e.target.result+'" class="img-thumbnail" height="150" width="150"/>';
            	}
            	}
            	else{
            		 fileInput.value = '';
            		 alert('Image dimension should not be greater than 300.');
            		 if(id == 'fileName'){
                		 document.getElementById('imagePreview').innerHTML ='';}
                		 else{
                			 document.getElementById('imagePreviewS').innerHTML =''; 
                		 }
            		 return false;
            	}
            /*}, 10);*/
            };
            
           // setTimeout(reader.onload,2000);
            //image.src = this.result;
           reader.readAsDataURL(fileInput.files[0]);
            if(image.height <= 300 && image.width <= 300){
            reader.readAsDataURL(fileInput.files[0]);
            }else{
       		 fileInput.value = '';
    		 alert('Image dimension should not be greater than 300.');
    		 if(id == 'fileName'){
    		 document.getElementById('imagePreview').innerHTML ='';}
    		 else{
    			 document.getElementById('imagePreviewS').innerHTML =''; 
    		 }
    		 return false;
    	}
        /*}*/
    }
}



function vlidateDateOnblur(id,fDate,type) 
{
	
//	$.datepicker = new Datepicker();
//	alert($.datepicker.val());
	
//	var  p  = $(id).datepicker({
//		changeMonth: true,
//		changeYear: true
//	});
//	alert(p.val());
	
	$("#"+id+"_msg").hide();
//	$("#"+id).val(trimString($("#"+id).val()));
//	var tempValue = $("#"+id).val();
//	if(type == 'm')
//	{
//		if(tempValue.length < minLength || tempValue.length > maxLength)
//		{
//			$("#"+id).addClass("error_fld");
//			$("#"+id+"_error").fadeIn(500);
//			return true;
//		}
//		else
//		{
//			return false;
//		}
//	}
//	else if(type == 'o')
//	{
//		if(tempValue.length!=0)
//		{
//			if(tempValue.length < minLength || tempValue.length > maxLength)
//			{
//				$("#"+id).addClass("error_fld");
//				$("#"+id+"_error").fadeIn(500);
//				return true;
//			}
//			else
//			{
//				return false;
//			}
//		}
//		else
//			{
//				return false;
//			}
//	}
return true;
}
function validateOnKeyPessDownZero(id) 
{
	if(document.getElementById(id).value==0){
		
		$("#"+id+"_error_zero").fadeIn(500);
		
		return true;
	}
	else{
		$("#"+id+"_error_zero").fadeOut(1000);
		return false;
	}
	
}

function validateOnKeyPessDown(e,id,type) 
{
	if(type=='char')
	{
//    	if (e.shiftKey || e.ctrlKey || e.altKey) { // if shift, ctrl or alt keys held down
//        e.preventDefault();  
//        $("#"+id+"_type_error").fadeIn(1000,function(){$("#"+id+"_type_error").fadeOut(1000);});
//    	} 
//    	else 
//    	{
    		var n = e.keyCode;
    		if ((n >= 48 && n <= 57)     // numbers on keyboard
    		|| (n >= 96 && n <= 105)  	// number on keypad
    		) {
    			if(e.preventDefault) 
    				e.preventDefault();
    			else
    				e.returnValue = false;    // Prevent character input
			$("#"+id+"_type_error").fadeIn(1000,function(){$("#"+id+"_type_error").fadeOut(1000);});
    	      }
    	
          //}
}

	else if(type=='number')
	{
		if (e.shiftKey || e.ctrlKey || e.altKey) { // if shift, ctrl or alt keys held down
        e.preventDefault();        
        $("#"+id+"_type_error").fadeIn(1000,function(){$("#"+id+"_type_error").fadeOut(1000);});
		} 
		else 
		{
	        var n = e.keyCode;
	        if (!((n == 8)              // backspace
	        || (n == 46)                // delete
	        || (n == 9)					//tab
	        || (n >= 35 && n <= 40)     // arrow keys/home/end
	        || (n >= 48 && n <= 57)     // numbers on keyboard
	        || (n >= 96 && n <= 105)   // number on keypad
	        || (n >= 112 && n <=122))  //f1 to f12
	        ) {
	        	if(e.preventDefault) 
    				e.preventDefault();
    			else
    				e.returnValue = false;     // Prevent character input
	            $("#"+id+"_type_error").fadeIn(1000,function(){$("#"+id+"_type_error").fadeOut(1000);});
	        }
    	
		}
	}
	else if(type=="charnum")
		{
		
		if (e.shiftKey || e.ctrlKey || e.altKey) { // if shift, ctrl or alt keys held down
			if(e.preventDefault) 
				e.preventDefault();
			else
				e.returnValue = false;      
	        $("#"+id+"_type_error").fadeIn(1000,function(){$("#"+id+"_type_error").fadeOut(1000);});
			} 
		}
	/*else
		{
		   if ( e.ctrlKey || e.altKey) { // if shift, ctrl or alt keys held down
	        e.preventDefault();     
		     }
		
		}*/
}

function vlidateEmailOnblur(id,type) {
	
	$("#"+id+"_msg").hide();
	$("#"+id).val();	/*$("#"+id).val(trimString($("#"+id).val()));	*/
	var emailReg = /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/;
	var tempValue = $("#"+id).val();
	if(type=='m')
	{
		if(!tempValue.length>0)
			{
			$("#"+id).addClass("error_fld");
			$("#"+id+"_error").fadeIn(500);
			return true;
			}
		else if( !emailReg.test( tempValue ) ) {
			$("#"+id).addClass("error_fld");
			$("#"+id+"_invalid_error").fadeIn(500);
			return true;
		} else {
			return false;
		}
	}
	else if(type=='o' && tempValue.length>0)
		{
			if( !emailReg.test( tempValue ) ) {
				$("#"+id).addClass("error_fld");
				$("#"+id+"_error").fadeIn(500);
				return true;
				} 
			else 
				{
				return false;
				}
		}
	else if(type=='o' && tempValue.length==0)
	{
		
			$("#"+id).addClass("error_fld");
			$("#"+id+"_error_req").fadeIn(500);
			return true;
			
	}
	else
		{
		return false;
		}
}

function validateMobileNumber(id){
	var Number = $("#"+id).val();
    //var Number = document.getElementById('YOUR ELEMENT ID').value;
	if(Number != ''){
    var IndNum = /^[0]?[6789]\d{9}$/;

    if(IndNum.test(Number)){
       return false;
   }

   else{
	   $("#"+id).addClass("error_fld");
		$("#"+id+"_error_valid").fadeIn(500);
		return true;
   }
	}

}

function vlidateOnblur(id,minLength,maxLength,type) 
{
	
	$("#"+id+"_msg").hide();
	var tempValue = $("#"+id).val();
	if(type == 'm'){
		if(tempValue.length < minLength || tempValue.length > maxLength){
			$("#"+id).addClass("error_fld");
			$("#"+id).addClass("error");
			$("#"+id+"_error").fadeIn(500);
			return true;
		
		}else{
			return false;
		}
	}else if(type == 'o'){
		
		var Number = $("#"+id).val();
		var IndNum = /^[0]?[6789]\d{9}$/;
		if(tempValue.length!=0){
			
			if(tempValue.length < minLength || tempValue.length > maxLength){
				$("#"+id).addClass("error_fld");
				$("#"+id+"_error_limit").fadeIn(500);
				return true;
			
			}else if(tempValue.length == 10 && !(IndNum.test(Number))){
				$("#"+id).addClass("error_fld");
				$("#"+id+"_error_valid").fadeIn(500);
				return true;
			    //var Number = document.getElementById('YOUR ELEMENT ID').value;
				
			}else{
				return false;
			}
		}else if(tempValue.length ==0){
			
				$("#"+id).addClass("error_fld");
				$("#"+id+"_error").fadeIn(500);
				return true;
			
		}else{
				return false;
			}
	}
	
	/*else if(type == 'p')
	{
		if(tempValue.length < minLength)
		{
			$("#"+id).addClass("error_fld");
			$("#"+id+"_error_limit").fadeIn(500);
			return true;
		}
		else
		{
			return false;
		}
	}*/

}

function onblurcheckMeetingPerMonth(id)
{
var aa=document.getElementById("periodicityOfMeetingPerMonth").value;
if(aa>12)
{

	document.getElementById("periodicityOfMeetingPerMonth_periodicity").style.display="block";
	
}else{
	document.getElementById("periodicityOfMeetingPerMonth_periodicity").style.display="none";
}
 


}

function validateOnFocus(id)
{
	
			$("#"+id+"_msg").fadeIn(500);
			$("#"+id).removeClass("error_fld");
			$("#"+id+"_error").hide();
			$("#"+id+"_invalid_error").hide();
			$("#"+id+"_error_valid").hide();
			$("#"+id+"_error_limit").hide();
			$("#"+id+"_periodicity").hide();
			$("#"+id+"_error_zero").hide();
			$("#"+id+"_duplicate").hide();
//			$('#'+id).bind("cut copy paste",function(e) {
//			      e.preventDefault();
//			  });	
}


function dependentField(field1 ,field2)
{

	
///	alert("hi");
	$("#"+field1).val(trimString($("#"+field1).val()));
	$("#"+field2).val(trimString($("#"+field2).val()));
	
	///alert("asdasda");
	
	var first = $("#"+field1).val();
	var second = $("#"+field2).val();
	
	
	
	//alert(field1+field2+"first = "+"----"+"second = "+second);
	if(second.length>0)
		{
		if(!first.length>0)
			{
			$("#"+field1).addClass("error_fld");
			$("#"+field1+"_error").fadeIn(500);
			return true;
			}
		else
			{
			return false;
			}
		
		}
	return false;
	
}

function vlidateWebsiteOnblur(id){
	var panchayatWebsite=$("#"+id).val();
	var r=/^([a-z\.])+\.+(gov)+\.+(in)+$/;
	if (!r.test(panchayatWebsite)){
		$("#"+id).addClass("error_fld");
		$("#"+id+"_invalid_error").fadeIn(500);
		return true;
	}
	else {
		return false;}
	/*if(id.contains('.gov.in')){
		$("#"+id).addClass("error_fld");
		$("#"+id+"_invalid_error").fadeIn(500);
		return true;
	}
	else{
		return false;
	}*/
}
