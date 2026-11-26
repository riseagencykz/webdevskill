(()=>{
const TAGS=['utm_source','utm_medium','utm_campaign','utm_content','utm_term'];
const KEY='dolomiti.visit.v1';
const ADS_KEY='dolomiti.google-ads.v1';
const CLICK_KEYS=['gclid','gbraid','wbraid'];
const JOURNEY_KEY='dolomiti.journey.v2';
const UUID=/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i;
const opaque=value=>typeof value==='string'&&/^[A-Za-z0-9._~=-]{1,2048}$/.test(value)?value:undefined;
const clickId=value=>typeof value==='string'&&/^[A-Za-z0-9._~-]{1,512}$/.test(value)?value:undefined;
const CRM='https://crm.dolomiti.kz/api/site-whatsapp';
const siteUrl=value=>{const u=new URL(value);return 'https://dolomiti.kz'+u.pathname;};
function captureVisit(href,referrer,storage,now=Date.now(),persistent=storage){
  const u=new URL(href);let previous=null;
  try{previous=JSON.parse(storage.getItem(KEY));}catch{}
  const tags=Object.fromEntries(TAGS.filter(k=>u.searchParams.get(k)).map(k=>[k,u.searchParams.get(k).slice(0,200)]));
  const freshIds=Object.fromEntries(CLICK_KEYS.flatMap(k=>clickId(u.searchParams.get(k))?[[k,u.searchParams.get(k)]]:[]));
  const oppref=opaque(u.searchParams.get('oppref'));
  const clickSource=oppref?'chatgpt_ads':clickId(u.searchParams.get('yclid'))?'yandex_ads':Object.keys(freshIds).length?'google_ads':'';
  let ads=null;try{ads=JSON.parse(persistent.getItem(ADS_KEY));}catch{}
  if(Object.keys(freshIds).length){
    ads={...freshIds,ad_click_at:new Date(now).toISOString(),expires:now+90*86400000};
    try{persistent.setItem(ADS_KEY,JSON.stringify(ads));}catch{}
  }
  if(!ads||!Number.isFinite(ads.expires)||ads.expires<=now||ads.expires>now+90*86400000)ads=null;
  const valid=previous && Number.isFinite(previous.expires) && previous.expires>now && typeof previous.landing_page==='string';
  let origin='';try{const r=new URL(referrer);if(['https:','http:'].includes(r.protocol)&&!['dolomiti.kz','www.dolomiti.kz'].includes(r.hostname))origin=r.origin;}catch{}
  const sameCampaign=valid&&Object.entries(tags).every(([k,v])=>previous[k]===v)&&(!oppref||previous.oppref===oppref)&&(!clickSource||previous.click_source===clickSource);
  const reuse=valid&&!origin&&(!Object.keys(tags).length&&!clickSource||sameCampaign);
  const visit=reuse ? previous : {landing_page:siteUrl(href),referrer:origin,...tags,...(clickSource?{click_source:clickSource}:{}),...(oppref?{oppref}:{}),session_id:crypto.randomUUID(),visited_at:new Date(now).toISOString()};
  let journey=null;try{journey=JSON.parse(persistent.getItem(JOURNEY_KEY));}catch{}
  if(!journey||!UUID.test(journey.visitor_id)||!Number.isFinite(journey.expires)||journey.expires<=now)journey={visitor_id:crypto.randomUUID(),expires:now+90*86400000};
  visit.visitor_id=journey.visitor_id;
  visit.session_id=UUID.test(visit.session_id)?visit.session_id:crypto.randomUUID();
  visit.visited_at=visit.visited_at||new Date(now).toISOString();
  try{persistent.setItem(JOURNEY_KEY,JSON.stringify(journey));}catch{}
  visit.expires=now+30*60000;
  try{storage.setItem(KEY,JSON.stringify(visit));}catch{}
  const fields={landing_page:visit.landing_page,referrer:visit.referrer||''};
  for(const key of TAGS)if(typeof visit[key]==='string')fields[key]=visit[key].slice(0,200);
  if(['google_ads','yandex_ads','chatgpt_ads'].includes(visit.click_source))fields.click_source=visit.click_source;
  Object.assign(fields,{visitor_id:visit.visitor_id,session_id:visit.session_id,visited_at:visit.visited_at});
  if(opaque(visit.oppref))fields.oppref=visit.oppref;
  if(ads){for(const key of CLICK_KEYS)if(clickId(ads[key]))fields[key]=ads[key];fields.ad_click_at=ads.ad_click_at;}
  return fields;
}
function buildWhatsAppLink(href,visit,currentPage){
  let u;try{u=new URL(href);}catch{return null;}
  const tracked=u.origin+u.pathname===CRM;
  if(!tracked && !(u.protocol==='https:' && u.hostname==='wa.me' && !u.port && !u.username && !u.password && /^\/77775555884\/?$/.test(u.pathname)))return null;
  const target=new URL(CRM);
  target.search=new URLSearchParams({...visit,page:siteUrl(currentPage),text:(u.searchParams.get('text')||'Здравствуйте! Интересуют печи Dolomiti').slice(0,1000)}).toString();
  return target.href;
}

// Uses captureVisit/buildWhatsAppLink from attribution.js in the generated classic bundle.
function leadPixelEvent(reply, payload, allowed) {
  if (!allowed || payload.analytics_test === '1' || reply?.test || reply?.ok !== true || !/^DLM-[a-f0-9]{32}$/.test(reply.reference || '')) return null;
  return ['measure', 'lead_created', {type:'customer_action'}, {event_id:'lead-'+reply.reference.slice(4)}];
}

function installMarketingBridge() {
  const memory = () => { const m=new Map();return {getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k)}; };
  let tab=memory(),persistent=memory();
  try { tab=window.sessionStorage; } catch {}
  try { persistent=window.localStorage; } catch {}
  const read=k=>{try{return persistent.getItem(k);}catch{return null;}};
  const write=(k,v)=>{try{persistent.setItem(k,v);}catch{}};
  let consent=read('dolomiti.analytics-consent.v1')==='granted';
  let ads=read('dolomiti.ads-consent.v1')==='granted';
  const test=new URLSearchParams(location.search).get('dlm_test')==='1';
  const visit=captureVisit(location.href,document.referrer,tab,Date.now(),consent?persistent:tab);
  const fields=()=>({...visit,page:location.origin+location.pathname,analytics_consent:consent,ads_consent:ads,...(test?{analytics_test:'1'}:{})});
  let sent=false;
  const sendVisit=()=>{
    if (!consent || sent) return;
    sent=true;
    void fetch('https://crm.dolomiti.kz/api/site-visits',{method:'POST',credentials:'omit',headers:{'Content-Type':'application/json'},body:JSON.stringify({...fields(),analytics_test:test}),keepalive:true})
      .then(r=>{if(!r.ok)sent=false;}).catch(()=>{sent=false;});
  };
  window.dolomitiAttributionFields=fields;
  window.dolomitiWhatsAppUrl=href=>buildWhatsAppLink(href,fields(),location.href)||href;
  let pixelStarted=false;
  function pixelConsent() {
    if (test) return; // Test traffic must never enter ad conversion reports.
    if (!ads) { if(window.oaiq)window.oaiq('consent',false); return; }
    if (!pixelStarted) {
      if(!window.oaiq){const q=function(){q.q.push(arguments);};q.q=[];window.oaiq=q;
        const script=document.createElement('script');script.async=true;script.src='https://bzrcdn.openai.com/sdk/oaiq.min.js';document.head.append(script);}
      window.oaiq('consent',false);
      window.oaiq('init',{pixelId:'WCCcyo4RZpyWgLFP8M11wK'});
      pixelStarted=true;
    }
    window.oaiq('consent',true);
  }
  const measured=new Set();
  window.dolomitiOpenAILeadConfirmed=(reply,payload)=>{
    const event=leadPixelEvent(reply,payload,ads && payload.ads_consent===true && !test);
    if(!event || measured.has(event[3].event_id))return;
    pixelConsent(); window.oaiq(...event); measured.add(event[3].event_id);
  };
  const panel=document.getElementById('dlm-stat-choice');
  if(panel){
    const addChoice=(label,checked,change)=>{const box=document.createElement('input');box.type='checkbox';box.checked=checked;
      const row=document.createElement('label');row.style.cssText='display:block;margin:8px 0';row.append(box,document.createTextNode(' '+label));panel.append(row);box.onchange=()=>change(box.checked);return box;};
    addChoice('Сохранять историю моих переходов на 90 дней для аналитики Dolomiti',consent,value=>{
      consent=value;write('dolomiti.analytics-consent.v1',value?'granted':'denied');
      try{if(value)persistent.setItem('dolomiti.journey.v2',JSON.stringify({visitor_id:visit.visitor_id,expires:Date.now()+90*86400000}));else{persistent.removeItem('dolomiti.journey.v2');persistent.removeItem('dolomiti.google-ads.v1');}}catch{}
      sendVisit();
    });
    addChoice('Передавать OpenAI сведения о заявке и покупке, сумму и рекламный идентификатор для измерения рекламы ChatGPT',ads,value=>{ads=value;write('dolomiti.ads-consent.v1',value?'granted':'denied');pixelConsent();});
    // New purposes are not enabled by an old Google consent.
    if(read('dolomiti.marketing-notice.v20261125')!=='seen')panel.hidden=false;
    panel.addEventListener('click',e=>{if(e.target.dataset.stat)write('dolomiti.marketing-notice.v20261125','seen');});
  }
  function decorate(a){if(!a)return;const next=window.dolomitiWhatsAppUrl(a.href);if(next!==a.href)a.href=next;}
  document.querySelectorAll('a[href]').forEach(decorate);
  for(const type of ['click','auxclick','contextmenu'])document.addEventListener(type,e=>decorate(e.target.closest?.('a[href]')),true);
  new MutationObserver(records=>{for(const r of records){if(r.type==='attributes')decorate(r.target);for(const n of r.addedNodes){if(n.nodeType!==1)continue;if(n.matches('a[href]'))decorate(n);n.querySelectorAll('a[href]').forEach(decorate);}}}).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['href']});
  sendVisit();pixelConsent();
  window.addEventListener('online',sendVisit);
}

document.addEventListener('DOMContentLoaded',installMarketingBridge);
})();
