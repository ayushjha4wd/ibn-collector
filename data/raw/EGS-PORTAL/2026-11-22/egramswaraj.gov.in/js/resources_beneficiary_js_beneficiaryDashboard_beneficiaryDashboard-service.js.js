beneficiaryDashboardModule.service('beneficiaryDashboardService', ['$http', function($http) {
	var service = {};
	service.getSchemeList = function(planYear) {
		return $http.get("getBeneficiarySchemeList.do?planYear="+planYear, {});
	};
	
	service.getBeneficiaryKpi = function(planYear, schemeCode) {
		return $http.get("getBeneficiaryKpi.do?planYear="+planYear+"&schemeCode="+schemeCode, {});
	};
	
	service.getPanchayatStateData= function(planYear, schemeCode, localBodyTypeCd) {
		return $http.get("getBeneficiaryStateList.do?planYear="+planYear+"&schemeCode="+schemeCode+"&localBodyTypeCd="+localBodyTypeCd, {});
	};
	
	service.getPanchayatZpData = function(planYear, schemeCode, localBodyTypeCd, stateCd) {
		if(localBodyTypeCd == 1 || localBodyTypeCd == 2 || localBodyTypeCd==3){
			return $http.get("getBeneficiaryPanchayatWiseZpList.do?planYear="+planYear+"&schemeCode="+schemeCode+"&localBodyTypeCd="+localBodyTypeCd+"&stateCd="+stateCd, {});
		}else if(localBodyTypeCd == 4 || localBodyTypeCd == 5 || localBodyTypeCd==6){
			return $http.get("getBeneficiaryLandRegionWiseDistrictList.do?planYear="+planYear+"&schemeCode="+schemeCode+"&localBodyTypeCd="+localBodyTypeCd+"&stateCd="+stateCd, {});
		}
	};
	
	service.getPanchayatBpData = function(planYear, schemeCode, localBodyTypeCd, stateCd, code) {
		if(localBodyTypeCd == 2 || localBodyTypeCd == 3){
			return $http.get("getBeneficiaryPanchayatWiseBpList.do?planYear="+planYear+"&schemeCode="+schemeCode+"&localBodyTypeCd="+localBodyTypeCd+"&stateCd="+stateCd+"&code="+code, {});
		}else if(localBodyTypeCd == 5 || localBodyTypeCd == 6){
			return $http.get("getBeneficiaryLandRegionWiseSubDistrictList.do?planYear="+planYear+"&schemeCode="+schemeCode+"&localBodyTypeCd="+localBodyTypeCd+"&stateCd="+stateCd+"&code="+code, {});
		}
	};
	
	service.getPanchayatVpData = function(planYear, schemeCode, localBodyTypeCd, stateCd, code) {
		if(localBodyTypeCd == 3){
			return $http.get("getBeneficiaryPanchayatWiseVpList.do?planYear="+planYear+"&schemeCode="+schemeCode+"&localBodyTypeCd="+localBodyTypeCd+"&stateCd="+stateCd+"&code="+code, {});
		}else if(localBodyTypeCd == 6){
			return $http.get("getBeneficiaryLandRegionWiseVillageList.do?planYear="+planYear+"&schemeCode="+schemeCode+"&localBodyTypeCd="+localBodyTypeCd+"&stateCd="+stateCd+"&code="+code, {});
		}
	};
	
	service.getBeneficiaryData= function(planYear, schemeCode, localBodyTypeCd, stateCd, code) {
		return $http.get("getBeneficiaryDetailsList.do?planYear="+planYear+"&schemeCode="+schemeCode+"&localBodyTypeCd="+localBodyTypeCd+"&stateCd="+stateCd+"&code="+code, {});
	};
	
	return service;
}]);
