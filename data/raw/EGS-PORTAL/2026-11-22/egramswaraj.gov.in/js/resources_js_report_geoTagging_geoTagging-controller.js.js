var geoTaggingModule = angular.module("geoTaggingModule", ['datatables']);
geoTaggingModule.controller("geoTaggingController", [ '$scope', "geoTaggingService",'DTOptionsBuilder', function($scope, geoTaggingService, DTOptionsBuilder) {
	
	$scope.dtOptions = DTOptionsBuilder.newOptions()
    .withOption('order', [0, 'asc'])
    .withOption('responsive', true)
    .withOption('lengthMenu', [[-1, 10, 25, 50, 100], ['All', 10, 25, 50, 100]])
    .withOption('pageLength', 10);
	
	$scope.stateCode = null;
	$scope.stateName = null;
	$scope.districtId = null;
	$scope.districtName = null;
	$scope.zpName = null;
	$scope.zpCode = null;
	$scope.code = null;
	$scope.name = null;
	$scope.type = 'S';
	$scope.loader = true;
	$scope.details = {};
	$scope.year = $("#year").val();
	$scope.planYear = $scope.year; 
	getStateCount();
	
	$scope.getPlanYear = function getPlanYear(planYear){
		$scope.year = planYear;
		$scope.planYear = planYear; 
		getStateCount();
	}
	
	function getStateCount(){
		$scope.loader = true;
		document.getElementById('stateLevel').style.display = '';
		document.getElementById('districtCountLevel').style.display = 'none';
		document.getElementById('blockCountLevel').style.display = 'none';
		document.getElementById('villageLevel').style.display = 'none';
		geoTaggingService.findStateWise($scope.year).then(function(response) {
			$scope.type = 'S';
			$scope.data = response.data;
			$scope.details = {};
			$scope.sumTotalGPCount = 0;
			$scope.totalCount = 0;
			$scope.totalGpCount = 0;
			var geoTaggingDetails = new Array();
			angular.forEach($scope.data, function(obj, key) {
				var geoTagging = new state();
				if(obj.code != 7 && obj.code != 4) {
					geoTagging.stateCode = obj.code;
					geoTagging.stateName = obj.name;
					geoTagging.totalGpCount = obj.totalGpCount;
					geoTagging.gpCount = obj.gpCount;
					geoTagging.count = obj.count;
					geoTaggingDetails.push(geoTagging);
					
					$scope.sumTotalGPCount = $scope.sumTotalGPCount + obj.totalGpCount;
					$scope.totalGpCount = $scope.totalGpCount + obj.gpCount;
					$scope.totalCount = $scope.totalCount + obj.count;
				}	
			});	
			$scope.details = geoTaggingDetails;
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
		$scope.totalGpCount = 0;
		$scope.details = {};
		geoTaggingService.findDistrictCountForGP(stateId, $scope.year).then(function(response) {
			$scope.data = response.data;
			var geoTaggingDetails = new Array();
			angular.forEach($scope.data, function(obj, key) {
				var geoTagging = new gpCount();
				if(obj.level != null) {
					geoTagging.entityCode = obj.code;
					geoTagging.entityName = obj.name;
					geoTagging.totalGPCount = obj.totalGpCount;
					geoTagging.gpCount = obj.gpCount;
					geoTagging.count = obj.count;
					geoTagging.level = obj.level;
					geoTaggingDetails.push(geoTagging);
				
					$scope.sumTotalGPCount = $scope.sumTotalGPCount + obj.totalGpCount;
					$scope.totalGpCount = $scope.totalGpCount + obj.gpCount;
					$scope.totalDistrictCount = $scope.totalDistrictCount + obj.count;
				}
			});	
			$scope.details = geoTaggingDetails;
			$scope.loader = false;
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
		$scope.totalGpCount = 0;
		$scope.details = {};
		geoTaggingService.findBlockCountForGP($scope.stateCode, zpId, $scope.year).then(function(response) {
			$scope.data = response.data;
			var geoTaggingDetails = new Array();
			angular.forEach($scope.data, function(obj, key) {
				var geoTagging = new gpCount();
				geoTagging.entityCode = obj.code;
				geoTagging.entityName = obj.name;
				geoTagging.totalGPCount = obj.totalGpCount;
				geoTagging.gpCount = obj.gpCount;
				geoTagging.count = obj.count;
				geoTagging.level = obj.level;
				
				geoTaggingDetails.push(geoTagging);
				
				$scope.sumTotalGPCount = $scope.sumTotalGPCount + obj.totalGpCount;
				$scope.totalGpCount = $scope.totalGpCount + obj.gpCount;
				$scope.totalBlockCount = $scope.totalBlockCount + obj.count;
				
			});	
			$scope.details = geoTaggingDetails;
			$scope.loader = false;
	    });
	}
	
	$scope.onVillage = function onVillage(code, name, type){
		document.getElementById('stateLevel').style.display = 'none';
		document.getElementById('districtCountLevel').style.display = 'none';
		document.getElementById('blockCountLevel').style.display = 'none';
		document.getElementById('villageLevel').style.display = '';
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
		geoTaggingService.findVillageWise($scope.stateCode, code, $scope.year).then(function(response) {
			$scope.data = response.data;
			var geoTaggingDetails = new Array();
			angular.forEach($scope.data, function(obj, key) {
				var geoTagging = new gpCount();
				geoTagging.entityCode = obj.code;
				geoTagging.entityName = obj.name;
				geoTagging.count = obj.count;
				geoTagging.gpCount = obj.gpCount;
				geoTagging.totalGpCount = obj.totalGpCount;
				geoTaggingDetails.push(geoTagging);
			});	
			$scope.details = geoTaggingDetails;
			$scope.loader = false;
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
	 	getStateCount();
	}

	$scope.getGPDetails = function getGPDetails(gpCode,planunttypcd) {
		window.open("geotaggedDetailsforgpdp.do?year="+$scope.year.split("-")[0]+"&gpcode="+gpCode, '_blank'); 
	}
	
 
		
	$scope.exportFile = function(headerId, bodyId){
	    const workbook = new ExcelJS.Workbook();
	    const worksheet = workbook.addWorksheet("No. of GPs & Equivalent with geo-tagged activities");
	
	    let currentRow = 1;
	
	    function cleanCellText(html){
	        if(!html) return "";
	        let text = html.replace(/<br\s*\/?>/gi," ").replace(/<.*?>/g,"").trim();
	        const txt = document.createElement("textarea");
	        txt.innerHTML = text;
	        return txt.value;
	    }
	
	    function addTableToSheet(tableId, startRow){
	        const table = document.getElementById(tableId);
	        let rowIdx = startRow;
	
	        const mergeMap = {}; // track merged columns
	
	        // --- HEADERS ---
	        table.querySelectorAll("thead tr").forEach(tr => {
	            const excelRow = worksheet.getRow(rowIdx);
	            let colIndex = 1;
	
	            Array.from(tr.children).forEach(th => {
	                // skip already merged columns
	                while(mergeMap[rowIdx + "-" + colIndex]) colIndex++;
	
	                const colspan = parseInt(th.getAttribute('colspan') || 1);
	                const rowspan = parseInt(th.getAttribute('rowspan') || 1);
	
	                const cellText = cleanCellText(th.innerHTML);
	                const cell = excelRow.getCell(colIndex);
	                cell.value = cellText;
	                cell.font = { bold:true };
	                cell.fill = { type:'pattern', pattern:'solid', fgColor:{argb:'C0C0C0'} };
	                cell.alignment = { vertical:'middle', horizontal:'center', wrapText:true };
	                cell.border = { top:{style:'thin'}, left:{style:'thin'}, bottom:{style:'thin'}, right:{style:'thin'} };
	
	                if(colspan>1 || rowspan>1){
	                    worksheet.mergeCells(rowIdx, colIndex, rowIdx+rowspan-1, colIndex+colspan-1);
	                    // mark merged cells
	                    for(let r=0;r<rowspan;r++){
	                        for(let c=0;c<colspan;c++){
	                            mergeMap[(rowIdx+r)+"-"+(colIndex+c)] = true;
	                        }
	                    }
	                } else {
	                    mergeMap[rowIdx+"-"+colIndex] = true;
	                }
	
	                colIndex += colspan;
	            });
	            rowIdx++;
	        });
	
	        // --- BODY ---
	        const dtInstance = $.fn.DataTable.isDataTable('#'+tableId) ? $('#' + tableId).DataTable() : null;
	        if(dtInstance){
	            dtInstance.rows({ search:'applied' }).every(function(){
	                const rowData = this.data();
	                const excelRow = worksheet.getRow(rowIdx);
	                let values = [];
	
	                if(Array.isArray(rowData)){
	                    values = rowData.map(v => cleanCellText(v));
	                } else {
	                    $(table.querySelectorAll("thead tr:last-child th")).each((i, th)=>{
	                        values.push(rowData[i] || "");
	                    });
	                }
	
	                excelRow.values = values;
	                excelRow.eachCell({ includeEmpty:true }, cell => {
	                    cell.alignment = { vertical:'middle', horizontal:'left', wrapText:true };
	                    cell.border = { top:{style:'thin'}, left:{style:'thin'}, bottom:{style:'thin'}, right:{style:'thin'} };
	                });
	                rowIdx++;
	            });
	        } else {
	            table.querySelectorAll("tbody tr").forEach(tr => {
	                const rowData = [];
	                tr.querySelectorAll("td").forEach(td => rowData.push(cleanCellText(td.innerHTML)));
	                if(rowData.length>0){
	                    const excelRow = worksheet.getRow(rowIdx);
	                    excelRow.values = rowData;
	                    excelRow.eachCell({ includeEmpty:true }, cell => {
	                        cell.alignment = { vertical:'middle', horizontal:'left', wrapText:true };
	                        cell.border = { top:{style:'thin'}, left:{style:'thin'}, bottom:{style:'thin'}, right:{style:'thin'} };
	                    });
	                    rowIdx++;
	                }
	            });
	        }
	
	        // --- FOOTER ---
	        table.querySelectorAll("tfoot tr").forEach(tr=>{
	            const rowData=[];
	            tr.querySelectorAll("th, td").forEach(td => rowData.push(cleanCellText(td.innerHTML)));
	            if(rowData.length>0){
	                const excelRow = worksheet.getRow(rowIdx);
	                excelRow.values = rowData;
	                excelRow.eachCell({ includeEmpty:true }, cell => {
	                    cell.font = { bold:true };
	                    cell.alignment = { vertical:'middle', horizontal:'left', wrapText:true };
	                    cell.border = { top:{style:'thin'}, left:{style:'thin'}, bottom:{style:'thin'}, right:{style:'thin'} };
	                });
	                rowIdx++;
	            }
	        });
	
	        return rowIdx + 1;
	    }
	
	    currentRow = addTableToSheet(headerId, currentRow);
	    currentRow = addTableToSheet(bodyId, currentRow);
	
	    // Auto-width
	    worksheet.columns.forEach(col=>{
	        let maxLength = 10;
	        col.eachCell({ includeEmpty:true }, cell=>{
	            const text = cell.value ? cell.value.toString() : '';
	            maxLength = Math.max(maxLength, text.length);
	        });
	        col.width = maxLength + 5;
	    });
	
	    workbook.xlsx.writeBuffer().then(buffer=>{
	        const blob = new Blob([buffer], { type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
	        saveAs(blob,"No. of GPs & Equivalent with geo-tagged activities.xlsx");
	    });
	};
 

	$scope.onPrint = function onPrint(id) {
		$("#" + id).print({
			addGlobalStyles : true,
			stylesheet : null,
			rejectWindow : true,
			noPrintSelector : ".no-print",
			iframe : true,
			append : null,
			prepend : null,
			title : "No. of GPs & Equivalent with geo-tagged activities"
		});
	}

}]);