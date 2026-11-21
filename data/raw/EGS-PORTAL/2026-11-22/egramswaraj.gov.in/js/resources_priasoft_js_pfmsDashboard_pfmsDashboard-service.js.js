pfmsDashboardModule.service('pfmsDashboardService', ['$http', function($http) {
	var service = {};
	service.getPFMSTransactionStatus = function(stateCode,finYear,schemeCode) {
		return $http.get("getPFMSTransactionStatus.do?stateId="+stateCode+"&schemeCode="+schemeCode+"&year="+finYear,{});
	};
	service.getPFMSStateDashboard = function(finYear) {
		return $http.get("getPFMSStateDashboard.do?year="+finYear,{});
	};
	
	service.getPFMSStateDashboard1 = function(finYear) {
		return $http.get("getPFMSStateDashboard.do?year="+finYear,{});
	};
	
	
	service.getTransactionStatus = function(finyearList,stateCodeList, schemeList,entity_coder) {
		return $http.get("getTransactionStatus.do?finyearList="+finyearList+"&stateCodeList="+stateCodeList+"&schemeList="+schemeList+"&entity_coder="+entity_coder,{});
	};
	
	
	service.getSchemeDetails = function(stateId,SchemeType,finyear) {
		  return $http.get("getDashBoardScheme.do?stateId="+stateId+"&SchemeType="+SchemeType+"&finyear="+finyear,{});
	  };
	
	
	return service;
}]);