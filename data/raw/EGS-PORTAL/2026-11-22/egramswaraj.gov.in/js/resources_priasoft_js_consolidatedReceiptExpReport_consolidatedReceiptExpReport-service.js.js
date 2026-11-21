consolidatedReceiptExpModule.service('consolidatedReceiptExpService', ['$http', function($http) {
	var service = {};
	
	service.getStateTier = function(stateCode) {
		return $http.get("getStateTier.do?stateCode="+stateCode, {});
	};
	
	service.getSchemeList = function(stateCode,finYear,type) {
		return $http.get("unspendSchemeList.do?stateId="+stateCode+"&finYear="+finYear+"&type="+type, {});
	};
		
    service.getConsolidatedStateList = function(finYear) {
			return $http.get("getConsolidatedStateList.do?finYear="+finYear, {});
	};
	
	service.generateConsolidatedState = function(finYear, schemeCode,type) {
		return $http.get("getConsolidatedStateData.do?finYear="+finYear+"&schemeCode="+schemeCode+"&type="+type, {});
	};
	
	service.generateConsolidatedStateDrill = function(finYear, schemeCode, stateCode,type) {
		return $http.get("getConsolidatedStateDrillData.do?stateCode="+stateCode+"&finYear="+finYear+"&schemeCode="+schemeCode+"&type="+type, {});
	};
	
	service.generateConsolidatedDistrict = function(finYear, stateCode, schemeCode,type) {
		return $http.get("getConsolidatedDistrictData.do?stateCode="+stateCode+"&finYear="+finYear+"&schemeCode="+schemeCode+"&type="+type, {});
	};
	
	service.schedularDate = function(stateCode,tableName) {
		return $http.get("getSchedularDate.do?stateCode="+stateCode+"&tableName="+tableName, {});
	};
	
	
	
	return service;
}]);
