var ffcSectorWiseExpenditureModuleNew = angular.module('ffcSectorWiseExpenditureModuleNew', ['angular.filter']);
ffcSectorWiseExpenditureModuleNew.controller("ffcSectorWiseExpenditureControllerNew", ['$scope', "ffcSectorWiseExpenditureServiceNew", function($scope, ffcSectorWiseExpenditureServiceNew) {
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
	$scope.finYear = null;
	$scope.lbType =  null;
	$scope.loader = true;
	registeredSchemeList(0);
	$scope.type = 'MAIN';
	$scope.headings = false;     
	$scope.financialYear = function financialYear(value) {
		$scope.finYear = value;
		$scope.reportType= null;
		$("#stateDiv").hide();
		$scope.schemeCode = null;
		$scope.schemeName = null;
		$("#district").hide();
		$("#block").hide();
		$("#state").hide();
		$("#village").hide();
		$("#state").hide();
	}
	
	$scope.showScheme = function showScheme(val) {
		$("#state").hide();
		$scope.reportType=val;
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
		ffcSectorWiseExpenditureServiceNew.getStateList().then(function(response) {
			$scope.getStateList = response.data;
			});
	}
	
	
	$scope.onState = function onState(stateCode) {
		$("#schemeDiv").show();
		//$scope.lbType=val;
		//$scope.stateCode = stateCode;
		registeredSchemeList(stateCode);
	}
	
	/*$scope.onState = function onState(stateCode) {
		$("#schemeDiv").show();
		//$scope.stateCode = stateCode;
		registeredSchemeList(stateCode);
	}*/
	
	function registeredSchemeList(stateCode) {
		$scope.stateCode = stateCode;
		$scope.stateList = { };
		ffcSectorWiseExpenditureServiceNew.registeredSchemeList(stateCode).then(function(response) {
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
					   /*$scope.countList = {};
					   $scope.stateList = {};*/
					   scheme.schemeId = obj.schemeid;
					   scheme.schemeCategory = "State Schemes";
					   scheme.schemeName = obj.resourcedesc + "-" + obj.schemename_abbreviation;
					   schemeDetail.push(scheme);
				   }
			   }
		   });	
		   $scope.schemeList = schemeDetail;
		});
	}
	
	$scope.header = function header(schemeCode){
		$scope.header = null;
		$scope.schemeCode = schemeCode;
		$scope.schemeName = $("#schemeCode option:selected").text();
		ffcSectorWiseExpenditureServiceNew.getHeader($scope.schemeCode).then(function(response){
			$scope.headerList = response.data;
			$scope.colVal = response.data.length;
			$("#colVal").val(response.data.length);
		});
	}
	
	function masterData(target) {
		var error = false;
	$('.errored').hide();
	
	
	if($("#finYear").val() == null || $("#finYear").val() == 0 || $("#finYear").val() == "") {
		$("#finYear_error").show();
		error = true;
	}
	
	if(!$("input[name='reportType']").is(":checked")) {
		$("#reportType_error").show();
		error = true;
	}
	if ($("input[name='reportType']").is(":checked")) {
			if ($("input[name='reportType']:checked").val() == 'S') {
				
				if($("#stateCode").val() == null || $("#stateCode").val() == 0 || $("#stateCode").val() == "") {
					$("#stateCode_error").show();
					error = true;
				}
			}else if ($("input[name='reportType']:checked").val() == 'C') {
				
				if($("#schemeCode").val() == null || $("#schemeCode").val() == 0 || $("#schemeCode").val() == "") {
					$("#schemeCode_error").show();
					error = true;
				}
			}
	}
	
	/*if($("#headers").val() == null || $("#headers").val() == 0 || $("#headers").val() == "") {
		$("#headers_error").show();
		error = true;
	}*/
	
	/*if(!$("input[name='amountIn']").is(":checked")) {
		$("#amountIn_error").show();
		error = true;
	}*/
	if(!$("input[name='lbType']").is(":checked")) {
		$("#lbType_error").show();
		error = true;
	}
	
		
	if(target == 'submit' && !error) {
		$('.errored').hide();
		return false;
	}		
}
	
$scope.getStateDetails = function getStateDetails(schemeCode,lbType) {
		
	 var isValidate = masterData('submit'); 
	    if(isValidate == false) { 
		$scope.stateList = {};
		$scope.schemeCode = schemeCode;
		$scope.schemeName = $("#schemeCode option:selected").text();
		$("#state").show();
		getStateData(schemeCode,lbType);
	    }
	}
	

