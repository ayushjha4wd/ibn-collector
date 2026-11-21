var getExpenditureDataModule = angular.module('getExpenditureDataModule', ['angular.filter']);
getExpenditureDataModule.controller("getExpenditureDataController", ['$scope', "getExpenditureDataService", function($scope,getExpenditureDataService) {
	
	
	
	$scope.finYear = $("#finYear").val();
	
	$scope.getSchemeLists = function getSchemeLists(){
		getSchemeList();
	}
	function getSchemeList() {
		$scope.schemeList = {};
		getExpenditureDataService.getSchemeList().then(function(response) {
			var schemeDetail = new Array();
			angular.forEach(response.data, function(obj, key) {
			   var scheme = new schemeDetails();
			   scheme.schemeId = obj.pesSchemeid;
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
	
	
	
	$scope.stateList = function stateList(reportType){
		
		if(reportType == 'S'){
			$("#stateListDiv").show();
		}else {
			$("#stateListDiv").hide();
			
		}
	}
	
	/*function getStateList(){
		$scope.loader = true;
		   $scope.dataList={};
		   getExpenditureDataService.getState().then(function(response){
			if(response.data.length > 0) { 
			 $scope.dataList = response.data;
			 $scope.loader = false;
			} else {
			$scope.loader = false;
			}
		});
		
		
	}
	
	
	$scope.showScheme = function showScheme(lbtype) {
		 $scope.finYear = $("#finYear").val();
		 $scope.schemeUid = $("#schemeUid").val();
		 $scope.reportType = $("#reportType").val();
		 $scope.stateCode = $("#stateCode").val();
		 
		if($scope.reportType == "S"){
			
			getStatewiseFocusAreaExp($scope.finYear, $scope.schemeUid, lbtype, $scope.stateCode);
			
		}else if($scope.reportType == "A"){
			
			getAllStateFocusAreaExp($scope.finYear, $scope.schemeUid, lbtype);
			
		}else{
			
			getConsolidatedFocusAreaExp($scope.finYear, $scope.schemeUid, lbtype);
			
		}
		
		
	}
	
	
	function getStatewiseFocusAreaExp(finYear, schemeUid, lbtype, stateCode){
		
		$scope.loader = true;
		   $scope.dataList={};
		   
		   $("#StatewiseFocusArea").show();
		   
		   getExpenditureDataService.getStatewiseFocusAreaExpenditure(finYear, schemeUid, lbtype, stateCode).then(function(response){
			
			if(response.data.length > 0) { 
			 $scope.dataList = response.data;
			 $scope.loader = false;
			} else {
			$scope.loader = false;
			$("#StatewiseFocusArea").hide();	
			alert("No Data Found");
			
			}
		});
		
	}


	function getAllStateFocusAreaExp(finYear, schemeUid, lbtype){
		
		$scope.loader = true;
		   $scope.dataList={};
		   
		   $("#StatewiseFocusArea").show();
		   
		   getExpenditureDataService.getAllStateFocusAreaExpenditure(finYear, schemeUid, lbtype).then(function(response){
			
			if(response.data.length > 0) { 
			 $scope.dataList = response.data;
			 $scope.loader = false;
			} else {
			$scope.loader = false;
			$("#StatewiseFocusArea").hide();
			alert("No Data Found");
			}
		});
		
	}
	
	function getConsolidatedFocusAreaExp(finYear, schemeUid, lbtype){
		
		$scope.loader = true;
		   $scope.dataList={};
		   
		   $("#ConsolidatedFocusArea").show();
		   
		   getExpenditureDataService.getConsolidatedFocusAreaExpenditure(finYear, schemeUid, lbtype).then(function(response){
			
			if(response.data.length > 0) { 
			 $scope.dataList = response.data;
			 $scope.loader = false;
			} else {
			$scope.loader = false;
			$("#ConsolidatedFocusArea").hide();	
			alert("No Data Found");
			}
		});
		
	}
	*/
	

	
	
}]);