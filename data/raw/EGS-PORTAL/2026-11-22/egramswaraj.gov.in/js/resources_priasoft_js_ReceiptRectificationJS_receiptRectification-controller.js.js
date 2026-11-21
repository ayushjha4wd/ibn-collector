var receiptRectificationModule = angular.module('receiptRectificationModule', ['angular.filter']);
receiptRectificationModule.controller("receiptRectificationController", ['$scope', "receiptRectificationService", function($scope, receiptRectificationService) {

	$scope.finYear = null;
	$scope.stateCode = null;
	$scope.stateCode = $("#stateCode").val();
	$scope.finYear = $("#finYear").val();
	
	
	
	$scope.viewReport = function viewReport(target) {
		var error = false;
		$('.errored').hide();
		
		if($("#finYear").val() == null || $("#finYear").val() == 0) {
			$("#finYear_error").show();
			error = true;
		}
		
		if($("#stateCode").val() == null || $("#stateCode").val() == 0 || $("#stateCode").val == "") {
			$("#stateCode_error").show();
			error = true;
		}
		
		
		if(target == 'submit' && !error) {
			$('.errored').hide();
			/*$("#ShowDiv1").hide();
			$("#ShowDiv2").show();
			$("#ShowDiv").show();*/
			getdataList();
			
		}
				
}
	
	
	function getdataList() {
		   $scope.loader = true;
		   $scope.dataList={};
		   $scope.headings = true;
		   $("#ShowDiv1").hide();
			$("#ShowDiv2").show();
			$("#ShowDiv").show();
		   
		   $scope.finYear = $("#finYear").val();
			$scope.stateCode = $("#stateCode").val();
			
			
			receiptRectificationService.getdataList($scope.finYear,$scope.stateCode).then(function(response) {
				if(response.data.length > 0) { 
					$scope.type = 'GEN';
					
					 $scope.dataList = response.data;
					 $scope.loader = false;
				} else {
					$scope.loader = false;
				
					$("#ShowDiv").hide();
					$("#ShowDiv2").hide();
					$("#ShowDiv1").show();
					
					$scope.type = 'MAIN';
					$scope.finYear = null;
				    alert("No Data Found");
				    $("#stateCode").val("");
				    
					
				}
			   });
			
	    
		    
	   }
		   
			   
		
	
	
	
}]);
