const HTML = String.raw`<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>M3U ↔ TXT 转换工具</title>
<style>
*{box-sizing:border-box}body{margin:0;background:#0f172a;color:#e5e7eb;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
.wrap{max-width:1100px;margin:0 auto;padding:28px 18px 50px}.card{background:#111827;border:1px solid #263244;border-radius:18px;padding:22px;box-shadow:0 14px 40px rgba(0,0,0,.18)}
h1{margin:0 0 8px;font-size:28px}.sub{color:#94a3b8;margin-bottom:20px}.row{display:grid;grid-template-columns:1fr 1fr;gap:16px}@media(max-width:800px){.row{grid-template-columns:1fr}}
label{display:block;font-weight:700;margin:0 0 8px}textarea{width:100%;height:360px;resize:vertical;background:#020617;color:#dbeafe;border:1px solid #334155;border-radius:12px;padding:14px;font:13px/1.55 ui-monospace,SFMono-Regular,Menlo,monospace}
.controls{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin:16px 0}.btn{border:0;border-radius:10px;padding:11px 16px;cursor:pointer;font-weight:700}.primary{background:#3b82f6;color:#fff}.secondary{background:#334155;color:#fff}.green{background:#10b981;color:#06281f}.danger{background:#7f1d1d;color:#fff}select,input[type=file]{background:#0b1220;color:#e5e7eb;border:1px solid #334155;border-radius:10px;padding:10px}.status{font-size:13px;color:#94a3b8}.meta{display:flex;gap:16px;flex-wrap:wrap;color:#94a3b8;font-size:13px;margin-top:10px}
small{color:#64748b}.tip{margin-top:18px;padding:14px;background:#0b1220;border:1px solid #233044;border-radius:12px;color:#cbd5e1;font-size:13px;line-height:1.65}code{color:#93c5fd}
.site-footer{display:flex;justify-content:center;margin-top:18px}.github-link{display:inline-flex;align-items:center;justify-content:center;width:42px;height:42px;border:1px solid #334155;border-radius:50%;color:#94a3b8;background:#0b1220;transition:.2s;text-decoration:none}.github-link:hover{color:#fff;border-color:#64748b;transform:translateY(-2px)}.github-link svg{width:22px;height:22px}
</style>
</head>
<body>
<div class="wrap"><div class="card">
<h1>📺 M3U ↔ TXT 转换工具</h1>
<div class="sub">纯 Cloudflare Worker，无数据库；支持粘贴、上传、转换、下载。</div>
<div class="controls">
  <select id="mode"><option value="m3u2txt">M3U → TXT</option><option value="txt2m3u">TXT → M3U</option></select>
  <input id="file" type="file" accept=".m3u,.m3u8,.txt,text/plain,application/vnd.apple.mpegurl">
  <button class="btn secondary" id="loadBtn">读取文件</button>
  <button class="btn primary" id="convertBtn">开始转换</button>
  <button class="btn green" id="downloadBtn">下载结果</button>
  <button class="btn danger" id="clearBtn">清空</button>
</div>
<div class="row">
  <div><label for="input">输入</label><textarea id="input" placeholder="粘贴 M3U 或 TXT 内容…"></textarea></div>
  <div><label for="output">输出</label><textarea id="output" readonly placeholder="转换结果将在这里显示…"></textarea></div>
</div>
<div class="meta"><span id="count">条目：0</span><span id="status">就绪</span></div>
<div class="tip">
  TXT 默认格式：<code>频道名,播放地址</code>；也兼容 <code>频道名|播放地址</code>、<code>频道名=播放地址</code>，以及仅一行一个 URL 的 TXT。<br>
  M3U 输出采用扩展 IPTV 格式：保留 <code>x-tvg-url</code>，并输出 <code>tvg-id</code>、<code>tvg-name</code>、<code>tvg-logo</code>、<code>group-title</code> 等字段。
</div>
</div>
<footer class="site-footer">
  <a class="github-link" href="https://github.com/koolcy/m3u-txt" target="_blank" rel="noopener noreferrer" aria-label="GitHub 仓库">
    <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 .7a12 12 0 0 0-3.79 23.39c.6.11.82-.26.82-.58v-2.03c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.74.08-.74 1.2.09 1.83 1.23 1.83 1.23 1.07 1.83 2.81 1.3 3.49.99.11-.77.42-1.3.76-1.6-2.67-.3-5.47-1.34-5.47-5.93 0-1.31.47-2.38 1.23-3.22-.12-.3-.53-1.52.12-3.17 0 0 1-.32 3.3 1.23a11.4 11.4 0 0 1 6 0c2.29-1.55 3.29-1.23 3.29-1.23.65 1.65.24 2.87.12 3.17.77.84 1.23 1.91 1.23 3.22 0 4.6-2.81 5.62-5.49 5.92.43.37.81 1.1.81 2.22v3.28c0 .32.22.7.83.58A12 12 0 0 0 12 .7Z"/></svg>
  </a>
</footer></div>
<script>
const $=id=>document.getElementById(id);
function setStatus(t){$('status').textContent=t}
function countLines(text){$('count').textContent='条目：'+(text.trim()?text.trim().split(/\n/).filter(x=>x.trim()).length:0)}
$('input').addEventListener('input',()=>setStatus('已修改'));
$('loadBtn').onclick=async()=>{const f=$('file').files[0];if(!f){setStatus('请先选择文件');return} $('input').value=await f.text();countLines($('input').value);setStatus('文件已读取')};
$('convertBtn').onclick=async()=>{const text=$('input').value;if(!text.trim()){setStatus('请输入或上传内容');return} setStatus('转换中…'); try{const r=await fetch('/api/convert',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({mode:$('mode').value,text})});const j=await r.json();if(!r.ok)throw new Error(j.error||'转换失败');$('output').value=j.result;setStatus('转换完成，共 '+j.count+' 条');$('count').textContent='条目：'+j.count}catch(e){setStatus(e.message)}};
$('downloadBtn').onclick=()=>{const text=$('output').value;if(!text){setStatus('没有可下载的结果');return}const ext=$('mode').value==='m3u2txt'?'txt':'m3u';const blob=new Blob([text],{type:'text/plain;charset=utf-8'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='converted.'+ext;a.click();URL.revokeObjectURL(a.href)};
$('clearBtn').onclick=()=>{$('input').value='';$('output').value='';$('file').value='';$('count').textContent='条目：0';setStatus('已清空')};
</script>
</body></html>`;

