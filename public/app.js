(async function(){
  function el(t){console.log(t);}
  // test ping
  try{
    const r = await fetch('/api/ping');
    const t = await r.text();
    try{ const j = JSON.parse(t); console.log('api/ping JSON:', j); }catch(e){ console.warn('api/ping not JSON:', t); alert('api/ping returned non-JSON. See console.'); }
  }catch(e){ console.error('ping failed', e); alert('网络错误：无法请求 /api/ping'); }
})();