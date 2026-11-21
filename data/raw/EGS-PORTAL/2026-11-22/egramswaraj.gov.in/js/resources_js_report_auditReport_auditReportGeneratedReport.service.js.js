auditReportGeneratedReportModule.service('auditReportGeneratedReportService', [ '$http', function($http) {
	
  var service = {};
 
  service.searchForAuditee = function(year) {
	  return $http.get("https://auditonline.gov.in/auditReportGeneratedReportStateWise.htm?year="+year+"&flag=P");
  };
  service.searchDistrict = function(year,stateId) {
	  return $http.get("https://auditonline.gov.in/auditReportGeneratedReportDistrictWise.htm?year="+year+"&stateCode="+stateId+"&flag=P");
  };
  service.searchBlock = function(year,districtCode) {
	  return $http.get("https://auditonline.gov.in/auditReportGeneratedReportBlockWise.htm?year="+year+"&districtCode="+districtCode+"&flag=P");
  };
  service.searchGP = function(year,blockCode) {
	  return $http.get("https://auditonline.gov.in/auditReportGeneratedDetail.htm?year="+year+"&blockCode="+blockCode+"&flag=P");
  };
  service.prepareBlockByState = function(year,stateCode) {
	  return $http.get("https://auditonline.gov.in/auditReportGeneratedReportBlockWiseByState.htm?year="+year+"&stateCode="+stateCode+"&flag=P");
  };
  service.searchGPByDistrict = function(year,districtCode) {
	  return $http.get("https://auditonline.gov.in/auditReportGeneratedDetailByDistrict.htm?year="+year+"&districtCode="+districtCode+"&flag=P");
  };
  service.searchGPByState = function(year,stateCode) {
	  return $http.get("https://auditonline.gov.in/auditReportGeneratedDetailByState.htm?year="+year+"&stateCode="+stateCode+"&flag=P");
  };
  return service;

} ]);