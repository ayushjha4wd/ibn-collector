zpPlanUploadModule.service('zpPlanUploadService',['$http',function($http){
	var service={};
	service.findStateWise= function(year){
		return $http.get("zpPlanUpdateStateReport.do?year="+year,{});
	};
	service.findDistrictWise=function(stateId,year){
		return $http.get("zpPlanUpdateZpReport.do?stateId="+stateId+"&year="+year,{});
	};
	return service;
}]);