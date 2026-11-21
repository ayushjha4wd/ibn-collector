publicReportModule.service('publicReportService', ['$http', function($http) {
	var service = {};
	
	service.registeredSchemeList = function(stateCode) {
		return $http.get("getSchemeListForReverseMis.do?stateCode="+stateCode, {});
	};
	
	service.getStateList = function() {
		return $http.get("getStateListForReverseMis.do", {});
	};
	
	service.getStateData = function(finYear, schemeCode,stateCode,reportType,componentType,schemeComponent,amountIn) {
		return $http.get("getStateListForPublicReportDate.do?finYear="+finYear+"&schemeCode="+schemeCode+"&stateCode="+stateCode+"&reportType="+reportType+"&componentType="+componentType+"&schemeComponent="+schemeComponent+"&amountIn="+amountIn, {});
	};
	
	service.getzpData = function(finYear, stateCode, schemeCode,reportType,componentType,schemeComponent,amountIn,voucherdate) {
		return $http.get("getZpListForPublicReportDate.do?stateCode="+stateCode+"&finYear="+finYear+"&schemeCode="+schemeCode+"&reportType="+reportType+"&voucherdate="+voucherdate+"&componentType="+componentType+"&schemeComponent="+schemeComponent+"&amountIn="+amountIn, {});
	};
	
	service.getbpData = function(finYear, stateCode, schemeCode,reportType,componentType,schemeComponent,amountIn,voucherdate) {
		return $http.get("getBpListForPublicReportDate.do?stateCode="+stateCode+"&finYear="+finYear+"&schemeCode="+schemeCode+"&reportType="+reportType+"&voucherdate="+voucherdate+"&componentType="+componentType+"&schemeComponent="+schemeComponent+"&amountIn="+amountIn, {});
	};
	

	service.getzpVpData = function(finYear, stateCode, schemeCode,reportType,componentType,schemeComponent,amountIn,voucherdate) {
		return $http.get("getVpZpListForPublicReportDate.do?stateCode="+stateCode+"&finYear="+finYear+"&schemeCode="+schemeCode+"&reportType="+reportType+"&voucherdate="+voucherdate+"&componentType="+componentType+"&schemeComponent="+schemeComponent+"&amountIn="+amountIn, {});
	};
	
	service.getvpData = function(finYear, stateCode, schemeCode,entityCode,reportType,componentType,schemeComponent,amountIn,voucherdate) {
		return $http.get("getVpListForPublicReportDate.do?stateCode="+stateCode+"&finYear="+finYear+"&schemeCode="+schemeCode+"&entityCode="+entityCode+"&voucherdate="+voucherdate+"&reportType="+reportType+"&componentType="+componentType+"&schemeComponent="+schemeComponent+"&amountIn="+amountIn, {});
	};
	
	service.getStateTier = function(stateCode) {
		return $http.get("getStateTier.do?stateCode="+stateCode, {});
	};
	
	service.getSchemeChild = function(schemeCode,ac_head_type,workCode,stateCode) {
		  return $http.get("getAllChildSchemeComponent.do?schemeCode="+schemeCode+"&ac_head_type="+ac_head_type+"&workCode="+workCode+"&stateCode="+stateCode,{});
	  };
	
	return service;
}]);
