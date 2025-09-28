
/**
 * edgeone_worker.js - EdgeOne Pages Functions style handlers (onRequestGet/onRequestPost/onRequestDelete)
 *
 * IMPORTANT:
 * - EdgeOne Pages example you provided uses `wj` variable and `onRequestGet(...)` signature.
 * - This file supports both `env.wj` / `env.WJ` and a global `wj` (if EdgeOne injects it).
 *
 * KV schema:
 * - "dirs" => JSON array of directory names
 * - "dir:<name>" => JSON array of image URLs
 * - "admtoken:<token>" => '1' (valid admin token)
 *
 * Set ADMIN_PASSWORD environment variable.
 *
 * Note: static files (index.html, admin.html, admin.js, styles.css) should be in the Pages static folder;
 * this function will handle API paths under /api/* and directory redirect paths like /<dir>.
 */

const JSON_HEADERS = { 'content-type': 'application/json; charset=UTF-8', 'Access-Control-Allow-Origin': '*' };
const HTML_HEADERS = { 'content-type': 'text/html; charset=UTF-8' };

function jsonResponse(data, status=200) {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
}
function htmlResponse(text, status=200){
  return new Response(text, { status, headers: HTML_HEADERS });
}

function getKV(env){
  // support env.wj or env.WJ or global wj
  if(env && (env.wj || env.WJ)) return env.wj || env.WJ;
  try{
    if(typeof wj !== 'undefined') return wj;
  }catch(e){}
  return null;
}

function sanitizeName(name){
  return String(name || '').trim().replace(/[^a-zA-Z0-9_\\-]/g, '_').slice(0,200);
}

async function getDirs(kv){
  const raw = await kv.get('dirs');
  if(!raw) return [];
  try{ return JSON.parse(raw); }catch(e){ return []; }
}
async function setDirs(kv, arr){ await kv.put('dirs', JSON.stringify(arr || [])); }
async function getDirImages(kv,name){
  const raw = await kv.get('dir:'+name);
  if(!raw) return [];
  try{ return JSON.parse(raw); }catch(e){ return []; }
}
async function setDirImages(kv,name,arr){ await kv.put('dir:'+name, JSON.stringify(arr||[])); }

async function isAdmin(request, kv){
  // check header token
  const token = request.headers.get('x-adm-token') || request.headers.get('X-ADM-TOKEN');
  if(token){
    const v = await kv.get('admtoken:'+token);
    return !!v;
  }
  // fallback to cookie (legacy)
  const cookie = request.headers.get('cookie') || '';
  if(cookie.includes('adm=1')) return true;
  return false;
}

