'use strict';
function panelBounds(anchor,area){
 const margin=8,width=Math.min(460,area.width-2*margin),height=Math.min(680,area.height-2*margin);
 const clamp=(v,lo,hi)=>Math.max(lo,Math.min(v,hi));
 return {x:Math.round(clamp(anchor.x+anchor.width-width,area.x+margin,area.x+area.width-width-margin)),y:Math.round(anchor.y<area.y?area.y+margin:clamp(anchor.y-height-margin,area.y+margin,area.y+area.height-height-margin)),width,height};
}
module.exports={panelBounds};
