themeWiseExpenditureModule.service('themeWiseExpenditureService', ['$http', function($http) {
	var service = {};
	
	
	/*service.getSchemeList = function(stateCode) {
		return $http.get("getSchemeListForReverseMis.do?stateCode="+stateCode, {});
	};*/
	
	service.getSchemeList = function() {
		return $http.get("getOnlinePesScheme.do?", {});
	};
	
	
		
	
	return service;
}]);
