ffcSectorWiseExpenditureModule.service('ffcSectorWiseExpenditureService', ['$http', function($http) {
	var service = {};
	
	service.registeredSchemeList = function(stateCode) {
		return $http.get("registeredSchemeList.do?stateCode="+stateCode, {});
	};
	
	service.getStateList = function() {
		return $http.get("getStateList.do", {});
	};
	
	service.getStateTier = function(stateCode) {
		return $http.get("getStateTier.do?stateCode="+stateCode, {});
	};
	
	service.getHeader = function(schemeCode) {
		return $http.get("ffcSectorWiseExpHeader.do?schemeCode="+schemeCode, {});
	};
	service.getStateData = function(finYear,schemeCode,lbType,schemechildCode) {
		return $http.get("ffcSectorWiseExpState.do?finYear="+finYear+"&schemeCode="+schemeCode+"&schemechildCode="+schemechildCode+"&lbType="+lbType, {});
	};
	
	service.getDistrictData = function(finYear, schemeCode, stateCode,lbType,schemechildCode) {
		return $http.get("ffcSectorWiseExpDistrict.do?stateCode="+stateCode+"&finYear="+finYear+"&schemeCode="+schemeCode+"&schemechildCode="+schemechildCode+"&lbType="+lbType, {});
	};
	
	service.getBlockData = function(finYear,schemeCode, stateCode, districtCode,lbType,schemechildCode) {
		return $http.get("ffcSectorWiseExpBlock.do?stateCode="+stateCode+"&districtCode="+districtCode+"&finYear="+finYear+"&schemeCode="+schemeCode+"&schemechildCode="+schemechildCode+"&lbType="+lbType, {});
		
	};
	
	service.getVillageData = function(finYear, schemeCode, stateCode, blockCode,lbType,schemechildCode) {
		return $http.get("ffcSectorWiseExpVillage.do?stateCode="+stateCode+"&blockCode="+blockCode+"&finYear="+finYear+"&schemeCode="+schemeCode+"&schemechildCode="+schemechildCode+"&lbType="+lbType, {});
		
	};
	
	service.getStateExpData =  function(finYear,schemeCode,lbType,pfmsHead,schemechildCode) {
		return $http.get("ffcSectorWiseStateExpData.do?finYear="+finYear+"&schemeCode="+schemeCode+"&schemechildCode="+schemechildCode+"&lbType="+lbType+"&pfmsHead="+pfmsHead, {});
	};
	
	
	
	service.getSchemeChild = function(schemeCode,ac_head_type,workCode,stateCode) {
		  return $http.get("getAllSchemeComponent.do?schemeCode="+schemeCode+"&ac_head_type="+ac_head_type+"&workCode="+workCode+"&stateCode="+stateCode,{});
	  };
	
	
	
	return service;
}]);
