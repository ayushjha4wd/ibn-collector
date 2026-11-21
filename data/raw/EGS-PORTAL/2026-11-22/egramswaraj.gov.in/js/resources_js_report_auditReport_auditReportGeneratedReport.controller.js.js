var auditReportGeneratedReportModule = angular.module("auditReportGeneratedReportModule", []);

auditReportGeneratedReportModule.controller("auditReportGeneratedReportController",['$scope',"auditReportGeneratedReportService",function($scope, auditReportGeneratedReportService) {
	$scope.data = null;
	$scope.districtData = null;
	$scope.gpData = null;
	$scope.stateCode = null;
	$scope.stateName = null;
	$scope.districtCode = null;
	$scope.districtName = null;
	$scope.blockCode = null;
	$scope.blockName = null;
	$scope.userCode = null;
	$scope.userName = null;
	$scope.year = null;
	$scope.totalgpCount = 0;
	$scope.totalAuditeeCount = 0;
	$scope.year= document.getElementById("year").value;
	prepareState($scope.year);

	
	$scope.onBack = function(stateCode,districtCode,blockCode ) {
		if(stateCode != null && districtCode != null && blockCode != null){
			document.getElementById('districtDiv').style.display = 'none';			
			document.getElementById('blockDiv').style.display = '';			
			document.getElementById('stateDiv').style.display = 'none';
			document.getElementById('gpDiv').style.display = 'none';
			$scope.gpData = null;
			$scope.blockCode = null;
			$scope.blockName = null;
			

			prepareBlock($scope.year,districtCode);
		}
		if(stateCode != null && districtCode == null && blockCode != null){
			document.getElementById('districtDiv').style.display = 'none';			
			document.getElementById('blockDiv').style.display = '';			
			document.getElementById('stateDiv').style.display = 'none';
			document.getElementById('gpDiv').style.display = 'none';
			$scope.gpData = null;
			$scope.blockCode = null;
			$scope.blockName = null;
			
			
			prepareBlockByState($scope.year,stateCode);
		}
		if(stateCode != null && districtCode != null && blockCode == null ){
			document.getElementById('districtDiv').style.display = '';			
			document.getElementById('stateDiv').style.display = 'none';			
			document.getElementById('blockDiv').style.display = 'none';		
			document.getElementById('gpDiv').style.display = 'none';
			$scope.districtData = null;
			$scope.districtCode = null;
			$scope.districtName = null;
			
			
			prepareDistrict($scope.year,stateCode);
		}
		if(stateCode != null && districtCode == null && blockCode == null){
			document.getElementById('districtDiv').style.display = 'none';			
			document.getElementById('blockDiv').style.display = 'none';						
			document.getElementById('gpDiv').style.display = 'none';			
			document.getElementById('stateDiv').style.display = '';
			$scope.districtData = null;
			$scope.stateCode = null;
			$scope.stateName = null;
			prepareState($scope.year);
		}
		
	}
	
	function prepareState(year) {
		$scope.loader = true;
		$scope.totalgpCount = 0;
		$scope.totalAuditorCount = 0;
		auditReportGeneratedReportService.searchForAuditee(year).then(function(response) {
			$scope.data = response.data;
			angular.forEach($scope.data, function(obj, key) {			
				/*$scope.totalgpCount = $scope.totalgpCount + obj.gpCount;*/
				$scope.totalAuditorCount = $scope.totalAuditorCount + obj.count;
			
			});
			$scope.loader = false;
			if($scope.totalAuditorCount != 0){
				registeredAuditorBarGraph($scope.data);	
			}
			
		});
	}
	
	function registeredAuditorBarGraph(chartData) {
		var name=[];
		var count=[];
		for(var i =0; i < chartData.length; i++) {
			name.push(chartData[i].name);
			count.push(chartData[i].count);
		}
		if($scope.stateCode == null){
		 var myChart = echarts.init(document.getElementById('registeredAuditorBarGraph'));
		}
		if($scope.stateCode != null){
			var myChart = echarts.init(document.getElementById('registeredAuditorBarGraph1'));
		}
	     var option = {
	   		 calculable : true,
	   		/*title : {
		        text: 'No. of Auditors Registered',
		        x:'center'
		    },*/
	   		 tooltip: {
	   			trigger: 'item',
		    	formatter: "<b>Name: {b}<br/>Generated Reports Count: {c}</b>"
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
           			  var colorList = ['#3c8dbc', ' ', 'Green', '#f9881e', '#FE8463'];
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
		if($scope.stateCode == 34){
			document.getElementById('stateDiv').style.display = 'none';
			document.getElementById('districtDiv').style.display = 'none';
			document.getElementById('blockDiv').style.display = '';
			document.getElementById('gpDiv').style.display = 'none';
			$scope.stateCode = stateId;
			$scope.stateName = stateName;
			
			prepareBlockByState($scope.year,stateId);	
		}
		if($scope.stateCode == 15 || $scope.stateCode == 17 || $scope.stateCode == 13){
			document.getElementById('stateDiv').style.display = 'none';
			document.getElementById('districtDiv').style.display = 'none';
			document.getElementById('blockDiv').style.display = '';
			document.getElementById('gpDiv').style.display = 'none';
			$scope.stateCode = stateId;
			$scope.stateName = stateName;
			
			prepareBlockByState($scope.year,stateId);	
		}
		if($scope.stateCode != 34 && $scope.stateCode != 15 && $scope.stateCode != 17 && $scope.stateCode != 13){
			document.getElementById('stateDiv').style.display = 'none';
			document.getElementById('districtDiv').style.display = '';
			document.getElementById('blockDiv').style.display = 'none';
			document.getElementById('gpDiv').style.display = 'none';
			$scope.stateCode = stateId;
			$scope.stateName = stateName;
			
			prepareDistrict($scope.year,stateId);
		}
		
		
	}
	
	function prepareDistrict(year,stateId) {
		$scope.loader = true;
		$scope.totalgpCount = 0;
		$scope.totalAuditorCount = 0;
		$scope.districtData = null;
		auditReportGeneratedReportService.searchDistrict(year,parseInt(stateId)).then(function(response) {
			$scope.districtData = response.data;
			angular.forEach($scope.districtData, function(obj, key) {			
				/*$scope.totalgpCount = $scope.totalgpCount + obj.gpCount;*/
				$scope.totalAuditorCount = $scope.totalAuditorCount + obj.count;
			
		});
			$scope.loader = false;
			registeredAuditorBarGraph($scope.districtData);
		});
	}
/*	$scope.onStateForHr = function(stateId, stateName) {
		$scope.gpData = null;
		document.getElementById('stateDiv').style.display = 'none';
		document.getElementById('districtDiv').style.display = 'none';
		document.getElementById('blockDiv').style.display = 'none';
		document.getElementById('gpDiv').style.display = '';
		$scope.stateCode = stateId;
		$scope.stateName = stateName;
		prepareGPForHr($scope.year,$scope.stateCode);
		
	}
	function prepareGPForHr(year,stateId) {
		$scope.loader = true;
		$scope.gpData = null;
		auditeeRegisteredService.searchAuditorForHr(parseInt(year),parseInt(stateId)).then(function(response) {
			$scope.gpData = response.data;
			$scope.loader = false;
		});
	}
	

	
	*/
	$scope.onDistrict = function(districtId, districtName) {
		if($scope.stateCode == 11 || $scope.stateCode == 25 || $scope.stateCode == 26 || $scope.stateCode == 30 || $scope.stateCode == 31 || $scope.stateCode == 14){
			document.getElementById('stateDiv').style.display = 'none';
			document.getElementById('districtDiv').style.display = 'none';
			document.getElementById('blockDiv').style.display = 'none';
			document.getElementById('gpDiv').style.display = '';
			$scope.districtCode = districtId;
			$scope.districtName = districtName;
			searchGPByDistrict($scope.year,districtId);
		}
		if($scope.stateCode != 11 && $scope.stateCode != 25 && $scope.stateCode != 26 && $scope.stateCode != 30 && $scope.stateCode != 31 && $scope.stateCode != 14 && $scope.stateCode != 34 && $scope.stateCode != 13 && $scope.stateCode != 115 && $scope.stateCode != 17){
		document.getElementById('stateDiv').style.display = 'none';
		document.getElementById('districtDiv').style.display = 'none';
		document.getElementById('blockDiv').style.display = '';
		document.getElementById('gpDiv').style.display = 'none';
		$scope.districtCode = districtId;
		$scope.districtName = districtName;
		prepareBlock($scope.year,$scope.districtCode);
		}
	}
	function prepareBlock(year,district) {
		$scope.loader = true;
		$scope.districtData = null;
		$scope.totalgpCount = 0;
		$scope.totalAuditorCount = 0;
		auditReportGeneratedReportService.searchBlock(year,parseInt(district)).then(function(response) {
			$scope.districtData = response.data;
			angular.forEach($scope.districtData, function(obj, key) {			
				/*$scope.totalgpCount = $scope.totalgpCount + obj.gpCount;*/
				$scope.totalAuditorCount = $scope.totalAuditorCount + obj.count;
			
		});
			$scope.loader = false;
			/*registeredAuditorBarGraph($scope.districtData);*/
		});
	}
	function prepareBlockByState(year,stateCode) {
		$scope.loader = true;
		$scope.districtData = null;
		$scope.totalgpCount = 0;
		$scope.totalAuditorCount = 0;
		auditReportGeneratedReportService.prepareBlockByState(year,parseInt(stateCode)).then(function(response) {
			$scope.districtData = response.data;
			angular.forEach($scope.districtData, function(obj, key) {			
				/*$scope.totalgpCount = $scope.totalgpCount + obj.gpCount;*/
				$scope.totalAuditorCount = $scope.totalAuditorCount + obj.count;
				
			});
			$scope.loader = false;
			/*registeredAuditorBarGraph($scope.districtData);*/
		});
	}
	
	$scope.onBlock = function(blockId, blockName) {
		document.getElementById('stateDiv').style.display = 'none';
		document.getElementById('districtDiv').style.display = 'none';
		document.getElementById('blockDiv').style.display = 'none';
		document.getElementById('gpDiv').style.display = '';
		$scope.blockCode = blockId;
		$scope.blockName = blockName;
		prepareGP($scope.year,$scope.blockCode);
		
	}
	
	function prepareGP(year,blockId) {
		$scope.loader = true;
		auditReportGeneratedReportService.searchGP(year,parseInt(blockId)).then(function(response) {
			$scope.gpData = response.data;
			$scope.loader = false;
			
		});
	}
	function searchGPByDistrict(year,districtId) {
		$scope.loader = true;
		auditReportGeneratedReportService.searchGPByDistrict(year,parseInt(districtId)).then(function(response) {
			$scope.gpData = response.data;
			$scope.loader = false;
			
		});
	}
	function searchGPByState(year,districtId) {
		$scope.loader = true;
		auditReportGeneratedReportService.searchGPByState(year,parseInt(districtId)).then(function(response) {
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