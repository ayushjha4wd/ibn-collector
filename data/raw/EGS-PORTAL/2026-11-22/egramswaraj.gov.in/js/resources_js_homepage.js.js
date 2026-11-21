

//###############################  District list in a state ###############################
function getDistrict(){
	var id=$("#stateId").val();
	var level=$("#localBodyTypeCode").val();
	
	
	
	 if(id!="")
		 {
		 var theSel = document.getElementById("label1");
			lgdDao.getLocalBodyList(1,id,{
		 		  callback:function(list)
		 		  {
		 			  if(list.length>0)
		 				  {
		 				 for (var i = theSel.length - 1; i>=0; i--) 
		 				 {	   
		 					 theSel.remove(i);
		 				 } 
		 					 theSel.options[theSel.length] = new Option('select','');
		 					 for(var i=0; i<list.length;i++)
		 						 {
		 						 	theSel.options[theSel.length] = new Option(list[i].localBodyNameEnglish,list[i].localBodyCode);
		 						 }
		 				  }
		 			  
		 			  
		 			  else alert("Ooops districts not found .!");
		 			  
		 		  },preHook:function() {$(".process").fadeIn(500); },
				  postHook:function() { $(".process").fadeOut(); },
				 
				  errorHandler:function(message) { alert("Oops: " + message);}


		 	 });
		 }
}

//############################### get local body ###############################
function getLocalBody(s){

	var temp = s+"1";
	//alert("SelectedLabel = "+SelectedLabel);
	//alert("temp = "+temp);
	
	if(SelectedLabel != temp)
	{
		 var id=$("#"+s).val();   
		 if(id!="")
			     lgdDao.getParentwiseLbList(id,{
			    callback:function(list){
				 var theSel = document.getElementById(s+"1");
				 for (var i = theSel.length - 1; i>=0; i--) {
					   
					 theSel.remove(i);
				 }
				 theSel.options[theSel.length] = new Option('-- select --','');
				 for(var i=0; i<list.length;i++)
					 {
					 	theSel.options[theSel.length] = new Option(list[i].localBodyNameEnglish,list[i].localBodyCode);
					 }
			 },preHook:function() {$(".process").fadeIn(500); },
			  postHook:function() { $(".process").fadeOut(); },
			
			  errorHandler:function(message) { alert("Oops: " + message);}
			     
			     });
			}
	}	
		
	



var label = "label";
var SelectedLabel = "label1";
var listLocal;
//############################### get gov tier setup ###############################
function getGovTier()
{
	label ="label";
	listLocal  = new Array();
	$(".appendedTd").each(function() { $(this).remove();});
	var id=$("#stateId").val();
	if(id!="")
	lgdDao.getLocalGovTierSetupByCategory(id,'p',{
			  callback:function(list){ listLocal = list; if(list.length>0)createMyTr(list); else alert("Ooops government set up not found .!"); },
			  preHook:function() {$(".process").fadeIn(500); },
			  postHook:function() {$(".process").fadeOut(); if(listLocal.length>0){ } else alert("Ooops no record found .!"); },
			 
			  errorHandler:function(message) { alert("Oops: " + message);}		  
	
	});
	

}



function onSelectlocalBodyType()
{
	
	getDistrict();
	var p ="label1";
	for(var i=0;i<4;i++)
	{ 
		$("#"+p+"tr").hide();
		$("#"+p).val("");
		p = p+"1";
	}
	SelectedLabel = "label1";
	var t =$("#localBodyTypeCode").val();
	//alert(t);
	for(var i=0; i<t;i++)
	{ 
		$("#"+SelectedLabel+"tr").fadeIn(1000);
		SelectedLabel = SelectedLabel+"1";
	}

}



function onloadonSelectlocalBodyType()
{
	
	setDistrict();
	var p ="label1";
	for(var i=0; i<4;i++)
	{ 
		$("#"+p+"tr").fadeOut(1000).hide();
		$("#"+p).val("");
		p = p+"1";
	}
	SelectedLabel = "label1";
	var t =$("#localBodyTypeCodeLocal").val();
	
	
	for(var i=1; i<=t; i++)
	{ 
		
       	$("#"+SelectedLabel+"tr").fadeIn(1000).show();
		SelectedLabel = SelectedLabel+"1";
	}


}

//############################### Dynamically create tr ###############################
function createMyTr(list) {
	var dpType = "r";// $("#destinationPlaceType").val();
	hideTr();
	
	
	
	//alert(size);

	//for rlb type 
	if(dpType=='r')
		{
		
		var theSel = document.getElementById("localBodyTypeCode");
		 dwr.util.removeAllOptions('localBodyTypeCode');
		 theSel.options[theSel.length] = new Option('--Select--','');
		
		for(var i=0; i<list.length;i++)
			{ 
				label = label+"1";
				$("label[for="+"'"+label+"'"+"]").text(list[i].nomenclatureEnglish);
				
				
				theSel.options[theSel.length] = new Option(list[i].nomenclatureEnglish,list[i].localBodyTypeCode);
			
			}
	
		}
	else //for ulb type 
		{
		
			label = label+"1";
			$("label[for="+"'"+label+"'"+"]").text(list[0].nomenclatureEnglish);
			$("#"+label+"tr").fadeIn(1000);
			$("#"+label).removeAttr("onchange");
		
		}
	
}

