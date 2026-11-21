var gpProfileModule = angular.module("gpProfileModule", []);
gpProfileModule.directive('ngClick', function () {
    return function (scope, element, attrs) {
        element.bind("keydown keypress", function (event) {
            if (event.which === 13) {
                scope.$apply(function () {
                    scope.$eval(attrs.ngClick);
                });

                event.preventDefault();
            }
        });
    };
});
gpProfileModule.controller("gpProfileController", [ '$scope', '$timeout', '$compile', "gpProfileService", function($scope, $timeout, $compile, gpProfileService) {
	$scope.stateCode = null;
	$scope.stateName = null;
	$scope.districtId = null;
	$scope.districtName = null;
	$scope.zpName = null;
	$scope.zpCode = null;
	$scope.code = null;
	$scope.name = null;
	$scope.updatedGpCount = null;
	$scope.percentage = null
	$scope.per = null
	$scope.type = 'S';
	$scope.loader = true;
	$scope.details = {};
	$scope.year = $("#year").val();
	getStateDetails();
	function getStateDetails() {
		if ($.fn.DataTable.isDataTable('#stateTable')) {
	        $('#stateTable').DataTable().clear().destroy();
	    }
		//$('#stateLevelTRId').text('');
		loader1('Loading');
		gpProfileService.findStateWise($scope.year).then(function(response) {
			
			$scope.loader = true;
			$scope.type = 'S';
			$scope.data = response.data;
			$scope.details = {};
			$scope.sumTotalGPCount = 0;
			$scope.totalGPUpdatedCount = 0;
			$scope.totalGPUpdPercent = 0;
			
			$scope.totalCount = 0;
			var gpProfileDetails = new Array();
			angular.forEach($scope.data, function(obj, key) {
				var gpProfile = new state();
				//if(obj.code != 7 && obj.code != 4) {
					gpProfile.stateCode = obj.code;
					gpProfile.stateName = obj.name;
					gpProfile.totalGPCount = obj.gpCount;
					gpProfile.count = obj.count;
					gpProfile.updatedGpCount = obj.updatedGpCount;
					/*gpProfile.percentage = ((obj.updatedGpCount / obj.gpCount) * 100).toFixed(2);
					gpProfile.gpProfilePercentage = ((obj.count / obj.gpCount) * 100).toFixed(2);*/
					gpProfile.percentage = obj.gpCount > 0 ? ((obj.updatedGpCount / obj.gpCount) * 100).toFixed(2) : "0.00";
				    gpProfile.gpProfilePercentage = obj.gpCount > 0 ? ((obj.count / obj.gpCount) * 100).toFixed(2) : "0.00";

					
					gpProfileDetails.push(gpProfile);
					
					$scope.sumTotalGPCount = $scope.sumTotalGPCount + obj.gpCount;
					$scope.totalCount = $scope.totalCount + obj.count;
					$scope.totalGPUpdatedCount = $scope.totalGPUpdatedCount + obj.updatedGpCount;
					$scope.totalGPUpdPercent = (($scope.totalGPUpdatedCount / $scope.sumTotalGPCount) * 100).toFixed(2);
					$scope.totalGPProfilePercent = (($scope.totalCount / $scope.sumTotalGPCount) * 100).toFixed(2);
				//}
				
			});	
			//$scope.details = []; // reset
			
			$scope.details = gpProfileDetails;
			$timeout(function () {
				$('#stateTable').DataTable(
						{
							pageLength: -1,
				            lengthMenu: [[-1, 10, 25, 50, 100], ["All", 10, 25, 50, 100]],
				            searching: true,
				            ordering: true, 
				            responsive: true,
				            footerCallback: null
				        });
	        }, 0);
	       
			removeLoader();
			$scope.loader = false;
	    });
		
		
	}

	$scope.onDistrictCount = function onDistrictCount(stateId, stateName){
		document.getElementById('stateLevel').style.display = 'none';
		$scope.stateCode = stateId;
		$scope.stateName = stateName;
		if(stateId == 13 || stateId == 15 || stateId == 17) {
			document.getElementById('villageLevel').style.display = '';
			if(stateId == 13) {
				villageDetails(12);
			}
			if(stateId == 15) {
				villageDetails(11);
			}
			if(stateId == 17) {
				villageDetails(22)
			}
			$scope.type = 'SGP';
		} else if(stateId == 34){
			document.getElementById('blockCountLevel').style.display = '';
			$scope.type = 'SB';
			getBlockCount(2);
		} else {
			document.getElementById('districtCountLevel').style.display = '';
			getDistrictCount(stateId);
		}
	}
	
	function getDistrictCount(stateId) {
		$scope.loader = true;
		$scope.type = 'D';
		$scope.sumTotalGPCount = 0;
		$scope.totalDistrictCount = 0;
		$scope.details = {};
		$scope.totalGPUpdatedCount = 0;
		$scope.totalGPUpdPercent = 0;
		$scope.totalCount = 0;
		
		loader1('Loading');
		
		if ($.fn.DataTable.isDataTable('#distTable')) {
	        $('#distTable').DataTable().clear().destroy();
	    }
		
		gpProfileService.findDistrictCountForGP(stateId, $scope.year).then(function(response) {
			$scope.data = response.data;
			var gpProfileDetails = new Array();
			angular.forEach($scope.data, function(obj, key) {
				var gpProfile = new gpCount();
				if(obj.level != null) {
					gpProfile.entityCode = obj.code;
					gpProfile.entityName = obj.name;
					gpProfile.totalGPCount = obj.gpCount;
					gpProfile.count = obj.count;
					gpProfile.level = obj.level;
					
					gpProfile.updatedGpCount = obj.updatedGpCount;
					gpProfile.percentage = ((obj.updatedGpCount / obj.gpCount) * 100).toFixed(2);
					gpProfile.profileDetailsPercentage = ((obj.count / obj.gpCount) * 100).toFixed(2);
					
					gpProfileDetails.push(gpProfile);
				
					$scope.sumTotalGPCount = $scope.sumTotalGPCount + obj.gpCount;
					$scope.totalDistrictCount = $scope.totalDistrictCount + obj.count;
					
					$scope.totalGPUpdatedCount = $scope.totalGPUpdatedCount + obj.updatedGpCount;
					$scope.totalGPUpdPercent = (($scope.totalGPUpdatedCount / $scope.sumTotalGPCount) * 100).toFixed(2);
					$scope.totalGPDetailsPercent = (($scope.totalDistrictCount / $scope.sumTotalGPCount) * 100).toFixed(2);
				}
			});	
			$scope.details = gpProfileDetails;
			
			$timeout(function () {
				$('#distTable').DataTable(
						{
							pageLength: -1,
				            lengthMenu: [[-1, 10, 25, 50, 100], ["All", 10, 25, 50, 100]],
				            searching: true,
				            ordering: true, 
				            responsive: true,
				            footerCallback: null
				        });
	        }, 0);
			
			$scope.loader = false;
			removeLoader();
	    });
	}
	
	$scope.onBlockCount = function onBlockCount(zpId, zpName){
		document.getElementById('stateLevel').style.display = 'none';
		document.getElementById('districtCountLevel').style.display = 'none';
		document.getElementById('blockCountLevel').style.display = '';
		if($scope.stateCode != 34){
			$scope.zpName = zpName;
			$scope.zpCode = zpId;
			$scope.type = 'B';
		}
		getBlockCount(zpId);
	}
	
	function getBlockCount(zpId) {
		$scope.loader = true;
		$scope.sumTotalGPCount = 0;
		$scope.totalBlockCount = 0;
		$scope.details = {};
		$scope.totalGPUpdatedCount = 0;
		$scope.totalGPUpdPercent = 0;
		$scope.totalCount = 0;
		
		loader1('Loading');
		
		if ($.fn.DataTable.isDataTable('#blockTable')) {
	        $('#blockTable').DataTable().clear().destroy();
	    }
		
		gpProfileService.findBlockCountForGP($scope.stateCode, zpId, $scope.year).then(function(response) {
			$scope.data = response.data;
			var gpProfileDetails = new Array();
			angular.forEach($scope.data, function(obj, key) {
				var gpProfile = new gpCount();
				gpProfile.entityCode = obj.code;
				gpProfile.entityName = obj.name;
				gpProfile.totalGPCount = obj.gpCount;
				gpProfile.count = obj.count;
				gpProfile.level = obj.level;
				
				gpProfile.updatedGpCount = obj.updatedGpCount;
				gpProfile.percentage = ((obj.updatedGpCount / obj.gpCount) * 100).toFixed(2);
				gpProfile.profileDetailsPercentage = ((obj.count / obj.gpCount) * 100).toFixed(2);
				
				gpProfileDetails.push(gpProfile);
				
				$scope.sumTotalGPCount = $scope.sumTotalGPCount + obj.gpCount;
				$scope.totalBlockCount = $scope.totalBlockCount + obj.count;
				
				$scope.totalGPUpdatedCount = $scope.totalGPUpdatedCount + obj.updatedGpCount;
				$scope.totalGPUpdPercent = (($scope.totalGPUpdatedCount / $scope.sumTotalGPCount) * 100).toFixed(2);
				$scope.totalGPProfileDetailsPercent = (($scope.totalBlockCount / $scope.sumTotalGPCount) * 100).toFixed(2);
				
			});	
			$scope.details = gpProfileDetails;
			
			$timeout(function () {
				$('#blockTable').DataTable(
						{
							pageLength: -1,
				            lengthMenu: [[-1, 10, 25, 50, 100], ["All", 10, 25, 50, 100]],
				            searching: true,
				            ordering: true, 
				            responsive: true,
				            footerCallback: null
				        });
	        }, 0);
			
			$scope.loader = false;
			removeLoader();
	    });
	}
	
	$scope.onVillage = function onVillage(code, name, type){
		document.getElementById('stateLevel').style.display = 'none';
		document.getElementById('districtCountLevel').style.display = 'none';
		document.getElementById('blockCountLevel').style.display = 'none';
		document.getElementById('villageLevel').style.display = '';
		$('#villageTable').DataTable().clear().destroy();
		if(type == 'D') {
			$scope.zpName = name;
			$scope.type = 'DGP';
		} else {
			$scope.name = name;
			$scope.type = 'BGP';
		}
		villageDetails(code);
	}
	
	function villageDetails(code) {
		$scope.loader = true;
		$scope.details = {};
		
		loader1('Loading');
		
		if ($.fn.DataTable.isDataTable('#villageTable')) {
	        $('#villageTable').DataTable().clear().destroy();
	    }
		
		gpProfileService.findVillageWise($scope.stateCode, code, $scope.year).then(function(response) {
			$scope.data = response.data;
			var gpProfileDetails = new Array();
			angular.forEach($scope.data, function(obj, key) {
				var gpProfile = new gpCount();
				gpProfile.entityCode = obj.code;
				gpProfile.entityName = obj.name;
				gpProfile.count = obj.count;
				gpProfile.updatedGpCount = obj.updatedGpCount;
				gpProfileDetails.push(gpProfile);
			});	
			$scope.details = gpProfileDetails;
			
			if($scope.stateCode == 13){
					$timeout(function () {
						$('#villageTable').DataTable(
								{
									pageLength: 10,
								    lengthMenu: [[10, 25, 50, 100], [10, 25, 50, 100]],
						            searching: true,
						            ordering: true, 
						            responsive: true,
						            footerCallback: null,
						            deferRender: true, // This helps with large data sets
					                //data: $scope.details // Directly use the updated data
						        });
			        }, 0);
					$scope.loader = false;
					removeLoader();
			   
			}else{
				$timeout(function () {
					$('#villageTable').DataTable(
							{
								pageLength: -1,
					            lengthMenu: [[-1, 10, 25, 50, 100], ["All", 10, 25, 50, 100]],
					            searching: true,
					            ordering: true, 
					            responsive: true,
					            footerCallback: null,
					            deferRender: true, // This helps with large data sets
				                //data: $scope.details // Directly use the updated data
					        });
		        }, 0);
				$scope.loader = false;
				removeLoader();
		   
			}
		 });
	}
	
	$scope.onBack = function(stateCode, type, zpCode) {
		document.getElementById('districtCountLevel').style.display = 'none';
		document.getElementById('blockCountLevel').style.display = 'none';
		document.getElementById('villageLevel').style.display = 'none';
		document.getElementById('stateLevel').style.display = 'none';
		$scope.sumTotalGPCount = 0;
		$scope.totalDistrictCount = 0;
		$scope.details = {};
		if(type == 'D' || type == 'SB' || type == 'SGP') {
			document.getElementById('stateLevel').style.display = '';
			onBackToState();
		} else if(type == 'B' || type == 'DGP') {
			$scope.zpName = null;
			$scope.zpCode = null;
			$scope.type = 'D';
			document.getElementById('districtCountLevel').style.display = '';
			getDistrictCount(stateCode);
		} else if(type == 'BGP') {
			$scope.code = null;
			$scope.name = null;
			document.getElementById('blockCountLevel').style.display = '';
			if(stateCode != 34) {
				$scope.type = 'B';
				getBlockCount(zpCode);
			} else {
				$scope.type = 'SB';
				getBlockCount(2);
			}
		}
	}
	
	function onBackToState () {
		$scope.loader = true;
		$scope.type = 'S';
		$scope.details = {};
		$scope.sumTotalGPCount = 0;
		$scope.totalCount = 0;
		$scope.stateCode = null;
		$scope.stateName = null;
		$scope.zpName = null;
		$scope.zpCode = null;
		$scope.code = null;
		$scope.name = null;
		$scope.updatedGpCount = null;
		$scope.percentage = null
		$scope.per = null
		getStateDetails();
	}
	
	$scope.getGPDetails = function getGPDetails(gpCode) {
		//window.open("viewGpProfile.do?localBodyCode="+gpCode+"&stateCode="+$scope.stateCode, '_blank');
		window.open("getZpProfileDetails.do?lbc="+gpCode, '_blank');
	}

	
	function removeLoader() {
	    $('#resultLoading').fadeOut(300, function () {
	        $(this).remove();
	    });
	    $('body').css('cursor', 'default');
	    
	}
	
	
	/*$scope.exportFile = function exportFile(id) {
		$("#" + id).excelexportjs({
			containerid : id,
			datatype : 'table',
			worksheetName : "No. of GPs & Equivalent with Profile added",
		});
	}

	$scope.onPrint = function onPrint(id) {
		$("#" + id).print({
			addGlobalStyles : false,
			stylesheet : null,
			rejectWindow : true,
			noPrintSelector : ".no-print",
			iframe : true,
			append : null,
			prepend : null,
			title : "No. of GPs & Equivalent with Profile added"
		});
	}*/

}]);