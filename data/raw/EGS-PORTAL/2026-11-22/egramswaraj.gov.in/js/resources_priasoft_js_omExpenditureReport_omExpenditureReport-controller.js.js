var omExpenditureReportModule = angular.module('omExpenditureReportModule', ['angular.filter']);
omExpenditureReportModule.controller("omExpenditureReportController", ['$scope', "omExpenditureReportService", function($scope, omExpenditureReportService) {
	$scope.details = {};
	$scope.district = {};
	$scope.block = {};
	$scope.allvillage = {};
	$scope.districtLine = {};
	$scope.blockline = {};
	$scope.schemeList = {};
	
	$scope.finyear = null;
	$scope.StateId = null;
	$scope.levelflag = null;
	$scope.localbodycodeid = null;
	$scope.displayFlagId = null;
	$scope.levelflagId = null;
	$scope.secondlevelflagId = null;
	$scope.DistrictselectId = null;
	$scope.BlockselectId = null;
	
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
			var reportType =  $('input[name=reportType]:checked').val();
			if(reportType == 'A'){
				$scope.levelflag = 0;
				$("#AcountUnitId").addClass("hidden");
				 getSchemeData($scope.StateId);
			}else{
				$("#AcountUnitId").removeClass("hidden");
				getAccountDetails($scope.StateId, $scope.finyear);
				
			}
			/* getSchemeData(ModelName);*/
			
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
		omExpenditureReportService.getAccountDetails(statecode, finyear).then(function(response) {
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
	   	
	   
	   	
		if(angular.equals($scope.localbodycodeid, "3") || angular.equals($scope.localbodycodeid, "1,2,3") || angular.equals($scope.localbodycodeid, "1,2,14,3,11,13")
				|| angular.equals($scope.localbodycodeid, "1,2,3,11,19") || angular.equals($scope.localbodycodeid, "1,2,3,11") || angular.equals($scope.localbodycodeid, "1,2,14,3,11")|| angular.equals($scope.localbodycodeid, "1,2,3,20") 
				 || angular.equals($scope.localbodycodeid, "1,2,3,20,21,10,18,15,16") ) {
			$scope.displayFlagId = "A";
			ParentwiselbList($scope.displayFlagId, accountdetail);
		} else if(angular.equals($scope.localbodycodeid, "1,3") || angular.equals($scope.localbodycodeid, "1,3,10,17")) {
			$scope.displayFlagId = "ZG";
			ParentwiselbList($scope.displayFlagId, accountdetail);
		} else if(angular.equals($scope.localbodycodeid, "1,2")) {
			$scope.displayFlagId = "ZI";
		    ParentwiselbList($scope.displayFlagId, accountdetail);
		} else if(angular.equals($scope.localbodycodeid, "2,3") || angular.equals($scope.localbodycodeid, "23,22")) {
			$scope.displayFlagId = "IG";
			$("#DistrictId").addClass("hidden");
			getBlockList();
		} else if(angular.equals($scope.localbodycodeid, "3") || angular.equals($scope.localbodycodeid, 11) || angular.equals($scope.localbodycodeid, 12)) {
			$scope.displayFlagId = "GP";
			$scope.accountdetail
			 getVillageList() ;
			
		}
		//if(angular.equals($scope.localbodycodeid, "1,2,3,20,21") || angular.equals($scope.localbodycodeid, "1,2,3,20,21,10,18,15,16")) {
			//$scope.displayFlagId = "AB";
			//ParentwiselbList($scope.displayFlagId, accountdetail);
		//}
		
	 /*	
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
		if(angular.equals($scope.localbodycodeid, "1,2,3,20,21")) {
			$scope.displayFlagId = "AB";
			ParentwiselbList($scope.displayFlagId, accountdetail);
		}*/
   }
	
   function ParentwiselbList(displayflag, accountdetail) {
	   $("#BlockId").addClass("hidden");
	   $("#villageId").addClass("hidden");
	   $("#BlockLineId").addClass("hidden");
	   $("#districtLinedepId").addClass("hidden");
	   $("#DistrictId").removeClass("hidden");
	   $scope.district = {};
	   var distictForState = null;
	   if(angular.equals(accountdetail, "210") || angular.equals(accountdetail, "211")) {
		   if(angular.equals(accountdetail, "21")) { 
			   $scope.levelflagId = "getBlockList";
		   } else if(angular.equals(accountdetail, "20")) { 
			   $scope.levelflagId = "getDistrictLinedepList";
		   }
		   distictForState = omExpenditureReportService.getDistictForState($scope.StateId, $scope.finyear);
   		} else if(displayflag == 'A' || displayflag == 'AB' || displayflag == 'GI') {
   			if(angular.equals(accountdetail, "13")) {
   				distictForState = omExpenditureReportService.getDistictListByTypeCode($scope.StateId, $scope.finyear,accountdetail);
   			}else{
	   			//if(angular.equals(accountdetail, "1") == false) {
	   				$scope.levelflagId = "getBlockList";
	   			//}
	   			distictForState = omExpenditureReportService.getDistictList($scope.StateId, $scope.finyear);
   			}
   		} else if(displayflag == 'ZG') {
   			distictForState = omExpenditureReportService.getDistictList($scope.StateId, $scope.finyear);
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
	   if($scope.levelflag == 13 || $scope.levelflag == 10 || $scope.levelflag == 18 ) {
		   getSchemeData(districtmodel);
	   }else if($scope.levelflag == 15 || $scope.levelflag == 16){
		   getVillageList(); 
	   }
	   else if($scope.levelflag != 1 && $scope.levelflagId != 1) {
		   if($scope.levelflagId == 'getBlockList') {
			   getBlockList();
		   } else if($scope.levelflagId == 'getDistrictLinedepList') {
			   getDistrictLinedepList();
		   } else if($scope.levelflagId == 'getVillageList') {
			   getVillageList(); 
		   }
	   } else {
			   getSchemeData(districtmodel);
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
				
       if($scope.levelflag == '2' || $scope.levelflag == '3' || $scope.levelflag == '14' || $scope.levelflag == '11' || $scope.levelflag == '21'|| $scope.levelflag == '20') {
    	   if($scope.levelflag == '2' || $scope.levelflag == '3' || $scope.levelflag == '14' || $scope.levelflag == '11'|| $scope.levelflag == '20') {
    		   if($scope.displayFlagId == 'A' || $scope.displayFlagId == 'AB' || $scope.displayFlagId == 'GI' || $scope.displayFlagId == 'IG') {
    			   if($scope.levelflag == '3' || $scope.levelflag == '11' || $scope.levelflag =='12'  || $scope.levelflag == '15' || $scope.levelflag =='16' || $scope.levelflag =='17' || $scope.levelflag =='22'  || $scope.levelflag == '20') {
    				   $scope.secondlevelflagId = 'getVillageList';
    			   }
    		   }
    		   blocklist = omExpenditureReportService.getBlockList(distcode, $scope.finyear, $scope.levelflag, $scope.displayFlagId);
    	   } else if($scope.levelflag == '21') { 
    		   $scope.secondlevelflagId = 'getBlockLinedepList';
    		   blocklist = omExpenditureReportService.getBlockByState($scope.finyear, $scope.StateId, $scope.levelflag, distcode);
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
	   omExpenditureReportService.getDistrictLinedept($scope.finyear, $scope.StateId, $scope.levelflag, $scope.DistrictselectId).then(function(response) {
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
		    
			   getSchemeData(blockmodel);
		   
	   }
	   return false;
   } 
   
   function getVillageList() {
	   $("#districtLinedepId").addClass("hidden");
	   $("#BlockLineId").addClass("hidden");
	   $("#villageId").removeClass("hidden");
	   $scope.allvillage = {};
	   if($scope.displayFlagId == 'GP'){
		   omExpenditureReportService.getDistictListByTypeCode($scope.StateId, $scope.finyear,$scope.levelflag).then(function(response) {
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
	   }else{
		   var districtcode;
		   if($scope.displayFlagId == 'ZG' || $scope.levelflag == 15 || $scope.levelflag == 16) {
			   districtcode = $scope.DistrictselectId;
		   } else {
			   districtcode = $scope.BlockselectId;
		   }
		   omExpenditureReportService.getvillage($scope.finyear, $scope.StateId, $scope.levelflag, districtcode).then(function(response) {
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
   }
   
   function getBlockLinedepList() {
	   $("#districtLinedepId").addClass("hidden");
	   $("#villageId").addClass("hidden");
	   $("#BlockLineId").removeClass("hidden");
	   $scope.blockline = {};

	   omExpenditureReportService.getBlockLinedept($scope.finyear, $scope.StateId, $scope.levelflag, $scope.BlockselectId).then(function(response) {
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
   
   $scope.setCalendar = function setCalendar(val) {
		if(val != "" || val != 0) {
			var sdate = new Date(val.split("-")[0] + "-4-1");
			var edate = new Date(val.split("-")[1] + "-3-31");
			$('#datePick').datepicker('setDate', sdate);
			$('#datePick').datepicker('setStartDate', sdate);
			$('#datePick').datepicker('setEndDate', edate);
		} 
	}
   
   $scope.setCashbookCalendar = function setCashbookCalendar(val) {
		if((val != "" || val != 0) && $("input[name='cashbookType']:checked").val() == 'D') {
			var sdate = new Date(val.split("-")[0] + "-4-1");
			var edate = new Date(val.split("-")[1] + "-3-31");
			$('#fromDate').datepicker('setDate', sdate);
			$('#fromDate').datepicker('setStartDate', sdate);
			$('#fromDate').datepicker('setEndDate', edate);
			$('#toDate').datepicker('setDate', sdate);
			$('#toDate').datepicker('setStartDate', sdate);
			$('#toDate').datepicker('setEndDate', edate);
		}
	}
   	$scope.setReportType = function setReportType(val) {

		$scope.schemeList = {};
		$scope.componentList = {};
   		$("#yearid").val('');
		$("#month").val(0);
		$("#fromDate").val('');
		$("#toDate").val('');
		$scope.finyear = null;
   		$scope.reportType = val;
		$scope.clearSelections();
   	}
   	$scope.showSchemeData = function showSchemeData(entityCode) {
		getSchemeData(entityCode);
   	}
   	function getSchemeData(entityCode) {
   		$("#schemeDiv").show();
   		$("#componentDiv").hide();
   		omExpenditureReportService.getSchemeList(entityCode, $scope.finyear, $scope.levelflag, $scope.StateId).then(function(response) {
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
   		omExpenditureReportService.getSchemeComponentList(val).then(function(response) {
			if(response.data.length != 0) {
				$scope.componentList = response.data;
			} else {
				$("#schemeChildId").empty();
				$("#schemeChildId").append("<option selected='selected' value=''>Select</option>");
				bootbox.alert("No Component found.")
			}
		});
	}
   	
   /*	$scope.showSchemeComponent = function showSchemeComponent(val) {
			$("#componentDiv").show();
	}*/
	$scope.showHeads = function showHeads(val) {
		$scope.clearSelections();
		if(val == 'H') {
			$("#objHeadDiv").show();
		} else{
			$("#objHeadDiv").hide();
		}

		if(val == 'A'){
			$("#AcountUnitId").addClass("hidden");
			/* getSchemeData($scope.ModelName);*/
		}else{
			$("#AcountUnitId").removeClass("hidden");
		
			
		}
	}
   	$scope.showDateMonth = function showDateMonth(val) {
   		
		if(val == 'D') {
			$("#monthDiv").hide();
			$("#dateRangeDiv1").show();
			$("#dateRangeDiv2").show();
			$("#schemeDiv").show();
			$("#componentDiv").hide();
		} else if(val == 'M') {
			$("#dateRangeDiv1").hide();
			$("#dateRangeDiv2").hide();
			$("#monthDiv").show();
			$("#schemeDiv").show();
			$("#componentDiv").hide();
		} else {
			$("#dateRangeDiv1").hide();
			$("#dateRangeDiv2").hide();
			$("#monthDiv").hide();
			$("#schemeDiv").show();
			$("#componentDiv").hide();
		}
		/*$("#yearid").val('');*/
		$("#month").val(0);
		$("#fromDate").val('');
		$("#toDate").val('');
		$scope.schemeUid = null;
		/*$("#schemeDiv").hide();*/
	/*	$scope.clearSelections();*/
	}
   
}]);





