reportabstractModule.service('reportabstractService', ['$http', function($http) {
	
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
	  
	  service.getDistictList = function(statecode,finyear,typeCode) {
		  return $http.get("getDistictList.do?statecode="+statecode+"&finyear="+finyear+"&typeCode="+typeCode,{});
	  };
	  
	  service.getBlockLinedept = function(finyear,statecode,accountUnit,blockCode) {
			 
		  return $http.get("getBlockLinedept.do?finyear="+finyear+"&statecode="+statecode+"&accountUnit="+accountUnit+"&blockCode="+blockCode,{});

	  };
	  
	  service.getSchemeList = function(entityCode, finYear, entityType, stateId) {
		  return $http.get("schemeList.do?entityCode="+entityCode+"&finYear="+finYear+"&entityType="+entityType+"&stateId="+stateId,{});
	  };
	  
	  
	  
	  
	  
	  service.gethabitationwisestatus = function(panchayatid) {
		  return $http.get("gethabitationwisestatus.do?panchayatid="+panchayatid,{});
	  };
	  
	  //START JJM SERVICES SECTION
	  
	  service.getprofiledata = function(panchayatid) {
		  return $http.get("getprofiledata.do?panchayatid="+panchayatid,{});
	  };
	  
	  service.getBasicProfileData = function(panchayatid) {
		  return $http.get("getBasicProfileData.do?panchayatid="+panchayatid,{});
	  };
	  
	  service.getJJMVillageList = function(panchayatid,stateId) {
		  return $http.get("villageList/GetVillageWiseInformation.do?panchayatid="+panchayatid+"&stateId="+stateId,{});
	  };
	  
	  service.getJJMSchemedetails = function(panchayatid,stateId) {
		  return $http.get("schemeList/GetSchemeDetails.do?panchayatid="+panchayatid+"&stateId="+stateId,{});
	  };
	  
	  service.getBeneficiaryMasterData = function(villageid) {
		  return $http.get("getBeneficiaryMasterData.do?villageid="+villageid,{});
	  };
	  
	  service.getBeneficiaryMasterDataCount = function(panchayatid) {
		  return $http.get("getBeneficiaryMasterDataCount.do?panchayatid="+panchayatid,{});
	  };
	  
	  service.getJJMWaterSourceMaster = function(panchayatid,stateId) {
		  return $http.get("waterSources/GetWaterSourcesDetails.do?panchayatid="+panchayatid+"&stateId="+stateId,{});
	  };
	  
	  service.getJJMVillageLevelFunctionaries = function(panchayatid,stateId) {
		  return $http.get("villageLevel/GetVillageLevelFunctionaries.do?panchayatid="+panchayatid+"&stateId="+stateId,{});
	  };
	  
	  service.getWatarQualityStatusDetails = function(panchayatid,stateId) {
		  return $http.get("getWatarQualityStatusDetails.do?panchayatid="+panchayatid+"&stateId="+stateId,{});
	  };
	  
	  service.getJJMRateListDetails = function() {
		  return $http.get("getJJMRateListDetails.do",{});
	  };
	  
	  /*service.getJJMRateList = function() {
		  return $http.get("getJJMRateList.do",{});
	  };*/
	  
	  /*service.getWatarQualityStatus = function(panchayatid) {
		  return $http.get("getWatarQualityStatus.do?panchayatid="+panchayatid,{});
	  };*/
	  
	  //END JJM SERVICES SECTION
	  
	  service.getvillagewiseinformation = function(panchayatid) {
		  return $http.get("getvillagewiseinformation.do?panchayatid="+panchayatid,{});
	  };
	  
	  service.getvillagelevelfunctionaries = function(panchayatid) {
		  return $http.get("getvillagelevelfunctionaries.do?panchayatid="+panchayatid,{});
	  };
	  
	  
	  service.getvillagelevelfunctionariesQ = function(panchayatid) {
		  return $http.get("getvillagelevelfunctionariesQ.do?panchayatid="+panchayatid,{});
	  };
	  
	  
	  service.getschemedetails = function(panchayatid) {
		  return $http.get("getschemedetails.do?panchayatid="+panchayatid,{});
	  };
	  
	
	  
	  service.getwatersourcemaster = function(panchayatid) {
		  return $http.get("getwatersourcemaster.do?panchayatid="+panchayatid,{});
	  };
	  
	  

	  
	  service.getvillagelevelfunctionariesW = function(panchayatid) {
		  return $http.get("getvillagelevelfunctionariesW.do?panchayatid="+panchayatid,{});
	  };
	  
	 
	  
	  service.getvillagewiseinformationCount = function(panchayatid) {
		  return $http.get("getvillagewiseinformationCount.do?panchayatid="+panchayatid,{});
	  };
	  
	  
	
	  
	  
	  service.getVillageLevelCommittee = function(panchayatid) {
		  return $http.get("getVillageLevelCommittee.do?panchayatid="+panchayatid,{});
	  };
	
	  
	 
	 
	  
	  
	  
	
	  
	  
	  
	 
	  
	  service.gethabitationwisePopulation = function(panchayatid) {
		  return $http.get("gethabitationwisePopulation.do?panchayatid="+panchayatid,{});
	  };
	  
	  
	  
/*	  service.generateAnnualReport = function(AnnualReciept) {
		  
		  return $http.post("generateAnnualReport.htm",{});
		  
	  };
	  */

	  service.getStateTier = function(stateCode) {
			return $http.get("getStateTier.do?stateCode="+stateCode, {});
		};


		 service.getSBMODFPlusStatus = function(stateCode,panchayatid) {
			  return $http.get("swachhBharatMissionDashboard/SBMODFPlusStatus.do?stateCode="+stateCode+"&panchayatid="+panchayatid,{});
		  };
		  
		  
		  service.getODFPlusIndicators = function(stateCode,panchayatid) {
			  return $http.get("swachhBharatMissionDashboard/ODFPlusIndicators.do?stateCode="+stateCode+"&panchayatid="+panchayatid,{});
		  };
		  
		  service.getAssets = function(stateCode,panchayatid) {
			  return $http.get("swachhBharatMissionDashboard/getAssets.do?stateCode="+stateCode+"&panchayatid="+panchayatid,{});
		  };
		  
		  service.getAssetsDeatils = function(stateCode,panchayatid) {
			  return $http.get("swachhBharatMissionDashboard/getAssets/details.do?stateCode="+stateCode+"&panchayatid="+panchayatid,{});
		  };
		  
		  service.getCommunitySanitaryComplex = function(stateCode,panchayatid) {
			  return $http.get("swachhBharatMissionDashboard/getCommunitySanitaryComplex.do?stateCode="+stateCode+"&panchayatid="+panchayatid,{});
		  };

		  
		  service.getIHHLBeneficiaries = function(stateCode,panchayatid) {
			  return $http.get("swachhBharatMissionDashboard/getIHHLBeneficiaries.do?stateCode="+stateCode+"&panchayatid="+panchayatid,{});
		  };

		  service.getVoucherCountData = function(finYear) {
				return $http.get("getStateVoucherCountData.do?finYear="+finYear, {});
			};

	service.getDistrictVoucherCountData = function(finYear,stateId) {
				return $http.get("getDistrictVoucherCountData.do?finYear="+finYear+"&stateId="+stateId, {});
			};
			
			service.getBlockVoucherCountData = function(finYear,stateId) {
				return $http.get("getBlockVoucherCountData.do?finYear="+finYear+"&stateId="+stateId, {});
			};
			
			service.getZPWiseGPVoucherCountData = function(finYear,stateId) {
				return $http.get("getZPWiseGPVoucherCountData.do?finYear="+finYear+"&stateId="+stateId, {});
			};


	service.getZPGPVoucherCountData = function(finYear,stateId,zpCode) {
				return $http.get("getZPGPVoucherCountData.do?finYear="+finYear+"&stateId="+stateId+"&zpCode="+zpCode, {});
			};

	service.getGPVoucherDetailsData = function(finYear,stateId,lgdCode) {
				return $http.get("getGPVoucherDetailsData.do?finYear="+finYear+"&stateId="+stateId+"&lgdCode="+lgdCode, {});
			};
			
	service.getLbDetails = function(finYear,lgdCode) {
				return $http.get("getLbDetailsWithParent.do?finYear="+finYear+"&lgdCode="+lgdCode, {});
			};


	  return service;

} ]);
