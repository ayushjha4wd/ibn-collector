publicReportModule.service('publicReportService', ['$http', function($http) {
	var service = {};
	
	service.registeredSchemeList = function(stateCode) {
		return $http.get("getSchemeListForReverseMis.do?stateCode="+stateCode, {});
	};
	
	service.getStateList = function() {
		return $http.get("getStateListForReverseMis.do", {});
	};
	
	service.getStateData = function(finYear, schemeCode,stateCode,reportType,componentType,schemeComponent,amountIn) {
		return $http.get("getStateListForPublicReport.do?finYear="+finYear+"&schemeCode="+schemeCode+"&stateCode="+stateCode+"&reportType="+reportType+"&componentType="+componentType+"&schemeComponent="+schemeComponent+"&amountIn="+amountIn, {});
	};
	
	service.getzpData = function(finYear, stateCode, schemeCode,reportType,componentType,schemeComponent,amountIn) {
		return $http.get("getZpListForPublicReport.do?stateCode="+stateCode+"&finYear="+finYear+"&schemeCode="+schemeCode+"&reportType="+reportType+"&componentType="+componentType+"&schemeComponent="+schemeComponent+"&amountIn="+amountIn, {});
	};
	
	service.getbpData = function(finYear, stateCode, schemeCode,reportType,componentType,schemeComponent,amountIn) {
		return $http.get("getBpListForPublicReport.do?stateCode="+stateCode+"&finYear="+finYear+"&schemeCode="+schemeCode+"&reportType="+reportType+"&componentType="+componentType+"&schemeComponent="+schemeComponent+"&amountIn="+amountIn, {});
	};
	

	service.getzpVpData = function(finYear, stateCode, schemeCode,reportType,componentType,schemeComponent,amountIn) {
		return $http.get("getVpZpListForPublicReport.do?stateCode="+stateCode+"&finYear="+finYear+"&schemeCode="+schemeCode+"&reportType="+reportType+"&componentType="+componentType+"&schemeComponent="+schemeComponent+"&amountIn="+amountIn, {});
	};
	
	service.getvpData = function(finYear, stateCode, schemeCode,entityCode,reportType,componentType,schemeComponent,amountIn) {
		return $http.get("getVpListForPublicReport.do?stateCode="+stateCode+"&finYear="+finYear+"&schemeCode="+schemeCode+"&entityCode="+entityCode+"&reportType="+reportType+"&componentType="+componentType+"&schemeComponent="+schemeComponent+"&amountIn="+amountIn, {});
	};
	
	service.getStateTier = function(stateCode) {
		return $http.get("getStateTier.do?stateCode="+stateCode, {});
	};
	
	service.getSchemeChild = function(schemeCode,ac_head_type,workCode,stateCode) {
		  return $http.get("getAllChildSchemeComponent.do?schemeCode="+schemeCode+"&ac_head_type="+ac_head_type+"&workCode="+workCode+"&stateCode="+stateCode,{});
	  };
	  
	  service.getStateDataMannual = function(finYear, schemeCode,stateCode,reportType,componentType,schemeComponent,amountIn) {
			return $http.get("getStateListForMannualReceipt.do?finYear="+finYear+"&schemeCode="+schemeCode+"&stateCode="+stateCode+"&reportType="+reportType+"&componentType="+componentType+"&schemeComponent="+schemeComponent+"&amountIn="+amountIn, {});
		};
		
		service.getZpDataMannual = function(finYear, stateCode, schemeCode,reportType,componentType,schemeComponent,amountIn) {
			return $http.get("getZpListForMannualReceipt.do?stateCode="+stateCode+"&finYear="+finYear+"&schemeCode="+schemeCode+"&reportType="+reportType+"&componentType="+componentType+"&schemeComponent="+schemeComponent+"&amountIn="+amountIn, {});
		};
		
		service.getBpMannualDetails = function(finYear, stateCode, schemeCode,reportType,componentType,schemeComponent,amountIn) {
			return $http.get("getBpListForMannualReceipt.do?stateCode="+stateCode+"&finYear="+finYear+"&schemeCode="+schemeCode+"&reportType="+reportType+"&componentType="+componentType+"&schemeComponent="+schemeComponent+"&amountIn="+amountIn, {});
		};
		
		service.getZpVpMannualDetails = function(finYear, stateCode, schemeCode,reportType,componentType,schemeComponent,amountIn) {
			return $http.get("getVpZpListForMannualReceipt.do?stateCode="+stateCode+"&finYear="+finYear+"&schemeCode="+schemeCode+"&reportType="+reportType+"&componentType="+componentType+"&schemeComponent="+schemeComponent+"&amountIn="+amountIn, {});
		};
		
		service.getVpMannualDetails = function(finYear, stateCode, schemeCode,entityCode,reportType,componentType,schemeComponent,amountIn) {
			return $http.get("getVpListForMannualReceipt.do?stateCode="+stateCode+"&finYear="+finYear+"&schemeCode="+schemeCode+"&entityCode="+entityCode+"&reportType="+reportType+"&componentType="+componentType+"&schemeComponent="+schemeComponent+"&amountIn="+amountIn, {});
		};
		
		service.getStateListMannual = function() {
			return $http.get("showStateList.do", {});
		};


	
	return service;
}]);
