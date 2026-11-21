var OfflinePaymentVoucherHomeModule = angular.module('OfflinePaymentVoucherHomeModule', ['angular.filter']);
OfflinePaymentVoucherHomeModule.controller("OfflinePaymentVoucherHomeController", ['$scope', "OfflinePaymentVoucherHomeService", function($scope,OfflinePaymentVoucherHomeService) { 
	
	$scope.stateCode = $("#stateCode").val();
	$scope.schemeCode = $("#schemeCode").val();
	$scope.schemeComponent= $("#schemeComponent").val();
	
	$scope.schemeList = function schemeList(stateCode){
		if(stateCode > 0){
			getSchemeList(stateCode);
		}
	}
	
	function getSchemeList(stateCode) {
		$scope.schemeList = {};
		//$scope.stateCode = $("#stateCode").val();
		OfflinePaymentVoucherHomeService.getSchemeList(stateCode).then(function(response) {
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
	
	$scope.component = function component(schemeCode){
		if(schemeCode > 0){
			
		getSchemeChild(schemeCode,"E",0);
		
		}
	}
	
	function getSchemeChild(schemeCode,ac_head_type,workCode) {
		$scope.stateCode = $("#stateCode").val();

		OfflinePaymentVoucherHomeService.getSchemeChild(schemeCode,ac_head_type,workCode,$scope.stateCode).then(function(response) {
			$scope.data = response.data;
			var schemeDetail = new Array();
			angular.forEach($scope.data, function(obj, key) {
					scheme = new schemeChildDetails();
					
					scheme.schemeid = obj.schemeid;
					scheme.schemeName = obj.resourcedesc;
					schemeDetail.push(scheme);
				
			});	
			$scope.childdetails = schemeDetail;
			
	    });
	}

	
	
}]);































