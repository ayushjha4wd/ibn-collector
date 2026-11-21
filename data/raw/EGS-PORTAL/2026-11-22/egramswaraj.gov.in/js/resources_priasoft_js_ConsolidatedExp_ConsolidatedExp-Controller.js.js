var consolidatedExpModule = angular.module('consolidatedExpModule', ['angular.filter']);
consolidatedExpModule.controller("consolidatedExpController", ['$scope', "consolidatedExpService", function($scope, consolidatedExpService) {

$scope.stateCode = "";
$scope.stateName = null;
$scope.level = null;
$scope.finYear = null;
$scope.type = 'MAIN';
$scope.districtCode = 0 ;
$scope.districtName = null;
$scope.headings = false;                                                                                      
$scope.schemeList ={};
$scope.reptype = null;
$scope.clearSelections = function clearSelections(){
	$scope.stateCode = "";
	$scope.stateName = null;
	$scope.finYear = null;
	$scope.reportType = null;
	$("input[name='reportType']").prop("checked", false);
	//$("input[name='lbType']").prop("checked", false);
	 $("#close").hide();
	$scope.type = 'MAIN';
	$scope.headings = false;
	$("#stateDiv").hide();
	$scope.districtCode = 0 ;
	$scope.districtName = null;
	
}

function getStateTier(stateCode){
	$scope.stateTier = null;
	consolidatedExpService.getStateTier(stateCode).then(function(response){
		$scope.stateTier = response.data;
	});
}

$scope.showState = function showState(lbType) {
	//$scope.reptype = type;
	if (lbType == 'I'){
		$("#stateDiv").show();
		getStateList();
	} else {
		$("#stateDiv").hide();
		//$scope.stateName = null;
		
		$scope.onScheme(-1);
	}
	$scope.schemeList = {};
	$scope.stateCode = "";
	
}

	$scope.onScheme = function onScheme(state) {
		var finYear = document.getElementById("finYear").value;
		if(state>0){
		var stateName = $("#StateId option:selected").text();
		$scope.stateName = stateName;
		}else{
			$scope.stateName = null;
		}		
		$scope.finYear = finYear;
		$scope.stateCode = state;
		if(state!=-1){
		getStateTier(state);
		}
		
		getSchemeList(state,finYear);
	}	
		
	function getSchemeList(state,finYear) {
		$scope.schemeList = {};
		consolidatedExpService.getSchemeList(state,finYear,$scope.reptype).then(function(response) {
			var schemeDetail = new Array();
			angular.forEach(response.data, function(obj, key) {
			   var scheme = new schemeDetails();
			   scheme.schemeId = obj.pes_schemeid;
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
		consolidatedExpService.getConsolidatedStateList(finYear).then(function(response) {
		   $scope.stateList = response.data;
   		});
	}
	
	$scope.generateReport = function generateReport(target) {
		var error = false;
		$('.errored').hide();
		
		if($("#finYear").val() == null || $("#finYear").val() == 0 || $("#finYear").val() == "") {
			$("#finclYear_error").show();
			error = true;
		}
		
		if(!$("input[name='reportType']").is(":checked")) {
			$("#reportType_error").show();
			error = true;
		}
		if(!$("input[name='lbType']").is(":checked")) {
			$("#lbType_error").show();
			error = true;
		}else {
			if($("input[name='lbType']:checked").val() == 'I') {
				if($scope.stateCode == null || $scope.stateCode == 0 || $scope.stateCode == "") {
					$("#State_error").show();
					error = true;
				}
			}
		}
		
		/*if($("#schemeUid").val() == null || $("#schemeUid").val() == "") {
			$("#schemeUid_error").show();
			error = true;
		}else {
			 $scope.schemeUid=$("#schemeUid").val();
			 $scope.schemeName = $("#schemeUid option:selected").text();
		}*/
		
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
				$scope.reportType = $("input[name='reportType']:checked").val();
				
				
				if($scope.reportType == 'D'){
		            $scope.level = "Zilla Panchayat And Equivalent";
		    }else if($scope.reportType == 'I'){
		            $scope.level = "Block Panchayat And Equivalent";
		            
		    }else if($scope.reportType == 'V'){
		            $scope.level = "Village Panchayat And Equivalent";
		            
		    }
				getDistrictData();
				
			} else {
				$("#captchaAnswer_error1").show();
				refreshCaptcha();
			
			}
		}
	}
	
	
		
		function getDistrictData(){
		$scope.loader = true;
		$scope.DistrictList ={};
		$scope.countList = {};
		$scope.sumtotalExpenditure = 0;
		$scope.sumexpAct2425 = 0;
		$scope.sumexpAct2324 = 0;
		$scope.sumexpAct2223 = 0;
		$scope.sumexpAct2122 = 0;
		$scope.sumexpAct2021 = 0;
		//$scope.type = 'I';
		$scope.headings = true;		
		$("#mainDiv").hide();
		$("#allStateTable").show();
		$("#close").show();
		//$scope.lbType = $("#lbType").val();
		$scope.lbType = $("input[name='lbType']:checked").val();
		$scope.reportType = $("input[name='reportType']:checked").val();
		$scope.componentType = $("input[name='componentType']:checked").val();
		if($scope.componentType === undefined){
			$scope.componentType=null;
		}
		
		/*if($scope.reportType == 'ZP'){
            $scope.level = "Zilla Panchayat And Equivalent";
    }else if($scope.reportType == 'BP'){
            $scope.level = "Block Panchayat And Equivalent";
            
    }else if($scope.reportType == 'VP'){
            $scope.level = "Village Panchayat And Equivalent";
            
    }*/
		//$scope.reportType = $("#reportType").val();
		var schemeUid = 1769;
		
		
		
		
		consolidatedExpService.getConsolidatedExpenditureDetails($scope.stateCode,$scope.finYear, schemeUid ,$scope.reportType,$scope.lbType,$scope.componentType).then(function(response){
			if(response.data.length > 0) {
				 var districtDetail = new Array();
				 var sum =  new sumCount();
				 
				 
				
				angular.forEach(response.data, function(obj, key) {
					 var district = new districtDetails();					 
					district.stateName = obj.stateName;			

					 if($scope.amountIn=="RS"){						 
						 
						 district.totalExpenditure = obj.totalExpenditure;
						 district.expAct2425 = parseFloat(parseFloat(obj.expenditure_2425)).toFixed(2);
						 district.expAct2324 = parseFloat(parseFloat(obj.expenditure_2324)).toFixed(2);
						 district.expAct2223 = parseFloat(parseFloat(obj.expenditure_2223)).toFixed(2);
						 district.expAct2122 = parseFloat(parseFloat(obj.expenditure_2122)).toFixed(2);
						 district.expAct2021 = parseFloat(parseFloat(obj.expenditure_2021)).toFixed(2);
					 
					 }else if($scope.amountIn=="LK"){
						 
						 district.totalExpenditure = parseFloat(parseFloat(obj.totalExpenditure)/100000).toFixed(3);
						 district.expAct2425 = parseFloat(parseFloat(obj.expenditure_2425)/100000).toFixed(3);
						 district.expAct2324 = parseFloat(parseFloat(obj.expenditure_2324)/100000).toFixed(3);
						 district.expAct2223 = parseFloat(parseFloat(obj.expenditure_2223)/100000).toFixed(3);
						 district.expAct2122 = parseFloat(parseFloat(obj.expenditure_2122)/100000).toFixed(3);
						 district.expAct2021 = parseFloat(parseFloat(obj.expenditure_2021)/100000).toFixed(3);
					 
					 }else if($scope.amountIn=="CR"){
						 
						 district.totalExpenditure = parseFloat(parseFloat(obj.totalExpenditure)/10000000).toFixed(3);
						 district.expAct2425 = parseFloat(parseFloat(obj.expenditure_2425)/10000000).toFixed(3);
						 district.expAct2324 = parseFloat(parseFloat(obj.expenditure_2324)/10000000).toFixed(3);
						 district.expAct2223 = parseFloat(parseFloat(obj.expenditure_2223)/10000000).toFixed(3);
						 district.expAct2122 = parseFloat(parseFloat(obj.expenditure_2122)/10000000).toFixed(3);
						 district.expAct2021 = parseFloat(parseFloat(obj.expenditure_2021)/10000000).toFixed(3);
						 
					 }
					 
					 districtDetail.push(district);
					 
					 if($scope.amountIn=="RS"){
						 sum.sumtotalExpenditure = parseFloat((parseFloat(sum.sumtotalExpenditure)) + (parseFloat(obj.totalExpenditure))).toFixed(2);
						 sum.sumexpAct2425 = parseFloat((parseFloat(sum.sumexpAct2425)) + (parseFloat(obj.expenditure_2425))).toFixed(2);
						 sum.sumexpAct2324 = parseFloat((parseFloat(sum.sumexpAct2324)) + (parseFloat(obj.expenditure_2324))).toFixed(2);
						 sum.sumexpAct2223 = parseFloat((parseFloat(sum.sumexpAct2223)) + (parseFloat(obj.expenditure_2223))).toFixed(2);
						 sum.sumexpAct2122 = parseFloat((parseFloat(sum.sumexpAct2122)) + (parseFloat(obj.expenditure_2122))).toFixed(2);
						 sum.sumexpAct2021 = parseFloat((parseFloat(sum.sumexpAct2021)) + (parseFloat(obj.expenditure_2021))).toFixed(2);
						
						 
					 }else if($scope.amountIn=="LK"){
						 sum.sumtotalExpenditure = parseFloat((parseFloat(sum.sumtotalExpenditure)) + (parseFloat(obj.totalExpenditure/100000))).toFixed(3);
						 sum.sumexpAct2425 = parseFloat((parseFloat(sum.sumexpAct2425)) + (parseFloat(obj.expenditure_2425/100000))).toFixed(3);
						 sum.sumexpAct2324 = parseFloat((parseFloat(sum.sumexpAct2324)) + (parseFloat(obj.expenditure_2324/100000))).toFixed(3);
						 sum.sumexpAct2223 = parseFloat((parseFloat(sum.sumexpAct2223)) + (parseFloat(obj.expenditure_2223/100000))).toFixed(3);
						 sum.sumexpAct2122 = parseFloat((parseFloat(sum.sumexpAct2122)) + (parseFloat(obj.expenditure_2122/100000))).toFixed(3);
						 sum.sumexpAct2021 = parseFloat((parseFloat(sum.sumexpAct2021)) + (parseFloat(obj.expenditure_2021/100000))).toFixed(3);
						
					 }else if($scope.amountIn=="CR"){
						sum.sumtotalExpenditure = parseFloat((parseFloat(sum.sumtotalExpenditure)) + (parseFloat(obj.totalExpenditure/10000000))).toFixed(3);
						 sum.sumexpAct2425 = parseFloat((parseFloat(sum.sumexpAct2425)) + (parseFloat(obj.expenditure_2425/10000000))).toFixed(3);
						 sum.sumexpAct2324 = parseFloat((parseFloat(sum.sumexpAct2324)) + (parseFloat(obj.expenditure_2324/10000000))).toFixed(3);
						 sum.sumexpAct2223 = parseFloat((parseFloat(sum.sumexpAct2223)) + (parseFloat(obj.expenditure_2223/10000000))).toFixed(3);
						 sum.sumexpAct2122 = parseFloat((parseFloat(sum.sumexpAct2122)) + (parseFloat(obj.expenditure_2122/10000000))).toFixed(3);
						 sum.sumexpAct2021 = parseFloat((parseFloat(sum.sumexpAct2021)) + (parseFloat(obj.expenditure_2021/10000000))).toFixed(3);
											 
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
				
				/////////////
				$("#allStateTable").hide();
				
				$scope.clearSelections();
				alert("No Data Found");
				
			}
		});
	}
	
		
	

$scope.exportFile = function exportFile(id) {
	
	$("#" + id).excelexportjs({
		containerid : id,
		datatype : 'table',
		worksheetName : "Expenditure Details on Plan Year Wise Activities",
	});
}

}]);





