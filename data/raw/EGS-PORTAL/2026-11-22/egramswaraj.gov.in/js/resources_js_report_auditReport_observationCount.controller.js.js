var observationCountModule = angular.module("observationCountModule", []);

observationCountModule.controller("observationCountController",['$scope',"observationCountService",function($scope, observationCountService) {
	$scope.data = null;
	$scope.totalCount = 0;
	$scope.year= document.getElementById("year").value;
	$scope.stateCode = null;
	$scope.stateName = null;
	$scope.categoryId = null;
	$scope.categoryName = null;
	$scope.type = 'S';
	onLoad();

	function onLoad() {
		$scope.loader = true;
		$scope.totalCount = 0;
		observationCountService.getState($scope.year).then(function(response) {
			angular.forEach(response.data, function(obj, key) {
				$scope.totalCount = $scope.totalCount + obj.count; 
			});
			$scope.data = response.data;
			$scope.loader = false;
			observationBarChart($scope.data);
		});
	}
	
	$scope.onState = function(stateId, stateName) {
		$scope.stateCode = stateId;
		$scope.stateName = stateName;
		$scope.data = null;
		$scope.totalCount = 0;
		$scope.type = 'C';
		document.getElementById('stateDiv').style.display = 'none';
		document.getElementById('categoryDiv').style.display = '';
		getCategory(stateId);
	}
	
	function getCategory(stateId) {
		$scope.loader = true;
		observationCountService.getCategory($scope.year, stateId).then(function(response) {
			angular.forEach(response.data, function(obj, key) {
				$scope.totalCount = $scope.totalCount + obj.count; 
			});
			$scope.data = response.data;
			$scope.loader = false;
			observationPieChart($scope.data);
		});
	}
	
	$scope.onCategory = function(categoryId, categoryName) {
		$scope.categoryId = categoryId;
		$scope.categoryName = categoryName;
		$scope.data = null;
		$scope.totalCount = 0;
		$scope.type = 'SC';
		document.getElementById('categoryDiv').style.display = 'none';
		document.getElementById('subCategoryDiv').style.display = '';
		getSubCategory(categoryId);
	}
	
	function getSubCategory(categoryId) {
		$scope.loader = true;
		observationCountService.getSubcategory($scope.year, $scope.stateCode, categoryId).then(function(response) {
			angular.forEach(response.data, function(obj, key) {
				$scope.totalCount = $scope.totalCount + obj.count; 
			});
			$scope.data = response.data;
			$scope.loader = false;
		});
	}
	
	$scope.onBack = function(type) {
		$scope.data = null;
		$scope.totalCount = 0;
		document.getElementById('stateDiv').style.display = 'none';
		document.getElementById('categoryDiv').style.display = 'none';
		document.getElementById('subCategoryDiv').style.display = 'none';
		if(type == 'SC') {
			$scope.categoryId = null;
			$scope.categoryName = null;
			$scope.type = 'C';
			document.getElementById('categoryDiv').style.display = '';
			getCategory($scope.stateCode);
		}
		if(type == 'C') {
			$scope.stateCode = null;
			$scope.stateName = null;
			$scope.type = 'S';
			document.getElementById('stateDiv').style.display = '';
			onLoad();
		}
	}
	
	function observationBarChart(chartData) {
		var name=[];
		var count=[];
		for(var i =0; i < chartData.length; i++) {
			name.push(chartData[i].name);
			count.push(chartData[i].count);
		}
		 var myChart = echarts.init(document.getElementById('observationBarGraph'));
	     var option = {
	   		 calculable : true,
	   		 /*title : {
		        text: 'No. of observations recorded',
		        x:'center'
	   		 },*/
	   		 tooltip: {
	   			trigger: 'item',
		    	formatter: "<b>State: {b}<br/>Observations Recorded Count: {c}</b>"
	   		 },
	   		 grid: {
	   			containLabel : true,
		        top : 55,
		        bottom : 5,
		        left : 5,
		        right : 5
	   		 },
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
	
	function observationPieChart(chartData) {
		var name = [];
		 var count = [];
		 var l = chartData.length;
		 for (var i = 0; i < l; i++) {
	         var item = {value: chartData[i].count, name: chartData[i].name};
	         name.push(item);
		 }
		var myChart = echarts.init(document.getElementById('observationPieChart'));
		var option = {
				title: [{
					text: 'Category',
			        x:'center'
			    },
			    /*{
			    	text: 'Category wise',
			        top: '90%',
			        left: '50%',
			        textAlign: 'center'
			    }*/],
				tooltip: {
					trigger: 'item',
					formatter: '{b}:<br/>{c} ({d}%)'
				},
				legend: {
			    	//type: 'scroll',
			        orient: 'horizontal',
			        y: 'bottom',
	 		        x: 'left',
			        data: name,
			        /*formatter: function (data) {
					    var text = data;
					    formatted = text.replace(/\s/g, "\n");
	                 return formatted;
				    },*/
			        itemGap: 1,
			        itemWidth: 15,
			        itemHeight: 20,
			        borderRadius: 4,
			        pageIconSize: 10,
			        textStyle: {
			        	fontSize: 11,
			        	lineHeight: 12.5,
			        	padding: 4,
			        }
			    	//fontSize: 10,
			    },
				series : [
			        {
			        	type: 'pie',
			            radius : '50%',
			            center: ['50%', '50%'],
			            data: name,
			        }
			    ]
				/*series: [
			         {
			        	 type: 'pie',
			        	 radius: ['50%', '50%'],
			        	 avoidLabelOverlap: false,
			        	 label: {
			        		 show: true,
			        		 position: 'center'
			        	 },
			        	 emphasis: {
			        		 label: {
			        			 show: true,
			        			 fontSize: '30',
			        			 fontWeight: 'bold',
			        			 formatter: '{d}%'
			        		 }
			        	 },
			        	 labelLine: {
			        		 show: true
			        	 },
			        	 data: name,
			         }
		         ]*/
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