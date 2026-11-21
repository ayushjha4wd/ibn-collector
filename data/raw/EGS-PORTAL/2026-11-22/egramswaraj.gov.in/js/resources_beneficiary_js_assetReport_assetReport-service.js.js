assetReportModule.service('assetReportService', ['$http', function($http) {
	var service = {};
	service.getDistrictList = function(stateCode) {
		return $http.get("getAssetDistrictList.do?stateCode="+stateCode, {});
	};
	
	service.getAssetData = function(stateCode, districtCode) {
		return $http.get("getAssetData.do?stateCode="+stateCode+"&districtCode="+districtCode, {});
	};
	
	
	return service;
}]);
