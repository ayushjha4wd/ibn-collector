noeReportModule.service('noeReportService', ['$http', function($http) {
	var service = {};
	service.getStateData = function(finYear) {
		return $http.get("getNOEStateData.do?finYear="+finYear, {});
	};
	
	service.getZpData = function(finYear, stateCode, entityType) {
		return $http.get("getNOEEntityData.do?finYear="+finYear+"&stateCode="+stateCode+"&entityType="+entityType, {});
		
	};
	
	service.getBpData = function(finYear, stateCode, entityType) {
		return $http.get("getNOEEntityData.do?finYear="+finYear+"&stateCode="+stateCode+"&entityType="+entityType, {});
		
	};
	
	service.getVpData = function(finYear, stateCode, entityType) {
		return $http.get("getNOEEntityData.do?finYear="+finYear+"&stateCode="+stateCode+"&entityType="+entityType, {});
		
	};
	
	service.getZpSchemeData = function(finYear,stateCode, entityCode) {
		return $http.get("getNOESchemeData.do?finYear="+finYear+"&stateCode="+stateCode+"&entityCode="+entityCode, {});
		
	};
	
	service.getBpSchemeData = function(finYear,stateCode, entityCode) {
		return $http.get("getNOESchemeData.do?finYear="+finYear+"&stateCode="+stateCode+"&entityCode="+entityCode, {});
		
	};
	
	service.getVpSchemeData = function(finYear,stateCode, entityCode) {
		return $http.get("getNOESchemeData.do?finYear="+finYear+"&stateCode="+stateCode+"&entityCode="+entityCode, {});
		
	};
	
	return service;
}]);
