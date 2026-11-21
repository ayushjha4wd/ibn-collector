var consolidatedReceiptExpModule = angular.module('consolidatedReceiptExpModule', ['angular.filter']);
consolidatedReceiptExpModule.controller("consolidatedReceiptExpController", ['$scope', "consolidatedReceiptExpService", function($scope, consolidatedReceiptExpService) {

$scope.stateCode = "";
$scope.stateName = null;
$scope.finYear = null;
$scope.type = 'MAIN';
$scope.districtCode = 0 ;
$scope.districtName = null;
$scope.headings = false;                                                                                      
$scope.schemeList ={};
$scope.reptype = null;
$scope.tableName= "unspent_balance_split";
$scope.schDate = null;
$scope.clearSelections = function clearSelections(){
	$scope.stateCode = "";
	$scope.stateName = null;
	$scope.finYear = null;
	$scope.schemeUid = null;
	$scope.reportType = null;
	 $scope.schemeName = null;
	
	 $scope.schemeList = {};
	 $("#close").hide();
	$scope.type = 'MAIN';
	$scope.headings = false;
	$("#stateDiv").hide();
	$scope.districtCode = 0 ;
	$scope.districtName = null;
	$scope.reptype = null;
}

function getStateTier(stateCode){
	$scope.stateTier = null;
	consolidatedReceiptExpService.getStateTier(stateCode).then(function(response){
		$scope.stateTier = response.data;
	});
}



$scope.showState = function showState(type) {
	$scope.reptype = type;
	if ($scope.reportType == 'I'){
		$("#stateDiv").show();
		getStateList();
	} else {
		$("#stateDiv").hide();
		$scope.onScheme(-1);
	}
	$scope.schemeList = {};
	$scope.stateCode = "";
	
}

	$scope.onScheme = function onScheme(state) {
		var finYear = document.getElementById("finYear").value;
		var stateName = $("#StateId option:selected").text();
		$scope.finYear = finYear;
		$scope.stateCode = state;
		if(state!=-1){
		getStateTier(state);
		}
		$scope.stateName = stateName;
		getSchemeList(state,finYear);
	}
	
	function getSchemeList(state,finYear) {
		$scope.schemeList = {};
		consolidatedReceiptExpService.getSchemeList(state,finYear,$scope.reptype).then(function(response) {
			var schemeDetail = new Array();
			angular.forEach(response.data, function(obj, key) {
			   var scheme = new schemeDetails();
			   scheme.schemeId = obj.schemeid;
			   if(obj.scheme_category == 'A') {
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
	
	
	function getStateList() {
		var finYear = document.getElementById("finYear").value;
		$scope.stateList = {};
		consolidatedReceiptExpService.getConsolidatedStateList(finYear).then(function(response) {
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
	
		
		if($("#finYear").val() == null || $("#finYear").val() == 0 || $("#finYear").val() == "") {
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
				if($scope.reptype == 'I'){
					
					consolidatedReceiptExpService.schedularDate($scope.stateCode,$scope.tableName).then(function(response) {
						$scope.schDate = response.data;
						getDistrictData($scope.schDate);
						});
					
				}else {
					//$scope.stateCode ="9";
					consolidatedReceiptExpService.schedularDate(9,$scope.tableName).then(function(response) {
						$scope.schDate = response.data;
						getState($scope.schDate);
						});
					
				}
				
			} else {
				$("#captchaAnswer_error1").show();
				refreshCaptcha();
			
			}
		}
	}
	function getState(schDate) {
		$scope.schedularDate = schDate;
		$scope.loader = true;
		$scope.StateList ={};
		$scope.countList = {};
		$scope.sumOb_amount = 0;
		$scope.sumReceipt_amount = 0;
		$scope.sumPayment_amount = 0;
		$scope.sumUnspent_amount = 0;
		$scope.stateName = null;
		$scope.headings = true;
		$("#mainDiv").hide();
		$("#stateListDiv").show();
		$("#stateDrillListDiv").hide();
		$("#districtDiv").hide();
		$("#close").show();
		
		$scope.reportHeaderTitle = "STATE WISE RECEIPTS AND EXPENDITURES ";
		$scope.type = 'A';
		
		consolidatedReceiptExpService.generateConsolidatedState($scope.finYear, $scope.schemeUid, $scope.reptype).then(function(response){
			if(response.data.length > 0) {
				 var stateDetail = new Array();
				 var sum =  new sumCount();
				
				angular.forEach(response.data, function(obj, key) {
					 var state = new stateDetails();
					 state.code = obj.code;
					 state.name = obj.name;
					 state.schemename = obj.schemename;
					 state.schemecomponentname = obj.schemecomponentname;
					 
					 if($scope.amountIn=="RS"){
						 state.obAmount =  parseFloat(parseFloat(obj.obAmount)).toFixed(2);
						 state.receiptAmount =  parseFloat(parseFloat(obj.receiptAmount)).toFixed(2);
						 state.paymentAmount =  parseFloat(parseFloat(obj.paymentAmount)).toFixed(2);
						 state.unspentAmount =  parseFloat(((parseFloat(obj.obAmount)) + (parseFloat(obj.receiptAmount)) - (parseFloat(obj.paymentAmount)))).toFixed(2);
					 
					 }else if($scope.amountIn=="LK"){
						 state.obAmount = parseFloat(parseFloat(obj.obAmount)/100000).toFixed(3);
						 state.receiptAmount = parseFloat(parseFloat(obj.receiptAmount)/100000).toFixed(3);
						 state.paymentAmount = parseFloat(parseFloat(obj.paymentAmount)/100000).toFixed(3);
						 state.unspentAmount = parseFloat(((parseFloat(obj.obAmount/100000)) + (parseFloat(obj.receiptAmount/100000)) - (parseFloat(obj.paymentAmount/100000)))).toFixed(3);
					 
					 }else if($scope.amountIn=="CR"){
						 state.obAmount = parseFloat(parseFloat(obj.obAmount)/10000000).toFixed(3);
						 state.receiptAmount = parseFloat(parseFloat(obj.receiptAmount)/10000000).toFixed(3);
						 state.paymentAmount = parseFloat(parseFloat(obj.paymentAmount)/10000000).toFixed(3);
						 state.unspentAmount = parseFloat(((parseFloat(obj.obAmount/10000000)) + (parseFloat(obj.receiptAmount/10000000)) - (parseFloat(obj.paymentAmount/10000000)))).toFixed(3);
					 }
					 
					 var availableFunds =  parseFloat(parseFloat(obj.obAmount) + parseFloat(obj.receiptAmount)).toFixed(3);
					 var unspentBalance =   parseFloat(parseFloat(availableFunds) -  parseFloat(obj.paymentAmount)).toFixed(3);
					 if(availableFunds!= 0.000){
						 state.percentageExp = parseFloat(parseFloat(parseFloat(unspentBalance) / parseFloat(availableFunds))*100).toFixed(2);
					 }else{
						 state.percentageExp = 0.00;
					 }
					 stateDetail.push(state);
					 
					 if($scope.amountIn=="RS"){
						 sum.sumReceipt_amount = parseFloat((parseFloat(sum.sumReceipt_amount)) + (parseFloat(obj.receiptAmount))).toFixed(2);
						 sum.sumPayment_amount = parseFloat((parseFloat(sum.sumPayment_amount)) + (parseFloat(obj.paymentAmount))).toFixed(2);
						 sum.sumOb_amount = parseFloat((parseFloat(sum.sumOb_amount)) + (parseFloat(obj.obAmount))).toFixed(2);
						 sum.sumUnspent_amount =  parseFloat((parseFloat(sum.sumUnspent_amount)) + ((parseFloat(obj.obAmount)) +
								 (parseFloat(obj.receiptAmount)) - (parseFloat(obj.paymentAmount)))).toFixed(2);
						 
					 }else if($scope.amountIn=="LK"){
						 sum.sumPayment_amount = parseFloat((parseFloat(sum.sumPayment_amount)) + (parseFloat(obj.paymentAmount/100000))).toFixed(3);
						 sum.sumReceipt_amount =   parseFloat((parseFloat(sum.sumReceipt_amount)) + (parseFloat(obj.receiptAmount/100000))).toFixed(3);
						 sum.sumOb_amount =  parseFloat((parseFloat(sum.sumOb_amount)) + (parseFloat(obj.obAmount/100000))).toFixed(3);
						 sum.sumUnspent_amount =  parseFloat((parseFloat(sum.sumUnspent_amount)) + ((parseFloat(obj.obAmount/100000)) +
								 (parseFloat(obj.receiptAmount/100000)) - (parseFloat(obj.paymentAmount/100000)))).toFixed(3);
						 
					 }else if($scope.amountIn=="CR"){
						 sum.sumPayment_amount =  parseFloat((parseFloat(sum.sumPayment_amount)) + (parseFloat(obj.paymentAmount/10000000))).toFixed(3);
						 sum.sumReceipt_amount =  parseFloat((parseFloat( sum.sumReceipt_amount)) + (parseFloat(obj.receiptAmount/10000000))).toFixed(3);
						 sum.sumOb_amount =  parseFloat((parseFloat(sum.sumOb_amount)) + (parseFloat(obj.obAmount/10000000))).toFixed(3);
						 sum.sumUnspent_amount =  parseFloat((parseFloat(sum.sumUnspent_amount)) + ((parseFloat(obj.obAmount/10000000)) +
								 (parseFloat(obj.receiptAmount/10000000)) - (parseFloat(obj.paymentAmount/10000000)))).toFixed(3);
						 
					 }
					 
					 
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
				$("#stateDiv").hide();
				$("#close").hide();
				$scope.clearSelections();
				alert("No Data Found");
				
			}
		});
	}
	
	$scope.getStateDrill = function getStateDrill(statecode, statename) {
		$scope.statecode = statecode;
		$scope.statename = statename;
		$scope.stateTier = null;
		consolidatedReceiptExpService.schedularDate($scope.statecode,$scope.tableName).then(function(response) {
			$scope.schedularDate = response.data;
		consolidatedReceiptExpService.getStateTier(statecode).then(function(response){
			$scope.stateTier = response.data;
			
			$scope.loader = true;
			$scope.StateDrillList ={};
			$scope.countList = {};
			$scope.sumOb_amount = 0;
			$scope.sumReceipt_amount = 0;
			$scope.sumPayment_amount = 0;
			$scope.sumUnspent_amount = 0;
			/*$scope.schedularDate = schDate;*/
			
			$scope.type = 'SD';
			
			
			$("#mainDiv").hide();
			$("#districtDiv").hide();
			$("#stateListDiv").hide();
			$("#stateDrillListDiv").show();
			$("#close").show();
			consolidatedReceiptExpService.generateConsolidatedStateDrill($scope.finYear,$scope.schemeUid, $scope.statecode,$scope.reptype).then(function(response){
				 var drillDetail = new Array();
				 var sum =  new sumCount();
				
				angular.forEach(response.data, function(obj, key) {
					 var drill = new drillDetails();
					
					 drill.name = obj.name;
					 drill.code = obj.code;
					 drill.local_body_code = obj.local_body_code;
					 drill.schemename = obj.schemename;
					 drill.schemecomponentname = obj.schemecomponentname;

					 if($scope.amountIn=="RS"){
						 drill.obAmount =  parseFloat(parseFloat(obj.obAmount)).toFixed(2);
						 drill.receiptAmount =  parseFloat(parseFloat(obj.receiptAmount)).toFixed(2);
						 drill.paymentAmount =  parseFloat(parseFloat(obj.paymentAmount)).toFixed(2);
						 drill.unspentAmount =  parseFloat(((parseFloat(obj.obAmount)) + (parseFloat(obj.receiptAmount)) - (parseFloat(obj.paymentAmount)))).toFixed(2);
					 
					 }else if($scope.amountIn=="LK"){
						 drill.obAmount = parseFloat(parseFloat(obj.obAmount)/100000).toFixed(3);
						 drill.receiptAmount = parseFloat(parseFloat(obj.receiptAmount)/100000).toFixed(3);
						 drill.paymentAmount = parseFloat(parseFloat(obj.paymentAmount)/100000).toFixed(3);
						 drill.unspentAmount = parseFloat(((parseFloat(obj.obAmount/100000)) + (parseFloat(obj.receiptAmount/100000)) - (parseFloat(obj.paymentAmount/100000)))).toFixed(3);
					 
					 }else if($scope.amountIn=="CR"){
						 drill.obAmount = parseFloat(parseFloat(obj.obAmount)/10000000).toFixed(3);
						 drill.receiptAmount = parseFloat(parseFloat(obj.receiptAmount)/10000000).toFixed(3);
						 drill.paymentAmount = parseFloat(parseFloat(obj.paymentAmount)/10000000).toFixed(3);
						 drill.unspentAmount = parseFloat(((parseFloat(obj.obAmount/10000000)) + (parseFloat(obj.receiptAmount/10000000)) - (parseFloat(obj.paymentAmount/10000000)))).toFixed(3);
					 }
					 
					 var availableFunds =  parseFloat(parseFloat(obj.obAmount) + parseFloat(obj.receiptAmount)).toFixed(3);
					 var unspentBalance =   parseFloat(parseFloat(availableFunds) -  parseFloat(obj.paymentAmount)).toFixed(3);
					 if(availableFunds!= 0.000){
						 drill.percentageExp = parseFloat(parseFloat(parseFloat(unspentBalance) / parseFloat(availableFunds))*100).toFixed(2);
					 }else{
						 drill.percentageExp = 0.00;
					 }
					 drillDetail.push(drill);
					 
					 if($scope.amountIn=="RS"){
						 sum.sumReceipt_amount = parseFloat((parseFloat(sum.sumReceipt_amount)) + (parseFloat(obj.receiptAmount))).toFixed(2);
						 sum.sumPayment_amount = parseFloat((parseFloat(sum.sumPayment_amount)) + (parseFloat(obj.paymentAmount))).toFixed(2);
						 sum.sumOb_amount = parseFloat((parseFloat(sum.sumOb_amount)) + (parseFloat(obj.obAmount))).toFixed(2);
						 sum.sumUnspent_amount =  parseFloat((parseFloat(sum.sumUnspent_amount)) + ((parseFloat(obj.obAmount)) +
								 (parseFloat(obj.receiptAmount)) - (parseFloat(obj.paymentAmount)))).toFixed(2);
						 
					 }else if($scope.amountIn=="LK"){
						 sum.sumPayment_amount = parseFloat((parseFloat(sum.sumPayment_amount)) + (parseFloat(obj.paymentAmount/100000))).toFixed(3);
						 sum.sumReceipt_amount =   parseFloat((parseFloat(sum.sumReceipt_amount)) + (parseFloat(obj.receiptAmount/100000))).toFixed(3);
						 sum.sumOb_amount =  parseFloat((parseFloat(sum.sumOb_amount)) + (parseFloat(obj.obAmount/100000))).toFixed(3);
						 sum.sumUnspent_amount =  parseFloat((parseFloat(sum.sumUnspent_amount)) + ((parseFloat(obj.obAmount/100000)) +
								 (parseFloat(obj.receiptAmount/100000)) - (parseFloat(obj.paymentAmount/100000)))).toFixed(3);
						 
					 }else if($scope.amountIn=="CR"){
						 sum.sumPayment_amount =  parseFloat((parseFloat(sum.sumPayment_amount)) + (parseFloat(obj.paymentAmount/10000000))).toFixed(3);
						 sum.sumReceipt_amount =  parseFloat((parseFloat( sum.sumReceipt_amount)) + (parseFloat(obj.receiptAmount/10000000))).toFixed(3);
						 sum.sumOb_amount =  parseFloat((parseFloat(sum.sumOb_amount)) + (parseFloat(obj.obAmount/10000000))).toFixed(3);
						 sum.sumUnspent_amount =  parseFloat((parseFloat(sum.sumUnspent_amount)) + ((parseFloat(obj.obAmount/10000000)) +
								 (parseFloat(obj.receiptAmount/10000000)) - (parseFloat(obj.paymentAmount/10000000)))).toFixed(3);
						 
					 } 
					 
				});	
				 $scope.StateDrillList = drillDetail;
				 $scope.countList = sum;
				$scope.loader = false;
			});
		});
		});

		
	}
	
		
		function getDistrictData(schDate){
			$scope.schedularDate = schDate;
		$scope.loader = true;
		$scope.DistrictList ={};
		$scope.countList = {};
		$scope.sumOb_amount = 0;
		$scope.sumReceipt_amount = 0;
		$scope.sumPayment_amount = 0;
		$scope.sumUnspent_amount = 0;
		$scope.type = 'I';
		$scope.headings = true;
		
		$("#mainDiv").hide();
		$("#stateListDiv").hide();
		$("#stateDrillListDiv").hide();
		$("#districtDiv").show();
		$("#close").show();
		
		consolidatedReceiptExpService.generateConsolidatedDistrict($scope.finYear, $scope.stateCode, $scope.schemeUid,$scope.reptype).then(function(response){
			if(response.data.length > 0) {
				 var districtDetail = new Array();
				 var sum =  new sumCount();
				
				angular.forEach(response.data, function(obj, key) {
					 var district = new districtDetails();
					 
					 district.name = obj.name;
					 district.code = obj.code;
					 district.schemename = obj.schemename;
					 district.schemecomponentname = obj.schemecomponentname;

					 if($scope.amountIn=="RS"){
						 district.obAmount =  parseFloat(parseFloat(obj.obAmount)).toFixed(2);
						 district.receiptAmount =  parseFloat(parseFloat(obj.receiptAmount)).toFixed(2);
						 district.paymentAmount =  parseFloat(parseFloat(obj.paymentAmount)).toFixed(2);
						 district.unspentAmount =  parseFloat(((parseFloat(obj.obAmount)) + (parseFloat(obj.receiptAmount)) - (parseFloat(obj.paymentAmount)))).toFixed(2);
					 
					 }else if($scope.amountIn=="LK"){
						 district.obAmount = parseFloat(parseFloat(obj.obAmount)/100000).toFixed(3);
						 district.receiptAmount = parseFloat(parseFloat(obj.receiptAmount)/100000).toFixed(3);
						 district.paymentAmount = parseFloat(parseFloat(obj.paymentAmount)/100000).toFixed(3);
						 district.unspentAmount = parseFloat(((parseFloat(obj.obAmount/100000)) + (parseFloat(obj.receiptAmount/100000)) - (parseFloat(obj.paymentAmount/100000)))).toFixed(3);
					 
					 }else if($scope.amountIn=="CR"){
						 district.obAmount = parseFloat(parseFloat(obj.obAmount)/10000000).toFixed(3);
						 district.receiptAmount = parseFloat(parseFloat(obj.receiptAmount)/10000000).toFixed(3);
						 district.paymentAmount = parseFloat(parseFloat(obj.paymentAmount)/10000000).toFixed(3);
						 district.unspentAmount = parseFloat(((parseFloat(obj.obAmount/10000000)) + (parseFloat(obj.receiptAmount/10000000)) - (parseFloat(obj.paymentAmount/10000000)))).toFixed(3);
					 }
					 
					 var availableFunds =  parseFloat(parseFloat(obj.obAmount) + parseFloat(obj.receiptAmount)).toFixed(3);
					 var unspentBalance =   parseFloat(parseFloat(availableFunds) -  parseFloat(obj.paymentAmount)).toFixed(3);
					 if(availableFunds!= 0.000){
						 district.percentageExp = parseFloat(parseFloat(parseFloat(unspentBalance) / parseFloat(availableFunds))*100).toFixed(2);
					 }else{
						 district.percentageExp = 0.00;
					 }
					 districtDetail.push(district);
					 
					 if($scope.amountIn=="RS"){
						 sum.sumReceipt_amount = parseFloat((parseFloat(sum.sumReceipt_amount)) + (parseFloat(obj.receiptAmount))).toFixed(2);
						 sum.sumPayment_amount = parseFloat((parseFloat(sum.sumPayment_amount)) + (parseFloat(obj.paymentAmount))).toFixed(2);
						 sum.sumOb_amount = parseFloat((parseFloat(sum.sumOb_amount)) + (parseFloat(obj.obAmount))).toFixed(2);
						 sum.sumUnspent_amount =  parseFloat((parseFloat(sum.sumUnspent_amount)) + ((parseFloat(obj.obAmount)) +
								 (parseFloat(obj.receiptAmount)) - (parseFloat(obj.paymentAmount)))).toFixed(2);
						 
					 }else if($scope.amountIn=="LK"){
						 sum.sumPayment_amount = parseFloat((parseFloat(sum.sumPayment_amount)) + (parseFloat(obj.paymentAmount/100000))).toFixed(3);
						 sum.sumReceipt_amount =   parseFloat((parseFloat(sum.sumReceipt_amount)) + (parseFloat(obj.receiptAmount/100000))).toFixed(3);
						 sum.sumOb_amount =  parseFloat((parseFloat(sum.sumOb_amount)) + (parseFloat(obj.obAmount/100000))).toFixed(3);
						 sum.sumUnspent_amount =  parseFloat((parseFloat(sum.sumUnspent_amount)) + ((parseFloat(obj.obAmount/100000)) +
								 (parseFloat(obj.receiptAmount/100000)) - (parseFloat(obj.paymentAmount/100000)))).toFixed(3);
						 
					 }else if($scope.amountIn=="CR"){
						 sum.sumPayment_amount =  parseFloat((parseFloat(sum.sumPayment_amount)) + (parseFloat(obj.paymentAmount/10000000))).toFixed(3);
						 sum.sumReceipt_amount =  parseFloat((parseFloat( sum.sumReceipt_amount)) + (parseFloat(obj.receiptAmount/10000000))).toFixed(3);
						 sum.sumOb_amount =  parseFloat((parseFloat(sum.sumOb_amount)) + (parseFloat(obj.obAmount/10000000))).toFixed(3);
						 sum.sumUnspent_amount =  parseFloat((parseFloat(sum.sumUnspent_amount)) + ((parseFloat(obj.obAmount/10000000)) +
								 (parseFloat(obj.receiptAmount/10000000)) - (parseFloat(obj.paymentAmount/10000000)))).toFixed(3);
						 
					 } 
					
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
				$("#close").hide();
				
				$scope.clearSelections();
				alert("No Data Found");
				
			}
		});
	}
	
	
	
	
$scope.onBack = function onBack(type) {
		
		if(type == 'A') {
			$scope.type = 'MAIN';
			$("#mainDiv").show();
			$("#stateListDiv").hide();
			$("#stateDrillListDiv").hide();
			$("#districtDiv").hide();
			$scope.clearSelections();
			
		} else if(type == 'I'){
			$("#mainDiv").show();
			$("#stateListDiv").hide();
			$("#stateDrillListDiv").hide();
			$("#districtDiv").hide();
			$scope.clearSelections();
		}else if(type == 'SD'){
			
			$("#mainDiv").hide();
			$("#stateListDiv").show();
			$("#stateDrillListDiv").hide();
			$("#districtDiv").hide();
			getState();
			
		}
	}
	

	



$scope.exportFile = function exportFile(id) {
	
	$("#" + id).excelexportjs({
		containerid : id,
		datatype : 'table',
		worksheetName : "Consolidated Receipt Expenditure Details Report",
	});
}

}]);





