function dscRegDetail() {
	this.totalDscReg = null;
	this.dscApproved = null;
	this.dscPending = null;
	this.dscRejected = null;
	this.dscInit = null;
}

function payStatusDetail() {
	this.totalPayInit = null;
	this.paymentApp = null;
	this.payPendingPfms = null;
	this.payPending = null;
	this.payRejected = null;
}

function todayPayStatusDetail() {
	this.totalPayInitToday = null;
	this.paymentAppToday = null;
	this.payPendingPfmsToday = null;
	this.payPendingToday = null;
	this.payRejectedToday = null;
}

function vendorRegDetail() {
	this.totaVenReg = null;
	this.venApproved = null;
	this.venPending = null;
	this.venRejected = null;
}

function sectorExpDetail() {
	this.waterSupp = null;
	this.saniMan = null;
	this.sewMan = null;
	this.stormDrain = null;
	this.commAsset = null;
	this.roads = null;
	this.footpath = null;
	this.streetLight = null;
	this.burialGround = null;
	this.otherBasics = null;
	this.capitalExp = null;
	this.totalSectorExp = 0;
}

function expStatusDetail() {
	this.initiatedAmount = 0;
	this.pendingAmount = 0
	this.rejectAmount = 0;
	this.approvedAmount = 0;
}

function pendingDetails() {
	this.day0_5 = null;
	this.day6_10 = null;
	this.day11_20 = null;
	this.day20_a = null;
}

function schemeDetails() {
	this.schemeid = null;
	this.schemeName = null;
	this.schemeAbb = null;
	this.schemeCat = null;
	this.id = null;
	
}
