var objHeadWiseExpenditureReportModule = angular.module('objHeadWiseExpenditureReportModule', ['angular.filter']);
objHeadWiseExpenditureReportModule.controller("objHeadWiseExpenditureReportController", ['$scope', "objHeadWiseExpenditureReportService", function($scope, objHeadWiseExpenditureReportService) {
	$scope.details = {};
	$scope.district = {};
	$scope.block = {};
	$scope.allvillage = {};
	$scope.districtLine = {};
	$scope.blockline = {};
	$scope.schemeList = {};
	$scope.StateId = null;
	$scope.finyear = null;
	$scope.levelflag = null;
	$scope.localbodycodeid = null;
	$scope.displayFlagId = null;
	$scope.levelflagId = null;
	$scope.secondlevelflagId = null;
	$scope.DistrictselectId = null;
	$scope.BlockselectId = null;
	$scope.entityCode = null;
	$scope.reportType = null;
	
	$scope.clearSelections = function clearSelections() {
		$scope.details = {};
		$scope.district = {};
		$scope.block = {};
		$scope.allvillage = {};
		$scope.districtLine = {};
		$scope.blockline = {};
		
		$scope.localbodycodeid = null;
		$scope.displayFlagId = null;
		$scope.levelflagId = null;
		$scope.secondlevelflagId = null;
		$scope.DistrictselectId = null;
		$scope.BlockselectId = null;
		$scope.StateId = null;
		$scope.ModelName = null;
		$scope.schemeChildDetails = null;
		$scope.DestrictDetails = null;
		$scope.BlockDetailss = null;
		$scope.villagecode = null;
		$scope.districtLinedep = null;
		$scope.blockLinedep = null;
		
		$scope.schemeList = {};
		$scope.componentList = {};
		
		$("#AcountUnitId").addClass("hidden");
		$("#DistrictId").addClass("hidden");
		$("#BlockId").addClass("hidden");
		$("#villageId").addClass("hidden");
		$("#BlockLineId").addClass("hidden");
		$("#districtLinedepId").addClass("hidden");
	}
	
	$scope.statedetails = function statedetails(ModelName)  {
		$scope.details = {};
		$scope.district = {};
		$scope.block = {};
		$scope.allvillage = {};
		$scope.districtLine = {};
		$scope.blockline = {};
		
		$scope.localbodycodeid = null;
		$scope.displayFlagId = null;
		$scope.levelflagId = null;
		$scope.secondlevelflagId = null;
		$scope.DistrictselectId = null;
		$scope.BlockselectId = null;
		$scope.schemeChildDetails = null;
		$scope.DestrictDetails = null;
		$scope.BlockDetailss = null;
		$scope.villagecode = null;
		$scope.districtLinedep = null;
		$scope.blockLinedep = null;
		
		$scope.finyear = document.getElementById("yearid").value;
		if($scope.finyear == null || $scope.finyear == "") {
			$scope.finyear = null;
			$scope.ModelName = null;
			bootbox.alert("Please Select Financial Year");
			return false;
		} else {
			$("#AcountUnitId").addClass("hidden");
			$("#DistrictId").addClass("hidden");
			$("#BlockId").addClass("hidden");
			$("#villageId").addClass("hidden");
			$("#BlockLineId").addClass("hidden");
			$("#districtLinedepId").addClass("hidden");
			$scope.StateId = ModelName;
			getAccountDetails($scope.StateId, $scope.finyear);
		}
	}
		
	function getAccountDetails(statecode, finyear) {
		$("#AcountUnitId").removeClass("hidden");
		$("#DistrictId").addClass("hidden");
		$("#BlockId").addClass("hidden");
		$("#villageId").addClass("hidden");
		$("#BlockLineId").addClass("hidden");
		$("#districtLinedepId").addClass("hidden");
		$scope.details = {};
		var accountunit = null;
		$scope.localbodycodeid = null;
		objHeadWiseExpenditureReportService.getAccountDetails(statecode, finyear).then(function(response) {
			$scope.details = response.data;
			var localbodyCode = null;
			for(var i=0; i< $scope.details.length;i++) {
			   accountunit = $scope.details[i].localBodyCode;
			   if(localbodyCode != null) {
				   localbodyCode = localbodyCode + "," + accountunit
			   } else {
				   localbodyCode = accountunit;
			   }
			 }
			$scope.localbodycodeid = localbodyCode;
	    });
	}
	
	
   $scope.accountdetails = function accountdetails(accountdetail) {
		$scope.displayFlagId = null;
		$scope.levelflagId = null;
		$scope.secondlevelflagId = null;
		$scope.DistrictselectId = null;
		$scope.BlockselectId = null;
		$scope.DestrictDetails = null;
		$scope.BlockDetailss = null;
		$scope.villagecode = null;
		$scope.districtLinedep = null;
		$scope.blockLinedep = null;
		
		$scope.district = {};
		$scope.block = {};
		$scope.allvillage = {};
		$scope.districtLine = {};
		$scope.blockline = {};
		$scope.schemeList = {};
		
	   	$scope.levelflag = accountdetail;
	   	$("#DistrictId").addClass("hidden");
	   	$("#BlockId").addClass("hidden");
	   	$("#villageId").addClass("hidden");
	   	$("#BlockLineId").addClass("hidden");
	   	$("#districtLinedepId").addClass("hidden");
		if(angular.equals($scope.localbodycodeid, "3") || angular.equals($scope.localbodycodeid, "1,2,3") 
		|| angular.equals($scope.localbodycodeid, "1,2,3,11") || angular.equals($scope.localbodycodeid, "1,2,14,3,11")) {
			$scope.displayFlagId = "A";
			ParentwiselbList($scope.displayFlagId, accountdetail);
		} else if(angular.equals($scope.localbodycodeid, "1,3")) {
			$scope.displayFlagId = "ZG";
			ParentwiselbList($scope.displayFlagId, accountdetail);
		} else if(angular.equals($scope.localbodycodeid, "1,2")) {
			$scope.displayFlagId = "ZI";
		    ParentwiselbList($scope.displayFlagId, accountdetail);
		} else if(angular.equals($scope.localbodycodeid, "2,3")) {
			$scope.displayFlagId = "IG";
			$("#DistrictId").addClass("hidden");
			getBlockList();
		} else if(angular.equals($scope.localbodycodeid, "3")) {
			$scope.displayFlagId = "GP";
		}
		if(angular.equals($scope.localbodycodeid, "1,2,3,20,21") || angular.equals($scope.localbodycodeid, "1,2,3,20,21,10,18,15,16")) {
			$scope.displayFlagId = "AB";
			ParentwiselbList($scope.displayFlagId, accountdetail);
		}
   }
	
   function ParentwiselbList(displayflag, accountdetail) {
	   $("#BlockId").addClass("hidden");
	   $("#villageId").addClass("hidden");
	   $("#BlockLineId").addClass("hidden");
	   $("#districtLinedepId").addClass("hidden");
	   $("#DistrictId").removeClass("hidden");
	   $scope.district = {};
	   var distictForState = null;
	   if(angular.equals(accountdetail, "20") || angular.equals(accountdetail, "21")) {
		   if(angular.equals(accountdetail, "21")) { 
			   $scope.levelflagId = "getBlockList";
		   } else if(angular.equals(accountdetail, "20")) { 
			   $scope.levelflagId = "getDistrictLinedepList";
		   }
		   distictForState = objHeadWiseExpenditureReportService.getDistictForState($scope.StateId, $scope.finyear);
   		} else if(displayflag == 'A' || displayflag == 'AB' || displayflag == 'GI') {
   			if(angular.equals(accountdetail, "1") == false) {
   				$scope.levelflagId = "getBlockList";
   			}
   			distictForState = objHeadWiseExpenditureReportService.getDistictList($scope.StateId, $scope.finyear);
   		} else if(displayflag == 'ZG') {
   			distictForState = objHeadWiseExpenditureReportService.getDistictList($scope.StateId, $scope.finyear);
   			if(angular.equals(accountdetail, "1") == false) {
   				$scope.levelflagId = "getVillageList";
   			}
   		}

	   distictForState.then(function(response) {
		   $scope.data = response.data;
		   var districtDetail = new Array();
		   angular.forEach($scope.data, function(obj, key) {
			   var district = new DestrictDetails();
			   district.districtid = obj.localBodyCode;
			   district.districtName = obj.localBodyNameEnglish;
			   districtDetail.push(district);
		   });	
		   $scope.district = districtDetail;
	   });
   }
		
   $scope.districtdetails = function districtdetails(districtmodel)  {
	   $scope.secondlevelflagId = null;
	   $scope.DistrictselectId = null;
	   $scope.BlockselectId = null;
	   $scope.BlockDetailss = null;
	   $scope.villagecode = null;
	   $scope.districtLinedep = null;
	   $scope.blockLinedep = null;
		
	   $scope.block = {};
	   $scope.allvillage = {}; 
	   $scope.districtLine = {};
	   $scope.blockline = {};
	   $scope.schemeList = {};
	   
	   $("#BlockId").addClass("hidden");
	   $("#villageId").addClass("hidden");
	   $("#BlockLineId").addClass("hidden");
	   $("#districtLinedepId").addClass("hidden");
	   $scope.DistrictselectId = districtmodel;
	   if($scope.levelflag != 1 && $scope.levelflagId != 1) {
		   if($scope.levelflagId == 'getBlockList') {
			   getBlockList();
		   } else if($scope.levelflagId == 'getDistrictLinedepList') {
			   getDistrictLinedepList();
		   } else if($scope.levelflagId == 'getVillageList') {
			   getVillageList(); 
		   }
	   } else {
		   $scope.entityCode = districtmodel;
	   }
   }
   
   function getBlockList() {
	   $("#districtLinedepId").addClass("hidden");
	   $("#villageId").addClass("hidden");
	   $("#BlockLineId").addClass("hidden");
	   $("#BlockId").removeClass("hidden");
	   $scope.block = {}; 
	   var distcode = null;
       var blocklist = null;
			
       if($scope.displayFlagId == 'A' || $scope.displayFlagId == 'AB' || $scope.displayFlagId == 'GI') {
			distcode = $scope.DistrictselectId;
       } else if($scope.displayFlagId == 'IG') {
    	   distcode = $scope.StateId;
    	   $("#DistrictId").addClass("hidden");
       }
				
       if($scope.levelflag == '2' || $scope.levelflag == '3' || $scope.levelflag == '14' || $scope.levelflag == '11' || $scope.levelflag == '21') {
    	   if($scope.levelflag == '2' || $scope.levelflag == '3' || $scope.levelflag == '14' || $scope.levelflag == '11') {
    		   if($scope.displayFlagId == 'A' || $scope.displayFlagId == 'AB' || $scope.displayFlagId == 'GI' || $scope.displayFlagId == 'IG') {
    			   if($scope.levelflag == '3' || $scope.levelflag == '11') {
    				   $scope.secondlevelflagId = 'getVillageList';
    			   }
    		   }
    		   blocklist = objHeadWiseExpenditureReportService.getBlockList(distcode, $scope.finyear, $scope.levelflag, $scope.displayFlagId);
    	   } else if($scope.levelflag == '21') { 
    		   $scope.secondlevelflagId = 'getBlockLinedepList';
    		   blocklist = objHeadWiseExpenditureReportService.getBlockByState($scope.finyear, $scope.StateId, $scope.levelflag, distcode);
    	   }
       } else {
    	   return false;
       }
       blocklist.then(function(response) {
    	   $scope.data = response.data;
    	   var blockDetail = new Array();
    	   angular.forEach($scope.data, function(obj, key) {
    		   var blocks = new BlockDetails();
    		   blocks.blockid = obj.localBodyCode;
    		   blocks.blockName = obj.localBodyNameEnglish;
    		   blockDetail.push(blocks);
    	   });	
    	   $scope.block = blockDetail;
       });
   }
	 
   function getDistrictLinedepList() {
	   $("#BlockId").addClass("hidden");
	   $("#villageId").addClass("hidden");
	   $("#BlockLineId").addClass("hidden");
	   $("#districtLinedepId").removeClass("hidden");
	   
	   $scope.districtLine = {};
	   objHeadWiseExpenditureReportService.getDistrictLinedept($scope.finyear, $scope.StateId, $scope.levelflag, $scope.DistrictselectId).then(function(response) {
		   $scope.data = response.data;
		   var districtLineDetail = new Array();
		   angular.forEach($scope.data, function(obj, key) {
			   var districtLine = new districtLinedepList();
			   districtLine.districtLineid = obj.localBodyCode;
			   districtLine.districtLineName = obj.localBodyNameEnglish;
			   districtLineDetail.push(districtLine);
		   });	
		   $scope.districtLine = districtLineDetail;
	   });
   }
	 
   $scope.blockdetaill = function blockdetaill(blockmodel) {
	   $scope.BlockselectId = null;
	   $scope.villagecode = null;
	   $scope.districtLinedep = null;
	   $scope.blockLinedep = null;
	   
	   $scope.BlockselectId = blockmodel;
	   $scope.allvillage = {};
	   $scope.blockline = {};
	   if($scope.secondlevelflagId == 'getVillageList') {
		   getVillageList();
	   } else if($scope.secondlevelflagId == 'getBlockLinedepList') {
		   getBlockLinedepList();
	   } else {
		   $scope.entityCode = blockmodel;
	   }
	   return false;
   } 
   
   function getVillageList() {
	   $("#districtLinedepId").addClass("hidden");
	   $("#BlockLineId").addClass("hidden");
	   $("#villageId").removeClass("hidden");
	   $scope.allvillage = {};
	   var districtcode;
	   if($scope.displayFlagId == 'ZG') {
		   districtcode = $scope.DistrictselectId;
	   } else {
		   districtcode = $scope.BlockselectId;
	   }
	   objHeadWiseExpenditureReportService.getvillage($scope.finyear, $scope.StateId, $scope.levelflag, districtcode).then(function(response) {
		   $scope.data = response.data;
		   var villageDetail = new Array();
		   angular.forEach($scope.data, function(obj, key) {
			   var villages= new villageList();
			   villages.villageid = obj.localBodyCode;
			   villages.villageName = obj.localBodyNameEnglish;
			   villageDetail.push(villages);
		   });	
		   $scope.allvillage = villageDetail;
	   });
   }
   
   function getBlockLinedepList() {
	   $("#districtLinedepId").addClass("hidden");
	   $("#villageId").addClass("hidden");
	   $("#BlockLineId").removeClass("hidden");
	   $scope.blockline = {};

	   objHeadWiseExpenditureReportService.getBlockLinedept($scope.finyear, $scope.StateId, $scope.levelflag, $scope.BlockselectId).then(function(response) {
		   $scope.data = response.data;
		   var blocklineDetail = new Array();
		   angular.forEach($scope.data, function(obj, key) {
			   var blockline= new blockLineList();
			   blockline.blocklineid = obj.localBodyCode;
			   blockline.blocklineName = obj.localBodyNameEnglish;
			   blocklineDetail.push(blockline);
		   });	
		   $scope.blockline = blocklineDetail;
	   });
   }
   
   $scope.showHeads = function showHeads(val) {
		$scope.clearSelections();
		if(val == 'M') {
			$("#monthDiv").show();
		} else{
			$("#monthDiv").hide();
		}
	}
   
   $scope.setEntityCode = function setEntityCode(code) {
	   $scope.entityCode = code;
   } 
   
   $scope.getScheme = function getScheme(value) {
	   if(value == 'A') {
		   $("#schemeDiv").hide();
			$("#componentDiv").show();
			$scope.getComponentList(0);
		} else if (value == 'I'){
			$("#schemeDiv").show();
			$("#componentDiv").hide();
			getSchemeData(value);
		}
   }
  
 
   	function getSchemeData(value) {
   		$("#schemeDiv").show();
   		$("#componentDiv").hide();
   		objHeadWiseExpenditureReportService.getSchemeList($scope.entityCode, $scope.finyear, $scope.levelflag, $scope.StateId).then(function(response) {
		   var schemeDetail = new Array();
		   angular.forEach(response.data, function(obj, key) {
			   var scheme = new schemeDetails();
			   scheme.schemeId = obj.schemeid;
			   if(obj.scheme_category == 'A') {
				   scheme.schemeCategory = "Other Resources";
			   } else if(obj.scheme_category == 'C') {
				   scheme.schemeCategory = "Central Schemes";
			   } else if(obj.scheme_category == 'S') {
				   scheme.schemeCategory = "State Schemes";
			   } else {
				   scheme.schemeCategory = obj.scheme_category;
			   }
			   scheme.schemeName = obj.resourcedesc + "-" + obj.schemename_abbreviation;
			   schemeDetail.push(scheme);
		   });	
		   $scope.schemeList = schemeDetail;
   		});
   	}
   	
   	
   	$scope.getComponentList = function getComponentList(val) {
   		$("#componentDiv").show();
   		$scope.schemeCode= val;
   		objHeadWiseExpenditureReportService.getSchemeComponentList($scope.StateId, $scope.entityCode, $scope.finyear,  $scope.levelflag, $scope.schemeCode).then(function(response) {
   		 var objDetail = new Array();
   		 angular.forEach(response.data, function(obj, key) {
   			 var object = new objectDetails();
   			 object.descriptionId = obj.descriptionId;
   			 if(obj.accountHeadType1 == 'R'){
   				 object.accountHeadType1 = "Receipt";
   			 }else if (obj.accountHeadType1 == 'E') {
   				 object.accountHeadType1 = "Expenditure";
   			 }
   			 object.description = obj.objectcode + "-" + obj.description;
   			 objDetail.push(object);
		});
   		 $scope.componentList = objDetail;
   		});
	}
   	
   
	
   
   
}]);





