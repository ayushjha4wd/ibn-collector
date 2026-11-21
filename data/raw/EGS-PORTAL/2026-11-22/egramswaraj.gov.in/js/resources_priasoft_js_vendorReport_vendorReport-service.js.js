vendorReportModule.service('vendorReportService', ['$http', function($http) {
	var service = {};
	service.getStateTier = function(stateCode) {
		return $http.get("getStateTier.do?stateCode="+stateCode, {});
	};
	
	service.getDistrictData = function(stateCode, finYear) {
		return $http.get("getVendorDistrictData.do?stateCode="+stateCode+"&finYear="+finYear, {});
		
	};
	
	service.getBlockData = function(stateCode, districtCode, finYear) {
		return $http.get("getVendorBlockData.do?stateCode="+stateCode+"&districtCode="+districtCode+"&finYear="+finYear, {});
		
	};
	
	service.getVillageData = function(stateCode, blockCode, finYear) {
		return $http.get("getVendorVillageData.do?stateCode="+stateCode+"&blockCode="+blockCode+"&finYear="+finYear, {});
		
	};
	
	service.getVendorData = function(stateCode, villageCode) {
		return $http.get("getVendorListData.do?stateCode="+stateCode+"&villageCode="+villageCode, {});
		
	};
	
	service.getZpData = function(stateCode, finYear) {
		return $http.get("getFfcVendorZP.do?stateCode="+stateCode+"&finYear="+finYear, {});
		
	};
	
	service.getBpData = function(stateCode, finYear) {
		return $http.get("getFfcVendorBP.do?stateCode="+stateCode+"&finYear="+finYear, {});
		
	};
	return service;
}]);
