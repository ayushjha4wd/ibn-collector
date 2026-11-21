function progress() {
	this.fromDate = null;
	this.toDate = null;
}

function progressData() {
	this.days = new Array();
	this.gpProfile = new Array();
	this.gpdpApproved = new Array();
	this.activityComplete = new Array();
	this.geoTaggedAssets = new Array();
	this.voucher = new Array();
	this.fto = new Array();
}

function reportDetails() {
	this.days = null;
	this.totalProfile = null;
	this.totalApproved = null;
	this.totalActivity = null;
	this.totalGeoTagAsset = null;
	this.totalVoucher = null;
	this.totalFto = null;
}

function totalModel() {
	this.totalProfile = 0;
	this.totalApproved = 0;
	this.totalActivity = 0;
	this.totalGeoTagAsset = 0;
	this.totalVoucher = 0;
	this.totalFto = 0;
}
