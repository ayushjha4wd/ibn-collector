var assetReportModule = angular.module('assetReportModule',['datatables']);
assetReportModule.controller("assetReportController", ['$scope', "assetReportService",
 function($scope, assetReportService) {
	$("#reportDiv").hide();
	
	$scope.onStateChange = function onStateChange() {
		$("#reportDiv").hide();
		$scope.districtList = {};
		$scope.stateCode = $("#stateCode").val();
		assetReportService.getDistrictList($scope.stateCode).then(function(response) {
			$scope.districtList = response.data;
		});
	}	
	
	
	$scope.onDistrictChange  = function onDistrictChange(districtCode) {
		$scope.districtCode = districtCode;
		$scope.stateName = $("#stateCode option:selected").text();
		$scope.districtName = $("#districtCode option:selected").text();
		$("#reportDiv").show();
		assetReportService.getAssetData($scope.stateCode,$scope.districtCode).then(function(response) {
			$scope.data = response.data;
		});
	}
	

	$scope.exportFile = function exportFile(id) {
		
		$("#" + id).excelexportjs({
			containerid : id,
			datatype : 'table',
			worksheetName : "Beneficiary",
			returnUri: false
		});
    }
}]);





