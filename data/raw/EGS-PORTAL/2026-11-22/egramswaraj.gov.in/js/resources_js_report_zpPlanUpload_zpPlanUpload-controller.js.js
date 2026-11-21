var zpPlanUploadModule = angular.module("zpPlanUploadModule", ['datatables']);
zpPlanUploadModule.controller("zpPlanUploadController",['$scope',"zpPlanUploadService",'DTOptionsBuilder',
function($scope,zpPlanUploadService,DTOptionsBuilder){
	
	$scope.dtOptions = DTOptionsBuilder.newOptions()
    .withOption('order', [0, 'asc'])
    .withOption('responsive', true)
    .withOption('lengthMenu', [[-1, 10, 25, 50, 100], ['All', 10, 25, 50, 100]])
    .withOption('pageLength', 10);
	
	
	$scope.year = $("#year").val();
	$scope.loader = true;
	$scope.details={};
	$scope.data={};
	$scope.type = 'S';
	$scope.planYear = $scope.year; 
	getStateCount();
	
	$scope.getPlanYear = function getPlanYear(planYear){
		$scope.year = planYear;
		$scope.planYear = planYear; 
		getStateCount();
	}
	
	function getStateCount(){
		$scope.loader=true;
		document.getElementById('districtLevel').style.display = 'none';
		document.getElementById('stateLevel').style.display = '';
		zpPlanUploadService.findStateWise($scope.year).then(function(response){
			
			$scope.data=response.data;
			$scope.details={};
			$scope.sumTotalZPCount=0;
			$scope.totalCount=0;
			var zpPlanUploadDetails= new Array();
			angular.forEach($scope.data ,function(obj,key){
				var zpPlanUpload =new state();
				if(obj.code!=7 && obj.code!=4){
					zpPlanUpload.stateCode=obj.code;
					zpPlanUpload.stateName=obj.name;
					zpPlanUpload.totalZPCount=obj.zpCount;
					zpPlanUpload.count=obj.count;
					zpPlanUploadDetails.push(zpPlanUpload);
					
					$scope.sumTotalZPCount=$scope.sumTotalZPCount+obj.zpCount;
					$scope.totalCount=$scope.totalCount+obj.count;
				}
			});
			$scope.details=zpPlanUploadDetails;
			$scope.loader=false;
		});
	}
	
	$scope.onDistrictCount= function onDistrictCount(stateId,stateName){
		document.getElementById('stateLevel').style.display = 'none';
		$scope.stateCode = stateId;
		$scope.stateName = stateName;
		document.getElementById('districtLevel').style.display = '';
		$scope.type = 'D';
		getDistrictCount(stateId);
	}
	function getDistrictCount(stateId) {
		$scope.loader = true;
		$scope.details = {};
		zpPlanUploadService.findDistrictWise(stateId, $scope.year).then(function(response) {
			$scope.data = response.data;
			var zpPlanUploadDetails = new Array();
			angular.forEach($scope.data, function(obj, key) {
				var zpPlanUpload = new zpCount();
				zpPlanUpload.entityCode = obj.code;
				zpPlanUpload.entityName = obj.name;
				zpPlanUpload.count = obj.count;
				zpPlanUpload.planCode = obj.planCode;
				zpPlanUpload.lbType = obj.localBodyTypeCode;
				zpPlanUploadDetails.push(zpPlanUpload);
			});	
			$scope.details = zpPlanUploadDetails;
			$scope.loader = false;
	    });
	}
	
	$scope.onBack = function() {
		document.getElementById('districtLevel').style.display = 'none';
		document.getElementById('stateLevel').style.display = '';
		$scope.sumTotalZPCount=0;
		$scope.totalCount=0;
		$scope.details = {};
		$scope.stateCode = null;
		$scope.stateName = null;
		$scope.type = 'S';
		$scope.loader = true;
		zpPlanUploadService.findStateWise($scope.year).then(function(response){
			$scope.data = response.data;
			var zpPlanUploadDetails= new Array();
			angular.forEach($scope.data ,function(obj,key){
				var zpPlanUpload =new state();
				if(obj.code!=7 && obj.code!=4){
					zpPlanUpload.stateCode=obj.code;
					zpPlanUpload.stateName=obj.name;
					zpPlanUpload.totalZPCount=obj.zpCount;
					zpPlanUpload.count=obj.count;
					zpPlanUploadDetails.push(zpPlanUpload);
					
					$scope.sumTotalZPCount=$scope.sumTotalZPCount+obj.zpCount;
					$scope.totalCount=$scope.totalCount+obj.count;
				}
			});
			$scope.details=zpPlanUploadDetails;
			$scope.loader=false;
		});
	}
	
	$scope.getZPDetails = function getZPDetails(zpCode, planCode, lbType) {
		window.open("approveactionforgpdp.do?gp_code="+zpCode+"&planyrflg="+$scope.year+"&state_code="+$scope.stateCode+"&plan_code="+planCode+"&local_body_typ_cd="+lbType, '_blank');
	}
	
	$scope.exportFile = function exportFile(id) {
		$("#" + id).excelexportjs({
			containerid : id,
			datatype : 'table',
			worksheetName : "No. of ZPs & Equivalent with Approved Action Plan ("+$scope.year+")",
		});
	}


 $scope.exportFile = function(headerId, bodyId){
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('No. of ZPs & Equivalent with Approved Action Plan ('+$scope.year+')');

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
        saveAs(blob,"No. of ZPs & Equivalent with Approved Action Plan.xlsx");
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
			title : "No. of ZPs & Equivalent with Approved Action Plan ("+$scope.year+")"
		});
	}
}]); 