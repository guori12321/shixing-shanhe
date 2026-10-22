const $=id=>document.getElementById(id);
function stop(){}
function showModal(html){const old=$('poetryPlayer');if(old)old.pause();$('modalBody').innerHTML=html;$('modal').showModal();}
function readWork(id){location.href='index.html?work='+encodeURIComponent(id);}
$('close').onclick=()=>$('modal').close();
$('modal').onclick=e=>{if(e.target===$('modal'))$('modal').close();};
initCinema();