/* --------- GET handler (EdgeOne Pages style) --------- */
export async function onRequestGet({ request, env, params }) {
  const url = new URL(request.url);
  const pathname = url.pathname || '/';
  const kv = getKV(env);
  // If request is for /api/*
  if(pathname.startsWith('/api/')){
    if(!kv) return jsonResponse({ ok:false, error:'KV namespace not bound. Bind KV to variable name wj or WJ.' }, 500);
    if(request.method === 'OPTIONS'){
      return new Response(null, { status: 204, headers: { 'Access-Control-Allow-Origin':'*', 'Access-Control-Allow-Methods':'GET,POST,DELETE,OPTIONS', 'Access-Control-Allow-Headers':'Content-Type,X-ADM-TOKEN' }});
    }
    const parts = pathname.replace(/^\/api\//,'').split('/').filter(Boolean);
    // GET /api/dirs
    if(parts.length===1 && parts[0]==='dirs'){
      try{
        const dirs = await getDirs(kv);
        return jsonResponse({ ok:true, dirs });
      }catch(e){
        return jsonResponse({ ok:false, error:'failed to read dirs' }, 500);
      }
    }
    // GET /api/dirs/:name
    if(parts[0]==='dirs' && parts[1] && parts.length===2){
      const name = sanitizeName(parts[1]);
      try{
        const imgs = await getDirImages(kv,name);
        return jsonResponse({ ok:true, name, images: imgs });
      }catch(e){
        return jsonResponse({ ok:false, error:'failed to read dir images' }, 500);
      }
    }
    return jsonResponse({ ok:false, error:'API not found' }, 404);
  }

  // serve a small index for '/'
  if(pathname === '/' || pathname === '/index.html'){
    const html = await (async()=>{
      try{
        // If static index exists in Pages static assets, let Pages serve it.
        // But as a fallback we return a tiny HTML.
        return `<html><head><meta charset="utf-8"><title>Random Image Pages</title></head><body><h2>Random Image Pages</h2><p>Use /admin to manage (set ADMIN_PASSWORD env var).</p><p>Visit /{directory} to redirect to a random image.</p></body></html>`;
      }catch(e){ return '<html><body>Random Image Pages</body></html>'; }
    })();
    return htmlResponse(html);
  }

  // If path looks like a directory /dir -> redirect to random image
  const maybeDir = pathname.replace(/^\\//,'').replace(/\\/$/,'');
  if(maybeDir){
    if(!kv) return new Response('directory not found or empty', { status: 404 });
    const name = sanitizeName(maybeDir);
    const imgs = await getDirImages(kv,name);
    if(!imgs || imgs.length===0){
      return new Response('directory not found or empty', { status: 404 });
    }
    const idx = Math.floor(Math.random() * imgs.length);
    const urlTo = imgs[idx];
    return Response.redirect(urlTo, 302);
  }

  return new Response('not found', { status: 404 });
}

/* --------- POST handler --------- */
export async function onRequestPost({ request, env, params }) {
  const url = new URL(request.url);
  const pathname = url.pathname || '/';
  const kv = getKV(env);
  if(!pathname.startsWith('/api/')) return jsonResponse({ ok:false, error:'POST only supports /api/*' }, 400);
  if(!kv) return jsonResponse({ ok:false, error:'KV namespace not bound. Bind KV to variable name wj or WJ.' }, 500);

  const parts = pathname.replace(/^\/api\//,'').split('/').filter(Boolean);

  // POST /api/dirs (create) - admin required
  if(parts.length===1 && parts[0]==='dirs'){
    if(!(await isAdmin(request,kv))) return jsonResponse({ ok:false, error:'unauthorized' }, 401);
    try{
      const body = await request.json();
      if(!body.name) return jsonResponse({ ok:false, error:'missing name' }, 400);
      const name = sanitizeName(body.name);
      if(!name) return jsonResponse({ ok:false, error:'invalid name' }, 400);
      const dirs = await getDirs(kv);
      if(dirs.includes(name)) return jsonResponse({ ok:false, error:'dir exists' }, 400);
      dirs.push(name);
      await setDirs(kv, dirs);
      await setDirImages(kv,name,[]);
      return jsonResponse({ ok:true, name });
    }catch(e){
      return jsonResponse({ ok:false, error:'invalid json body' }, 400);
    }
  }

  // POST /api/dirs/:name/images - add image (admin)
  if(parts[0]==='dirs' && parts[1] && parts[2]==='images'){
    if(!(await isAdmin(request,kv))) return jsonResponse({ ok:false, error:'unauthorized' }, 401);
    try{
      const name = sanitizeName(parts[1]);
      const body = await request.json();
      if(!body.url) return jsonResponse({ ok:false, error:'missing url' }, 400);
      const imgs = await getDirImages(kv,name);
      imgs.push(body.url);
      await setDirImages(kv,name,imgs);
      return jsonResponse({ ok:true, name, added: body.url, images: imgs });
    }catch(e){
      return jsonResponse({ ok:false, error:'invalid json body' }, 400);
    }
  }

  // POST /api/login - return token
  if(parts.length===1 && parts[0]==='login'){
    try{
      const body = await request.json();
      if(!body.password) return jsonResponse({ ok:false, error:'missing password' }, 400);
      const adminPwd = (env && (env.ADMIN_PASSWORD || env.ADMIN_PASS)) || null;
      if(!adminPwd) return jsonResponse({ ok:false, error:'Admin password not configured. Set ADMIN_PASSWORD in environment.' }, 500);
      if(body.password === adminPwd){
        const token = (Math.random().toString(36).slice(2) + Date.now().toString(36));
        await kv.put('admtoken:'+token, '1');
        return jsonResponse({ ok:true, token });
      }else{
        return jsonResponse({ ok:false, error:'bad password' }, 401);
      }
    }catch(e){
      return jsonResponse({ ok:false, error:'invalid json body' }, 400);
    }
  }

  return jsonResponse({ ok:false, error:'API not found' }, 404);
}

/* --------- DELETE handler --------- */
export async function onRequestDelete({ request, env, params }) {
  const url = new URL(request.url);
  const pathname = url.pathname || '/';
  const kv = getKV(env);
  if(!pathname.startsWith('/api/')) return jsonResponse({ ok:false, error:'DELETE only supports /api/*' }, 400);
  if(!kv) return jsonResponse({ ok:false, error:'KV namespace not bound. Bind KV to variable name wj or WJ.' }, 500);

  const parts = pathname.replace(/^\/api\//,'').split('/').filter(Boolean);

  // DELETE /api/dirs/:name (delete directory)
  if(parts[0]==='dirs' && parts[1] && parts.length===2){
    if(!(await isAdmin(request,kv))) return jsonResponse({ ok:false, error:'unauthorized' }, 401);
    const name = sanitizeName(parts[1]);
    const dirs = await getDirs(kv);
    const idx = dirs.indexOf(name);
    if(idx !== -1) dirs.splice(idx,1);
    await setDirs(kv, dirs);
    await kv.delete('dir:'+name);
    return jsonResponse({ ok:true, deleted: name });
  }

  // DELETE /api/dirs/:name/images (remove image)
  if(parts[0]==='dirs' && parts[1] && parts[2]==='images'){
    if(!(await isAdmin(request,kv))) return jsonResponse({ ok:false, error:'unauthorized' }, 401);
    try{
      const body = await request.json();
      if(!body.url) return jsonResponse({ ok:false, error:'missing url' }, 400);
      const name = sanitizeName(parts[1]);
      let imgs = await getDirImages(kv,name);
      imgs = imgs.filter(u=>u !== body.url);
      await setDirImages(kv,name,imgs);
      return jsonResponse({ ok:true, name, removed: body.url, images: imgs });
    }catch(e){
      return jsonResponse({ ok:false, error:'invalid json body' }, 400);
    }
  }

  return jsonResponse({ ok:false, error:'API not found' }, 404);
}
