var beneficiaryDashboardModule = angular.module('beneficiaryDashboardModule', ['datatables']);
beneficiaryDashboardModule.controller("beneficiaryDashboardController", ['$scope', "beneficiaryDashboardService",'DTOptionsBuilder', 'DTColumnDefBuilder',
 function($scope, beneficiaryDashboardService, DTOptionsBuilder, DTColumnDefBuilder) {
	
	$scope.dtOptions = DTOptionsBuilder.newOptions()
    .withOption('order', [2,'asc']);
	
	$("#selectionDiv").show();
	$scope.type="M";
	$scope.getSchemeList = function getSchemeList() {
		$scope.schemeList = {};
		$scope.schemeCd= null;
		$scope.kpiZp = 0;
		$scope.kpiBp = 0;
		$scope.kpiVp = 0;
		$scope.kpiDistrict = 0;
		$scope.kpiSubDistrict = 0;
		$scope.kpiVillage = 0;
		$("#LandRegionDiv").hide();
		$("#PanchayatDiv").hide();
		
		$scope.planYear = $("#planYear").val();
		beneficiaryDashboardService.getSchemeList($scope.planYear).then(function(response) {
			$scope.schemeList = response.data;
		});
	}	
	
	
	$scope.onSchemeChange  = function onSchemeChange(scheme) {
		$scope.scheme = scheme;
		$scope.schemeCode = scheme.split("-")[0];
		$scope.flag = scheme.split("-")[1];
		$scope.ministry = scheme.split("-")[2];
		$scope.planYr = $("#planYear option:selected").text();
		$scope.schemeName = $("#schemeCd option:selected").text();
		if($scope.flag==251){
			$("#LandRegionDiv").hide();
			$("#PanchayatDiv").show();
		}else{
			$("#LandRegionDiv").show();
			$("#PanchayatDiv").hide();
		}
		beneficiaryDashboardService.getBeneficiaryKpi($scope.planYear,$scope.schemeCode).then(function(response) {
			$scope.kpi = response.data;
			$scope.kpiZp = response.data[0].count;
			$scope.kpiBp = response.data[1].count;
			$scope.kpiVp = response.data[2].count;
			$scope.kpiDistrict = response.data[3].count;
			$scope.kpiSubDistrict = response.data[4].count;
			$scope.kpiVillage = response.data[5].count;
		});
	}
	
	$scope.getStateData = function getStateData(localBodyTypeCd){
		$scope.localBodyTypeCd = localBodyTypeCd;
		$scope.data = {};
		$scope.totalCount = 0;
		$("#selectionDiv").hide();
		$("#reportDiv").show();
		$("#reportDivHeader").show();
		$("#stateDiv").show();
		$("#zpDiv").hide();
		$("#bpDiv").hide();
		$("#vpDiv").hide();
		$("#leafDiv").hide();
		$scope.type="S";
		$scope.loader = true;
		beneficiaryDashboardService.getPanchayatStateData($scope.planYear, $scope.schemeCode, $scope.localBodyTypeCd).then(function(response) {
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
		beneficiaryDashboardService.getPanchayatZpData($scope.planYear, $scope.schemeCode, $scope.localBodyTypeCd,$scope.stateCd).then(function(response) {
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
		if($scope.localBodyTypeCd==1 || $scope.localBodyTypeCd==2 || $scope.localBodyTypeCd==3){
			if($scope.stateCd==14 || $scope.stateCd==30 || $scope.stateCd==31 || $scope.stateCd==38 || $scope.stateCd==12 || $scope.stateCd==17 || $scope.stateCd==34){
				$("#vpDiv").show();
			}else{
				$("#bpDiv").show();
			}
		}else{
			$("#bpDiv").show();
		}
		$scope.type="B";
		$scope.loader = true;
		beneficiaryDashboardService.getPanchayatBpData($scope.planYear, $scope.schemeCode, $scope.localBodyTypeCd,$scope.stateCd,$scope.zpCode).then(function(response) {
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
		beneficiaryDashboardService.getPanchayatVpData($scope.planYear, $scope.schemeCode, $scope.localBodyTypeCd,$scope.stateCd,$scope.bpCode).then(function(response) {
			$scope.data = response.data;
			angular.forEach($scope.data, function(obj, key) {
				$scope.totalCount = $scope.totalCount + obj.count;
			});	
			$scope.loader = false;
		});
	}
	
	$scope.getData = function getData(code,name){
		if($scope.localBodyTypeCd == 1 || $scope.localBodyTypeCd == 4){
			$scope.zpName = name;
		}else if($scope.localBodyTypeCd == 2 || $scope.localBodyTypeCd == 5){
			$scope.bpName = name;
		}else if($scope.localBodyTypeCd == 3 || $scope.localBodyTypeCd == 6){
			$scope.vpName = name;
		}
		$scope.data = {};
		$("#stateDiv").hide();
		$("#zpDiv").hide();
		$("#bpDiv").hide();
		$("#vpDiv").hide();
		$("#leafDiv").show();
		$scope.type="D";
		$scope.loader = true;
		beneficiaryDashboardService.getBeneficiaryData($scope.planYear, $scope.schemeCode, $scope.localBodyTypeCd,$scope.stateCd,code).then(function(response) {
			$scope.data = response.data;
			angular.forEach($scope.data, function(obj, key) {
				$scope.totalCount = $scope.totalCount + obj.count;
			});	
			$scope.loader = false;
		});
	}
	
	$scope.onBack = function onBack(type){
		if(type=='G'){
			$scope.bpCode = 0;
			$scope.bpName = null;
			$scope.getBpData($scope.zpCode,$scope.zpName);
		}else if(type=='B'){
			$scope.zpCode = 0;
			$scope.zpName = null;
			$scope.getZpData($scope.stateCd,$scope.stateName);
		}else if(type=='Z'){
			$scope.stateCd = 0;
			$scope.stateName = null;
			$scope.getStateData($scope.localBodyTypeCd);
		}else if(type=='S'){
			$("#selectionDiv").show();
			$("#reportDiv").hide();
			$("#reportDivHeader").hide();
			$scope.stateCd = 0;
			$scope.stateName = null;
			$scope.onSchemeChange($scope.scheme);
		}else if(type=='D'){
			if($scope.localBodyTypeCd == 1 || $scope.localBodyTypeCd == 4){
				$scope.zpCode = 0;
				$scope.zpName = null;
				$scope.getZpData($scope.stateCd,$scope.stateName);
			}else if($scope.localBodyTypeCd == 2 || $scope.localBodyTypeCd == 5){
				if($scope.stateCd==17 || $scope.stateCd==34){
					$scope.zpCode = 0;
					$scope.zpName = null;
					$scope.getZpData($scope.stateCd,$scope.stateName);
				}else{
					$scope.bpCode = 0;
					$scope.bpName = null;
					$scope.getBpData($scope.zpCode,$scope.zpName);
				}
				
			}else if($scope.localBodyTypeCd == 3 || $scope.localBodyTypeCd == 6){
				if($scope.stateCd==13 || $scope.stateCd==15){
					$scope.zpCode = 0;
					$scope.zpName = null;
					$scope.getZpData($scope.stateCd,$scope.stateName);
					
				}else if($scope.stateCd==14 || $scope.stateCd==30 || $scope.stateCd==31 || $scope.stateCd==38 || $scope.stateCd==12){
					$scope.bpCode = 0;
					$scope.bpName = null;
					$scope.getBpData($scope.zpCode,$scope.zpName);
				}else if ($scope.stateCd==17 || $scope.stateCd==34){
					$scope.vpName = null;
					$scope.getBpData($scope.bpCode,$scope.bpName);
				}else{
					$scope.vpName = null;
					$scope.getVpData($scope.bpCode,$scope.bpName);
				}
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





