centerLevelModule.service('centerLevelService', [ '$http', function($http) {
	
  var service = {};
 
  service.findYear = function(year) {
	  return $http.get("https://auditonline.gov.in/centerLevelCount.htm?year="+year);
  };
  service.getTotalCount = function(stateCode) {
	  return $http.get("https://auditonline.gov.in/totalCount.htm?stateCode="+stateCode);
  };
  service.search = function(year) {
	  return $http.get("https://auditonline.gov.in/centerLevelByYear.htm?year="+year+"&flag=P");
  };
  service.searchAuditorInternal = function(year) {
	  return $http.get("https://auditonline.gov.in/auditordetails.htm?year="+year);
  };
  service.searchForAuditor = function(year) {
	  return $http.get("https://auditonline.gov.in/centerLevelByYearForAuditor.htm?year="+year);
  };
  service.searchDistrict = function(year,stateId) {
	  return $http.get("https://auditonline.gov.in/centerLevelByYearAndState.htm?year="+year+"&stateId="+stateId+"&flag=P");
  };
  service.searchBlock = function(year,stateId,districtCode) {
	  return $http.get("https://auditonline.gov.in/centerLevelByYearAndDistrict.htm?year="+year+"&districtCode="+districtCode+"&stateId="+stateId+"&flag=P");
  };
  service.searchDistrictForAuditor = function(year,stateId) {
	  return $http.get("https://auditonline.gov.in/centerLevelByYearAndStateForAuditor.htm?year="+year+"&stateId="+stateId);
  };
  service.searchGP = function(year,blockCode) {
	  return $http.get("https://auditonline.gov.in/centerLevelByYearAndBlock.htm?year="+year+"&blockCode="+blockCode+"&flag=P");
  };
  service.searchGPByDistrict = function(year,districtId) {
	  return $http.get("https://auditonline.gov.in/centerLevelByYearAndDistrictGP.htm?year="+year+"&districtId="+districtId+"&flag=P");
  };
  service.searchAuditor = function(year,districtId,stateCode) {
	  return $http.get("https://auditonline.gov.in/centerLevelByYearAnddistrictAuditor.htm?year="+year+"&districtCode="+districtId+"&stateCode="+stateCode);
  };
  service.searchAuditorForHr = function(year,stateId) {
	  return $http.get("https://auditonline.gov.in/centerLevelByYearAndStateAuditorHr.htm?year="+year+"&stateCode="+stateId);
  };
  service.searchAuditPlanForHr = function(year,stateId) {
	  return $http.get("https://auditonline.gov.in/centerLevelByYearAndStateHr.htm?year="+year+"&stateId="+stateId+"&flag=P");
  };
  service.searchAuditorDetails = function(year,districtId,userId,stateCode) {
	  return $http.get("https://auditonline.gov.in/auditorAssignedDetails.htm?year="+year+"&districtCode="+districtId+"&userId="+userId+"&stateCode="+stateCode);
  };
  service.searchMappedAuditor = function(year,auditeeCode) {
	  return $http.get("https://auditonline.gov.in/mappedAuditorDetails.htm?year="+year+"&auditeeCode="+auditeeCode+"&flag=P");
  };
  return service;

} ]);