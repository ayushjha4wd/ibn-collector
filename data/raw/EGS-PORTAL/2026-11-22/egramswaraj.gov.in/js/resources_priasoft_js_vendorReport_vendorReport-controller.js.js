var vendorReportModule = angular.module('vendorReportModule', ['angular.filter']);
vendorReportModule.controller("vendorReportController", ['$scope', "vendorReportService", function($scope, vendorReportService) {
	$("#stateCode_error").hide();
	$scope.list = {};
	$scope.countList = {};
	$scope.stateCode = "0";
	$scope.stateName = null;
	$scope.districtCode = null;
	$scope.districtName = null;
	$scope.blockName = null;
	$scope.blockCode = null;
	$scope.finYear = null;
	
	
	function getStateTier(stateCode){
		$scope.stateTier = null;
		vendorReportService.getStateTier(stateCode).then(function(response){
			$scope.stateTier = response.data;
		});
	}
	
	$scope.showReportType = function showReportType(reportType){
		$scope.reportType = reportType;
	}
	
	$scope.showHideDiv = function showHideDiv(stateCode){
		$("#reportTypeDiv").show();
		getStateTier(stateCode);
		
	}
	
	$scope.getDistrictData = function getDistrictData() {
		var stateCode = $('#StateId').val();
		var stateName = $("#StateId option:selected").text();
		var finYear = $("#finYear").val();
		var captchaVal = $("#captchaAnswer").val();
		$('.errored').hide();
		var error = false;
		if ((finYear == null || finYear == 0 || finYear == "")) {
			$("#finYear_error").show();
			error = true;
		} 
		if ((stateCode == null || stateCode == 0 || stateCode == "")) {
			$("#stateCode_error").show();
			error = true;
		}
		if(captchaVal == null || captchaVal == ""){
			$("#captchaAnswer_error").show();
			error = true;
		} else if(!error){
			$('.errored').hide();
			var status = validateCaptcha(captchaVal);
			if(status) {
				refreshCaptcha();
				getData(stateCode,stateName,finYear);
			} else {
				$("#captchaAnswer_error1").show();
				refreshCaptcha();
			}
		}
	}
	
	function getData(stateCode,stateName,finYear){
		$("#stateDiv").hide();
		$("#district").hide();
		$("#block").hide();
		$("#village").hide();
		$("#zpDiv").hide();
		$("#bpDiv").hide();
		$("#reportTypeDiv").hide();
		$scope.stateCode = stateCode;
		$scope.stateName = stateName;
		$scope.finYear = finYear;
		$scope.stateTier = null;
		vendorReportService.getStateTier(stateCode).then(function(response){
			$scope.stateTier = response.data;
			if($scope.reportType == 'V'){
				if(($scope.stateTier == 'A' && stateCode!=17) || $scope.stateTier == 'AB' || $scope.stateTier == 'ZG') {
					$("#district").show();
					$("#block").hide();
					getDistrictDetails(stateCode, finYear);
				} else if($scope.stateTier == 'IG' || ($scope.stateTier == 'A' && stateCode==17)) {
					$("#district").hide();
					$("#block").show();
					getDistrictDetails(stateCode, finYear);
				} else {
					$("#district").hide();
					$("#block").hide();
					$("#village").show();
					getDistrictDetails(stateCode, finYear);
				}
			}else if($scope.reportType == 'B'){
				$("#bpDiv").show();
				getBpDetails(stateCode, finYear);
			}else if($scope.reportType == 'Z'){
				$("#zpDiv").show();
				getZpDetails(stateCode, finYear);
			}
			$("#close").show();
		});
		
	}
	
	function getZpDetails(stateCode, finYear) {
		$scope.list = {};
		$scope.countList = {};
		$scope.loader = true;
		vendorReportService.getZpData(stateCode, finYear).then(function(response) {
			 var districtDetail = new Array();
			 var sum =  new sumCount();
			 angular.forEach(response.data, function(obj, key) {
				
				 var district = new districtDetails();
				 district.code = obj.code; 
				 district.name = obj.name;
				 district.totalVill = obj.totalVill;
				 district.totalPriVendor = obj.totalPriVendor;
				 district.initiateVendor = obj.initiateVendor;
				 district.approvedVendor = obj.approvedVendor;
				 district.rejectedVendor = obj.rejectedVendor;
				 district.pendingVendor = obj.pendingVendor;
				 
				 districtDetail.push(district);
				 
				 sum.sumTotalVill = sum.sumTotalVill + obj.totalVill;	
				 sum.sumTotalPriVendor = sum.sumTotalPriVendor + obj.totalPriVendor;
				 sum.sumInitiateVendor = sum.sumInitiateVendor + obj.initiateVendor;
				 sum.sumApprovedVendor = sum.sumApprovedVendor + obj.approvedVendor;
				 sum.sumRejectedVendor = sum.sumRejectedVendor + obj.rejectedVendor;
				 sum.sumPendingVendor = sum.sumPendingVendor + obj.pendingVendor;
			 });
			 $scope.list = districtDetail;
			 $scope.countList = sum;
			 $scope.loader = false;
		});
	}
	
	function getBpDetails(stateCode, finYear) {
		$scope.list = {};
		$scope.countList = {};
		$scope.loader = true;
		vendorReportService.getBpData(stateCode, finYear).then(function(response) {
			 var districtDetail = new Array();
			 var sum =  new sumCount();
			 angular.forEach(response.data, function(obj, key) {
				
				 var district = new blockDetails();
				 district.code = obj.code; 
				 district.name = obj.name;
				 district.parent_local_body_code = obj.parent_local_body_code;
				 district.parent_local_body_name_english = obj.parent_local_body_name_english;
				 district.totalVill = obj.totalVill;
				 district.totalPriVendor = obj.totalPriVendor;
				 district.initiateVendor = obj.initiateVendor;
				 district.approvedVendor = obj.approvedVendor;
				 district.rejectedVendor = obj.rejectedVendor;
				 district.pendingVendor = obj.pendingVendor;
				 
				 districtDetail.push(district);
				 
				 sum.sumTotalVill = sum.sumTotalVill + obj.totalVill;	
				 sum.sumTotalPriVendor = sum.sumTotalPriVendor + obj.totalPriVendor;
				 sum.sumInitiateVendor = sum.sumInitiateVendor + obj.initiateVendor;
				 sum.sumApprovedVendor = sum.sumApprovedVendor + obj.approvedVendor;
				 sum.sumRejectedVendor = sum.sumRejectedVendor + obj.rejectedVendor;
				 sum.sumPendingVendor = sum.sumPendingVendor + obj.pendingVendor;
			 });
			 $scope.list = districtDetail;
			 $scope.countList = sum;
			 $scope.loader = false;
		});
	}
		function getDistrictDetails(stateCode, finYear) {
			$scope.list = {};
			$scope.countList = {};
			$scope.loader = true;
			vendorReportService.getDistrictData(stateCode, finYear).then(function(response) {
				 var districtDetail = new Array();
				 var sum =  new sumCount();
				 angular.forEach(response.data, function(obj, key) {
					
					 var district = new districtDetails();
					 district.code = obj.code; 
					 district.name = obj.name;
					 district.totalVill = obj.totalVill;
					 district.totalPriVendor = obj.totalPriVendor;
					 district.initiateVendor = obj.initiateVendor;
					 district.approvedVendor = obj.approvedVendor;
					 district.rejectedVendor = obj.rejectedVendor;
					 district.pendingVendor = obj.pendingVendor;
					 
					 districtDetail.push(district);
					 
					 sum.sumTotalVill = sum.sumTotalVill + obj.totalVill;	
					 sum.sumTotalPriVendor = sum.sumTotalPriVendor + obj.totalPriVendor;
					 sum.sumInitiateVendor = sum.sumInitiateVendor + obj.initiateVendor;
					 sum.sumApprovedVendor = sum.sumApprovedVendor + obj.approvedVendor;
					 sum.sumRejectedVendor = sum.sumRejectedVendor + obj.rejectedVendor;
					 sum.sumPendingVendor = sum.sumPendingVendor + obj.pendingVendor;
				 });
				 $scope.list = districtDetail;
				 $scope.countList = sum;
				 $scope.loader = false;
			});
		}
		
		$scope.getBlock =  function getBlock(districtCode, districtName) {
			$("#district").hide();
			$("#block").hide();
			$("#village").hide();
			$scope.districtCode = districtCode;
			$scope.districtName = districtName;
			if($scope.stateCode != 11 && $scope.stateCode != 14 && $scope.stateCode != 25 && $scope.stateCode != 26 
					&& $scope.stateCode != 30 && $scope.stateCode != 31 && $scope.stateCode != 38) {
				$("#block").show();
				getBlockData(districtCode);
			} else {
				$("#village").show();
				getVillageData(districtCode);
			}
		}
		
		function getBlockData(districtCode) {
			$scope.countList = {};
			$scope.list = {};
			$scope.loader = true;
			vendorReportService.getBlockData($scope.stateCode, districtCode, $scope.finYear).then(function(response) {
				 var blockDetail = new Array();
				 var sum =  new sumCount();
				 angular.forEach(response.data, function(obj, key) {
					 var block = new districtDetails();
						block.code = obj.code; 
						block.name = obj.name;
						block.totalVill = obj.totalVill;
						block.totalPriVendor = obj.totalPriVendor;
						block.initiateVendor = obj.initiateVendor;
						block.approvedVendor = obj.approvedVendor;
						block.rejectedVendor = obj.rejectedVendor;
						block.pendingVendor = obj.pendingVendor;
						
						blockDetail.push(block);
					 
					 sum.sumTotalVill = sum.sumTotalVill + obj.totalVill;	
					 sum.sumTotalPriVendor = sum.sumTotalPriVendor + obj.totalPriVendor;
					 sum.sumInitiateVendor = sum.sumInitiateVendor + obj.initiateVendor;
					 sum.sumApprovedVendor = sum.sumApprovedVendor + obj.approvedVendor;
					 sum.sumRejectedVendor = sum.sumRejectedVendor + obj.rejectedVendor;
					 sum.sumPendingVendor = sum.sumPendingVendor + obj.pendingVendor;
				 });
				 $scope.list = blockDetail;
				 $scope.countList = sum;
				 $scope.loader = false;
			});
		}
		
		
		$scope.getVillage =  function getVillage(blockCode, blockName) {
			$("#district").hide();
			$("#block").hide();
			$("#village").show();
			$scope.blockCode = blockCode;
			$scope.blockName = blockName;
			getVillageData(blockCode);
		}
		
		function getVillageData(blockCode) {
			$scope.countList = {};
			$scope.list = {};
			$scope.loader = true;
			vendorReportService.getVillageData($scope.stateCode, blockCode, $scope.finYear).then(function(response) {
				 var villageDetail = new Array();
				 var sum =  new sumCount();
				 angular.forEach(response.data, function(obj, key) {
					
					 var village = new districtDetails();
						village.code = obj.code; 
						village.name = obj.name;
						village.initiateVendor = obj.initiateVendor;
						village.approvedVendor = obj.approvedVendor;
						village.rejectedVendor = obj.rejectedVendor;
						village.pendingVendor = obj.pendingVendor;
						
						villageDetail.push(village);
					
						 sum.sumInitiateVendor = sum.sumInitiateVendor + obj.initiateVendor;
						 sum.sumApprovedVendor = sum.sumApprovedVendor + obj.approvedVendor;
						 sum.sumRejectedVendor = sum.sumRejectedVendor + obj.rejectedVendor;
						 sum.sumPendingVendor = sum.sumPendingVendor + obj.pendingVendor;
					 });
					 $scope.list = villageDetail;
					 $scope.countList = sum;
					 $scope.loader = false;
				 });
		}
		
		$scope.getVendor =  function getVendor(villageCode, villageName) {
			$("#district").hide();
			$("#block").hide();
			$("#village").hide();
			$("#vendor").show();
			$scope.villageCode = villageCode;
			$scope.villageName = villageName;
			getVendorData(villageCode);
		}
		
		function getVendorData(villageCode) {
			$scope.countList = {};
			$scope.list = {};
			$scope.loader = true;
			vendorReportService.getVendorData($scope.stateCode, villageCode).then(function(response) {
					$scope.list = response.data;
					 $scope.loader = false;
				 });
		}
	
	$scope.onBack = function onBack(type) {
		if(type == 'D') {
			 if($scope.stateTier != 'IG'){
				$("#block").hide();
				$("#village").hide();
				$("#district").show();
				$scope.districtCode = null;
				$scope.districtName = null;
				getDistrictDetails($scope.stateCode, $scope.finYear);
			 }else{
				 $("#stateDiv").show();
				$("#block").hide();
				$("#village").hide();
				$("#district").hide();
				$scope.stateCode = "0";
				$scope.stateName = null;
			 }
		}else if(type == 'B') {
			if($scope.stateTier == 'A' || $scope.stateTier == 'AB') {
				$("#block").show();
				$("#village").hide();
				$("#district").hide();
				$scope.blockCode = null;
				$scope.blockName = null;
				getBlockData($scope.districtCode);
			} else if($scope.stateTier == 'ZG') {
				$("#block").hide();
				$("#village").hide();
				$("#district").show();
				$scope.districtCode = null;
				$scope.districtName = null;
				getDistrictDetails($scope.stateCode, $scope.finYear);
			}else if($scope.stateTier == 'GP'){
				$("#stateDiv").show();
				$("#block").hide();
				$("#village").hide();
				$("#district").hide();
				$scope.stateCode = "0";
				$scope.stateName = null;
			}else if($scope.stateTier == 'IG'){
				$("#stateDiv").hide();
				$("#block").show();
				$("#village").hide();
				$("#district").hide();
				$scope.blockCode = null;
				$scope.blockName = null;
				getDistrictDetails($scope.stateCode, $scope.finYear);
			}
		}else if(type == 'V'){
			$("#block").hide();
			$("#village").show();
			$("#district").hide();
			$("#vendor").hide();
			$scope.villageCode = null;
			$scope.villageName = null;
			if($scope.stateCode != 11 && $scope.stateCode != 14 && $scope.stateCode != 25 && $scope.stateCode != 26 
					&& $scope.stateCode != 30 && $scope.stateCode != 31 && $scope.stateCode != 38) {
				getVillageData($scope.blockCode);
			}else{
				getVillageData($scope.districtCode);
			}
		}else {
			$("#stateDiv").show();
			$("#block").hide();
			$("#village").hide();
			$("#district").hide();
			$("#zpDiv").hide();
			$("#bpDiv").hide();
			$scope.stateCode = "0";
			$scope.stateName = null;
			$scope.finYear = null;
		}
	}
	
	$scope.exportFile = function exportFile(id) {
		$("#" + id).excelexportjs({
			containerid : id,
			datatype : 'table',
			worksheetName : "Vendor Registration & Status Report",
			returnUri: false
		});
	}
}]);





