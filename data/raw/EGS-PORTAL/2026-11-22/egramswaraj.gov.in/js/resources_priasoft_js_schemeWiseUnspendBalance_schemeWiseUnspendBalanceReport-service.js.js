schemeWiseUnspendBalanceReportModule.service('schemeWiseUnspendBalanceReportService', ['$http', function($http) {
	var service = {};
	
	service.getStateTier = function(stateCode) {
		return $http.get("getStateTier.do?stateCode="+stateCode, {});
	};
	  service.getSchemeList = function(stateCode,finYear,type) {
		return $http.get("unspendSchemeList.do?stateId="+stateCode+"&finYear="+finYear+"&type="+type, {});
		};
		service.getSchemeChild = function(schemeCode,ac_head_type,workCode,stateCode) {
			  return $http.get("getAllSchemeComponent.do?schemeCode="+schemeCode+"&ac_head_type="+ac_head_type+"&workCode="+workCode+"&stateCode="+stateCode,{});
		  };
		
		service.getZpBpGpStateList = function(type,finYear) {
			return $http.get("getZpBpGpStateList.do?type="+type+"&finYear="+finYear, {});
			};
	service.generateState = function(finYear, schemeCode,type,schemeComponent,fromAmount,toAmount,amountIn) {
		return $http.get("getUnspentBalanceStateData.do?finYear="+finYear+"&schemeCode="+schemeCode+"&type="+type+"&schemeComponent="+schemeComponent+"&fromAmount="+fromAmount+"&toAmount="+toAmount+"&amountIn="+amountIn, {});
	};
	
	service.generateStateDrill = function(finYear, schemeCode, stateCode,type,schemeComponent,fromAmount,toAmount,amountIn) {
		return $http.get("getUnspentBalanceStateDrillData.do?stateCode="+stateCode+"&finYear="+finYear+"&schemeCode="+schemeCode+"&type="+type+"&schemeComponent="+schemeComponent+"&fromAmount="+fromAmount+"&toAmount="+toAmount+"&amountIn="+amountIn, {});
	};
	
	service.generateDistricDrill = function(finYear, schemeCode, zpCode,type,schemeComponent,fromAmount,toAmount,amountIn,stateCode) {
		return $http.get("getUnspentBalanceDistricDrillData.do?zpCode="+zpCode+"&finYear="+finYear+"&schemeCode="+schemeCode+"&type="+type+"&schemeComponent="+schemeComponent+"&fromAmount="+fromAmount+"&toAmount="+toAmount+"&amountIn="+amountIn+"&stateCode="+stateCode, {});
	};

	
	service.generateDistrict = function(finYear, stateCode, schemeCode,type,schemeComponent,fromAmount,toAmount,amountIn) {
		return $http.get("getUnspentBalanceDistrictData.do?stateCode="+stateCode+"&finYear="+finYear+"&schemeCode="+schemeCode+"&type="+type+"&schemeComponent="+schemeComponent+"&fromAmount="+fromAmount+"&toAmount="+toAmount+"&amountIn="+amountIn, {});
	};
	
	service.generateBlock = function(finYear, stateCode, schemeCode, districtCode,type,schemeComponent,fromAmount,toAmount,amountIn) {
		return $http.get("getUnspentBalanceBlockData.do?stateCode="+stateCode+"&districtCode="+districtCode+"&finYear="+finYear+"&schemeCode="+schemeCode+"&type="+type+"&schemeComponent="+schemeComponent+"&fromAmount="+fromAmount+"&toAmount="+toAmount+"&amountIn="+amountIn, {});
		
	};
	
	service.generateVillage = function(finYear, stateCode, schemeCode, districtCode, blockCode,schemeComponent,fromAmount,toAmount,amountIn) {
		return $http.get("getUnspentBalanceVillageData.do?stateCode="+stateCode+"&districtCode="+districtCode+"&blockCode="+blockCode+"&finYear="+finYear+"&schemeCode="+schemeCode+"&schemeComponent="+schemeComponent+"&fromAmount="+fromAmount+"&toAmount="+toAmount+"&amountIn="+amountIn, {});
		
	};
	
	return service;
}]);
