 var bpPlanUploadModule=angular.module("bpPlanUploadModule",['datatables']);
 bpPlanUploadModule.controller("bpPlanUploadController",['$scope',"bpPlanUploadService",'DTOptionsBuilder',function($scope,bpPlanUploadService,DTOptionsBuilder){
	
	$scope.dtOptions = DTOptionsBuilder.newOptions()
    .withOption('order', [0, 'asc'])
    .withOption('responsive', true)
    .withOption('lengthMenu', [[-1, 10, 25, 50, 100], ['All', 10, 25, 50, 100]])
    .withOption('pageLength', 10);
	
	 $scope.year = $("#year").val();
	 $scope.loader=true;
	 $scope.type='S';
	 $scope.data={};
	 $scope.details={};
	 $scope.stateCode = null;
	 $scope.stateName = null;
	 $scope.code = null;
	 $scope.name = null;
	 $scope.planYear = $scope.year; 
	 getStateCount();
	
	$scope.getPlanYear = function getPlanYear(planYear){
		$scope.year = planYear;
		$scope.planYear = planYear; 
		getStateCount();
	}
	
	function getStateCount(){
		 $scope.loader=true;
		 document.getElementById('stateLevel').style.display = '';
		 document.getElementById('districtLevel').style.display = 'none';
		 document.getElementById('blockLevel').style.display = 'none';
		 bpPlanUploadService.findStateWise($scope.year).then(function(response){
			
			 $scope.data=response.data;
			 $scope.details={};
			 $scope.sumTotalBPCount=0;
			 $scope.totalCount=0;
			 var bpPlanUploadDetails=new Array();
			 angular.forEach($scope.data,function(obj,key){
				 var bpPlanUpload=new state();
				 	if(obj.code!=7 && obj.code!=4){
				 		bpPlanUpload.stateCode=obj.code;
				 		bpPlanUpload.stateName=obj.name;
				 		bpPlanUpload.totalBPCount=obj.bpCount;
				 		bpPlanUpload.count=obj.count;
				 		bpPlanUploadDetails.push(bpPlanUpload);
				 		
				 		$scope.sumTotalBPCount=$scope.sumTotalBPCount+obj.bpCount;
				 		$scope.totalCount=$scope.totalCount+obj.count;
				 	}
			 });
			 $scope.details=bpPlanUploadDetails;
			 $scope.loader=false;
		 });
	 }
	 
	 $scope.onDistrictCount= function onDistrictCount(stateId,stateName){
			document.getElementById('stateLevel').style.display = 'none';
			$scope.stateCode = stateId;
			$scope.stateName = stateName;
			if(stateId==34){
				document.getElementById('blockLevel').style.display = '';
				$scope.type="IS";
				getBlockCount(2);
			} else {
				document.getElementById('districtLevel').style.display = '';
				$scope.type = 'D';
				getDistrictCount(stateId);
			}
			
		}
		function getDistrictCount(stateId) {
			$scope.loader = true;
			$scope.details = {};
			$scope.sumTotalBPCount=0;
			$scope.totalCount=0;
			bpPlanUploadService.findDistrictWise(stateId, $scope.year).then(function(response) {
				$scope.data = response.data;
				var bpPlanUploadDetails = new Array();
				angular.forEach($scope.data, function(obj, key) {
					var bpPlanUpload = new zpCount();
					bpPlanUpload.entityCode = obj.code;
					bpPlanUpload.entityName = obj.name;
					bpPlanUpload.count = obj.count;
					bpPlanUpload.totalBPCount=obj.bpCount;
					bpPlanUpload.lbType=obj.localBodyTypeCode;
					bpPlanUploadDetails.push(bpPlanUpload);
					
					$scope.sumTotalBPCount=$scope.sumTotalBPCount+obj.bpCount;
					$scope.totalCount=$scope.totalCount+obj.count;
				});	
				$scope.details = bpPlanUploadDetails;
				$scope.loader = false;
		    });
		}	
		
		$scope.onBlockCount= function onBlockCount(code,name){
			document.getElementById('stateLevel').style.display = 'none';
			document.getElementById('districtLevel').style.display = 'none';
			$scope.code = code;
			$scope.name = name;
			document.getElementById('blockLevel').style.display = '';
			$scope.type = 'I';
			getBlockCount(code);
		}
		function getBlockCount(code) {
			$scope.loader = true;
			$scope.details = {};
			bpPlanUploadService.findBlockWise(code,$scope.stateCode,$scope.year).then(function(response) {
				$scope.data = response.data;
				var bpPlanUploadDetails = new Array();
				angular.forEach($scope.data, function(obj, key) {
					var bpPlanUpload = new bpCount();
					bpPlanUpload.entityCode = obj.code;
					bpPlanUpload.entityName = obj.name;
					bpPlanUpload.planCode = obj.planCode;
					bpPlanUpload.count = obj.count;
					bpPlanUpload.lbType=obj.localBodyTypeCode;
					bpPlanUploadDetails.push(bpPlanUpload);
				});	
				$scope.details = bpPlanUploadDetails;
				$scope.loader = false;
		    });
		}
		
		
		$scope.onBack = function(type) {
			document.getElementById('districtLevel').style.display = 'none';
			document.getElementById('stateLevel').style.display = 'none';
			document.getElementById('blockLevel').style.display = 'none';
			$scope.sumTotalBPCount=0;
			$scope.totalCount=0;
			$scope.details = {};
			$scope.code=null;
			$scope.name=null;
			$scope.loader = true;
			if(type=="IS" || type == 'D'){
				$scope.stateCode = null;
				$scope.stateName = null;
				$scope.type = 'S';
				document.getElementById('stateLevel').style.display = '';
				bpPlanUploadService.findStateWise($scope.year).then(function(response){
					$scope.data = response.data;
					var bpPlanUploadDetails= new Array();
					angular.forEach($scope.data ,function(obj,key){
						var bpPlanUpload =new state();
						if(obj.code!=7 && obj.code!=4){
							bpPlanUpload.stateCode=obj.code;
							bpPlanUpload.stateName=obj.name;
							bpPlanUpload.totalBPCount=obj.bpCount;
							bpPlanUpload.count=obj.count;
							bpPlanUploadDetails.push(bpPlanUpload);
							
							$scope.sumTotalBPCount=$scope.sumTotalBPCount+obj.bpCount;
							$scope.totalCount=$scope.totalCount+obj.count;
						}
					});
					$scope.details=bpPlanUploadDetails;
					$scope.loader=false;
				});
			}else if(type=="I"){
				$scope.type="D";
				document.getElementById('districtLevel').style.display = '';
				getDistrictCount($scope.stateCode);
			}
			
			
			
			
		}
		
		$scope.getBPDetails = function getBPDetails(bpCode, planCode, lbType) {
			window.open("approveactionforgpdp.do?gp_code="+bpCode+"&planyrflg="+$scope.year+"&state_code="+$scope.stateCode+"&plan_code="+planCode+"&local_body_typ_cd="+lbType, '_blank');
		}
		
		 
 $scope.exportFile = function(headerId, bodyId){
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('No. of BPs & Equivalent with Approved Action Plan ('+$scope.year+')');

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
        saveAs(blob,"No. of BPs & Equivalent with Approved Action Plan.xlsx");
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
				title : "No. of BPs & Equivalent with Approved Action Plan ("+$scope.year+")"
			});
		}
 }]);