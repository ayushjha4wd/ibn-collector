var tiedExpenditureModule = angular.module('tiedExpenditureModule', ['angular.filter']);
tiedExpenditureModule.controller("tiedExpenditureController", ['$scope', "tiedExpenditureService", function($scope, tiedExpenditureService) {

	$scope.type = 'MAIN';
	$scope.finyear = $("#finyear").val();
	$scope.stateName = null;
	$scope.reportType =  $("input[name='reportType']:checked").val();
    $scope.headings = false; 
	
    /*$scope.showReportType = function showReportType(reportType){
		$scope.reportType = reportType;
	}*/
    
	$scope.generateReport = function generateReport(target) {
		var error = false;
		$('.errored').hide();
		$scope.finyear = $("#finyear").val();
		//$scope.reportType = $("#reportType").val();
		
		if($("#finyear").val() == null || $("#finyear").val() == 0) {
			$("#finyear_error").show();
			error = true;
		}
		
		if(!$("input[name='reportType']").is(":checked")) {
			$("#reportType_error").show();
			
			error = true;
		}
		
		
		if(target == 'submit' && !error) {
			$('.errored').hide();
			getTiedData($scope.finyear,$scope.reportType);
		}
	}
	
	

	function getTiedData(finyear,reportType){
		$scope.loader = true;
		$scope.TiedList ={};
		$scope.TiedCountList ={};
		$scope.headings = true;
		$("#mainDiv").hide();
		$("#districtData").hide();
		$("#villDistrictData").hide();
		$("#stateData").show();
		
		tiedExpenditureService.getTiedExpenditureList($scope.finyear,$scope.reportType).then(function(response) {
			if(response.data.length > 0) { 
				$scope.type = 'GEN';
				 var tiedDetail = new Array();
				 var sum =  new sumCount();
					sum.sumTotalTiedOb = 0;
					 sum.sumTotalTiedReceipt = 0;
					 sum.sumTotalTiedExpenditure = 0;
					 sum.sumTotalTiedGrant = 0;
					 sum.sumIrrigation = 0;
					 sum.sumWaterMgmt =  0;
					 sum.sumWaterSupply = 0;
					 sum.sumWatershedMgmt = 0;
					 sum.sumTotalDrinkingWater = 0;
					 sum.sumSanitationSeptageMgmt = 0;
					 sum.sumSewageSolidWasteMgmt = 0;
					 sum.sumStormWaterDrainage = 0;
					 sum.sumTotalSanitation = 0;
					 sum.sumUnspent_amount = 0;
					 sum.sumExpenditures = 0; 

					
				 angular.forEach(response.data, function(obj, key) {
					 var v = new tiedDetails();
					 v.id =  obj.id;
					 v.stateCode = obj.stateCode;
					 v.stateName = obj.stateName;
					 v.totalTiedOb = parseFloat(parseFloat(obj.totalTiedOb)/10000000).toFixed(3);
			         v.totalTiedReceipt = parseFloat(parseFloat(obj.totalTiedReceipt)/10000000).toFixed(3);
			         v.totTiedGrant = obj.totalTiedOb + obj.totalTiedReceipt;
			         v.totalTiedGrant = parseFloat(parseFloat(v.totTiedGrant)/10000000).toFixed(3);
                     v.totalTiedExpenditure = parseFloat(parseFloat(obj.totalTiedExpenditure)/10000000).toFixed(3);
                     v.irrigation = parseFloat(parseFloat(obj.irrigation)/10000000).toFixed(3);
					 v.waterMgmt = parseFloat(parseFloat(obj.waterMgmt)/10000000).toFixed(3);
					 v.waterSupply = parseFloat(parseFloat(obj.waterSupply)/10000000).toFixed(3);
					 v.watershedMgmt = parseFloat(parseFloat(obj.watershedMgmt)/10000000).toFixed(3);
					 v.totDrinkingWater = obj.irrigation + obj.waterMgmt+ obj.waterSupply+ obj.watershedMgmt;
					 v.totalDrinkingWater = parseFloat(parseFloat(v.totDrinkingWater)/10000000).toFixed(3);
					 v.sanitationSeptageMgmt = parseFloat(parseFloat(obj.sanitationSeptageMgmt)/10000000).toFixed(3);
					 v.sewageSolidWasteMgmt = parseFloat(parseFloat(obj.sewageSolidWasteMgmt)/10000000).toFixed(3);
					 v.stormWaterDrainage = parseFloat(parseFloat(obj.stormWaterDrainage)/10000000).toFixed(3);
					 v.totSanitation = obj.sanitationSeptageMgmt + obj.sewageSolidWasteMgmt + obj.stormWaterDrainage ;
					 v.totalSanitation = parseFloat(parseFloat(v.totSanitation)/10000000).toFixed(3);
					 v.unspentAmount = parseFloat(((parseFloat(obj.totalTiedOb/10000000)) + (parseFloat(obj.totalTiedReceipt/10000000)) - (parseFloat(obj.totalTiedExpenditure/10000000)))).toFixed(3);
					
					 v.otherExpenditure = parseFloat((parseFloat(obj.totalTiedExpenditure)/10000000) - ((parseFloat(v.totDrinkingWater)/10000000) + (parseFloat(v.totSanitation)/10000000))).toFixed(3);
					 
					 if(parseFloat(v.otherExpenditure)<0) {
						 
						 v.otherExpenditure =0.00;
					 }

					 tiedDetail.push(v);
					 
					 sum.sumTotalTiedOb = parseFloat((parseFloat(sum.sumTotalTiedOb)) + (parseFloat(obj.totalTiedOb/10000000))).toFixed(3);
					 sum.sumTotalTiedReceipt = parseFloat((parseFloat(sum.sumTotalTiedReceipt)) + (parseFloat(obj.totalTiedReceipt/10000000))).toFixed(3);
					 sum.sumTotalTiedGrant = parseFloat((parseFloat(sum.sumTotalTiedGrant)) + (parseFloat(v.totalTiedGrant))).toFixed(3);
				     sum.sumTotalTiedExpenditure = parseFloat((parseFloat(sum.sumTotalTiedExpenditure)) + (parseFloat(obj.totalTiedExpenditure/10000000))).toFixed(3);
					 sum.sumIrrigation = parseFloat((parseFloat(sum.sumIrrigation)) + (parseFloat(obj.irrigation/10000000))).toFixed(3);
					 sum.sumWaterMgmt = parseFloat((parseFloat(sum.sumWaterMgmt)) + (parseFloat(obj.waterMgmt/10000000))).toFixed(3);
					 sum.sumWaterSupply = parseFloat((parseFloat(sum.sumWaterSupply)) + (parseFloat(obj.waterSupply/10000000))).toFixed(3);
					 sum.sumWatershedMgmt = parseFloat((parseFloat(sum.sumWatershedMgmt)) + (parseFloat(obj.watershedMgmt/10000000))).toFixed(3);
					 sum.sumTotalDrinkingWater = parseFloat((parseFloat(sum.sumTotalDrinkingWater)) + (parseFloat(v.totDrinkingWater/10000000))).toFixed(3);
					 sum.sumSanitationSeptageMgmt = parseFloat((parseFloat(sum.sumSanitationSeptageMgmt)) + (parseFloat(obj.sanitationSeptageMgmt/10000000))).toFixed(3);
					 sum.sumSewageSolidWasteMgmt = parseFloat((parseFloat(sum.sumSewageSolidWasteMgmt)) + (parseFloat(obj.sewageSolidWasteMgmt/10000000))).toFixed(3);
					 sum.sumStormWaterDrainage = parseFloat((parseFloat(sum.sumStormWaterDrainage)) + (parseFloat(obj.stormWaterDrainage/10000000))).toFixed(3);
					 sum.sumTotalSanitation = parseFloat((parseFloat(sum.sumTotalSanitation)) + (parseFloat(v.totSanitation/10000000))).toFixed(3);
					 sum.sumUnspent_amount =  parseFloat((parseFloat(sum.sumUnspent_amount)) + ((parseFloat(obj.totalTiedOb/10000000)) +
							 (parseFloat(obj.totalTiedReceipt/10000000)) - (parseFloat(obj.totalTiedExpenditure/10000000)))).toFixed(3);
					 
					 /*sum.sumotherexp =  parseFloat(parseFloat(obj.totalTiedExpenditure)/10000000) - (parseFloat(parseFloat(v.totDrinkingWater)/10000000)+parseFloat(parseFloat(v.totSanitation)/10000000)).toFixed(3);*/
					 

					 sum.sumExpenditures = parseFloat((parseFloat(sum.sumExpenditures)) + ((parseFloat(obj.totalTiedExpenditure)/10000000) - ((parseFloat(v.totDrinkingWater)/10000000) + (parseFloat(v.totSanitation)/10000000))) ).toFixed(3);

					 if(parseFloat(sum.sumExpenditures)<0) {
						 
						 sum.sumExpenditures =0.00;
					 }
					 
					 
				}, function(error) {
					
			    	$scope.loader = false;
			    });
			
				 $scope.TiedList = tiedDetail;
				 $scope.TiedCountList = sum;
				 $scope.loader = false;
			} else {
				$scope.loader = false;
				$("#mainDiv").show();
				$("#stateData").hide();
				$("#villDistrictData").hide();
				$("#districtData").hide();
				$scope.type = 'MAIN';
				$("#finyear").val("");
				$("input[name='reportType']").prop("checked", false);
			    alert("No Data Found");
				
			}
		   });
		
	}

$scope.onBack = function onBack(type) {
		
		if(type == 'GEN') {
			$scope.type = 'MAIN';
			$("#mainDiv").show();
			$("#finyear").val("");
			$("input[name='reportType']").prop("checked", false);
			$("#stateData").hide();
			$("#villDistrictData").hide();
			$("#districtData").hide();
			$scope.finYear = null;
		
		}else if(type == 'D') {
			$scope.type = 'GEN';
			$("#mainDiv").hide();
			$("#stateData").show();
			$("#villDistrictData").hide();
			$("#districtData").hide();
			$scope.finYear = null;
		
		}else if(type == 'V') {
			$scope.type = 'D';
			$("#mainDiv").hide();
			$("#stateData").hide();
			$("#villDistrictData").hide();
			$("#districtData").show();
			$scope.finYear = null;
		
		}
}

$scope.exportFile = function exportFile(id) {
	$("#" + id).excelexportjs({
		containerid : id,
		datatype : 'table',
		worksheetName : "Expenditure Tied Grant Report",
		returnUri: false
	});
}

////shagun//////


$scope.getDistrictData = function getDistrictData(StateId,stateName){
	if(StateId>0){
	//$scope.reportType = $("#reportType").val();
	if($scope.reportType == 'Z'){
		$scope.level = "Zilla Panchayat And Equivalent";
		$scope.stateName =stateName;
		
	}else if($scope.reportType == 'B'){
		$scope.level = "Block Panchayat And Equivalent";
		$scope.stateName =stateName;
		
	}else if($scope.reportType == 'V'){
		$scope.level = "Village Panchayat And Equivalent";
		$scope.stateName =stateName;
		
	}
	getDistrictDataList(StateId,stateName);
}
			    
}

function getDistrictDataList(StateId,stateName){
	$scope.loader = true;
	$scope.DistrictTiedList ={};
	$scope.TiedCountList ={};
	$scope.headings = true;
	$scope.stateName =stateName;
	$("#mainDiv").hide();
	$("#stateData").hide();
	$("#villDistrictData").hide();
	$("#districtData").show();
	//$scope.finyear ="2022-2023";
	tiedExpenditureService.getDistrictTiedExpList($scope.finyear,$scope.reportType,StateId).then(function(response) {
		if(response.data.length > 0) { 
			$scope.type = 'D';
			 var tiedDetail = new Array();
			 var sum =  new sumCount();
				sum.sumTotalTiedOb = 0;
				 sum.sumTotalTiedReceipt = 0;
				 sum.sumTotalTiedExpenditure = 0;
				 sum.sumTotalTiedGrant = 0;
				 sum.sumIrrigation = 0;
				 sum.sumWaterMgmt =  0;
				 sum.sumWaterSupply = 0;
				 sum.sumWatershedMgmt = 0;
				 sum.sumTotalDrinkingWater = 0;
				 sum.sumSanitationSeptageMgmt = 0;
				 sum.sumSewageSolidWasteMgmt = 0;
				 sum.sumStormWaterDrainage = 0;
				 sum.sumTotalSanitation = 0;
				 sum.sumUnspent_amount = 0;
				 sum.sumExpenditures = 0; 
				
			 angular.forEach(response.data, function(obj, key) {
				 var v = new tiedDetails();
				 v.id =  obj.id;
				 v.stateCode = obj.stateCode;
				 v.stateName = obj.stateName;
				 v.glbName = obj.glbName;	 
				 v.glbCode = obj.glbCode;
				 v.plbName = obj.plbName;
				 v.plbCode = obj.plbCode;
				 v.lbName = obj.lbName;
				 v.lbCode = obj.lbCode;				 
				 
				 v.totalTiedOb = parseFloat(parseFloat(obj.totalTiedOb)/10000000).toFixed(3);
		         v.totalTiedReceipt = parseFloat(parseFloat(obj.totalTiedReceipt)/10000000).toFixed(3);
		         v.totTiedGrant = obj.totalTiedOb + obj.totalTiedReceipt;
		         v.totalTiedGrant = parseFloat(parseFloat(v.totTiedGrant)/10000000).toFixed(3);
                 v.totalTiedExpenditure = parseFloat(parseFloat(obj.totalTiedExpenditure)/10000000).toFixed(3);
                 v.irrigation = parseFloat(parseFloat(obj.irrigation)/10000000).toFixed(3);
				 v.waterMgmt = parseFloat(parseFloat(obj.waterMgmt)/10000000).toFixed(3);
				 v.waterSupply = parseFloat(parseFloat(obj.waterSupply)/10000000).toFixed(3);
				 v.watershedMgmt = parseFloat(parseFloat(obj.watershedMgmt)/10000000).toFixed(3);
				 v.totDrinkingWater = obj.irrigation + obj.waterMgmt+ obj.waterSupply+ obj.watershedMgmt;
				 v.totalDrinkingWater = parseFloat(parseFloat(v.totDrinkingWater)/10000000).toFixed(3);
				 v.sanitationSeptageMgmt = parseFloat(parseFloat(obj.sanitationSeptageMgmt)/10000000).toFixed(3);
				 v.sewageSolidWasteMgmt = parseFloat(parseFloat(obj.sewageSolidWasteMgmt)/10000000).toFixed(3);
				 v.stormWaterDrainage = parseFloat(parseFloat(obj.stormWaterDrainage)/10000000).toFixed(3);
				 v.totSanitation = obj.sanitationSeptageMgmt + obj.sewageSolidWasteMgmt + obj.stormWaterDrainage ;
				 v.totalSanitation = parseFloat(parseFloat(v.totSanitation)/10000000).toFixed(3);
				 v.unspentAmount = parseFloat(((parseFloat(obj.totalTiedOb/10000000)) + (parseFloat(obj.totalTiedReceipt/10000000)) - (parseFloat(obj.totalTiedExpenditure/10000000)))).toFixed(3);
				
				 v.otherExpenditure = parseFloat((parseFloat(obj.totalTiedExpenditure)/10000000) - ((parseFloat(v.totDrinkingWater)/10000000) + (parseFloat(v.totSanitation)/10000000))).toFixed(3);

				 if(parseFloat(v.otherExpenditure)<0) {
					 
					 v.otherExpenditure =0.00;
				 }
				 
				 
				 tiedDetail.push(v);
				 
				 sum.sumTotalTiedOb = parseFloat((parseFloat(sum.sumTotalTiedOb)) + (parseFloat(obj.totalTiedOb/10000000))).toFixed(3);
				 sum.sumTotalTiedReceipt = parseFloat((parseFloat(sum.sumTotalTiedReceipt)) + (parseFloat(obj.totalTiedReceipt/10000000))).toFixed(3);
				 sum.sumTotalTiedGrant = parseFloat((parseFloat(sum.sumTotalTiedGrant)) + (parseFloat(v.totalTiedGrant))).toFixed(3);
			     sum.sumTotalTiedExpenditure = parseFloat((parseFloat(sum.sumTotalTiedExpenditure)) + (parseFloat(obj.totalTiedExpenditure/10000000))).toFixed(3);
				 sum.sumIrrigation = parseFloat((parseFloat(sum.sumIrrigation)) + (parseFloat(obj.irrigation/10000000))).toFixed(3);
				 sum.sumWaterMgmt = parseFloat((parseFloat(sum.sumWaterMgmt)) + (parseFloat(obj.waterMgmt/10000000))).toFixed(3);
				 sum.sumWaterSupply = parseFloat((parseFloat(sum.sumWaterSupply)) + (parseFloat(obj.waterSupply/10000000))).toFixed(3);
				 sum.sumWatershedMgmt = parseFloat((parseFloat(sum.sumWatershedMgmt)) + (parseFloat(obj.watershedMgmt/10000000))).toFixed(3);
				 sum.sumTotalDrinkingWater = parseFloat((parseFloat(sum.sumTotalDrinkingWater)) + (parseFloat(v.totDrinkingWater/10000000))).toFixed(3);
				 sum.sumSanitationSeptageMgmt = parseFloat((parseFloat(sum.sumSanitationSeptageMgmt)) + (parseFloat(obj.sanitationSeptageMgmt/10000000))).toFixed(3);
				 sum.sumSewageSolidWasteMgmt = parseFloat((parseFloat(sum.sumSewageSolidWasteMgmt)) + (parseFloat(obj.sewageSolidWasteMgmt/10000000))).toFixed(3);
				 sum.sumStormWaterDrainage = parseFloat((parseFloat(sum.sumStormWaterDrainage)) + (parseFloat(obj.stormWaterDrainage/10000000))).toFixed(3);
				 sum.sumTotalSanitation = parseFloat((parseFloat(sum.sumTotalSanitation)) + (parseFloat(v.totSanitation/10000000))).toFixed(3);
				 sum.sumUnspent_amount =  parseFloat((parseFloat(sum.sumUnspent_amount)) + ((parseFloat(obj.totalTiedOb/10000000)) +
						 (parseFloat(obj.totalTiedReceipt/10000000)) - (parseFloat(obj.totalTiedExpenditure/10000000)))).toFixed(3);
				 
				 /*sum.sumotherexp =  parseFloat(parseFloat(obj.totalTiedExpenditure)/10000000) - (parseFloat(parseFloat(v.totDrinkingWater)/10000000)+parseFloat(parseFloat(v.totSanitation)/10000000)).toFixed(3);*/
				 

				 sum.sumExpenditures = parseFloat((parseFloat(sum.sumExpenditures)) + ((parseFloat(obj.totalTiedExpenditure)/10000000) - ((parseFloat(v.totDrinkingWater)/10000000) + (parseFloat(v.totSanitation)/10000000))) ).toFixed(3);

				 if(parseFloat(sum.otherExpenditure)<0) {
					 
					 sum.otherExpenditure =0.00;
				 }
				 
				 
			}, function(error) {
				
		    	$scope.loader = false;
		    });
		
			 $scope.DistrictTiedList = tiedDetail;
			 $scope.TiedCountList = sum;
			 $scope.loader = false;
		} else {
			$scope.loader = false;
			$("#mainDiv").show();
			$("#districtData").hide();
			$("#villDistrictData").hide();
			$("#stateData").hide();
			$scope.type = 'MAIN';
			$("#finyear").val("");
			$("input[name='reportType']").prop("checked", false);
			//$scope.reportType = null;
		    alert("No Data Found");
			
		}
	   });
	
}

$scope.getVillageDistrictData = function getDistrictData(StateId,stateName,glbName,glbCode){
	if(glbCode > 0){
		if($scope.reportType == 'V'){
			$scope.level = "Village Panchayat And Equivalent";
			$scope.stateName =stateName;
			$scope.glbName =glbName;
		}else if($scope.reportType == 'A'){
			$scope.level = "All Panchayat And Equivalent";
			$scope.stateName =stateName;
			$scope.glbName =glbName;
		}
		getVillDistrictDataList(StateId,glbCode);
	}
			    
}


function getVillDistrictDataList(StateId,glbCode){
	$scope.loader = true;
	$scope.VillDistTiedList ={};
	$scope.TiedCountList ={};
	$scope.headings = true;
	$("#mainDiv").hide();
	$("#stateData").hide();
	$("#districtData").hide();
	$("#villDistrictData").show();
	//$scope.finyear ="2022-2023";
	tiedExpenditureService.getVillDistTiedExpList($scope.finyear,$scope.reportType,StateId,glbCode).then(function(response) {
		if(response.data.length > 0) { 
			$scope.type = 'V';
			 var tiedDetail = new Array();
			 var sum =  new sumCount();
				sum.sumTotalTiedOb = 0;
				 sum.sumTotalTiedReceipt = 0;
				 sum.sumTotalTiedExpenditure = 0;
				 sum.sumTotalTiedGrant = 0;
				 sum.sumIrrigation = 0;
				 sum.sumWaterMgmt =  0;
				 sum.sumWaterSupply = 0;
				 sum.sumWatershedMgmt = 0;
				 sum.sumTotalDrinkingWater = 0;
				 sum.sumSanitationSeptageMgmt = 0;
				 sum.sumSewageSolidWasteMgmt = 0;
				 sum.sumStormWaterDrainage = 0;
				 sum.sumTotalSanitation = 0;
				 sum.sumUnspent_amount = 0;
				 sum.sumExpenditures = 0; 
				
			 angular.forEach(response.data, function(obj, key) {
				 var v = new tiedDetails();
				 v.id =  obj.id;
				 v.stateCode = obj.stateCode;
				 v.stateName = obj.stateName;
				 v.glbName = obj.glbName;	 
				 v.glbCode = obj.glbCode;
				 v.plbName = obj.plbName;
				 v.plbCode = obj.plbCode;
				 v.lbName = obj.lbName;
				 v.lbCode = obj.lbCode;				 
				 
				 v.totalTiedOb = parseFloat(parseFloat(obj.totalTiedOb)/10000000).toFixed(3);
		         v.totalTiedReceipt = parseFloat(parseFloat(obj.totalTiedReceipt)/10000000).toFixed(3);
		         v.totTiedGrant = obj.totalTiedOb + obj.totalTiedReceipt;
		         v.totalTiedGrant = parseFloat(parseFloat(v.totTiedGrant)/10000000).toFixed(3);
                 v.totalTiedExpenditure = parseFloat(parseFloat(obj.totalTiedExpenditure)/10000000).toFixed(3);
                 v.irrigation = parseFloat(parseFloat(obj.irrigation)/10000000).toFixed(3);
				 v.waterMgmt = parseFloat(parseFloat(obj.waterMgmt)/10000000).toFixed(3);
				 v.waterSupply = parseFloat(parseFloat(obj.waterSupply)/10000000).toFixed(3);
				 v.watershedMgmt = parseFloat(parseFloat(obj.watershedMgmt)/10000000).toFixed(3);
				 v.totDrinkingWater = obj.irrigation + obj.waterMgmt+ obj.waterSupply+ obj.watershedMgmt;
				 v.totalDrinkingWater = parseFloat(parseFloat(v.totDrinkingWater)/10000000).toFixed(3);
				 v.sanitationSeptageMgmt = parseFloat(parseFloat(obj.sanitationSeptageMgmt)/10000000).toFixed(3);
				 v.sewageSolidWasteMgmt = parseFloat(parseFloat(obj.sewageSolidWasteMgmt)/10000000).toFixed(3);
				 v.stormWaterDrainage = parseFloat(parseFloat(obj.stormWaterDrainage)/10000000).toFixed(3);
				 v.totSanitation = obj.sanitationSeptageMgmt + obj.sewageSolidWasteMgmt + obj.stormWaterDrainage ;
				 v.totalSanitation = parseFloat(parseFloat(v.totSanitation)/10000000).toFixed(3);
				 v.unspentAmount = parseFloat(((parseFloat(obj.totalTiedOb/10000000)) + (parseFloat(obj.totalTiedReceipt/10000000)) - (parseFloat(obj.totalTiedExpenditure/10000000)))).toFixed(3);
				
				 v.otherExpenditure = parseFloat((parseFloat(obj.totalTiedExpenditure)/10000000) - ((parseFloat(v.totDrinkingWater)/10000000) + (parseFloat(v.totSanitation)/10000000))).toFixed(3);
				 
				 if(parseFloat(v.otherExpenditure)<0) {
					 
					 v.otherExpenditure =0.00;
				 }
				 
				 tiedDetail.push(v);
				 
				 sum.sumTotalTiedOb = parseFloat((parseFloat(sum.sumTotalTiedOb)) + (parseFloat(obj.totalTiedOb/10000000))).toFixed(3);
				 sum.sumTotalTiedReceipt = parseFloat((parseFloat(sum.sumTotalTiedReceipt)) + (parseFloat(obj.totalTiedReceipt/10000000))).toFixed(3);
				 sum.sumTotalTiedGrant = parseFloat((parseFloat(sum.sumTotalTiedGrant)) + (parseFloat(v.totalTiedGrant))).toFixed(3);
			     sum.sumTotalTiedExpenditure = parseFloat((parseFloat(sum.sumTotalTiedExpenditure)) + (parseFloat(obj.totalTiedExpenditure/10000000))).toFixed(3);
				 sum.sumIrrigation = parseFloat((parseFloat(sum.sumIrrigation)) + (parseFloat(obj.irrigation/10000000))).toFixed(3);
				 sum.sumWaterMgmt = parseFloat((parseFloat(sum.sumWaterMgmt)) + (parseFloat(obj.waterMgmt/10000000))).toFixed(3);
				 sum.sumWaterSupply = parseFloat((parseFloat(sum.sumWaterSupply)) + (parseFloat(obj.waterSupply/10000000))).toFixed(3);
				 sum.sumWatershedMgmt = parseFloat((parseFloat(sum.sumWatershedMgmt)) + (parseFloat(obj.watershedMgmt/10000000))).toFixed(3);
				 sum.sumTotalDrinkingWater = parseFloat((parseFloat(sum.sumTotalDrinkingWater)) + (parseFloat(v.totDrinkingWater/10000000))).toFixed(3);
				 sum.sumSanitationSeptageMgmt = parseFloat((parseFloat(sum.sumSanitationSeptageMgmt)) + (parseFloat(obj.sanitationSeptageMgmt/10000000))).toFixed(3);
				 sum.sumSewageSolidWasteMgmt = parseFloat((parseFloat(sum.sumSewageSolidWasteMgmt)) + (parseFloat(obj.sewageSolidWasteMgmt/10000000))).toFixed(3);
				 sum.sumStormWaterDrainage = parseFloat((parseFloat(sum.sumStormWaterDrainage)) + (parseFloat(obj.stormWaterDrainage/10000000))).toFixed(3);
				 sum.sumTotalSanitation = parseFloat((parseFloat(sum.sumTotalSanitation)) + (parseFloat(v.totSanitation/10000000))).toFixed(3);
				 sum.sumUnspent_amount =  parseFloat((parseFloat(sum.sumUnspent_amount)) + ((parseFloat(obj.totalTiedOb/10000000)) +
						 (parseFloat(obj.totalTiedReceipt/10000000)) - (parseFloat(obj.totalTiedExpenditure/10000000)))).toFixed(3);
				 
				 /*sum.sumotherexp =  parseFloat(parseFloat(obj.totalTiedExpenditure)/10000000) - (parseFloat(parseFloat(v.totDrinkingWater)/10000000)+parseFloat(parseFloat(v.totSanitation)/10000000)).toFixed(3);*/
				 

				 sum.sumExpenditures = parseFloat((parseFloat(sum.sumExpenditures)) + ((parseFloat(obj.totalTiedExpenditure)/10000000) - ((parseFloat(v.totDrinkingWater)/10000000) + (parseFloat(v.totSanitation)/10000000))) ).toFixed(3);

				 if(parseFloat(sum.otherExpenditure)<0) {
					 
					 sum.otherExpenditure =0.00;
				 }
				 
				 
				 
			}, function(error) {
				
		    	$scope.loader = false;
		    });
		
			 $scope.VillDistTiedList = tiedDetail;
			 $scope.TiedCountList = sum;
			 $scope.loader = false;
		} else {
			$scope.loader = false;
			$("#mainDiv").show();
			$("#villDistrictData").hide();
			$("#districtData").hide();
			$("#stateData").hide();
			$scope.type = 'MAIN';
			$("#finyear").val("");
			$("input[name='reportType']").prop("checked", false);
			//$scope.reportType = null;
		    alert("No Data Found");
			
		}
	   });
	
}


$scope.generateDashboard = function generateDashboard(target) {
	var error = false;
	$('.errored').hide();
	$scope.finyear = $("#finyear").val();
	//$scope.reportType = $("#reportType").val();
	
	if($("#finyear").val() == null || $("#finyear").val() == 0) {
		$("#finyear_error").show();
		error = true;
	}
	
	if(target == 'submit' && !error) {
		$('.errored').hide();
		getAuditData($scope.finyear);
		
		$timeout(function(){
			getDashboardData($scope.finyear);
			
		},200);
			
		
	}
}

function getAuditData(finyear){
	$scope.auditData = null;
	tiedExpenditureService.getAuditData($scope.finyear).then(function(response){
		$scope.auditData = response.data;
	});
	}

function getDashboardData(finyear){
	$scope.loader = true;
	$scope.DashboardList ={};
	$scope.headings = true;
	$("#mainDiv").hide();
	$("#stateData").show();
	$scope.DashboardList ={};
	tiedExpenditureService.getOnBoardDashboardDataList($scope.finyear).then(function(response) {
		if(response.data.length > 0) { 
			$scope.type = 'GEN';
			 var onboardDetails = new Array();
		 angular.forEach(response.data, function(obj, key) {
				 var v = new onboardReport();
				 v.id = obj.id;
				 v.stateCode = obj.stateCode;
				
				 v.stateName = obj.stateName;
				  v.totalGP = obj.totalGP;
				   v.totalGPWithPlanUploded = obj.totalGPWithPlanUploded;
				    v.totalGPWithPlanUplodedYear = obj.totalGPWithPlanUplodedYear;
				     v.totalGPWithFundReceived = obj.totalGPWithFundReceived;
				     v.totalGPWithPayment = obj.totalGPWithPayment;
				       v.totalFundReceived = obj.totalFundReceived;
				         v.totalPayment = obj.totalPayment;
				           v.totalGpWithElectionTerm = obj.totalGpWithElectionTerm;
				            angular.forEach($scope.auditData , function(auditobj, keys) {
								
								if(auditobj.state_code==obj.stateCode){
									
									v.totalGpWithAudit = auditobj.count;
									
								}
								});
								
								if(v.totalGpWithAudit == null){
									v.totalGpWithAudit = 0;
								}
								
						onboardDetails.push(v);		
				     
			}, function(error) {
				
		    	$scope.loader = false;
		    });
			 $scope.DashboardList = onboardDetails;
			 $scope.loader = false;
		} else {
			$scope.loader = false;
			$("#mainDiv").show();
			$("#stateData").hide();
			$scope.type = 'MAIN';
			$scope.finYear = null;
		    alert("No Data Found");
			
		}
	   });
	   
	   
	   
	
}

$scope.onBackAudit = function onBackAudit(type) {
	
	if(type == 'GEN') {
		$scope.type = 'MAIN';
		$("#mainDiv").show();
		$("#finyear").val("");
		$("#stateData").hide();
		$scope.finYear = null;
	
	}
}

	
}]);





