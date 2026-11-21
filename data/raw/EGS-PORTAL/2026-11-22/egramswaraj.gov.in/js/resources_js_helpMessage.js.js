var textBoxSize=0;
var hdivx;
var hdivy;
var tBoxPosition;
var sWidth;


function showsDiv(){
	var ret=false;
	

	   if(document.getElementById('helpDiv')){
		   document.getElementById('helpDiv').style.visibility="visible";
		  ret=true; 
	   }
	   return ret;
	}
	function hideHelp(){
		if(document.getElementById('helpDiv')){
			document.getElementById('helpDiv').style.visibility="hidden";
		}
	}
	function displaymessage(msg)
	{
		var message ="";
		if(document.getElementById(msg)){
	message=document.getElementById(msg).innerHTML;
	document.getElementById('helpMsgText').innerHTML=message;
		}
		else{
			if(document.getElementById('helpMsgText'))
				document.getElementById('helpMsgText').innerHTML=msg;	
			
		}
	}
function helpMessage(obj,  messageId) {
	
	if(document.getElementById('helpText') != null && document.getElementById('helpText').checked){
		if(showsDiv()){
			displaymessage( messageId);
			var curleft = curtop = 0;
			textBoxSize= obj.size;
			if (obj) {
				if (obj.offsetParent) {
					do {
						curleft += obj.offsetLeft;
						curtop += obj.offsetTop;
					} while (obj = obj.offsetParent);
				}
			}
			 sWidth=screentSize();
			 tBoxPosition= curleft+textBoxSize;
			 if((sWidth-tBoxPosition)<450){
				 hdivx= curleft-250;
				
		}else {
			hdivx=curleft+textBoxSize+(sWidth-curleft+textBoxSize)*10/100;
		}
			hdivy= curtop-200;
		    floatDiv("helpDiv",hdivx, hdivy).flt();
		}
	}
}

var time;
var ns;
var d = document;
var px = document.layers ? "" : "px";

function floatDiv(id, sx, sy){
var el=d.getElementById?d.getElementById(id):d.all?d.all[id]:d.layers[id];
window[id + "_obj"] = el;

el.cx = el.sx = sx;el.cy = el.sy = sy;
el.sP=function(x,y){this.style.left=x+px;this.style.top=y+px;};
el.flt=function float()
{
var pX, pY;
pX = (this.sx >= 0) ? 0 : ns ? innerWidth : 
document.documentElement && document.documentElement.scrollWidth ? 
document.documentElement.scrollWidth : document.body.scrollWidth;
pY = ns ? pageYOffset : document.documentElement && document.documentElement.scrollLeft ? 
document.documentElement.scrollLeft : document.body.scrollLeft;
if(this.sy<0) 
pY += ns ? innerHeight : document.documentElement && document.documentElement.scrollHeight ? 
document.documentElement.scrollHeight : document.body.scrollHeight;
this.cx += (pX);
this.cy += (pY);
this.sP(this.cx, this.cy);
time=setTimeout(this.id + "_obj.flt()", 0);
clearTimeout(time);
};
return el;
}

var isNS, pageHeight, pageWidth;
var floaterWidth, floaterHeight;
var paddingX, paddingY, floaterX, floaterY;
var xOffset, yOffset;
var isMoving;
var newXOffset, newYOffset;
function screentSize() {

    if (isNS) {
       pageHeight = window.innerHeight - 20;
       pageWidth = window.innerWidth - 20;
    } else {
       pageHeight = document.body.clientHeight;
       pageWidth = document.body.clientWidth;
    }
 
    return pageWidth;
   
}

