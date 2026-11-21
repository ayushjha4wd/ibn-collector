receiptRectificationModule.service('receiptRectificationService', ['$http', function($http) {
	var service = {};
	
	
	service.getdataList = function(finYear,stateCode) {
		 
		  return $http.get("getRectificationData.do?finYear="+finYear+"&stateCode="+stateCode,{});

	  }
	
	  
		
	 return service;

}]);