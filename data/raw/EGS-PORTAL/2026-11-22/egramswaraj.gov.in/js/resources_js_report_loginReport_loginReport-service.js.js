loginReportModel.service('loginReportService', [ '$http', function($http) {
	
  var service = {};
 
  service.search = function(fromDate,toDate) {
	  var url = "loginReportData.do?fromDate="+fromDate+"&toDate="+toDate;
	  
	  console.log(url);
	 
	  return $http.get(url,{});
  };

  return service;

} ]);


