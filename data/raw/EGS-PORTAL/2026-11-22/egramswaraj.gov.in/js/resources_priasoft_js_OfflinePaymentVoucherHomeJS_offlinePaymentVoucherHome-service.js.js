OfflinePaymentVoucherHomeModule.service('OfflinePaymentVoucherHomeService', ['$http', function($http) {
	
	var service = {};
	
	service.getSchemeList = function(stateCode,finYear,type) {
		return $http.get("getSchemeListForReverseMis.do?stateCode="+stateCode, {});
	};
	
	service.getSchemeChild = function(schemeCode,ac_head_type,workCode,stateCode) {
		  return $http.get("getSchemeChildPaymentOPVHome.do?ac_head_type="+ac_head_type+"&workCode="+workCode+"&schemeCode="+schemeCode+"&stateCode="+stateCode,{});
	  };
	  
	
	  
	return service;
		
		
}]);






