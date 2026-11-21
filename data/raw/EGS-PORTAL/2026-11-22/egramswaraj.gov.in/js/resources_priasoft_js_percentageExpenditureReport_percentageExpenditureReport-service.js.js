percentageExpenditureReportModule.service('percentageExpenditureReportService', ['$http', function($http) {
	var service = {};
	
	service.getStateTier = function(stateCode) {
		return $http.get("getStateTier.do?stateCode="+stateCode, {});
	};
	  service.getSchemeList = function(stateCode,finYear,type) {
		return $http.get("unspendSchemeList.do?stateId="+stateCode+"&finYear="+finYear+"&type="+type, {});
		};
		service.getZpBpGpStateList = function(type,finYear) {
			return $http.get("getZpBpGpStateList.do?type="+type+"&finYear="+finYear, {});
			};
	service.generateState = function(type, stateCode,schemeCode,finYear) {
		return $http.get("getPercentageExpenditureStateData.do?finYear="+finYear+"&schemeCode="+schemeCode+"&type="+type+"&stateCode="+stateCode, {});
	};
	
	service.generateStateDrill = function(finYear, schemeCode, stateCode,type,upperlimit,lowerlimit) {
		return $http.get("getpercentageExpenditureDrillData.do?stateCode="+stateCode+"&finYear="+finYear+"&schemeCode="+schemeCode+"&type="+type+"&upperlimit="+upperlimit+"&lowerlimit="+lowerlimit, {});
	};
	
	service.generateDistrict = function(finYear, stateCode, schemeCode,type,upperlimit,lowerlimit) {
		return $http.get("getPercentageExpenditureDistrictData.do?stateCode="+stateCode+"&finYear="+finYear+"&schemeCode="+schemeCode+"&type="+type+"&upperlimit="+upperlimit+"&lowerlimit="+lowerlimit, {});
	};
	
	service.generateBlock = function(finYear, stateCode, schemeCode, districtCode,type,upperlimit,lowerlimit) {
		return $http.get("getPercentageExpenditureBlockData.do?stateCode="+stateCode+"&districtCode="+districtCode+"&finYear="+finYear+"&schemeCode="+schemeCode+"&type="+type+"&upperlimit="+upperlimit+"&lowerlimit="+lowerlimit, {});
		
	};
	
	service.generateVillage = function(finYear, stateCode, schemeCode, districtCode, blockCode,upperlimit,lowerlimit) {
		return $http.get("getPercentageExpenditureVillageData.do?stateCode="+stateCode+"&districtCode="+districtCode+"&blockCode="+blockCode+"&finYear="+finYear+"&schemeCode="+schemeCode+"&upperlimit="+upperlimit+"&lowerlimit="+lowerlimit, {});
		
	};

	service.generateD2V = function(finYear, stateCode, schemeCode, districtCode,type,upperlimit,lowerlimit) {
		return $http.get("getpercentageExpenditureDistrictToVillageData.do?stateCode="+stateCode+"&districtCode="+districtCode+"&finYear="+finYear+"&schemeCode="+schemeCode+"&type="+type+"&upperlimit="+upperlimit+"&lowerlimit="+lowerlimit, {});
		
	};
	return service;
}]);
