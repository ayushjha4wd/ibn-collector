var ffcSchemeComponentOtherExpModule = angular.module('ffcSchemeComponentOtherExpModule', ['angular.filter']);
ffcSchemeComponentOtherExpModule.controller("ffcSchemeComponentOtherExpController", ['$scope', "ffcSchemeComponentOtherExpService", function($scope, ffcSchemeComponentOtherExpService) {
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
		$scope.headers = null;
		$scope.lbType = null;
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
		$scope.headers = null;
		$scope.lbType = null;
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
		ffcSchemeComponentOtherExpService.getStateList().then(function(response) {
			$scope.getStateList = response.data;
			});
	}
	
	
	$scope.onState = function onState(stateCode) {
		$("#schemeDiv").show();
		$scope.lbType=val;
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
		ffcSchemeComponentOtherExpService.registeredSchemeList(stateCode).then(function(response) {
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
	
	/*$scope.header = function header(schemeCode){
		if(schemeCode > 0){
			$("input[name='lbType']").prop("checked", false);
			$("#state").hide();
			$("#district").hide();
			$("#block").hide();
			
			$("#village").hide();
			$("#stateExpData").hide();
			
			$("#headers").val("");
		}
		$scope.header = null;
		$scope.schemeCode = schemeCode;
		$scope.schemeName = $("#schemeCode option:selected").text();
		ffcSchemeComponentOtherExpService.getHeader($scope.schemeCode).then(function(response){
			$scope.headerList = response.data;
			$scope.colVal = response.data.length;
			$("#colVal").val(response.data.length);
		});
	}*/
	$scope.onChangeSchemeCode = function() {
	    
	    if (!$scope.isValidSchemeCode($scope.schemeCode)) {
	       
	        //$scope.schemeCode = null;
	    }
	};

	$scope.isValidSchemeCode = function(schemeCode) {
		if(schemeCode > 0){
			$("input[name='lbType']").prop("checked", false);
			$("#state").hide();
			$("#district").hide();
			$("#block").hide();
			
			$("#village").hide();
			$("#stateExpData").hide();
			
			$("#headers").val("");
		}
		$scope.header = null;
		$scope.schemeCode = schemeCode;
		$scope.schemeName = $("#schemeCode option:selected").text();
		ffcSchemeComponentOtherExpService.getHeader($scope.schemeCode).then(function(response){
			$scope.headerList = response.data;
			$scope.colVal = response.data.length;
			$("#colVal").val(response.data.length);
		});
	};
	
	
$scope.getStateDetails = function getStateDetails(schemeCode,lbType) {
		
		$scope.stateList = {};
		$scope.schemeCode = schemeCode;
		$scope.schemeName = $("#schemeCode option:selected").text();
		$("#state").show();
		getStateData(schemeCode,lbType);
	}
	

function getStateData(schemeCode,lbType) {
	$scope.stateList = { };
	$scope.loader = true;
    $scope.lbType=lbType;
    ffcSchemeComponentOtherExpService.getHeader(schemeCode).then(function(response){
		$scope.headerList = response.data;
		$scope.colVal = response.data.length;
		$("#colVal").val(response.data.length);
	});


	ffcSchemeComponentOtherExpService.getStateData($scope.finYear,schemeCode,$scope.lbType).then(function(response) {
		$scope.stateList = response.data;
		$scope.loader = false;
	});
	 
}

	function getStateTier(){
		$scope.stateTier = null;
		ffcSchemeComponentOtherExpService.getStateTier($scope.stateCode).then(function(response){
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
			
			ffcSchemeComponentOtherExpService.getDistrictData($scope.finYear,$scope.schemeCode,$scope.stateCode,$scope.lbType).then(function(response) {
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
			ffcSchemeComponentOtherExpService.getBlockData($scope.finYear,$scope.schemeCode,$scope.stateCode,$scope.districtCode,$scope.lbType).then(function(response) {
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
			ffcSchemeComponentOtherExpService.getVillageData($scope.finYear,$scope.schemeCode,$scope.stateCode,$scope.blockCode,$scope.lbType).then(function(response) {
				$scope.villageList = response.data;
				 $scope.loader = false;
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
		
		if($("#headers").val() == null || $("#headers").val() == 0 || $("#headers").val() == "") {
			$("#headers_error").show();
			error = true;
		}
		
		if(!$("input[name='amountIn']").is(":checked")) {
			$("#amountIn_error").show();
			error = true;
		}
		if(!$("input[name='lbType']").is(":checked")) {
			$("#lbType_error").show();
			error = true;
		}
		
			
		if(target == 'submit' && !error) {
			$('.errored').hide();
			return false;
		}		
	}
		
		
		
		$scope.getExpenditureData =  function getExpenditureData(target) {
			
			 var isValidate = masterData('submit'); 
			    if(isValidate == false) { 
			    	
			    
			$("#state").hide();
			$("#mainDiv").hide();
			$("#stateExpData").show();
      
			getStateExpData(target);
			    }
		}
		
		function getStateExpData(target){
			$scope.stateExpList = {};
			$scope.loader = true;
			$scope.headings = true;
			$scope.amountIn = $("input[name='amountIn']:checked").val();
			$scope.pfmsHead=target;
			$scope.type = 'SE';
			if($scope.lbType == "D"){
				$scope.level = "Zilla Panchayat And Equivalent";
			}else if($scope.lbType == "B"){
				$scope.level = "Block Panchayat And Equivalent";
			}else if($scope.lbType == "V"){
				$scope.level = "Village Panchayat And Equivalent";
			} 
			ffcSchemeComponentOtherExpService.getStateExpData($scope.finYear,$scope.schemeCode,$scope.lbType,$scope.pfmsHead).then(function(response) {
				$scope.stateExpList = response.data;
				$scope.loader = false;
			});
		}
		
		$scope.onBack = function onBack(type) {
			$scope.type = 'MAIN';
			$("#mainDiv").show();
			$("#stateExpData").hide();
			$("#finYear").val("");
			$("#schemeCode").val("");
			$("#headers").val("");
			$("input[name='lbType']").prop("checked", false);
			$("input[name='reportType']").prop("checked", false);
			$scope.finYear = null;
			$scope.pfmsHead = null;
			$scope.level = null;
			$("#stateDiv").hide();
			$scope.schemeName = null;
			
		}
		
		/*$scope.onBack = function onBack(type) {
			$scope.type = 'MAIN';
			//$scope.headings = false; 
			$("#mainDiv").show();
			$("#stateExpData").hide();
			///$("#finYear").val("");
			//$scope.finYear = null;
			//$scope.reportType= null;
			$("#stateDiv").hide();
			//$scope.schemeCode = null;
			//$scope.schemeName = null;
			//$scope.headers = null;
			//$scope.lbType = null;
			$("#district").hide();
			$("#block").hide();
			$("#state").hide();
			$("#village").hide();
			$("#state").hide();
		}*/
		
		/*$scope.onBack = function onBack(type) {
			
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
			
			
		
		}*/
		
		/*$scope.exportFile = function exportFile(id) {
			$("#" + id).excelexportjs({
				containerid : id,
				datatype : 'table',
				worksheetName : "Sector Wise Expenditure Report",
				returnUri: false
			});
		}*/
		
		
		$scope.exportFile = function exportFile(id) {
    var table = document.getElementById(id);
    if (!table) {
        console.error("Table with ID '" + id + "' not found.");
        return;
    }
    var clonedTable = table.cloneNode(true);
    var style = `
        <style>
            table, th, td {
                border: 1px solid black;
                border-collapse: collapse;
                padding: 5px;
                font-family: Arial, sans-serif;
                font-size: 12px;
            }
        </style>
    `;

    var html = `
        <html>
        <head><meta charset="UTF-8">${style}</head>
        <body>${clonedTable.outerHTML}</body>
        </html>
    `;

    var blob = new Blob([html], { type: 'application/vnd.ms-excel' });

    var downloadLink = document.createElement('a');
    downloadLink.href = URL.createObjectURL(blob);
    downloadLink.download = 'Sector_Wise_Expenditure_Report.xls';
    downloadLink.click();
}
}]);





