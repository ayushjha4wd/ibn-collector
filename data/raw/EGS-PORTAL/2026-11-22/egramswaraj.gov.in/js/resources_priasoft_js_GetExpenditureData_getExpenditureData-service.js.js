getExpenditureDataModule.service('getExpenditureDataService', ['$http', function($http) {
	
	var service = {};

	
	
	service.getSchemeList = function() {
		return $http.get("getOnlinePesScheme.do?", {});
	};
	
	service.getState = function(){
		return $http.get("getStateListExp.do?", {});
	}
	
	/*service.getStatewiseFocusAreaExpenditure = function(finYear, schemeUid, lbtype, stateCode) {
		return $http.get("getStatewiseFocusAreaExp.do?finYear="+finYear+"&schemeUid="+schemeUid+"&lbtype="+lbtype+"&stateCode="+stateCode, {});
	};
	
	service.getAllStateFocusAreaExpenditure = function(finYear, schemeUid, lbtype) {
		return $http.get("getAllStateFocusAreaExp.do?finYear="+finYear+"&schemeUid="+schemeUid+"&lbtype="+lbtype, {});
	};
	
	service.getConsolidatedFocusAreaExpenditure = function(finYear, schemeUid, lbtype) {
		return $http.get("getConsolidatedFocusAreaExp.do?finYear="+finYear+"&schemeUid="+schemeUid+"&lbtype="+lbtype, {});
	};*/
	
	return service;
	
	
}]);