function onloadcreateMyTr(list) {
	var dpType = "r";// $("#destinationPlaceType").val();
	//hideTr();
	
	
	
	//alert(size);

	//for rlb type 
	if(dpType=='r')
		{
		
		var theSel = document.getElementById("localBodyTypeCode");
		 dwr.util.removeAllOptions('localBodyTypeCode');
		 theSel.options[theSel.length] = new Option('--Select--','');
		
		for(var i=0; i<list.length;i++)
			{ 
				label = label+"1";
				$("label[for="+"'"+label+"'"+"]").text(list[i].nomenclatureEnglish);
				
				
				theSel.options[theSel.length] = new Option(list[i].nomenclatureEnglish,list[i].localBodyTypeCode);
			
			}
	
		}
	else //for ulb type 
		{
		
			label = label+"1";
			$("label[for="+"'"+label+"'"+"]").text(list[0].nomenclatureEnglish);
			$("#"+label+"tr").fadeIn(1000);
			$("#"+label).removeAttr("onchange");
		
		}
	
}


//######################################## for hide the tr's ############################333 
function hideTr()
{
	var l = "label1";
	
	for(var i=1; i<4 ;i++)
		{
		$("#"+l).val("");
		$("#"+l+"tr").fadeOut(1000);
		 l = l+"1";
		}
}





//############################################### validation on submit  ################################################ 

function validateMigrationForm() 
{
	
	var errors = new Array();
	var error = false;

	errors[0] = vlidateOnblur('villageId', '1', '60', 'm');
	errors[1] = vlidateOnblur('familyId', '1', '60', 'm');
	var migrationType = $('input[name=migrationType]:checked').val();
	if(migrationType=="f")
		{
	errors[2] = vlidateOnblur('reason', '1', '60', 'm');
       }
	errors[3] = vlidateOnblur('dateOfMigration', '1', '60', 'm');
	
	
	if(migrationType=="fm")
		{
		var src = document.getElementById("familyMemberId");
	//	alert("optins="+src.options.length);
		if(src.options.length>0)
			{
			errors[4] = false;
			}
		else
			{
			errors[4] = true;
			$("#familyMemberId_error").show();
			
			}
		 
		
		}
	else
		{
		errors[4] = false;
		}
	
	errors[5] = vlidateOnblur('destinationPlaceType', '1', '6', 'm');
	
	// Dependent field on destinationPlaceType validation 
	var destinationPlaceType  = $("#destinationPlaceType").val();
	var destinationPlaceLevel = $("#destinationLevel").val();
	errors[13] = vlidateOnblur('destinationLevel', '1', '6', 'm');
	 
	  if(destinationPlaceType == "r" && destinationPlaceLevel=="os")
		{
			  errors[6] = vlidateOnblur('pinCode', '6', '6', 'm');
			  errors[7] = vlidateOnblur('stateId', '1', '60', 'm');
			  errors[8] = vlidateOnblur('label1', '1', '60', 'm');
		      errors[9] = vlidateOnblur('label11', '1', '60', 'm');
			  errors[10] = vlidateOnblur('label111', '1', '60', 'm');
			  errors[11] = vlidateOnblur('villageIdNew', '1', '60', 'm');
		}
		else if(destinationPlaceType == "r" && destinationPlaceLevel=="ws")
		{
			  errors[6] = vlidateOnblur('pinCode', '6', '6', 'm');
			  errors[7] =false;
			  errors[8] = vlidateOnblur('label1', '1', '60', 'm');
		      errors[9] = vlidateOnblur('label11', '1', '60', 'm');
			  errors[10] = vlidateOnblur('label111', '1', '60', 'm');
			  errors[11] = vlidateOnblur('villageIdNew', '1', '60', 'm');
		}
		else if(destinationPlaceType == "r" && destinationPlaceLevel=="dp")
		{
			  errors[6] = vlidateOnblur('pinCode', '6', '6', 'm');
			  errors[7] = false;
			  errors[8] = false;
		      errors[9] = vlidateOnblur('label11', '1', '60', 'm');
			  errors[10] = vlidateOnblur('label111', '1', '60', 'm');
			  errors[11] = vlidateOnblur('villageIdNew', '1', '60', 'm');
		}
		else if(destinationPlaceType == "r" && destinationPlaceLevel=="bp")
		{
		
			  errors[6] = vlidateOnblur('pinCode', '6', '6', 'm');
			  errors[7] = false;
			  errors[8] = false;
		      errors[9] = false;
			  errors[10] = vlidateOnblur('label111', '1', '60', 'm');
			  errors[11] = vlidateOnblur('villageIdNew', '1', '60', 'm');
			
		}
		else if(destinationPlaceType == "r" && destinationPlaceLevel=="vp")
		{
			  errors[6] = vlidateOnblur('pinCode', '6', '6', 'm');
			  errors[7] = false;
			  errors[8] = false;
		      errors[9] = false;
			  errors[10] = false;
			  errors[11] = vlidateOnblur('villageIdNew', '1', '60', 'm');
		}
		else if(destinationPlaceType == "u")
		{
		
		errors[6] = vlidateOnblur('pinCode', '6', '6', 'm');
		errors[7] = vlidateOnblur('stateId', '1', '60', 'm');
		errors[8] = vlidateOnblur('label1', '1', '60', 'm');
		errors[9] = false;
		errors[10] = false;
		errors[11] = false;
		
		}
	
	else
		{
		errors[6] = false;
		errors[7] = false;
		errors[8] =false;
		errors[9] =false;
		errors[10]= false;
		errors[11] =false;
		}

	errors[12] = vlidateOnblur('addLine1', '1', '60', 'm');
	
	
	
	for ( var i = 0; i <=12; i++) {
		//alert(errors[i]);
		if (errors[i] == true) {
			error = true;
			break;
		}
	}
	if (error == true) {
		alert("Please fill the form properly ...!");
		return false;
	} else {
		return true;
	}
}




