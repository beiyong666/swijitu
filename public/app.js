function el(q){return document.querySelector(q);}
function jsonHeaders(){ return {'Content-Type':'application/json'}; }
async function api(path, opts={}){
  try{
    opts = opts || {};
    opts.headers = opts.headers || {};
    const res = await fetch('/api/'+path, opts);
    const text = await res.text();
    try{ return JSON.parse(text); }catch(e){ return { ok:false, error:'invalid json response', body: text, status: res.status }; }
  }catch(e){ return { ok:false, error: 'network error: '+e.message }; }
}

async function refreshDirs(){
  const res = await api('dirs');
  if(!res.ok) return console.error('load dirs failed', res);
  const ul = el('#dirsList'); ul.innerHTML='';
  res.dirs.forEach(d=>{
    const li = document.createElement('li'); li.textContent = d + ' ';
    const open = document.createElement('button'); open.textContent='Open'; open.onclick=()=>openDir(d);
    const del = document.createElement('button'); del.textContent='Delete'; del.onclick=()=>deleteDir(d);
    li.appendChild(open); li.appendChild(del); ul.appendChild(li);
  });
}

async function openDir(name){
  el('#currentDir').textContent = name;
  const res = await api('dirs/'+name);
  if(!res.ok) return alert('open failed: '+(res.error||''));
  const ul = el('#imgsList'); ul.innerHTML='';
  res.images.forEach(url=>{
    const li = document.createElement('li');
    const a = document.createElement('a'); a.href=url; a.target='_blank'; a.textContent=url;
    const btn = document.createElement('button'); btn.textContent='Delete'; btn.onclick=()=>removeImg(name,url);
    li.appendChild(a); li.appendChild(btn); ul.appendChild(li);
  });
}

async function createDir(){ 
  const name = el('#newDirName').value.trim(); if(!name) return alert('enter name');
  const res = await api('dirs', { method:'POST', headers: jsonHeaders(), body: JSON.stringify({ name }) });
  if(!res.ok) return alert('create failed: '+(res.error||'') + (res.body? '\\n'+res.body : ''));
  el('#newDirName').value=''; refreshDirs();
}

async function addImg(){
  const dir = el('#currentDir').textContent; if(!dir || dir==='—') return alert('open a dir');
  const url = el('#imgUrl').value.trim(); if(!url) return alert('enter url');
  const res = await api('dirs/'+dir+'/images', { method:'POST', headers: jsonHeaders(), body: JSON.stringify({ url })});
  if(!res.ok) return alert('add failed: '+(res.error||'') + (res.body? '\\n'+res.body : ''));
  el('#imgUrl').value=''; openDir(dir);
}

async function removeImg(dir, url){
  if(!confirm('Remove?')) return;
  const res = await api('dirs/'+dir+'/images', { method:'DELETE', headers: jsonHeaders(), body: JSON.stringify({ url })});
  if(!res.ok) return alert('remove failed: '+(res.error||''));
  openDir(dir);
}

async function deleteDir(name){
  if(!confirm('Delete dir '+name+' ?')) return;
  const res = await api('dirs/'+name, { method:'DELETE' });
  if(!res.ok) return alert('delete failed: '+(res.error||''));
  refreshDirs();
  el('#currentDir').textContent='—';
}

async function login(){
  const pwd = el('#pwd').value;
  el('#loginMsg').textContent = 'Logging in...';
  const res = await fetch('/api/login', { method:'POST', headers: jsonHeaders(), body: JSON.stringify({ password: pwd })});
  const text = await res.text();
  try{
    const j = JSON.parse(text);
    if(j.ok){ el('#loginBox').style.display='none'; el('#adminArea').style.display='block'; refreshDirs(); }
    else el('#loginMsg').textContent = j.error || 'login failed';
  }catch(e){
    el('#loginMsg').textContent = 'invalid json response'; console.error('login response:', text);
  }
}

document.getElementById('loginBtn').addEventListener('click', login);
document.getElementById('createDirBtn').addEventListener('click', createDir);
document.getElementById('addImgBtn').addEventListener('click', addImg);

window.addEventListener('load', async ()=>{
  // try check-auth to toggle UI
  try{
    const r = await fetch('/api/check-auth'); const t = await r.text(); const j = JSON.parse(t);
    if(j && j.auth){ document.getElementById('loginBox').style.display='none'; document.getElementById('adminArea').style.display='block'; refreshDirs(); }
  }catch(e){}
});