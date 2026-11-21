ongoingActivityModule.service('ongoingActivityService', [ '$http', function($http) {
	
  var service = {};
 
  service.findStateWise = function(year) {
	  return $http.get("ongoingActivityStateReport.do?year="+year,{});
  };
  service.findDistrictCountForGP = function(stateId, year) {
	  return $http.get("ongoingActivityZpReport.do?stateId="+stateId+"&year="+year,{});
  };
  service.findBlockCountForGP = function(stateId, code, year) {
	  return $http.get("ongoingActivityBpReport.do?stateId="+stateId+"&code="+code+"&year="+year,{});
  };
  service.findVillageWise = function(stateId, code, year) {
	  return $http.get("ongoingActivityGpReport.do?stateId="+stateId+"&code="+code+"&year="+year,{});
  };
  return service;

} ]);


