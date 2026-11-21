var centerLevelModule = angular.module("centerLevelModule", []);

centerLevelModule.controller("centerLevelController",['$scope',"centerLevelService",function($scope, centerLevelService) {
	$scope.data = null;
	$scope.year = null;
	$scope.districtData = null;
	$scope.gpData = null;
	$scope.stateCode = null;
	$scope.stateName = null;
	$scope.districtCode = null;
	$scope.districtName = null;
	$scope.blockCode = null;
	$scope.blockName = null;
	$scope.totalgpCount = 0;
	$scope.totalAuditeeCount = 0;
	$scope.totalCountCenter = 0;
	$scope.auditeeCode = null;
	$scope.auditeeName = null;
	
	$scope.expand = function(id){
		expandDiv(id);
	}
	
	$scope.collapse = function(id){
		collapseDiv(id);
	}
	$scope.year= document.getElementById("year").value;
	prepareState($scope.year);

	$scope.onYear = function(id) {
		document.getElementById('centerDiv').style.display = 'none';
		document.getElementById('stateDiv').style.display = '';
		$scope.year = id;
		$scope.data = null;
		prepareState(id);
	
	}
	$scope.onBack = function(stateCode,year,districtCode,blockCode,auditeeCode) {
		if(stateCode != null && year != null && districtCode != null && blockCode != null && auditeeCode != null){
			document.getElementById('districtDiv').style.display = 'none';			
			document.getElementById('blockDiv').style.display = 'none';			
			document.getElementById('stateDiv').style.display = 'none';
			document.getElementById('gpDiv').style.display = '';
			document.getElementById('auditorDetailDiv').style.display = 'none';
			$scope.gpData = null;
			$scope.auditeeCode = null;
			$scope.auditeeName = null;
			

			prepareGP(year,blockCode);
		}
		if(stateCode != null && year != null && districtCode != null && blockCode == null && auditeeCode != null){
			document.getElementById('districtDiv').style.display = 'none';			
			document.getElementById('blockDiv').style.display = 'none';			
			document.getElementById('stateDiv').style.display = 'none';
			document.getElementById('gpDiv').style.display = '';
			document.getElementById('auditorDetailDiv').style.display = 'none';
			$scope.gpData = null;
			$scope.auditeeCode = null;
			$scope.auditeeName = null;
			
			
			prepareGPByDistrict(year,districtCode);
		}
		if(stateCode != null && year != null && districtCode == null && auditeeCode != null){
			document.getElementById('districtDiv').style.display = 'none';			
			document.getElementById('blockDiv').style.display = 'none';			
			document.getElementById('stateDiv').style.display = 'none';
			document.getElementById('gpDiv').style.display = '';
			document.getElementById('auditorDetailDiv').style.display = 'none';
			$scope.gpData = null;
			$scope.auditeeCode = null;
			$scope.auditeeName = null;
			
			
			prepareGPForHr(year,stateCode);
		}
		if(stateCode != null && year != null && districtCode != null && blockCode != null  && auditeeCode == null){
			document.getElementById('districtDiv').style.display = 'none';			
			document.getElementById('blockDiv').style.display = '';			
			document.getElementById('stateDiv').style.display = 'none';
			document.getElementById('gpDiv').style.display = 'none';
			document.getElementById('auditorDetailDiv').style.display = 'none';
			$scope.districtData = null;
			$scope.blockCode = null;
			$scope.blockName = null;
			
			
			prepareBlock(year, districtCode);
		}
		if(stateCode != null && year != null && districtCode != null && blockCode == null && auditeeCode == null){
			document.getElementById('districtDiv').style.display = '';			
			document.getElementById('stateDiv').style.display = 'none';
			document.getElementById('blockDiv').style.display = 'none';
			document.getElementById('gpDiv').style.display = 'none';
			document.getElementById('auditorDetailDiv').style.display = 'none';
			$scope.gpData = null;
			$scope.districtCode = null;
			$scope.districtName = null;
			
			
			prepareDistrict(year,stateCode);
		}
		if(stateCode != null && year != null && districtCode == null && blockCode == null && auditeeCode == null){
			document.getElementById('districtDiv').style.display = 'none';			
			document.getElementById('blockDiv').style.display = 'none';			
			document.getElementById('gpDiv').style.display = 'none';			
			document.getElementById('auditorDetailDiv').style.display = 'none';			
			document.getElementById('stateDiv').style.display = '';
			$scope.districtData = null;
			$scope.stateCode = null;
			$scope.stateName = null;
			prepareState(year);
		}
		/*if(stateCode == null && year != null && districtCode == null){
			document.getElementById('districtDiv').style.display = 'none';			
			document.getElementById('stateDiv').style.display = '';
			document.getElementById('gpDiv').style.display = 'none';
		    $scope.data = null;
		    centerLevelService.find().then(function(response) {
				$scope.data = response.data;
		    });
		}*/
	}
	
	function prepareState(id) {
		$scope.loader = true;
		$scope.totalgpCount = 0;
		$scope.totalAuditeeCount = 0;
		$scope.data = null;
		$scope.details = {};
		var centerLevels = new Array();
		centerLevelService.search(id).then(function(response) {
			$scope.data = response.data;
			angular.forEach($scope.data, function(obj, key) {
				var centerLevel = new centerLevelDetails();
				centerLevel.code = obj.code;
				centerLevel.name = obj.name;
				centerLevel.gpCount = obj.gpCount;
				centerLevel.auditeeCount = obj.auditeeCount;
				centerLevel.percentage = ((obj.auditeeCount/obj.gpCount)*100).toFixed(2);
				centerLevels.push(centerLevel);
				$scope.totalgpCount = $scope.totalgpCount + obj.gpCount;
				$scope.totalAuditeeCount = $scope.totalAuditeeCount + obj.auditeeCount;
			
		});
			$scope.details = centerLevels;
			$scope.loader = false;
			
			
			registeredAuditeePlanBarGraph($scope.data);
			
		});
	}
	  
	function registeredAuditeePlanBarGraph(chartData) {
		var name=[];
		var count=[];
		for(var i =0; i < chartData.length; i++) {
			name.push(chartData[i].name);
			count.push(chartData[i].auditeeCount);
		}
		if($scope.stateCode == null){
		 var myChart = echarts.init(document.getElementById('registeredAuditeePlanBarGraph'));
		}
		if($scope.stateCode != null){
			var myChart = echarts.init(document.getElementById('registeredAuditeePlanBarGraph1'));
		}
		
		var option = {
				calculable : true,
				/*title : {
					text: 'Audit Plans prepared',
					x:'center'
				},*/
				tooltip: {
					trigger: 'item',
					formatter: "<b>Name: {b}<br/>No. of GPs with Audit Plans Count: {c}</b>"
				},
				grid: {
					containLabel : true,
					top : 55,
					bottom : 5,
					left : 5,
					right : 5
				},
				/*legend: {
	        	//orient : 'horizontal',
		        //y: 'top',
		        textStyle: {
		        	fontSize: 10,
		        	lineHeight: 5.5,
		        	padding:1,
		        },
		        data:'No. of Auditors Registered'
	        
		    },*/
				xAxis : [{
					type : 'category',
					axisTick: {show:false},
					boundaryGap : true,
					data: name,
					axisLabel: {
						rotate: 90,
						formatter: function (data) {
							var text = data.trim(),
							formatted = text.length > 12 ? text.substring(0, 12) + '...' : text;
							return formatted;
						},
						fontSize: 10
					},
					// barGap: '40%'
				}],
				yAxis: [{
					//name: 'Count',
					type: 'value'
				}],    
				series : [{	
					type:'bar',
					data: count,
					itemStyle: {
		            	normal: {
		            		color:'#3c8dbc'
		            	}
					},
					/*label: {
		                show: true,
		                position: 'outside'
		            },*/
					/*itemStyle: {
	            	normal: {
	            		color: function (data) {
           			  var colorList = ['#3c8dbc', 'Yellow', 'Green', '#f9881e', '#FE8463'];
             			  return colorList[data.dataIndex]
   				    },
   				    label:{color:"black", show:true}
	            	}
	            }*/
				}]
		};
		myChart.showLoading({
			text : 'Loading',
			effect: 'whirling'
		});
		setTimeout(function (){
			myChart.hideLoading();
			myChart.setOption(option);
		}, 1000)
	}	
	$scope.onState = function(stateId, stateName) {
		if($scope.stateCode != 34 && $scope.stateCode != 15 && $scope.stateCode != 17 && $scope.stateCode != 13){
			document.getElementById('stateDiv').style.display = 'none';
			document.getElementById('districtDiv').style.display = '';
			$scope.stateCode = stateId;
			$scope.stateName = stateName;
			
			prepareDistrict($scope.year,stateId);
		}
		if($scope.stateCode == 15 || $scope.stateCode == 17 || $scope.stateCode == 13){
			document.getElementById('stateDiv').style.display = 'none';
			document.getElementById('districtDiv').style.display = 'none';
			document.getElementById('blockDiv').style.display = '';
			$scope.stateCode = stateId;
			$scope.stateName = stateName;
			
			prepareDistrict($scope.year,stateId);
		}
		if($scope.stateCode == 34){
			document.getElementById('stateDiv').style.display = 'none';
			document.getElementById('districtDiv').style.display = 'none';
			document.getElementById('blockDiv').style.display = '';
			$scope.stateCode = stateId;
			$scope.stateName = stateName;
			
			prepareDistrict($scope.year,stateId);
		}
		
		
	}
	
	function prepareDistrict(year,stateId) {
		$scope.totalgpCount = 0;
		$scope.totalAuditeeCount = 0;
		$scope.districtData = null;
		$scope.loader = true;
		$scope.details = {};
		var centerLevels = new Array();
		centerLevelService.searchDistrict(year,parseInt(stateId)).then(function(response) {
			angular.forEach(response.data, function(obj, key) {	
				    var centerLevel = new centerLevelDetails();
				    centerLevel.code = obj.code;
				    centerLevel.name = obj.name;
				    centerLevel.gpCount = obj.gpCount;
				    centerLevel.auditeeCount = obj.auditeeCount;
				    centerLevel.percentage = ((obj.auditeeCount/obj.gpCount)*100).toFixed(2);
				    centerLevels.push(centerLevel);
					$scope.totalgpCount = $scope.totalgpCount + obj.gpCount;
					$scope.totalAuditeeCount = $scope.totalAuditeeCount + obj.auditeeCount;
				
			});
			$scope.details = centerLevels;
			$scope.districtData = response.data;
			registeredAuditeePlanBarGraph($scope.districtData);
			$scope.loader = false;
		});
	}
	
	$scope.onStateForHr = function(stateId, stateName) {
		$scope.gpData = null;
		document.getElementById('stateDiv').style.display = 'none';
		document.getElementById('districtDiv').style.display = 'none';
		document.getElementById('auditorDetailDiv').style.display = 'none';
		document.getElementById('gpDiv').style.display = '';
		$scope.stateCode = stateId;
		$scope.stateName = stateName;
		prepareGPForHr($scope.year,$scope.stateCode);
		
	}
	function prepareGPForHr(year,stateId) {
		$scope.loader = true;
		$scope.gpData = null;
		centerLevelService.searchAuditPlanForHr(year,parseInt(stateId)).then(function(response) {
			$scope.gpData = response.data;
			$scope.loader = false;
		});
	}
	
	$scope.onDistrict = function(districtId, districtName) {
		if($scope.stateCode == 11 || $scope.stateCode == 25 || $scope.stateCode == 26 || $scope.stateCode == 30 || $scope.stateCode == 31 || $scope.stateCode == 14){
			document.getElementById('stateDiv').style.display = 'none';
			document.getElementById('districtDiv').style.display = 'none';
			document.getElementById('blockDiv').style.display = 'none';
			document.getElementById('gpDiv').style.display = '';
			$scope.districtCode = districtId;
			$scope.districtName = districtName;
			prepareGPByDistrict($scope.year,districtId);
		}
		if($scope.stateCode != 11 && $scope.stateCode != 25 && $scope.stateCode != 26 && $scope.stateCode != 30 && $scope.stateCode != 31 && $scope.stateCode != 14 && $scope.stateCode != 34 && $scope.stateCode != 13 && $scope.stateCode != 115 && $scope.stateCode != 17){
			document.getElementById('stateDiv').style.display = 'none';
			document.getElementById('districtDiv').style.display = 'none';
			document.getElementById('blockDiv').style.display = '';
			$scope.districtCode = districtId;
			$scope.districtName = districtName;
			
			prepareBlock($scope.year,districtId);
		}
	}
	function prepareBlock(year,districtId) {
		$scope.totalgpCount = 0;
		$scope.totalAuditeeCount = 0;
		$scope.districtData = null;
		$scope.loader = true;
		$scope.details = {};
		var centerLevels = new Array();
		centerLevelService.searchBlock(year,parseInt($scope.stateCode),parseInt(districtId)).then(function(response) {
			angular.forEach(response.data, function(obj, key) {	
				var centerLevel = new centerLevelDetails();
				centerLevel.code = obj.code;
				centerLevel.name = obj.name;
				centerLevel.gpCount = obj.gpCount;
				centerLevel.auditeeCount = obj.auditeeCount;
				centerLevel.percentage = ((obj.auditeeCount/obj.gpCount)*100).toFixed(2);
				centerLevels.push(centerLevel);
				$scope.totalgpCount = $scope.totalgpCount + obj.gpCount;
				$scope.totalAuditeeCount = $scope.totalAuditeeCount + obj.auditeeCount;
				
			});
			$scope.details = centerLevels;
			$scope.districtData = response.data;
			registeredAuditeePlanBarGraph($scope.districtData);
			$scope.loader = false;
		});
	}
	
	$scope.onBlock = function(blockId, blockName) {
		document.getElementById('stateDiv').style.display = 'none';
		document.getElementById('districtDiv').style.display = 'none';
		document.getElementById('auditorDetailDiv').style.display = 'none';
		document.getElementById('blockDiv').style.display = 'none';
		document.getElementById('gpDiv').style.display = '';
		$scope.blockCode = blockId;
		$scope.blockName = blockName;
		
		prepareGP($scope.year,blockId);
		
	}
	
	function prepareGP(year,blockId) {
		$scope.loader = true;
		$scope.gpData = null;
		centerLevelService.searchGP(year,parseInt(blockId)).then(function(response) {
			$scope.gpData = response.data;
			$scope.loader = false;
		});
	}
	function prepareGPByDistrict(year,districtId) {
		$scope.loader = true;
		$scope.gpData = null;
		centerLevelService.searchGPByDistrict(year,parseInt(districtId)).then(function(response) {
			$scope.gpData = response.data;
			$scope.loader = false;
		});
	}
	$scope.onGP = function(auditeeCode, auditeeName) {
		document.getElementById('stateDiv').style.display = 'none';
		document.getElementById('districtDiv').style.display = 'none';
		document.getElementById('gpDiv').style.display = 'none';
		document.getElementById('blockDiv').style.display = 'none';
		document.getElementById('auditorDetailDiv').style.display = '';
		$scope.auditeeCode = auditeeCode;
		$scope.auditeeName = auditeeName;
		
		mappedAuditorDetails($scope.year,auditeeCode);
		
	}
	
	function mappedAuditorDetails(year,auditeeCode) {
		$scope.loader = true;
		$scope.gpData = null;
		centerLevelService.searchMappedAuditor(year,parseInt(auditeeCode)).then(function(response) {
			$scope.gpData = response.data;
			$scope.loader = false;
		});
	}
	
		
	function barGraphByCategory(categoryData) {
		 var name = [];
		 var count = [];
		 var l = categoryData.length;
		 for (var i = 0; i < l; i++) {
	         var item = categoryData[i].auditeeUnitCategory;
	         name.push(item);
	         var n = categoryData[i].auditeeCount;
	         count.push(n);
	     }
		 var j = 0;
		 if(document.getElementsByClassName('customboxfooter').length!=0){
			 j = 1;
		 }
		 var myChart = echarts.init(document.getElementsByClassName('category')[j]);
	     var option = {
	    		    tooltip : {
	    		    	trigger: 'item',
	    		    	formatter: "Category as per Comp Au <br/>Guidlines : {b}<br/>Count of Auditee Unit : {c}"
	    		    },
	    		    calculable : true,
	    		    xAxis : [
	    		        {
	    		        	data : name,
	    		        	axisTick: {show:false}
	    		        }
	    		    ],
	    		    grid: {
	    		        containLabel : true,
	    		        top : 45
	    		    },
	    		    yAxis : {
	    		    	axisTick: {show:false}
		    		},
	    		    series : [
	    		        {
	    		            type:'bar',
	    		            data: count,
	    		            itemStyle: {
	    		            	normal: {
	    		            		color: function (data) {
	    		            			  var colorList = [
	            		                          '#27727B', '#FE8463'
	        		                          ];
	                        			  return colorList[data.dataIndex]
	 		    				    },
	    		            		label:{color:"black", show:true}
	    		            	}
	    		            }
	    		        }
	    		    ]
	    		};
	     myChart.showLoading({
             text : 'Loading',
             effect: 'whirling'
         });
         setTimeout(function (){
        	 myChart.hideLoading();
             myChart.setOption(option);
         }, 1000)
         myChart.on('click', function (params) {
         	console.log(params);
         	var code = categoryData[params.dataIndex].categoryType;
  			$scope.category.push(code);
  			$scope.searchDatmodel.category = $scope.category;
     	   	prepareDataSet();
          });
	}
	
	function pieChartBySector(sectorData) {
		 var name = [];
		 var count = [];
		 var l = sectorData.length;
		 for (var i = 0; i < l; i++) {
	         var item = {value: sectorData[i].auditeeCount, name: sectorData[i].sectorName};
	         name.push(item);
	     }
		 
		 var j = 0;
		 if(document.getElementsByClassName('customboxfooter').length!=0){
			 j = 1;
		 }
		 
		 var myChart = echarts.init(document.getElementsByClassName('sector')[j]);
	     var option = {
		    title : {
		        text: '',
		        subtext: '',
		        x:'center'
		    },
		    tooltip : {
		        trigger: 'item',
		        formatter: "Sector : {b} <br/>Count of Auditee Unit : {c}"
		    },
		    /*legend: {
		        orient : 'horizontal',
		        y: 'bottom',
		        x: 'right',
		        data: name
		    },*/
		    calculable : true,
		    series : [
		        {
		        	type: 'pie',
		            radius : '50%',
		            center: ['50%', '50%'],
		            data: name,
		        }
		    ]
		};
	     myChart.showLoading({
             text : 'Loading',
             effect: 'whirling'
         });
         setTimeout(function (){
        	 myChart.hideLoading();
             myChart.setOption(option);
         }, 1000)
         myChart.on('click', function (params) {
          	console.log(params);
          	var code = sectorData[params.dataIndex].sectorId;
   			$scope.sectors.push(code);
   			$scope.searchDatmodel.sectors = $scope.sectors;
      	   	prepareDataSet();
           });
	} 
	
	$scope.exportFile = function exportFile(id, title) {
		$("#" + id).excelexportjs({
			containerid : id,
			datatype : 'table',
			worksheetName : title,
		});
	}

	$scope.onPrint = function onPrint(id, title) {
		$("#" + id).print({
			addGlobalStyles : false,
			stylesheet : null,
			rejectWindow : true,
			noPrintSelector : ".no-print",
			iframe : true,
			append : null,
			prepend : null,
			title : title
		});
	}
}]);