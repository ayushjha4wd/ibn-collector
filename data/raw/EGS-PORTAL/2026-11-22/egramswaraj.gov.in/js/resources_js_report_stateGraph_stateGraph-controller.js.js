var stateProgressreportModel = angular.module("stateProgressreportModel", []);
stateProgressreportModel.controller("stateProgressreportController", [ '$scope', "stateProgressreportService",
		function($scope, stateProgressreportService) {
	
	$scope.prgress = new progress();
	$scope.total = {};
	$scope.error = {};
	$scope.reportData = {};
	$scope.stateProgressData = {};
	$scope.loader = true;
	$scope.fromDate =moment().subtract(6, 'days').format('DD/MM/YYYY');
	$scope.todate = moment().format('DD/MM/YYYY');
	

	var barStateChart = echarts.init(document.getElementById('AllStateChart'));
	initProgress();
	
	function initProgress() {
		$scope.reportData = {};
		$scope.total = {};
		$scope.stateProgressData = {};
		$('#AllStateChart').hide();
		$scope.loader = true;
		stateProgressreportService.search($scope.fromDate,$scope.todate).then(function(response) {
			$scope.stateProgressData = new stateProgressData();
			$scope.total = new totalModel();
			var reportDetail = new Array();
			angular.forEach(response.data, function(obj, key) {
				var report = new reportDetails();
				if(obj.stateCode != 7 && obj.stateCode != 4){
					$scope.stateProgressData.states.push(obj.stateName);
					$scope.stateProgressData.profile.push(obj.totalProfile);
					$scope.stateProgressData.approved.push(obj.totalGpdpUpload);
					$scope.stateProgressData.activity.push(obj.totalActivity);
					$scope.stateProgressData.geotagged.push(obj.totalGeotagAsset);
					
					report.stateName = obj.stateName;
					report.totalProfile = obj.totalProfile;
					report.totalApproved = obj.totalGpdpUpload;
					report.totalActivity = obj.totalActivity;
					report.totalGeoTagAsset = obj.totalGeotagAsset;
					reportDetail.push(report);
					
					$scope.total.totalProfile = $scope.total.totalProfile+obj.totalProfile;
					$scope.total.totalApproved = $scope.total.totalApproved+obj.totalGpdpUpload;
					$scope.total.totalActivity = $scope.total.totalActivity+obj.totalActivity;
					$scope.total.totalGeoTagAsset = $scope.total.totalGeoTagAsset+obj.totalGeotagAsset;
				}
			});
			$scope.reportData = reportDetail;
			$scope.loader = false;
			$('#AllStateChart').show();
			barChart($scope.stateProgressData, barStateChart);
	    },function(error){
	    	console.log("ERROR :"+error)
	    });
	}
	
	
	$scope.onSearch = function(){
		var fdate = $("#startDate").val();
		var ftodate = $("#endDate").val();
		
		if(fdate!='' && ftodate!=''){
			$scope.fromDate =  fdate;
		    $scope.todate = ftodate;
		}
		initProgress();
	}
	
	$scope.exportFile = function exportFile(id) {
		$("#" + id).excelexportjs({
			containerid : id,
			datatype : 'table',
			worksheetName : "State Progress Report",
		});
	}

	$scope.onPrint = function onPrint(id) {
		$("#" + id).print({
			addGlobalStyles : true,
			stylesheet : null,
			rejectWindow : true,
			noPrintSelector : ".no-print",
			iframe : true,
			append : null,
			prepend : null,
			title : "State Progress Report"
		});
	}
	
}]);

