var noeReportModule = angular.module('noeReportModule', ['angular.filter']);
noeReportModule.controller("noeReportController", ['$scope', "noeReportService", function($scope, noeReportService) {
	$scope.stateCode = null;
	$scope.stateName = null;
	$scope.entityType = null;
	$scope.entityCode = null;
	$scope.vpName = null;
	$scope.bpName = null;
	$scope.zpName= null;
	$scope.finYear = $("#finYear").val();
	$scope.details = {};
	$scope.ZpDetails = {};
	$scope.ZpSchemeDetails = {};
	$scope.BpDetails = {};
	$scope.BpSchemeDetails = {};
	$scope.VpDetails = {};
	$scope.VpSchemeDetails = {};
	$scope.type = 'S';
	$scope.loader = true;
	getStateData($scope.finYear);
	
	function getStateData(finYear) {
		$scope.loader = true;
		$scope.type = 'S';
		$scope.sumTotalZpNOE = 0;
		$scope.sumTotalBpNOE = 0;
		$scope.sumTotalVpNOE = 0;
		$scope.details ={};
		noeReportService.getStateData(finYear).then(function(response) {
			$scope.details = response.data;
			angular.forEach(response.data, function(obj, key) {
				$scope.sumTotalZpNOE  = $scope.sumTotalZpNOE + obj.totalZpNOE;
				$scope.sumTotalBpNOE  = $scope.sumTotalBpNOE  + obj.totalBpNOE;
				$scope.sumTotalVpNOE  = $scope.sumTotalVpNOE  + obj.totalVpNOE;
			});	
			$scope.loader = false;
		});
	}
	
	
	$scope.getZpDetails = function getZpDetails(stateCode, stateName, entityType) {
		$("#ZpDiv").show();
		$("#state").hide();
		$scope.stateCode = stateCode;
		$scope.stateName = stateName;
		$scope.entityType = entityType;
		getZpData(stateCode, entityType);
	}
	
	function getZpData(stateCode, entityType) {
		$scope.ZpDetails = {};
		$scope.loader = true;
		$scope.type = 'ZP';
		noeReportService.getZpData($scope.finYear, $scope.stateCode, entityType).then(function(response) {
			$scope.ZpDetails = response.data;
			$scope.loader = false;
		});
	}
	
	$scope.getBpDetails = function getBpDetails(stateCode, stateName, entityType) {
		$("#BpDiv").show();
		$("#state").hide();
		$scope.stateCode = stateCode;
		$scope.stateName = stateName;
		$scope.entityType= entityType;
		getBpData(stateCode, entityType);
	}
	
	function getBpData(stateCode, entityType) {
		$scope.BpDetails = {};
		$scope.loader = true;
		$scope.type = 'BP';
		noeReportService.getBpData($scope.finYear,$scope.stateCode, entityType).then(function(response) {
			$scope.BpDetails = response.data;
			$scope.loader = false;
		});
	}
	
	$scope.getVpDetails = function getVpDetails(stateCode, stateName, entityType) {
		$("#VpDiv").show();
		$("#state").hide();
		$scope.stateCode = stateCode;
		$scope.stateName = stateName;
		$scope.entityType= entityType;
		getVpData(stateCode, entityType);
	}
	
	function getVpData(stateCode, entityType) {
		$scope.VpDetails = {};
		$scope.loader = true;
		$scope.type = 'VP';
		noeReportService.getVpData($scope.finYear, $scope.stateCode, entityType).then(function(response) {
			$scope.VpDetails = response.data;
			$scope.loader = false;
		});
	}
	
	$scope.getZpSchemeDetails = function getZpSchemeDetails(entityCode, zpName, bpName, vpName) {
		$("#ZpSchemeDiv").show();
		$("#ZpDiv").hide();
		$("#state").hide();
		$scope.entityCode= entityCode;
		$scope.vpName = vpName;
		$scope.bpName = bpName;
		$scope.zpName= zpName
		getZpSchemeData( entityCode);
	}
	
	function getZpSchemeData( entityCode) {
		$scope.loader = true;
		$scope.type = 'ZPS';
		noeReportService.getZpSchemeData($scope.finYear, $scope.stateCode, entityCode).then(function(response) {
			$scope.ZpSchemeDetails = response.data;
			$scope.loader = false;
		});
	}
	
	$scope.getBpSchemeDetails = function getBpSchemeDetails( entityCode, zpName, bpName) {
		$("#BpSchemeDiv").show();
		$("#BpDiv").hide();
		$("#state").hide();
		$scope.entityCode= entityCode;
		$scope.bpName = bpName;
		$scope.zpName= zpName
		getBpSchemeData( entityCode);
	}
	
	function getBpSchemeData( entityCode) {
		$scope.loader = true;
		$scope.type = 'BPS';
		noeReportService.getBpSchemeData($scope.finYear, $scope.stateCode, entityCode).then(function(response) {
			$scope.BpSchemeDetails = response.data;
			$scope.loader = false;
		});
	}
	
	$scope.getVpSchemeDetails = function getVpSchemeDetails( entityCode, zpName) {
		$("#VpSchemeDiv").show();
		$("#VpDiv").hide();
		$("#state").hide();
		$scope.entityCode= entityCode;
		$scope.zpName= zpName
		getVpSchemeData( entityCode);
	}
	
	function getVpSchemeData( entityCode) {
		$scope.loader = true;
		$scope.type = 'VPS';
		noeReportService.getVpSchemeData($scope.finYear, $scope.stateCode, entityCode).then(function(response) {
			$scope.VpSchemeDetails = response.data;
			$scope.loader = false;
		});
	}
	
	
	$scope.onBack = function onBack(type) {
		
		if(type == 'ZP') {
			$scope.type = 'S';
			$scope.stateCode = null;
			$scope.stateName = null;
			$scope.entityType = null;
			$scope.entityCode = null;
			$scope.vpName = null;
			$scope.bpName = null;
			$scope.zpName= null;
			$("#state").show();
			$("#ZpDiv").hide();
			getStateData($scope.finYear);
		}
		
		if(type == 'BP') {
			$scope.type = 'S';
			$scope.stateCode = null;
			$scope.stateName = null;
			$scope.entityType = null;
			$scope.entityCode = null;
			$scope.vpName = null;
			$scope.bpName = null;
			$scope.zpName= null;
			$("#state").show();
			$("#BpDiv").hide();
			getStateData($scope.finYear);
		}
		
		if(type == 'VP') {
			$scope.type = 'S';
			$scope.stateCode = null;
			$scope.stateName = null;
			$scope.entityType = null;
			$scope.entityCode = null;
			$scope.vpName = null;
			$scope.bpName = null;
			$scope.zpName= null;
			$("#state").show();
			$("#VpDiv").hide();
			getStateData($scope.finYear);
		}
		
		if(type == 'ZPS') {
			$scope.type = 'ZP';
		/*	$scope.stateCode = null;
			$scope.stateName = null;
			$scope.entityType = null;*/
			$scope.entityCode = null;
			$scope.vpName = null;
			$scope.bpName = null;
			$scope.zpName= null;
			$("#state").hide();
			$("#ZpDiv").show();
			$("#ZpSchemeDiv").hide();
			getZpData($scope.stateCode, $scope.entityType);
		}
		
		if(type == 'BPS') {
			$scope.type = 'BP';
		/*	$scope.stateCode = null;
			$scope.stateName = null;
			$scope.entityType = null;*/
			$scope.entityCode = null;
			$scope.vpName = null;
			$scope.bpName = null;
			$scope.zpName= null;
			$("#state").hide();
			$("#BpDiv").show();
			$("#BpSchemeDiv").hide();
			getBpData($scope.stateCode, $scope.entityType);
		}
		
		if(type == 'VPS') {
			$scope.type = 'VP';
		/*	$scope.stateCode = null;
			$scope.stateName = null;
			$scope.entityType = null;*/
			$scope.entityCode = null;
			$scope.vpName = null;
			$scope.bpName = null;
			$scope.zpName= null;
			$("#state").hide();
			$("#VpDiv").show();
			$("#VpSchemeDiv").hide();
			getVpData($scope.stateCode, $scope.entityType);
		}
	}

	
$scope.exportFile = function exportFile(id) {
		
		$("#" + id).excelexportjs({
			containerid : id,
			datatype : 'table',
			worksheetName : "Note Of Error Report",
		});
	}
}]);





