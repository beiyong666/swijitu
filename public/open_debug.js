async function openDirDebug(name){
  try{
    const res = await fetch('/api/list?dir='+encodeURIComponent(name));
    const text = await res.text();
    let j;
    try{ j = JSON.parse(text); }catch(e){ alert('非 JSON 响应:\n' + text); console.error('Raw response:', text); return; }
    if(!j.ok) alert('服务器返回错误: ' + (j.error || JSON.stringify(j)) + '\nraw: ' + (j.raw || 'null') + '\nparseError: ' + (j.parseError || 'none'));
    else {
      console.log('Images:', j.images);
      // show images in a simple popup
      const html = '<h3>Images in ' + name + '</h3>' + (j.images && j.images.length ? j.images.map(u=>'<div><a href="'+u+'" target="_blank">'+u+'</a></div>').join('') : '<div>(no images)</div>');
      const w = window.open('about:blank','dirview');
      w.document.write(html);
    }
  }catch(e){ alert('Network error: '+e.message); }
}