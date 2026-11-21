geoTaggingModule.service('geoTaggingService', [ '$http', function($http) {
	
  var service = {};
 
  service.findStateWise = function(year) {
	  return $http.get("geoTaggingStateReport.do?year="+year,{});
  };
  service.findDistrictCountForGP = function(stateId, year) {
	  return $http.get("geoTaggingZpReport.do?stateId="+stateId+"&year="+year,{});
  };
  service.findBlockCountForGP = function(stateId, code, year) {
	  return $http.get("geoTaggingBpReport.do?stateId="+stateId+"&code="+code+"&year="+year,{});
  };
  service.findVillageWise = function(stateId, code, year) {
	  return $http.get("geoTaggingGpReport.do?stateId="+stateId+"&code="+code+"&year="+year,{});
  };
  return service;

} ]);


