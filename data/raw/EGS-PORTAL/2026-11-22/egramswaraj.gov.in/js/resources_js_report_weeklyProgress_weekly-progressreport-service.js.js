weeklyProgressModel.service('weeklyProgressService', [ '$http', function($http) {
  var service = {};
  service.search = function(fromDate, toDate, stateCode) {
	  var url = "weeklyProgressGraphData.do?fromDate="+fromDate+"&toDate="+toDate+"&stateCode="+stateCode;
	  return $http.get(url,{});
  };
  return service;
}]);