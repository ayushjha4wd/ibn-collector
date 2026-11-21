function lineChart(chartData, chartSelection) {

	option = {
		    tooltip : {
		        trigger: 'axis',
		        position: function (pos, params, dom, rect, size) {
		            var obj = {top: 10};
		            obj[['left', 'right']['50%', '50%']];
		            return obj;
		        }
		    },
		    grid: {
	            containLabel: true,
	            top: 45,
	            bottom: 5,
	        },
		    legend: {
		    	type: 'scroll',
		    	orient : 'horizontal',
		        y: 'top',
		        data:['No. of Profile Created', 'No. of GPDP Approved', 'No. of Physical Progress Ongoing', 'No. of Vouchers Booked', 'No. of FTOs Booked'] //, 'No. of Successful Login', 'No. of Geo-tagging Initiated'
		    },
		    calculable : true,
		    xAxis : [
		        {
		            type : 'category',
		            boundaryGap : false,
		            data : chartData.days
		        }
		    ],
		    yAxis : [
		        {
		            type : 'value'
		        }
		    ],
		    series : [
		        {
		            name:'No. of Profile Created',
		            type:'line',
		            data:chartData.gpProfile,
		            itemStyle: {
		                normal: {
		                    color:['#00bbfe']
		                }
		            }
		        },
		        {
		            name:'No. of GPDP Approved',
		            type:'line',
		            data:chartData.gpdpApproved,
		            itemStyle: {
		                normal: {
		                    color:['#539132']
		                }
		            }
		        },
		        {
		            name:'No. of Physical Progress Ongoing',
		            type:'line',
		            data:chartData.activityComplete,
		            itemStyle: {
		                normal: {
		                    color:['#f9b45e']
		                }
		            }
		        },
		        {
		            name:'No. of Vouchers Booked',
		            type:'line',
		            data:chartData.voucher,
		            itemStyle: {
		                normal: {
		                    color:['#b72cb5']
		                }
		            }
		        },
		        {
		            name:'No. of FTOs Booked',
		            type:'line',
		            data:chartData.fto,
		            itemStyle: {
		                normal: {
		                    color:['#ff3333']
		                }
		            }
		        }
			/*,
		        {
		            name:'No. of Successful Login',
		            type:'line',
		            data:chartData.log,
		            itemStyle: {
		                normal: {
		                    color:['#FF1493']
		                }
		            }
		        }
		        
		        
		        ,
		        {
		            name:'No. of Geo-tagging Initiated',
		            type:'line',
		            data:chartData.geoTaggedAssets,
		            itemStyle: {
		                normal: {
		                    color:['#b72cb5']
		                }
		            }
		            
		        }*/
		    ]
		};
    chartSelection.showLoading({
        text: 'Loading',
        effect: 'whirling'
    });
    setTimeout(function () {
        chartSelection.hideLoading();
        chartSelection.setOption(option);
    }, 1000)
}


function lineChart1(chartData, chartSelection) {

	option = {
		    tooltip : {
		        trigger: 'axis',
		        position: function (pos, params, dom, rect, size) {
		            var obj = {top: 10};
		            obj[['left', 'right']['50%', '50%']];
		            return obj;
		        }
		    },
		    grid: {
	            containLabel: true,
	            top: 45,
	            bottom: 5,
	        },
		    legend: {
		    	type: 'scroll',
		    	orient : 'horizontal',
		        y: 'top',
		        data:['No. of Profile Created', 'No. of GPDP Approved', 'No. of Physical Progress Ongoing'] //, 'No. of Geo-tagging Initiated'//, 'No. of Vouchers Booked', 'No. of FTOs Booked'
		    },
		    calculable : true,
		    xAxis : [
		        {
		            type : 'category',
		            boundaryGap : false,
		            data : chartData.days
		        }
		    ],
		    yAxis : [
		        {
		            type : 'value'
		        }
		    ],
		    series : [
		        {
		            name:'No. of Profile Created',
		            type:'line',
		            data:chartData.gpProfile,
		            itemStyle: {
		                normal: {
		                    color:['#00bbfe']
		                }
		            }
		        },
		        {
		            name:'No. of GPDP Approved',
		            type:'line',
		            data:chartData.gpdpApproved,
		            itemStyle: {
		                normal: {
		                    color:['#539132']
		                }
		            }
		        },
		        {
		            name:'No. of Physical Progress Ongoing',
		            type:'line',
		            data:chartData.activityComplete,
		            itemStyle: {
		                normal: {
		                    color:['#f9b45e']
		                }
		            }
		        }/*,
		        {
		            name:'No. of Vouchers Booked',
		            type:'line',
		            data:chartData.voucher,
		            itemStyle: {
		                normal: {
		                    color:['#b72cb5']
		                }
		            }
		        },
		        {
		            name:'No. of FTOs Booked',
		            type:'line',
		            data:chartData.fto,
		            itemStyle: {
		                normal: {
		                    color:['#ff3333']
		                }
		            }
		        }
		        */
		        
		        /*,
		        {
		            name:'No. of Geo-tagging Initiated',
		            type:'line',
		            data:chartData.geoTaggedAssets,
		            itemStyle: {
		                normal: {
		                    color:['#b72cb5']
		                }
		            }
		            
		        }*/
		    ]
		};
    chartSelection.showLoading({
        text: 'Loading',
        effect: 'whirling'
    });
    setTimeout(function () {
        chartSelection.hideLoading();
        chartSelection.setOption(option);
    }, 1000)
}

