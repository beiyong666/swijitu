
async function api(path, opts={}){
  const res = await fetch('/api/'+path, opts);
  return res.json();
}

function el(q){return document.querySelector(q);}

async function refreshDirs(){
  const res = await api('dirs');
  if(!res.ok){ alert('failed to load dirs'); return; }
  const list = el('#dirsList');
  list.innerHTML = '';
  res.dirs.forEach(d=>{
    const li = document.createElement('li');
    li.textContent = d + ' ';
    const btnOpen = document.createElement('button'); btnOpen.textContent='Open'; btnOpen.onclick=()=>openDir(d);
    const btnDelete = document.createElement('button'); btnDelete.textContent='Delete'; btnDelete.onclick=()=>deleteDir(d);
    li.appendChild(btnOpen); li.appendChild(btnDelete);
    list.appendChild(li);
  });
}

async function openDir(name){
  el('#currentDir').textContent = name;
  const res = await api('dirs/'+name);
  if(!res.ok){ alert('failed to open dir'); return; }
  const ul = el('#imgsList'); ul.innerHTML='';
  res.images.forEach(url=>{
    const li = document.createElement('li');
    const a = document.createElement('a'); a.href = url; a.target='_blank'; a.textContent = url;
    const btn = document.createElement('button'); btn.textContent='Delete'; btn.onclick=()=>removeImg(name, url);
    li.appendChild(a); li.appendChild(btn);
    ul.appendChild(li);
  });
}

async function deleteDir(name){
  if(!confirm('Delete directory '+name+' ?')) return;
  const res = await fetch('/api/dirs/'+name, { method:'DELETE' });
  const j = await res.json();
  if(!j.ok) return alert('delete failed: '+(j.error||''));
  refreshDirs();
  el('#currentDir').textContent = '—';
  el('#imgsList').innerHTML = '';
}

async function addImg(){
  const dir = el('#currentDir').textContent;
  if(!dir || dir==='—') return alert('open a directory first');
  const url = el('#imgUrl').value.trim();
  if(!url) return alert('enter url');
  const res = await fetch('/api/dirs/'+dir+'/images', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ url })});
  const j = await res.json();
  if(!j.ok) return alert('add failed: '+(j.error||''));
  el('#imgUrl').value='';
  openDir(dir);
}

async function removeImg(dir, url){
  if(!confirm('Remove this image?')) return;
  const res = await fetch('/api/dirs/'+dir+'/images', { method:'DELETE', headers:{'content-type':'application/json'}, body: JSON.stringify({ url })});
  const j = await res.json();
  if(!j.ok) return alert('remove failed: '+(j.error||''));
  openDir(dir);
}

async function createDir(){
  const name = el('#newDirName').value.trim();
  if(!name) return alert('enter name');
  const res = await fetch('/api/dirs', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ name })});
  const j = await res.json();
  if(!j.ok) return alert('create failed: '+(j.error||''));
  el('#newDirName').value='';
  refreshDirs();
}

async function login(){
  const pwd = el('#pwd').value;
  const res = await fetch('/api/login', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ password: pwd })});
  const j = await res.json();
  if(j.ok){
    el('#loginBox').style.display='none';
    el('#adminArea').style.display='block';
    refreshDirs();
  }else{
    el('#loginMsg').textContent = j.error || 'login failed';
  }
}

document.getElementById('loginBtn').addEventListener('click', login);
document.getElementById('createDirBtn').addEventListener('click', createDir);
document.getElementById('addImgBtn').addEventListener('click', addImg);

// try to see if already logged in by requesting dirs
(async ()=>{
  try{
    const res = await api('dirs');
    if(res.ok){
      document.getElementById('loginBox').style.display='none';
      document.getElementById('adminArea').style.display='block';
      refreshDirs();
    }
  }catch(e){}
})();
