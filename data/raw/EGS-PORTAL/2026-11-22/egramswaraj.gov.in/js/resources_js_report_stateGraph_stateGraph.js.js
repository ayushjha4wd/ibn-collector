function barChart(chartData, chartSelection) {

    var option = {
        title: {
            text: "",
            subtext: '',
            x: 'left'
        },
        tooltip: {},
        grid: {
            containLabel: true,
            top: 45,
            bottom: 15,
            left : 5,
	        right : 5,
        },
        legend: {
        	type: 'scroll',
        	orient : 'horizontal',
	        y: 'top',
	        textStyle: {
	        	fontSize: 10,
	        	lineHeight: 5.5,
	        	padding:1,
	        },
	        data:['No. of GPs with Profile Created','No. of GPs with Approved GPDP', 'No. of GPs with Physical Progress Ongoing']//, 'No. of GPs with Geo Tagged Asset'
        
	    },
        xAxis: [
            {
                data: chartData.states,
                axisLabel: {
                    rotate: 90,
                    formatter: function (data) {
                        var text = data.trim(),
                            formatted = text.length > 12 ? text.substring(0, 12) + '...' : text;
                        return formatted;
                    },
                    fontSize: 10
                },
                axisTick: { show: false },
                boundaryGap: false
            }
        ],
        yAxis: { },
        series: [{
        	name:'No. of GPs with Profile Created',
            type: 'bar',
            data: chartData.profile,
            itemStyle: {
                normal: {
                    color:['#00bbfe']
                }
            }
        },
       
        {
        	name:'No. of GPs with Approved GPDP',
            type: 'bar',
            data: chartData.approved,
            itemStyle: {
                normal: {
                    color:['#539132']
                }
            }
        },
        {
        	name:'No. of GPs with Physical Progress Ongoing',
            type: 'bar',
            data: chartData.activity,
            itemStyle: {
                normal: {
                    color:['#f9b45e']
                }
            }
        }/*,
        {
            name:'No. of GPs with Geo Tagged Asset',
            type:'bar',
            data:chartData.geotagged,
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