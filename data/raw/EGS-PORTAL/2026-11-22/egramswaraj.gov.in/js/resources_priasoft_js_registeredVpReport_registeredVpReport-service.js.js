registeredVpReportModule.service('registeredVpReportService', ['$http', function($http) {
	var service = {};
	
	service.registeredSchemeList = function(stateCode, type) {
		return $http.get("registeredTypeSchemeList.do?stateCode="+stateCode+"&type="+type, {});
	};
	
	service.getStateList = function() {
		return $http.get("getStateList.do", {});
	};
	
	service.getStateData = function(finYear, stateCode, schemeCode) {
		return $http.get("getRegisteredStateData.do?stateCode="+stateCode+"&finYear="+finYear+"&schemeCode="+schemeCode, {});
	};
	
	service.getStateZpData = function(finYear, stateCode, schemeCode) {
		return $http.get("getRegisteredZPData.do?stateCode="+stateCode+"&finYear="+finYear+"&schemeCode="+schemeCode, {});
	};
	
	service.getStateBpData = function(finYear, stateCode, schemeCode) {
		return $http.get("getRegisteredBPData.do?stateCode="+stateCode+"&finYear="+finYear+"&schemeCode="+schemeCode, {});
	};
	
	service.getzpData = function(finYear, stateCode, schemeCode) {
		return $http.get("getRegisteredZpDetailsData.do?stateCode="+stateCode+"&finYear="+finYear+"&schemeCode="+schemeCode, {});
	};
	
	service.getbpData = function(finYear, stateCode, schemeCode) {
		return $http.get("getRegisteredBpDetailsData.do?stateCode="+stateCode+"&finYear="+finYear+"&schemeCode="+schemeCode, {});
	};
	
	service.getDistrictData = function(finYear, stateCode, schemeCode, stateTier) {
		return $http.get("getRegisteredDistrictData.do?stateCode="+stateCode+"&finYear="+finYear+"&schemeCode="+schemeCode+"&StateTier="+stateTier, {});
	};
	
	service.getBlockData = function(finYear, stateCode, districtCode,  schemeCode, stateTier) {
		return $http.get("getRegisteredBlockData.do?stateCode="+stateCode+"&districtCode="+districtCode+"&finYear="+finYear+"&schemeCode="+schemeCode+"&StateTier="+stateTier, {});
		
	};
	
	service.getVillageData = function(finYear, stateCode, blockCode, schemeCode) {
		return $http.get("getRegisteredVillageData.do?stateCode="+stateCode+"&blockCode="+blockCode+"&finYear="+finYear+"&schemeCode="+schemeCode, {});
		
	};
	
	service.schedularDate = function(stateCode,tableName) {
		return $http.get("getSchedularDate.do?stateCode="+stateCode+"&tableName="+tableName, {});
	};
	
	
	
	return service;
}]);
