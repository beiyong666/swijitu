async function api(path, opts) {
  const res = await fetch(path, opts);
  const txt = await res.text();
  try { return JSON.parse(txt); } catch(e) { return txt; }
}

document.getElementById('createDir').addEventListener('click', async () => {
  const dir = document.getElementById('newDir').value.trim();
  if (!dir) return alert('enter dir');
  const r = await api('/api/dir', { method: 'POST', headers: {'content-type':'application/json'}, body: JSON.stringify({dir})});
  document.getElementById('createResult').textContent = JSON.stringify(r);
});

document.getElementById('loadDir').addEventListener('click', async () => {
  const dir = document.getElementById('selDir').value.trim();
  if (!dir) return alert('enter dir');
  const r = await api(`/api/dir?dir=${encodeURIComponent(dir)}`);
  if (r.ok) {
    document.getElementById('dirInfo').textContent = `Found ${r.items.length} images.`;
    showImages(dir, r.items);
  } else {
    document.getElementById('dirInfo').textContent = JSON.stringify(r);
    document.getElementById('uploader').style.display = 'none';
  }
});

document.getElementById('deleteDir').addEventListener('click', async () => {
  const dir = document.getElementById('selDir').value.trim();
  if (!dir) return alert('enter dir');
  if (!confirm('Delete directory and its images?')) return;
  const r = await api(`/api/dir?dir=${encodeURIComponent(dir)}`, { method: 'DELETE' });
  document.getElementById('dirInfo').textContent = JSON.stringify(r);
  document.getElementById('uploader').style.display = 'none';
});

document.getElementById('addImage').addEventListener('click', async () => {
  const dir = document.getElementById('curDir').textContent;
  const url = document.getElementById('imageUrl').value.trim();
  if (!url) return alert('enter url');
  const r = await api('/api/upload', { method: 'POST', headers: {'content-type':'application/json'}, body: JSON.stringify({dir, url})});
  if (r.ok) showImages(dir, r.items);
  else alert(JSON.stringify(r));
});

document.getElementById('testRandom').addEventListener('click', () => {
  const dir = document.getElementById('testDir').value.trim();
  if (!dir) return alert('enter dir');
  const u = `/r/${encodeURIComponent(dir)}`;
  window.open(u, '_blank');
});

function showImages(dir, items) {
  document.getElementById('uploader').style.display = 'block';
  document.getElementById('curDir').textContent = dir;
  const ul = document.getElementById('imagesList');
  ul.innerHTML = '';
  items.forEach(url => {
    const li = document.createElement('li');
    const img = document.createElement('img');
    img.src = url;
    img.width = 120;
    img.alt = url;
    const btn = document.createElement('button');
    btn.textContent = 'Delete';
    btn.style.marginLeft = '8px';
    btn.addEventListener('click', async () => {
      if (!confirm('Delete this image?')) return;
      const r = await api('/api/image', { method: 'DELETE', headers: {'content-type':'application/json'}, body: JSON.stringify({dir, url})});
      if (r.ok) showImages(dir, r.items);
      else alert(JSON.stringify(r));
    });
    li.appendChild(img);
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.textContent = url;
    a.style.marginLeft = '8px';
    li.appendChild(a);
    li.appendChild(btn);
    ul.appendChild(li);
  });
}