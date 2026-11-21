var percentageExpenditureReportModule = angular.module('percentageExpenditureReportModule', ['angular.filter']);
percentageExpenditureReportModule.controller("percentageExpenditureReportController", ['$scope', "percentageExpenditureReportService", function($scope, percentageExpenditureReportService) {

$scope.stateCode = 0;
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
	$scope.stateCode = 0;
	$scope.stateName = null;
	$scope.finYear = null;
	$scope.schemeUid = null;
	$scope.reportType = null;
	 $scope.schemeName = null;
	 $("input[name='viewType']").prop("checked", false);
	 $scope.schemeList = {};
	 $("#close").hide();
	$scope.type = 'MAIN';
	$scope.headings = false;
	$("#stateDiv").hide();
	$scope.blockName = null;
	$scope.blockCode = 0 ;
	$scope.districtCode = 0 ;
	$scope.districtName = null;
	$scope.reptype = null;
}

function getStateTier(stateCode){
	$scope.stateTier = null;
	percentageExpenditureReportService.getStateTier(stateCode).then(function(response){
		$scope.stateTier = response.data;
	});
}

$scope.showState = function showState(type) {
	$scope.reportType = type;
	if(type=="A"){
		$scope.stateCode = 0;
	}
	$("#stateDiv").hide();
	$("input[name='viewType']").prop("checked", false);
	$scope.schemeList = {};
	$scope.stateCode = 0;
	
}

	$scope.onScheme = function onScheme(state) {
		var finYear = document.getElementById("yearid").value;
		var stateName = $("#StateId option:selected").text();
		$scope.finYear = finYear;
		
		if(state!=-1){
			$scope.stateCode = state;
			getStateTier(state);
		}
		$scope.stateName = stateName;
		getSchemeList(state,finYear);
	}
	
	function getSchemeList(state,finYear) {
		$scope.schemeList = {};
		percentageExpenditureReportService.getSchemeList(state,finYear,$scope.reptype).then(function(response) {
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
	
	$scope.showType = function showType(type) {
		$scope.reptype = type;
		if ($scope.reportType == 'I'){
			$("#stateDiv").show();
			getStateList();
		} else {
			$("#stateDiv").hide();
			$scope.onScheme(-1);
		}
	}
	       
	
	function getStateList() {
		var finYear = document.getElementById("yearid").value;
		$scope.stateList = {};
		percentageExpenditureReportService.getZpBpGpStateList($scope.reptype,finYear).then(function(response) {
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
					if($scope.stateCode != 0) {
						$scope.getDistrict();
					}else{
						getState();
					}
				}else if($scope.reptype == 'B'){
					$scope.level = "Block Panchayat And Equivalent";
					if($scope.stateCode != 0) {
						$scope.getStateDrill(0,0,$scope.stateCode, $scope.stateName);
					}else{
						getState();
					}
				}else if($scope.reptype == 'Z'){
					$scope.level = "Zilla Panchayat And Equivalent";
					if($scope.stateCode != 0) {
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
		$scope.sum_pricount = 0;
		$scope.sum_prionborad = 0;
		$scope.sum_zero_to_tw = 0;
		$scope.sum_tw_one_th = 0;
		$scope.sum_th_one_fh = 0;
		$scope.sum_fh_one_fth = 0;
		$scope.sum_fth_one_si = 0;
		$scope.sum_si_one_above = 0;
		$scope.stateName = null;
		$scope.headings = true;
		
		
		$("#mainDiv").hide();
		$("#stateListDiv").show();
		$("#stateDrillListDiv").hide();
		$("#districtDiv").hide();
		$("#districtToVillageDiv").hide();
		$("#districtDivInd").hide();
		$("#blockDiv").hide();
		$("#villageDiv").hide();
		
		$scope.type = 'S';
		percentageExpenditureReportService.generateState( $scope.reptype,$scope.stateCode, $scope.schemeUid,$scope.finYear).then(function(response){
			if(response.data.length > 0) {
				 $scope.StateList = response.data;
				 angular.forEach(response.data, function(obj, key) {
					 $scope.sum_pricount = $scope.sum_pricount + obj.pricount;
					 $scope.sum_prionborad = $scope.sum_prionborad + obj.prionborad;
					 $scope.sum_zero_to_tw = $scope.sum_zero_to_tw + obj.zero_to_tw;
					 $scope.sum_tw_one_th = $scope.sum_tw_one_th + obj.tw_one_th;
					 $scope.sum_th_one_fh = $scope.sum_th_one_fh + obj.th_one_fh;
					 $scope.sum_fh_one_fth = $scope.sum_fh_one_fth + obj.fh_one_fth;
					 $scope.sum_fth_one_si = $scope.sum_fth_one_si + obj.fth_one_si;
					 $scope.sum_si_one_above = $scope.sum_si_one_above + obj.si_one_above;
				 });
				$scope.loader = false;
			} else {
				$scope.loader = false;
				$("#mainDiv").show();
				$("#stateListDiv").hide();
				$("#stateDrillListDiv").hide();
				$("#districtDiv").hide();
				$("#districtDivInd").hide();
				$("#blockDiv").hide();
				$("#villageDiv").hide();
				$("#districtToVillageDiv").hide();
				$("#stateDiv").hide();
				$scope.clearSelections();
				alert("No Data Found");
				
			}
		});
	}
	

	
	$scope.getStateDrill =  function getStateDrill(upper,lower,statecode, statename) {
		$scope.statecode = statecode;
		$scope.stateName = statename;
		$scope.stateTier = null;
		percentageExpenditureReportService.getStateTier(statecode).then(function(response){
			

			$scope.stateTier = response.data;
			
			$scope.loader = true;
			$scope.headings = true;
			$scope.StateDrillList ={};
			
			if($scope.stateTier == 'A' || $scope.stateTier == 'AB' || $scope.stateTier == 'ZG'){
				$scope.reportHeaderTitle = "DISTRICT WISE RECEIPTS AND EXPENDITURES ";
			}else if($scope.stateTier == 'IG'){
				$scope.reportHeaderTitle = "BLOCK WISE RECEIPTS AND EXPENDITURES";
			}else if($scope.stateTier == 'GP'){
				$scope.reportHeaderTitle = "VILLAGE WISE RECEIPTS AND EXPENDITURES";
			}
			if ($scope.reportType == 'I'){
				$scope.type = 'D';
			}else{
				$scope.type = 'SD';	
			}
		
			
			$("#mainDiv").hide();
			$("#districtDiv").hide();
			$("#districtDivInd").hide();
			$("#stateListDiv").hide();
			$("#stateDrillListDiv").hide();
			$("#stateDrillListDiv").show();
			$("#districtToVillageDiv").hide();
			$("#blockDiv").hide();
			$("#villageDiv").hide();
			$("#stateHidden").val($scope.statecode);
			percentageExpenditureReportService.generateStateDrill($scope.finYear,$scope.schemeUid, $scope.statecode,$scope.reptype,upper+1,lower).then(function(response){
				 /*var drillDetail = new Array();
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
					 
					 if(tempNameVp != obj.name) {
						// drill.name = obj.name;
					 } else {
					//	 drill.name = "";
					 }
					
					 
					 if(tempNameVp != obj.local_body_name_english) {
						 drill.local_body_name_english = obj.local_body_name_english;
					 } else {
						 drill.local_body_name_english = "";
					 }
					
					// drill.code = obj.local_body_code;
					 
					 
					 drill.local_body_code = obj.local_body_code;
					 var available =  parseFloat(((parseFloat(obj.ob_amount)) + (parseFloat(obj.receipt_amount)) )).toFixed(2);
					 var unspent =  parseFloat(((parseFloat(obj.ob_amount)) + (parseFloat(obj.receipt_amount)) - (parseFloat(obj.payment_amount)))).toFixed(2);
					 if(available>0){
					 drill.per =    parseFloat(parseFloat( parseFloat(unspent) /  parseFloat(available))*100).toFixed(2);
					 }else{
						 drill.per = 0;
					 }
					 
					 drillDetail.push(drill);
					 
					 tempNameZp = obj.zp_name;
					 tempNameBp = obj.bp_name;
					 tempNameVp = obj.local_body_name_english;
				});*/	
				 $scope.StateDrillList = response.data;
				$scope.loader = false;
			});
		});
		
	}
	
	 $scope.getDistrict = function getDistrict() {
		/*if($scope.stateTier != 'IG') {*/
			$("#districtDiv").show();
			$scope.type = 'D';
			$scope.blockName = null;
			$scope.blockCode = 0 ;
			$scope.districtCode = 0 ;
			$scope.districtName = null;
			
			getDistrictData();
		/*} else {
			$("#blockDiv").show();
			$scope.type = 'BS';
			getBlockData(0, '');
		}*/
	}	
		function getDistrictData(){
		$scope.loader = true;
		$scope.DistrictList ={};
		$scope.sum_zero_to_tw = 0;
		$scope.sum_tw_one_th = 0;
		$scope.sum_th_one_fh = 0;
		$scope.sum_fh_one_fth = 0;
		$scope.sum_fth_one_si = 0;
		$scope.sum_si_one_above = 0;
		
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
		if($scope.reptype=='Z'){
			$("#districtDivInd").show();
			$("#districtDiv").hide();
		}else if($scope.reptype=='B'){
			$("#districtDivInd").show();
			$("#districtDiv").hide();
			
		}else {
		$("#districtDiv").show();
		}
		$("#blockDiv").hide();
		$("#villageDiv").hide();
		
		percentageExpenditureReportService.generateDistrict($scope.finYear, $scope.stateCode, $scope.schemeUid,$scope.reptype,0,0).then(function(response){
			if(response.data.length > 0) {
				 $scope.DistrictList = response.data;
					 angular.forEach(response.data, function(obj, key) {
						 $scope.sum_zero_to_tw = $scope.sum_zero_to_tw + obj.zero_to_tw;
						 $scope.sum_tw_one_th = $scope.sum_tw_one_th + obj.tw_one_th;
						 $scope.sum_th_one_fh = $scope.sum_th_one_fh + obj.th_one_fh;
						 $scope.sum_fh_one_fth = $scope.sum_fh_one_fth + obj.fh_one_fth;
						 $scope.sum_fth_one_si = $scope.sum_fth_one_si + obj.fth_one_si;
						 $scope.sum_si_one_above = $scope.sum_si_one_above + obj.si_one_above;
					 });
				$scope.loader = false;
			}else {
				$scope.loader = false;
				$("#mainDiv").show();
				$("#stateListDiv").hide();
				$("#stateDrillListDiv").hide();
				$("#districtDiv").hide();
				$("#districtDivInd").hide();
				$("#districtToVillageDiv").hide();
				$("#blockDiv").hide();
				$("#villageDiv").hide();
				
				$scope.clearSelections();
				alert("No Data Found");
				
			}
		});
	}
	$scope.districtToVillage = function districtToVillage(upperlimit,lowerlimit,districtCode, districtName) {
		/*if($scope.stateTier != 'ZG') {*/
		$("#blockDiv").hide();
		$scope.upperlimit=upperlimit+1;
		$scope.lowerlimit=lowerlimit;
		getDistrictToVillage(districtCode, districtName);
	}
	
	function getDistrictToVillage(districtCode, districtName){ 
		if($scope.stateTier != 'IG') {
			$scope.districtName = districtName;
		}else{
			$scope.blockName = districtName;
		}
		$scope.districtCode = districtCode;
		$scope.loader = true;
		$scope.DistrictToVillage ={};
		
		
		$scope.type = 'B';
		
		$("#mainDiv").hide();
		$("#districtDiv").hide();
		$("#districtDivInd").hide();
		$("#stateListDiv").hide();
		$("#stateDrillListDiv").hide();
		$("#districtToVillageDiv").show();
		$("#villageDiv").hide();
		$("#districtHidden").val($scope.districtCode);
		percentageExpenditureReportService.generateD2V($scope.finYear, $scope.stateCode, $scope.schemeUid, districtCode,$scope.reptype,$scope.upperlimit,$scope.lowerlimit).then(function(response){
			/*
			 var lists = new Array();
			 angular.forEach(response.data, function(obj, key) {
				 var data = new list();
			data.code= obj.code;
			data.name=obj.name;
			 var available =  parseFloat(((parseFloat(obj.ob_amount)) + (parseFloat(obj.receipt_amount)) )).toFixed(2);
			 var unspent =  parseFloat(((parseFloat(obj.ob_amount)) + (parseFloat(obj.receipt_amount)) - (parseFloat(obj.payment_amount)))).toFixed(2);
			 if(available>0){
			 data.per =    parseFloat(parseFloat( parseFloat(unspent) /  parseFloat(available))*100).toFixed(2);
			 }else{
				 data.per = 0;
			 }
			 lists.push(data);
			 });*/
			 $scope.DistrictToVillage =response.data;
			 $scope.loader = false;
		});
	}
	$scope.getBlock = function getBlock(upperlimit,lowerlimit,districtCode, districtName) {
		/*if($scope.stateTier != 'ZG') {*/
			$("#blockDiv").show();
			$scope.upperlimit=upperlimit;
			$scope.lowerlimit=lowerlimit;
			getBlockData(districtCode, districtName);
			
		/*} else {
			$scope.districtName = districtName;
			$scope.districtCode = districtCode;
			$("#villageDiv").show();
			$scope.getVillage(districtCode, districtName);
		}*/
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
		
		if($scope.stateTier == 'A' || $scope.stateTier == 'AB'){
			$scope.reportHeaderTitle = "BLOCK WISE RECEIPTS AND EXPENDITURES";
		}else if($scope.stateTier == 'ZG' || $scope.stateTier == 'IG'){
			$scope.reportHeaderTitle = "VILLAGE WISE RECEIPTS AND EXPENDITURES";
		}
		$scope.type = 'B';
		
		$("#mainDiv").hide();
		$("#districtDiv").hide();
		$("#districtDivInd").hide();
		$("#stateListDiv").hide();
		$("#stateDrillListDiv").hide();
		$("#blockDiv").show();
		$("#villageDiv").hide();
		$("#districtToVillageDiv").hide();
		$("#districtHidden").val($scope.districtCode);
		percentageExpenditureReportService.generateBlock($scope.finYear, $scope.stateCode, $scope.schemeUid, districtCode,$scope.reptype,$scope.upperlimit,$scope.lowerlimit).then(function(response){
			
			 var lists = new Array();
			 angular.forEach(response.data, function(obj, key) {
				 var data = new list();
			data.code= obj.code;
			data.name=obj.name;
			 var available =  parseFloat(((parseFloat(obj.ob_amount)) + (parseFloat(obj.receipt_amount)) )).toFixed(2);
			 var unspent =  parseFloat(((parseFloat(obj.ob_amount)) + (parseFloat(obj.receipt_amount)) - (parseFloat(obj.payment_amount)))).toFixed(2);
			 if(available>0){
			 data.per =    parseFloat(parseFloat( parseFloat(unspent) /  parseFloat(available))*100).toFixed(2);
			 }else{
				 data.per = 0;
			 }
			 lists.push(data);
			 });
			 $scope.BlockList =lists;
			 $scope.loader = false;
		});
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
		$scope.sum_zero_to_tw = 0;
		$scope.sum_tw_one_th = 0;
		$scope.sum_th_one_fh = 0;
		$scope.sum_fh_one_fth = 0;
		$scope.sum_fth_one_si = 0;
		$scope.sum_si_one_above = 0;
		$scope.reportHeaderTitle = "VILLAGE WISE RECEIPTS AND EXPENDITURES";
		$scope.type = 'V';
		
		$("#mainDiv").hide();
		$("#stateListDiv").hide();
		$("#stateDrillListDiv").hide();
		$("#districtDiv").hide();
		$("#districtDivInd").hide();
		$("#blockDiv").hide();
		$("#villageDiv").show();
		$("#districtToVillageDiv").hide();
		$("#blockHidden").val($scope.blockCode);
		percentageExpenditureReportService.generateVillage($scope.finYear, $scope.stateCode, $scope.schemeUid, districtCode, $scope.blockCode,$scope.upperlimit,$scope.lowerlimit).then(function(response){
			
			 var lists = new Array();
			 angular.forEach(response.data, function(obj, key) {
				 var data = new list();
			data.code= obj.code;
			data.name=obj.name;
			 var available =  parseFloat(((parseFloat(obj.ob_amount)) + (parseFloat(obj.receipt_amount)) )).toFixed(2);
			 var unspent =  parseFloat(((parseFloat(obj.ob_amount)) + (parseFloat(obj.receipt_amount)) - (parseFloat(obj.payment_amount)))).toFixed(2);
			 if(available>0){
			 data.per =    parseFloat(parseFloat( parseFloat(unspent) /  parseFloat(available))*100).toFixed(2);
			 }else{
				 data.per = 0;
			 }
			 lists.push(data);
			 });
			 $scope.VillageList =lists;
			 $scope.loader = false;
		});
	}
	
$scope.onBack = function onBack(type) {
		
		if(type == 'D') {
			$scope.type = 'MAIN';
			$("#mainDiv").show();
			$("#stateListDiv").hide();
			$("#stateDrillListDiv").hide();
			$("#districtDiv").hide();
			$("#districtDivInd").hide();
			$("#blockDiv").hide();
			$("#districtToVillageDiv").hide();
			$("#villageDiv").hide();
			$scope.clearSelections();
			
		} else if(type == 'V'){
			$("#mainDiv").hide();
			$("#stateListDiv").hide();
			$("#stateDrillListDiv").hide();
			$("#districtDiv").hide();
			$("#districtDivInd").hide();
			$("#districtToVillageDiv").hide();
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
			$("#districtToVillageDiv").hide();
			$("#districtDiv").show();
			$("#blockDiv").hide();
			$("#villageDiv").hide();
			$scope.blockCode = null;
			$scope.blockName = null;
			$scope.districtCode = null;
			$scope.districtName = null;
			$scope.upperlimit=0;
			$scope.lowerlimit=0;
			getDistrictData();
			
		}else if(type == 'SD'){
			$scope.type = 'S';
			$("#mainDiv").hide();
			$("#stateListDiv").show();
			$("#stateDrillListDiv").hide();
			$("#districtToVillageDiv").hide();
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
			$("#districtToVillageDiv").hide();
			$("#districtDiv").hide();
			$("#districtDivInd").hide();
			$("#blockDiv").hide();
			$("#villageDiv").hide();
			$scope.clearSelections();
		}
	}
	

	
}]);





