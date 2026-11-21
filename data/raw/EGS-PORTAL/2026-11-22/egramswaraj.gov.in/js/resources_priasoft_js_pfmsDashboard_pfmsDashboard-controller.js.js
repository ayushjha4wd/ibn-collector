var pfmsDashboardModule = angular.module('pfmsDashboardModule', ['angular.filter']);
pfmsDashboardModule.controller("pfmsDashboardController", ['$scope', "pfmsDashboardService", function($scope, pfmsDashboardService) {
	$scope.details = {};
	
	$scope.totalPanchayatoff = 0;
	$scope.stateCode = 0;//$("input[name='stateCode']:checked").val();
	$scope.yearCheck = null;//'2019-2020'//$("input[name='yearCheck']:checked").val();
	$scope.totalPanchayat = 0;
	$scope.totalPriCount = 0;
	$scope.totalOnlinePriPv = 0;
	$scope.topFiveState = {};
	$scope.topFiveState1 = {};
	$scope.stateName = null;
	$scope.yearValue = $("#currentYear").val();
	$("#sch").removeClass("hidden");
	$scope.totalCountRealTime = 0;
	$scope.totalCountYesterday=0;
	
	$scope.tab = 1;
	var date = new Date();
	$scope.todayDate = date.getDate() + "-" + (date.getMonth() + 1) + "-" + date.getFullYear();
	var currentYear = $("#currentYear").val();
	transactionStatus(0, currentYear, $scope.tab,-1);
	function transactionStatus(stateCode, finyear, tab,schemeCode) {
		//$scope.stateCode = stateCode;
		$scope.yearCheck = finyear;
		$scope.schemeCode = schemeCode;
		pfmsDashboardService.getPFMSTransactionStatus(stateCode, finyear,schemeCode).then(function(response) {
			$scope.dscRegData = {};
			$scope.paymentStatusData = {};
			$scope.todayPaymentStatusData = {};
			$scope.vendorRegData = {};
			$scope.sectorExpData = {};
			$scope.expenditureStatus = {};
			$scope.pendingFtoBank = {};
			$scope.pendingFtoPfms = {};
			$scope.pendingVendorPfms = {};
			$scope.pendingDSCPfms = {};
			var dscReg = new dscRegDetail();
			var payStatus = new payStatusDetail();
			var todayPayStatus = new todayPayStatusDetail();
			var vendorReg = new vendorRegDetail();
			var sectorExp = new sectorExpDetail();
			var expStatus = new expStatusDetail(); 
			var ftoBank =  new pendingDetails();
			var ftoPfms = new pendingDetails();
			var vendorPfms = new pendingDetails();
			var dscPfms = new pendingDetails();
			$scope.totalPanchayat =0;
			$scope.totalPriCount =0;
			$scope.totalOnlinePriPv =0;
			expStatus.pendingAmount=0;
			

			$scope.initiatedAmountNew=0;
			$scope.approvedAmountNew =0;
				
			angular.forEach(response.data, function(obj, key) {
				if(tab == 1) {
					$scope.totalPanchayat = $scope.totalPanchayat + obj.vpRegPfms;
					$scope.totalPriCount = $scope.totalPriCount + obj.vpOnBoardPfms;
					$scope.totalOnlinePriPv = $scope.totalOnlinePriPv + obj.totalOnlinePriPv;
				}
				if(tab == 4) {
					//PerformingStatusGraph($scope.todayPaymentStatusData);
					//PerbookformingGraph($scope.todayPaymentStatusData);
					//tripleBarChart();
					//tripleBarChartamount();
				}
				if(tab == 5) {
					
				}
				
				if(tab == 2 || tab == 1) {
					
					if(tab == 2 )  {
					dscReg.totalDscReg = dscReg.totalDscReg + obj.totalDscReg;
					dscReg.dscInit = dscReg.dscInit + obj.dscInit;
					dscReg.dscApproved = dscReg.dscApproved + obj.dscApproved;
					dscReg.dscPending = dscReg.dscPending + obj.dscPending;
					dscReg.dscRejected = dscReg.dscRejected + obj.dscRejected;
					
					payStatus.totalPayInit = payStatus.totalPayInit + obj.totalPayInit;
					payStatus.paymentApp = payStatus.paymentApp + obj.paymentApp;
					payStatus.payPendingPfms = payStatus.payPendingPfms + obj.payPendingPfms;
					payStatus.payPending = payStatus.payPending + obj.payPending;
					payStatus.payRejected = payStatus.payRejected + obj.payRejected;
					
					todayPayStatus.totalPayInitToday = todayPayStatus.totalPayInitToday + obj.totalPayInitToday;
					todayPayStatus.paymentAppToday = todayPayStatus.paymentAppToday + obj.paymentAppToday;
					todayPayStatus.payPendingPfmsToday = todayPayStatus.payPendingPfmsToday + obj.payPendingPfmsToday;
					todayPayStatus.payPendingToday = todayPayStatus.payPendingToday + obj.payPendingToday;
					todayPayStatus.payRejectedToday = todayPayStatus.payRejectedToday + obj.payRejectedToday;
					
					vendorReg.totaVenReg = vendorReg.totaVenReg + obj.totaVenReg;
					vendorReg.venApproved = vendorReg.venApproved + obj.venApproved;
					vendorReg.venPending = vendorReg.venPending + obj.venPending;
					vendorReg.venRejected = vendorReg.venRejected + obj.venRejected;
					
					sectorExp.waterSupp = sectorExp.waterSupp + obj.waterSupp;
					sectorExp.saniMan = sectorExp.saniMan + obj.saniMan;
					sectorExp.sewMan = sectorExp.sewMan + obj.sewMan;
					sectorExp.stormDrain = sectorExp.stormDrain + obj.stormDrain;
					sectorExp.commAsset = sectorExp.commAsset + obj.commAsset;
					sectorExp.roads = sectorExp.roads + obj.roads;
					sectorExp.footpath = sectorExp.footpath + obj.footpath;
					sectorExp.streetLight = sectorExp.streetLight + obj.streetLight;
					sectorExp.burialGround = sectorExp.burialGround + obj.burialGround;
					sectorExp.otherBasics = sectorExp.otherBasics + obj.otherBasics;
					sectorExp.capitalExp = sectorExp.capitalExp + obj.capitalExp;
					sectorExp.totalSectorExp = parseFloat((parseFloat(sectorExp.totalSectorExp)) + ((parseFloat(obj.waterSupp)) 
							+ (parseFloat(obj.saniMan)) + (parseFloat(obj.sewMan)) + (parseFloat(obj.stormDrain)) + (parseFloat(obj.commAsset)) 
							+ (parseFloat(obj.roads)) + (parseFloat(obj.footpath)) + (parseFloat(obj.streetLight)) + (parseFloat(obj.burialGround)) 
							+ (parseFloat(obj.otherBasics)) + (parseFloat(obj.capitalExp)))).toFixed(2);
					}

					expStatus.initiatedAmount = parseFloat(parseFloat(expStatus.initiatedAmount) + parseFloat(parseFloat(obj.initiatedAmount)/10000000)).toFixed(3);
					expStatus.pendingAmount = parseFloat(parseFloat(expStatus.pendingAmount) + ((parseFloat(obj.pendingAmount)+ parseFloat(obj.amountPendingPfms))/10000000)).toFixed(3) ;
    


					expStatus.approvedAmount = parseFloat(parseFloat(expStatus.approvedAmount) + parseFloat(parseFloat(obj.approvedAmount)/10000000)).toFixed(3);
					expStatus.rejectAmount = parseFloat(parseFloat(expStatus.rejectAmount) + parseFloat(parseFloat(obj.rejectAmount)/10000000)).toFixed(3);
					
					$scope.initiatedAmountNew=parseFloat(parseFloat($scope.initiatedAmountNew) + parseFloat(parseFloat(obj.initiatedAmount)/10000000)).toFixed(3);
					$scope.approvedAmountNew =parseFloat(parseFloat($scope.approvedAmountNew) + parseFloat(parseFloat(obj.approvedAmount)/10000000)).toFixed(3);;
					
					
					
					
				}
				if(tab == 3) {
					ftoBank.day0_5 = ftoBank.day0_5 + obj.zeroToFive;
					ftoBank.day6_10 = ftoBank.day6_10 + obj.sixToTen;
					ftoBank.day11_20 = ftoBank.day11_20 + obj.eleToTw;
					ftoBank.day20_a = ftoBank.day20_a + obj.twAb;
					
					ftoPfms.day0_5 = ftoPfms.day0_5 + obj.zeroToFivePfms;
					ftoPfms.day6_10 = ftoPfms.day6_10 + obj.sixToTenPfms;
					ftoPfms.day11_20 = ftoPfms.day11_20 + obj.eleToTwPfms;
					ftoPfms.day20_a = ftoPfms.day20_a + obj.twAbPfms;
					
					vendorPfms.day0_5 = vendorPfms.day0_5 + obj.zeroToFiveVendor;
					vendorPfms.day6_10 = vendorPfms.day6_10 + obj.sixToTenVendor;
					vendorPfms.day11_20 = vendorPfms.day11_20 + obj.eleToTwVendor;
					vendorPfms.day20_a = vendorPfms.day20_a + obj.twAbVendor;
					
					dscPfms.day0_5 = dscPfms.day0_5 + obj.zeroToFiveDsc;
					dscPfms.day6_10 = dscPfms.day6_10 + obj.sixToTenDsc;
					dscPfms.day11_20 = dscPfms.day11_20 + obj.eleToTwDsc;
					dscPfms.day20_a = dscPfms.day20_a + obj.twAbDsc;
					
				}	
			});	
			
			if(tab == 1) {
				//$scope.topFiveState1();
			}
			
			if(tab == 1) {
				//$scope.topFiveState();
			}
			
			if(tab == 2) {
				$scope.dscRegData = dscReg;
				dscRegBarGraph($scope.dscRegData);
				
				$scope.paymentStatusData = payStatus;
				paymentStatusGraph($scope.paymentStatusData);
				
				$scope.todayPaymentStatusData = todayPayStatus;
				todayPaymentStatusGraph($scope.todayPaymentStatusData);
				
				$scope.vendorRegData = vendorReg;
				vendorRegPie($scope.vendorRegData);
				
				$scope.sectorExpData = sectorExp;
				sectorExpPie($scope.sectorExpData);
				
				$scope.expenditureStatus = expStatus;
				expenditureTree($scope.expenditureStatus);
				
			}
			if(tab == 3) {
				$scope.pendingFtoBank = ftoBank;
				pendingFtoBankGraph($scope.pendingFtoBank);
				
				$scope.pendingFtoPfms = ftoPfms;
				pendingFtoPfmsGraph($scope.pendingFtoPfms);
				
				$scope.pendingVendorPfms = vendorPfms;
				pendingVendorPfmsGraph($scope.pendingVendorPfms);
				
				$scope.pendingDSCPfms = dscPfms;
				pendingDSCPfmsGraph($scope.pendingDSCPfms);
			}
	    });
	}
	
	
	AlltransactionStatus(0, currentYear, $scope.tab);
	function AlltransactionStatus(stateCode, finyear, tab) {
		$scope.stateCode = stateCode;
		$scope.yearCheck = finyear;
		
		if(tab ==1) {
			stateId =-1;
			schemeCode=-1;
			year=currentYear;
		}else {
		stateId = $("input[name='stateCode']:checked").val();
		 schemeCode = $("input[name='schemeCode']:checked").val();
		year = $("input[name='yearCheck']:checked").val();
		}
		
		var finyearList=year;
		var stateCodeList=stateId;
		var schemeList=schemeCode;
		var entity_code='-1';
		var realbpcount=0;
		var realvpcount=0;
		var realzpcount=0;
		var zpCountYest=0;
		var bpCountYest =0;
		var vpCountYest =0;
		var activePRITot =0;
		var dayBookClosedTot =0;
		var monthBookClosedTot=0;
		var yearBookClosedTot =0;
		var pvCountFreezedToday=0;
		var rvCountFreezedToday =0;
		var cvCountFreezedToday =0;
		var jvCountFreezedToday =0;
		var pvCountBookedToday=0;
		var rvCountBookedToday =0;
		var cvCountBookedToday =0;
		var jvCountBookedToday =0;
		var activePRIper =0;
		var pvAmountBookedTot =0;
		var pvAmountFreezedTot =0;
		var rvAmountBookedTot =0;
		var rvAmountFreezedTot =0;
		var pvCountFreezed =0;
		var rvCountFreezed =0;
		var cvCountFreezed =0;
		var jvCountFreezed =0;
		var pvCountBooked =0;
		var rvCountBooked =0;
		var cvCountBooked = 0;
		var jvCountBooked = 0;
		var noclosedZP= 0;
		var noclosedBP= 0;
		var noclosedVP= 0;
		var noVoucherVP= 0;
		var noVoucherBP = 0;
		var noVoucherZP = 0;
		var zpTot= 0;
		var bpTot= 0;
		var vpTot= 0;
		var zpPerform= 0;
		var bpPerform= 0;
		var vpPerform= 0;
		var zpPerform2= 0;
		var bpPerform2= 0;
		var vpPerform2= 0;
		var vponboard= 0;
		var bponboard= 0;
		var zponboard= 0;
		//var = 0;
		
		
		var receiptsFund=0;
		var expenditureFund=0;
		var  obFund=0;
		
		var centerScheme=0;
		var stateScheme=0;
		var  otherResource=0;
		var  fundUtilPer=0;
		
		$scope.activePRITot=0; 	//	
		$scope.dayBookClosedTot=0; //
		$scope.monthBookClosedTot=0; //
		$scope.yearBookClosedTot=0; //
		
		$scope.pvCountFreezedToday=0; //
		$scope.rvCountFreezedToday=0; //
		$scope.cvCountFreezedToday=0; //
		$scope.jvCountFreezedToday=0; //
		
		$scope.pvCountBookedToday = 0;  //
		$scope.rvCountBookedToday = 0; //
		$scope.cvCountBookedToday = 0;  //
		$scope.jvCountBookedToday = 0; //
		
		$scope.activePRIper =0; //
		$scope.statename = ''; //
		
		$scope.pvAmountBookedTot=0; //
		$scope.pvAmountFreezedTot=0; // 
		$scope.rvAmountBookedTot=0;  //
		$scope.rvAmountFreezedTot=0; //
		
		$scope.pvCountFreezed=0; //
		$scope.rvCountFreezed=0; //
		$scope.cvCountFreezed=0; //
		$scope.jvCountFreezed=0; //
		
		$scope.pvCountBooked=0; //
		$scope.rvCountBooked=0; //
		$scope.cvCountBooked=0; //
		$scope.jvCountBooked=0; //
		
		$scope.noclosedZP=0; 
		$scope.noclosedBP=0; 
		$scope.noclosedVP=0; 
		
		$scope.noVoucherZP=0; 
		$scope.noVoucherBP=0; 
		$scope.noVoucherVP=0; 
		
		$scope.zpTot=0; 
		$scope.bpTot=0;  
		$scope.vpTot=0;
		
		$scope.zpPerform=0; 
		$scope.bpPerform=0; 
		$scope.vpPerform=0; 
	
		$scope.zpPerform2=0; 
		$scope.bpPerform2=0;  
		$scope.vpPerform2=0; 
		
		$scope.zponboard = 0; //
		$scope.bponboard =0;//
		$scope.vponboard = 0;
		$scope.totalPanchayatoff = 0;
		
		
		pfmsDashboardService.getTransactionStatus(finyearList,stateCodeList, schemeList,entity_code).then(function(response) {
			
			angular.forEach(response.data, function(obj, key) {
				
				
					$scope.totalPanchayatoff = $scope.totalPanchayatoff + obj.totalPRICount;
					
				
					angular.forEach(obj.dataBox1, function(obj1, key) {
						
						$scope.realbpcount=obj1.realbpcount; //
						$scope.realvpcount=obj1.realvpcount;//
						$scope.realzpcount=obj1.realzpcount;//
						
						$scope.totalCountRealTime = $scope.totalCountRealTime + obj1.realbpcount+obj1.realvpcount+obj1.realzpcount;	
						
						$scope.zpCountYest = obj1.todayzpcount; //
						$scope.bpCountYest = obj1.todaybpcount;//
						$scope.vpCountYest = obj1.todayvpcount;//
			     		
			     		$scope.totalCountYesterday = $scope.totalCountYesterday+$scope.zpCountYest+$scope.bpCountYest+$scope.vpCountYest;
					});	
					
					$scope.receiptsFund=0;
					$scope.expenditureFund=0;
					$scope.obFund=0;
					$scope.centerScheme=0;
					$scope.stateScheme=0;
					$scope.otherResource=0;
					
					$scope.centerexpenditureScheme=0;
					$scope.stateexpenditureScheme=0;
					$scope.otherexpenditureResource=0;
					
					
					$scope.fundUtilPer=0;
					angular.forEach(obj.fundData, function(obj2, key) {
						
						$scope.receiptsFund=parseFloat($scope.receiptsFund)+parseFloat(obj2.receipt_amount);
						$scope.expenditureFund=parseFloat($scope.expenditureFund)+parseFloat(obj2.expenditure_amount);
						$scope.obFund=parseFloat($scope.obFund)+parseFloat(obj2.ob_amount);
			     		
			     		if(obj2.scheme_category==("C")){
			     			$scope.centerScheme=parseFloat($scope.centerScheme)+parseFloat(obj2.receipt_amount)+parseFloat(obj2.ob_amount);;
			     			$scope.centerexpenditureScheme=parseFloat($scope.centerexpenditureScheme)+parseFloat(obj2.expenditure_amount);
			     		}else if(obj2.scheme_category==("S")){
			     			$scope.stateScheme = parseFloat($scope.stateScheme)+parseFloat(obj2.receipt_amount)+parseFloat(obj2.ob_amount);;
			     			$scope.stateexpenditureScheme=parseFloat($scope.stateexpenditureScheme)+parseFloat(obj2.expenditure_amount);
			     		}else if(obj2.scheme_category==("O")){
			     			$scope.otherResource = parseFloat($scope.otherResource) + parseFloat(obj2.receipt_amount)+parseFloat(obj2.ob_amount);;
			     			$scope.otherexpenditureResource=parseFloat($scope.otherexpenditureResource)+parseFloat(obj2.expenditure_amount);
			     		}
						
			     		
						
					});	
					
					
					
					if($scope.receiptsFund>0 || $scope.obFund>0){
		     			fundUtilPer=((parseFloat(($scope.expenditureFund)))/((parseFloat(($scope.receiptsFund)))+(parseFloat(($scope.obFund)))))*100;
		     			$scope.fundUtilPer = fundUtilPer.toFixed(2);
		     		}
					 google.charts.setOnLoadCallback(performanceData);
					 
					//alert($scope.fundUtilPer);
					angular.forEach(obj.dataBox1, function(obj3, key) {
					
						//$scope.stateCode = obj3.statecode; //
						$scope.activePRITot=$scope.activePRITot + obj3.activepri; 	//	
						$scope.dayBookClosedTot=$scope.dayBookClosedTot + obj3.daybookclosed; //
						$scope.monthBookClosedTot=$scope.monthBookClosedTot + obj3.monthbookclosed; //
						$scope.yearBookClosedTot=$scope.yearBookClosedTot + obj3.yearbookclosed; //
		     		
						$scope.pvCountFreezedToday=$scope.pvCountFreezedToday+obj3.today_freezedpvCount; //
						$scope.rvCountFreezedToday=$scope.rvCountFreezedToday+obj3.today_freezedrvCount; //
						$scope.cvCountFreezedToday=$scope.cvCountFreezedToday+obj3.today_freezedcvCount; //
						$scope.jvCountFreezedToday=$scope.jvCountFreezedToday+obj3.today_freezedjvCount; //
						
						$scope.pvCountBookedToday = $scope.pvCountBookedToday + obj3.today_bookedpvCount;  //
						$scope.rvCountBookedToday = $scope.rvCountBookedToday + obj3.today_bookedrvCount; //
						$scope.cvCountBookedToday = $scope.cvCountBookedToday + obj3.today_bookedcvCount;  //
						$scope.jvCountBookedToday = $scope.jvCountBookedToday + obj3.today_bookedjvCount; //
						
						$scope.activePRIper = $scope.activePRIper + obj3.activePRIper; //
						$scope.statename = obj3.statename; //
						
						$scope.pvAmountBookedTot=$scope.pvAmountBookedTot+obj3.bookedpv; //
						$scope.pvAmountFreezedTot=$scope.pvAmountFreezedTot+obj3.freezedpv; // 
						$scope.rvAmountBookedTot=$scope.rvAmountBookedTot+obj3.bookedrv;  //
						$scope.rvAmountFreezedTot=$scope.rvAmountFreezedTot+obj3.freezedrv; //
		     		
						$scope.pvCountFreezed=$scope.pvCountFreezed+obj3.freezedpvcount; //
						$scope.rvCountFreezed=$scope.rvCountFreezed+obj3.freezedrvcount; //
						$scope.cvCountFreezed=$scope.cvCountFreezed+obj3.freezedcvcount; //
						$scope.jvCountFreezed=$scope.jvCountFreezed+obj3.freezedjvcount; //
		     		
						$scope.pvCountBooked=$scope.pvCountBooked +obj3.bookedpvcount; //
						$scope.rvCountBooked=$scope.rvCountBooked +obj3.bookedrvcount; //
						$scope.cvCountBooked=$scope.cvCountBooked +obj3.bookedcvcount; //
						$scope.jvCountBooked=$scope.jvCountBooked +obj3.bookedjvcount; //
		     		
						$scope.noclosedZP=$scope.noclosedZP+obj3.not_closed_zp; 
						$scope.noclosedBP=$scope.noclosedBP+obj3.not_closed_bp; 
						$scope.noclosedVP=$scope.noclosedVP+obj3.not_closed_vp; 
						
						$scope.noVoucherZP=$scope.noVoucherZP +obj3.no_vouchers_zp; 
						$scope.noVoucherBP=$scope.noVoucherBP +obj3.no_vouchers_bp; 
						$scope.noVoucherVP=$scope.noVoucherVP +obj3.no_vouchers_vp; 
		     		
						$scope.zpTot=$scope.zpTot + obj3.total_zp; 
						$scope.bpTot=$scope.bpTot+obj3.total_bp;  
						$scope.vpTot=$scope.vpTot+obj3.total_vp;
		     		
						$scope.zpPerform=$scope.zpPerform+(obj3.total_zp -obj3.no_vouchers_zp); 
						$scope.bpPerform=$scope.bpPerform+(obj3.total_bp -obj3.no_vouchers_bp); 
						$scope.vpPerform=$scope.vpPerform+(obj3.total_vp -obj3.no_vouchers_vp); 
		    		
						$scope.zpPerform2=$scope.zpPerform2+(obj3.total_zp -obj3.not_closed_zp); 
						$scope.bpPerform2=$scope.bpPerform2+(obj3.total_bp -obj3.not_closed_bp);  
						$scope.vpPerform2=$scope.vpPerform2+(obj3.total_vp -obj3.not_closed_vp); 
						
						$scope.zponboard = $scope.zponboard + obj3.zponboard; //
						$scope.bponboard = $scope.bponboard + obj3.bponboard;//
						$scope.vponboard = $scope.vponboard + obj3.vponboard;//
						
					});
					
					// var tempstate=0;
					 var focustemp1=0;
					 var focustemp2=0;
					 var focustemp3=0;
					 var focustemp4=0;
					 var focustemp5=0;
					 var focustemp6=0;
					 var focustemp7=0;
					 var focustemp8=0;
					 var focustemp9=0;
					 var focustemp10=0;
					 var focustemp11=0;
					 var focustemp12=0;
					 var focustemp13=0;
					 var focustemp14=0;
					 var focustemp15=0;
					 var focustemp16=0;
					 var focustemp17=0;
					 var focustemp18=0;
					 var focustemp19=0;
					 var focustemp20=0;
					 var focustemp21=0;
					 var focustemp22=0;
					 var focustemp23=0;
					 var focustemp24=0;
					 var focustemp25=0;
					 var focustemp26=0;
					 var focustemp27=0;
					 var focustemp28=0;
					 var focustemp29=0;
					 var focustemp30=0;
					 var focustemp31=0;
					 var focustemp32=0;
					 var focustemp33=0;
					 
					 $scope.focus1 = 0;
					 $scope.focus2 = 0;
					 $scope.focus3 = 0;
					 $scope.focus4 = 0;
					 $scope.focus5 = 0;
					 $scope.focus6 = 0;
					 $scope.focus7 = 0;
					 $scope.focus8 = 0;
					 $scope.focus9 = 0;
					 $scope.focus10 = 0;
					 $scope.focus11 = 0;
					 $scope.focus12 = 0;
					 $scope.focus13 = 0;
					 $scope.focus14 = 0;
					 $scope.focus15 = 0;
					 $scope.focus16 = 0;
					 $scope.focus17 = 0;
					 $scope.focus18 = 0;
					 $scope.focus19 = 0;
					 $scope.focus20 = 0;
					 $scope.focus21 = 0;
					 $scope.focus22 = 0;
					 $scope.focus23 = 0;
					 $scope.focus24 = 0;
					 $scope.focus25 = 0;
					 $scope.focus26 = 0;
					 $scope.focus27 = 0;
					 $scope.focus28 = 0;
					 $scope.focus29 = 0;
					 $scope.focus30 = 0;
					 $scope.focus31 = 0;
					 $scope.focus32 = 0;
					 $scope.focus33 = 0;
					 
					 
					angular.forEach(obj.focusData, function(obj3, key) {
						
							 if(obj3.wrk_fcs_area_nm_en=='Administrative & Technical Support')
								 focustemp1= obj3.amount;
							 if(obj3.wrk_fcs_area_nm_en=='Adult and non-formal education')
								 focustemp2= obj3.amount;
							 if(obj3.wrk_fcs_area_nm_en=='Agriculture')
								 focustemp3 =obj3.amount;
							 if(obj3.wrk_fcs_area_nm_en=='Animal husbandry')
								 focustemp4 =obj3.amount;
							 if(obj3.wrk_fcs_area_nm_en=='Cultural activities')
								 focustemp5= obj3.amount;
							 if(obj3.wrk_fcs_area_nm_en=='Drinking water')
								 focustemp6 =obj3.amount;
							 if(obj3.wrk_fcs_area_nm_en=='Education')
								 focustemp7= obj3.amount;
							 if(obj3.wrk_fcs_area_nm_en=='Family welfare')
								 focustemp8= obj3.amount;
							 if(obj3.wrk_fcs_area_nm_en=='Fisheries')
								 focustemp9= obj3.amount;
							 if(obj3.wrk_fcs_area_nm_en=='Fuel and fodder')
								 focustemp10 =obj3.amount;
							 
							 if(obj3.wrk_fcs_area_nm_en=='GP Office Infrastructure')
								 focustemp11= obj3.amount;
							 if(obj3.wrk_fcs_area_nm_en=='Health')
								 focustemp12= obj3.amount;
							 if(obj3.wrk_fcs_area_nm_en=='Khadi')
								 focustemp13 =obj3.amount;
							 if(obj3.wrk_fcs_area_nm_en=='Land improvement')
								 focustemp14 =obj3.amount;
							 if(obj3.wrk_fcs_area_nm_en=='Libraries')
								 focustemp15= obj3.amount;
							 if(obj3.wrk_fcs_area_nm_en=='Maintenance of community system')
								 focustemp16 =obj3.amount;
							 if(obj3.wrk_fcs_area_nm_en=='Markets and fairs')
								 focustemp17= obj3.amount;
							 if(obj3.wrk_fcs_area_nm_en=='Minor forest produce')
								 focustemp18= obj3.amount;
							 if(obj3.wrk_fcs_area_nm_en=='Non-conventional energy sources')
								 focustemp19= obj3.amount;
							 if(obj3.wrk_fcs_area_nm_en=='Poverty allevation programme')
								 focustemp20 =obj3.amount;
							 
							 if(obj3.wrk_fcs_area_nm_en=='Public distribution system')
								 focustemp21= obj3.amount;
							 if(obj3.wrk_fcs_area_nm_en=='Roads')
								 focustemp22= obj3.amount;
							 if(obj3.wrk_fcs_area_nm_en=='Rural electrification')
								 focustemp23 =obj3.amount;
							 if(obj3.wrk_fcs_area_nm_en=='Rural housing')
								 focustemp24 =obj3.amount;
							 if(obj3.wrk_fcs_area_nm_en=='Sanitation')
								 focustemp25= obj3.amount;
							 if(obj3.wrk_fcs_area_nm_en=='Small-scale industries')
								 focustemp26 =obj3.amount;
							 if(obj3.wrk_fcs_area_nm_en=='Social forestry and farm forestry')
								 focustemp27= obj3.amount;
							 if(obj3.wrk_fcs_area_nm_en=='Social welfare')
								 focustemp28= obj3.amount;
							 if(obj3.wrk_fcs_area_nm_en=='Technical training and vocational education')
								 focustemp29= obj3.amount;
							 
							 if(obj3.wrk_fcs_area_nm_en=='Tribal Welfare')
								 focustemp30 =obj3.amount;
							 if(obj3.wrk_fcs_area_nm_en=='Water Conservation')
								 focustemp31 =obj3.amount;
							 if(obj3.wrk_fcs_area_nm_en=='Welfare of the weaker sections')
								 focustemp32 =obj3.amount;
							 if(obj3.wrk_fcs_area_nm_en=='Women and child development')
								 focustemp33 =obj3.amount;
							// ++tempstate;
							// if(tempstate == 33) {
								 $scope.focus1 = focustemp1;
								 $scope.focus2 = focustemp2;
								 $scope.focus3 = focustemp3;
								 $scope.focus4 = focustemp4;
								 $scope.focus5 = focustemp5;
								 $scope.focus6 = focustemp6;
								 $scope.focus7 = focustemp7;
								 $scope.focus8 = focustemp8;
								 $scope.focus9 = focustemp9;
								 $scope.focus10 = focustemp10;
								 $scope.focus11 = focustemp11;
								 $scope.focus12 = focustemp12;
								 $scope.focus13 = focustemp13;
								 $scope.focus14 = focustemp14;
								 $scope.focus15 = focustemp15;
								 $scope.focus16 = focustemp16;
								 $scope.focus17 = focustemp17;
								 $scope.focus18 = focustemp18;
								 $scope.focus19 = focustemp19;
								 $scope.focus20 = focustemp20;
								 $scope.focus21 = focustemp21;
								 $scope.focus22 = focustemp22;
								 $scope.focus23 = focustemp23;
								 $scope.focus24 = focustemp24;
								 $scope.focus25 = focustemp25;
								 $scope.focus26 = focustemp26;
								 $scope.focus27 = focustemp27;
								 $scope.focus28 = focustemp28;
								 $scope.focus29 = focustemp29;
								 $scope.focus30 = focustemp30;
								 $scope.focus31 = focustemp31;
								 $scope.focus32 = focustemp32;
								 $scope.focus33 = focustemp33;
								// tempstate=0;
							//}
					});
					
					
					
					 google.charts.setOnLoadCallback(drawChartVoucher); 
					  google.charts.setOnLoadCallback(drawMeter); 
					  google.charts.setOnLoadCallback(drawChartBOA);
			});	
			
			
	    });
	}
	
	
	
	$scope.topFiveState = function topFiveState() {
		$("#allStateHeader").hide();
		$("#allStateBody").hide();
		$("#topFiveHeader").show();
		$("#topFiveBody").show();
		pfmsDashboardService.getPFMSStateDashboard($scope.yearCheck).then(function(response) {
			if(response.data.length != 0){
				for (var i = 0; i < 5; i++) {
					var graphName = 'topFiveStateGraph' + (i + 1);
			        var item = [{value: response.data[i].topFive, name: response.data[i].stateName}];
			        topFiveStateChart(item, graphName);
				}
			} else {
				//alert("No data found");
			}
			
	    });
	}
	
	$scope.topFiveState1 = function topFiveStat1e() {
		$("#allStateHeader1").hide();
		$("#allStateBody1").hide();
		$("#topFiveHeader1").show();
		$("#topFiveBody1").show();
		pfmsDashboardService.getPFMSStateDashboard1($scope.yearCheck).then(function(response) {
			if(response.data.length != 0){
				for (var i = 0; i < 5; i++) {
					var graphName = 'topFivePerformingStateGraph' + (i + 1);
			        var item = [{value: response.data[i].topFive, name: response.data[i].stateName}];
			        topFiveStateChart(item, graphName);
				}
			} else {
				//alert("No data found");
			}
			
	    });
	}
	
	
	function topFiveStateChart(item, graphName) {
		 var myChart = echarts.init(document.getElementById(graphName));
	     var option = {
		    calculable : true,
		    series: [
		         {
		             name: 'Top Five States',
		             type: 'gauge',
		             detail: {
		            	 fontSize: 16,
	                	 fontWeight: 'bold',
	                	 color: '#000',
		            	 formatter: '{value}%'
		             },
		             data: item,
		             radius: '100%',
		             title:{
	                	 fontWeight: 'bold',
	                     fontSize: 14,
	                     color: '#000',
	                     offsetCenter: [0, -35]
                     },
                     pointer: {
	                	 width: 8,
	                	 color: '#000'
	                 },
	                 splitLine: {
	                	 show: true,
	                	 length: 15,
	                	 lineStyle: {
	                		color: '#000',
	                	 }		
	                 },
	                 axisTick: {
	                	 show: true,
	                	 lineStyle: {
	                		 color: '#000'
	                	 }		 
	                 },
	                 axisLine: {
	                	show: true,
	                	lineStyle: {
	                		color: [[0.65, '#f9881e'], [0.8, 'lightgreen'], [1, 'green']],
	                		width: 15,
	                		//shadowBlur: 1
	                	} 
	                 },
	                 axisLabel: {
	                	 show: true,
	                	 textStyle: { color: '#000' } 
	                 },
	                 /*itemStyle: {
	                	 borderColor: '#000',
	                	 borderWidth: '1',
	                	 borderType: 'solid',
	                 },*/
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
	} 
	
	$scope.stateBarChart = function stateBarChart() {
		$("#topFiveHeader").hide();
		$("#topFiveBody").hide();
		$("#allStateHeader").show();
		$("#allStateBody").show();
		pfmsDashboardService.getPFMSStateDashboard($scope.yearCheck).then(function(response) {
			allStateBarGraph(response.data);
	    });
	}
	
	$scope.stateBarChartall = function stateBarChartall() {
		$("#topFiveHeader1").hide();
		$("#topFiveBody1").hide();
		$("#allStateHeader1").show();
		$("#allStateBody1").show();
		pfmsDashboardService.getPFMSStateDashboard($scope.yearCheck).then(function(response) {
			allStateBarGraph(response.data);
	    });
	}
	
	
	
	
	function allStateBarGraph(data) {
		 var name = [];
		 var count = [];
		 var j = data.length;
		 for (var i = j-1; i >= 0; i--) {
			 var item = data[i].stateName;
		     name.push(item);
		     var n = data[i].topFive;
		     count.push(n);
	     }
		 var myChart = echarts.init(document.getElementById('allStateBarGraph'));
	     var option = {
    		 calculable : true,
    		 tooltip: {
    			trigger: 'item',
 		    	formatter: "<b>{b}</b><br/>Adoption% : <b>{c}%</b>"
    		 },
    		 grid: {
	            containLabel: true,
	            top : 20,
 		        bottom : 5,
 		        left : 5,
 		        right : 15
    		 },
    		 xAxis : [{
            	type : 'value',
	        	axisTick: {show:false},
	         }],
    		 yAxis: [{ 
	        	 type: 'category',
	        	 data: name,
	        	 axisLabel: {
 	            	fontSize: 11
	        	 },
	        	 axisTick: {show:true},
	         }],   
    		 series: [{
    			 name:'',
    			 type: 'bar',
    			 data: count
    			
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
	
	function dscRegBarGraph(data) {
		 var myChart = echarts.init(document.getElementById('dscRegistrationGraph'));
	     var option = {
	   		 calculable : true,
	   		 tooltip: {
	   			trigger: 'item',
		    	formatter: "<b>{b}<br/>{c}</b>"
	   		 },
	   		 grid: {
	   			containLabel : true,
 		        top : 45,
 		        bottom : 5,
 		        left : 5,
 		        right : 5
	   		 },
	   		 xAxis : [{
	            type : 'category',
	            axisTick: {show:false},
	            boundaryGap : true,
	            data: ['Registered', 'Initiated', 'Approved', 'Pending', 'Rejected'],
	            axisLabel: {
	            	fontSize: 10
	            },
	            barGap: '40%'
	   		 }],
	   		 yAxis: [{
	   			name: 'Count',
	   			type: 'value'
	   		 }],    
	   		 series : [{	
	            type:'bar',
	            data: [data.totalDscReg, data.dscInit, data.dscApproved, data.dscPending, data.dscRejected],
	            itemStyle: {
	            	normal: {
	            		color: function (data) {
            			  var colorList = ['#3c8dbc', 'Yellow', 'Green', '#f9881e', '#FE8463'];
              			  return colorList[data.dataIndex]
    				    },
    				    label:{color:"black", show:true}
	            	}
	            }
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
	
	function paymentStatusGraph(data) {
		 var myChart = echarts.init(document.getElementById('paymentStatusGraph'));
	     var option = {
	   		 calculable : true,
	   		 tooltip: {
	   			trigger: 'item',
		    	formatter: "<b>{b}<br/>{c}</b>"
	   		 },
	   		 grid: {
	   			containLabel : true,
		        top : 45,
		        bottom : 5,
		        left : 5,
		        right : 5
	   		 },
	   		 xAxis : [{
	            type : 'category',
	            axisTick: {show:false},
	            boundaryGap : true,
	            data: ['Initiated', 'Approved', 'Pending at PFMS', 'Pending at Bank', 'Rejected'],
	            axisLabel: {
	            	formatter: function (data) {
 					    var text = data,
 						    formatted = text.length > 9 ? text.substring(0, 8) + '\n' + text.substring(8, text.length) : text;
                         return formatted;
 				    },
	            	fontSize: 11
	            },
	            barGap: '40%'
	   		 }],
	   		 yAxis: [{
	   			name: 'Count',
	   			type: 'value'
	   		 }],    
	   		 series : [{	
	            type:'bar',
	            data: [data.totalPayInit, data.paymentApp, data.payPendingPfms, data.payPending, data.payRejected],
	            itemStyle: {
	            	normal: {
	            		color: function (data) {
           			  var colorList = ['Yellow', 'Green', '#f9881e', '#3c8dbc', '#FE8463'];
             			  return colorList[data.dataIndex]
   				    },
   				    label:{color:"black", show:true}
	            	}
	            }
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
	
	function PerformingStatusGraph(data) {
		 var myChart = echarts.init(document.getElementById('PerformingGraph'));
	     var option = {
	   		 calculable : true,
	   		 tooltip: {
	   			trigger: 'item',
		    	formatter: "<b>{b}<br/>{c}</b>"
	   		 },
	   		 grid: {
	   			containLabel : true,
		        top : 45,
		        bottom : 5,
		        left : 5,
		        right : 5
	   		 },
	   		 xAxis : [{
	            type : 'category',
	            axisTick: {show:false},
	            boundaryGap : true,
	            data: ['TotalZP', 'Performing', 'Non-Performing '],
	            axisLabel: {
	            	formatter: function (data) {
					    var text = data,
						    formatted = text.length > 9 ? text.substring(0, 8) + '\n' + text.substring(8, text.length) : text;
                        return formatted;
				    },
	            	fontSize: 11
	            },
	            barGap: '40%'
	   		 }],
	   		 yAxis: [{
	   			name: 'Count',
	   			type: 'value'
	   		 }],    
	   		 series : [{	
	            type:'bar',
	            data: [626, 204, 422],
	            itemStyle: {
	            	normal: {
	            		color: function (data) {
          			  var colorList = ['Yellow', 'Green', '#f9881e'];
            			  return colorList[data.dataIndex]
  				    },
  				    label:{color:"black", show:true}
	            	}
	            }
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
	
	function PerbookformingGraph(data) {
		 var myChart = echarts.init(document.getElementById('PerbookformingGraph'));
	     var option = {
	   		 calculable : true,
	   		 tooltip: {
	   			trigger: 'item',
		    	formatter: "<b>{b}<br/>{c}</b>"
	   		 },
	   		 grid: {
	   			containLabel : true,
		        top : 45,
		        bottom : 5,
		        left : 5,
		        right : 5
	   		 },
	   		 xAxis : [{
	            type : 'category',
	            axisTick: {show:false},
	            boundaryGap : true,
	            data: ['TotalZP', 'Performing', 'Non-Performing '],
	            axisLabel: {
	            	formatter: function (data) {
					    var text = data,
						    formatted = text.length > 9 ? text.substring(0, 8) + '\n' + text.substring(8, text.length) : text;
                       return formatted;
				    },
	            	fontSize: 11
	            },
	            barGap: '40%'
	   		 }],
	   		 yAxis: [{
	   			name: 'Count',
	   			type: 'value'
	   		 }],    
	   		 series : [{	
	            type:'bar',
	            data: [626, 99, 527],
	            itemStyle: {
	            	normal: {
	            		color: function (data) {
         			  var colorList = ['Yellow', 'Green', '#f9881e'];
           			  return colorList[data.dataIndex]
 				    },
 				    label:{color:"black", show:true}
	            	}
	            }
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
	
	function todayPaymentStatusGraph(data) {
		 var myChart = echarts.init(document.getElementById('todayPaymentStatusGraph'));
	     var option = {
	   		 calculable : true,
	   		 tooltip: {
	   			trigger: 'item',
		    	formatter: "<b>{b}<br/>{c}</b>"
	   		 },
	   		 grid: {
	   			containLabel : true,
		        top : 45,
		        bottom : 5,
		        left : 5,
		        right : 5
	   		 },
	   		 xAxis : [{
	            type : 'category',
	            axisTick: {show:false},
	            boundaryGap : true,
	            data: ['Initiated', 'Approved', 'Pending at PFMS', 'Pending at Bank', 'Rejected'],
	            axisLabel: {
	            	formatter: function (data) {
					    var text = data,
						    formatted = text.length > 9 ? text.substring(0, 8) + '\n' + text.substring(8, text.length) : text;
                        return formatted;
				    },
	            	fontSize: 11
	            },
	            barGap: '40%'
	   		 }],
	   		 yAxis: [{
	   			name: 'Count',
	   			type: 'value'
	   		 }],    
	   		 series : [{	
	            type:'bar',
	            data: [data.totalPayInitToday, data.paymentAppToday, data.payPendingPfmsToday, data.payPendingToday, data.payRejectedToday],
	            itemStyle: {
	            	normal: {
	            		color: function (data) {
	            			var colorList = ['Yellow', 'Green', '#f9881e', '#3c8dbc', '#FE8463'];
            			  return colorList[data.dataIndex]
	            		},
  				    label:{color:"black", show:true}
	            	}
	            }
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
	
	function vendorRegPie(data) {
		 var myChart = echarts.init(document.getElementById('vendorRegistrationGraph'));
	     var option = {
 		    tooltip : {
 		        trigger: 'item',
 		        formatter: "{b}<br/><b>{c} ({d}%)</b>",
 		        fontSize: 10,
 		    },
 		    legend: {
 		        orient : 'vertical',
 		        y: 'top',
 		        x: 'left',
 		        //right: 15,
 		        data: ["Approved", "Pending", "Rejected"]
 		    },
 		    calculable : true,
 		    itemStyle: {
	           	normal: {
	           		color: function (data) {
	           			var colorList = ['Green', '#f9881e', '#DE3812'];
	           			return colorList[data.dataIndex]
	           		},
	           		borderColor: '#ffffff',
	           	},
 		   	},
      		//top: 40,
 		    series : [
 		        {
 		        	type: 'pie',
 		            radius : ['50%', '70%'],
 		            center: ['60%', '55%'],
 		            data: [
	                   {name: "Approved", value: data.venApproved},
	                   {name: "Pending", value: data.venPending},
	                   {name: "Rejected", value: data.venRejected},
                    ],
					itemStyle: {
					normal: {
						color: function (data) {
							var colorList = ['Green', '#f9881e', '#DE3812'];
							return colorList[data.dataIndex]
						},
						borderColor: '#ffffff',
					},
				},
		    	    labelLine: {
		               show: true
		            },
		            animation: false,
		            avoidLabelOverlap: true,
		            label:{
				   		formatter: '{d}%',
				   		//position: 'outside',
		            },
		           hoverAnimation:  false,
		           emphasis: {
		               label: {
		                   show: false,
		               }
		           },
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
	}
	
	function sectorExpPie(data) {
		 var myChart = echarts.init(document.getElementById('sectorExpGraph'));
	     var option = {
		    tooltip : {
		        trigger: 'item',
		        formatter: "{b} <br/> <b>{c} ({d}%)</b>"
		    },
		    legend: {
		    	type: 'scroll',
		        orient: 'vertical',
		        y: 'top',
 		        x: 'left',
		        data: [
	               "Water Supply", "Sanitation include septage Management", "Schewage and Soild Waste Management", "Storm Water Drainage",
	               "Construction/ Maintenance of Community Assets", "Construction/ Maintenance of Roads", 
	               "Construction/ Maintenance of Footpaths", "Construction/ Maintenance of Streetlighting", 
	               "Construction/ Maintenance of Cremation/Burial Grounds", "Other Basic Services", 
	               "Technical Admin Component of O&M and Capital Expenditure"
		        ],
		        formatter: function (data) {
				    var text = data;
				    formatted = text.replace(/\s/g, "\n");
                 return formatted;
			    },
		        itemGap: 1,
		        itemWidth: 10,
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
		    calculable : true,
		    series : [
		        {
		        	type: 'pie',
		            radius : '60%',
		            center: ['65%', '55%'],
		            //minAngle: 1,
			        minShowLabelAngle: 1,
			        //stillShowZeroSum: false,
		            data: [
	                   {name: "Water Supply", value: data.waterSupp},
	                   {name: "Sanitation include septage Management", value: data.saniMan},
	                   {name: "Schewage and Soild Waste Management", value: data.sewMan},
	                   {name: "Storm Water Drainage", value: data.stormDrain},
	                   {name: "Construction/ Maintenance of Community Assets", value: data.commAsset},
	                   {name: "Construction/ Maintenance of Roads", value: data.roads},
	                   {name: "Construction/ Maintenance of Footpaths", value: data.footpath},
	                   {name: "Construction/ Maintenance of Streetlighting", value: data.streetLight},
	                   {name: "Construction/ Maintenance of Cremation/Burial Grounds", value: data.burialGround},
	                   {name: "Other Basic Services", value: data.otherBasics},
	                   {name: "Technical Admin Component of O&M and Capital Expenditure", value: data.capitalExp},
                   ],
                   labelLine: {
		               show: true
		           },
		           animation: false,
		           avoidLabelOverlap: true,
		           label:{
				   		formatter: '{d}%',
				   		position: 'outside',
		           },
		           hoverAnimation:  false,
		           emphasis: {
		               label: {
		                   show: false,
		               }
		           },
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
	}
	
	function expenditureTree(data) {
		 var details = {
			 "name": "Payment Initiated \n " + data.initiatedAmount +" Cr.",
		 	 "children": [
		 		 {"name": "Payment Approved \n " + data.approvedAmount+" Cr."},
		 		 {"name": "Payment Pending \n" + data.pendingAmount+" Cr."},
		 		 {"name": "Payment Rejected \n " + data.rejectAmount+" Cr."}
			 ]
		 }
		 var myChart = echarts.init(document.getElementById('expenditureStatusGraph'));
	     var option = {
		 	/*tooltip: {
		        trigger: 'item',
		    },*/
		    series: [{
	            type: 'tree',
	            data: [details],
	            top: '10%',
	            left: '0%',
	            bottom: '5%',
	            right: '5%',
	    		symbol: 'rect',
	            symbolSize: [130, 50],
	    		orient:"TB",
	    		width:'100%',
	    		height:'150px',
	            label: {
	                //position: 'center',
	                verticalAlign: 'middle',
	                align: 'center',
	                textStyle: {
	                    fontSize: 11,
	                    //fontWeight: 'bold',
	                    fontStyle: 'italic'
	                },
	                color: '#000',
	                formatter: details.name,
	            },
	            symbolOffset:[0, '20%'],
            	leaves: {
	                label: {
	                    //position: 'right',
	                    verticalAlign: 'middle',
	                    align: 'center',
	                    formatter: details,
	                    color: '#000'
	                }
	            },
	            itemStyle: {
		           	normal: {
		           		color: function (data) {
		           			var colorList = ['', 'Yellow', 'Green', '#3c8dbc', '#f9881e'];
		           			return colorList[data.dataIndex]
		           		},
		           		borderColor: '#ffffff',
		           	},
	 		   	},
	            expandAndCollapse: false,
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
	//pendingFtoBankGraph($scope.pendingFtoBank);
	//pendingFtoPfmsGraph($scope.pendingFtoPfms);
	//pendingVendorPfmsGraph($scope.pendingVendorPfms);
	function pendingFtoBankGraph(data) {
		 var myChart = echarts.init(document.getElementById('pendingFtoBankGraph'));
	     var option = {
	   		 calculable : true,
	   		 tooltip: {
	   			trigger: 'item',
		    	formatter: "<b>{b}<br/>{c}</b>"
	   		 },
	   		 grid: {
	   			containLabel : true,
		        top : 45,
		        bottom : 5,
		        left : 5,
		        right : 5
	   		 },
	   		 xAxis : [{
	            type : 'category',
	            axisTick: {show:false},
	            boundaryGap : true,
	            data: ['0-3 Days', '4-7 Days', '8-10 Days', '> 10  Days'],
	            axisLabel: {
	            	fontSize: 11
	            },
	            barGap: '40%'
	   		 }],
	   		 yAxis: [{
	   			name: 'Count',
	   			type: 'value'
	   		 }],    
	   		 series : [{	
	            type:'bar',
	            data: [data.day0_5, data.day6_10, data.day11_20, data.day20_a],
	            itemStyle: {
	            	normal: {
	            		color: function (data) {
	            			var colorList = ['Yellow', 'Green', '#f9881e', '#3c8dbc'];
           			  return colorList[data.dataIndex]
	            		},
 				    label:{color:"black", show:true}
	            	}
	            }
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
	
	function pendingFtoPfmsGraph(data) {
		 var myChart = echarts.init(document.getElementById('pendingFtoPfmsGraph'));
	     var option = {
	   		 calculable : true,
	   		 tooltip: {
	   			trigger: 'item',
		    	formatter: "<b>{b}<br/>{c}</b>"
	   		 },
	   		 grid: {
	   			containLabel : true,
		        top : 45,
		        bottom : 5,
		        left : 5,
		        right : 5
	   		 },
	   		 xAxis : [{
	            type : 'category',
	            axisTick: {show:false},
	            boundaryGap : true,
	            data: ['0-3 Days', '4-7 Days', '8-10 Days', '> 10  Days'],
	            axisLabel: {
	            	fontSize: 11
	            },
	            barGap: '40%'
	   		 }],
	   		 yAxis: [{
	   			name: 'Count',
	   			type: 'value'
	   		 }],    
	   		 series : [{	
	            type:'bar',
	            data: [data.day0_5, data.day6_10, data.day11_20, data.day20_a],
	            itemStyle: {
	            	normal: {
	            		color: function (data) {
	            			var colorList = ['Yellow', 'Green', '#f9881e', '#3c8dbc'];
          			  return colorList[data.dataIndex]
	            		},
				    label:{color:"black", show:true}
	            	}
	            }
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
	
	function pendingVendorPfmsGraph(data) {
		 var myChart = echarts.init(document.getElementById('pendingVendorPfmsGraph'));
	     var option = {
	   		 calculable : true,
	   		 tooltip: {
	   			trigger: 'item',
		    	formatter: "<b>{b}<br/>{c}</b>"
	   		 },
	   		 grid: {
	   			containLabel : true,
		        top : 45,
		        bottom : 5,
		        left : 5,
		        right : 5
	   		 },
	   		 xAxis : [{
	            type : 'category',
	            axisTick: {show:false},
	            boundaryGap : true,
	            data: ['0-3 Days', '4-7 Days', '8-10 Days', '> 10  Days'],
	            axisLabel: {
	            	fontSize: 11
	            },
	            barGap: '40%'
	   		 }],
	   		 yAxis: [{
	   			name: 'Count',
	   			type: 'value'
	   		 }],    
	   		 series : [{	
	            type:'bar',
	            data: [data.day0_5, data.day6_10, data.day11_20, data.day20_a],
	            itemStyle: {
	            	normal: {
	            		color: function (data) {
	            			var colorList = ['Yellow', 'Green', '#f9881e', '#3c8dbc'];
          			  return colorList[data.dataIndex]
	            		},
				    label:{color:"black", show:true}
	            	}
	            }
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
	
	function pendingDSCPfmsGraph(data) {
		 var myChart = echarts.init(document.getElementById('pendingDSCPfmsGraph'));
	     var option = {
	   		 calculable : true,
	   		 tooltip: {
	   			trigger: 'item',
		    	formatter: "<b>{b}<br/>{c}</b>"
	   		 },
	   		 grid: {
	   			containLabel : true,
		        top : 45,
		        bottom : 5,
		        left : 5,
		        right : 5
	   		 },
	   		 xAxis : [{
	            type : 'category',
	            axisTick: {show:false},
	            boundaryGap : true,
	            data: ['0-3 Days', '4-7 Days', '8-10 Days', '> 10  Days'],
	            axisLabel: {
	            	fontSize: 11
	            },
	            barGap: '40%'
	   		 }],
	   		 yAxis: [{
	   			name: 'Count',
	   			type: 'value'
	   		 }],    
	   		 series : [{	
	            type:'bar',
	            data: [data.day0_5, data.day6_10, data.day11_20, data.day20_a],
	            itemStyle: {
	            	normal: {
	            		color: function (data) {
	            			var colorList = ['Yellow', 'Green', '#f9881e', '#3c8dbc'];
        			  return colorList[data.dataIndex]
	            		},
				    label:{color:"black", show:true}
	            	}
	            }
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
	$scope.submitFilter =  function submitFilter() {
		var stateId = $("input[name='stateCode']:checked").val();
		var year = $("input[name='yearCheck']:checked").val();
		var schemeCode = $("input[name='schemeCode']:checked").val();
		
		$scope.stateName = $("input[name='stateCode']:checked").parent('label').text().trim();
		if(stateId == 0) {
			$scope.stateName = $scope.stateName + " STATE DATA"
		}
		$scope.yearValue = $("input[name='yearCheck']:checked").parent('label').text().trim();
		if($("#liHome").hasClass("active")) {
			$scope.tab = 1;
			stateId = 0;
			//year = currentYear;
			schemeCode='-1';
		}
		if($("#liData").hasClass("active")) {
			$scope.tab = 2;
		}
		if($("#liPerformance").hasClass("active")) {
			$scope.tab = 3;
		}
		if($("#liPerformance").hasClass("active")) {
			$scope.tab = 3;
		}
		
		if($("#liData1").hasClass("active")) {
			$scope.tab = 4;
		}
		if($("#liPerformance1").hasClass("active")) {
			$scope.tab = 5;
		}
		
		if (isNaN(stateId)) {
			
			stateId =0;
		}
		if($scope.tab==2 || $scope.tab==3) {
		transactionStatus(stateId, year, $scope.tab,schemeCode);
		}
		if($scope.tab==4 || $scope.tab==5) {
		AlltransactionStatus(0, year, $scope.tab);
		}
	}
	
	$scope.showFilter = function showFilter(val) {
		var stateId;
		var year;
		var schemeCode;
		$scope.tab = val;
		$("#sch").removeClass("hidden");
		if(val == 1) {
			$("#full-page").addClass("col-12").removeClass("col-9");
			$("#filters").removeClass("show in");
			$("#togglebtn").addClass("d-none");
			$(".nav-home").attr("id","").attr("data-ng-click","showFilter("+val+")");
			stateId = "0";
			year = $("input[name='yearCheck']:checked").val();
			schemeCode='-1';
		} else if(val==4) {
			

			$("#full-page").removeClass("col-12").addClass("col-9");
			$("#filters").addClass("show in");
			$("#sch").addClass("hidden");
			$("#togglebtn").removeClass("d-none");
			$(".nav-home").attr("id","filter-on").attr("data-ng-click","showFilter("+val+")");
			stateId = $("input[name='stateCode']:checked").val();
			 schemeCode = -1;
			year = $("input[name='yearCheck']:checked").val();
			$scope.stateName = $("input[name='stateCode']:checked").parent('label').text().trim();
			if(stateId == "0") {
				$scope.stateName = $scope.stateName + " STATE DATA"
			}
			if(isNaN(stateId)==true)
				stateId=0;
			$scope.yearValue = $("input[name='yearCheck']:checked").parent('label').text().trim();
			
		} else {
			$("#full-page").removeClass("col-12").addClass("col-9");
			$("#filters").addClass("show in");
			$("#togglebtn").removeClass("d-none");
			$(".nav-home").attr("id","filter-on").attr("data-ng-click","showFilter("+val+")");
			stateId = $("input[name='stateCode']:checked").val();
			 schemeCode = $("input[name='schemeCode']:checked").val();
			year = $("input[name='yearCheck']:checked").val();
			$scope.stateName = $("input[name='stateCode']:checked").parent('label').text().trim();
			if(stateId == "0") {
				$scope.stateName = $scope.stateName + " STATE DATA"
			}
			if(isNaN(stateId)==true)
				stateId=0;
			$scope.yearValue = $("input[name='yearCheck']:checked").parent('label').text().trim();
		}
		if (isNaN(stateId)) {
			
			stateId =0;
		}
		
		if (isNaN(schemeCode)) {
			
			schemeCode =-1;
		}

		var SchemeType='O';
		if(val==2 || val==3) {
			 SchemeType='O';
		}else {
			 SchemeType='T';
			
		}
		getSchemes(stateId,SchemeType,year);
		
		transactionStatus(stateId, year, val,schemeCode);
	}
	$scope.fullpage = function fullpage(stateId, year){
		$("#full-page").toggleClass("col-12");
		$("#filters").toggleClass("show in");
		transactionStatus(stateId, year, $scope.tab);
	}
	
	
function tripleBarChart() {	 
	 var dom = document.getElementById("VoucherCountstatistics");
	 var myChart = echarts.init(dom);
	 var app = {};
	 //option = null;
	 var option = {
	     legend: {},
	     tooltip: {},
	     dataset: {
	         source: [
	             ['product', '2015', '2016', '2017'],
	             ['Matcha Latte', 43.3, 85.8, 93.7],
	             ['Milk Tea', 83.1, 73.4, 55.1],
	             ['Cheese Cocoa', 86.4, 65.2, 82.5],
	             ['Walnut Brownie', 72.4, 53.9, 39.1]
	         ]
	     },
	     xAxis: {type: 'category'},
	     yAxis: {},
	     // Declare several bar series, each will be mapped
	     // to a column of dataset.source by default.
	     series: [
	         {type: 'bar'},
	         {type: 'bar'},
	         {type: 'bar'}
	     ]
	 };
	 ;
	 if (option && typeof option === "object") {
	     myChart.setOption(option, true);
	 }
	       
}


$scope.getSchemeDetails = function getSchemeDetails(){
	
	
	
	
	var stateId = $("input[name='stateCode']:checked").val();
	
	var finyear = $("input[name='yearCheck']:checked").val();
	
	if (isNaN(stateId)) {
		
		stateId =0;
	}
	
	var val=$scope.tab;
	
	var SchemeType='O';
	if(val==2 || val==3) {
		 SchemeType='O';
	}else {
		 SchemeType='T';
		
	}
	
	
	getSchemes(stateId,SchemeType,finyear);
}

function getSchemes(stateId,SchemeType,finyear) {
	
	$scope.details =null;
	$scope.data =null;
	
	pfmsDashboardService.getSchemeDetails(stateId,SchemeType,finyear).then(function(response) {
		$scope.data = response.data;
		var i=0;
		var schemeDetail = new Array();
		angular.forEach($scope.data, function(obj, key) {
			var scheme = new schemeDetails();
				scheme.schemeid = obj.schemeid;
				scheme.schemeName = obj.resourcedesc;
				scheme.schemeCat = obj.scheme_category;
				scheme.schemeAbb = obj.schemename_abbreviation;
				scheme.id=++i;
				schemeDetail.push(scheme);
			
		
		});	
		$scope.details = schemeDetail;
		
		
		//var schemeCode=document.getElementById("schemeCode").value
		
		
		//$scope.ownscheme =schemeCode;
		
		
    });
}

function tripleBarChartamount() {	 
	var dom = document.getElementById("VoucherCountstatisticsAmount");
	var myChart = echarts.init(dom);
	var app = {};
	option = null;
	option = {
	    legend: {},
	    tooltip: {},
	    dataset: {
	        dimensions: ['product', '2015', '2016', '2017'],
	        source: [
	            {product: 'Matcha Latte', '2015': 43.3, '2016': 85.8, '2017': 93.7},
	            {product: 'Milk Tea', '2015': 83.1, '2016': 73.4, '2017': 55.1},
	            {product: 'Cheese Cocoa', '2015': 86.4, '2016': 65.2, '2017': 82.5},
	            {product: 'Walnut Brownie', '2015': 72.4, '2016': 53.9, '2017': 39.1}
	        ]
	    },
	    xAxis: {type: 'category'},
	    yAxis: {},
	    // Declare several bar series, each will be mapped
	    // to a column of dataset.source by default.
	    series: [
	        {type: 'bar'},
	        {type: 'bar'},
	        {type: 'bar'}
	    ]
	};
	;
	if (option && typeof option === "object") {
	    myChart.setOption(option, true);
	}
	       
}	

$scope.SearchResultType = function SearchResultType(rType){
	 if(rType == "till")  {
		 $("#datesRangeDiv2").removeClass("hidden");
		 $("#datesRangeDiv1").addClass("hidden");
	 }else{
		 $("#datesRangeDiv1").removeClass("hidden");
		 $("#datesRangeDiv2").removeClass("hidden");
	 }
  }
	        
}]);





