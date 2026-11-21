bpPlanUploadModule.service('bpPlanUploadService',['$http',function($http){
	var service={};
	service.findStateWise=function(year){
		return $http.get("bpPlanUploadStateReport.do?year="+year,{});
	};
	
	service.findDistrictWise=function(stateId, year){
		return $http.get("bpPlanUploadDistrictReport.do?year="+year+"&stateId="+stateId,{});
	};
	
	service.findBlockWise=function(code, stateId, year){
		return $http.get("bpPlanUploadBPReport.do?stateId="+stateId+"&code="+code+"&year="+year,{});
	};
	return service;
}]);