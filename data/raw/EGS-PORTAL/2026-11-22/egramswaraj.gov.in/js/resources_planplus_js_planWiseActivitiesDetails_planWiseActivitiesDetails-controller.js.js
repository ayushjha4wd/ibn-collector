var planWiseActivitiesDetailsModule = angular.module('planWiseActivitiesDetailsModule',['datatables']);
planWiseActivitiesDetailsModule.controller("planWiseActivitiesDetailsController", 
		['$scope','$q', "planWiseActivitiesDetailsService",'DTOptionsBuilder', 'DTColumnDefBuilder',
 function($scope, $q, planWiseActivitiesDetailsService, DTOptionsBuilder, DTColumnDefBuilder) {
 
 
 
 
	$scope.dtOptions = DTOptionsBuilder.newOptions()
    .withOption('order', [0, 'asc'])
    .withOption('responsive', true)
    .withOption('lengthMenu', [[-1, 10, 25, 50, 100], ['All', 10, 25, 50, 100]])
    .withOption('pageLength', 10);
	


	getDashboard();
	
	function getDashboard() {
		$("#selectionDiv").show();
		$("#reportDiv").hide();
		$scope.type="M";
		
	}
	
	$scope.getStateList = function getStateList() {
		$scope.stateList = {};
		$scope.stateCd = null;
		$scope.kpiZp = 0;
		$scope.kpiBp = 0;
		$scope.kpiVp = 0;
		$("#KpiDiv").hide();
		$scope.planYear = $("#planYear").val();
		planWiseActivitiesDetailsService.getStateList().then(function(response) {
			$scope.stateList = response.data;
		});
	}	
	
	
	$scope.getKpiData = function getKpiData(stateCode) {
		if(stateCode!=null){
			$scope.stateCd = stateCode;
			$scope.stateName = $("#stateCode option:selected").text();
			$scope.yr = $scope.planYear.split("-")[0];
			$("#KpiDiv").show();
			planWiseActivitiesDetailsService.getKpiPlanCount($scope.stateCd,$scope.yr).then(function(response) {
				$scope.kpi = response.data;
				$scope.kpiZp = response.data[0].count;
				$scope.kpiBp = response.data[1].count;
				$scope.kpiVp = response.data[2].count;
			});
		}
	}
	
	$scope.getZpData = function getZpData(level){
		$scope.level = level;

		$("#selectionDiv").hide();
		$("#reportDiv").show();
		$("#zpDiv").hide();
		$("#bpDiv").hide();
		$("#vpDiv").hide();
		$("#planDiv").hide();
		$("#activityDiv").hide();
		
		if($scope.level==1){
			$("#zpDiv").show();
			$scope.type="Z";
			
		}else if($scope.level==2 || $scope.level==3){
			if($scope.stateCd==13 || $scope.stateCd ==15){
				$("#vpDiv").show();
				$scope.type="B";
			}else{
				$("#bpDiv").show();
				$scope.type="B";
			}
		}
		$scope.data = {};
		$scope.totalCount = 0;
		$scope.loader = true;
		planWiseActivitiesDetailsService.getPanchayatZpData($scope.stateCd,$scope.yr,$scope.level).then(function(response) {
			 $scope.data = response.data;
			 $scope.totalCount = $scope.data.reduce((sum, d) => sum + d.no_plan_cout, 0);
			 $scope.loader = false;
		});
		
	}
	
	$scope.getVpDetails = function getVpDetails(zpCd,zpName,bpCd,bpName,typCd){
		if(zpCd!=null){
			$scope.zpCd = zpCd;
		}else{
			$scope.zpCd = 0;
		}
		$scope.zpName = zpName;
		if(bpCd!=null){
			$scope.bpCd = bpCd;
		}else{
			$scope.bpCd = 0;
		}
		$scope.bpName = bpName;
		$scope.typCd = typCd;
		$scope.gpCd = 0;
		$scope.gpName = null;
		$("#selectionDiv").hide();
		$("#reportDiv").show();
		$("#zpDiv").hide();
		$("#bpDiv").hide();
		$("#vpDiv").show();
		$("#planDiv").hide();
		$("#activityDiv").hide();
		
		$scope.type="V";
		$scope.data = {};
		//$scope.totalCount = 0;
		$scope.loader = true;
		planWiseActivitiesDetailsService.getPlanVpData($scope.yr, $scope.stateCd, $scope.zpCd, $scope.bpCd, typCd, $scope.level).then(function(response) {
			$scope.data = response.data;
			/*angular.forEach($scope.data, function(obj, key) {
				$scope.totalCount = $scope.totalCount + obj.no_plan_cout;
			});	*/
			$scope.activityStts = "0";
			$scope.loader = false;
		});
	}
	
	
	
	
	$scope.getPlanDetails = function getPlanDetails(zpCd,zpName,bpCd,bpName,typCd){
		if($scope.level==1){
			$scope.zpCd = zpCd;
			$scope.zpName = zpName;
			$scope.bpCd = 0;
			$scope.bpName = null;
			$scope.gpCd = 0;
			$scope.gpName = null;
			
		}else if($scope.level==2){
			$scope.zpCd = zpCd;
			$scope.zpName = zpName;
			$scope.bpCd = bpCd;
			$scope.bpName = bpName;
			$scope.gpCd = 0;
			$scope.gpName = null;
		}
		$scope.typCd = typCd;
		$("#selectionDiv").hide();
		$("#reportDiv").show();
		$("#zpDiv").hide();
		$("#bpDiv").hide();
		$("#vpDiv").hide();
		$("#planDiv").show();
		$("#activityDiv").hide();
		
		$scope.type="P";
		$scope.data = {};
		//$scope.totalCount = 0;
		$scope.loader = true;
		planWiseActivitiesDetailsService.getPlanDetails($scope.stateCd,$scope.yr,$scope.level,$scope.zpCd,$scope.bpCd,$scope.typCd).then(function(response) {
			$scope.data = response.data;
			/*angular.forEach($scope.data, function(obj, key) {
				$scope.totalCount = $scope.totalCount + obj.no_plan_cout;
			});	*/
			$scope.activityStts = "0";
			$scope.loader = false;
		});
	}
	
	
	
	$scope.getActivityStatus = function getActivityStatus(activityStts){
		$scope.activityStts = activityStts;
		$scope.getActivityList($scope.planCode,$scope.gpCd,$scope.gpName);
	}
	 
    
    $scope.getActivityStatusBoth = function() {
        $scope.activityStts = 0;
        $("#selectionDiv").hide();
        $("#reportDiv").show();
        $("#zpDiv").hide();
        $("#bpDiv").hide();
        $("#vpDiv").hide();
        $("#planDiv").hide();
        $("#activityDiv").show();
        $scope.type = "A";
        $scope.data = [];
        $scope.loader = true;
        var ongoingPromise =  planWiseActivitiesDetailsService.getActivityList( $scope.planCode, 176  );
        var completedPromise = planWiseActivitiesDetailsService.getActivityList( $scope.planCode, 178 );
        $q.all([ ongoingPromise, completedPromise ]).then(function(responses) {
            var ongoingData = responses[0].data || [];
            var completedData = responses[1].data || [];
            $scope.data = ongoingData.concat(completedData);
            $scope.loader = false;
        }, function(error) {
            console.log("Error while fetching activity data:", error);
            $scope.data = [];
            $scope.loader = false;
        });
    };
  
 $scope.getActivityList = function getActivityList(planCode,gpCd,gpName) {
		if($scope.level==3){
			$scope.gpCd = gpCd;
			$scope.gpName = gpName;
		}
		if(($scope.stateCd == 13 || $scope.stateCd == 15 ) && !$scope.activityStts > 0)  {
			$scope.activityStts = "0";
		}
		$("#selectionDiv").hide();
		$("#reportDiv").show();
		$("#zpDiv").hide();
		$("#bpDiv").hide();
		$("#vpDiv").hide();
		$("#planDiv").hide();
		$("#activityDiv").show();
		$scope.planCode = planCode;
		$scope.type="A";
		$scope.data = {};
		$scope.loader = true;
		
		planWiseActivitiesDetailsService.getActivityList($scope.planCode, $scope.activityStts).then(function(response) {
			$scope.data = response.data;
			$scope.loader = false;
		});
	}
	 
	$scope.getActivitySectionData =  function getActivitySectionData(activity) {
//		$scope.activityCd = activity.split("(")[1].replace(")", "");
		$scope.activityCd = activity.match(/\d+/g);
		$scope.activitySectionData = {};
		$scope.technicalSectionData = {};
		$scope.adminSectionData = {};
		$scope.phyProgressSectionData = {};
		$scope.expenditureSectionData = {};
		// activity section
		planWiseActivitiesDetailsService.getActivitySectionData($scope.activityCd).then(function(response) {
			$scope.loaderAccordian = true;
			$scope.activitySectionData = response.data;
			
			if($scope.activitySectionData != {}){
				//technical section
				planWiseActivitiesDetailsService.getTechnicalApprovalSectionData($scope.activityCd).then(function(response) {
					$scope.technicalSectionData = response.data;
				});
				//admin section
				planWiseActivitiesDetailsService.getAdminApprovalSectionData($scope.activityCd).then(function(response) {
					var adminDetail = new Array();
					var tempWrkAdmApprNo = "";
					var tempWrkAdmApprIssAuthrty = "";
					var tempWrkAdmApprSnctnOrdrDt = "";
					var tempWrkAdmFndSnctnd = "";
					$scope.admColspan = response.data.length;
					angular.forEach(response.data, function(obj, key) {
						 var a = new adminDetails();
						 if(tempWrkAdmApprNo != obj.wrkAdmApprNo) {
							 a.wrkAdmApprNo = obj.wrkAdmApprNo;
						 } else {
							 a.wrkAdmApprNo = "";
						 }
						 if(tempWrkAdmApprIssAuthrty != obj.wrkAdmApprIssAuthrty) {
							 a.wrkAdmApprIssAuthrty = obj.wrkAdmApprIssAuthrty;
						 } else {
							 a.wrkAdmApprIssAuthrty = "";
						 }
						 if(tempWrkAdmApprSnctnOrdrDt != obj.wrkAdmApprSnctnOrdrDt) {
							 a.wrkAdmApprSnctnOrdrDt = obj.wrkAdmApprSnctnOrdrDt;
						 } else {
							 a.wrkAdmApprSnctnOrdrDt = "";
						 }
						 if(tempWrkAdmFndSnctnd != obj.wrkAdmFndSnctnd) {
							 a.wrkAdmFndSnctnd = obj.wrkAdmFndSnctnd;
						 } else {
							 a.wrkAdmFndSnctnd = "";
						 }
						 a.schemeCd = obj.schemeCd;
						 a.schemeComponentCd = obj.schemeComponentCd;
						 a.wrkAdmApprFndSnctnGen = obj.wrkAdmApprFndSnctnGen;
						 a.wrkAdmApprFndSnctnSt = obj.wrkAdmApprFndSnctnSt;
						 a.wrkAdmApprFndSnctnSc = obj.wrkAdmApprFndSnctnSc;
						 a.fndAllctnSchmTot = obj.fndAllctnSchmTot;
		
						 adminDetail.push(a);
						 
						 tempWrkAdmApprNo = obj.wrkAdmApprNo;
						 tempWrkAdmApprIssAuthrty = obj.wrkAdmApprIssAuthrty;
						 tempWrkAdmApprSnctnOrdrDt = obj.wrkAdmApprSnctnOrdrDt;
						 tempWrkAdmFndSnctnd = obj.wrkAdmFndSnctnd;
					});	
					 $scope.adminSectionData = adminDetail;
				});
				//physical progress section
				planWiseActivitiesDetailsService.getPhysicalProgressSectionData($scope.activityCd).then(function(response) {
					$scope.phyProgressSectionData = response.data;
					if($scope.phyProgressSectionData!={}){
						
						var code = 0;
						if($scope.level==1){
							code = $scope.zpCd;
						}else if($scope.level==2){
							code = $scope.bpCd;
						}else if($scope.level==3){
							code = $scope.gpCd;
						}
						//expenditure section
						planWiseActivitiesDetailsService.getExpenditureDetails($scope.activityCd,$scope.yr,$scope.stateCd,code,$scope.activitySectionData.outputTypCd).then(function(response) {
							$scope.expenditureSectionData = response.data;
						});
					}
				});
			
			}
			$scope.loaderAccordian = false;
		});
		
		
	}
	
	
	$scope.showAssetDetailsPopup = function showAssetDetailsPopup(phyProgrssAstCd) {
		$scope.popup = {};
		planWiseActivitiesDetailsService.getAssetDetailsPopup(phyProgrssAstCd).then(function(response) {
			$scope.popup = response.data;
		});
		$("#showAssetDetailsPopup").modal();
	}
	
		
	$scope.onBack = function onBack(type){
		
		if(type=='A'){
			if($scope.level == 3){
				if($scope.stateCd==13 || $scope.stateCd==15){
					$scope.gpName = null;
					$scope.gpCd = 0;
					$scope.getZpData($scope.level);
				}else{
					$scope.filterOngoing = false;
					$scope.filterCompleted = false;
					$scope.getVpDetails($scope.zpCd,$scope.zpName,$scope.bpCd,$scope.bpName,$scope.typCd);
				}
			}else{
				$scope.filterOngoing = false;
				$scope.filterCompleted = false;
				$scope.getPlanDetails($scope.zpCd,$scope.zpName,$scope.bpCd,$scope.bpName,$scope.typCd);
			}
			
		}else if(type=='P' || type=='V'){
			$scope.getZpData($scope.level);
			
		}else if(type=='Z' || type=='B'){
			getDashboard();
		}
	}
	

      $scope.exportFile = function exportFile(id) {
	    var table = $('#' + id).DataTable();
	    table.page.len(-1).draw();
	    setTimeout(function () {
	        $("#" + id).excelexportjs({
	            containerid: id,
	            datatype: 'table',
	            worksheetName: "Approved Plan Wise Activity Details",
	            returnUri: false
	        });
	        table.page.len(10).draw();  
	    }, 1000);  
	};
	
	$scope.exportFileDiv = function(id){

	    $("#" + id).excelexportjs({
	        containerid: id,
	        datatype: 'table',
	        worksheetName: "Approved Plan Wise Activity Details",
	        returnUri: false
	    });

	};
    
  /*
   $scope.selectedActivityStatus = 0; // Default to 0 (nothing selected)

$scope.selectActivityStatus = function(status) {
    if ($scope.selectedActivityStatus === status) {
        $scope.selectedActivityStatus = 0; // Deselect if same checkbox clicked
    } else {
        $scope.selectedActivityStatus = status; // Set to selected value
    }
};

$scope.clearActivitySelection = function() {
    $scope.selectedActivityStatus = 0; // Reset to 'All'
    $scope.getActivityStatus(0);
};

$scope.applyActivityFilter = function(status) {
    $scope.selectedActivityStatus = status; // Reset to 'All'
    $scope.getActivityStatus(status);
};

	 */
	
	 
 $scope.filterOngoing = false;
$scope.filterCompleted = false;


$scope.selectActivityStatus = function(status) {
    if (status === 176) {
        $scope.filterOngoing = !$scope.filterOngoing;
    } else if (status === 178) {
        $scope.filterCompleted = !$scope.filterCompleted;
    }
    console.log("Ongoing:", $scope.filterOngoing);
    console.log("Completed:", $scope.filterCompleted);
    if (!$scope.filterOngoing && !$scope.filterCompleted) {
        $scope.getActivityStatus(0);
    } else if ($scope.filterOngoing && !$scope.filterCompleted) {
        $scope.getActivityStatus(176);
    }  else if (!$scope.filterOngoing && $scope.filterCompleted) {
        $scope.getActivityStatus(178);
    } else if ($scope.filterOngoing && $scope.filterCompleted) {
        $scope.getActivityStatusBoth();
    }
};

}]);





