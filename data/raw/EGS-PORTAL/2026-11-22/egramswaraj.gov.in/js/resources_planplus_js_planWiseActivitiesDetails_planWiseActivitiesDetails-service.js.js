planWiseActivitiesDetailsModule.service('planWiseActivitiesDetailsService', ['$http', function($http) {
	var service = {};
	
	service.getStateList = function() {
		 return $http.get("populateStateList.do",{});
	};
	
	service.getKpiPlanCount = function(stateCd,planYr) {
		return $http.get("getKpiPlanCount.do?stateCd="+stateCd+"&planYr="+planYr, {});
	};
	
	service.getPanchayatZpData = function(stateCd, planYr, level) {
		return $http.get("getPlanZpData.do?stateCd="+stateCd+"&planYr="+planYr+"&level="+level, {});
	};
	
	service.getPlanVpData = function(planYr, stateCd, zpCd, bpCd, typCd, level) {
		return $http.get("getPlanVpData.do?planYr="+planYr+"&stateCd="+stateCd+"&zpCd="+zpCd+"&bpCd="+bpCd+"&typCd="+typCd+"&level="+level, {});
	};
	
	service.getPlanDetails = function(stateCd, planYr, level, zpCd, bpCd, typCd) {
		return $http.get("getPlanDetails.do?stateCd="+stateCd+"&planYr="+planYr+"&level="+level+"&zpCd="+zpCd+"&bpCd="+bpCd+"&typCd="+typCd, {});
	};
	
	service.getActivityList = function(planCd, activityStts) {
		return $http.get("getActivityList.do?planCd="+planCd+"&activityStts="+activityStts, {});
	};
	
	service.getActivitySectionData = function(activityCd) {
		return $http.get("activitySectionData.do?activityCd="+activityCd, {});
	};
	
	service.getTechnicalApprovalSectionData = function(activityCd) {
		return $http.get("technicalApprovalSectionData.do?activityCd="+activityCd, {});
	};
	
	service.getAdminApprovalSectionData = function(activityCd) {
		return $http.get("admApprovalSectionData.do?activityCd="+activityCd, {});
	};
	
	service.getPhysicalProgressSectionData = function(activityCd) {
		return $http.get("physicalProgressSectionData.do?activityCd="+activityCd, {});
	};

	service.getExpenditureDetails = function(activityCd, planYr, stateCd, plnUntCd, outputType) {
		return $http.get("expenditureDetails.do?activityCd="+activityCd+"&planYr="+planYr+"&stateCd="+stateCd+"&plnUntCd="+plnUntCd+"&outputType="+outputType, {});
	};
	
	service.getAssetDetailsPopup = function(phyProgrssAstCd) {
		return $http.get("assetDetailsPopup.do?phyProgrssAstCd="+phyProgrssAstCd, {});
	};
	
	return service;
}]);
