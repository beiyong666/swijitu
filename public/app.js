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
  const res = await api('list');
  if(!res.ok) return console.error('加载目录失败', res);
  const ul = document.getElementById('dirsList'); ul.innerHTML='';
  res.dirs.forEach(d=>{
    const li = document.createElement('li'); li.textContent = d + ' ';
    const open = document.createElement('button'); open.textContent='打开'; open.onclick=()=>openDir(d);
    const del = document.createElement('button'); del.textContent='删除'; del.onclick=()=>deleteDir(d);
    li.appendChild(open); li.appendChild(del); ul.appendChild(li);
  });
}

async function openDir(name){
  document.getElementById('currentDir').textContent = name;
  const res = await api('list?dir='+encodeURIComponent(name));
  if(!res.ok) return alert('打开目录失败: '+(res.error||'') + (res.body? '\n'+res.body : ''));
  const ul = document.getElementById('imgsList'); ul.innerHTML='';
  res.images.forEach(url=>{
    const li = document.createElement('li');
    const a = document.createElement('a'); a.href=url; a.target='_blank'; a.textContent=url;
    const btn = document.createElement('button'); btn.textContent='删除'; btn.onclick=()=>removeImg(name,url);
    li.appendChild(a); li.appendChild(btn); ul.appendChild(li);
  });
}

async function createDir(){
  const name = document.getElementById('newDirName').value.trim(); if(!name) return alert('请输入名称');
  const res = await api('upload', { method:'POST', headers: jsonHeaders(), body: JSON.stringify({ dir: name, url: '' }) });
  if(!res.ok) return alert('创建失败: '+(res.error||'') + (res.body? '\n'+res.body : ''));
  document.getElementById('newDirName').value=''; refreshDirs();
}

async function addImg(){
  const dir = document.getElementById('currentDir').textContent; if(!dir || dir==='—') return alert('请先打开目录');
  const url = document.getElementById('imgUrl').value.trim(); if(!url) return alert('请输入图片链接');
  const res = await api('upload', { method:'POST', headers: jsonHeaders(), body: JSON.stringify({ dir: dir, url: url }) });
  if(!res.ok) return alert('添加失败: '+(res.error||'') + (res.body? '\n'+res.body : ''));
  document.getElementById('imgUrl').value=''; openDir(dir);
}

async function removeImg(dir, url){
  if(!confirm('确认删除该图片？')) return;
  const res = await api('delete', { method:'POST', headers: jsonHeaders(), body: JSON.stringify({ dir: dir, url: url }) });
  if(!res.ok) return alert('删除失败: '+(res.error||'') + (res.body? '\n'+res.body : ''));
  openDir(dir);
}

async function deleteDir(name){
  if(!confirm('确认删除目录 '+name+' ?')) return;
  const res = await api('delete', { method:'POST', headers: jsonHeaders(), body: JSON.stringify({ dir: name, deleteDir:true }) });
  if(!res.ok) return alert('删除失败: '+(res.error||'') + (res.body? '\n'+res.body : ''));
  refreshDirs(); document.getElementById('currentDir').textContent='—';
}

async function login(){
  const pwd = document.getElementById('pwd').value;
  document.getElementById('loginMsg').textContent = '正在登录...';
  const res = await fetch('/api/login', { method:'POST', headers: jsonHeaders(), body: JSON.stringify({ password: pwd })});
  const text = await res.text();
  try{
    const j = JSON.parse(text);
    if(j.ok){ document.getElementById('loginBox').style.display='none'; document.getElementById('adminArea').style.display='block'; refreshDirs(); }
    else document.getElementById('loginMsg').textContent = j.error || '登录失败';
  }catch(e){
    document.getElementById('loginMsg').textContent = '无效的 json 响应'; console.error('login response:', text);
  }
}

document.getElementById('loginBtn').addEventListener('click', login);
document.getElementById('createDirBtn').addEventListener('click', createDir);
document.getElementById('addImgBtn').addEventListener('click', addImg);

window.addEventListener('load', async ()=>{
  try{
    const r = await fetch('/api/check-auth'); const t = await r.text(); const j = JSON.parse(t);
    if(j && j.auth){ document.getElementById('loginBox').style.display='none'; document.getElementById('adminArea').style.display='block'; refreshDirs(); }
  }catch(e){}
});