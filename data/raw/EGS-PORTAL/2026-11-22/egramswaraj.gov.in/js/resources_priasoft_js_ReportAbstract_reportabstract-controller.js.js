var reportabstractModule = angular.module('reportabstractModule', ['angular.filter']);
reportabstractModule.controller("reportabstractController", ['$scope','$sce', "reportabstractService", function($scope,$sce,reportabstractService) {
$scope.details = {};
$scope.district = {};
$scope.block = {};
$scope.allvillage = {};
$scope.districtLine = {};
$scope.blockline = {};
$scope.schemeList = {};
$scope.habitationwisePopulation={};
$scope.grampanchayatid = null;
$scope.finyear = null;
$scope.StateId = null;
$scope.levelflag = null;
$scope.localbodycodeid = null;
$scope.displayFlagId = null;
$scope.levelflagId = null;
$scope.secondlevelflagId = null;
$scope.DistrictselectId = null;
$scope.BlockselectId = null;

$scope.reportType = null;
							
							

$scope.clearSelections = function clearSelections() {
$scope.details = {};
$scope.district = {};
$scope.block = {};
$scope.allvillage = {};
$scope.districtLine = {};
$scope.blockline = {};

$scope.localbodycodeid = null;
$scope.displayFlagId = null;
$scope.levelflagId = null;
$scope.secondlevelflagId = null;
$scope.DistrictselectId = null;
$scope.BlockselectId = null;
$scope.StateId = null;
$scope.ModelName = null;
$scope.schemeChildDetails = null;
$scope.DestrictDetails = null;
$scope.BlockDetailss = null;
$scope.villagecode = null;
$scope.districtLinedep = null;
$scope.blockLinedep = null;

$scope.schemeList = {};

/*$("#AcountUnitId").addClass("hidden");
$("#DistrictId").addClass("hidden");
$("#BlockId").addClass("hidden");
$("#villageId").addClass("hidden");
$("#BlockLineId").addClass("hidden");
$("#districtLinedepId").addClass("hidden");*/



}

$scope.statedetails = function statedetails(ModelName)  {
$("#State_error").hide();
$scope.details = {};
$scope.district = {};
$scope.block = {};
$scope.allvillage = {};
$scope.districtLine = {};
$scope.blockline = {};

$scope.localbodycodeid = null;
$scope.displayFlagId = null;
$scope.levelflagId = null;
$scope.secondlevelflagId = null;
$scope.DistrictselectId = null;
$scope.BlockselectId = null;
$scope.schemeChildDetails = null;
$scope.DestrictDetails = null;
$scope.BlockDetailss = null;
$scope.villagecode = null;
$scope.districtLinedep = null;
$scope.blockLinedep = null;

$scope.finyear = document.getElementById("yearid").value;
if($scope.finyear == null || $scope.finyear == "") {
$scope.finyear = null;
$scope.ModelName = null;
alert("Please Select Financial Year");
return false;
} else {
$("#AcountUnitId").addClass("hidden");
$("#DistrictId").addClass("hidden");
$("#BlockId").addClass("hidden");
$("#villageId").addClass("hidden");
$("#BlockLineId").addClass("hidden");
$("#districtLinedepId").addClass("hidden");
$scope.StateId = ModelName;
getStateTier();
getAccountDetails($scope.StateId, $scope.finyear);
accountdetails("3");
}
}
function getStateTier(){
$scope.stateTier = null;
reportabstractService.getStateTier($scope.StateId).then(function(response){
$scope.stateTier = response.data;
});
}
function getAccountDetails(statecode, finyear) {
	$scope.localbodycodeid = "1,2,3";
$("#AcountUnitId").removeClass("hidden");
$("#DistrictId").addClass("hidden");
$("#BlockId").addClass("hidden");
$("#villageId").addClass("hidden");
$("#BlockLineId").addClass("hidden");
$("#districtLinedepId").addClass("hidden");
$scope.details = {};
var accountunit = null;
$scope.localbodycodeid = null;
reportabstractService.getAccountDetails(statecode, finyear).then(function(response) {
$scope.details = response.data;
var localbodyCode = null;
for(var i=0; i< $scope.details.length;i++) {
  accountunit = $scope.details[i].localBodyCode;
  if(localbodyCode != null) {
  localbodyCode = localbodyCode + "," + accountunit
  } else {
  localbodyCode = accountunit;
  }
}
$scope.localbodycodeid = localbodyCode;
   });
}



function accountdetails(accountdetail) {
$scope.displayFlagId = null;
$scope.levelflagId = null;
$scope.secondlevelflagId = null;
$scope.DistrictselectId = null;
$scope.BlockselectId = null;
$scope.DestrictDetails = null;
$scope.BlockDetailss = null;
$scope.villagecode = null;
$scope.districtLinedep = null;
$scope.blockLinedep = null;

$scope.district = {};
$scope.block = {};
$scope.allvillage = {};
$scope.districtLine = {};
$scope.blockline = {};
$scope.schemeList = {};

$scope.levelflag = accountdetail;

 $("#DistrictId").addClass("hidden");
 $("#BlockId").addClass("hidden");
 $("#villageId").addClass("hidden");
 $("#BlockLineId").addClass("hidden");
 $("#districtLinedepId").addClass("hidden");


if (angular.equals($scope.StateId, "17") == true
&& (angular.equals(accountdetail, "23") == true || angular
.equals(accountdetail, "22") == true)) {

alert("Block Data is not available!!");
return false;

}
if (angular.equals($scope.localbodycodeid, "3")
|| angular
.equals($scope.localbodycodeid,
"1,2,3")
|| angular.equals(
$scope.localbodycodeid,
"1,2,3,11")
|| angular.equals(
$scope.localbodycodeid,
"1,2,14,3,11")
|| angular.equals(
$scope.localbodycodeid,
"10,23,22")
|| angular.equals(
$scope.localbodycodeid, "11")
|| angular.equals(
$scope.localbodycodeid,
"1,3,10,17")
|| angular.equals(
$scope.localbodycodeid, "12")
|| angular.equals(
$scope.localbodycodeid,
"1,2,3,20,20,21,10,18,15,16")
|| angular.equals(
$scope.localbodycodeid,
"1,2,14,3,11,13")
|| angular.equals(
$scope.localbodycodeid,
"1,2,3,11,19")
|| angular.equals(
$scope.localbodycodeid,
"1,2,3,11,19")
|| angular.equals(
$scope.localbodycodeid,
"1,2,3,20")
|| angular.equals(
$scope.localbodycodeid,
"1,2,3,20,21,10,18,15,16")) {
$scope.displayFlagId = "A";
ParentwiselbList($scope.displayFlagId,
accountdetail);
} else if (angular.equals(
$scope.localbodycodeid, "1,3")) {
$scope.displayFlagId = "ZG";
ParentwiselbList($scope.displayFlagId,
accountdetail);
} else if (angular.equals(
$scope.localbodycodeid, "1,2")) {
$scope.displayFlagId = "ZI";
ParentwiselbList($scope.displayFlagId,
accountdetail);
} else if (angular.equals(
$scope.localbodycodeid, "2,3")) {
$scope.displayFlagId = "IG";
$("#DistrictId").addClass("hidden");
getBlockList();

} else if (angular.equals(
$scope.localbodycodeid, "3")) {
$scope.displayFlagId = "GP";
getVillageList();
} else if ($scope.localbodycodeid = "11") {
$scope.displayFlagId = "GP";
getVillageList();
}
 if(angular.equals($scope.localbodycodeid,
"1,2,3,20,21,10,18,15,16")) {
 $scope.displayFlagId = "AB";
 ParentwiselbList($scope.displayFlagId,
 accountdetail);
}

}

   $scope.accountdetails = function accountdetails(accountdetail) {
$scope.displayFlagId = null;
$scope.levelflagId = null;
$scope.secondlevelflagId = null;
$scope.DistrictselectId = null;
$scope.BlockselectId = null;
$scope.DestrictDetails = null;
$scope.BlockDetailss = null;
$scope.villagecode = null;
$scope.districtLinedep = null;
$scope.blockLinedep = null;

$scope.district = {};
$scope.block = {};
$scope.allvillage = {};
$scope.districtLine = {};
$scope.blockline = {};
$scope.schemeList = {};

  $scope.levelflag = accountdetail;
  $("#DistrictId").addClass("hidden");
  $("#BlockId").addClass("hidden");
  $("#villageId").addClass("hidden");
  $("#BlockLineId").addClass("hidden");
  $("#districtLinedepId").addClass("hidden");

  if(angular.equals($scope.StateId, "17") == true && (angular.equals(accountdetail, "23") == true || angular.equals(accountdetail, "22") == true)) {
         
            alert( "Block Data is not available!!");  
            return false;
         
  }
if(angular.equals($scope.localbodycodeid, "3") || angular.equals($scope.localbodycodeid, "1,2,3")
|| angular.equals($scope.localbodycodeid, "1,2,3,11") || angular.equals($scope.localbodycodeid, "1,2,14,3,11")
|| angular.equals($scope.localbodycodeid, "10,23,22") || angular.equals($scope.localbodycodeid, "11")  
|| angular.equals($scope.localbodycodeid, "1,3,10,17") || angular.equals($scope.localbodycodeid, "12")
|| angular.equals($scope.localbodycodeid, "1,2,3,20,20,21,10,18,15,16") || angular.equals($scope.localbodycodeid, "1,2,14,3,11,13")
|| angular.equals($scope.localbodycodeid, "1,2,3,11,19") || angular.equals($scope.localbodycodeid, "1,2,3,11,19")
|| angular.equals($scope.localbodycodeid, "1,2,3,20")
|| angular.equals($scope.localbodycodeid, "1,2,3,20,21,10,18,15,16")  ) {
$scope.displayFlagId = "A";
ParentwiselbList($scope.displayFlagId, accountdetail);
} else if(angular.equals($scope.localbodycodeid, "1,3")) {
$scope.displayFlagId = "ZG";
ParentwiselbList($scope.displayFlagId, accountdetail);
} else if(angular.equals($scope.localbodycodeid, "1,2")) {
$scope.displayFlagId = "ZI";
   ParentwiselbList($scope.displayFlagId, accountdetail);
} else if(angular.equals($scope.localbodycodeid, "2,3")) {
$scope.displayFlagId = "IG";
$("#DistrictId").addClass("hidden");
getBlockList();

} else if(angular.equals($scope.localbodycodeid, "3")) {
$scope.displayFlagId = "GP";
getVillageList();
} else if($scope.localbodycodeid="11") {
$scope.displayFlagId = "GP";
getVillageList();
}
if(angular.equals($scope.localbodycodeid, "1,2,3,20,21,10,18,15,16")) {
 $scope.displayFlagId = "AB";
 ParentwiselbList($scope.displayFlagId, accountdetail);
}


   }
 

   function ParentwiselbList(displayflag, accountdetail) {
  $("#BlockId").addClass("hidden");
  $("#villageId").addClass("hidden");
  $("#BlockLineId").addClass("hidden");
  $("#districtLinedepId").addClass("hidden");
  $("#DistrictId").removeClass("hidden");
  $scope.district = {};
  var distictForState = null;
   if(displayflag == 'A' || displayflag == 'AB' || displayflag == 'GI') {
    if($scope.StateId !=17) {
    $scope.levelflagId = "getBlockList";
    }
    distictForState = reportabstractService.getDistictList($scope.StateId, $scope.finyear,accountdetail);
    } else if(displayflag == 'ZG') {
    distictForState = reportabstractService.getDistictList($scope.StateId, $scope.finyear,accountdetail);
    if(angular.equals(accountdetail, "1") == false && angular.equals(accountdetail, "10") == false) {
    $scope.levelflagId = "getVillageList";
    }
    }

  distictForState.then(function(response) {
  $scope.data = response.data;
  var districtDetail = new Array();
  angular.forEach($scope.data, function(obj, key) {
  var district = new DestrictDetails();
  district.districtid = obj.localBodyCode;
  district.districtName = obj.localBodyNameEnglish;
  districtDetail.push(district);
  });
  $scope.district = districtDetail;
  });
 
  $("#displayFlagId").val(displayflag);
   }

   $scope.districtdetails = function districtdetails(districtmodel)  {
  $("#district_error").hide();
  $scope.secondlevelflagId = null;
  $scope.DistrictselectId = null;
  $scope.BlockselectId = null;
  $scope.BlockDetailss = null;
  $scope.villagecode = null;
  $scope.districtLinedep = null;
  $scope.blockLinedep = null;

  $scope.block = {};
  $scope.allvillage = {};
  $scope.districtLine = {};
  $scope.blockline = {};
  $scope.schemeList = {};
 
  $("#BlockId").addClass("hidden");
  $("#villageId").addClass("hidden");
  $("#BlockLineId").addClass("hidden");
  $("#districtLinedepId").addClass("hidden");
  $scope.DistrictselectId = districtmodel;
  if($scope.levelflag != 1 && $scope.levelflagId != 1) {
  if($scope.levelflagId == 'getBlockList') {
  getBlockList();
  } else if($scope.levelflagId == 'getDistrictLinedepList') {
  getDistrictLinedepList();
  } else if($scope.levelflagId == 'getVillageList') {
  getVillageList();
  }
  } else {
  if($scope.reportType == 'S') {
  getSchemeData(districtmodel);
  }
  }
   }
   
   function getBlockList() {
  $("#districtLinedepId").addClass("hidden");
  $("#villageId").addClass("hidden");
  $("#BlockLineId").addClass("hidden");
  $("#BlockId").removeClass("hidden");
  $scope.block = {};
  var distcode = null;
       var blocklist = null;

       if($scope.displayFlagId == 'A' || $scope.displayFlagId == 'AB' || $scope.displayFlagId == 'GI') {
distcode = $scope.DistrictselectId;
       } else if($scope.displayFlagId == 'IG') {
      distcode = $scope.StateId;
      $("#DistrictId").addClass("hidden");
       }

       if($scope.levelflag == '2' || $scope.levelflag == '3' || $scope.levelflag == '14' || $scope.levelflag == '11' || $scope.levelflag == '21'   || $scope.levelflag == '20') {
      if($scope.levelflag == '2' || $scope.levelflag == '3' || $scope.levelflag == '14' || $scope.levelflag == '11'  || $scope.levelflag == '20') {
      if($scope.displayFlagId == 'A' || $scope.displayFlagId == 'AB' || $scope.displayFlagId == 'GI' || $scope.displayFlagId == 'IG') {
      if($scope.levelflag == '3' || $scope.levelflag == '11' || $scope.levelflag =='12'  || $scope.levelflag == '15' || $scope.levelflag =='16' || $scope.levelflag =='17' || $scope.levelflag =='22'  || $scope.levelflag == '20') {
      $scope.secondlevelflagId = 'getVillageList';
      }
      }
      blocklist = reportabstractService.getBlockList(distcode, $scope.finyear, $scope.levelflag, $scope.displayFlagId);
      } else if($scope.levelflag == '22221') {
      $scope.secondlevelflagId = 'getBlockLinedepList';
      blocklist = reportabstractService.getBlockByState($scope.finyear, $scope.StateId, $scope.levelflag, distcode);
      }
       } else {
      return false;
       }
       blocklist.then(function(response) {
      $scope.data = response.data;
      var blockDetail = new Array();
      angular.forEach($scope.data, function(obj, key) {
      var blocks = new BlockDetails();
      blocks.blockid = obj.localBodyCode;
      blocks.blockName = obj.localBodyNameEnglish;
      blockDetail.push(blocks);
      });
      $scope.block = blockDetail;
       });
   }

   function getDistrictLinedepList() {
  $("#BlockId").addClass("hidden");
  $("#villageId").addClass("hidden");
  $("#BlockLineId").addClass("hidden");
  $("#districtLinedepId").removeClass("hidden");
 
  $scope.districtLine = {};
  reportabstractService.getDistrictLinedept($scope.finyear, $scope.StateId, $scope.levelflag, $scope.DistrictselectId).then(function(response) {
  $scope.data = response.data;
  var districtLineDetail = new Array();
  angular.forEach($scope.data, function(obj, key) {
  var districtLine = new districtLinedepList();
  districtLine.districtLineid = obj.localBodyCode;
  districtLine.districtLineName = obj.localBodyNameEnglish;
  districtLineDetail.push(districtLine);
  });
  $scope.districtLine = districtLineDetail;
  });
   }

   $scope.blockdetaill = function blockdetaill(blockmodel) {
  $("#block_error").hide();
  $scope.BlockselectId = null;
  $scope.villagecode = null;
  $scope.districtLinedep = null;
  $scope.blockLinedep = null;
 
  $scope.BlockselectId = blockmodel;
  $scope.allvillage = {};
  $scope.blockline = {};
  if($scope.secondlevelflagId == 'getVillageList') {
  getVillageList();
  } else if($scope.secondlevelflagId == 'getBlockLinedepList') {
  getBlockLinedepList();
  } else {
  if($scope.reportType == 'S') {
  getSchemeData(blockmodel);
  }
  }
  return false;
   }
   
   function getVillageList() {
  $("#districtLinedepId").addClass("hidden");
  $("#BlockLineId").addClass("hidden");
  $("#villageId").removeClass("hidden");
  $scope.allvillage = {};
  var districtcode;
  if($scope.displayFlagId == 'ZG') {
  districtcode = $scope.DistrictselectId;
  } else {
  districtcode = $scope.BlockselectId;
  }
  if($scope.displayFlagId == 'GP') {
 
  districtcode=0;
  }
 
  reportabstractService.getvillage($scope.finyear, $scope.StateId, $scope.levelflag, districtcode).then(function(response) {
  $scope.data = response.data;
  var villageDetail = new Array();
  angular.forEach($scope.data, function(obj, key) {
  var villages= new villageList();
  villages.villageid = obj.localBodyCode;
  villages.villageName = obj.localBodyNameEnglish;
  villageDetail.push(villages);
  });
  $scope.allvillage = villageDetail;
  });
   }
   
   function getBlockLinedepList() {
  $("#districtLinedepId").addClass("hidden");
  $("#villageId").addClass("hidden");
  $("#BlockLineId").removeClass("hidden");
  $scope.blockline = {};

  reportabstractService.getBlockLinedept($scope.finyear, $scope.StateId, $scope.levelflag, $scope.BlockselectId).then(function(response) {
  $scope.data = response.data;
  var blocklineDetail = new Array();
  angular.forEach($scope.data, function(obj, key) {
  var blockline= new blockLineList();
  blockline.blocklineid = obj.localBodyCode;
  blockline.blocklineName = obj.localBodyNameEnglish;
  blocklineDetail.push(blockline);
  });
  $scope.blockline = blocklineDetail;
  });
   }
   
   $scope.setCalendar = function setCalendar(val) {
if(val != "" || val != 0) {
var sdate = new Date(val.split("-")[0] + "-4-1");
var edate = new Date(val.split("-")[1] + "-3-31");
$('#datePick').datepicker('setDate', sdate);
$('#datePick').datepicker('setStartDate', sdate);
$('#datePick').datepicker('setEndDate', edate);
}
}
   
   $scope.setCashbookCalendar = function setCashbookCalendar(val) {
if((val != "" || val != 0) && $("input[name='cashbookType']:checked").val() == 'D') {
var sdate = new Date(val.split("-")[0] + "-4-1");
var edate = new Date(val.split("-")[1] + "-3-31");
$('#fromDate').datepicker('setDate', sdate);
$('#fromDate').datepicker('setStartDate', sdate);
$('#fromDate').datepicker('setEndDate', edate);
$('#toDate').datepicker('setDate', sdate);
$('#toDate').datepicker('setStartDate', sdate);
$('#toDate').datepicker('setEndDate', edate);
}
}
    $scope.setReportType = function setReportType(val) {
    $("#yearid").val('');
$("#month").val(0);
$("#fromDate").val('');
$("#toDate").val('');
$scope.finyear = null;
    $scope.reportType = val;
if(val != 'S') {
$("#schemeDiv").hide();
}
$scope.clearSelections();
    }
    $scope.showSchemeData = function showSchemeData(entityCode) {
    if($scope.reportType == 'S') {
    getSchemeData(entityCode);
    }
    }
    function getSchemeData(entityCode) {
    $("#schemeDiv").show();
    reportabstractService.getSchemeList(entityCode, $scope.finyear, $scope.levelflag, $scope.StateId).then(function(response) {
  var schemeDetail = new Array();
  angular.forEach(response.data, function(obj, key) {
  var scheme = new schemeDetails();
  scheme.schemeId = obj.schemeid;
  if(obj.scheme_category == 'A') {
  scheme.schemeCategory = "Other Resources";
  } else if(obj.scheme_category == 'C') {
  scheme.schemeCategory = "Central Schemes";
  } else if(obj.scheme_category == 'S') {
  scheme.schemeCategory = "State Schemes";
  } else {
  scheme.schemeCategory = obj.scheme_category;
  }
  scheme.schemeName = obj.resourcedesc + "-" + obj.schemename_abbreviation;
  schemeDetail.push(scheme);
  });
  $scope.schemeList = schemeDetail;
    });
    }
    $scope.showDateMonth = function showDateMonth(val) {
if(val == 'D') {
$("#monthDiv").hide();
$("#dateRangeDiv1").show();
$("#dateRangeDiv2").show();
} else if(val == 'M') {
$("#dateRangeDiv1").hide();
$("#dateRangeDiv2").hide();
$("#monthDiv").show();
} else {
$("#dateRangeDiv1").hide();
$("#dateRangeDiv2").hide();
$("#monthDiv").hide();
}
$("#yearid").val('');
$("#month").val(0);
$("#fromDate").val('');
$("#toDate").val('');
$("#schemeDiv").hide();
$scope.clearSelections();
    }
   
   
    $scope.validateInputs = function validateInputs() {
       let error = false;

       if ($("#StateId").val() == null || $("#StateId").val() == 0 || $("#StateId").val() == "") {
           $("#State_error").show();
           error = true;
       } else {
           $("#State_error").hide();
       }

       $("#AccountSelectId").val("3");
       
       if ($("#AccountSelectId").val() == null || $("#AccountSelectId").val() == 0 || $("#AccountSelectId").val() == "") {
           $("#accountingUnit_error").show();
           error = true;
       } else {
           $("#accountingUnit_error").hide();

           let tier = $("#stateTier").val();
           if (($("#DistrictselectId").val() == null || $("#DistrictselectId").val() == 0 || $("#DistrictselectId").val() == "") && tier !== 'IG' && tier !== 'GP') {
               $("#district_error").show();
               error = true;
           } else {
               $("#district_error").hide();
           }

           if ($("#AccountSelectId").val() == 2 || $("#AccountSelectId").val() == 3 || $("#AccountSelectId").val() == 21) {
               if (($("#BlockselectId").val() == null || $("#BlockselectId").val() == 0 || $("#BlockselectId").val() == "") && tier !== 'ZG' && tier !== 'GP') {
                   $("#block_error").show();
                   error = true;
               } else {
                   $("#block_error").hide();
               }

               if ($("#AccountSelectId").val() == 3) {
                   if ($("#villageSelectId").val() == null || $("#villageSelectId").val() == 0 || $("#villageSelectId").val() == "") {
                       $("#villagecode_error").show();
                       error = true;
                   } else {
                       $("#villagecode_error").hide();
                   }
               }

               if ($("#AccountSelectId").val() == 21) {
                   if ($("#BlockLineSelectId").val() == null || $("#BlockLineSelectId").val() == 0 || $("#BlockLineSelectId").val() == "") {
                       $("#blockLinedep_error").show();
                       error = true;
                   } else {
                       $("#blockLinedep_error").hide();
                   }
               }
           }
       }

       return !error;
    };
   
    //START JJM SUBMIT FUNCTION CALL
   
    $scope.showJJMData = function showJJMData() {
    var panchayatid=0;
    //var panchytType=$("#AccountSelectId").val();
    var panchytType = "3";
   
    if (["1", "10", "13", "18", "20"].includes(panchytType)) {
           panchayatid = $("#DistrictselectId").val();
       } else if (["2", "14", "19", "23"].includes(panchytType)) {
           panchayatid = $("#BlockselectId").val();
       } else if (["3", "11", "12", "15", "16", "17", "22"].includes(panchytType)) {
           panchayatid = $("#villageSelectId").val();
       }
   
    // Validate inputs
       if (!$scope.validateInputs()) {
           return false;
       }
       
if(panchayatid==0){

alert('Please Select at least one Panchayat');

return false;


}else {

$("#blockLinedep_error").hide();
$("#block_error").hide();
$("#district_error").hide();
$("#villagecode_error").hide();
$("#State_error").hide();
$("#accountingUnit_error").hide();

}
   
var stateId=$scope.StateId;
//General Profile Details
reportabstractService.getprofiledata(panchayatid).then(function(response) {
    $scope.profiledata = response.data;
    });

reportabstractService.getBasicProfileData(panchayatid).then(function(response) {
    $scope.basicProfileData = response.data;
    });

//Village List
    showJJMVillageList(panchayatid,stateId);
   
    //Scheme List
    reportabstractService.getJJMSchemedetails(panchayatid,stateId).then(function(response) {
    $scope.schemedetails = response.data;
    });
   
    //List of Beneficiaries
    reportabstractService.getBeneficiaryMasterDataCount(panchayatid).then(function(response) {
$scope.beneficiaryMasterDataCount = response.data;
  });
   
    //Water Sources
    reportabstractService.getJJMWaterSourceMaster(panchayatid,stateId).then(function(response) {
    $scope.watersourcemaster = response.data;
    });
   
   
    // Village Level Functionaries Contacts
    reportabstractService.getJJMVillageLevelFunctionaries(panchayatid, stateId)
     .then(function (response) {
       //console.log("Full API Response: Show JJM Village Level Functionaries:", response.data);

       // Check if response.data is available
       if (response.data && Object.keys(response.data).length > 0) {
         // Assign data for "GP level member"
         $scope.villagelevelfunctionaries = response.data["GP level member"] || [];

         // Assign data for "VWSC/ Pani Samiti/ Water User Group Member"
         $scope.villageLevelCommittee = response.data["VWSC/ Pani Samiti/ Water User Group Member"] || [];

         // Assign data for "O&M Staff"
         $scope.villagelevelfunctionariesStaff = response.data["O&M Staff"] || [];

         // Assign data for "Women trained for FTK"
         $scope.villagelevelfunctionariesWomen = response.data["Women trained for FTK"] || [];
       } else {
         // Handle empty response data
         console.warn("API Response is empty.");
         $scope.villagelevelfunctionaries = [];
         $scope.villageLevelCommittee = [];
         $scope.villagelevelfunctionariesStaff = [];
         $scope.villagelevelfunctionariesWomen = [];
       }
     },function (error) {
         // Handle API errors
         console.error("Error fetching village level functionaries data:", error);
         $scope.villagelevelfunctionaries = [];
         $scope.villageLevelCommittee = [];
         $scope.villagelevelfunctionariesStaff = [];
         $scope.villagelevelfunctionariesWomen = [];
       });
    }
   
  //Village List
    function showJJMVillageList(panchayatid,stateId) {
     reportabstractService.getJJMVillageList(panchayatid,stateId).then(function(response) {
         // Log the full response for debugging
        // console.log("Full API Response: show JJM Village List :", response.data);
        $scope.habitationwisePopulation = response.data;

     }, function (error) { // Error handling in the second `.then` argument
            $scope.habitationwisePopulation ={};
            console.error("Error fetching JJM Village List data:", error);
          });
  }
   
    $scope.showBeneficiaryData = function showBeneficiaryData(villageid) {
       $("#myModal").modal().show();
    $scope.loaderBeneficiaryMasterDataStatus = true;
reportabstractService.getBeneficiaryMasterData(villageid).then(function(response) {
$scope.loaderBeneficiaryMasterDataStatus = false;
$scope.beneficiaryMasterData = response.data;
}, function (error) { // Error handling in the second `.then` argument
            $scope.loaderBeneficiaryMasterDataStatus = false; // Hide the loader on error
            $scope.beneficiaryMasterData ={};
            console.error("Error fetching show beneficiary data:", error);
          });

}
   
 // Function to handle change event -> Details of Water Quality in GP By Village
    $scope.showDetailsofWaterQualityGP = function (panchayatid) {
      $scope.loaderWatarQualityStatus = true;

      if(panchayatid){
     // Make the service call
          reportabstractService.getWatarQualityStatusDetails(panchayatid, $scope.StateId)
            .then(function (response) {
              $scope.loaderWatarQualityStatus = false; // Hide the loader once data is fetched
              $scope.watarQualityStatus = response.data; // Store the response data
              //console.info("API RESPONSE Watar Quality Status:", response.data);
             
           // Ensure the map URL is valid before trusting it
              if (response.data[0].Result_Nearestlaboratory.Map_Location) {
                $scope.safeMapLocation = $sce.trustAsResourceUrl(response.data[0].Result_Nearestlaboratory.Map_Location);
              } else {
                console.error("Map location URL is not available.");
              }
             
            }, function (error) { // Error handling in the second `.then` argument
              $scope.loaderWatarQualityStatus = false; // Hide the loader on error
              $scope.watarQualityStatus ={};
              console.error("Error fetching water quality status:", error);
            });
      }else{
     $scope.loaderWatarQualityStatus = false; // Hide the loader on error
     $scope.watarQualityStatus ={};
      }
   
    };
   
   
 // Function to handle change event -> Get Your Water Sample Tested (View Rate List)
    $scope.getJJMRateListDetails = function () {
    // Validate inputs
       if (!$scope.validateInputs()) {
           return false;
       }
      $("#rateListModal").modal().show();
      $scope.loaderRateListStatus = true;
   // Make the service call
      reportabstractService.getJJMRateListDetails()
        .then(function (response) {
        if(response.data && response.data.status){
        $scope.jjmRateList = response.data.data_result; // Store the response data
        }else{
        $scope.jjmRateList ={};
        }
          $scope.loaderRateListStatus = false; // Hide the loader once data is fetched
         
        }, function (error) { // Error handling in the second `.then` argument
          $scope.loaderRateListStatus = false; // Hide the loader on error
          $scope.jjmRateList ={};
          console.error("Error fetching JJM Rate List:", error);
        });
   
    };
   
//END JJM SUBMIT FUNCTION CALL
   
   
   

							 // Swachh Bharat Mission (Grameen) KPI Data
							$scope.showKPIData = function showKPIData(target) {
								console.log("Start..");
								console.log("target >>> " + target);
								var panchayatid = 0;
								var stateCode = $scope.StateId;
								// var panchytType=$("#AccountSelectId").val();
								var panchytType = "3";
								if (panchytType == '1' || panchytType == '10'
										|| panchytType == '13'
										|| panchytType == '18'
										|| panchytType == '20') {

									panchayatid = $("#DistrictselectId").val();
									$scope.grampanchayatid = $(
											"#DistrictselectId").val();
								} else if (panchytType == '2'
										|| panchytType == '14'
										|| panchytType == '19'
										|| panchytType == '23') {

									panchayatid = $("#BlockselectId").val();
									$scope.grampanchayatid = $("#BlockselectId")
											.val();

								} else if (panchytType == '3'
										|| panchytType == '11'
										|| panchytType == '12'
										|| panchytType == '15'
										|| panchytType == '16'
										|| panchytType == '17'
										|| panchytType == '22') {
									panchayatid = $("#villageSelectId").val();
									$scope.grampanchayatid = $(
											"#villageSelectId").val();

								}

								

								var tier = $("#stateTier").val();

								if ($("#StateId").val() == null
										|| $("#StateId").val() == 0
										|| $("#StateId").val() == "") {
									$("#State_error").show();
									error = true;
								}
								if ($("#AccountSelectId").val() == null
										|| $("#AccountSelectId").val() == 0
										|| $("#AccountSelectId").val() == "") {
									$("#accountingUnit_error").show();
									error = true;
								} else {
									if (($("#DistrictselectId").val() == null
											|| $("#DistrictselectId").val() == 0 || $(
											"#DistrictselectId").val() == "")
											&& tier != 'IG' && tier != 'GP') {
										$("#district_error").show();
										error = true;
									}
									if ($("#AccountSelectId").val() == 2
											|| $("#AccountSelectId").val() == 3
											|| $("#AccountSelectId").val() == 21) {
										if (($("#BlockselectId").val() == null
												|| $("#BlockselectId").val() == 0 || $(
												"#BlockselectId").val() == "")
												&& tier != 'ZG' && tier != 'GP') {
											$("#block_error").show();
											error = true;
										}
										if ($("#AccountSelectId").val() == 3) {
											if ($("#villageSelectId").val() == null
													|| $("#villageSelectId")
															.val() == 0
													|| $("#villageSelectId")
															.val() == "") {
												$("#villagecode_error").show();
												error = true;
											}
										}
										if ($("#AccountSelectId").val() == 21) {
											if ($("#BlockLineSelectId").val() == null
													|| $("#BlockLineSelectId")
															.val() == 0
													|| $("#BlockLineSelectId")
															.val() == "") {
												$("#blockLinedep_error").show();
												error = true;
											}
										}
									}

								}

								if (panchayatid == 0) {

									alert('please Select at least one Panchayat');

									return false;

								} else {

									$("#blockLinedep_error").hide();
									$("#block_error").hide();
									$("#district_error").hide();
									$("#villagecode_error").hide();
									$("#State_error").hide();
									$("#accountingUnit_error").hide();

								}
								console.log("SBM START....");
								// General Profile Details
								reportabstractService.getprofiledata(
										panchayatid).then(function(response) {
									$scope.profiledata = response.data;
								});

								reportabstractService.getBasicProfileData(
										panchayatid).then(function(response) {
									$scope.basicProfileData = response.data;
								});
								// END General Profile Details
								showSBMODFPlusStatus(stateCode, panchayatid);
								showAssets(stateCode, panchayatid);
								showCommunitySanitaryComplex(stateCode,
										panchayatid);
								showIHHLBeneficiaries(stateCode, panchayatid);
								console.log("SBM END....");

							}
 
 
 
 
  function showSBMODFPlusStatus(stateCode, panchayatid) {
  $scope.loader = true;
     reportabstractService.getSBMODFPlusStatus(stateCode, panchayatid).then(function(response) {
         // Log the full response for debugging
       //  console.log("Full API Response: ODF Plus Status :", response);

         if (response && response.data && Array.isArray(response.data.data)) {
             // Access the nested 'data' property which is an array
             $scope.SBMODFPlusStatusDataList = response.data.data;
            // console.log("SBMODFPlusStatusDataList set successfully:", $scope.SBMODFPlusStatusDataList);
            $scope.loader = false;
         } else {
             console.error("Unexpected response structure. Response: ODF Plus Status :", response);
             $scope.SBMODFPlusStatusDataList = [];
            $scope.loader = false;
         }
     });
  }
 
function showODFPlusIndicators(stateCode, panchayatid) {
$scope.loaderIndicators = true;
reportabstractService.getODFPlusIndicators(stateCode,panchayatid).then(function(response) {
// Log the full response for debugging
        // console.log("Full API Response:", response);

         if (response && response.data && Array.isArray(response.data.data)) {
             // Access the nested 'data' property which is an array
             $scope.ODFPlusIndicatorsDataList = response.data.data;
            // console.log("ODFPlusIndicatorsDataList set successfully:", $scope.ODFPlusIndicatorsDataList);
            $scope.loaderIndicators = false;
         } else {
             console.error("Unexpected response structure. Response:", response);
             $scope.ODFPlusIndicatorsDataList = [];
            $scope.loaderIndicators = false;
         }
});

}


function showAssets(stateCode, panchayatid) {
$scope.loaderassets = true;
reportabstractService.getAssets(stateCode,panchayatid).then(function(response) {
// Log the full response for debugging
       //  console.log("Full API Response: Assets :", response);

         if (response && response.data && Array.isArray(response.data.data)) {
             // Access the nested 'data' property which is an array
             $scope.AssetsDataList = response.data.data;
           //  console.log("AssetsDataList set successfully:", $scope.AssetsDataList);
            $scope.loaderassets = false;
         } else {
             console.error("Unexpected response structure. Response: Assets :", response);
             $scope.AssetsDataList = [];
            $scope.loaderassets = false;
         }
});

}


function showCommunitySanitaryComplex(stateCode, panchayatid) {
$scope.loadercomplex = true;
reportabstractService.getCommunitySanitaryComplex(stateCode,panchayatid).then(function(response) {
// Log the full response for debugging
         //console.log("Full API Response: Community Sanitary Complex :", response);

         if (response && response.data && Array.isArray(response.data.Response)) {
             // Access the nested 'data' property which is an array
             $scope.CommunitySanitaryComplexDataList = response.data.Response;
            // console.log("CommunitySanitaryComplexDataList set successfully:", $scope.CommunitySanitaryComplexDataList);
            $scope.loadercomplex = false;
         } else {
             console.error("Unexpected response structure. Response: Community Sanitary Complex :", response);
             $scope.CommunitySanitaryComplexDataList = [];
            $scope.loadercomplex = false;
         }
});

}


function showIHHLBeneficiaries(stateCode, panchayatid) {
$scope.loaderIHHL = true;
reportabstractService.getIHHLBeneficiaries(stateCode,panchayatid).then(function(response) {
// Log the full response for debugging
         //console.log("Full API Response: IHHL Beneficiaries : ", response);

         if (response && response.data && Array.isArray(response.data.data)) {
             // Access the nested 'data' property which is an array
             $scope.IHHLBeneficiariesDataList = response.data.data;
            // console.log("IHHLBeneficiariesDataList set successfully:", $scope.IHHLBeneficiariesDataList);
            $scope.loaderIHHL = false;
         } else {
             console.error("Unexpected response structure. Response: IHHL Beneficiaries :", response);
             $scope.IHHLBeneficiariesDataList = [];
            $scope.loaderIHHL = false;
         }
});

}



$scope.showODFPlusIndicators = function showODFPlusIndicators() {
$scope.loaderIndicators = false;
var stateCode=$scope.StateId;
var panchayatid=$scope.grampanchayatid;
reportabstractService.getODFPlusIndicators(stateCode,panchayatid).then(function(response) {
// Log the full response for debugging
         //console.log("Full API Response:", response);

         if (response && response.data && Array.isArray(response.data.data)) {
             // Access the nested 'data' property which is an array
             $scope.ODFPlusIndicatorsDataList = response.data.data;
            // console.log("ODFPlusIndicatorsDataList set successfully:", $scope.ODFPlusIndicatorsDataList);
            $scope.loaderIndicators = false;
         } else {
             console.error("Unexpected response structure. Response:", response);
             $scope.ODFPlusIndicatorsDataList = [];
            $scope.loaderIndicators = false;
         }
});

}


$scope.showAssets = function showAssets() {
$scope.loaderassets = true;
var stateCode=$scope.StateId;
var panchayatid=$scope.grampanchayatid;
reportabstractService.getAssets(stateCode,panchayatid).then(function(response) {
// Log the full response for debugging
        // console.log("Full API Response:", response);

         if (response && response.data && Array.isArray(response.data.data)) {
             // Access the nested 'data' property which is an array
             $scope.AssetsDataList = response.data.data;
            // console.log("AssetsDataList set successfully:", $scope.AssetsDataList);
            $scope.loaderassets = false;
         } else {
             console.error("Unexpected response structure. Response:", response);
             $scope.AssetsDataList = [];
            $scope.loaderassets = false;
         }
});

}


$scope.showAssetsDetails = function showAssetsDetails() {
$scope.loaderassetsdetails = true;
var stateCode=$scope.StateId;
var panchayatid=$scope.grampanchayatid;
reportabstractService.getAssetsDeatils(stateCode,panchayatid).then(function(response) {
// Log the full response for debugging
         //console.log("Full API Response:", response);

         if (response && response.data && Array.isArray(response.data.data)) {
             // Access the nested 'data' property which is an array
             $scope.AssetsDeatilsDataList = response.data.data;
            // console.log("AssetsDataList set successfully:", $scope.AssetsDeatilsDataList);
            $scope.loaderassetsdetails = false;
         } else {
             console.error("Unexpected response structure. Response:", response);
             $scope.AssetsDeatilsDataList = [];
            $scope.loaderassetsdetails = false;
         }
});

}

							
							//Start Reports Section
							$scope.stateWiseDetailsShowModal = function stateWiseDetailsShowModal(target) {
								$scope.reportModalData=[];
								$scope.reportTableHeaders =[];
								$scope.reportModalTitle="";
								if(target === '1'){
									$scope.reportTableHeaders = ["State Name","Total No of GPs","Total No of Villages","Village Wise No of WSO Registered"];
									$scope.reportModalData=["MADHYA PRADESH" , "5","5","10"];
									$scope.reportModalTitle="Water Supply Operator Information";
								}else if(target === '2'){
									$scope.reportTableHeaders = ["State Name","Total No of GPs","Total No of Villages","Village Wise No of Operator Registered"];
									$scope.reportModalData=["MADHYA PRADESH" , "2","3","15"];
									$scope.reportModalTitle="Vehicle Wise Registered Operator for Garbage Collection";
								}else if(target === '3'){
									$scope.reportTableHeaders = ["State Name","Total No of GPs","Total No of Villages","Village Wise No of Operator Registered"];
									$scope.reportModalData=["MADHYA PRADESH" , "5","15","20"];
									$scope.reportModalTitle="Registered Operator for Plastic Waste Management";
								}
								$("#reportsModal").modal().show();
								//console.log($scope.reportModalData);
								
							}
							
							
							// List of Beneficiaries Section modal
							$scope.closeReportModal = function closeReportModal() {
								$("#reportsModal").modal().hide();
								$scope.reportModalData=[];
								$scope.reportTableHeaders =[];
								$scope.reportModalTitle="";
							}
							//End Reports Section
$scope.showCommunitySanitaryComplex = function showCommunitySanitaryComplex() {
$scope.loadercomplex = true;
var stateCode=$scope.StateId;
var panchayatid=$scope.grampanchayatid;
reportabstractService.getCommunitySanitaryComplex(stateCode,panchayatid).then(function(response) {
// Log the full response for debugging
         //console.log("Full API Response:", response);

         if (response && response.data && Array.isArray(response.data.Response)) {
             // Access the nested 'data' property which is an array
             $scope.CommunitySanitaryComplexDataList = response.data.Response;
             //console.log("AssetsDataList set successfully:", $scope.CommunitySanitaryComplexDataList);
            $scope.loadercomplex = false;
         } else {
             console.error("Unexpected response structure. Response:", response);
             $scope.CommunitySanitaryComplexDataList = [];
            $scope.loadercomplex = false;
         }
});

}


$scope.showIHHLBeneficiaries = function showIHHLBeneficiaries() {
$scope.loaderIHHL = true;
var stateCode=$scope.StateId;
var panchayatid=$scope.grampanchayatid;
reportabstractService.getIHHLBeneficiaries(stateCode,panchayatid).then(function(response) {
// Log the full response for debugging
         //console.log("Full API Response:", response);

         if (response && response.data && Array.isArray(response.data.data)) {
             // Access the nested 'data' property which is an array
             $scope.IHHLBeneficiariesDataList = response.data.data;
            // console.log("AssetsDataList set successfully:", $scope.IHHLBeneficiariesDataList);
            $scope.loaderIHHL = false;
         } else {
             console.error("Unexpected response structure. Response:", response);
             $scope.IHHLBeneficiariesDataList = [];
            $scope.loaderIHHL = false;
         }
});

}

$scope.openModal = function(item, category) {
	   $scope.selectedItem = item;
	   $scope.selectedCategory = category;
	   $('#assetDetailsModal').modal('show');
	};
	$scope.closeModal = function() {
	   $('#assetDetailsModal').modal('hide');
	};



	$scope.getVoucherCount = function getVoucherCount(finYear) {
	   		
	   		$("#district").hide();
	   		$("#block").hide();
	   		$("#zpGPData").hide();
	   		$("#gpCount").hide();
	   		$("#gpVoucherDetails").hide();
	   		$("#state").show();
	   			getVoucherCountData(finYear);
	   			$scope.finyear = finYear;
	   		
	   	}
	   	
	   	function getVoucherCountData(finYear) {
			$scope.stateCountList = { };
			$scope.loader = true;
			
			reportabstractService.getVoucherCountData(finYear).then(function(response) {
				$scope.stateCountList = response.data;
				angular.forEach(response.data, function(obj, key) {
					// $scope.sumTotalCount = parseFloat((parseFloat($scope.sumTotalCount)) + (parseFloat(obj.totalCount)));
					// $scope.sumPfmsCount = parseFloat((parseFloat($scope.sumPfmsCount)) + (parseFloat(obj.pfmsCount)));
					// $scope.sumIntegratedDsc = parseFloat((parseFloat($scope.sumIntegratedDsc)) + (parseFloat(obj.integratedDsc)));
					// $scope.sumNonIntegrated = parseFloat((parseFloat($scope.sumNonIntegrated )) + (parseFloat( obj.nonIntegrated)));
					// $scope.sumIntegrated = parseFloat((parseFloat($scope.sumIntegrated )) + (parseFloat( obj.integrated)));
				}, function(error) {
			    	$scope.loader = false;
			    });	
				 $scope.loader = false;
			});
		}
		
		$scope.getDistrictVoucherCount = function getDistrictVoucherCount(stateId) {
	   		
	   		
	   		$("#state").hide();
	   		$("#block").hide();
	   		$("#zpGPData").hide();
	   		$("#gpCount").hide()
	   		$("#gpVoucherDetails").hide();
	   		$("#district").show();
	   		$scope.finyear = finYear;
	   			$scope.StateId = stateId;
	   			getDistrictVoucherCountData(stateId);
	   			
	   		
	   	}
	   	
	   	function getDistrictVoucherCountData(stateId) {
			$scope.districtCountList = { };
			$scope.loader = true;
			
			reportabstractService.getDistrictVoucherCountData($scope.finyear,stateId).then(function(response) {
				$scope.districtCountList = response.data;
				angular.forEach(response.data, function(obj, key) {
					// $scope.sumTotalCount = parseFloat((parseFloat($scope.sumTotalCount)) + (parseFloat(obj.totalCount)));
					// $scope.sumPfmsCount = parseFloat((parseFloat($scope.sumPfmsCount)) + (parseFloat(obj.pfmsCount)));
					// $scope.sumIntegratedDsc = parseFloat((parseFloat($scope.sumIntegratedDsc)) + (parseFloat(obj.integratedDsc)));
					// $scope.sumNonIntegrated = parseFloat((parseFloat($scope.sumNonIntegrated )) + (parseFloat( obj.nonIntegrated)));
					// $scope.sumIntegrated = parseFloat((parseFloat($scope.sumIntegrated )) + (parseFloat( obj.integrated)));
				}, function(error) {
			    	$scope.loader = false;
			    });	
				 $scope.loader = false;
			});
		}
		
		$scope.getBlockVoucherCount = function getBlockVoucherCount(stateId) {
	   		
	   		
	   		$("#state").hide();
	   		$("#district").hide();
	   		$("#zpGPData").hide();
	   		$("#gpCount").hide();
	   		$("#gpVoucherDetails").hide();
	   		$("#block").show();
	   		$scope.StateId = stateId;
	   		//$scope.finyear = finYear;
	   			getBlockVoucherCountData(stateId);
	   			getStateTier();
	   		
	   	}
	   	
	   	function getBlockVoucherCountData(stateId) {
			$scope.blockCountList = { };
			$scope.loader = true;
			
			reportabstractService.getBlockVoucherCountData($scope.finyear,stateId).then(function(response) {
				$scope.blockCountList = response.data;
				angular.forEach(response.data, function(obj, key) {
					// $scope.sumTotalCount = parseFloat((parseFloat($scope.sumTotalCount)) + (parseFloat(obj.totalCount)));
					// $scope.sumPfmsCount = parseFloat((parseFloat($scope.sumPfmsCount)) + (parseFloat(obj.pfmsCount)));
					// $scope.sumIntegratedDsc = parseFloat((parseFloat($scope.sumIntegratedDsc)) + (parseFloat(obj.integratedDsc)));
					// $scope.sumNonIntegrated = parseFloat((parseFloat($scope.sumNonIntegrated )) + (parseFloat( obj.nonIntegrated)));
					// $scope.sumIntegrated = parseFloat((parseFloat($scope.sumIntegrated )) + (parseFloat( obj.integrated)));
				}, function(error) {
			    	$scope.loader = false;
			    });	
				 $scope.loader = false;
			});
		}
		
		
		$scope.getZPWiseGPVoucherCount = function getZPWiseGPVoucherCount(stateId) {
	   		
	   		
	   		$("#state").hide();
	   		$("#district").hide();
	   		$("#block").hide();
	   		$("#gpCount").hide();
	   		$("#gpVoucherDetails").hide();
	   		$("#zpGPData").show();
	   		$scope.StateId = stateId;
	   		
	   			getZPWiseGPVoucherCountData(stateId);
	   			//getStateTier();
	   		
	   	}
	   	
	   	function getZPWiseGPVoucherCountData(stateId) {
			$scope.zpGpCountList = { };
			$scope.loader = true;
			
			reportabstractService.getZPWiseGPVoucherCountData($scope.finyear,stateId).then(function(response) {
				$scope.zpGpCountList = response.data;
				angular.forEach(response.data, function(obj, key) {
					// $scope.sumTotalCount = parseFloat((parseFloat($scope.sumTotalCount)) + (parseFloat(obj.totalCount)));
					// $scope.sumPfmsCount = parseFloat((parseFloat($scope.sumPfmsCount)) + (parseFloat(obj.pfmsCount)));
					// $scope.sumIntegratedDsc = parseFloat((parseFloat($scope.sumIntegratedDsc)) + (parseFloat(obj.integratedDsc)));
					// $scope.sumNonIntegrated = parseFloat((parseFloat($scope.sumNonIntegrated )) + (parseFloat( obj.nonIntegrated)));
					// $scope.sumIntegrated = parseFloat((parseFloat($scope.sumIntegrated )) + (parseFloat( obj.integrated)));
				}, function(error) {
			    	$scope.loader = false;
			    });	
				 $scope.loader = false;
			});
		}
	   
	   $scope.getZPGPVoucherCount = function getZPGPVoucherCount(zpCode) {
	   		
	   		
	   		$("#state").hide();
	   		$("#district").hide();
	   		$("#block").hide();
	   		$("#zpGPData").hide();
	   		$("#gpVoucherDetails").hide();
	   		$("#gpCount").show()
	   		//$scope.StateId = stateId;
	   		
	   			getZPGPVoucherCountData(zpCode);
	   			//getStateTier();
	   		
	   	}
	   	
	   	function getZPGPVoucherCountData(zpCode) {
			$scope.gpCountList = { };
			$scope.loader = true; 
			
			reportabstractService.getZPGPVoucherCountData($scope.finyear,$scope.StateId,zpCode).then(function(response) {
				$scope.gpCountList = response.data;
				angular.forEach(response.data, function(obj, key) {
					// $scope.sumTotalCount = parseFloat((parseFloat($scope.sumTotalCount)) + (parseFloat(obj.totalCount)));
					// $scope.sumPfmsCount = parseFloat((parseFloat($scope.sumPfmsCount)) + (parseFloat(obj.pfmsCount)));
					// $scope.sumIntegratedDsc = parseFloat((parseFloat($scope.sumIntegratedDsc)) + (parseFloat(obj.integratedDsc)));
					// $scope.sumNonIntegrated = parseFloat((parseFloat($scope.sumNonIntegrated )) + (parseFloat( obj.nonIntegrated)));
					// $scope.sumIntegrated = parseFloat((parseFloat($scope.sumIntegrated )) + (parseFloat( obj.integrated)));
				}, function(error) {
			    	$scope.loader = false;
			    });	
				 $scope.loader = false;
			});
		}
	   
	   $scope.getGPVoucherDetails = function getGPVoucherDetails(lgdCode) {
	   		
	   		
	   		$("#state").hide();
	   		$("#district").hide();
	   		$("#block").hide();
	   		$("#zpGPData").hide();
	   		$("#gpCount").hide();
	   		$("#gpVoucherDetails").show();
	   		//$scope.StateId = stateId;
	   		getLbDetails(lgdCode);
	   			getGPVoucherDetailsData(lgdCode);
	   			
	   		
	   	}
	   	
	   	function getGPVoucherDetailsData(lgdCode) {
			$scope.gpCountList = { };
			$scope.loader = true;
			
			reportabstractService.getGPVoucherDetailsData($scope.finyear,$scope.StateId,lgdCode).then(function(response) {
				$scope.gpCountList = response.data;
				
				angular.forEach(response.data, function(obj, key) {
					// $scope.sumTotalCount = parseFloat((parseFloat($scope.sumTotalCount)) + (parseFloat(obj.totalCount)));
					// $scope.sumPfmsCount = parseFloat((parseFloat($scope.sumPfmsCount)) + (parseFloat(obj.pfmsCount)));
					// $scope.sumIntegratedDsc = parseFloat((parseFloat($scope.sumIntegratedDsc)) + (parseFloat(obj.integratedDsc)));
					// $scope.sumNonIntegrated = parseFloat((parseFloat($scope.sumNonIntegrated )) + (parseFloat( obj.nonIntegrated)));
					// $scope.sumIntegrated = parseFloat((parseFloat($scope.sumIntegrated )) + (parseFloat( obj.integrated)));
				}, function(error) {
			    	$scope.loader = false;
			    });	
				 $scope.loader = false;
			});
		}
	   
	   function getLbDetails(lgdCode) {
			$scope.lbDetails = null;
			$scope.loader = true;
			
			reportabstractService.getLbDetails($scope.finyear,lgdCode).then(function(response) {
				$scope.lbDetails = response.data;
			});
		}
		
		$scope.exportFile = function exportFile(id) {
				$("#" + id).excelexportjs({
					containerid : id,
					datatype : 'table',
					worksheetName : "Voucher Details",
					returnUri: false
				});
			}

	
 
 
}]);
