var schoolAssetStatusModule = angular.module('schoolAssetStatusModule', ['datatables']);
schoolAssetStatusModule.controller("schoolAssetStatusController", ['$scope', "schoolAssetStatusService",'DTOptionsBuilder', 'DTColumnDefBuilder',
 function($scope, schoolAssetStatusService, DTOptionsBuilder, DTColumnDefBuilder) {

	$scope.dtOptions = DTOptionsBuilder.newOptions()
    .withOption('order', [2,'asc']);
	
	getStateData();
	
	function getStateData(){
		$scope.data = {};
		$scope.totalCount = 0;
		$("#stateDiv").show();
		$("#zpDiv").hide();
		$("#bpDiv").hide();
		$("#vpDiv").hide();
		$("#leafDiv").hide();
		$scope.type="S";
		$scope.loader = true;
		schoolAssetStatusService.getStateData().then(function(response) {
			$scope.data = response.data;
			angular.forEach($scope.data, function(obj, key) {
				$scope.totalCount = $scope.totalCount + obj.count;
			});	
			$scope.loader = false;
		});
	}
	
	$scope.getZpData = function getZpData(stateCd,stateName){
		$scope.stateCd = stateCd;
		$scope.stateName = stateName;
		$scope.data = {};
		$scope.totalCount = 0;
		
		$("#stateDiv").hide();
		$("#zpDiv").hide();
		$("#bpDiv").hide();
		$("#vpDiv").hide();
		$("#leafDiv").hide();
		if($scope.stateCd==13 || $scope.stateCd==15){
			$("#vpDiv").show();
		}else if($scope.stateCd==17 || $scope.stateCd==34){
			$("#bpDiv").show();
		}else{
			$("#zpDiv").show();
		}
		
		$scope.type="Z";
		$scope.loader = true;
		schoolAssetStatusService.getZpData($scope.stateCd).then(function(response) {
			$scope.data = response.data;
			angular.forEach($scope.data, function(obj, key) {
				$scope.totalCount = $scope.totalCount + obj.count;
			});	
			$scope.loader = false;
		});
	}
	
	$scope.getBpData = function getBpData(zpCode,zpName){
		$scope.zpCode = zpCode;
		if($scope.stateCd==17 || $scope.stateCd==34){
			$scope.bpName = zpName;
		}else{
			$scope.zpName = zpName;
		}
			
		$scope.data = {};
		$scope.totalCount = 0;
		$("#stateDiv").hide();
		$("#zpDiv").hide();
		$("#bpDiv").hide();
		$("#vpDiv").hide();
		$("#leafDiv").hide();
		
			if($scope.stateCd==14 || $scope.stateCd==30 || $scope.stateCd==31 || $scope.stateCd==38 || $scope.stateCd==12 || $scope.stateCd==17 || $scope.stateCd==34){
				$("#vpDiv").show();
			}else{
				$("#bpDiv").show();
			}
		
		$scope.type="B";
		$scope.loader = true;
		schoolAssetStatusService.getBpData($scope.stateCd,$scope.zpCode).then(function(response) {
			$scope.data = response.data;
			angular.forEach($scope.data, function(obj, key) {
				$scope.totalCount = $scope.totalCount + obj.count;
			});	
			$scope.loader = false;
		});
	}
	
	$scope.getVpData = function getVpData(bpCode,bpName){
		$scope.bpCode = bpCode;
		$scope.bpName = bpName;
		$scope.data = {};
		$scope.totalCount = 0;
		$("#stateDiv").hide();
		$("#zpDiv").hide();
		$("#bpDiv").hide();
		$("#vpDiv").show();
		$("#leafDiv").hide();
		$scope.type="G";
		$scope.loader = true;
		schoolAssetStatusService.getGpData($scope.stateCd,$scope.bpCode).then(function(response) {
			$scope.data = response.data;
			angular.forEach($scope.data, function(obj, key) {
				$scope.totalCount = $scope.totalCount + obj.count;
			});	
			$scope.loader = false;
		});
	}
	
	$scope.getData = function getData(code,name){
		$scope.vpName = name;
		$scope.vpcode = code;
		$scope.data = {};
		$("#stateDiv").hide();
		$("#zpDiv").hide();
		$("#bpDiv").hide();
		$("#vpDiv").hide();
		$("#leafDiv").show();
		$scope.type="L";
		$scope.loader = true;
		schoolAssetStatusService.getData($scope.stateCd,$scope.vpcode).then(function(response) {
			$scope.data = response.data;
			$scope.loader = false;
		});
		
	}
	
	$scope.onBack = function onBack(type){
		if(type=='G'){
			if($scope.stateCd==17 || $scope.stateCd==34){
				$scope.bpCode = 0;
				$scope.bpName = null;
				$scope.getZpData($scope.stateCd,$scope.stateName);
			}else{
				$scope.bpCode = 0;
				$scope.bpName = null;
				$scope.getBpData($scope.zpCode,$scope.zpName);
			}
		}else if(type=='B'){
			$scope.zpCode = 0;
			$scope.zpName = null;
			$scope.getZpData($scope.stateCd,$scope.stateName);
		}else if(type=='Z'){
			$scope.stateCd = 0;
			$scope.stateName = null;
			getStateData();
		}else if(type=='L'){
			$scope.vpcode = 0;
			$scope.vpName = null;
			if($scope.stateCd==14 || $scope.stateCd==30 || $scope.stateCd==31 || $scope.stateCd==38 || $scope.stateCd==12){
				$scope.getBpData($scope.zpCode,$scope.zpName);
				
			}else if($scope.stateCd==13 || $scope.stateCd==15){
				$scope.getZpData($scope.stateCd,$scope.stateName);
				
			}else{
				$scope.getVpData($scope.bpCode,$scope.bpName);
			}
			
		}
			
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





