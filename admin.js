
async function api(path, opts={}){
  try{
    opts = opts || {};
    opts.headers = opts.headers || {};
    const token = localStorage.getItem('adm_token');
    if(token) opts.headers['X-ADM-TOKEN'] = token;
    const res = await fetch('/api/'+path, opts);
    // if response is JSON-like, parse it; else try to return text as error
    const text = await res.text();
    try{
      const j = JSON.parse(text);
      return j;
    }catch(e){
      return { ok:false, error: 'invalid json response', status: res.status, body: text };
    }
  }catch(e){
    return { ok:false, error: 'network error: '+e.message };
  }
}

function el(q){return document.querySelector(q);}

async function refreshDirs(){
  const res = await api('dirs');
  if(!res.ok){ alert('failed to load dirs: '+(res.error||'')); return; }
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
  if(!res.ok){ alert('failed to open dir: '+(res.error||'') + (res.body? '\\n' + res.body : '')); return; }
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
  const res = await api('dirs/'+name, { method:'DELETE' });
  if(!res.ok) return alert('delete failed: '+(res.error||'') + (res.body? '\\n' + res.body : ''));
  refreshDirs();
  el('#currentDir').textContent = '—';
  el('#imgsList').innerHTML = '';
}

async function addImg(){
  const dir = el('#currentDir').textContent;
  if(!dir || dir==='—') return alert('open a directory first');
  const url = el('#imgUrl').value.trim();
  if(!url) return alert('enter url');
  const res = await api('dirs/'+dir+'/images', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ url })});
  if(!res.ok) return alert('add failed: '+(res.error||'') + (res.body? '\\n' + res.body : ''));
  el('#imgUrl').value='';
  openDir(dir);
}

async function removeImg(dir, url){
  if(!confirm('Remove this image?')) return;
  const res = await api('dirs/'+dir+'/images', { method:'DELETE', headers:{'content-type':'application/json'}, body: JSON.stringify({ url })});
  if(!res.ok) return alert('remove failed: '+(res.error||'') + (res.body? '\\n' + res.body : ''));
  openDir(dir);
}

async function createDir(){
  const name = el('#newDirName').value.trim();
  if(!name) return alert('enter name');
  const res = await api('dirs', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ name })});
  if(!res.ok) return alert('create failed: '+(res.error||'') + (res.body? '\\n' + res.body : ''));
  el('#newDirName').value='';
  refreshDirs();
}

async function login(){
  const pwd = el('#pwd').value;
  el('#loginMsg').textContent = 'Logging in...';
  const j = await api('login', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ password: pwd })});
  if(j.ok){
    if(j.token) localStorage.setItem('adm_token', j.token);
    el('#loginBox').style.display='none';
    el('#adminArea').style.display='block';
    el('#loginMsg').textContent = '';
    refreshDirs();
  }else{
    el('#loginMsg').textContent = j.error || 'login failed';
    if(j.body) console.error('server returned non-json body:', j.body);
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
    } else {
      console.log('not logged in or cannot access dirs:', res);
    }
  }catch(e){ console.error(e); }
})();
