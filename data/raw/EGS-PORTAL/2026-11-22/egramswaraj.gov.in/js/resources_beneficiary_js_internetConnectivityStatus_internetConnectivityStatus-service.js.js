internetConnectivityStatusModule.service('internetConnectivityStatusService', ['$http', function($http) {
	var service = {};
	service.getSchemeList = function(planYear) {
		return $http.get("getBeneficiarySchemeList.do?planYear="+planYear, {});
	};
	
	service.getInternetConnectivityStatusKpi = function() {
		return $http.get("getKpiInternetConnectivityStatus.do", {});
	};
	
	service.getStateData= function(localBodyTypeCd) {
		return $http.get("getInternetConnectivityStatusStateList.do?localBodyTypeCd="+localBodyTypeCd, {});
	};
	
	service.getZpData = function(localBodyTypeCd, stateCd) {
			return $http.get("getInternetConnectivityStatusZpList.do?localBodyTypeCd="+localBodyTypeCd+"&stateCd="+stateCd, {});
	};
	
	service.getBpData = function(localBodyTypeCd, stateCd, code) {
			return $http.get("getInternetConnectivityStatusBpList.do?localBodyTypeCd="+localBodyTypeCd+"&stateCd="+stateCd+"&code="+code, {});
	};
	
	service.getGpData = function(stateCd, code) {
			return $http.get("getInternetConnectivityStatusGpList.do?stateCd="+stateCd+"&code="+code, {});
	};
	
	service.getData= function(localBodyTypeCd, stateCd, code) {
		return $http.get("getInternetConnectivityStatusDetailsList.do?localBodyTypeCd="+localBodyTypeCd+"&stateCd="+stateCd+"&code="+code, {});
	};
	
	return service;
}]);
