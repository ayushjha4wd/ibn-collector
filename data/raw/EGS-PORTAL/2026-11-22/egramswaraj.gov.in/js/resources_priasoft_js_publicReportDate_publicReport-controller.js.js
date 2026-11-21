var publicReportModule = angular.module('publicReportModule', ['angular.filter']);
publicReportModule.controller("publicReportController", ['$scope', "publicReportService", function($scope, publicReportService) {
	$("#stateCode_error").hide();
	$scope.stateList = {};
	$scope.districtList = {};
	$scope.countList = {};
	$scope.blockList = {};
	$scope.villageList = {};
	$scope.stateCode = '0';
	$scope.reportType =null;
	$scope.amountIn =null;
	$scope.componentType =null;
	$scope.schemeComponent=null;
	$scope.componentTypeView='';
	$scope.stateName = null;
	$scope.districtCode = "";
	$scope.districtName = null;
	$scope.blockName = null;
	$scope.blockCode = null;
	$scope.voucherdate=null;
	$scope.code = 0;
	$scope.finYear = $("#finYear").val();
	$scope.loader = true;
	$scope.type = 'S';
	registeredSchemeList(0);
	$scope.showReportType = function showReportType(type){
		$scope.type=type;
		$scope.reportType=null;
		$scope.schemeList={};
		$scope.schemeCode = null;
		$scope.stateCode =  null;
		$("#state").hide();
		$("#schemeDiv").hide();
		$("#stateZp").hide();
		$("#stateBp").hide();
		$("#stateZpVp").hide();
		$("#stateVp").hide();
	}
	
	
	$scope.showScheme = function showScheme(val) {
		$("#state").hide();
		$("#stateZp").hide();
		$("#stateBp").hide();
		$("#stateZpVp").hide();
		$("#stateVp").hide();
		$scope.stateCode = '0';
		$scope.schemeCode = null;
		$scope.schemeName = null;
		if(val != null){
			if($("#finYear").val()!=''){
				
			}else{
				alert('Please Select Financial Year');
				$("input:radio[name=reportType]:checked")[0].checked = false;
				$("input:radio[name=reportType]:checked")[1].checked = false;
			}
			
			if(val == 'C') {
				
				$scope.code = 0;
				$("#stateDiv").hide();
				$("#schemeDiv").show();
				registeredSchemeList(0);
				
			} else {
				$("#stateDiv").show();
				getStateList();
				$("#schemeDiv").hide();
			}
		}
	}
	
	function getStateList(){
		$scope.getStateList={};
		publicReportService.getStateList().then(function(response) {
			$scope.getStateList = response.data;
			});
	}
	
	$scope.onState = function onState(stateCode) {
		$("#schemeDiv").show();
		$scope.code = stateCode;
		//$scope.stateCode = stateCode;
		registeredSchemeList(stateCode);
	}
	
	function registeredSchemeList(stateCode) {
		$scope.stateCode = stateCode;
		/*$scope.stateList = { };*/
		stateCode=0;
		publicReportService.registeredSchemeList(0 ).then(function(response) {
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
		});
	}
	
	$scope.getStateDetails = function getStateDetails(schemeCode) {
		$scope.stateList = {};
		$scope.schemeCode = schemeCode;
		$scope.schemeName = $("#schemeCode option:selected").text();
		$("#mainDiv").show();
		$("#state").show();
		$("#stateZp").hide();
		$("#stateBp").hide();
		$("#stateZpVp").hide();
		$("#stateVp").hide();
		$scope.type = 'S';
		getStateData(schemeCode,$scope.code);
		
	}
	
	$scope.handleInput = function handleInput(id) {
	    $("#" + id+"_error").hide();
	};
	
	$scope.generateReport = function generateReport(target) {
		var error = false;
		$('.errored').hide();
		
		if($("#finYear").val() == null || $("#finYear").val() == 0 || $("#finYear").val() == "") {
			$("#finYear_error").show();
			error = true;
		}
		
		
		
		if(!$("input[name='reportType']").is(":checked")) {
			$("#reportType_error").show();
			error = true;
		} else {
			if($("input[name='reportType']:checked").val() == 'S') {
				if($("#stateCode").val() == null || $("#stateCode").val() == 0 || $("#stateCode").val() == "") {
					$("#stateCode_error").show();
					error = true;
				}
			}
		}
		
		if($("#schemeCode").val() == null || $("#schemeCode").val() == 0 || $("#schemeCode").val() == "") {
			$("#schemeCode_error").show();
			error = true;
		}
		
	
		
		
		
		if( $("#schemeCode").val() != "" ){
		if(!$("input[name='componentType']").is(":checked")) {
			$("#componentType_error").show();
			error = true;
		} else {
			if($("input[name='componentType']:checked").val() == 'IC') {
				if($("#schemeComponent").val() == null || $("#schemeComponent").val() == 0 || $("#schemeComponent").val() == "") {
					$("#schemeComponent_error").show();
					error = true;
				}else {
					 $scope.schemeComponent=$("#schemeComponent").val();
					 $scope.schemecomponentname = $("#schemeComponent option:selected").text();
				}
			}
		}
		}
				
		if($("input[name='amountIn']").is(":checked")) {
			$scope.amountIn = $("input[name='amountIn']:checked").val();
			if($scope.amountIn=="RS"){
				$scope.amt = "Amount (in Rs.)";
			}else if($scope.amountIn =="LK"){
				$scope.amt = "Amount (in Lakhs)";
			}else if($scope.amountIn == "CR"){
				$scope.amt = "Amount (in Crores)";
			}
		}
		
		if(target == 'submit' && !error) {
			$('.errored').hide();

			$("#mainDiv").show();
			$("#state").show();
			$("#stateZp").hide();
			$("#stateBp").hide();
			$("#stateZpVp").hide();
			$("#stateVp").hide();
			$scope.type = 'S';
			
			$scope.stateList = {};
			$scope.reportType = $("input[name='reportType']:checked").val()
			$scope.schemeCode = $("#schemeCode").val();
			$scope.schemeName = $("#schemeCode option:selected").text();
			$scope.componentType = $("input[name='componentType']:checked").val();
			$scope.schemeComponent = $("#schemeComponent").val();
			if($scope.componentType === 'IC'){
				$scope.componentTypeView=$("#schemeComponent option:selected").text();
			}else{
				$scope.componentTypeView='ALL'
			}
			
			
			
			getStateData($scope.schemeCode,$scope.code,$scope.reportType,$scope.componentType,$scope.schemeComponent,$scope.amountIn);
		}
	}
	
	

	function getStateData(schemeCode,stateCode,reportType,componentType,schemeComponent,amountIn) {
		$scope.stateList = { };
		$scope.loader = true;
		$scope.sumZplocal_body_count = 0;
		$scope.sumBplocal_body_count = 0;
		$scope.sumVplocal_body_count = 0;
		
		$scope.sumZppnchyt_type_codecount = 0;
		$scope.sumBppnchyt_type_codecount = 0;
		$scope.sumVppnchyt_type_codecount = 0;
		
		$scope.sumZpcreditamount = 0;
		$scope.sumBpcreditamount = 0;
		$scope.sumVpcreditamount = 0;
		publicReportService.getStateData($scope.finYear, schemeCode,stateCode,reportType,componentType,schemeComponent,amountIn).then(function(response) {
			$scope.stateList = response.data;
			angular.forEach(response.data, function(obj, key) {
				
				$scope.sumZplocal_body_count = $scope.sumZplocal_body_count + obj.zplocal_body_count;
				$scope.sumBplocal_body_count = $scope.sumBplocal_body_count + obj.bplocal_body_count;
				$scope.sumVplocal_body_count = $scope.sumVplocal_body_count + obj.vplocal_body_count;
				
				$scope.sumZppnchyt_type_codecount = $scope.sumZppnchyt_type_codecount + obj.zppnchyt_type_codecount;
				$scope.sumBppnchyt_type_codecount = $scope.sumBppnchyt_type_codecount + obj.bppnchyt_type_codecount;
				$scope.sumVppnchyt_type_codecount = $scope.sumVppnchyt_type_codecount + obj.vppnchyt_type_codecount;
				
				$scope.sumZpcreditamount = parseFloat((parseFloat($scope.sumZpcreditamount)) + (parseFloat(obj.zpcreditamount))).toFixed(2);
				$scope.sumBpcreditamount = parseFloat((parseFloat($scope.sumBpcreditamount)) + (parseFloat(obj.bpcreditamount))).toFixed(2);
				$scope.sumVpcreditamount = parseFloat((parseFloat($scope.sumVpcreditamount)) + (parseFloat(obj.vpcreditamount))).toFixed(2);
			}, function(error) {
		    	$scope.loader = false;
		    });	
			 $scope.loader = false;
		});
	}
	
	$scope.getZpData =  function getZpData(stateCode, stateName,voucherdate) {
		$scope.type = 'Z';
		$("#state").hide();
		$("#stateZp").show();
		$("#stateBp").hide();
		$("#stateZpVp").hide();
		$("#stateVp").hide();
		$("#mainDiv").hide();
		$scope.stateCode = stateCode;
		$scope.stateName = stateName;
		$scope.voucherdate = voucherdate;
		getZpDetails(stateCode);
	}
	
	function getZpDetails(stateCode){
		$scope.zpList = { };
		$scope.loader = true;
		$scope.sumTotalCount = 0;
		publicReportService.getzpData($scope.finYear, stateCode, $scope.schemeCode,$scope.reportType,$scope.componentType,$scope.schemeComponent,$scope.amountIn,$scope.voucherdate).then(function(response) {
			$scope.zpList = response.data;
			angular.forEach(response.data, function(obj, key) {
				 $scope.sumTotalCount = parseFloat((parseFloat($scope.sumTotalCount)) + (parseFloat(obj.creditamount))).toFixed(2);
			}, function(error) {
		    	$scope.loader = false;
		    });
			 $scope.loader = false;
		});
	}
	
	$scope.getBpData =  function getBpData(stateCode, stateName,voucherdate) {
		$scope.type = 'B';
		$("#state").hide();
		$("#stateZp").hide();
		$("#stateBp").show();
		$("#stateZpVp").hide();
		$("#stateVp").hide();
		$("#mainDiv").hide();
		$scope.stateCode = stateCode;
		$scope.stateName = stateName;
		$scope.voucherdate = voucherdate;
		$scope.stateTier = null;
		publicReportService.getStateTier(stateCode).then(function(response){
			$scope.stateTier = response.data;
			getBpDetails(stateCode);
		});
		
	}
	
	function getBpDetails(stateCode){
		$scope.bpList = { };
		$scope.loader = true;
		$scope.sumTotalCount = 0;
		publicReportService.getbpData($scope.finYear, stateCode, $scope.schemeCode,$scope.reportType,$scope.componentType,$scope.schemeComponent,$scope.amountIn,$scope.voucherdate).then(function(response) {
			$scope.bpList = response.data;
			angular.forEach(response.data, function(obj, key) {
				 $scope.sumTotalCount = parseFloat((parseFloat($scope.sumTotalCount)) + (parseFloat(obj.creditamount))).toFixed(2);
			}, function(error) {
		    	$scope.loader = false;
		    });
			 $scope.loader = false;
		});
	}
	
	$scope.getZpVpData =  function getZpVpData(stateCode, stateName,voucherdate) {
		$scope.type = 'ZV';
		$scope.schemeName = $("#schemeCode option:selected").text();
		$("#state").hide();
		$("#stateZp").hide();
		$("#stateBp").hide();
		$("#stateZpVp").show();
		$("#stateVp").hide();
		$("#mainDiv").hide();
		$scope.stateCode = stateCode;
		$scope.stateName = stateName;
		$scope.voucherdate = voucherdate;
		$scope.stateTier = null;
		publicReportService.getStateTier(stateCode).then(function(response){
			$scope.stateTier = response.data;
			getZpVpDetails(stateCode);
		});
		
	}
	
	function getZpVpDetails(stateCode){
		$scope.zpVpList = { };
		$scope.loader = true;
		$scope.sumTotalCount = 0;
		
		if($scope.stateTier!='GP') {
		publicReportService.getzpVpData($scope.finYear, stateCode, $scope.schemeCode,$scope.reportType,$scope.componentType,$scope.schemeComponent,$scope.amountIn,$scope.voucherdate).then(function(response) {
			$scope.zpVpList = response.data;
			angular.forEach(response.data, function(obj, key) {
				if(obj !=null){
					$scope.sumTotalCount = parseFloat((parseFloat($scope.sumTotalCount)) + (parseFloat(obj.creditamount))).toFixed(2);
					console.log(obj.creditamount);
					console.log(parseFloat(obj.creditamount));
				}
				 
			}, function(error) {
		    	$scope.loader = false;
		    });
			 $scope.loader = false;
		});
		
		}else {
			
			
			$scope.type = 'V';
			$("#state").hide();
			$("#stateZp").hide();
			$("#stateBp").hide();
			$("#stateZpVp").hide();
			$("#stateVp").show();
			$("#mainDiv").hide();
			var entityCode=stateCode;
			getVpDetails(entityCode);
			
		}
	}
	

	$scope.getVpData =  function getVpData(entityCode, entityName,voucherdate) {
		$scope.type = 'V';
		$("#state").hide();
		$("#stateZp").hide();
		$("#stateBp").hide();
		$("#stateZpVp").hide();
		$("#stateVp").show();
		$("#mainDiv").hide();
		$scope.entityCode = entityCode;
		$scope.entityName = entityName;
		//$scope.voucherdate = voucherdate;
		getVpDetails(entityCode);
	}
	
	function getVpDetails(entityCode){
		$scope.vpList = { };
		$scope.loader = true;
		$scope.sumTotalCount = 0;
		publicReportService.getvpData($scope.finYear, $scope.stateCode, $scope.schemeCode,entityCode,$scope.reportType,$scope.componentType,$scope.schemeComponent,$scope.amountIn,$scope.voucherdate).then(function(response) {
			$scope.vpList = response.data;
			angular.forEach(response.data, function(obj, key) {
				 $scope.sumTotalCount = parseFloat((parseFloat($scope.sumTotalCount)) + (parseFloat(obj.creditamount))).toFixed(2);
			}, function(error) {
		    	$scope.loader = false;
		    });
			 $scope.loader = false;
		});
		
		publicReportService.getStateTier(stateCode).then(function(response){
			$scope.stateTier = response.data;
			
		});
		
		
	}
	

	
		$scope.onBack = function onBack(type) {
		//	var reprtType = $("input[name='reportType']:checked").val();
			if(type == 'Z' || type == 'B' || type == "ZV" ) {
				$("#mainDiv").show();
				$("#state").show();
				$("#stateZp").hide();
				$("#stateBp").hide();
				$("#stateZpVp").hide();
				$("#stateVp").hide();
				$scope.type = 'S';
				$scope.stateTier = null;
				//$scope.getStateDetails($scope.schemeCode);
				$scope.generateReport('submit')
			}else if(type == 'V'){
				$("#mainDiv").hide();
				$("#state").hide();
				$("#stateZp").hide();
				$("#stateBp").hide();
				$("#stateZpVp").show();
				$("#stateVp").hide();
				$scope.type = 'ZV';
				$scope.stateTier = null;
				$scope.entityCode = 0;
				$scope.entityName = null;
				$scope. getZpVpData($scope.stateCode, $scope.stateName,$scope.voucherdate);
				
			}
		}
		
		
		
		/*$scope.exportFile = function exportFile(id) {
			var downloadLink;
			var dataType = 'application/vnd.ms-excel';
			var tableSelect = document.getElementById(id);
			var tableHTML = tableSelect.outerHTML.replace(/ /g, '%20');

			// Specify file name
			var filename = 'reverse_mis_report.xls';

			// Create download link element
			downloadLink = document.createElement("a");

			document.body.appendChild(downloadLink);

			if(navigator.msSaveOrOpenBlob){
			    var blob = new Blob(['\ufeff', tableHTML], {
			        type: dataType
			    });
			    navigator.msSaveOrOpenBlob( blob, filename);
			}else{
			    // Create a link to the file
			    downloadLink.href = 'data:' + dataType + ', ' + tableHTML;

			    // Setting the file name
			    downloadLink.download = filename;
			    
			    //triggering the function
			    downloadLink.click();
			}
			
		}*/
		$scope.exportFile = function exportFile(id) {
			$("#" + id).excelexportjs({
				containerid : id,
				datatype : 'table',
				worksheetName : "reverse_mis_report",
				returnUri: false
			});
		}
		
		$scope.schemeComponentTypeShow = function schemeComponentTypeShow(schemeCode){
			if(schemeCode > 0){
				$("#schemeComponentTypeDiv").show();
			}
		}
		
		$scope.showComp = function showComp(schemeCode,componentType,stateCode){
			if(componentType === 'IC'){
			$("#schemeComponentDiv").show();
			getSchemeChild(schemeCode,"R",0,stateCode);
			}else{
				$scope.childdetails={};
				$scope.schemeComponent=null;
				$("#schemeComponent").val("");
				$("#schemeComponentDiv").hide();
				$scope.componentTypeView = 'ALL';
				 
			}
		}
		
		
		function getSchemeChild(schemeCode,ac_head_type,workCode,stateCode) {
			
			publicReportService.getSchemeChild(schemeCode,ac_head_type,workCode,stateCode).then(function(response) {
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





