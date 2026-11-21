function progress() {

	this.fromDate = null;
	this.toDate = null;
}

function stateProgressData() {
	this.states = new Array();
	this.profile = new Array();
	this.approved = new Array();
	this.activity = new Array();
	this.geotagged = new Array();
}

function reportDetails() {
	this.stateName = null;
	this.totalProfile = null;
	this.totalApproved= null;
	this.totalActivity = null;
	this.totalGeoTagAsset = null;
}

function totalModel(){
	this.totalProfile = 0;
	this.totalApproved = 0;
	this.totalActivity=0;
	this.totalGeoTagAsset=0;
}

