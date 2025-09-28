export async function onRequest(context) {
  const { request, env } = context;
  const kv = (env && env.wj) ? env.wj : (typeof wj !== 'undefined' ? wj : null);
  function jsonHeaders(){ return { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin':'*', 'Access-Control-Allow-Methods':'GET,POST,DELETE,OPTIONS', 'Access-Control-Allow-Headers':'Content-Type,Authorization,X-ADM-TOKEN' }; }
  function sanitizeName(name){ return String(name||'').trim().replace(/[^a-zA-Z0-9_\\-]/g,'_').slice(0,200); }
  async function getDirs(){ const raw = await kv.get('dirs'); if(!raw) return []; try{ return JSON.parse(raw); }catch(e){ return []; } }
  async function setDirs(arr){ await kv.put('dirs', JSON.stringify(arr||[])); }
  async function getDirImages(name){ const raw = await kv.get('dir:'+name); if(!raw) return []; try{ return JSON.parse(raw); }catch(e){ return []; } }
  async function setDirImages(name, arr){ await kv.put('dir:'+name, JSON.stringify(arr||[])); }

  if(!kv) return new Response(JSON.stringify({ error: 'KV binding "wj" not found. Bind your KV namespace to variable name "wj" or "WJ".' }), { status:500, headers: jsonHeaders() });

  const url = new URL(request.url);
  const parts = url.pathname.replace(/^\/api\//,'').split('/').filter(Boolean);

  // Handle preflight
  if(request.method === 'OPTIONS'){
    return new Response(null, { status:204, headers: jsonHeaders() });
  }

  // GET /api/dirs
  if(parts.length===1 && parts[0]==='dirs' && request.method==='GET'){
    const dirs = await getDirs();
    return new Response(JSON.stringify({ ok:true, dirs }), { status:200, headers: jsonHeaders() });
  }

  // POST /api/dirs  (create dir) - requires auth cookie or token
  if(parts.length===1 && parts[0]==='dirs' && request.method==='POST'){
    // auth: check cookie 'auth=1' or X-ADM-TOKEN in headers stored in KV as admtoken:<token>
    const cookie = request.headers.get('cookie')||'';
    const token = request.headers.get('x-adm-token') || request.headers.get('X-ADM-TOKEN') || '';
    let authed = false;
    if(cookie.split(';').map(s=>s.trim()).includes('auth=1')) authed = true;
    if(!authed && token){
      const v = await kv.get('admtoken:'+token); if(v) authed = true;
    }
    if(!authed) return new Response(JSON.stringify({ error: 'unauthorized' }), { status:401, headers: jsonHeaders() });
    try{
      const body = await request.json();
      if(!body.name) return new Response(JSON.stringify({ error:'missing name' }), { status:400, headers: jsonHeaders() });
      const name = sanitizeName(body.name);
      if(!name) return new Response(JSON.stringify({ error:'invalid name' }), { status:400, headers: jsonHeaders() });
      const dirs = await getDirs();
      if(dirs.includes(name)) return new Response(JSON.stringify({ error:'dir exists' }), { status:400, headers: jsonHeaders() });
      dirs.push(name); await setDirs(dirs); await setDirImages(name, []);
      return new Response(JSON.stringify({ ok:true, name }), { status:200, headers: jsonHeaders() });
    }catch(e){
      return new Response(JSON.stringify({ error: 'invalid json body' }), { status:400, headers: jsonHeaders() });
    }
  }

  // GET /api/dirs/:name
  if(parts[0]==='dirs' && parts[1] && parts.length===2 && request.method==='GET'){
    const name = sanitizeName(parts[1]);
    const imgs = await getDirImages(name);
    return new Response(JSON.stringify({ ok:true, name, images: imgs }), { status:200, headers: jsonHeaders() });
  }

  // DELETE /api/dirs/:name
  if(parts[0]==='dirs' && parts[1] && parts.length===2 && request.method==='DELETE'){
    const cookie = request.headers.get('cookie')||'';
    const token = request.headers.get('x-adm-token') || request.headers.get('X-ADM-TOKEN') || '';
    let authed = false;
    if(cookie.split(';').map(s=>s.trim()).includes('auth=1')) authed = true;
    if(!authed && token){
      const v = await kv.get('admtoken:'+token); if(v) authed = true;
    }
    if(!authed) return new Response(JSON.stringify({ error: 'unauthorized' }), { status:401, headers: jsonHeaders() });
    const name = sanitizeName(parts[1]);
    const dirs = await getDirs();
    const idx = dirs.indexOf(name); if(idx!==-1) dirs.splice(idx,1);
    await setDirs(dirs); await kv.delete('dir:'+name);
    return new Response(JSON.stringify({ ok:true, deleted: name }), { status:200, headers: jsonHeaders() });
  }

  // POST /api/dirs/:name/images  - add image
  if(parts[0]==='dirs' && parts[1] && parts[2]==='images' && request.method==='POST'){
    const cookie = request.headers.get('cookie')||'';
    const token = request.headers.get('x-adm-token') || request.headers.get('X-ADM-TOKEN') || '';
    let authed = false;
    if(cookie.split(';').map(s=>s.trim()).includes('auth=1')) authed = true;
    if(!authed && token){
      const v = await kv.get('admtoken:'+token); if(v) authed = true;
    }
    if(!authed) return new Response(JSON.stringify({ error: 'unauthorized' }), { status:401, headers: jsonHeaders() });
    try{
      const body = await request.json();
      if(!body.url) return new Response(JSON.stringify({ error:'missing url' }), { status:400, headers: jsonHeaders() });
      const name = sanitizeName(parts[1]);
      const imgs = await getDirImages(name);
      imgs.push(body.url);
      await setDirImages(name, imgs);
      return new Response(JSON.stringify({ ok:true, name, images: imgs }), { status:200, headers: jsonHeaders() });
    }catch(e){
      return new Response(JSON.stringify({ error: 'invalid json body' }), { status:400, headers: jsonHeaders() });
    }
  }

  // DELETE /api/dirs/:name/images
  if(parts[0]==='dirs' && parts[1] && parts[2]==='images' && request.method==='DELETE'){
    const cookie = request.headers.get('cookie')||'';
    const token = request.headers.get('x-adm-token') || request.headers.get('X-ADM-TOKEN') || '';
    let authed = false;
    if(cookie.split(';').map(s=>s.trim()).includes('auth=1')) authed = true;
    if(!authed && token){
      const v = await kv.get('admtoken:'+token); if(v) authed = true;
    }
    if(!authed) return new Response(JSON.stringify({ error: 'unauthorized' }), { status:401, headers: jsonHeaders() });
    try{
      const body = await request.json();
      if(!body.url) return new Response(JSON.stringify({ error:'missing url' }), { status:400, headers: jsonHeaders() });
      const name = sanitizeName(parts[1]);
      let imgs = await getDirImages(name);
      imgs = imgs.filter(u => u !== body.url);
      await setDirImages(name, imgs);
      return new Response(JSON.stringify({ ok:true, name, images: imgs }), { status:200, headers: jsonHeaders() });
    }catch(e){
      return new Response(JSON.stringify({ error: 'invalid json body' }), { status:400, headers: jsonHeaders() });
    }
  }

  return new Response(JSON.stringify({ error:'API not found' }), { status:404, headers: jsonHeaders() });
}