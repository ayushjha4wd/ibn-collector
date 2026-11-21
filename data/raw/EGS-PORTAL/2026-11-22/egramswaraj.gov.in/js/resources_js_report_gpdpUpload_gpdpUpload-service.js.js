gpdpUploadModule.service('gpdpUploadService', [ '$http', function($http) {
	
  var service = {};
 
  service.findStateWise = function(year) {
	  return $http.get("gpdpUploadStateReport.do?year="+year,{});
  };
  service.findDistrictCountForGP = function(stateId, year) {
	  return $http.get("gpdpUploadZpReport.do?stateId="+stateId+"&year="+year,{});
  };
  service.findBlockCountForGP = function(stateId, code, year) {
	  return $http.get("gpdpUploadBpReport.do?stateId="+stateId+"&code="+code+"&year="+year,{});
  };
  service.findVillageWise = function(stateId, code, year) {
	  return $http.get("gpdpUploadGpReport.do?stateId="+stateId+"&code="+code+"&year="+year,{});
  };
  return service;

} ]);


