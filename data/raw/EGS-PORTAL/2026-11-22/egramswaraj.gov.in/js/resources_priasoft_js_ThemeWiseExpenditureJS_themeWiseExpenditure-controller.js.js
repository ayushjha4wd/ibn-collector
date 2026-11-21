var themeWiseExpenditureModule = angular.module('themeWiseExpenditureModule', ['angular.filter']);
themeWiseExpenditureModule.controller("themeWiseExpenditureController", ['$scope', "themeWiseExpenditureService", function($scope, themeWiseExpenditureService) {

	
	$scope.getSchemeLists = function getSchemeLists(){
		getSchemeList();
	}
	function getSchemeList() {
		$scope.schemeList = {};
		themeWiseExpenditureService.getSchemeList().then(function(response) {
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
	
	
	$scope.stateType = function stateType(stateType){
		if(stateType == 'S'){
			$("#stateDiv").show();
		}else{
			$("#stateDiv").hide();
			$("#stateCode").val("");
		}
	}
	
	$scope.themeData = function themeData(themeType){
		if(themeType == 'I'){
			$("#themeDiv").show();
		}else{
			$("#themeDiv").hide();
			$("#themeCode").val("");
		}
	}
	
	

	
}]);





