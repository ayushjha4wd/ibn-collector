schoolAssetStatusModule.service('schoolAssetStatusService', ['$http', function($http) {
	var service = {};

	service.getStateData = function() {
		return $http.get("getSchoolAssetStatusStateList.do", {});
	};

	service.getZpData = function(stateCd) {
			return $http.get("getSchoolAssetStatusZpList.do?stateCd="+stateCd, {});
	};
	
	service.getBpData = function(stateCd, code) {
			return $http.get("getSchoolAssetStatusBpList.do?stateCd="+stateCd+"&code="+code, {});
	};
	
	service.getGpData = function(stateCd, code) {
			return $http.get("getSchoolAssetStatusGpList.do?stateCd="+stateCd+"&code="+code, {});
	};
	
	service.getData= function(stateCd, code) {
		return $http.get("getSchoolAssetStatusDetailsList.do?stateCd="+stateCd+"&code="+code, {});
	};
	
	return service;
}]);
