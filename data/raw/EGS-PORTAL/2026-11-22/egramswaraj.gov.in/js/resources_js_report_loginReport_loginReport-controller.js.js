var loginReportModel = angular.module("loginReportModel", []);
loginReportModel.controller("loginReportController", [ '$scope', "loginReportService",
		function($scope, loginReportService) {
	
	$scope.prgress = new progress();
	$scope.total = {};
	$scope.error = {};
	$scope.reportData = {};
	$scope.stateProgressData = {};
	$scope.loader = true;
	$scope.fromDate = moment().format('DD/MM/YYYY');
	$scope.todate = moment().format('DD/MM/YYYY');

	initProgress();
	
	function initProgress() {
		$scope.reportData = {};
		$scope.total = {};
		$('#AllStateChart').hide();
		$scope.loader = true;
		loginReportService.search($scope.fromDate,$scope.todate).then(function(response) {
			$scope.total = new totalModel();
			var reportDetail = new Array();
			angular.forEach(response.data, function(obj, key) {
				var report = new reportDetails();
				if(obj.stateCode != 7 && obj.stateCode != 4){
					report.stateName = obj.stateName;
					report.totalLogs = obj.totalLogs;
					reportDetail.push(report);
					
					$scope.total.totalLogs = $scope.total.totalLogs+obj.totalLogs;
				}
			});
			$scope.reportData = reportDetail;
			$scope.loader = false;
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
			worksheetName : "Login Report",
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
			title : "Login Report"
		});
	}
	
}]);

