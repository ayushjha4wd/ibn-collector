tiedExpenditureModule.service('tiedExpenditureService', ['$http', function($http) {
	var service = {};
	
	
	service.getTiedExpenditureList = function( finyear,reportType) {
		return $http.get("getTiedExpenditureData.do?finyear="+finyear+"&reportType="+reportType, {});
	};
	
	service.getDistrictTiedExpList = function(finyear,reportType,StateId) {
		return $http.get("getDistrictTExpData.do?finyear="+finyear+"&reportType="+reportType+"&StateId="+StateId, {});
	};
	
	service.getVillDistTiedExpList = function(finyear,reportType,StateId,glbCode) {
		return $http.get("getVillageDistTExp.do?finyear="+finyear+"&reportType="+reportType+"&StateId="+StateId+"&glbCode="+glbCode, {});
	};
	
	service.getOnBoardDashboardDataList = function( finyear) {
		return $http.get("getOnBoardDashboardDataList.do?finyear="+finyear, {});
	};
	service.getAuditData = function( finyear) {
		 return $http.get("http://auditonline.gov.in/demo/financialYearWiseGeneratedReport.htm?finyear="+finyear);
	};
	
	return service;
}]);
