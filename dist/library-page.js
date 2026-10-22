const $=id=>document.getElementById(id);
function showModal(html){$('modalBody').innerHTML=html;$('modal').showModal();}
function openWork(id){location.href='index.html?work='+encodeURIComponent(id);}
$('close').onclick=()=>$('modal').close();
$('modal').onclick=e=>{if(e.target===$('modal'))$('modal').close();};
const authorQuery=new URLSearchParams(location.search).get('author');
if(['0','1','2'].includes(authorQuery))$('authorFilter').value=authorQuery;
initLibrary();
