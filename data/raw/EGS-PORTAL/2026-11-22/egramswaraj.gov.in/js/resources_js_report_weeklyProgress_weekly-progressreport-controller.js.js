var weeklyProgressModel = angular.module("weeklyProgressModel", []);
weeklyProgressModel.controller("weeklyProgressController", [ '$scope', "weeklyProgressService",
		function($scope, weeklyProgressService) {
	
	$scope.prgress = new progress();
	$scope.total = new totalModel();
	$scope.loader = true;
	$scope.error = {};
	$scope.reportData = {};
	$scope.progressData = {};
	$scope.stateCode = 0;
	$scope.fromDate = moment().startOf('month').format('DD/MM/YYYY');
	$scope.todate = moment().format('DD/MM/YYYY');
	$scope.stateName = "All";
	var AllStateChart = echarts.init(document.getElementById('AllStateChart'));
	initProgress();
	
	function initProgress() {
		$scope.reportData = {};
		$scope.total = {};
		$scope.progressData = {};
		$scope.loader = true;
		$('#AllStateChart').hide();
		weeklyProgressService.search($scope.fromDate, $scope.todate, $scope.stateCode).then(function(response) {
			$scope.progressData = new progressData();
			$scope.total = new totalModel();
			var reportDetail = new Array();
			angular.forEach(response.data, function(obj, key) {
				var report = new reportDetails();
				if(obj.stateCode != 7 ){
					$scope.progressData.days.push(obj.dateOn);
					$scope.progressData.gpProfile.push(obj.totalProfile);
					$scope.progressData.gpdpApproved.push(obj.totalGpdpUpload);
					$scope.progressData.activityComplete.push(obj.totalActivity);
					//$scope.progressData.geoTaggedAssets.push(obj.totalGeotagAsset);
					/*$scope.progressData.voucher.push(obj.totalVoucher);
					$scope.progressData.fto.push(obj.totalFto);*/
					
					report.days = obj.dateOn;
					report.totalProfile = obj.totalProfile;
					report.totalApproved = obj.totalGpdpUpload;
					report.totalActivity = obj.totalActivity;
					/*report.totalVoucher = obj.totalVoucher;
					report.totalFto = obj.totalFto;*/
					//report.totalGeoTagAsset = obj.totalGeotagAsset;
					reportDetail.push(report);
					
					$scope.total.totalProfile = $scope.total.totalProfile + obj.totalProfile;
					$scope.total.totalApproved = $scope.total.totalApproved + obj.totalGpdpUpload;
					$scope.total.totalActivity = $scope.total.totalActivity + obj.totalActivity;
					/*$scope.total.totalVoucher = $scope.total.totalVoucher + obj.totalVoucher;
					$scope.total.totalFto = $scope.total.totalFto + obj.totalFto;*/
					//$scope.total.totalGeoTagAsset = $scope.total.totalGeoTagAsset + obj.totalGeotagAsset;	
				}
			});
			$scope.reportData = reportDetail;
			$scope.loader = false;
			$('#AllStateChart').show();
			lineChart1($scope.progressData, AllStateChart);
	    },function(error){
	    	console.log("ERROR :"+error)
	    });
	}
	
	$scope.onSearch = function() {
		var fdate = $("#startDate").val();
		var ftodate = $("#endDate").val();
		if(fdate!='' && ftodate!=''){
			$scope.fromDate =  fdate;
		    $scope.todate = ftodate;
		}
		$scope.stateName = $("#state option:selected").text();
		initProgress();
	}
	
	$scope.onState = function() {
		var fdate = $("#startDate").val();
		var ftodate = $("#endDate").val();
		if(fdate!='' && ftodate!=''){
			$scope.fromDate =  fdate;
		    $scope.todate = ftodate;
		}
		$scope.stateName = $("#state option:selected").text();
		initProgress();
	}

	$scope.exportFile = function exportFile(id) {
		$("#" + id).excelexportjs({
			containerid : id,
			datatype : 'table',
			worksheetName : "Weekly Progress Report",
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
			title : "Weekly Progress Report"
		});
	}
	
}]);

