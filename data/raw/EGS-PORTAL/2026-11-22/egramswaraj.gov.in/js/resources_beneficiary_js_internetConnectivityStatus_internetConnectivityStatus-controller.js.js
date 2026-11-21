var internetConnectivityStatusModule = angular.module('internetConnectivityStatusModule', ['datatables']);
internetConnectivityStatusModule.controller("internetConnectivityStatusController", ['$scope', "internetConnectivityStatusService",'DTOptionsBuilder', 'DTColumnDefBuilder',
 function($scope, internetConnectivityStatusService,  DTOptionsBuilder, DTColumnDefBuilder) {
	
	$scope.dtOptions = DTOptionsBuilder.newOptions().withOption('order', [2,'asc']);
	
	$("#selectionDiv").show();
	$("#PanchayatDiv").show();
	
	$scope.type="M";
	getKpiData();
	
	function getKpiData() {
		$("#PanchayatDiv").show();
		internetConnectivityStatusService.getInternetConnectivityStatusKpi().then(function(response) {
			$scope.kpi = response.data;
			$scope.kpiZp = $scope.kpi.zp;
			$scope.kpiBp = $scope.kpi.bp;
			$scope.kpiVp = $scope.kpi.gp;
		});
	}
	
	$scope.getStateData = function getStateData(localBodyTypeCd){
		$scope.localBodyTypeCd = localBodyTypeCd;
		$scope.data = {};
		$scope.totalCount = 0;
		$scope.lbCount = 0;
		
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
		internetConnectivityStatusService.getStateData($scope.localBodyTypeCd).then(function(response) {
			$scope.data = response.data;
			angular.forEach($scope.data, function(obj, key) {
				$scope.totalCount = $scope.totalCount + obj.count;
				$scope.lbCount = $scope.lbCount + obj.lbCount;
			});	
			$scope.loader = false;
		});
	}
	
	$scope.getZpData = function getZpData(stateCd,stateName){
		$scope.stateCd = stateCd;
		$scope.stateName = stateName;
		$scope.data = {};
		$scope.totalCount = 0;
		$scope.lbCount = 0;
		$scope.type="Z";
		
		$("#stateDiv").hide();
		$("#zpDiv").hide();
		$("#bpDiv").hide();
		$("#vpDiv").hide();
		
		if($scope.stateCd==13 || $scope.stateCd==15){
			$("#vpDiv").show();
			$scope.loader = true;
			internetConnectivityStatusService.getGpData($scope.stateCd,0).then(function(response) {
				$scope.data = response.data;
				$scope.loader = false;
			});
			
		}else if($scope.stateCd==17 || $scope.stateCd==34){
			$("#bpDiv").show();
			$scope.loader = true;
			internetConnectivityStatusService.getBpData($scope.localBodyTypeCd,$scope.stateCd,0).then(function(response) {
				$scope.data = response.data;
				angular.forEach($scope.data, function(obj, key) {
					$scope.totalCount = $scope.totalCount + obj.count;
					$scope.lbCount = $scope.lbCount + obj.lbCount;
				});	
				$scope.loader = false;
			});
			
		}else{
			$("#zpDiv").show();
			$scope.loader = true;
			internetConnectivityStatusService.getZpData($scope.localBodyTypeCd,$scope.stateCd).then(function(response) {
				$scope.data = response.data;
				angular.forEach($scope.data, function(obj, key) {
					$scope.totalCount = $scope.totalCount + obj.count;
					$scope.lbCount = $scope.lbCount + obj.lbCount;
				});	
				$scope.loader = false;
			});
		}
		
		
		
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
		$scope.lbCount = 0;
		$("#stateDiv").hide();
		$("#zpDiv").hide();
		$("#bpDiv").hide();
		$("#vpDiv").hide();
		$scope.type="B";
		
		if($scope.localBodyTypeCd==1 || $scope.localBodyTypeCd==2 || $scope.localBodyTypeCd==3){
			if($scope.stateCd==14 || $scope.stateCd==30 || $scope.stateCd==31 || $scope.stateCd==38 || $scope.stateCd==12 || $scope.stateCd==17 || $scope.stateCd==34){
				$("#vpDiv").show();
				$scope.loader = true;
				internetConnectivityStatusService.getGpData($scope.stateCd,$scope.zpCode).then(function(response) {
					$scope.data = response.data;
					$scope.loader = false;
				});
			}else{
				$("#bpDiv").show();
				$scope.loader = true;
				internetConnectivityStatusService.getBpData($scope.localBodyTypeCd,$scope.stateCd,$scope.zpCode).then(function(response) {
					$scope.data = response.data;
					angular.forEach($scope.data, function(obj, key) {
						$scope.totalCount = $scope.totalCount + obj.count;
						$scope.lbCount = $scope.lbCount + obj.lbCount;
					});	
					$scope.loader = false;
				});
			}
		}else{
			$("#bpDiv").show();
		}
		
		
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
		internetConnectivityStatusService.getGpData($scope.stateCd,$scope.bpCode).then(function(response) {
			$scope.data = response.data;
			$scope.loader = false;
		});
	}
	
	$scope.getData = function getData(code,name){
		if($scope.localBodyTypeCd == 1){
			$scope.zpName = name;
			$("#zpDiv").show();
		}else if($scope.localBodyTypeCd == 2){
			$scope.bpName = name;
			$("#bpDiv").show();
		}else if($scope.localBodyTypeCd == 3 ){
			$scope.vpName = name;
			$("#vpDiv").show();
		}
		$scope.datadetails = {};
		$("#stateDiv").hide();
		$scope.loader = true;
		internetConnectivityStatusService.getData($scope.localBodyTypeCd,$scope.stateCd,code).then(function(response) {
			$scope.datadetails = response.data;
			$scope.loader = false;
		});
		$("#leafDiv").show();
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
			$scope.getStateData($scope.localBodyTypeCd);
		}else if(type=='S'){
			$("#selectionDiv").show();
			$("#reportDiv").hide();
			$("#reportDivHeader").hide();
			$scope.stateCd = 0;
			$scope.stateName = null;
			getKpiData();
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





