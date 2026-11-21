var schemeWiseUnspendBalanceReportModule = angular.module('schemeWiseUnspendBalanceReportModule', ['angular.filter']);
schemeWiseUnspendBalanceReportModule.controller("schemeWiseUnspendBalanceReportController", ['$scope', "schemeWiseUnspendBalanceReportService", function($scope, schemeWiseUnspendBalanceReportService) {

$scope.stateCode = "";
$scope.stateName = null;
$scope.finYear = null;
$scope.type = 'MAIN';
$scope.blockName = null;
$scope.blockCode = 0 ;
$scope.districtCode = 0 ;
$scope.districtName = null;
$scope.headings = false;                                                                                      
$scope.schemeList ={};
$scope.reptype = null;
$scope.clearSelections = function clearSelections(){
	$scope.stateCode = "";
	$scope.stateName = null;
	//$scope.finYear = null;
	$scope.schemeUid = null;
	$scope.schemeComponent = null;
	$scope.reportType = null;
	 $scope.schemeName = null;
	 $scope.schemecomponentname = null;
	 $("input[name='viewType']").prop("checked", false);
	 //$("input[name='componentType']").prop("checked", false);
	 $("#fromAmount").val("");
	 $scope.fromAmountIn = null;
	 $("#toAmount").val("");
	 $scope.toAmountIn = null;
	 $scope.schemeList = {};
	 $("#close").hide();
	$scope.type = 'MAIN';
	$scope.headings = false;
	
	$("#schemeComponentDiv").hide();
	$("#stateDiv").hide();
	$scope.blockName = null;
	$scope.blockCode = 0 ;
	$scope.districtCode = 0 ;
	$scope.districtName = null;
	$scope.reptype = null;
	refreshCaptcha();
}

function getStateTier(stateCode){
	$scope.stateTier = null;
	schemeWiseUnspendBalanceReportService.getStateTier(stateCode).then(function(response){
		$scope.stateTier = response.data;
	});
}

$scope.showState = function showState(type) {
	$scope.reportType = type;
	$("#stateDiv").hide();
	$("input[name='viewType']").prop("checked", false);
	// $("input[name='componentType']").prop("checked", false);
	$scope.schemeList = {};
	$scope.stateCode = "";
	$scope.schemeComponent = null;
	$("#schemeComponentDiv").hide();
	 $("#fromAmount").val("");
	 $scope.fromAmountIn = null;
	 $("#toAmount").val("");
	 $scope.toAmountIn = null;
	 //refreshCaptcha();
	
}

	$scope.onScheme = function onScheme(state) {
		var finYear = document.getElementById("yearid").value;
		var stateName = $("#StateId option:selected").text();
		$scope.finYear = finYear;
		$scope.stateCode = state;
		if(state!=-1){
		getStateTier(state);
		}
		$scope.stateName = stateName;
		getSchemeList(state,finYear);
		
		$scope.schemeComponent = null;
		$("#schemeComponentDiv").hide();
		 $("#fromAmount").val("");
		 $scope.fromAmountIn = null;
		 $("#toAmount").val("");
		 $scope.toAmountIn = null;
		 //refreshCaptcha();
	}
	
	function getSchemeList(state,finYear) {
		$scope.schemeList = {};
		schemeWiseUnspendBalanceReportService.getSchemeList(state,finYear,$scope.reptype).then(function(response) {
			var schemeDetail = new Array();
			angular.forEach(response.data, function(obj, key) {
			   var scheme = new schemeDetails();
			   scheme.schemeId = obj.schemeid;
			   if(obj.scheme_category == 'O') {
				   scheme.schemeCategory = "Other Resources";
			   } else if(obj.scheme_category == 'C') {
				   scheme.schemeCategory = "Central Schemes";
			   } else if(obj.scheme_category == 'S') {
				   scheme.schemeCategory = "State Schemes";
			   } else {
				   scheme.schemeCategory = obj.scheme_category;
			   }
			   scheme.schemeName = obj.resourcedesc + "-" + obj.schemename_abbreviation;
			   schemeDetail.push(scheme);
		   });	
		   $scope.schemeList = schemeDetail;
   		});
	}
	
	
	
	$scope.component = function component(schemeCode){
		if(schemeCode >= 0){
			$scope.componentType = 'AC';
			$("#selectCompDiv").show();
			$("#fromAmount").val("");
			 $scope.fromAmountIn = null;
			 $("#toAmount").val("");
			 $scope.toAmountIn = null;
			 //refreshCaptcha();
		}
	}

	$scope.showComp = function showComp(schemeCode,componentType,stateCode){
		if(componentType == 'IC'){
		$("#schemeComponentDiv").show();
		getSchemeChild(schemeCode,"R",0,stateCode);
		$("#fromAmount").val("");
		 $scope.fromAmountIn = null;
		 $("#toAmount").val("");
		 $scope.toAmountIn = null;
		 //refreshCaptcha();
		}else{
			$("#schemeComponent").val("");
			$("#schemeComponentDiv").hide();
			$("#fromAmount").val("");
			 $scope.fromAmountIn = null;
			 $("#toAmount").val("");
			 $scope.toAmountIn = null;
			 //refreshCaptcha();
		}
	}
	

	function getSchemeChild(schemeCode,ac_head_type,workCode,stateCode) {
		
		schemeWiseUnspendBalanceReportService.getSchemeChild(schemeCode,ac_head_type,workCode,stateCode).then(function(response) {
			$scope.data = response.data;
			var schemeDetail = new Array();
			angular.forEach($scope.data, function(obj, key) {
					scheme = new schemeChildDetails();
					scheme.schemeid = obj.schemeid;
					scheme.schemeName = obj.resourcedesc;
					schemeDetail.push(scheme);
				
			});	
			$scope.childdetails = schemeDetail;
			
	    });
	}
	
	$scope.showType = function showType(type) {
		$scope.reptype = type;
		if ($scope.reportType == 'I'){
			$("#stateDiv").show();
			getStateList();
			
			$scope.schemeList = {};
			$scope.schemeComponent = null;
			$("#schemeComponentDiv").hide();
			 $("#fromAmount").val("");
			 $scope.fromAmountIn = null;
			 $("#toAmount").val("");
			 $scope.toAmountIn = null;
			 //refreshCaptcha();
			
		} else {
			$("#stateDiv").hide();
			$scope.onScheme(-1);
			$scope.schemeList = {};
			$scope.schemeComponent = null;
			$("#schemeComponentDiv").hide();
			 $("#fromAmount").val("");
			 $scope.fromAmountIn = null;
			 $("#toAmount").val("");
			 $scope.toAmountIn = null;
			 //refreshCaptcha();
		}
	}
	       
	
	function getStateList() {
		var finYear = document.getElementById("yearid").value;
		$scope.stateList = {};
		schemeWiseUnspendBalanceReportService.getZpBpGpStateList($scope.reptype,finYear).then(function(response) {
		   $scope.stateList = response.data;
   		});
	}
		
	$scope.generateReport = function generateReport(target) {
		var error = false;
		$('.errored').hide();
		
		if(!$("input[name='reportType']").is(":checked")) {
			$("#reportType_error").show();
			error = true;
		} else {
			if($("input[name='reportType']:checked").val() == 'I') {
				if($scope.stateCode == null || $scope.stateCode == 0 || $scope.stateCode == "") {
					$("#State_error").show();
					error = true;
				}
			}
		}
		
		if(!$("input[name='viewType']").is(":checked")) {
			$("#viewType_error").show();
			error = true;
		} 
		
		if($("#yearid").val() == null || $("#yearid").val() == 0 || $("#yearid").val() == "") {
			$("#finclYear_error").show();
			error = true;
		}
		
		if($("#schemeUid").val() == null || $("#schemeUid").val() == "") {
			$("#schemeUid_error").show();
			error = true;
		}else {
			 $scope.schemeUid=$("#schemeUid").val();
			 $scope.schemeName = $("#schemeUid option:selected").text();
		}
		
		if( $("#schemeUid").val() != "" ){
		if(!$("input[name='componentType']").is(":checked")) {
			$("#componentType_error").show();
			error = true;
		} else {
			if($("input[name='componentType']:checked").val() == 'IC') {
				if($("#schemeComponent").val() == null || $("#schemeComponent").val() == -1 || $("#schemeComponent").val() == "") {
					$("#schemeComponent_error").show();
					error = true;
				}else {
					 $scope.schemeComponent=$("#schemeComponent").val();
					 $scope.schemecomponentname = $("#schemeComponent option:selected").text();
				}
			}
		}
		}
				
		if($("input[name='amountIn']").is(":checked")) {
			$scope.amountIn = $("input[name='amountIn']:checked").val();
			if($scope.amountIn=="RS"){
				$scope.amt = "in Rupees";
			}else if($scope.amountIn =="LK"){
				$scope.amt = "in Lakhs";
			}else if($scope.amountIn == "CR"){
				$scope.amt = "in Crores";
			}
		}
		
		var toAmount = $("#toAmount").val();
	    var fromAmt = $("#fromAmount").val();
	    if(fromAmt != "" && toAmount != ""){
		    if (toAmount <= fromAmt) {
				$("#toAmount").val("");
				alert("Please Enter Valid Amount");
				error = true;
			} 
	    }
	    fromAmt=0;
	    toAmount=0;
	    if(fromAmt != ""){
	    var z = fromAmt;
		z = z.trim();
		if (z === "" || isNaN(z)) {
			$("#fromAmount_error1").show();
			$("#fromAmount").val("");
			error = true;
		}else{
			$("#fromAmount_error1").hide();
		}
		if (z == 00) {
			$("#fromAmount").val("");
			alert("Please Enter Valid Amount");
			error = true;
		} 
	}
	    if(toAmount != ""){
	    var z = toAmount;
	    z = z.trim();
		if (z === "" || isNaN(z)) {
			$("#toAmount_error1").show();
			$("#toAmount").val("");
			error = true;
		}else{
			$("#toAmount_error1").hide();
		}
		if (z == 00) {
			$("#toAmount").val("");
		alert("Please Enter Valid Amount");
		error = true;
		}
	}
		
		
		if($("#captchaAnswer").val() == null || $("#captchaAnswer").val() == "") {
			$("#captchaAnswer_error").show();
			error = true;	
		}
		if(target == 'submit' && !error) {
			$('.errored').hide();
			var captchaVal = $("#captchaAnswer").val();
			var status = validateCaptcha(captchaVal);
			if(status) {
				refreshCaptcha();
				$("#stateHidden").val($scope.stateCode);
				$("#schemeHidden").val($("#schemeUid").val());
				if($scope.reptype == 'V'){
					$scope.level = "Village Panchayat And Equivalent";
					if($scope.stateCode != -1) {
						$scope.getDistrict();
					}else{
						getState();
					}
				}else if($scope.reptype == 'B'){
					$scope.level = "Block Panchayat And Equivalent";
					if($scope.stateCode != -1) {
						$scope.getDistrict();
					}else{
						getState();
					}
				}else if($scope.reptype == 'Z'){
					$scope.level = "Zilla Panchayat And Equivalent";
					if($scope.stateCode != -1) {
						$scope.getDistrict();
					}else{
						getState();
					}
				}
				$("#close").show();
			} else {
				$("#captchaAnswer_error1").show();
				refreshCaptcha();
			
			}
		}
	}
	function getState() {
		$scope.loader = true;
		$scope.StateList ={};
		$scope.countList = {};
		$scope.sumOb_amount = 0;
		$scope.sumReceipt_amount_direct = 0;
		$scope.sumReceipt_amount_auto = 0;
		$scope.sumPayment_amount = 0;
		$scope.sumUnspent_amount = 0;
		$scope.sumdateOfEntry = 0;
		$scope.stateName = null;
		$scope.headings = true;
		$scope.reportHeaderTitle = "STATE WISE RECEIPTS AND EXPENDITURES ";
		$("#mainDiv").hide();
		$("#stateListDiv").show();
		$("#stateDrillListDiv").hide();
		$("#districtDiv").hide();
		$("#blockDiv").hide();
		$("#villageDiv").hide();
		$scope.type = 'S';
		$scope.schemeComponent = $("#schemeComponent").val();
		$scope.fromAmount = $("#fromAmount").val();
		$scope.fromAmountIn = $("#fromAmountIn").val();
		$scope.toAmount = $("#toAmount").val();
		$scope.toAmountIn = $("#toAmountIn").val();
		$scope.fromAmount ='';
		$scope.toAmount ='';
		
		schemeWiseUnspendBalanceReportService.generateState($scope.finYear, $scope.schemeUid, $scope.reptype,$scope.schemeComponent,$scope.fromAmount,$scope.toAmount,$scope.amountIn).then(function(response){
			if(response.data.length > 0) {
			$scope.StateList = response.data;
			var sum =  new sumCount();
			angular.forEach(response.data, function(obj, key) {
				 if($scope.amountIn=="RS"){
					 sum.sumReceipt_amount_direct = parseFloat((parseFloat(sum.sumReceipt_amount_direct)) + obj.receiptAmountDirect).toFixed(2);
					 sum.sumReceipt_amount_auto = parseFloat((parseFloat(sum.sumReceipt_amount_auto)) + obj.receiptAmountAuto).toFixed(2);
					 sum.sumPayment_amount = parseFloat((parseFloat(sum.sumPayment_amount)) + obj.paymentAmount).toFixed(2);
					 sum.sumOb_amount = parseFloat((parseFloat(sum.sumOb_amount)) + obj.obAmount).toFixed(2);
					 sum.sumUnspent_amount = parseFloat((parseFloat(sum.sumUnspent_amount)) + obj.unspentAmount).toFixed(2);
					 
				 }else if($scope.amountIn=="LK"){
					 sum.sumPayment_amount = parseFloat((parseFloat(sum.sumPayment_amount)) + obj.paymentAmount).toFixed(3);
					 sum.sumReceipt_amount_direct =   parseFloat((parseFloat(sum.sumReceipt_amount_direct)) + obj.receiptAmountDirect).toFixed(3);
					 sum.sumReceipt_amount_auto =   parseFloat((parseFloat(sum.sumReceipt_amount_auto)) + obj.receiptAmountAuto).toFixed(3);
					 sum.sumOb_amount =  parseFloat((parseFloat(sum.sumOb_amount)) + obj.obAmount).toFixed(3);
					 sum.sumUnspent_amount =  parseFloat((parseFloat(sum.sumUnspent_amount)) + obj.unspentAmount).toFixed(3);
					 
				 }else if($scope.amountIn=="CR"){
					 sum.sumPayment_amount =  parseFloat((parseFloat(sum.sumPayment_amount)) + obj.paymentAmount).toFixed(3);
					 sum.sumReceipt_amount_direct =  parseFloat((parseFloat(sum.sumReceipt_amount_direct)) + obj.receiptAmountDirect).toFixed(3);
					 sum.sumReceipt_amount_auto =  parseFloat((parseFloat(sum.sumReceipt_amount_auto)) + obj.receiptAmountAuto).toFixed(3);
					 sum.sumOb_amount =  parseFloat((parseFloat(sum.sumOb_amount)) + obj.obAmount).toFixed(3);
					 sum.sumUnspent_amount =  parseFloat((parseFloat(sum.sumUnspent_amount)) + obj.unspentAmount).toFixed(3);
					 
				 }
				
				 sum.sumdateOfEntry = obj.dateOfEntry;
				
			});
			
			$scope.countList = sum;
			$scope.loader = false;
		}else {
			$scope.loader = false;
			$("#mainDiv").show();
			$("#stateListDiv").hide();
			$("#stateDrillListDiv").hide();
			$("#districtDiv").hide();
			$("#blockDiv").hide();
			$("#villageDiv").hide();
			$("#stateDiv").hide();
			$scope.clearSelections();
			alert("No Data Found");
			
		}
		});
		
		/*schemeWiseUnspendBalanceReportService.generateState($scope.finYear, $scope.schemeUid, $scope.reptype,$scope.schemeComponent,$scope.fromAmount,$scope.toAmount,$scope.amountIn).then(function(response){
			if(response.data.length > 0) {
				 var stateDetail = new Array();
				 var sum =  new sumCount();
				 var tempName = "";
				angular.forEach(response.data, function(obj, key) {
					 var state = new stateDetails();
					 if(tempName != obj.name) {
						 state.name = obj.name;
					 } else {
						 state.name = "";
					 }
					 state.code = obj.code;
					 state.schemename = obj.schemename;
					 state.dateOfEntry=obj.dateOfEntry;
					 
					 state.obAmount =  obj.obAmount;
					 state.receiptAmountDirect =  obj.receiptAmountDirect;
					 state.receiptAmountAuto =  obj.receiptAmountAuto;
					 state.paymentAmount =  obj.paymentAmount;
					 state.unspentAmount =  obj.unspentAmount;
					 
					 if($scope.amountIn=="RS"){
						 state.obAmount =  parseFloat(parseFloat(obj.obAmount)).toFixed(2);
						 state.receiptAmountDirect =  parseFloat(parseFloat(obj.receiptAmountDirect)).toFixed(2);
						 state.receiptAmountAuto =  parseFloat(parseFloat(obj.receiptAmountAuto)).toFixed(2);
						 state.paymentAmount =  parseFloat(parseFloat(obj.paymentAmount)).toFixed(2);
						 state.unspentAmount =  parseFloat(((parseFloat(obj.obAmount)) + (parseFloat(obj.receiptAmountDirect)) + (parseFloat(obj.receiptAmountAuto)) - (parseFloat(obj.paymentAmount)))).toFixed(2);
					 
					 }else if($scope.amountIn=="LK"){
						 state.obAmount = parseFloat(parseFloat(obj.obAmount)/100000).toFixed(3);
						 state.receiptAmountDirect = parseFloat(parseFloat(obj.receiptAmountDirect)/100000).toFixed(3);
						 state.receiptAmountAuto = parseFloat(parseFloat(obj.receiptAmountAuto)/100000).toFixed(3);
						 state.paymentAmount = parseFloat(parseFloat(obj.paymentAmount)/100000).toFixed(3);
						 state.unspentAmount = parseFloat(((parseFloat(obj.obAmount/100000)) + (parseFloat(obj.receiptAmountDirect/100000)) + (parseFloat(obj.receiptAmountAuto/100000)) - (parseFloat(obj.paymentAmount/100000)))).toFixed(3);
						 
					 }else if($scope.amountIn=="CR"){
						 state.obAmount = parseFloat(parseFloat(obj.obAmount)/10000000).toFixed(3);
						 state.receiptAmountDirect = parseFloat(parseFloat(obj.receiptAmountDirect)/10000000).toFixed(3);
						 state.receiptAmountAuto = parseFloat(parseFloat(obj.receiptAmountAuto)/10000000).toFixed(3);
						 state.paymentAmount = parseFloat(parseFloat(obj.paymentAmount)/10000000).toFixed(3);
						 state.unspentAmount = parseFloat(((parseFloat(obj.obAmount/10000000)) + (parseFloat(obj.receiptAmountDirect/10000000)) + (parseFloat(obj.receiptAmountAuto/10000000)) - (parseFloat(obj.paymentAmount/10000000)))).toFixed(3);
					 }
					 
					 var availableFunds =  parseFloat(parseFloat(obj.obAmount) + parseFloat(obj.receiptAmountDirect) + parseFloat(obj.receiptAmountAuto)).toFixed(3);
					 var unspentBalance =   parseFloat(parseFloat(availableFunds) -  parseFloat(obj.paymentAmount)).toFixed(3);
					 if(availableFunds!= 0.000){
						 state.percentageExp = parseFloat(parseFloat(parseFloat(unspentBalance) / parseFloat(availableFunds))*100).toFixed(2);
					 }else{
						 state.percentageExp = 0.00;
					 }
					 stateDetail.push(state);
					 
					 if($scope.amountIn=="RS"){
						 sum.sumReceipt_amount_direct = parseFloat((parseFloat(sum.sumReceipt_amount_direct)) + obj.receiptAmountDirect).toFixed(2);
						 sum.sumReceipt_amount_auto = parseFloat((parseFloat(sum.sumReceipt_amount_auto)) + obj.receiptAmountAuto).toFixed(2);
						 sum.sumPayment_amount = parseFloat((parseFloat(sum.sumPayment_amount)) + obj.paymentAmount).toFixed(2);
						 sum.sumOb_amount = parseFloat((parseFloat(sum.sumOb_amount)) + obj.obAmount).toFixed(2);
						 sum.sumUnspent_amount = parseFloat((parseFloat(sum.sumUnspent_amount)) + obj.unspentAmount).toFixed(2);
						 
					 }else if($scope.amountIn=="LK"){
						 sum.sumPayment_amount = parseFloat((parseFloat(sum.sumPayment_amount)) + obj.paymentAmount).toFixed(3);
						 sum.sumReceipt_amount_direct =   parseFloat((parseFloat(sum.sumReceipt_amount_direct)) + obj.receiptAmountDirect/100000).toFixed(3);
						 sum.sumReceipt_amount_auto =   parseFloat((parseFloat(sum.sumReceipt_amount_auto)) + obj.receiptAmountAuto).toFixed(3);
						 sum.sumOb_amount =  parseFloat((parseFloat(sum.sumOb_amount)) + obj.obAmount).toFixed(3);
						 sum.sumUnspent_amount =  parseFloat((parseFloat(sum.sumUnspent_amount)) + obj.unspentAmount).toFixed(3);
						 
					 }else if($scope.amountIn=="CR"){
						 sum.sumPayment_amount =  parseFloat((parseFloat(sum.sumPayment_amount)) + obj.paymentAmount).toFixed(3);
						 sum.sumReceipt_amount_direct =  parseFloat((parseFloat(sum.sumReceipt_amount_direct)) + obj.receiptAmountDirect).toFixed(3);
						 sum.sumReceipt_amount_auto =  parseFloat((parseFloat(sum.sumReceipt_amount_auto)) + obj.receiptAmountAuto).toFixed(3);
						 sum.sumOb_amount =  parseFloat((parseFloat(sum.sumOb_amount)) + obj.obAmount).toFixed(3);
						 sum.sumUnspent_amount =  parseFloat((parseFloat(sum.sumUnspent_amount)) + obj.unspentAmount).toFixed(3);
						 
					 }
					 
					 if($scope.amountIn=="RS"){
						 sum.sumReceipt_amount_direct = parseFloat((parseFloat(sum.sumReceipt_amount_direct)) + (parseFloat(obj.receiptAmountDirect))).toFixed(2);
						 sum.sumReceipt_amount_auto = parseFloat((parseFloat(sum.sumReceipt_amount_auto)) + (parseFloat(obj.receiptAmountAuto))).toFixed(2);
						 sum.sumPayment_amount = parseFloat((parseFloat(sum.sumPayment_amount)) + (parseFloat(obj.paymentAmount))).toFixed(2);
						 sum.sumOb_amount = parseFloat((parseFloat(sum.sumOb_amount)) + (parseFloat(obj.obAmount))).toFixed(2);
						 sum.sumUnspent_amount =  parseFloat((parseFloat(sum.sumUnspent_amount)) + ((parseFloat(obj.obAmount)) + (parseFloat(obj.receiptAmountDirect)) + (parseFloat(obj.receiptAmountAuto)) - (parseFloat(obj.paymentAmount)))).toFixed(2);
						 
					 }else if($scope.amountIn=="LK"){
						 sum.sumPayment_amount = parseFloat((parseFloat(sum.sumPayment_amount)) + (parseFloat(obj.paymentAmount/100000))).toFixed(3);
						 sum.sumReceipt_amount_direct =   parseFloat((parseFloat(sum.sumReceipt_amount_direct)) + (parseFloat(obj.receiptAmountDirect/100000))).toFixed(3);
						 sum.sumReceipt_amount_auto =   parseFloat((parseFloat(sum.sumReceipt_amount_auto)) + (parseFloat(obj.receiptAmountAuto/100000))).toFixed(3);
						 sum.sumOb_amount =  parseFloat((parseFloat(sum.sumOb_amount)) + (parseFloat(obj.obAmount/100000))).toFixed(3);
						 sum.sumUnspent_amount =  parseFloat((parseFloat(sum.sumUnspent_amount)) + ((parseFloat(obj.obAmount/100000)) +  (parseFloat(obj.receiptAmountDirect/100000)) + (parseFloat(obj.receiptAmountAuto/100000)) - (parseFloat(obj.paymentAmount/100000)))).toFixed(3);
						 
					 }else if($scope.amountIn=="CR"){
						 sum.sumPayment_amount =  parseFloat((parseFloat(sum.sumPayment_amount)) + (parseFloat(obj.paymentAmount/10000000))).toFixed(3);
						 sum.sumReceipt_amount_direct =  parseFloat((parseFloat( sum.sumReceipt_amount_direct)) + (parseFloat(obj.receiptAmountDirect/10000000))).toFixed(3);
						 sum.sumReceipt_amount_auto =  parseFloat((parseFloat( sum.sumReceipt_amount_auto)) + (parseFloat(obj.receiptAmountAuto/10000000))).toFixed(3);
						 sum.sumOb_amount =  parseFloat((parseFloat(sum.sumOb_amount)) + (parseFloat(obj.obAmount/10000000))).toFixed(3);
						 sum.sumUnspent_amount =  parseFloat((parseFloat(sum.sumUnspent_amount)) + ((parseFloat(obj.obAmount/10000000)) + (parseFloat(obj.receiptAmountDirect/10000000)) + (parseFloat(obj.receiptAmountAuto/10000000)) - (parseFloat(obj.paymentAmount/10000000)))).toFixed(3);
					 }
					 
					 sum.sumdateOfEntry = obj.dateOfEntry;
					 tempName = obj.name;
				}, function(error) {
			    	$scope.loader = false;
			    });
				
				 $scope.StateList = stateDetail;
				 $scope.countList = sum;
				$scope.loader = false;
			} else {
				$scope.loader = false;
				$("#mainDiv").show();
				$("#stateListDiv").hide();
				$("#stateDrillListDiv").hide();
				$("#districtDiv").hide();
				$("#blockDiv").hide();
				$("#villageDiv").hide();
				$("#stateDiv").hide();
				$scope.clearSelections();
				alert("No Data Found");
				
			}
		});*/
	}
	
	$scope.getStateDrill = function getStateDrill(statecode, statename) {
		$scope.statecode = statecode;
		$scope.stateName = statename;
		$scope.stateTier = null;
		schemeWiseUnspendBalanceReportService.getStateTier(statecode).then(function(response){
			$scope.stateTier = response.data;
			$scope.loader = true;
			$scope.StateDrillList ={};
			$scope.countList = {};
			$scope.sumOb_amount = 0;
			$scope.sumReceipt_amount_direct = 0;
			$scope.sumReceipt_amount_auto = 0;
			$scope.sumPayment_amount = 0;
			$scope.sumUnspent_amount = 0;
			$scope.sumdateOfEntry = 0;
			if($scope.stateTier == 'A' || $scope.stateTier == 'AB' || $scope.stateTier == 'ZG'){
				$scope.reportHeaderTitle = "DISTRICT WISE RECEIPTS AND EXPENDITURES ";
			}else if($scope.stateTier == 'IG'){
				$scope.reportHeaderTitle = "BLOCK WISE RECEIPTS AND EXPENDITURES";
			}else if($scope.stateTier == 'GP'){
				$scope.reportHeaderTitle = "VILLAGE WISE RECEIPTS AND EXPENDITURES";
			}
			//$scope.reportHeaderTitle = "VILLAGE WISE RECEIPTS AND EXPENDITURES";
			$scope.type = 'SD';
			$("#mainDiv").hide();
			$("#districtDiv").hide();
			$("#stateListDiv").hide();
			//$("#stateDrillListDiv").hide();
			$("#stateDrillListDiv").show();
			$("#blockDiv").hide();
			$("#villageDiv").hide();
			$("#stateHidden").val($scope.statecode);
			$scope.schemeComponent = $("#schemeComponent").val();
			$scope.fromAmount = $("#fromAmount").val();
			$scope.fromAmountIn = $("#fromAmountIn").val();
			$scope.toAmount = $("#toAmount").val();
			$scope.toAmountIn = $("#toAmountIn").val();
			$scope.fromAmount ='';
			$scope.toAmount ='';
			
			schemeWiseUnspendBalanceReportService.generateStateDrill($scope.finYear,$scope.schemeUid, $scope.statecode,$scope.reptype,$scope.schemeComponent,$scope.fromAmount,$scope.toAmount,$scope.amountIn).then(function(response){
				if(response.data.length > 0) {
					$scope.StateDrillList = response.data;
				var sum =  new sumCount();
				angular.forEach(response.data, function(obj, key) {
					if($scope.amountIn=="RS"){
						 sum.sumReceipt_amount_direct = parseFloat((parseFloat(sum.sumReceipt_amount_direct)) + obj.receiptAmountDirect).toFixed(2);
						 sum.sumReceipt_amount_auto = parseFloat((parseFloat(sum.sumReceipt_amount_auto)) + obj.receiptAmountAuto).toFixed(2);
						 sum.sumPayment_amount = parseFloat((parseFloat(sum.sumPayment_amount)) + obj.paymentAmount).toFixed(2);
						 sum.sumOb_amount = parseFloat((parseFloat(sum.sumOb_amount)) + obj.obAmount).toFixed(2);
						 sum.sumUnspent_amount = parseFloat((parseFloat(sum.sumUnspent_amount)) + obj.unspentAmount).toFixed(2);
						 
					 }else if($scope.amountIn=="LK"){
						 sum.sumPayment_amount = parseFloat((parseFloat(sum.sumPayment_amount)) + obj.paymentAmount).toFixed(3);
						 sum.sumReceipt_amount_direct =   parseFloat((parseFloat(sum.sumReceipt_amount_direct)) + obj.receiptAmountDirect).toFixed(3);
						 sum.sumReceipt_amount_auto =   parseFloat((parseFloat(sum.sumReceipt_amount_auto)) + obj.receiptAmountAuto).toFixed(3);
						 sum.sumOb_amount =  parseFloat((parseFloat(sum.sumOb_amount)) + obj.obAmount).toFixed(3);
						 sum.sumUnspent_amount =  parseFloat((parseFloat(sum.sumUnspent_amount)) + obj.unspentAmount).toFixed(3);
						 
					 }else if($scope.amountIn=="CR"){
						 sum.sumPayment_amount =  parseFloat((parseFloat(sum.sumPayment_amount)) + obj.paymentAmount).toFixed(3);
						 sum.sumReceipt_amount_direct =  parseFloat((parseFloat(sum.sumReceipt_amount_direct)) + obj.receiptAmountDirect).toFixed(3);
						 sum.sumReceipt_amount_auto =  parseFloat((parseFloat(sum.sumReceipt_amount_auto)) + obj.receiptAmountAuto).toFixed(3);
						 sum.sumOb_amount =  parseFloat((parseFloat(sum.sumOb_amount)) + obj.obAmount).toFixed(3);
						 sum.sumUnspent_amount =  parseFloat((parseFloat(sum.sumUnspent_amount)) + obj.unspentAmount).toFixed(3);
						 
					 }
					sum.sumdateOfEntry = obj.dateOfEntry;
				});
				
				$scope.countList = sum;
				$scope.loader = false;
			}else {
				$scope.loader = false;
				$("#mainDiv").hide();
				$("#stateListDiv").show();
				$("#stateDrillListDiv").hide();
				$("#districtDiv").hide();
				$("#blockDiv").hide();
				$("#villageDiv").hide();
				$("#stateDiv").hide();
				$scope.clearSelections();
				alert("No Data Found");
				
			}
			});			
			
			
			
			
			/*schemeWiseUnspendBalanceReportService.generateStateDrill($scope.finYear,$scope.schemeUid, $scope.statecode,$scope.reptype,$scope.schemeComponent,$scope.fromAmount,$scope.toAmount,$scope.amountIn).then(function(response){
				 var drillDetail = new Array();
				 var sum =  new sumCount();
				 var tempNameZp = "";
				 var tempNameBp = "";
				 var tempNameVp = "";
				angular.forEach(response.data, function(obj, key) {
					 var drill = new drillDetails();
					 if(tempNameZp != obj.zp_name) {
						 drill.zp_name = obj.zp_name;
					 } else {
						 drill.zp_name = "";
					 }
					 drill.zp_code = obj.zp_code;
					 
					 if(tempNameBp != obj.bp_name) {
						 drill.bp_name = obj.bp_name;
					 } else {
						 drill.bp_name = "";
					 }
					 drill.bp_code = obj.bp_code;
					 
					 if(tempNameVp != obj.local_body_name_english) {
						 drill.local_body_name_english = obj.local_body_name_english;
					 } else {
						 drill.local_body_name_english = "";
					 }
					
					 drill.local_body_code = obj.local_body_code;
					 drill.schemename = obj.schemename;
					 drill.schemecomponentname = obj.schemecomponentname;
					 drill.dateOfEntry=obj.dateOfEntry;
					 
					 drill.obAmount =  obj.obAmount;
					 drill.receiptAmountDirect =  obj.receiptAmountDirect;
					 drill.receiptAmountAuto =  obj.receiptAmountAuto;
					 drill.paymentAmount =  obj.paymentAmount;
					 drill.unspentAmount =  obj.unspentAmount;

					 if($scope.amountIn=="RS"){
						 drill.obAmount =  parseFloat(parseFloat(obj.obAmount)).toFixed(2);
						 drill.receiptAmountDirect =  parseFloat(parseFloat(obj.receiptAmountDirect)).toFixed(2);
						 drill.receiptAmountAuto =  parseFloat(parseFloat(obj.receiptAmountAuto)).toFixed(2);
						 drill.paymentAmount =  parseFloat(parseFloat(obj.paymentAmount)).toFixed(2);
						 drill.unspentAmount =  parseFloat(((parseFloat(obj.obAmount)) + (parseFloat(obj.receiptAmountDirect)) + (parseFloat(obj.receiptAmountAuto)) - (parseFloat(obj.paymentAmount)))).toFixed(2);
					 
					 }else if($scope.amountIn=="LK"){
						 drill.obAmount = parseFloat(parseFloat(obj.obAmount)/100000).toFixed(3);
						 drill.receiptAmountDirect = parseFloat(parseFloat(obj.receiptAmountDirect)/100000).toFixed(3);
						 drill.receiptAmountAuto = parseFloat(parseFloat(obj.receiptAmountAuto)/100000).toFixed(3);
						 drill.paymentAmount = parseFloat(parseFloat(obj.paymentAmount)/100000).toFixed(3);
						 drill.unspentAmount = parseFloat(((parseFloat(obj.obAmount/100000)) + (parseFloat(obj.receiptAmountDirect/100000)) + (parseFloat(obj.receiptAmountAuto/100000)) - (parseFloat(obj.paymentAmount/100000)))).toFixed(3);
					 
					 }else if($scope.amountIn=="CR"){
						 drill.obAmount = parseFloat(parseFloat(obj.obAmount)/10000000).toFixed(3);
						 drill.receiptAmountDirect = parseFloat(parseFloat(obj.receiptAmountDirect)/10000000).toFixed(3);
						 drill.receiptAmountAuto = parseFloat(parseFloat(obj.receiptAmountAuto)/10000000).toFixed(3);
						 drill.paymentAmount = parseFloat(parseFloat(obj.paymentAmount)/10000000).toFixed(3);
						 drill.unspentAmount = parseFloat(((parseFloat(obj.obAmount/10000000)) + (parseFloat(obj.receiptAmountDirect/10000000)) + (parseFloat(obj.receiptAmountAuto/10000000)) - (parseFloat(obj.paymentAmount/10000000)))).toFixed(3);
					 }
					 
					 var availableFunds =  parseFloat(parseFloat(obj.obAmount) + parseFloat(obj.receiptAmountDirect) + parseFloat(obj.receiptAmountAuto)).toFixed(3);
					 var unspentBalance =   parseFloat(parseFloat(availableFunds) -  parseFloat(obj.paymentAmount)).toFixed(3);
					 if(availableFunds!= 0.000){
						 drill.percentageExp = parseFloat(parseFloat(parseFloat(unspentBalance) / parseFloat(availableFunds))*100).toFixed(2);
					 }else{
						 drill.percentageExp = 0.00;
					 }
					 drillDetail.push(drill);
					 
					 if($scope.amountIn=="RS"){
						 sum.sumReceipt_amount_direct = parseFloat((parseFloat(sum.sumReceipt_amount_direct)) + obj.receiptAmountDirect).toFixed(2);
						 sum.sumReceipt_amount_auto = parseFloat((parseFloat(sum.sumReceipt_amount_auto)) + obj.receiptAmountAuto).toFixed(2);
						 sum.sumPayment_amount = parseFloat((parseFloat(sum.sumPayment_amount)) + obj.paymentAmount).toFixed(2);
						 sum.sumOb_amount = parseFloat((parseFloat(sum.sumOb_amount)) + obj.obAmount).toFixed(2);
						 sum.sumUnspent_amount = parseFloat((parseFloat(sum.sumUnspent_amount)) + obj.unspentAmount).toFixed(2);
						 
					 }else if($scope.amountIn=="LK"){
						 sum.sumPayment_amount = parseFloat((parseFloat(sum.sumPayment_amount)) + obj.paymentAmount).toFixed(3);
						 sum.sumReceipt_amount_direct =   parseFloat((parseFloat(sum.sumReceipt_amount_direct)) + obj.receiptAmountDirect/100000).toFixed(3);
						 sum.sumReceipt_amount_auto =   parseFloat((parseFloat(sum.sumReceipt_amount_auto)) + obj.receiptAmountAuto).toFixed(3);
						 sum.sumOb_amount =  parseFloat((parseFloat(sum.sumOb_amount)) + obj.obAmount).toFixed(3);
						 sum.sumUnspent_amount =  parseFloat((parseFloat(sum.sumUnspent_amount)) + obj.unspentAmount).toFixed(3);
						 
					 }else if($scope.amountIn=="CR"){
						 sum.sumPayment_amount =  parseFloat((parseFloat(sum.sumPayment_amount)) + obj.paymentAmount).toFixed(3);
						 sum.sumReceipt_amount_direct =  parseFloat((parseFloat(sum.sumReceipt_amount_direct)) + obj.receiptAmountDirect).toFixed(3);
						 sum.sumReceipt_amount_auto =  parseFloat((parseFloat(sum.sumReceipt_amount_auto)) + obj.receiptAmountAuto).toFixed(3);
						 sum.sumOb_amount =  parseFloat((parseFloat(sum.sumOb_amount)) + obj.obAmount).toFixed(3);
						 sum.sumUnspent_amount =  parseFloat((parseFloat(sum.sumUnspent_amount)) + obj.unspentAmount).toFixed(3);
						 
					 }
					 
					
					 sum.sumdateOfEntry = obj.dateOfEntry;
					 tempNameZp = obj.zp_name;
					 tempNameBp = obj.bp_name;
					 tempNameVp = obj.local_body_name_english;
				});	
				 $scope.StateDrillList = drillDetail;
				 $scope.countList = sum;
				$scope.loader = false;
			});*/
		});

		
	}
	
	
	/*$scope.getDistricDrill = function getDistricDrill(zpcode, zpname) {
		$scope.zpcode = zpcode;
		$scope.zpname = zpname;
		$scope.loader = true;
		$scope.DistricDrillList = {};
		$scope.countList = {};
		$scope.sumOb_amount = 0;
		$scope.sumReceipt_amount_direct = 0;
		$scope.sumReceipt_amount_auto = 0;
		$scope.sumPayment_amount = 0;
		$scope.sumUnspent_amount = 0;
		$scope.sumdateOfEntry = 0;

		// Fixed title, since we're not checking stateTier
		$scope.reportHeaderTitle = "DISTRICT WISE RECEIPTS AND EXPENDITURES";

		$scope.type = 'DD';
		$("#mainDiv").hide();
		$("#districtDiv").hide();
		$("#stateListDiv").hide();
		$("#stateDrillListDiv").hide();
		$("#districDrillListDiv").show();
		
		$("#blockDiv").hide();
		$("#villageDiv").hide();
		$("#stateHidden").val($scope.zpcode);

		$scope.schemeComponent = $("#schemeComponent").val();
		$scope.fromAmount = $("#fromAmount").val();
		$scope.fromAmountIn = $("#fromAmountIn").val();
		$scope.toAmount = $("#toAmount").val();
		$scope.toAmountIn = $("#toAmountIn").val();

		schemeWiseUnspendBalanceReportService.generateDistricDrill(
			$scope.finYear,
			$scope.schemeUid,
			$scope.zpcode,
			$scope.reptype,
			$scope.schemeComponent,
			$scope.fromAmount,
			$scope.toAmount,
			$scope.amountIn,
			$scope.statecode
		).then(function(response) {
			if (response.data.length > 0) {
				$scope.DistricDrillList = response.data;
				var sum = new sumCount();
				angular.forEach(response.data, function(obj) {
					if ($scope.amountIn == "RS") {
						sum.sumReceipt_amount_direct = parseFloat(sum.sumReceipt_amount_direct) + obj.receiptAmountDirect;
						sum.sumReceipt_amount_auto = parseFloat(sum.sumReceipt_amount_auto) + obj.receiptAmountAuto;
						sum.sumPayment_amount = parseFloat(sum.sumPayment_amount) + obj.paymentAmount;
						sum.sumOb_amount = parseFloat(sum.sumOb_amount) + obj.obAmount;
						sum.sumUnspent_amount = parseFloat(sum.sumUnspent_amount) + obj.unspentAmount;
					} else if ($scope.amountIn == "LK" || $scope.amountIn == "CR") {
						let factor = $scope.amountIn == "LK" ? 100000 : 10000000;
						sum.sumPayment_amount += obj.paymentAmount / factor;
						sum.sumReceipt_amount_direct += obj.receiptAmountDirect / factor;
						sum.sumReceipt_amount_auto += obj.receiptAmountAuto / factor;
						sum.sumOb_amount += obj.obAmount / factor;
						sum.sumUnspent_amount += obj.unspentAmount / factor;
					}
					sum.sumdateOfEntry = obj.dateOfEntry;
				});
				if ($scope.amountIn == "RS") {
					sum.sumOb_amount = sum.sumOb_amount.toFixed(2);
					sum.sumReceipt_amount_direct = sum.sumReceipt_amount_direct.toFixed(2);
					sum.sumReceipt_amount_auto = sum.sumReceipt_amount_auto.toFixed(2);
					sum.sumPayment_amount = sum.sumPayment_amount.toFixed(2);
					sum.sumUnspent_amount = sum.sumUnspent_amount.toFixed(2);
				} else {
					sum.sumOb_amount = sum.sumOb_amount.toFixed(3);
					sum.sumReceipt_amount_direct = sum.sumReceipt_amount_direct.toFixed(3);
					sum.sumReceipt_amount_auto = sum.sumReceipt_amount_auto.toFixed(3);
					sum.sumPayment_amount = sum.sumPayment_amount.toFixed(3);
					sum.sumUnspent_amount = sum.sumUnspent_amount.toFixed(3);
				}
				$scope.countList = sum;
				$scope.loader = false;
			} else {
				$scope.loader = false;
				$("#mainDiv").hide();
				$("#stateListDiv").show();
				$("#stateDrillListDiv").hide();
				$("#districtDiv").hide();
				$("#blockDiv").hide();
				$("#villageDiv").hide();
				$("#stateDiv").hide();
				$scope.clearSelections();
				alert("No Data Found");
			}
		});
	};*/

	
	$scope.getDistricDrill = function getDistricDrill(zpcode, zpname) {
		$scope.zpcode = zpcode;
		$scope.zpname = zpname;
		$scope.loader = true;
		$scope.DistricDrillList = {};
		$scope.countList = {};
		$scope.sumOb_amount = 0;
		$scope.sumReceipt_amount_direct = 0;
		$scope.sumReceipt_amount_auto = 0;
		$scope.sumPayment_amount = 0;
		$scope.sumUnspent_amount = 0;
		$scope.sumdateOfEntry = 0;

		$scope.reportHeaderTitle = "DISTRICT WISE RECEIPTS AND EXPENDITURES";

		$scope.type = 'DD';
		$("#mainDiv").hide();
		$("#districtDiv").hide();
		$("#stateListDiv").hide();
		$("#stateDrillListDiv").hide();
		$("#districDrillListDiv").show();
		$("#blockDiv").hide();
		$("#villageDiv").hide();
		$("#stateHidden").val($scope.zpcode);
		$("#stateHiddenTemp").val($scope.stateCode);

		$scope.schemeComponent = $("#schemeComponent").val();
		$scope.fromAmount = $("#fromAmount").val();
		$scope.fromAmountIn = $("#fromAmountIn").val();
		$scope.toAmount = $("#toAmount").val();
		$scope.toAmountIn = $("#toAmountIn").val();
		
		$scope.fromAmount ='';
		$scope.toAmount ='';

		schemeWiseUnspendBalanceReportService.generateDistricDrill(
			$scope.finYear,
			$scope.schemeUid,
			$scope.zpcode,
			$scope.reptype,
			$scope.schemeComponent,
			$scope.fromAmount,
			$scope.toAmount,
			$scope.amountIn,
			$scope.statecode
		).then(function(response) {
			if (response.data.length > 0) {
				$scope.DistricDrillList = response.data;
				var sum = new sumCount();
				angular.forEach(response.data, function(obj) {
					if ($scope.amountIn == "RS") {
						sum.sumReceipt_amount_direct = parseFloat(sum.sumReceipt_amount_direct) + obj.receiptAmountDirect;
						sum.sumReceipt_amount_auto = parseFloat(sum.sumReceipt_amount_auto) + obj.receiptAmountAuto;
						sum.sumPayment_amount = parseFloat(sum.sumPayment_amount) + obj.paymentAmount;
						sum.sumOb_amount = parseFloat(sum.sumOb_amount) + obj.obAmount;
						sum.sumUnspent_amount = parseFloat(sum.sumUnspent_amount) + obj.unspentAmount;
					} else if ($scope.amountIn == "LK" || $scope.amountIn == "CR") {
						sum.sumReceipt_amount_direct += obj.receiptAmountDirect;
						sum.sumReceipt_amount_auto += obj.receiptAmountAuto;
						sum.sumPayment_amount += obj.paymentAmount;
						sum.sumOb_amount += obj.obAmount;
						sum.sumUnspent_amount += obj.unspentAmount;
					}
					sum.sumdateOfEntry = obj.dateOfEntry;
				});
				if ($scope.amountIn == "RS") {
					sum.sumOb_amount = sum.sumOb_amount.toFixed(2);
					sum.sumReceipt_amount_direct = sum.sumReceipt_amount_direct.toFixed(2);
					sum.sumReceipt_amount_auto = sum.sumReceipt_amount_auto.toFixed(2);
					sum.sumPayment_amount = sum.sumPayment_amount.toFixed(2);
					sum.sumUnspent_amount = sum.sumUnspent_amount.toFixed(2);
				} else {
					sum.sumOb_amount = sum.sumOb_amount.toFixed(3);
					sum.sumReceipt_amount_direct = sum.sumReceipt_amount_direct.toFixed(3);
					sum.sumReceipt_amount_auto = sum.sumReceipt_amount_auto.toFixed(3);
					sum.sumPayment_amount = sum.sumPayment_amount.toFixed(3);
					sum.sumUnspent_amount = sum.sumUnspent_amount.toFixed(3);
				}
				$scope.countList = sum;
				$scope.loader = false;
			} else {
				$scope.loader = false;
				$("#mainDiv").hide();
				$("#stateListDiv").show();
				$("#stateDrillListDiv").hide();
				$("#districtDiv").hide();
				$("#blockDiv").hide();
				$("#villageDiv").hide();
				$("#stateDiv").hide();
				$scope.clearSelections();
				alert("No Data Found");
			}
		});
	};

	
	$scope.getDistrict = function getDistrict() {
		
			$("#districtDiv").show();
			$scope.type = 'D';
			$scope.blockName = null;
			$scope.blockCode = 0 ;
			$scope.districtCode = 0 ;
			$scope.districtName = null;
			getDistrictData();
		}	
		function getDistrictData(){
		$scope.loader = true;
		$scope.DistrictList ={};
		$scope.countList = {};
		$scope.sumOb_amount = 0;
		$scope.sumReceipt_amount_direct = 0;
		$scope.sumReceipt_amount_auto = 0;
		$scope.sumPayment_amount = 0;
		$scope.sumUnspent_amount = 0;
		$scope.sumdateOfEntry = 0;
		$scope.headings = true;
		if($scope.stateTier == 'A' || $scope.stateTier == 'AB' || $scope.stateTier == 'ZG'){
			$scope.reportHeaderTitle = "DISTRICT WISE RECEIPTS AND EXPENDITURES ";
		}else if($scope.stateTier == 'IG'){
			$scope.reportHeaderTitle = "BLOCK WISE RECEIPTS AND EXPENDITURES";
		}else if($scope.stateTier == 'GP'){
			$scope.reportHeaderTitle = "VILLAGE WISE RECEIPTS AND EXPENDITURES";
		}
		$("#mainDiv").hide();
		$("#stateListDiv").hide();
		$("#stateDrillListDiv").hide();
		$("#districtDiv").show();
		$("#blockDiv").hide();
		$("#villageDiv").hide();
		$scope.schemeComponent = $("#schemeComponent").val();
		
		$scope.fromAmount = $("#fromAmount").val();
		$scope.fromAmountIn = $("#fromAmountIn").val();
		$scope.toAmount = $("#toAmount").val();
		$scope.toAmountIn = $("#toAmountIn").val();

		$scope.fromAmount ='';
		$scope.toAmount ='';

		
		schemeWiseUnspendBalanceReportService.generateDistrict($scope.finYear, $scope.stateCode, $scope.schemeUid,$scope.reptype,$scope.schemeComponent,$scope.fromAmount,$scope.toAmount,$scope.amountIn).then(function(response){
			if(response.data.length > 0) {
			$scope.DistrictList = response.data;
			var sum =  new sumCount();
			angular.forEach(response.data, function(obj, key) {
				if($scope.amountIn=="RS"){
					 sum.sumReceipt_amount_direct = parseFloat((parseFloat(sum.sumReceipt_amount_direct)) + obj.receiptAmountDirect).toFixed(2);
					 sum.sumReceipt_amount_auto = parseFloat((parseFloat(sum.sumReceipt_amount_auto)) + obj.receiptAmountAuto).toFixed(2);
					 sum.sumPayment_amount = parseFloat((parseFloat(sum.sumPayment_amount)) + obj.paymentAmount).toFixed(2);
					 sum.sumOb_amount = parseFloat((parseFloat(sum.sumOb_amount)) + obj.obAmount).toFixed(2);
					 sum.sumUnspent_amount = parseFloat((parseFloat(sum.sumUnspent_amount)) + obj.unspentAmount).toFixed(2);
					 
				 }else if($scope.amountIn=="LK"){
					 sum.sumPayment_amount = parseFloat((parseFloat(sum.sumPayment_amount)) + obj.paymentAmount).toFixed(3);
					 sum.sumReceipt_amount_direct =   parseFloat((parseFloat(sum.sumReceipt_amount_direct)) + obj.receiptAmountDirect).toFixed(3);
					 sum.sumReceipt_amount_auto =   parseFloat((parseFloat(sum.sumReceipt_amount_auto)) + obj.receiptAmountAuto).toFixed(3);
					 sum.sumOb_amount =  parseFloat((parseFloat(sum.sumOb_amount)) + obj.obAmount).toFixed(3);
					 sum.sumUnspent_amount =  parseFloat((parseFloat(sum.sumUnspent_amount)) + obj.unspentAmount).toFixed(3);
					 
				 }else if($scope.amountIn=="CR"){
					 sum.sumPayment_amount =  parseFloat((parseFloat(sum.sumPayment_amount)) + obj.paymentAmount).toFixed(3);
					 sum.sumReceipt_amount_direct =  parseFloat((parseFloat(sum.sumReceipt_amount_direct)) + obj.receiptAmountDirect).toFixed(3);
					 sum.sumReceipt_amount_auto =  parseFloat((parseFloat(sum.sumReceipt_amount_auto)) + obj.receiptAmountAuto).toFixed(3);
					 sum.sumOb_amount =  parseFloat((parseFloat(sum.sumOb_amount)) + obj.obAmount).toFixed(3);
					 sum.sumUnspent_amount =  parseFloat((parseFloat(sum.sumUnspent_amount)) + obj.unspentAmount).toFixed(3);
					 
				 }
				sum.sumdateOfEntry = obj.dateOfEntry;
			});
			
			$scope.countList = sum;
			$scope.loader = false;
		}else {
			$scope.loader = false;
			$("#mainDiv").show();
			$("#stateListDiv").hide();
			$("#stateDrillListDiv").hide();
			$("#districtDiv").hide();
			$("#blockDiv").hide();
			$("#villageDiv").hide();
			$scope.clearSelections();
			alert("No Data Found");
			
		}
		});
		
		
		/*schemeWiseUnspendBalanceReportService.generateDistrict($scope.finYear, $scope.stateCode, $scope.schemeUid,$scope.reptype,$scope.schemeComponent,$scope.fromAmount,$scope.toAmount,$scope.amountIn).then(function(response){
			if(response.data.length > 0) {
				 var districtDetail = new Array();
				 var sum =  new sumCount();
				 var tempName = "";
				angular.forEach(response.data, function(obj, key) {
					 var district = new districtDetails();
					 if(tempName != obj.name) {
						 district.name = obj.name;
					 } else {
						 district.name = "";
					 }
					 
					 district.code = obj.code;//district. is js model value //obj. is dto value
					 district.schemename = obj.schemename;
					 district.schemecomponentname = obj.schemecomponentname;
					 district.scheme_uid = obj.scheme_uid;
					 district.dateOfEntry = obj.dateOfEntry;
					 
					 district.obAmount =  obj.obAmount;
					 district.receiptAmountDirect =  obj.receiptAmountDirect;
					 district.receiptAmountAuto =  obj.receiptAmountAuto;
					 district.paymentAmount =  obj.paymentAmount;
					 district.unspentAmount =  obj.unspentAmount;
					 
					 //var availabparseFloat(parseFloat(obj.obAmount) + parseFloat(obj.receiptAmountDirect) + parseFloat(obj.receiptAmountAuto)).toFixed(3);
					 //var unspentBalance =   parseFloat(parseFloat(availableFunds) -  parseFloat(obj.paymentAmount)).toFixed(3);

					 if($scope.amountIn=="RS"){
						 district.obAmount =  parseFloat(parseFloat(obj.obAmount)).toFixed(2);
						 district.receiptAmountDirect =  parseFloat(parseFloat(obj.receiptAmountDirect)).toFixed(2);
						 district.receiptAmountAuto =  parseFloat(parseFloat(obj.receiptAmountAuto)).toFixed(2);
						 district.paymentAmount =  parseFloat(parseFloat(obj.paymentAmount)).toFixed(2);
						 district.unspentAmount =  parseFloat(((parseFloat(obj.obAmount)) + (parseFloat(obj.receiptAmountDirect)) + (parseFloat(obj.receiptAmountAuto)) - (parseFloat(obj.paymentAmount)))).toFixed(2);
					 
					 }else if($scope.amountIn=="LK"){
						 district.obAmount = parseFloat(parseFloat(obj.obAmount)/100000).toFixed(3);
						 district.receiptAmountDirect = parseFloat(parseFloat(obj.receiptAmountDirect)/100000).toFixed(3);
						 district.receiptAmountAuto = parseFloat(parseFloat(obj.receiptAmountAuto)/100000).toFixed(3);
						 district.paymentAmount = parseFloat(parseFloat(obj.paymentAmount)/100000).toFixed(3);
						 district.unspentAmount = parseFloat(((parseFloat(obj.obAmount/100000)) + (parseFloat(obj.receiptAmountDirect/100000)) + (parseFloat(obj.receiptAmountAuto/100000)) - (parseFloat(obj.paymentAmount/100000)))).toFixed(3);
					 
					 }else if($scope.amountIn=="CR"){
						 district.obAmount = parseFloat(parseFloat(obj.obAmount)/10000000).toFixed(3);
						 district.receiptAmountDirect = parseFloat(parseFloat(obj.receiptAmountDirect)/10000000).toFixed(3);
						 district.receiptAmountAuto = parseFloat(parseFloat(obj.receiptAmountAuto)/10000000).toFixed(3);
						 district.paymentAmount = parseFloat(parseFloat(obj.paymentAmount)/10000000).toFixed(3);
						 district.unspentAmount = parseFloat(((parseFloat(obj.obAmount/10000000)) + (parseFloat(obj.receiptAmountDirect/10000000)) + (parseFloat(obj.receiptAmountAuto/10000000)) - (parseFloat(obj.paymentAmount/10000000)))).toFixed(3);
					 }
					 
					 var availableFunds =  parseFloat(parseFloat(obj.obAmount) + parseFloat(obj.receiptAmountDirect) + parseFloat(obj.receiptAmountAuto)).toFixed(3);
					 var unspentBalance =   parseFloat(parseFloat(availableFunds) -  parseFloat(obj.paymentAmount)).toFixed(3);
					 if(availableFunds!= 0.000){
						 district.percentageExp = parseFloat(parseFloat(parseFloat(unspentBalance) / parseFloat(availableFunds))*100).toFixed(2);
					 }else{
						 district.percentageExp = 0.00;
					 }
					 districtDetail.push(district);
					 
					 if($scope.amountIn=="RS"){
						 sum.sumReceipt_amount_direct = parseFloat((parseFloat(sum.sumReceipt_amount_direct)) + obj.receiptAmountDirect).toFixed(2);
						 sum.sumReceipt_amount_auto = parseFloat((parseFloat(sum.sumReceipt_amount_auto)) + obj.receiptAmountAuto).toFixed(2);
						 sum.sumPayment_amount = parseFloat((parseFloat(sum.sumPayment_amount)) + obj.paymentAmount).toFixed(2);
						 sum.sumOb_amount = parseFloat((parseFloat(sum.sumOb_amount)) + obj.obAmount).toFixed(2);
						 sum.sumUnspent_amount = parseFloat((parseFloat(sum.sumUnspent_amount)) + obj.unspentAmount).toFixed(2);
						 
					 }else if($scope.amountIn=="LK"){
						 sum.sumPayment_amount = parseFloat((parseFloat(sum.sumPayment_amount)) + obj.paymentAmount).toFixed(3);
						 sum.sumReceipt_amount_direct =   parseFloat((parseFloat(sum.sumReceipt_amount_direct)) + obj.receiptAmountDirect/100000).toFixed(3);
						 sum.sumReceipt_amount_auto =   parseFloat((parseFloat(sum.sumReceipt_amount_auto)) + obj.receiptAmountAuto).toFixed(3);
						 sum.sumOb_amount =  parseFloat((parseFloat(sum.sumOb_amount)) + obj.obAmount).toFixed(3);
						 sum.sumUnspent_amount =  parseFloat((parseFloat(sum.sumUnspent_amount)) + obj.unspentAmount).toFixed(3);
						 
					 }else if($scope.amountIn=="CR"){
						 sum.sumPayment_amount =  parseFloat((parseFloat(sum.sumPayment_amount)) + obj.paymentAmount).toFixed(3);
						 sum.sumReceipt_amount_direct =  parseFloat((parseFloat(sum.sumReceipt_amount_direct)) + obj.receiptAmountDirect).toFixed(3);
						 sum.sumReceipt_amount_auto =  parseFloat((parseFloat(sum.sumReceipt_amount_auto)) + obj.receiptAmountAuto).toFixed(3);
						 sum.sumOb_amount =  parseFloat((parseFloat(sum.sumOb_amount)) + obj.obAmount).toFixed(3);
						 sum.sumUnspent_amount =  parseFloat((parseFloat(sum.sumUnspent_amount)) + obj.unspentAmount).toFixed(3);
						 
					 }
					
					 sum.sumdateOfEntry = obj.dateOfEntry;
					 tempName = obj.name;
				}, function(error) {
			    	$scope.loader = false;
			    });
				
				 $scope.DistrictList = districtDetail;
				 $scope.countList = sum;
				$scope.loader = false;
			} else {
				$scope.loader = false;
				$("#mainDiv").show();
				$("#stateListDiv").hide();
				$("#stateDrillListDiv").hide();
				$("#districtDiv").hide();
				$("#blockDiv").hide();
				$("#villageDiv").hide();
				
				$scope.clearSelections();
				alert("No Data Found");
				
			}
		});*/
	}
	
	
	
	$scope.getBlock = function getBlock(districtCode, districtName) {
		$("#blockDiv").show();
		getBlockData(districtCode, districtName);
	}
	
	function getBlockData(districtCode, districtName){ 
		if($scope.stateTier != 'IG') {
			$scope.districtName = districtName;
		}else{
			$scope.blockName = districtName;
		}
		$scope.districtCode = districtCode;
		$scope.loader = true;
		$scope.BlockList ={};
		$scope.countList = {};
		$scope.sumOb_amount = 0;
		$scope.sumReceipt_amount = 0;
		$scope.sumPayment_amount = 0;
		$scope.sumUnspent_amount = 0;
		$scope.sumdateOfEntry = 0;
		
		if($scope.stateTier == 'A' || $scope.stateTier == 'AB'){
			$scope.reportHeaderTitle = "BLOCK WISE RECEIPTS AND EXPENDITURES";
		}else if($scope.stateTier == 'ZG' || $scope.stateTier == 'IG'){
			$scope.reportHeaderTitle = "VILLAGE WISE RECEIPTS AND EXPENDITURES";
		}
		$scope.type = 'B';
		
		$("#mainDiv").hide();
		$("#districtDiv").hide();
		$("#stateListDiv").hide();
		$("#stateDrillListDiv").hide();
		$("#blockDiv").show();
		$("#villageDiv").hide();
		$("#districtHidden").val($scope.districtCode);
		$scope.schemeComponent = $("#schemeComponent").val();
		$scope.fromAmount = $("#fromAmount").val();
		$scope.fromAmountIn = $("#fromAmountIn").val();
		$scope.toAmount = $("#toAmount").val();
		$scope.toAmountIn = $("#toAmountIn").val();
		

		$scope.fromAmount ='';
		$scope.toAmount ='';

		
		schemeWiseUnspendBalanceReportService.generateBlock($scope.finYear, $scope.stateCode, $scope.schemeUid, districtCode,$scope.reptype,$scope.schemeComponent,$scope.fromAmount,$scope.toAmount,$scope.amountIn).then(function(response){
			if(response.data.length > 0) {
				$scope.BlockList = response.data;
			var sum =  new sumCount();
			angular.forEach(response.data, function(obj, key) {
				 if($scope.amountIn=="RS"){
					 sum.sumReceipt_amount_direct = parseFloat((parseFloat(sum.sumReceipt_amount_direct)) + obj.receiptAmountDirect).toFixed(2);
					 sum.sumReceipt_amount_auto = parseFloat((parseFloat(sum.sumReceipt_amount_auto)) + obj.receiptAmountAuto).toFixed(2);
					 sum.sumPayment_amount = parseFloat((parseFloat(sum.sumPayment_amount)) + obj.paymentAmount).toFixed(2);
					 sum.sumOb_amount = parseFloat((parseFloat(sum.sumOb_amount)) + obj.obAmount).toFixed(2);
					 sum.sumUnspent_amount = parseFloat((parseFloat(sum.sumUnspent_amount)) + obj.unspentAmount).toFixed(2);
					 
				 }else if($scope.amountIn=="LK"){
					 sum.sumPayment_amount = parseFloat((parseFloat(sum.sumPayment_amount)) + obj.paymentAmount).toFixed(3);
					 sum.sumReceipt_amount_direct =   parseFloat((parseFloat(sum.sumReceipt_amount_direct)) + obj.receiptAmountDirect).toFixed(3);
					 sum.sumReceipt_amount_auto =   parseFloat((parseFloat(sum.sumReceipt_amount_auto)) + obj.receiptAmountAuto).toFixed(3);
					 sum.sumOb_amount =  parseFloat((parseFloat(sum.sumOb_amount)) + obj.obAmount).toFixed(3);
					 sum.sumUnspent_amount =  parseFloat((parseFloat(sum.sumUnspent_amount)) + obj.unspentAmount).toFixed(3);
					 
				 }else if($scope.amountIn=="CR"){
					 sum.sumPayment_amount =  parseFloat((parseFloat(sum.sumPayment_amount)) + obj.paymentAmount).toFixed(3);
					 sum.sumReceipt_amount_direct =  parseFloat((parseFloat(sum.sumReceipt_amount_direct)) + obj.receiptAmountDirect).toFixed(3);
					 sum.sumReceipt_amount_auto =  parseFloat((parseFloat(sum.sumReceipt_amount_auto)) + obj.receiptAmountAuto).toFixed(3);
					 sum.sumOb_amount =  parseFloat((parseFloat(sum.sumOb_amount)) + obj.obAmount).toFixed(3);
					 sum.sumUnspent_amount =  parseFloat((parseFloat(sum.sumUnspent_amount)) + obj.unspentAmount).toFixed(3);
					 
				 }
				 sum.sumdateOfEntry = obj.dateOfEntry;
			});
			
			$scope.countList = sum;
			$scope.loader = false;
		}else {
			$scope.loader = false;
			$("#mainDiv").hide();
			$("#stateListDiv").hide();
			$("#stateDrillListDiv").hide();
			$("#districtDiv").show();
			$("#blockDiv").hide();
			$("#villageDiv").hide();
			$scope.clearSelections();
			alert("No Data Found");
			
		}
		});
		
		
		/*schemeWiseUnspendBalanceReportService.generateBlock($scope.finYear, $scope.stateCode, $scope.schemeUid, districtCode,$scope.reptype,$scope.schemeComponent,$scope.fromAmount,$scope.toAmount,$scope.amountIn).then(function(response){
			 var blockDetail = new Array();
			 var sum =  new sumCount();
			 var tempName = "";
			angular.forEach(response.data, function(obj, key) {
				 var block = new blockDetails();
				 if(tempName != obj.name) {
					 block.name = obj.name;
				 } else {
					 block.name = "";
				 }
				 
				 block.code = obj.code; //district. is js model value //obj. is dto value
				 block.scheme_uid = obj.scheme_uid;
				 block.schemename = obj.schemename;
				 block.schemecomponentname = obj.schemecomponentname;
				 block.dateOfEntry = obj.dateOfEntry;
				 
				 block.obAmount =  obj.obAmount;
				 block.receiptAmountDirect =  obj.receiptAmountDirect;
				 block.receiptAmountAuto =  obj.receiptAmountAuto;
				 block.paymentAmount =  obj.paymentAmount;
				 block.unspentAmount =  obj.unspentAmount;

				 if($scope.amountIn=="RS"){
					 block.obAmount =  parseFloat(parseFloat(obj.obAmount)).toFixed(2);
					 block.receiptAmountDirect =  parseFloat(parseFloat(obj.receiptAmountDirect)).toFixed(2);
					 block.receiptAmountAuto =  parseFloat(parseFloat(obj.receiptAmountAuto)).toFixed(2);
					 block.paymentAmount =  parseFloat(parseFloat(obj.paymentAmount)).toFixed(2);
					 block.unspentAmount =  parseFloat(((parseFloat(obj.obAmount)) + (parseFloat(obj.receiptAmountDirect)) + (parseFloat(obj.receiptAmountAuto)) - (parseFloat(obj.paymentAmount)))).toFixed(2);
				 
				 }else if($scope.amountIn=="LK"){
					 block.obAmount = parseFloat(parseFloat(obj.obAmount)/100000).toFixed(3);
					 block.receiptAmountDirect = parseFloat(parseFloat(obj.receiptAmountDirect)/100000).toFixed(3);
					 block.receiptAmountAuto = parseFloat(parseFloat(obj.receiptAmountAuto)/100000).toFixed(3);
					 block.paymentAmount = parseFloat(parseFloat(obj.paymentAmount)/100000).toFixed(3);
					 block.unspentAmount = parseFloat(((parseFloat(obj.obAmount/100000)) + (parseFloat(obj.receiptAmountDirect/100000)) + (parseFloat(obj.receiptAmountAuto/100000)) - (parseFloat(obj.paymentAmount/100000)))).toFixed(3);

					 
				 }else if($scope.amountIn=="CR"){
					 block.obAmount = parseFloat(parseFloat(obj.obAmount)/10000000).toFixed(3);
					 block.receiptAmountDirect = parseFloat(parseFloat(obj.receiptAmountDirect)/10000000).toFixed(3);
					 block.receiptAmountAuto = parseFloat(parseFloat(obj.receiptAmountAuto)/10000000).toFixed(3);
					 block.paymentAmount = parseFloat(parseFloat(obj.paymentAmount)/10000000).toFixed(3);
					 block.unspentAmount = parseFloat(((parseFloat(obj.obAmount/10000000)) + (parseFloat(obj.receiptAmountDirect/10000000)) + (parseFloat(obj.receiptAmountAuto/10000000)) - (parseFloat(obj.paymentAmount/10000000)))).toFixed(3);
				 }
				 
				 var availableFunds =  parseFloat(parseFloat(obj.obAmount) + parseFloat(obj.receiptAmountDirect) + parseFloat(obj.receiptAmountAuto)).toFixed(3);
				 var unspentBalance =   parseFloat(parseFloat(availableFunds) -  parseFloat(obj.paymentAmount)).toFixed(3);
				 if(availableFunds!= 0.000){
					 block.percentageExp = parseFloat(parseFloat(parseFloat(unspentBalance) / parseFloat(availableFunds))*100).toFixed(2);
				 }else{
					 block.percentageExp = 0.00;
				 }
				 blockDetail.push(block);
				 
				 if($scope.amountIn=="RS"){
					 sum.sumReceipt_amount_direct = parseFloat((parseFloat(sum.sumReceipt_amount_direct)) + obj.receiptAmountDirect).toFixed(2);
					 sum.sumReceipt_amount_auto = parseFloat((parseFloat(sum.sumReceipt_amount_auto)) + obj.receiptAmountAuto).toFixed(2);
					 sum.sumPayment_amount = parseFloat((parseFloat(sum.sumPayment_amount)) + obj.paymentAmount).toFixed(2);
					 sum.sumOb_amount = parseFloat((parseFloat(sum.sumOb_amount)) + obj.obAmount).toFixed(2);
					 sum.sumUnspent_amount = parseFloat((parseFloat(sum.sumUnspent_amount)) + obj.unspentAmount).toFixed(2);
					 
				 }else if($scope.amountIn=="LK"){
					 sum.sumPayment_amount = parseFloat((parseFloat(sum.sumPayment_amount)) + obj.paymentAmount).toFixed(3);
					 sum.sumReceipt_amount_direct =   parseFloat((parseFloat(sum.sumReceipt_amount_direct)) + obj.receiptAmountDirect/100000).toFixed(3);
					 sum.sumReceipt_amount_auto =   parseFloat((parseFloat(sum.sumReceipt_amount_auto)) + obj.receiptAmountAuto).toFixed(3);
					 sum.sumOb_amount =  parseFloat((parseFloat(sum.sumOb_amount)) + obj.obAmount).toFixed(3);
					 sum.sumUnspent_amount =  parseFloat((parseFloat(sum.sumUnspent_amount)) + obj.unspentAmount).toFixed(3);
					 
				 }else if($scope.amountIn=="CR"){
					 sum.sumPayment_amount =  parseFloat((parseFloat(sum.sumPayment_amount)) + obj.paymentAmount).toFixed(3);
					 sum.sumReceipt_amount_direct =  parseFloat((parseFloat(sum.sumReceipt_amount_direct)) + obj.receiptAmountDirect).toFixed(3);
					 sum.sumReceipt_amount_auto =  parseFloat((parseFloat(sum.sumReceipt_amount_auto)) + obj.receiptAmountAuto).toFixed(3);
					 sum.sumOb_amount =  parseFloat((parseFloat(sum.sumOb_amount)) + obj.obAmount).toFixed(3);
					 sum.sumUnspent_amount =  parseFloat((parseFloat(sum.sumUnspent_amount)) + obj.unspentAmount).toFixed(3);
					 
				 }
				 
				 if($scope.amountIn=="RS"){
					 sum.sumReceipt_amount_direct = parseFloat((parseFloat(sum.sumReceipt_amount_direct)) + (parseFloat(obj.receiptAmountDirect))).toFixed(2);
					 sum.sumReceipt_amount_auto = parseFloat((parseFloat(sum.sumReceipt_amount_auto)) + (parseFloat(obj.receiptAmountAuto))).toFixed(2);
					 sum.sumPayment_amount = parseFloat((parseFloat(sum.sumPayment_amount)) + (parseFloat(obj.paymentAmount))).toFixed(2);
					 sum.sumOb_amount = parseFloat((parseFloat(sum.sumOb_amount)) + (parseFloat(obj.obAmount))).toFixed(2);
					 sum.sumUnspent_amount =  parseFloat((parseFloat(sum.sumUnspent_amount)) + ((parseFloat(obj.obAmount)) +
							 (parseFloat(obj.receiptAmountDirect)) + (parseFloat(obj.receiptAmountAuto)) - (parseFloat(obj.paymentAmount)))).toFixed(2);
					 
				 }else if($scope.amountIn=="LK"){
					 sum.sumPayment_amount = parseFloat((parseFloat(sum.sumPayment_amount)) + (parseFloat(obj.paymentAmount/100000))).toFixed(3);
					 sum.sumReceipt_amount_direct =   parseFloat((parseFloat(sum.sumReceipt_amount_direct)) + (parseFloat(obj.receiptAmountDirect/100000))).toFixed(3);
					 sum.sumReceipt_amount_auto =   parseFloat((parseFloat(sum.sumReceipt_amount_auto)) + (parseFloat(obj.receiptAmountAuto/100000))).toFixed(3);
					 sum.sumOb_amount =  parseFloat((parseFloat(sum.sumOb_amount)) + (parseFloat(obj.obAmount/100000))).toFixed(3);
					 sum.sumUnspent_amount =  parseFloat((parseFloat(sum.sumUnspent_amount)) + ((parseFloat(obj.obAmount/100000)) +
							 (parseFloat(obj.receiptAmountDirect/100000)) + (parseFloat(obj.receiptAmountAuto/100000)) - (parseFloat(obj.paymentAmount/100000)))).toFixed(3);
					 
				 }else if($scope.amountIn=="CR"){
					 sum.sumPayment_amount =  parseFloat((parseFloat(sum.sumPayment_amount)) + (parseFloat(obj.paymentAmount/10000000))).toFixed(3);
					 sum.sumReceipt_amount_direct =  parseFloat((parseFloat( sum.sumReceipt_amount_direct)) + (parseFloat(obj.receiptAmountDirect/10000000))).toFixed(3);
					 sum.sumReceipt_amount_auto =  parseFloat((parseFloat( sum.sumReceipt_amount_auto)) + (parseFloat(obj.receiptAmountAuto/10000000))).toFixed(3);
					 sum.sumOb_amount =  parseFloat((parseFloat(sum.sumOb_amount)) + (parseFloat(obj.obAmount/10000000))).toFixed(3);
					 sum.sumUnspent_amount =  parseFloat((parseFloat(sum.sumUnspent_amount)) + ((parseFloat(obj.obAmount/10000000)) +
							 (parseFloat(obj.receiptAmountDirect/10000000)) + (parseFloat(obj.receiptAmountAuto/10000000)) - (parseFloat(obj.paymentAmount/10000000)))).toFixed(3);
					 
				 }
				 sum.sumdateOfEntry = obj.dateOfEntry;
				 tempName = obj.name; 
			});	
			 $scope.BlockList = blockDetail;
			 $scope.countList = sum;
			$scope.loader = false;
		});*/
	}
	
	$scope.getVillage = function getVillage(blockCode, blockName) {
		if($scope.stateTier != 'ZG') {
				$scope.blockName = blockName;
				$scope.blockCode = blockCode;
				districtCode = $scope.districtCode;
		} else {
			$scope.blockName = null;
			$scope.blockCode = 0;
			districtCode = blockCode;
			$("#districtHidden").val(blockCode);
		}
		$scope.loader = true;
		$scope.VillageList ={};
		$scope.countList = {};
		$scope.sumOb_amount = 0;
		$scope.sumReceipt_amount = 0;
		$scope.sumPayment_amount = 0;
		$scope.sumUnspent_amount = 0;
		$scope.sumdateOfEntry = 0;
		$scope.reportHeaderTitle = "VILLAGE WISE RECEIPTS AND EXPENDITURES";
		$scope.type = 'V';
		
		$("#mainDiv").hide();
		$("#stateListDiv").hide();
		$("#stateDrillListDiv").hide();
		$("#districtDiv").hide();
		$("#blockDiv").hide();
		$("#villageDiv").show();
		$("#blockHidden").val($scope.blockCode);
		$scope.schemeComponent = $("#schemeComponent").val();
		$scope.fromAmount = $("#fromAmount").val();
		$scope.fromAmountIn = $("#fromAmountIn").val();
		$scope.toAmount = $("#toAmount").val();
		$scope.toAmountIn = $("#toAmountIn").val();

		$scope.fromAmount ='';
		$scope.toAmount ='';

		
		schemeWiseUnspendBalanceReportService.generateVillage($scope.finYear, $scope.stateCode, $scope.schemeUid, districtCode, $scope.blockCode,$scope.schemeComponent,$scope.fromAmount,$scope.toAmount,$scope.amountIn).then(function(response){
			if(response.data.length > 0) {
				$scope.VillageList = response.data;
			var sum =  new sumCount();
			angular.forEach(response.data, function(obj, key) {
				if($scope.amountIn=="RS"){
					 sum.sumReceipt_amount_direct = parseFloat((parseFloat(sum.sumReceipt_amount_direct)) + obj.receiptAmountDirect).toFixed(2);
					 sum.sumReceipt_amount_auto = parseFloat((parseFloat(sum.sumReceipt_amount_auto)) + obj.receiptAmountAuto).toFixed(2);
					 sum.sumPayment_amount = parseFloat((parseFloat(sum.sumPayment_amount)) + obj.paymentAmount).toFixed(2);
					 sum.sumOb_amount = parseFloat((parseFloat(sum.sumOb_amount)) + obj.obAmount).toFixed(2);
					 sum.sumUnspent_amount = parseFloat((parseFloat(sum.sumUnspent_amount)) + obj.unspentAmount).toFixed(2);
					 
				 }else if($scope.amountIn=="LK"){
					 sum.sumPayment_amount = parseFloat((parseFloat(sum.sumPayment_amount)) + obj.paymentAmount).toFixed(3);
					 sum.sumReceipt_amount_direct =   parseFloat((parseFloat(sum.sumReceipt_amount_direct)) + obj.receiptAmountDirect).toFixed(3);
					 sum.sumReceipt_amount_auto =   parseFloat((parseFloat(sum.sumReceipt_amount_auto)) + obj.receiptAmountAuto).toFixed(3);
					 sum.sumOb_amount =  parseFloat((parseFloat(sum.sumOb_amount)) + obj.obAmount).toFixed(3);
					 sum.sumUnspent_amount =  parseFloat((parseFloat(sum.sumUnspent_amount)) + obj.unspentAmount).toFixed(3);
					 
				 }else if($scope.amountIn=="CR"){
					 sum.sumPayment_amount =  parseFloat((parseFloat(sum.sumPayment_amount)) + obj.paymentAmount).toFixed(3);
					 sum.sumReceipt_amount_direct =  parseFloat((parseFloat(sum.sumReceipt_amount_direct)) + obj.receiptAmountDirect).toFixed(3);
					 sum.sumReceipt_amount_auto =  parseFloat((parseFloat(sum.sumReceipt_amount_auto)) + obj.receiptAmountAuto).toFixed(3);
					 sum.sumOb_amount =  parseFloat((parseFloat(sum.sumOb_amount)) + obj.obAmount).toFixed(3);
					 sum.sumUnspent_amount =  parseFloat((parseFloat(sum.sumUnspent_amount)) + obj.unspentAmount).toFixed(3);
					 
				 }
				sum.sumdateOfEntry = obj.dateOfEntry;
			});
			
			$scope.countList = sum;
			$scope.loader = false;
		}else {
			$scope.loader = false;
			$("#mainDiv").hide();
			$("#stateListDiv").hide();
			$("#stateDrillListDiv").hide();
			$("#districtDiv").hide();
			$("#blockDiv").show();
			$("#villageDiv").hide();
			$scope.clearSelections();
			alert("No Data Found");
			
		}
		});
		
		
		
		/*schemeWiseUnspendBalanceReportService.generateVillage($scope.finYear, $scope.stateCode, $scope.schemeUid, districtCode, $scope.blockCode,$scope.schemeComponent,$scope.fromAmount,$scope.toAmount,$scope.amountIn).then(function(response){
			 var villageDetail = new Array();
			 var sum =  new sumCount();
			 var tempName = "";
			angular.forEach(response.data, function(obj, key) {
				 var village = new villageDetails();
				 village.code = obj.code; //district. is js model value //obj. is dto value
				 if(tempName != obj.name) {
					 village.name = obj.name;
				 } else {
					 village.name = "";
				 }
				 
				 village.scheme_uid = obj.scheme_uid;
				 village.schemename = obj.schemename;
				 village.schemecomponentname = obj.schemecomponentname;
				 village.dateOfEntry=obj.dateOfEntry;
				 
				 village.obAmount =  obj.obAmount;
				 village.receiptAmountDirect =  obj.receiptAmountDirect;
				 village.receiptAmountAuto =  obj.receiptAmountAuto;
				 village.paymentAmount =  obj.paymentAmount;
				 village.unspentAmount =  obj.unspentAmount;

				 if($scope.amountIn=="RS"){
					 village.obAmount =  parseFloat(parseFloat(obj.obAmount)).toFixed(2);
					 village.receiptAmountDirect =  parseFloat(parseFloat(obj.receiptAmountDirect)).toFixed(2);
					 village.receiptAmountAuto =  parseFloat(parseFloat(obj.receiptAmountAuto)).toFixed(2);
					 village.paymentAmount =  parseFloat(parseFloat(obj.paymentAmount)).toFixed(2);
					 village.unspentAmount =  parseFloat(((parseFloat(obj.obAmount)) + (parseFloat(obj.receiptAmountDirect)) + (parseFloat(obj.receiptAmountAuto)) - (parseFloat(obj.paymentAmount)))).toFixed(2);
				 }else if($scope.amountIn=="LK"){
					 village.obAmount = parseFloat(parseFloat(obj.obAmount)/100000).toFixed(3);
					 village.receiptAmountDirect = parseFloat(parseFloat(obj.receiptAmountDirect)/100000).toFixed(3);
					 village.receiptAmountAuto = parseFloat(parseFloat(obj.receiptAmountAuto)/100000).toFixed(3);
					 village.paymentAmount = parseFloat(parseFloat(obj.paymentAmount)/100000).toFixed(3);
					 village.unspentAmount = parseFloat(((parseFloat(obj.obAmount/100000)) + (parseFloat(obj.receiptAmountDirect/100000)) + (parseFloat(obj.receiptAmountAuto/100000)) - (parseFloat(obj.paymentAmount/100000)))).toFixed(3);
				 }else if($scope.amountIn=="CR"){
					 village.obAmount = parseFloat(parseFloat(obj.obAmount)/10000000).toFixed(3);
					 village.receiptAmountDirect = parseFloat(parseFloat(obj.receiptAmountDirect)/10000000).toFixed(3);
					 village.receiptAmountAuto = parseFloat(parseFloat(obj.receiptAmountAuto)/10000000).toFixed(3);
					 village.paymentAmount = parseFloat(parseFloat(obj.paymentAmount)/10000000).toFixed(3);
					 village.unspentAmount = parseFloat(((parseFloat(obj.obAmount/10000000)) + (parseFloat(obj.receiptAmountDirect/10000000)) + (parseFloat(obj.receiptAmountAuto/10000000)) - (parseFloat(obj.paymentAmount/10000000)))).toFixed(3);
				 }
				 
				 var availableFunds =  parseFloat(parseFloat(obj.obAmount) + parseFloat(obj.receiptAmountDirect) + parseFloat(obj.receiptAmountAuto)).toFixed(3);
				 var unspentBalance =   parseFloat(parseFloat(availableFunds) -  parseFloat(obj.paymentAmount)).toFixed(3);
				 if(availableFunds!= 0.000){
					 village.percentageExp = parseFloat(parseFloat(parseFloat(unspentBalance) / parseFloat(availableFunds))*100).toFixed(2);
				 }else{
					 village.percentageExp = 0.00;
				 }
				 villageDetail.push(village);
				 
				 if($scope.amountIn=="RS"){
					 sum.sumReceipt_amount_direct = parseFloat((parseFloat(sum.sumReceipt_amount_direct)) + obj.receiptAmountDirect).toFixed(2);
					 sum.sumReceipt_amount_auto = parseFloat((parseFloat(sum.sumReceipt_amount_auto)) + obj.receiptAmountAuto).toFixed(2);
					 sum.sumPayment_amount = parseFloat((parseFloat(sum.sumPayment_amount)) + obj.paymentAmount).toFixed(2);
					 sum.sumOb_amount = parseFloat((parseFloat(sum.sumOb_amount)) + obj.obAmount).toFixed(2);
					 sum.sumUnspent_amount = parseFloat((parseFloat(sum.sumUnspent_amount)) + obj.unspentAmount).toFixed(2);
					 
				 }else if($scope.amountIn=="LK"){
					 sum.sumPayment_amount = parseFloat((parseFloat(sum.sumPayment_amount)) + obj.paymentAmount).toFixed(3);
					 sum.sumReceipt_amount_direct =   parseFloat((parseFloat(sum.sumReceipt_amount_direct)) + obj.receiptAmountDirect/100000).toFixed(3);
					 sum.sumReceipt_amount_auto =   parseFloat((parseFloat(sum.sumReceipt_amount_auto)) + obj.receiptAmountAuto).toFixed(3);
					 sum.sumOb_amount =  parseFloat((parseFloat(sum.sumOb_amount)) + obj.obAmount).toFixed(3);
					 sum.sumUnspent_amount =  parseFloat((parseFloat(sum.sumUnspent_amount)) + obj.unspentAmount).toFixed(3);
					 
				 }else if($scope.amountIn=="CR"){
					 sum.sumPayment_amount =  parseFloat((parseFloat(sum.sumPayment_amount)) + obj.paymentAmount).toFixed(3);
					 sum.sumReceipt_amount_direct =  parseFloat((parseFloat(sum.sumReceipt_amount_direct)) + obj.receiptAmountDirect).toFixed(3);
					 sum.sumReceipt_amount_auto =  parseFloat((parseFloat(sum.sumReceipt_amount_auto)) + obj.receiptAmountAuto).toFixed(3);
					 sum.sumOb_amount =  parseFloat((parseFloat(sum.sumOb_amount)) + obj.obAmount).toFixed(3);
					 sum.sumUnspent_amount =  parseFloat((parseFloat(sum.sumUnspent_amount)) + obj.unspentAmount).toFixed(3);
					 
				 }
				 
				 sum.sumdateOfEntry = obj.dateOfEntry;
				 tempName = obj.name;
			});	
			 $scope.VillageList = villageDetail;
			 $scope.countList = sum;
			$scope.loader = false;
		});*/
	}
	

$scope.onBack = function onBack(type) {
		
		if(type == 'D') {
			$scope.type = 'MAIN';
			$("#mainDiv").show();
			$("#stateListDiv").hide();
			$("#stateDrillListDiv").hide();
			$("#districtDiv").hide();
			$("#blockDiv").hide();
			$("#villageDiv").hide();
			$scope.clearSelections();
			
		} else if(type == 'V'){
			$("#mainDiv").hide();
			$("#stateListDiv").hide();
			$("#stateDrillListDiv").hide();
			$("#districtDiv").hide();
			$("#blockDiv").hide();
			$("#villageDiv").hide();
			if($scope.stateTier != 'ZG') {
				$scope.blockCode = null;
				$scope.blockName = null;
				if($scope.stateTier == 'IG') {
					$scope.type = 'BS';
				} else {
					$scope.type = 'B';
				}
				$("#blockDiv").show();
				getBlockData($scope.districtCode, $scope.districtName );
				
			} else {
				$scope.districtCode = null;
				$scope.districtName = null;
				$scope.type = 'D';
				$("#districtDiv").show();
				getDistrictData();
			}
		}else if(type == 'B'){
			$scope.type = 'D';
			$("#mainDiv").hide();
			$("#stateListDiv").hide();
			$("#stateDrillListDiv").hide();
			$("#districtDiv").show();
			$("#blockDiv").hide();
			$("#villageDiv").hide();
			$scope.blockCode = null;
			$scope.blockName = null;
			$scope.districtCode = null;
			$scope.districtName = null;
			getDistrictData();
			
		}else if(type == 'SD'){
			$scope.type = 'S';
			$("#mainDiv").hide();
			$("#stateListDiv").show();
			$("#stateDrillListDiv").hide();
			$("#districDrillListDiv").hide();
			$("#districtDiv").hide();
			$("#blockDiv").hide();
			$("#villageDiv").hide();
			$scope.statecode = null;
			$scope.stateName = null;
			getState();
			
		}else if (type == 'S' || type == 'BS'){
			$scope.type = 'MAIN';
			$("#mainDiv").show();
			$("#stateListDiv").hide();
			$("#stateDrillListDiv").hide();
			$("#districtDiv").hide();
			$("#blockDiv").hide();
			$("#villageDiv").hide();
			$scope.clearSelections();
		}else if(type == 'DD'){
			$scope.type = 'SD';
			$("#mainDiv").hide();
			$("#stateListDiv").hide();
			$("#stateDrillListDiv").show();
			$("#districtDiv").hide();
			$("#districDrillListDiv").hide();
			$("#blockDiv").hide();
			$scope.zpname = null;
			$("#villageDiv").hide();
			$("#stateHidden").val($scope.statecode);
			$scope.getStateDrill($scope.statecode, $scope.stateName);
			//alert($scope.statecode);
			//$scope.statecode = null;
			//$scope.stateName = null;
			
	}
}

	
}]);





