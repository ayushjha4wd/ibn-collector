timeSeriesAnalysisModel.service('timeSeriesAnalysisService', [ '$http', function($http) {
  var service = {};
  service.search = function(fromDate,toDate,stateCode) {
	  var url = "timeProgressGraphData.do?fromDate="+fromDate+"&toDate="+toDate+"&stateCode="+stateCode;
	  return $http.get(url,{});
  };
  return service;
}]);