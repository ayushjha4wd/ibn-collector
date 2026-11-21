var yearBookReportModule = angular.module("yearBookReportModule", []);

yearBookReportModule.controller("yearBookReportController", ['$scope', "yearBookReportService", function ($scope, yearBookReportService) {
    $scope.finYear = null; 
    $scope.stateList = {};
    $scope.loader = false;
    $scope.sum_zp_tcount = 0;
    $scope.sum_bp_tcount = 0;
    $scope.sum_vp_tcount = 0;
    $scope.sum_zp_count = 0;
    $scope.sum_bp_count = 0;
    $scope.sum_vp_count = 0;
    
    
    
    
    var finYear=$('#finYear:selected').val() 
    
   
    
    if(typeof(finYear)=='undefied' || finYear==null || finYear=='') {
    	finYear='2025-2026';
    	getYearBookDataNew(finYear);
    }
    

    $scope.getYearBookData = function (year) {
    	
        if (!year) {
            return;
        }
        $scope.loader = true;
        yearBookReportService.findStateWise(year).then(function (response) {
            $scope.stateList = response.data;
            $scope.sum_zp_tcount = 0;
            $scope.sum_bp_tcount = 0;
            $scope.sum_vp_tcount = 0;
            $scope.sum_zp_count = 0;
            $scope.sum_bp_count = 0;
            $scope.sum_vp_count = 0;

            angular.forEach(response.data, function (obj) {
                $scope.sum_zp_tcount += obj.zptcount;
                $scope.sum_bp_tcount += obj.bptcount;
                $scope.sum_vp_tcount += obj.vptcount;

                $scope.sum_zp_count += obj.zpcount;
                $scope.sum_bp_count += obj.bpcount;
                $scope.sum_vp_count += obj.vpcount;
            });

            $scope.loader = false;
        });
    };


    function getYearBookDataNew(year){
    	

    	
        if (!year) {
            return;
        }
        $scope.loader = true;
        yearBookReportService.findStateWise(year).then(function (response) {
            $scope.stateList = response.data;
            $scope.sum_zp_tcount = 0;
            $scope.sum_bp_tcount = 0;
            $scope.sum_vp_tcount = 0;
            $scope.sum_zp_count = 0;
            $scope.sum_bp_count = 0;
            $scope.sum_vp_count = 0;

            angular.forEach(response.data, function (obj) {
                $scope.sum_zp_tcount += obj.zptcount;
                $scope.sum_bp_tcount += obj.bptcount;
                $scope.sum_vp_tcount += obj.vptcount;

                $scope.sum_zp_count += obj.zpcount;
                $scope.sum_bp_count += obj.bpcount;
                $scope.sum_vp_count += obj.vpcount;
            });

           
            $scope.finYearid=year;
            $scope.loader = false;
        });
    	
    	
    }
    
    $scope.exportFile = function (id) {
        $("#" + id).excelexportjs({
            containerid: id,
            datatype: 'table',
            worksheetName: "Year Book Closed",
        });
    };

    $scope.onPrint = function (id) {
        $("#" + id).print({
            addGlobalStyles: true,
            stylesheet: null,
            rejectWindow: true,
            noPrintSelector: ".no-print",
            iframe: true,
            append: null,
            prepend: null,
            title: "Year Book Closed"
        });
    };
}]);
