var registeredVpReportModule = angular.module('registeredVpReportModule', ['angular.filter']);
registeredVpReportModule.controller("registeredVpReportController", ['$scope', "registeredVpReportService", function($scope, registeredVpReportService) {
	$("#stateCode_error").hide();
	$scope.stateList = {};
	$scope.districtList = {};
	$scope.countList = {};
	$scope.blockList = {};
	$scope.villageList = {};
	$scope.stateCode = '0';
	$scope.stateName = null;
	$scope.districtCode = "";
	$scope.districtName = null;
	$scope.blockName = null;
	$scope.blockCode = null;
	$scope.finYear = $("#finYear").val();
	$scope.loader = true;
	$scope.tableName= "pfms_agency_details";
	$scope.schDate = null;
	
	$scope.type='ZP';
	registeredSchemeList(0);
	$scope.showReportType = function showReportType(type){
		$scope.type=type;
		$scope.reportType=null;
		$scope.schemeList={};
		$scope.schemeCode = null;
		$scope.stateCode =  null;
		$("#state").hide();
		$("#schemeDiv").hide();
		$("#district").hide();
		$("#block").hide();
		$("#village").hide();
		$("#state").hide();
		$("#stateZp").hide();
		$("#stateBp").hide();
		$("#zpDetail").hide();
		$("#bpDetail").hide();
		
	}
	
	
	$scope.showScheme = function showScheme(val) {
		$("#state").hide();
		$("#district").hide();
		$("#block").hide();
		$("#village").hide();
		$("#state").hide();
		$("#stateZp").hide();
		$("#stateBp").hide();
		$("#zpDetail").hide();
		$("#bpDetail").hide();
		$scope.stateCode = '0';
		$scope.schemeCode = null;
		$scope.schemeName = null;
		if(val == 'C') {
			$("#stateDiv").hide();
			$("#schemeDiv").show();
			registeredSchemeList(0);
		} else {
			$("#stateDiv").show();
			getStateList();
			$("#schemeDiv").hide();
		}
	}
	
	function getStateList(){
		$scope.getStateList={};
		registeredVpReportService.getStateList().then(function(response) {
			$scope.getStateList = response.data;
			});
	}
	
	$scope.onState = function onState(stateCode) {
		$("#schemeDiv").show();
		//$scope.stateCode = stateCode;
		registeredSchemeList(stateCode);
	}
	
	function registeredSchemeList(stateCode) {
		$scope.stateCode = stateCode;
		/*$scope.stateList = { };*/
		registeredVpReportService.registeredSchemeList(stateCode, $scope.type ).then(function(response) {
			var schemeDetail = new Array();
			angular.forEach(response.data, function(obj, key) {
			   var scheme = new schemeDetails();
			   if(stateCode == 0) {
				   if(obj.scheme_category == 'A') {
					   scheme.schemeId = obj.schemeid;
					   scheme.schemeCategory = "Other Resources";
					   scheme.schemeName = obj.resourcedesc + "-" + obj.schemename_abbreviation;
				   } else if(obj.scheme_category == 'C') {
					   scheme.schemeId = obj.schemeid;
					   scheme.schemeCategory = "Central Schemes";
					   scheme.schemeName = obj.resourcedesc + "-" + obj.schemename_abbreviation;
				   }
				   schemeDetail.push(scheme);
			   } else {
				   if(obj.scheme_category == 'S') {
					   scheme.schemeId = obj.schemeid;
					   scheme.schemeCategory = "State Schemes";
					   scheme.schemeName = obj.resourcedesc + "-" + obj.schemename_abbreviation;
					   schemeDetail.push(scheme);
				   }
			   }
		   });	
		   $scope.schemeList = schemeDetail;
		   $scope.stateCode = stateCode;
		});
	}
	
	$scope.getStateDetails = function getStateDetails(schemeCode) {
		$scope.stateList = {};
		$scope.schemeCode = schemeCode;
		$scope.schemeName = $("#schemeCode option:selected").text();
		
		
		
		$("#zpDetail").hide();
		$("#bpDetail").hide();
		$("#state").hide();
		$("#stateZp").hide();
		$("#stateBp").hide();
		$("#district").hide();
		$("#block").hide();
		$("#village").hide();
		//$scope.stateCode = "9";
		registeredVpReportService.schedularDate(9,$scope.tableName).then(function(response) {
			$scope.schDate = response.data;
			
			if($scope.type == 'ZP'){
				$("#stateZp").show();
				getStateZpData(schemeCode,$scope.schDate);
			}else if($scope.type == 'BP'){
				$("#stateBp").show();
				getStateBpData(schemeCode,$scope.schDate);
			}else if($scope.type == 'VP'){
				$("#state").show();
				getStateData(schemeCode,$scope.schDate);
			}
			
			
		});
		
		
	}

	function getStateZpData(schemeCode,schDate) {
		$scope.schedularDate = schDate;
		$scope.stateZpList = { };
		$scope.loader = true;
		$scope.sumTotalCount = 0;
		$scope.sumPfmsCount = 0;
		$scope.sumIntegratedDsc = 0;
		$scope.sumNonIntegrated = 0;
		$scope.sumIntegrated = 0;
		registeredVpReportService.getStateZpData($scope.finYear, $scope.stateCode, schemeCode).then(function(response) {
			$scope.stateZpList = response.data;
			angular.forEach(response.data, function(obj, key) {
				 $scope.sumTotalCount = parseFloat((parseFloat($scope.sumTotalCount)) + (parseFloat(obj.totalCount)));
				 $scope.sumPfmsCount = parseFloat((parseFloat($scope.sumPfmsCount)) + (parseFloat(obj.pfmsCount)));
				 $scope.sumIntegratedDsc = parseFloat((parseFloat($scope.sumIntegratedDsc)) + (parseFloat(obj.integratedDsc)));
				 $scope.sumNonIntegrated = parseFloat((parseFloat($scope.sumNonIntegrated )) + (parseFloat( obj.nonIntegrated)));
				 $scope.sumIntegrated = parseFloat((parseFloat($scope.sumIntegrated )) + (parseFloat( obj.integrated)));
			}, function(error) {
		    	$scope.loader = false;
		    });	
			 $scope.loader = false;
		});
	}
	$scope.getZpReg =  function getZpReg(stateCode, stateName, schmeUid) {
		
		$scope.stateCode = stateCode;
		$scope.stateName = stateName;
		$scope.pfmsCode = schmeUid;
		registeredVpReportService.schedularDate(9,$scope.tableName).then(function(response) {
			$scope.schDate = response.data;
			$("#district").hide();
			$("#block").hide();
			$("#village").hide();
			$("#mainDiv").hide();
			$("#state").hide();
			$("#stateZp").hide();
			$("#stateBp").hide();
			$("#zpDetail").show();
			$("#bpDetail").hide();
			getZpDetails(stateCode, schmeUid,$scope.schDate);
			});
		
		
	}
	
	function getZpDetails(stateCode, schmeUid,schDate){
		$scope.schedularDate = schDate;
		$scope.zpList = { };
		$scope.loader = true;
		registeredVpReportService.getzpData($scope.finYear, stateCode, schmeUid).then(function(response) {
			$scope.zpList = response.data;
			 $scope.loader = false;
		});
	}
	
	$scope.getBpReg =  function getBpReg(stateCode, stateName, schmeUid) {
		$scope.stateCode = stateCode;
		$scope.stateName = stateName;
		$scope.pfmsCode = schmeUid;
		registeredVpReportService.schedularDate(9,$scope.tableName).then(function(response) {
			$scope.schDate = response.data;
			$("#district").hide();
			$("#block").hide();
			$("#village").hide();
			$("#mainDiv").hide();
			$("#state").hide();
			$("#stateZp").hide();
			$("#stateBp").hide();
			$("#zpDetail").hide();
			$("#bpDetail").show();
			
			getBpDetails(stateCode, schmeUid,$scope.schDate);
			});
		
	}
	
	function getBpDetails(stateCode, schmeUid,schDate){
		$scope.schedularDate = schDate;
		$scope.bpList = { };
		$scope.loader = true;
		registeredVpReportService.getbpData($scope.finYear, stateCode, schmeUid).then(function(response) {
			$scope.bpList = response.data;
			 $scope.loader = false;
		});
	}
	
	function getStateBpData(schemeCode,schDate) {
		$scope.schedularDate = schDate;
		$scope.stateBpList = { };
		$scope.loader = true;
		$scope.sumTotalCount = 0;
		$scope.sumPfmsCount = 0;
		$scope.sumIntegratedDsc = 0;
		$scope.sumNonIntegrated = 0;
		$scope.sumIntegrated = 0;
		registeredVpReportService.getStateBpData($scope.finYear, $scope.stateCode, schemeCode).then(function(response) {
			$scope.stateBpList = response.data;
			angular.forEach(response.data, function(obj, key) {
				 $scope.sumTotalCount = parseFloat((parseFloat($scope.sumTotalCount)) + (parseFloat(obj.totalCount)));
				 $scope.sumPfmsCount = parseFloat((parseFloat($scope.sumPfmsCount)) + (parseFloat(obj.pfmsCount)));
				 $scope.sumIntegratedDsc = parseFloat((parseFloat($scope.sumIntegratedDsc)) + (parseFloat(obj.integratedDsc)));
				 $scope.sumNonIntegrated = parseFloat((parseFloat($scope.sumNonIntegrated )) + (parseFloat( obj.nonIntegrated)));
				 $scope.sumIntegrated = parseFloat((parseFloat($scope.sumIntegrated )) + (parseFloat( obj.integrated)));
			}, function(error) {
		    	$scope.loader = false;
		    });	
			 $scope.loader = false;
		});
	}
	
	function getStateData(schemeCode,schDate) {
		$scope.schedularDate = schDate;
		$scope.stateList = { };
		$scope.countList = {};
		$scope.loader = true;
		registeredVpReportService.getStateData($scope.finYear, $scope.stateCode, schemeCode).then(function(response) {
			 var stateDetail = new Array();
			 var sum =  new sumCount();
			 angular.forEach(response.data, function(obj, key) {
				
				 var state = new stateDetails();
				 state.stateId = obj.stateId; 
				 state.name = obj.name;
				 state.totalCount = obj.totalCount;
				 state.pfmsCount =  obj.pfmsCount;
				 state.stateTier =  obj.stateTier;
				 state.schmeUid =  obj.schmeUid;
				 state.integratedDsc =  obj.integratedDsc;
				 state.nonIntegrated = obj.nonIntegrated;
				 state.integrated =  obj.integrated;
				 
				 
				 
				 stateDetail.push(state);
				 
				 sum.sumTotalCount = sum.sumTotalCount + obj.totalCount;	
				 sum.sumPfmsCount = sum.sumPfmsCount + obj.pfmsCount;
				 sum.sumIntegratedDsc = sum.sumIntegratedDsc + obj.integratedDsc;
				 sum.sumNonIntegrated = sum.sumNonIntegrated + obj.nonIntegrated;
				 sum.sumIntegrated = sum.sumIntegrated + obj.integrated;
				/* sum.sumIFSC_Code = sum.sumIFSC_Code + obj.IFSC_Code;
				 sum.sumACCOUNT_Num = sum.sumACCOUNT_Num + obj.ACCOUNT_Num;*/
				
			 });
			 $scope.stateList = stateDetail;
			 $scope.countList = sum;
			 $scope.loader = false;
		});
	}

	
	
	$scope.getDistrictData =  function getDistrictData(stateCode, stateName, stateTier, schmeUid) {
		$scope.stateCode = stateCode;
		$scope.stateName = stateName;
		$scope.stateTier = stateTier;
		$scope.pfmsCode = schmeUid;
		
		registeredVpReportService.schedularDate(9,$scope.tableName).then(function(response) {
			$scope.schDate = response.data;
			
		$("#district").hide();
		$("#block").hide();
		$("#village").hide();
		$("#mainDiv").hide();
		$("#state").hide();
		$("#stateZp").hide();
		$("#stateBp").hide();
		$("#zpDetail").hide();
		$("#bpDetail").hide();
		
		if(($scope.stateTier == 'A' && stateCode != 17) || $scope.stateTier == 'AB' || $scope.stateTier == 'ZG'  ) {
			$("#district").show();
			getDistrictDetails(stateCode, stateTier, schmeUid,$scope.schDate);
		} else if($scope.stateTier == 'IG' || ($scope.stateTier == 'A' && stateCode == 17) ){
			$("#block").show();
			getBlockData(stateCode,$scope.schDate);
		}else if($scope.stateTier == 'GP' ){
			$("#village").show();
			$scope.districtName = null;
			getVillageData(stateCode,$scope.schDate);
		}
		});
		
	}
		function getDistrictDetails(stateCode, stateTier, schmeUid,schDate) {
			$scope.schedularDate = schDate;
			$scope.districtList = {};
			$scope.countList = {};
			$scope.loader = true;
			$scope.stateCode = stateCode;
			registeredVpReportService.getDistrictData($scope.finYear, stateCode, schmeUid, stateTier).then(function(response) {
				 var districtDetail = new Array();
				 var sum =  new sumCount();
				 angular.forEach(response.data, function(obj, key) {
					
					 var district = new districtDetails();
					 district.districtCode = obj.districtCode; 
					 district.districtName = obj.districtName;
					 district.totalCount = obj.totalCount;
					 district.pfmsCount =  obj.pfmsCount;
					 district.integratedDsc =  obj.integratedDsc;
					 district.nonIntegrated =  obj.nonIntegrated;
					 district.integrated =  obj.integrated;
					 
					 districtDetail.push(district);
					 
					 sum.sumTotalCount = sum.sumTotalCount + obj.totalCount;	
					 sum.sumPfmsCount = sum.sumPfmsCount + obj.pfmsCount;
					 sum.sumIntegratedDsc = sum.sumIntegratedDsc + obj.integratedDsc;
					 sum.sumNonIntegrated = sum.sumNonIntegrated + obj.nonIntegrated;
					 sum.sumIntegrated = sum.sumIntegrated + obj.integrated;
				 });
				 $scope.districtList = districtDetail;
				 $scope.countList = sum;
				 $scope.loader = false;
			});
		}
		
		$scope.getBlock =  function getBlock(districtCode, districtName) {
			$scope.districtCode = districtCode;
			$scope.districtName = districtName;
			$scope.tier = true;
			//$scope.stateCode = stateCode;
			registeredVpReportService.schedularDate(9,$scope.tableName).then(function(response) {
				$scope.schDate = response.data;
				
			
			$("#district").hide();
			$("#block").hide();
			$("#village").hide();
			$("#mainDiv").hide();
			$("#state").hide();
			$("#stateZp").hide();
			$("#stateBp").hide();
			$("#zpDetail").hide();
			$("#bpDetail").hide();
			
			if($scope.stateTier != 'ZG' && $scope.stateTier != 'GP') {
				if($scope.stateTier == 'IG'){
					$scope.districtName= null;
				}
				$("#block").show();
				getBlockData(districtCode,$scope.schDate);
			} else {
				$("#village").show();
				$scope.tier = false;
				getVillageData(districtCode,$scope.schDate);
			}
			});
		}
		
		function getBlockData(districtCode,schDate) {
			$scope.schedularDate = schDate;
			$scope.countList = {};
			$scope.blockList = {};
			$scope.loader = true;
			registeredVpReportService.getBlockData($scope.finYear, $scope.stateCode, districtCode, $scope.pfmsCode, $scope.stateTier )
			.then(function(response) {
				 var blockDetail = new Array();
				 var sum =  new sumCount();
				 angular.forEach(response.data, function(obj, key) {
					 var block = new blockDetails();
					 block.blockCode = obj.blockCode; 
					 block.blockName = obj.blockName;
					 block.totalCount = obj.totalCount;
					 block.pfmsCount =  obj.pfmsCount;
					 block.integratedDsc =  obj.integratedDsc;
					 block.nonIntegrated =  obj.nonIntegrated;
					 block.integrated =  obj.integrated;
						
						blockDetail.push(block);
					 
						sum.sumTotalCount = sum.sumTotalCount + obj.totalCount;	
						 sum.sumPfmsCount = sum.sumPfmsCount + obj.pfmsCount;
						 sum.sumIntegratedDsc = sum.sumIntegratedDsc + obj.integratedDsc;
						 sum.sumNonIntegrated = sum.sumNonIntegrated + obj.nonIntegrated;
						 sum.sumIntegrated = sum.sumIntegrated + obj.integrated;
				 });
				 $scope.blockList = blockDetail;
				 $scope.countList = sum;
				 $scope.loader = false;
			});
		}
		
		
		$scope.getVillage =  function getVillage(blockCode, blockName) {
			$scope.blockCode = blockCode;
			//$scope.stateCode = stateCode;
			registeredVpReportService.schedularDate(9,$scope.tableName).then(function(response) {
				$scope.schDate = response.data;
				
			$("#district").hide();
			$("#block").hide();
			$("#village").show();
			$("#mainDiv").hide();
			$("#state").hide();
			$("#stateZp").hide();
			$("#stateBp").hide();
			$("#zpDetail").hide();
			$("#bpDetail").hide();
			
			if($scope.stateTier != 'ZG' && $scope.stateTier != 'GP'){
				$scope.blockName = blockName;
				$scope.tier = true;
				}else{
					$scope.blockName = null;
				}
			/*$scope.blockName = blockName;*/
			getVillageData(blockCode,$scope.schDate);
			});
		}
		
		function getVillageData(blockCode,schDate) {
			$scope.schedularDate = schDate;
			$scope.villageList = {};
			$scope.loader = true;
			registeredVpReportService.getVillageData($scope.finYear, $scope.stateCode,   blockCode, $scope.pfmsCode).then(function(response) {
				 var villageDetail = new Array();
				 var sum =  new sumCount();
				 angular.forEach(response.data, function(obj, key) {
					
					 var village = new villageDetails();
					 	village.villageCode = obj.villageCode; 
					 	village.villageName = obj.villageName;
					 	village.status = obj.status;
					 	village.agncyCd =  obj.agncyCd;
					 	village.banksts=  obj.banksts;
					 	village.totalApPv =  obj.totalApPv;
					 	village.accountstatus =  obj.accountstatus;
					 	village.IFSC_Code =  obj.ifsc_Code;
					 	village.ACCOUNT_Num =  obj.account_Num;
					 	
					 	villageDetail.push(village);
					 });
					 $scope.villageList = villageDetail;
					 $scope.loader = false;
				 });
		}
		$scope.onBack = function onBack(type) {
			//$scope.stateCode = stateCode;
			registeredVpReportService.schedularDate(9,$scope.tableName).then(function(response) {
				$scope.schDate = response.data;
			
			var reprtType = $("input[name='reportType']:checked").val();
			if(type == 'S') {
				$("#block").hide();
				$("#village").hide();
				$("#district").hide();
				$("#state").show();
				$("#mainDiv").show();
				$("#stateZp").hide();
				$("#stateBp").hide();
				$("#zpDetail").hide();
				$("#bpDetail").hide();
				if(reprtType == 'S') {
					$("#stateDiv").show();
				}
				if(reprtType == 'C') {
					$scope.stateCode = '0';
				}
				$scope.stateName = null;
				getStateData($scope.schemeCode,$scope.schDate);
			}
			
			if(type == 'D') {
				if($scope.stateTier == 'IG'){
					$("#block").hide();
					$("#village").hide();
					$("#district").hide();
					$("#state").show();
					$("#mainDiv").show();
					$("#stateZp").hide();
					$("#stateBp").hide();
					$("#zpDetail").hide();
					$("#bpDetail").hide();
					if(reprtType == 'S') {
						$("#stateDiv").show();
					}
					if(reprtType == 'C') {
						$scope.stateCode = '0';
					}
					$scope.stateName = null;
					getStateData($scope.schemeCode,$scope.schDate);
				}else{
					$("#block").hide();
					$("#village").hide();
					$("#district").show();
					$("#state").hide();
					$("#stateZp").hide();
					$("#stateBp").hide();
					$("#zpDetail").hide();
					$("#bpDetail").hide();
					$scope.districtCode = null;
					$scope.districtName = null;
					getDistrictDetails($scope.stateCode, $scope.stateTier, $scope.pfmsCode,$scope.schDate);
				}
			}
			if(type == 'B') {
				if($scope.stateTier != 'ZG' && $scope.stateTier != 'GP') {
					$("#block").show();
					$("#village").hide();
					$("#district").hide();
					$("#stateZp").hide();
					$("#stateBp").hide();
					$("#zpDetail").hide();
					$("#bpDetail").hide();
					$scope.blockCode = null;
					$scope.blockName = null;
					if($scope.stateTier == 'IG'){
						getBlockData($scope.stateCode,$scope.schDate);
					}else{
						getBlockData($scope.districtCode,$scope.schDate);
					}
				} else if($scope.stateTier == 'ZG') {
					$("#block").hide();
					$("#village").hide();
					$("#district").show();
					$("#stateZp").hide();
					$("#stateBp").hide();
					$("#zpDetail").hide();
					$("#bpDetail").hide();
					$scope.districtCode = null;
					$scope.districtName = null;
					getDistrictDetails($scope.stateCode, $scope.stateTier, $scope.pfmsCode,$scope.schDate);
				}else if($scope.stateTier == 'GP'){
					$("#block").hide();
					$("#village").hide();
					$("#district").hide();
					$("#state").show();
					$("#mainDiv").show();
					$("#stateZp").hide();
					$("#stateBp").hide();
					$("#zpDetail").hide();
					$("#bpDetail").hide();
					if(reprtType == 'S') {
						$("#stateDiv").show();
					}
					if(reprtType == 'C') {
						$scope.stateCode = '0';
					}
					
					$scope.stateName = null;
					getStateData($scope.schemeCode,$scope.schDate);
				}
			}
			if(type == 'ZP' ) {
									
				$("#block").hide();
				$("#village").hide();
				$("#district").hide();
				$("#state").hide();
				$("#mainDiv").show();
				$("#stateZp").show();
				$("#stateBp").hide();
				$("#zpDetail").hide();
				$("#bpDetail").hide();
				if(reprtType == 'S') {
					$("#stateDiv").show();
				}
				if(reprtType == 'C') {
					$scope.stateCode = '0';
				}
				getStateZpData($scope.schemeCode,$scope.schDate);
				
			}
			
			if(type == 'BP' ) {
				
				$("#block").hide();
				$("#village").hide();
				$("#district").hide();
				$("#state").hide();
				$("#mainDiv").show();
				$("#stateZp").hide();
				$("#stateBp").show();
				$("#zpDetail").hide();
				$("#bpDetail").hide();
				if(reprtType == 'S') {
					$("#stateDiv").show();
				}
				if(reprtType == 'C') {
					$scope.stateCode = '0';
				}
				$scope.stateName = null;
				getStateBpData($scope.schemeCode,$scope.schDate);
				
			}
			});
		}
		
		$scope.exportFile = function exportFile(id) {
			$("#" + id).excelexportjs({
				containerid : id,
				datatype : 'table',
				worksheetName : "Registered Panchayat & Equivalent ported from PFMS",
				returnUri: false
			});
		}
}]);





