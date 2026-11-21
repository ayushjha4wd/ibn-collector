observationCountModule.service('observationCountService', [ '$http', function($http) {
	
  var service = {};
 
  service.getState = function(year) {
	  return $http.get("https://auditonline.gov.in/observationCountStateReport.htm?year="+year+"&flag=P");
  };
  service.getCategory = function(year, stateId) {
	  return $http.get("https://auditonline.gov.in/observationCountCategoryReport.htm?year="+year+"&stateId="+stateId+"&flag=P");
  };
  service.getSubcategory = function(year, stateId, categoryId) {
	  return $http.get("https://auditonline.gov.in/observationCountSubCategoryReport.htm?year="+year+"&stateId="+stateId+"&categoryId="+categoryId+"&flag=P");
  };
 
  return service;

} ]);