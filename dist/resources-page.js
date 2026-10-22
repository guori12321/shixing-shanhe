const $=id=>document.getElementById(id);
function showModal(html){$('modalBody').innerHTML=html;$('modal').showModal();$('modal').scrollTop=0;}
$('close').onclick=()=>$('modal').close();
$('modal').onclick=e=>{if(e.target===$('modal'))$('modal').close();};
$('resourceLesson').onclick=()=>showLesson('two-lushan');