function getStateData(schemeCode,lbType) {
	$scope.stateList = { };
	$scope.loader = true;
    $scope.lbType=lbType;
    ffcSectorWiseExpenditureServiceNew.getHeader(schemeCode).then(function(response){
		$scope.headerList = response.data;
		$scope.colVal = response.data.length;
		$("#colVal").val(response.data.length);
	});

    
    
    var ele = document.getElementsByName('componentType'); 
    
    for(i = 0; i < ele.length; i++) { 
        if(ele[i].checked) 
        	componentType=ele[i].value; 
    } 
    
    
    
    
    
    		var schemechildCode=-1;

			if(componentType == 'IC'){
				schemechildCode = $("#schemeComponent option:selected").val();
				
			}
	ffcSectorWiseExpenditureServiceNew.getStateData($scope.finYear,schemeCode,$scope.lbType,schemechildCode).then(function(response) {
		$scope.stateList = response.data;
		$scope.loader = false;
		$scope.lbType=lbType;
	});
	 
}

	function getStateTier(){
		$scope.stateTier = null;
		ffcSectorWiseExpenditureServiceNew.getStateTier($scope.stateCode).then(function(response){
			$scope.stateTier = response.data;
			if($scope.stateTier != 'IG') {
				$("#district").show();
				$scope.type = 'D';
				getDistrict();
			} else {
				$("#block").show();
				getBlockData(0, '');
				$scope.type = 'B';
			}
		});
		 
	}
	
	$scope.getDistrictData =  function getDistrictData(stateCode, stateName) {
		$("#state").hide();
		$("#mainDiv").hide();

		$scope.stateCode = stateCode;
		$scope.stateName = stateName;
		 getStateTier();
		
	}
		function getDistrict() {
			$scope.districtList = {};
			$scope.headings = true;     
			$scope.loader = true;
			
			var ele = document.getElementsByName('componentType'); 
		    
		    for(i = 0; i < ele.length; i++) { 
		        if(ele[i].checked) 
		        	componentType=ele[i].value; 
		    } 
		    
		    
		    
		    
		    
		    		var schemechildCode=-1;

					if(componentType == 'IC'){
						schemechildCode = $("#schemeComponent option:selected").val();
						
					}
			
			ffcSectorWiseExpenditureServiceNew.getDistrictData($scope.finYear,$scope.schemeCode,$scope.stateCode,$scope.lbType,schemechildCode).then(function(response) {
				$scope.districtList = response.data;
				 $scope.loader = false;
			});
			
			
		}
		
		$scope.getBlockData =  function getBlockData(districtCode, districtName) {
			$("#district").hide();
			$("#block").hide();
			$("#village").hide();
			$("#state").hide();
			$("#mainDiv").hide();
			if($scope.stateTier != 'ZG') {
				$("#block").show();
				getBlock(districtCode, districtName);
			} else {
				$scope.districtName = districtName;
				$scope.districtCode = districtCode;
				$("#village").show();
				$scope.getVillageData(districtCode, districtName);
			}
		}
		
		function getBlock(districtCode, districtName) {
			if(districtCode != 0) {
				$scope.districtName = districtName;
			}
			$scope.districtCode = districtCode;
			$scope.countList = {};
			$scope.blockList = {};
			$scope.loader = true;
			$scope.type = 'B';
			$("#district").hide();
			$("#block").show();
			$("#village").hide();
			$("#state").hide();
			$("#mainDiv").hide();
			$scope.blockList = {};
			$scope.loader = true;
			$scope.headings = true;  
			
			var ele = document.getElementsByName('componentType'); 
		    
		    for(i = 0; i < ele.length; i++) { 
		        if(ele[i].checked) 
		        	componentType=ele[i].value; 
		    } 
		    
		    
		    
		    
		    
		    		var schemechildCode=-1;

					if(componentType == 'IC'){
						schemechildCode = $("#schemeComponent option:selected").val();
						
					}
			
			ffcSectorWiseExpenditureServiceNew.getBlockData($scope.finYear,$scope.schemeCode,$scope.stateCode,$scope.districtCode,$scope.lbType,schemechildCode).then(function(response) {
				$scope.blockList = response.data;
				$scope.loader = false;
			});
			 
		}
		
		$scope.getVillageData =  function getVillageData(blockCode, blockName) {
			$scope.blockName = blockName;
			$scope.blockCode = blockCode;
			$("#district").hide();
			$("#block").hide();
			$("#village").show();
			$("#state").hide();
			$("#mainDiv").hide();
			if($scope.stateTier == 'ZG') {
			$scope.blockCode = blockCode;
			$scope.blockName = null;
			}
			getVillage(blockCode);
		}
		
		function getVillage(blockCode) {
			$scope.villageList = {};
			$scope.loader = true;
			$scope.headings = true; 
			$scope.type = 'V';
			
			var ele = document.getElementsByName('componentType'); 
		    
		    for(i = 0; i < ele.length; i++) { 
		        if(ele[i].checked) 
		        	componentType=ele[i].value; 
		    } 
		    
		    
		    
		    
		    
		    		var schemechildCode=-1;

					if(componentType == 'IC'){
						schemechildCode = $("#schemeComponent option:selected").val();
						
					}
			
			ffcSectorWiseExpenditureServiceNew.getVillageData($scope.finYear,$scope.schemeCode,$scope.stateCode,$scope.blockCode,$scope.lbType,schemechildCode).then(function(response) {
				$scope.villageList = response.data;
				 $scope.loader = false;
			});
			
		}
		
		$scope.getExpenditureData =  function getExpenditureData(target) {
			$("#state").hide();
			$("#mainDiv").hide();
			$("#stateExpData").show();
      
			getStateExpData(target);
			
		}
		
		function getStateExpData(target){
			$scope.stateExpList = {};
			$scope.loader = true;
			$scope.pfmsHead=target;
			$scope.type = 'SE';
			var schemechildCode=-1;

			var ele = document.getElementsByName('componentType'); 
		    
		    for(i = 0; i < ele.length; i++) { 
		        if(ele[i].checked) 
		        	componentType=ele[i].value; 
		    } 
		    
		    
		    
		    
		    
		    		var schemechildCode=-1;

					if(componentType == 'IC'){
						schemechildCode = $("#schemeComponent option:selected").val();
						
					}
			ffcSectorWiseExpenditureServiceNew.getStateExpData($scope.finYear,$scope.schemeCode,$scope.lbType,$scope.pfmsHead,schemechildCode).then(function(response) {
				$scope.stateExpList = response.data;
				$scope.loader = false;
			});
		}
		
		
		$scope.onBack = function onBack(type) {
			
			if(type == 'D' ) {
				
				$scope.type = 'MAIN';
				$scope.headings = false;   
				$("#district").hide();
				$("#block").hide();
				$("#state").show();
				$("#village").hide();
				$("#mainDiv").show();
				getStateData($scope.schemeCode);
				 
			}else if(type == 'B'){
			
				$scope.type = 'D';
				$("#district").show();
				$("#block").hide();
				$("#state").hide();
				$("#village").hide();
				$("#state").hide();
				$("#mainDiv").hide();
				$scope.districtCode = null;
				$scope.districtName = null;
				getDistrict();
				
			}else if(type == 'V'){
				
				$("#district").hide();
				$("#block").hide();
				$("#state").hide();
				$("#village").hide();
				$("#state").hide();
				$("#mainDiv").hide();
				if($scope.stateTier != 'ZG') {
					$scope.blockCode = null;
					$scope.blockName = null;
					if($scope.stateTier == 'IG') {
						$scope.type = 'BS';
					} else {
						$scope.type = 'B';
					}
					$("#block").show();
					getBlock($scope.districtCode, $scope.districtName);
					
				} else {
					$scope.lbType=lbType;
					$scope.districtCode = null;
					$scope.districtName = null;
					$scope.type = 'D';
					$("#district").show();
					getDistrict();
				}
			}else if(type == 'SE'){
				$scope.type = 'MAIN';
				$scope.headings = false;   
				$("#district").hide();
				$("#block").hide();
				$("#state").show();
				$("#village").hide();
				$("#mainDiv").show();
				$("#stateExpData").hide();
				getStateData($scope.schemeCode);
				 
			}
			
			
		
		}
		
		$scope.exportFile = function exportFile(id) {
			$("#" + id).excelexportjs({
				containerid : id,
				datatype : 'table',
				worksheetName : "Sector Wise Expenditure Report",
				returnUri: false
			});
		}
		
		
		
		$scope.showComp = function showComp(schemeCode,componentType,stateCode){
			if(componentType == 'IC'){
			$("#schemeComponentDiv").show();
			getSchemeChild(schemeCode,"R",0,stateCode);
			
			 //refreshCaptcha();
			}else{
				
				 //refreshCaptcha();
			}
		}
		

		function getSchemeChild(schemeCode,ac_head_type,workCode,stateCode) {
			
			ffcSectorWiseExpenditureServiceNew.getSchemeChild($scope.schemeCode,ac_head_type,workCode,stateCode).then(function(response) {
				$scope.data = response.data;
				var schemeDetail = new Array();
				angular.forEach($scope.data, function(obj, key) {
						scheme = new schemeChildDetails();
						scheme.schemeid = obj.schemeid;
						scheme.schemeName = obj.resourcedesc;
						schemeDetail.push(scheme);
					
				});	
				$scope.childdetails = schemeDetail;
				
		    });
		}
		
		
}]);





