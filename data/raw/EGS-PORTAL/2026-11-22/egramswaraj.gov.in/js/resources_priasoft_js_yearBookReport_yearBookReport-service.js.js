yearBookReportModule.service('yearBookReportService',['$http',function($http){
	var service={};
	
	service.findStateWise = function(finYear) {
		return $http.get("getYearBookDrill.do?finYear="+finYear, {});
	};
	
	return service;
}]);