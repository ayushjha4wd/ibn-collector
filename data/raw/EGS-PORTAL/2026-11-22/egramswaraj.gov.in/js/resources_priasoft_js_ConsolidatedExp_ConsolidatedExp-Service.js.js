consolidatedExpModule.service('consolidatedExpService', ['$http', function($http) {
	var service = {};
	
	service.getStateTier = function(stateCode) {
		return $http.get("getStateTier.do?stateCode="+stateCode, {});
	};
	
	service.getSchemeList = function(stateCode,finYear,type) {
		return $http.get("unspendSchemeListNew.do?stateId="+stateCode+"&finYear="+finYear+"&type="+type, {});
	};
		
    service.getConsolidatedStateList = function(finYear) {
			return $http.get("getConsolidatedStateList.do?finYear="+finYear, {});
	};
	
	service.generateConsolidatedState = function(finYear, schemeCode) {
		return $http.get("getAllStateData.do?finYear="+finYear+"&schemeCode="+schemeCode, {});
	};
	
	service.generateConsolidatedStateDrill = function(finYear, schemeCode, stateCode,type) {
		return $http.get("getConsolidatedStateDrillData.do?stateCode="+stateCode+"&finYear="+finYear+"&schemeCode="+schemeCode+"&type="+type, {});
	};
	
	service.generateConsolidatedDistrict = function(stateCode, finYear,schemeCode,reportType,lbType) {
		return $http.get("getConDistrictData.do?stateCode="+stateCode+"&finYear="+finYear+"&schemeCode="+schemeCode+"&reportType="+reportType+"&lbType="+lbType, {});
	};
	
	
	service.getConsolidatedExpenditureDetails = function(stateCode, finYear,schemeCode,reportType,lbType,componentType) {
		return $http.get("getConsolidatedExpenditureDetails.do?stateCode="+stateCode+"&finYear="+finYear+"&schemeCode="+schemeCode+"&reportType="+reportType+"&lbType="+lbType+"&componentType="+componentType, {});
	};
	
	
	
	return service;
}]);