function esc(value){return String(value ?? '').replace(/\\/g,'\\\\').replace(/"/g,'\\"').replace(/\r?\n/g,' ') }
function unquote(v){return v.replace(/^"|"$/g,'').trim()}
function parseAttrs(s){
  const attrs={};
  const re=/([\w-]+)=(?:"([^"]*)"|([^\s]+))/g; let m;
  while((m=re.exec(s))) attrs[m[1]]=m[2]??m[3]??'';
  return attrs;
}

function parseM3U(text){
  const lines=text.replace(/^\uFEFF/,'').split(/\r?\n/);
  const items=[]; let pending=null;
  let xTvgUrl='';
  const header=lines.find(x=>/^#EXTM3U(?:\s|$)/i.test(x.trim()));
  if(header){ const m=header.match(/x-tvg-url=(?:"([^"]*)"|([^\s]+))/i); xTvgUrl=(m?.[1]??m?.[2]??'').trim(); }
  for(let i=0;i<lines.length;i++){
    const line=lines[i].trim();
    if(!line) continue;
    if(/^#EXTINF:/i.test(line)){
      const comma=line.indexOf(',');
      const head=comma>=0?line.slice(0,comma):line;
      const name=comma>=0?line.slice(comma+1).trim():'';
      const durMatch=head.match(/^#EXTINF:\s*(-?\d+(?:\.\d+)?)/i);
      const attrs=parseAttrs(head);
      pending={duration:durMatch?durMatch[1]:'-1',name:name||attrs['tvg-name']||'',attrs};
      continue;
    }
    if(line.startsWith('#')) continue;
    const url=line;
    if(pending){items.push({...pending,url});pending=null}
    else items.push({duration:'-1',name:'',attrs:{},url});
  }
  return {items,xTvgUrl};
}

function parseTXT(text){
  const lines=text.replace(/^\uFEFF/,'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
  const items=[];
  for(const line of lines){
    if(line.startsWith('#')) continue;
    let name='',url='';
    const sep=line.indexOf(',');
    const sepPipe=line.indexOf('|');
    const sepEq=line.indexOf('=');
    let p=-1;
    if(sep>=0)p=sep; else if(sepPipe>=0)p=sepPipe; else if(sepEq>=0 && !/^https?:\/\//i.test(line.slice(0,sepEq)))p=sepEq;
    if(p>=0){name=line.slice(0,p).trim();url=line.slice(p+1).trim()}else if(/^https?:\/\//i.test(line)){url=line;name=''}else{continue}
    if(url) items.push({duration:'-1',name,attrs:{},url});
  }
  return items;
}

function toTXT(items){
  return items.map(x=>{
    const name=(x.name||x.attrs?.['tvg-name']||'未命名频道').replace(/[\r\n,]/g,' ');
    return name+','+x.url;
  }).join('\n')+'\n';
}
function toM3U(items, xTvgUrl='https://11.112114.xyz/pp.xml'){
  const out=[xTvgUrl ? `#EXTM3U x-tvg-url="${esc(xTvgUrl)}"` : '#EXTM3U'];
  for(const x of items){
    const attrs=x.attrs||{};
    const keys=['tvg-id','tvg-name','tvg-logo','tvg-language','tvg-country','group-title'];
    const attrText=keys.filter(k=>attrs[k]!==undefined && attrs[k]!==null && attrs[k]!=='').map(k=>`${k}="${esc(attrs[k])}"`).join(' ');
    const dur=x.duration||'-1';
    const name=(x.name||attrs['tvg-name']||'未命名频道').replace(/[\r\n]/g,' ');
    out.push('#EXTINF:'+dur+(attrText?' '+attrText:'')+','+name);
    out.push(x.url);
  }
  return out.join('\n')+'\n';
}

async function convert(mode,text){
  let items, xTvgUrl='';
  if(mode==='m3u2txt'){
    const parsed=parseM3U(text);
    items=parsed.items;
    xTvgUrl=parsed.xTvgUrl;
  }else{
    items=parseTXT(text);
  }
  if(!items.length) throw new Error('没有识别到有效频道条目');
  return {result:mode==='m3u2txt'?toTXT(items):toM3U(items,xTvgUrl||'https://11.112114.xyz/pp.xml'),count:items.length};
}

export default {
  async fetch(request){
    const url=new URL(request.url);
    if(request.method==='GET' && url.pathname==='/') return new Response(HTML,{headers:{'content-type':'text/html;charset=UTF-8'}});
    if(request.method==='POST' && url.pathname==='/api/convert'){
      try{
        const body=await request.json();
        if(!body || !['m3u2txt','txt2m3u'].includes(body.mode) || typeof body.text!=='string') return Response.json({error:'参数错误'}, {status:400});
        if(body.text.length>20*1024*1024) return Response.json({error:'单次文本限制 20MB'}, {status:413});
        const data=await convert(body.mode,body.text);
        return Response.json(data,{headers:{'cache-control':'no-store'}});
      }catch(e){return Response.json({error:e?.message||'转换失败'},{status:400})}
    }
    return new Response('Not Found',{status:404});
  }
};
