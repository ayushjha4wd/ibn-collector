omExpenditureReportModule.service('omExpenditureReportService', ['$http', function($http) {
	
	  var service = {};

	  service.getAccountDetails = function(statecode,finyear) {
		  return $http.get("getStateDetails.do?statecode="+statecode+"&finyear="+finyear,{});
	  };
	  
	  service.getDistictForState = function(statecode,finyear) {
		  return $http.get("getDistictForState.do?statecode="+statecode+"&finyear="+finyear,{});
	  };
	  
	  service.getBlockList = function(distcode,finyear,AccountUnit,displayFlag) {
		 
		  return $http.get("getBlockList.do?distcode="+distcode+"&finyear="+finyear+"&AccountUnit="+AccountUnit+"&displayFlag="+displayFlag,{});

	  };
	  
	
	  service.getBlockByState = function(finyear,StateId,AccountSelect,distcode) {
			 
		  return $http.get("getBlockByState.do?finyear="+finyear+"&statecode="+StateId+"&AccountUnit="+AccountSelect+"&distcode="+distcode,{});

	  };
		
	  service.getDistrictLinedept = function(finyear,statecode,accountUnit,districtcode) {
			 
		  return $http.get("getDistrictLine.do?finyear="+finyear+"&statecode="+statecode+"&accountUnit="+accountUnit+"&districtcode="+districtcode,{});

	  };
	  
	  
	  service.getvillage = function(finyear,statecode,accountUnit,districtcode) {
			 
		  return $http.get("getvillage.do?finyear="+finyear+"&statecode="+statecode+"&accountUnit="+accountUnit+"&districtcode="+districtcode,{});

	  };
	  
	  service.getDistictList = function(statecode,finyear) {
		  return $http.get("getDistictList.do?statecode="+statecode+"&finyear="+finyear,{});
	  };
	  
	  service.getDistictListByTypeCode = function(statecode,finyear,typeCode) {
		  return $http.get("getDistrictListByLocalBodyType.do?statecode="+statecode+"&finyear="+finyear+"&typeCode="+typeCode,{});
	  };
	  
	  service.getBlockLinedept = function(finyear,statecode,accountUnit,blockCode) {
			 
		  return $http.get("getBlockLinedept.do?finyear="+finyear+"&statecode="+statecode+"&accountUnit="+accountUnit+"&blockCode="+blockCode,{});

	  };
	  
	  service.getSchemeList = function(entityCode, finYear, entityType, stateId) {
		  return $http.get("schemeList.do?entityCode="+entityCode+"&finYear="+finYear+"&entityType="+entityType+"&stateId="+stateId,{});
	  };
	  
	  service.getSchemeComponentList = function(schemeId) {
			return $http.get("getSchemeComponentList.do?schemeId="+schemeId, {});
		};

	

	  return service;

} ]);
