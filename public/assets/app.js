(() => {
  "use strict";

  let data = window.DASH_DATA;
  const $ = (id) => document.getElementById(id);
  const state = { view:"general", month:"Ago", skill:"all", form:"all", supervisor:"all", search:"", criteriaDimension:"all", specialPage:1, specialPageSize:50, qualitySkillPage:1, qualitySkillPageSize:10, criteriaPage:1, criteriaPageSize:10, surveyPage:1, surveyPageSize:25, surveyQuartile:"all", fgPage:1, fgPageSize:10, operatorPage:1, operatorPageSize:10, operatorStatus:"all", sort:{key:"quality",direction:"asc"} };
  const palette=["#16d9f5","#9254ff","#ff526d","#15e2ac","#ffc13d","#6ea8d8","#b4c6d4"];
  const monthNames={Jan:"JANEIRO",Fev:"FEVEREIRO",Mar:"MARÇO",Abr:"ABRIL",Mai:"MAIO",Jun:"JUNHO",Jul:"JULHO",Ago:"AGOSTO",Set:"SETEMBRO",Out:"OUTUBRO",Nov:"NOVEMBRO",Dez:"DEZEMBRO"};
  const monthOrder={Jan:1,Fev:2,Mar:3,Abr:4,Mai:5,Jun:6,Jul:7,Ago:8,Set:9,Out:10,Nov:11,Dez:12};
  const viewHeaders={
    general:{eyebrow:"",title:"Painel Geral",subtitle:"Uma visão completa da qualidade para decisões mais assertivas.",icon:"chart"},
    quality:{eyebrow:"",title:"Painel de Qualidade",subtitle:"Monitorias, itens aferidos e desempenho da operação por qualidade.",icon:"chart"},
    survey:{eyebrow:"",title:"Pesquisa ISC",subtitle:"Satisfação do cidadão e resultados da pesquisa por operador, supervisão e quartil.",icon:"survey"},
    fg:{eyebrow:"",title:"Falta Grave",subtitle:"Ocorrências críticas, motivos, origens e operadores com maior incidência.",icon:"alert"},
    comparison:{eyebrow:"",title:"Comparativo Mensal",subtitle:"Evolução dos principais indicadores ao longo dos meses.",icon:"trend"},
    operators:{eyebrow:"",title:"Painel de Operadores",subtitle:"Desempenho individual, quartis, metas e acompanhamento operacional.",icon:"users"},
    admin:{eyebrow:"",title:"Administração",subtitle:"Gestão de importações, atualização do painel e configurações do ambiente.",icon:"upload"},
    special:{eyebrow:"",title:"Análises Especiais",subtitle:"",icon:"chart"}
  };

  const normalize=(value)=>String(value||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
  const repairText=(value="")=>String(value)
    .replace(/CONFIRMA\?\?O/gi,"CONFIRMAÇÃO")
    .replace(/AUTOM\?TICO/gi,"AUTOMÁTICO")
    .replace(/POPULA\?\?O/gi,"POPULAÇÃO")
    .replace(/EDUCA\?\?O/gi,"EDUCAÇÃO")
    .replace(/CAL\?ADAS/gi,"CALÇADAS")
    .replace(/POLUI\?\?O/gi,"POLUIÇÃO")
    .replace(/CORRE\?\?O/gi,"CORREÇÃO")
    .replace(/CRIAN\?A/gi,"CRIANÇA");
  const escapeHtml=(value)=>repairText(value??"").replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
  const shorten=(value,max=52)=>{value=String(value||"");return value.length>max?value.slice(0,max-1)+"…":value;};
  const sum=(items,fn=(x)=>x)=>items.reduce((total,item)=>total+(+fn(item)||0),0);
  const average=(items)=>items.length?sum(items)/items.length:NaN;
  const fmtInt=(value)=>Math.round(value||0).toLocaleString("pt-BR");
  const fmtPct=(value)=>Number.isFinite(value)?`${value.toLocaleString("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:2})}%`:"—";
  const fmtTime=(value)=>{if(!Number.isFinite(value)||value<=0)return"—";const total=Math.round(value),h=Math.floor(total/3600),m=Math.floor((total%3600)/60),s=total%60;return h?`${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`:`${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;};
  const fmtTimeFull=(value)=>{if(!Number.isFinite(value)||value<=0)return"—";const total=Math.round(value),h=Math.floor(total/3600),m=Math.floor((total%3600)/60),s=total%60;return`${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;};
  const weighted=(items,valueKey="tma",weightKey="calls")=>{const weight=sum(items,x=>x[weightKey]);return weight?sum(items,x=>(+x[valueKey]||0)*(+x[weightKey]||0))/weight:NaN;};
  const qualityTarget=()=>Number(data.meta?.qualityTarget)||90;
  const satisfactionTarget=()=>Number(data.meta?.satisfactionTarget)||90;
  const fgLimit=()=>{const value=Number(data.meta?.fgLimit??data.meta?.faltaGraveLimit??50);return Number.isFinite(value)&&value>0?value:50;};
  const metricClass=(value)=>!Number.isFinite(value)?"":value>=95?"metric-good":value>=90?"metric-warn":"metric-danger";
  const performanceColor=(value)=>!Number.isFinite(value)?"":value>=95?"green":value>=90?"gold":"red";
  const monthNumber=(m)=>monthOrder[m]||(/^\d{4}-(\d{2})$/.test(m)?Number(m.slice(5)):99);
  const monthYear=(m)=>/^\d{4}-\d{2}$/.test(m)?Number(m.slice(0,4)):2026;
  const monthLabel=(m)=>monthNames[m]?`${monthNames[m]}/2026`:/^\d{4}-\d{2}$/.test(m)?new Intl.DateTimeFormat("pt-BR",{month:"long",year:"numeric",timeZone:"UTC"}).format(new Date(`${m}-01T00:00:00Z`)).toUpperCase():m;
  const monthShort=(m)=>monthNames[m]?monthNames[m].slice(0,3):/^\d{4}-\d{2}$/.test(m)?new Intl.DateTimeFormat("pt-BR",{month:"short",timeZone:"UTC"}).format(new Date(`${m}-01T00:00:00Z`)).replace(".","").toUpperCase():String(m).slice(0,3).toUpperCase();
  const sortMonths=(values)=>[...values].sort((a,b)=>monthYear(a)-monthYear(b)||monthNumber(a)-monthNumber(b));
  const mode=(items,key)=>{const counts=new Map();items.forEach(x=>{const v=x[key]||"Não informado";counts.set(v,(counts.get(v)||0)+1);});return [...counts].sort((a,b)=>b[1]-a[1])[0]?.[0]||"—";};
  const iconSvg=(name)=>`<svg aria-hidden="true"><use href="#icon-${name}"></use></svg>`;
  const tmaTargetFor=(monthValue)=>{const official2026={Jul:231,Ago:228};if(official2026[monthValue])return official2026[monthValue];const row=(Array.isArray(data.tmaTargets)?data.tmaTargets:[]).find(x=>x.m===monthValue),value=Number(row?.target??data.meta?.tmaTargets?.[monthValue]);return Number.isFinite(value)?value:NaN;};

  function rowMatches(row,{ignoreMonth=false,ignoreSkill=false,ignoreForm=false,ignoreSearch=false}={}){
    if(!ignoreMonth&&state.month!=="all"&&row.m!==state.month)return false;
    if(!ignoreSkill&&state.skill!=="all"&&row.skill!==state.skill)return false;
    if(!ignoreForm&&state.form!=="all"&&row.form!==state.form)return false;
    if(state.supervisor!=="all"&&row.supervisor!==state.supervisor)return false;
    if(!ignoreSearch&&state.search){const hay=normalize(`${row.operator||""} ${row.re||""}`);if(!hay.includes(normalize(state.search)))return false;}
    return true;
  }

  function filtered(forMonth=null){
    const directOptions=forMonth?{ignoreMonth:true}:{};
    const monitoring=data.monitoring.filter(row=>rowMatches(row,directOptions)&&(forMonth?row.m===forMonth:true));
    const allowedRe=new Set(monitoring.map(x=>x.re).filter(Boolean));
    const constrained=state.skill!=="all"||state.form!=="all";
    const related=(row)=>rowMatches(row,{...directOptions,ignoreSkill:true,ignoreForm:true})&&(forMonth?row.m===forMonth:true)&&(!constrained||allowedRe.has(row.re));
    const criteria=data.criteria.filter(row=>rowMatches(row,{...directOptions,ignoreSearch:true})&&(forMonth?row.m===forMonth:true));
    const satisfaction=data.satisfaction.filter(related);
    const tma=data.tma.filter(related);
    const skillTma=(data.skillTma||[]).filter(row=>rowMatches(row,{...directOptions,ignoreForm:true,ignoreSearch:true})&&(forMonth?row.m===forMonth:true));
    return{monitoring,criteria,satisfaction,tma,skillTma};
  }

  function questionCounts(items,question=null){
    const counts=[0,0,0,0,0];
    items.forEach(item=>{const questions=question?[question]:["p1","p2","p3"];questions.forEach(q=>(item[q]||[]).forEach((v,i)=>counts[i]+=+v||0));});
    return counts;
  }
  function iscFromCounts(counts){const total=sum(counts);return total?(counts[3]+counts[4])/total*100:NaN;}
  function isc(items,question=null){return iscFromCounts(questionCounts(items,question));}
  function quartile(value){if(!Number.isFinite(value))return null;if(value>=90)return 1;if(value>=80)return 2;if(value>=60)return 3;return 4;}
  function quartileStats(values){
    return[1,2,3,4].map(q=>{const rows=values.filter(x=>quartile(x.value)===q);return{q,count:rows.length,average:average(rows.map(x=>x.value)),range:q===1?"90% a 100%":q===2?"80% a 89,99%":q===3?"60% a 79,99%":"Abaixo de 60%"};});
  }

  function buildOperators(f){
    const map=new Map();
    const get=(row)=>{const key=row.re||normalize(row.operator);if(!map.has(key))map.set(key,{re:row.re||"",operator:row.operator||"",supervisor:row.supervisor||"",qualitySum:0,evaluations:0,fg:0,complaints:0,sat:{p1:[0,0,0,0,0],p2:[0,0,0,0,0],p3:[0,0,0,0,0]},calls:0,tmaWeighted:0});const item=map.get(key);item.operator||=row.operator||"";item.supervisor||=row.supervisor||"";return item;};
    f.monitoring.forEach(row=>{const item=get(row);if(Number.isFinite(row.note)){item.qualitySum+=row.note;item.evaluations++;}if(row.fg)item.fg++;if(normalize(row.origin).includes("reclam"))item.complaints++;});
    f.satisfaction.forEach(row=>{const item=get(row);["p1","p2","p3"].forEach(q=>(row[q]||[]).forEach((v,i)=>item.sat[q][i]+=+v||0));});
    f.tma.forEach(row=>{const item=get(row);item.calls+=+row.calls||0;item.tmaWeighted+=(+row.calls||0)*(+row.tma||0);});
    return[...map.values()].map(x=>{const quality=x.evaluations?x.qualitySum/x.evaluations:NaN;const all=[0,0,0,0,0];["p1","p2","p3"].forEach(q=>x.sat[q].forEach((v,i)=>all[i]+=v));const iscValue=iscFromCounts(all),tma=x.calls?x.tmaWeighted/x.calls:NaN,qTarget=qualityTarget(),iTarget=satisfactionTarget();const status=x.fg>0||(Number.isFinite(quality)&&quality<qTarget)||(Number.isFinite(iscValue)&&iscValue<iTarget)?"attention":quality===100&&(!Number.isFinite(iscValue)||iscValue>=iTarget)?"excellent":"good";return{...x,quality,isc:iscValue,tma,status,quartileQuality:quartile(quality),quartileIsc:quartile(iscValue)};});
  }

  function kpi(label,value,foot,icon,{danger=false,meter=null,performance=false}={}){const tone=performance?performanceColor(meter):danger?"red":"";return`<article class="kpi-card ${danger?"danger":""}"><div class="kpi-label"><span>${label}</span><span class="kpi-icon">${iconSvg(icon)}</span></div><div class="kpi-value ${performance?metricClass(meter):""}">${value}</div><div class="kpi-foot">${foot}</div>${meter==null?"":`<div class="meter"><span class="${tone}" style="width:${Math.max(0,Math.min(100,meter))}%"></span></div>`}</article>`;}
  function badge(status){return status==="excellent"?'<span class="badge">Destaque</span>':status==="good"?'<span class="badge warn">Dentro da meta</span>':'<span class="badge danger">Acompanhamento</span>';}
  function quartileBadge(value){const q=Number(value);return Number.isFinite(q)&&q>=1&&q<=4?`<span class="quartile-pill q${q}">${q}º Quartil</span>`:'<span class="quartile-pill none">—</span>';}
  function empty(message="Sem dados para os filtros selecionados."){return`<div class="empty">${message}</div>`;}

  function normalizePageSize(value,fallback){return value==="all"?"all":Math.max(1,Number(value)||fallback);}
  function paginateRows(items,page,size){
    if(size==="all")return{rows:items,page:1,totalPages:1,start:0,end:items.length};
    const per=Math.max(1,Number(size)||10),totalPages=Math.max(1,Math.ceil(items.length/per)),current=Math.min(Math.max(1,Number(page)||1),totalPages),start=(current-1)*per,end=Math.min(start+per,items.length);
    return{rows:items.slice(start,end),page:current,totalPages,start,end};
  }
  function syncPager(prefix,paged,size){
    const sizeEl=$(prefix+"-page-size"),prev=$(prefix+"-prev"),next=$(prefix+"-next"),indicator=$(prefix+"-page-indicator"),input=$(prefix+"-page-input");
    if(sizeEl)sizeEl.value=String(size);if(prev)prev.disabled=paged.page<=1;if(next)next.disabled=paged.page>=paged.totalPages;if(indicator)indicator.textContent=`${paged.page} de ${paged.totalPages}`;if(input){input.max=String(paged.totalPages);input.value=String(paged.page);}
  }
  function resetListPages(){state.specialPage=1;state.qualitySkillPage=1;state.criteriaPage=1;state.surveyPage=1;state.fgPage=1;state.operatorPage=1;}

  function aggregate(items,key,valueKey="note"){
    const map=new Map();items.forEach(x=>{const label=x[key]||"Não informado",row=map.get(label)||{label,count:0,sum:0,valid:0};row.count++;if(Number.isFinite(x[valueKey])){row.sum+=x[valueKey];row.valid++;}map.set(label,row);});
    return[...map.values()].map(x=>({...x,average:x.valid?x.sum/x.valid:NaN}));
  }
  function countBy(items,key){const map=new Map();items.forEach(x=>{const label=x[key]||"Não informado";map.set(label,(map.get(label)||0)+1);});return[...map].map(([label,value])=>({label,value})).sort((a,b)=>b.value-a.value);}
  function aggregateCriteria(items){const map=new Map();items.forEach(x=>{const key=x.criterion||"Não informado",r=map.get(key)||{criterion:key,kind:x.kind,weight:x.weight,hits:0,errors:0,total:0};r.hits+=+x.hits||0;r.errors+=+x.errors||0;r.total+=+x.total||0;r.weight=Math.max(r.weight,+x.weight||0);map.set(key,r);});return[...map.values()].map(x=>({...x,accuracy:x.total?x.hits/x.total*100:NaN,errorRate:x.total?x.errors/x.total*100:NaN})).filter(x=>x.total>0);}

  function renderRank(target,items,{limit=7,format=fmtInt,color="",maxValue=null,performance=false}={}){
    const ordered=[...items].sort((a,b)=>(Number(b.value)||0)-(Number(a.value)||0));
    const list=ordered.slice(0,limit),max=maxValue||Math.max(1,...list.map(x=>+x.value||0));
    const node=$(target);if(!node)return;
    node.innerHTML=list.length?list.map(x=>{const tone=x.color||color||(performance?performanceColor(x.value):"");const valueClass=performance?metricClass(x.value):"";return`<div class="rank-row"><span class="rank-name" title="${escapeHtml(x.label)}">${escapeHtml(shorten(x.label,45))}</span><div class="bar-track"><div class="bar-fill ${tone}" style="width:${Math.max(2,(+x.value||0)/max*100)}%"></div></div><strong class="rank-value ${valueClass}">${format(x.value)}</strong></div>`;}).join(""):empty();
  }

  function render(){
    const f=filtered(),operators=buildOperators(f);
    const months=availableMonths();
    const referenceText=state.view==="comparison"?(months.length?`${monthLabel(months[0])} – ${monthLabel(months.at(-1))}`:"SEM DADOS"):state.month==="all"?"TODOS OS MESES":monthLabel(state.month);
    const updatedText=data.meta?.importedAt?new Date(data.meta.importedAt).toLocaleString("pt-BR"):"Dados carregados";
    $("reference-label").textContent=referenceText;
    $("last-update").textContent=data.meta?.importedAt?`Atualizado neste dispositivo em ${updatedText}`:"Dados carregados do relatório-base";
    if($("general-reference-label"))$("general-reference-label").textContent=referenceText;
    if($("general-last-update"))$("general-last-update").textContent=updatedText;

    const renderSafely=(name,fn)=>{
      try{fn();}
      catch(error){
        console.error(`[MQ] Falha ao renderizar ${name}`,error);
        window.__MQ_RENDER_ERRORS=window.__MQ_RENDER_ERRORS||{};
        window.__MQ_RENDER_ERRORS[name]=String(error?.message||error);
      }
    };
    renderSafely("general",()=>renderGeneral(f,operators));
    renderSafely("quality",()=>renderQuality(f,operators));
    renderSafely("survey",()=>renderSurvey(f));
    renderSafely("fg",()=>renderFg(f));
    renderSafely("comparison",()=>renderComparison());
    renderSafely("operators",()=>renderOperators(operators));
    if($("admin-page-content")?.dataset.ready==="1")renderSafely("admin",()=>renderAdminSummary());
  }
  function renderColumns(target,stats){
    const max=Math.max(1,...stats.map(x=>x.count));
    $(target).innerHTML=stats.map(x=>`<div class="column-item"><span class="column-value">${fmtInt(x.count)}<br><small>${fmtPct(sum(stats,y=>y.count)?x.count/sum(stats,y=>y.count)*100:NaN)}</small></span><div class="column-bar q${x.q}" style="height:${Math.max(3,x.count/max*118)}px"></div><span class="column-label">${x.q}º Quartil<br>${x.range}<br>Média ${fmtPct(x.average)}</span></div>`).join("");
  }

  function renderDonut(target,items,total){
    if(!total){$(target).innerHTML=empty();return;}
    let acc=0;const stops=[];items.forEach((x,i)=>{const start=acc;acc+=x.value/total*100;stops.push(`${palette[i%palette.length]} ${start}% ${acc}%`);});
    $(target).innerHTML=`<div class="donut" style="--segments:conic-gradient(${stops.join(",")})"><strong>${fmtInt(total)}</strong></div><div class="donut-legend">${items.slice(0,7).map((x,i)=>`<div class="legend-row"><i style="background:${palette[i%palette.length]}"></i><span title="${escapeHtml(x.label)}">${escapeHtml(shorten(x.label,28))}</span><strong>${fmtPct(x.value/total*100)}</strong></div>`).join("")}</div>`;
  }

  function renderOriginBars(target,items){
    const rows=[...items].sort((a,b)=>(Number(b.value)||0)-(Number(a.value)||0)).slice(0,6),max=Math.max(1,...rows.map(x=>x.value)),total=sum(rows,x=>x.value);
    if(!rows.length){$(target).innerHTML=empty();return;}
    $(target).innerHTML=`<div class="origin-bar-list">${rows.map((x,i)=>`<div class="origin-bar-row"><div class="origin-bar-head"><strong title="${escapeHtml(x.label)}">${escapeHtml(x.label)}</strong><span>${fmtInt(x.value)} · ${fmtPct(total?x.value/total*100:NaN)}</span></div><div class="origin-bar-horizontal-track"><span class="origin-bar-horizontal-fill c${i+1}" style="width:${Math.max(4,x.value/max*100)}%"></span></div></div>`).join("")}</div>`;
  }

  function generalOriginCategory(origin){const n=normalize(origin);if(n.includes("cronograma"))return"Cronograma";if(n.includes("auditoria"))return"Auditoria";if(n.includes("reclam"))return"Reclamação";if(n.includes("elogio"))return"Elogio";if(n.includes("oficio")||n.includes("carta"))return"Ofício/Carta";return"Outros";}
  function specialCategory(origin){const n=normalize(origin);if(n.includes("reclam"))return"Reclamação";if(n.includes("auditoria cliente"))return"Auditoria Cliente";if(n.includes("auditoria"))return"Auditoria Interna";if(n.includes("elogio"))return"Elogio";if(n.includes("oficio")||n.includes("carta"))return"Ofício/Carta";return null;}
  function procedure(origin){const n=normalize(origin);if(n.includes("nao procedente")||n.includes("improced")||n.includes("improcent"))return"improper";if(n.includes("procedente"))return"proper";return"neutral";}
  function isSpecial(row){return Boolean(specialCategory(row.origin));}

  function renderSplit(target,values){
    const valid=values.filter(x=>Number.isFinite(x.average)&&x.count>0);
    const best=[...valid].sort((a,b)=>b.average-a.average).slice(0,3);
    const worst=[...valid].sort((a,b)=>a.average-b.average).slice(0,3).sort((a,b)=>b.average-a.average);
    const rows=(list)=>`<div class="rank-list">${list.map(x=>`<div class="rank-row"><span class="rank-name" title="${escapeHtml(x.label)}">${escapeHtml(shorten(x.label,36))}</span><div class="bar-track"><div class="bar-fill ${performanceColor(x.average)}" style="width:${Math.max(2,x.average)}%"></div></div><strong class="rank-value ${metricClass(x.average,95)}">${fmtPct(x.average)}</strong></div>`).join("")}</div>`;
    $(target).innerHTML=valid.length?`<div class="split-block"><div class="split-title">Melhor desempenho</div>${rows(best)}</div><div class="split-block negative"><div class="split-title">Maiores oportunidades</div>${rows(worst)}</div>`:empty();
  }

  function renderPodium(target,items,format){const ordered=[...items].sort((a,b)=>(Number(b.value)||0)-(Number(a.value)||0));$(target).innerHTML=ordered.length?ordered.slice(0,3).map((x,i)=>`<div class="podium-entry"><span class="podium-number">${i+1}</span><span class="podium-name" title="${escapeHtml(x.label)}">${escapeHtml(shorten(x.label,31))}</span><div class="bar-track"><div class="bar-fill ${x.color||""}" style="width:${Math.max(4,x.width||70)}%"></div></div><strong class="podium-value">${format(x.value)}</strong></div>`).join(""):empty();}

  function generalMetricSnapshot(f){
    const notes=f.monitoring.map(x=>x.note).filter(Number.isFinite);
    const special=f.monitoring.filter(isSpecial);
    return{
      quality:average(notes),
      monitorias:notes.length,
      isc:isc(f.satisfaction),
      tma:weighted(f.tma),
      fg:f.monitoring.filter(x=>x.fg).length,
      complaints:special.filter(x=>specialCategory(x.origin)==="Reclamação").length,
      compliments:special.filter(x=>specialCategory(x.origin)==="Elogio").length,
      audits:special.filter(x=>["Auditoria Cliente","Auditoria Interna"].includes(specialCategory(x.origin))).length
    };
  }

  function generalDelta(current,previous,{kind="percent",lowerBetter=false}={}){
    if(!Number.isFinite(current)||!Number.isFinite(previous))return{tone:"neutral",text:"Período selecionado",arrow:""};
    const delta=current-previous,improved=lowerBetter?delta<=0:delta>=0;
    let text="";
    if(kind==="pp")text=`${delta>0?"+":""}${delta.toLocaleString("pt-BR",{minimumFractionDigits:1,maximumFractionDigits:1})} p.p.`;
    else if(kind==="seconds")text=`${delta>0?"+":""}${Math.round(delta)}s`;
    else if(previous!==0){const pct=delta/Math.abs(previous)*100;text=`${pct>0?"+":""}${pct.toLocaleString("pt-BR",{minimumFractionDigits:0,maximumFractionDigits:0})}%`;}
    else text=delta===0?"0%":"Novo";
    return{tone:delta===0?"neutral":improved?"positive":"negative",text,arrow:delta===0?"":delta>0?"↑":"↓"};
  }

  function generalSparkline(values,tone=""){
    const clean=(values||[]).map(Number).filter(Number.isFinite);
    if(clean.length<2)return"";
    const width=78,height=24,p=2,min=Math.min(...clean),max=Math.max(...clean),range=Math.max(1,max-min);
    const x=i=>p+i*(width-p*2)/(clean.length-1),y=v=>height-p-(v-min)/range*(height-p*2);
    const points=clean.map((v,i)=>`${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
    const dots=clean.map((v,i)=>`<circle cx="${x(i).toFixed(1)}" cy="${y(v).toFixed(1)}" r="1.25"/>`).join("");
    return`<svg class="general-kpi-sparkline ${tone}" viewBox="0 0 ${width} ${height}" aria-hidden="true"><polyline points="${points}"/>${dots}</svg>`;
  }

  function generalKpi(label,value,icon,{delta=null,foot="",meter=null,tone="",sparkline=null}={}){
    const width=Number.isFinite(meter)?Math.max(0,Math.min(100,meter)):0;
    const spark=Array.isArray(sparkline)?generalSparkline(sparkline,tone):"";
    return`<article class="general-kpi ${tone} ${spark?"has-sparkline":""}">
      <div class="general-kpi-top"><span class="general-kpi-icon">${iconSvg(icon)}</span><span class="general-kpi-label">${label}</span></div>
      <div class="general-kpi-body">
        <div class="general-kpi-copy">
          <div class="general-kpi-main"><strong>${value}</strong>${delta?`<span class="general-kpi-delta ${delta.tone}">${delta.arrow} ${delta.text}</span>`:""}</div>
          <div class="general-kpi-foot">${foot}</div>
        </div>
        ${spark?`<div class="general-kpi-spark-wrap">${spark}</div>`:""}
      </div>
      ${Number.isFinite(meter)?`<div class="general-kpi-meter"><span style="width:${width}%"></span></div>`:""}
    </article>`;
  }

  function generalEvolutionSvg(){
    const months=availableMonths().slice(-8);
    if(!months.length)return empty("Sem histórico mensal disponível.");
    const rows=months.map(m=>({m,...comparisonMetric(m)}));
    const width=900,height=276,p={l:54,r:52,t:28,b:40},pw=width-p.l-p.r,ph=height-p.t-p.b;
    const values=rows.flatMap(x=>[x.quality,x.isc]).filter(Number.isFinite);
    if(!values.length)return empty("Sem histórico mensal disponível.");
    const min=Math.max(0,Math.floor((Math.min(...values,qualityTarget(),satisfactionTarget())-5)/5)*5),max=100;
    const x=i=>p.l+(rows.length===1?pw/2:i*pw/(rows.length-1));
    const y=v=>p.t+(max-v)/(max-min)*ph;
    const pathFor=key=>rows.map((r,i)=>Number.isFinite(r[key])?`${i?"L":"M"}${x(i).toFixed(1)},${y(r[key]).toFixed(1)}`:"").filter(Boolean).join(" ");
    const grid=[0,.25,.5,.75,1].map(r=>{const v=max-(max-min)*r,yy=p.t+ph*r;return`<line x1="${p.l}" y1="${yy}" x2="${width-p.r}" y2="${yy}" class="general-grid-line"/><text x="${p.l-12}" y="${yy+4}" text-anchor="end" class="general-axis-label">${Math.round(v)}%</text>`;}).join("");
    const labels=rows.map((r,i)=>`<text x="${x(i)}" y="${height-12}" text-anchor="middle" class="general-month-label">${monthShort(r.m)}</text>`).join("");
    const dots=(key,cls)=>rows.map((r,i)=>Number.isFinite(r[key])?`<circle cx="${x(i)}" cy="${y(r[key])}" r="4.3" class="${cls}"/>`:"").join("");
    const qTarget=qualityTarget(),iTarget=satisfactionTarget();
    let targets="";
    if(Math.abs(qTarget-iTarget)<.05){
      if(qTarget>=min&&qTarget<=max)targets=`<line x1="${p.l}" y1="${y(qTarget)}" x2="${width-p.r}" y2="${y(qTarget)}" class="general-target-line combined"/><text x="${width-p.r}" y="${y(qTarget)-7}" text-anchor="end" class="general-target-label">Metas ${Math.round(qTarget)}%</text>`;
    }else{
      targets=[
        {v:qTarget,cls:"quality",label:`Meta Qualidade ${Math.round(qTarget)}%`},
        {v:iTarget,cls:"isc",label:`Meta ISC ${Math.round(iTarget)}%`}
      ].filter(t=>t.v>=min&&t.v<=max).map(t=>`<line x1="${p.l}" y1="${y(t.v)}" x2="${width-p.r}" y2="${y(t.v)}" class="general-target-line ${t.cls}"/><text x="${width-p.r}" y="${y(t.v)-7}" text-anchor="end" class="general-target-label ${t.cls}">${t.label}</text>`).join("");
    }
    const last=rows.at(-1);
    const endLabels=[["quality","general-end-label quality"],["isc","general-end-label isc"]].map(([key,cls])=>Number.isFinite(last[key])?`<text x="${width-p.r+5}" y="${y(last[key])+4}" class="${cls}">${Math.round(last[key])}%</text>`:"").join("");
    return`<svg class="general-trend-svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Evolução mensal de Qualidade e ISC">${grid}${targets}<path d="${pathFor("quality")}" class="general-series quality"/><path d="${pathFor("isc")}" class="general-series isc"/>${dots("quality","general-point quality")}${dots("isc","general-point isc")}${labels}${endLabels}</svg>`;
  }
  function renderGeneralQuartiles(operators){
    const values=operators.filter(x=>Number.isFinite(x.quality)).map(x=>({value:x.quality}));
    const stats=quartileStats(values),total=sum(stats,x=>x.count);
    const labels=["Alto desempenho","Bom desempenho","Em desenvolvimento","Atenção"];
    $("general-quartile-overview").innerHTML=stats.map((x,i)=>{
      const pct=total?x.count/total*100:0;
      return`<div class="general-quartile-row q${x.q}">
        <span class="general-quartile-pill">Q${x.q}</span>
        <div class="general-quartile-copy"><strong>${labels[i]}</strong><small>Média ${fmtPct(x.average)}</small></div>
        <div class="general-quartile-track"><span style="width:${pct}%"></span></div>
        <strong class="general-quartile-pct">${Math.round(pct)}%</strong>
        <small class="general-quartile-count">${fmtInt(x.count)} operador${x.count===1?"":"es"}</small>
      </div>`;
    }).join("")||empty();
  }

  function renderGeneralTopOperators(operators){
    const rows=operators.filter(x=>x.evaluations>0&&Number.isFinite(x.quality)).sort((a,b)=>b.quality-a.quality).slice(0,5);
    $("general-top-operators").innerHTML=rows.length?rows.map((x,i)=>{
      const initials=String(x.operator||"?").trim().split(/\s+/).slice(0,2).map(p=>p[0]||"").join("").toUpperCase();
      return`<div class="general-top-row"><span class="general-rank">${i+1}</span><span class="general-avatar">${escapeHtml(initials)}</span><span class="general-operator-name" title="${escapeHtml(x.operator)}">${escapeHtml(shorten(x.operator,28))}</span><strong>${fmtPct(x.quality)}</strong><span class="general-status-dot good"></span></div>`;
    }).join(""):empty();
  }

  function renderGeneralAttention(snapshot,tmaTarget){
    const items=[];
    if(snapshot.fg>0)items.push({tone:"danger",title:`${fmtInt(snapshot.fg)} falta(s) grave(s)`,copy:"Ocorrências críticas registradas no período."});
    if(Number.isFinite(snapshot.isc)&&snapshot.isc<satisfactionTarget())items.push({tone:"danger",title:"ISC abaixo da meta",copy:`${fmtPct(snapshot.isc)} realizado · meta ${fmtPct(satisfactionTarget())}.`});
    if(Number.isFinite(snapshot.tma)&&Number.isFinite(tmaTarget)&&snapshot.tma>tmaTarget)items.push({tone:"warn",title:"TMA acima da meta",copy:`${fmtTime(snapshot.tma)} realizado · meta ${fmtTimeFull(tmaTarget)}.`});
    if(Number.isFinite(snapshot.quality)&&snapshot.quality<qualityTarget())items.push({tone:"warn",title:"Qualidade abaixo da meta",copy:`${fmtPct(snapshot.quality)} realizado · meta ${fmtPct(qualityTarget())}.`});
    if(snapshot.complaints>0)items.push({tone:"warn",title:`${fmtInt(snapshot.complaints)} reclamação(ões)`,copy:"Registros identificados nas análises do período."});
    if(!items.length)items.push({tone:"good",title:"Indicadores sob controle",copy:"Nenhum ponto crítico identificado nos principais indicadores."});
    $("general-attention").innerHTML=items.slice(0,5).map(x=>`<div class="general-attention-row"><span class="general-attention-dot ${x.tone}"></span><div><strong>${escapeHtml(x.title)}</strong><small>${escapeHtml(x.copy)}</small></div></div>`).join("");
  }

  function renderGeneralUpdateSummary(){
    const updated=data.meta?.importedAt?formatAdminDateTime(data.meta.importedAt):"Sem registro";
    const source=repairText(data.meta?.source||"Base consolidada do painel");
    const history=Array.isArray(window.__MQ_IMPORT_HISTORY)?window.__MQ_IMPORT_HISTORY.slice(0,3):[];
    const historyHtml=history.length?`<div class="general-history-mini"><div class="general-history-title"><span>Histórico de importações</span><small>Recentes</small></div>${history.map(item=>`<div class="general-history-row"><span class="history-dot ${normalize(item.status)==="sucesso"?"ok":normalize(item.status)==="erro"?"error":"pending"}"></span><strong title="${escapeHtml(item.file||"")}">${escapeHtml(shorten(item.file||"—",28))}</strong><small>${escapeHtml(formatAdminDateTime(item.dateTime||item.createdAt||item.updatedAt))}</small></div>`).join("")}</div>`:"";
    $("general-update-summary").innerHTML=`<div class="general-update-status"><span class="general-update-check">${iconSvg("check")}</span><div><small>Última atualização</small><strong>${escapeHtml(updated)}</strong></div></div>
      ${historyHtml||`<div class="general-update-meta"><span>Fonte publicada</span><strong title="${escapeHtml(source)}">${escapeHtml(shorten(source,46))}</strong></div><div class="general-update-meta"><span>Meses disponíveis</span><strong>${fmtInt(availableMonths().length)}</strong></div><div class="general-update-meta"><span>Status</span><strong class="metric-good">Dados carregados</strong></div>`}`;
  }
  function renderGeneral(f,operators){
    const current=generalMetricSnapshot(f),months=availableMonths(),currentMonth=state.month!=="all"?state.month:months.at(-1),index=months.indexOf(currentMonth),previousMonth=index>0?months[index-1]:null,previous=previousMonth?generalMetricSnapshot(filtered(previousMonth)):null;
    const tmaTarget=state.month!=="all"?tmaTargetFor(state.month):NaN;
    const d=(key,opts)=>previous?generalDelta(current[key],previous[key],opts):generalDelta(NaN,NaN,opts);
    const historyMonths=(state.month!=="all"&&index>=0?months.slice(Math.max(0,index-7),index+1):months.slice(-8));
    const spark=key=>historyMonths.map(m=>comparisonMetric(m)[key]).filter(Number.isFinite);
    $("general-kpis").innerHTML=[
      generalKpi("Qualidade",fmtPct(current.quality),"star",{delta:d("quality",{kind:"pp"}),foot:`Meta: <strong>${fmtPct(qualityTarget())}</strong>`,meter:current.quality,tone:"quality"}),
      generalKpi("ISC",fmtPct(current.isc),"survey",{delta:d("isc",{kind:"pp"}),foot:`Meta: <strong>${fmtPct(satisfactionTarget())}</strong>`,meter:current.isc,tone:"isc"}),
      generalKpi("TMA",fmtTime(current.tma),"clock",{delta:d("tma",{kind:"seconds",lowerBetter:true}),foot:Number.isFinite(tmaTarget)?`Meta: <strong>${fmtTimeFull(tmaTarget)}</strong>`:`${fmtInt(sum(f.tma,x=>x.calls))} atendimentos`,meter:Number.isFinite(tmaTarget)&&current.tma?tmaTarget/current.tma*100:0,tone:"tma"}),
      generalKpi("Monitorias",fmtInt(current.monitorias),"clipboard",{delta:d("monitorias",{kind:"percent"}),foot:"Avaliações realizadas",meter:100,tone:"monitoring"}),
      generalKpi("Faltas Graves",fmtInt(current.fg),"alert",{delta:d("fg",{kind:"percent",lowerBetter:true}),foot:"Ocorrências críticas",sparkline:spark("fg"),tone:"danger"}),
      generalKpi("Reclamações",fmtInt(current.complaints),"x",{delta:d("complaints",{kind:"percent",lowerBetter:true}),foot:"Análises classificadas",sparkline:spark("complaints"),tone:"complaints"}),
      generalKpi("Elogios",fmtInt(current.compliments),"check",{delta:d("compliments",{kind:"percent"}),foot:"Reconhecimentos registrados",sparkline:spark("compliments"),tone:"compliments"}),
      generalKpi("Auditorias",fmtInt(current.audits),"headset",{delta:d("audits",{kind:"percent"}),foot:"Cliente + interna",meter:100,tone:"audits"})
    ].join("");
    $("general-evolution").innerHTML=generalEvolutionSvg();
    renderGeneralQuartiles(operators);
    renderGeneralTopOperators(operators);
    renderGeneralAttention(current,tmaTarget);
    renderGeneralUpdateSummary();
  }

  function renderSpecial(f){
    const rows=f.monitoring.filter(isSpecial),proper=rows.filter(x=>procedure(x.origin)==="proper"),improper=rows.filter(x=>procedure(x.origin)==="improper"),operators=new Set(rows.map(x=>x.re||x.operator)).size;
    $("special-kpis").innerHTML=[kpi("Total de Análises",fmtInt(rows.length),"Reclamações, elogios, auditorias e ofícios","clipboard",{meter:100}),kpi("Total Procedente",fmtInt(proper.length),fmtPct(rows.length?proper.length/rows.length*100:NaN),"check",{meter:rows.length?proper.length/rows.length*100:0}),kpi("Total Improcedente",fmtInt(improper.length),fmtPct(rows.length?improper.length/rows.length*100:NaN),"x",{meter:rows.length?improper.length/rows.length*100:0}),kpi("Operadores Analisados",fmtInt(operators),"Relação nominal consolidada","users",{meter:100})].join("");
    const catMap=new Map();rows.forEach(x=>{const category=specialCategory(x.origin),r=catMap.get(category)||{label:category,proper:0,improper:0,neutral:0};r[procedure(x.origin)]++;catMap.set(category,r);});const categories=[...catMap.values()].sort((a,b)=>(b.proper+b.improper+b.neutral)-(a.proper+a.improper+a.neutral));
    $("special-origin").innerHTML=categories.length?categories.map(x=>{const total=x.proper+x.improper+x.neutral;return`<div class="stack-row"><strong>${escapeHtml(x.label)}</strong><div class="stack-track"><span class="stack-proc" style="width:${x.proper/total*100}%"></span><span class="stack-improc" style="width:${x.improper/total*100}%"></span><span class="stack-neutral" style="width:${x.neutral/total*100}%"></span></div><span class="stack-values">${x.proper} P · ${x.improper} I</span></div>`;}).join(""):empty();
    renderRank("special-skills",countBy(rows,"skill"),{limit:10});renderRank("special-forms",countBy(rows,"form"),{limit:10});
    const opMap=new Map();rows.forEach(x=>{const key=x.re||x.operator,r=opMap.get(key)||{operator:x.operator,re:x.re,supervisor:x.supervisor,rows:[]};r.rows.push(x);opMap.set(key,r);});const opRows=[...opMap.values()].map(x=>({...x,total:x.rows.length,proper:x.rows.filter(y=>procedure(y.origin)==="proper").length,improper:x.rows.filter(y=>procedure(y.origin)==="improper").length,skill:mode(x.rows,"skill")})).sort((a,b)=>b.total-a.total);
    const pageSize=state.specialPageSize,totalPages=Math.max(1,Math.ceil(opRows.length/pageSize));state.specialPage=Math.min(Math.max(1,state.specialPage),totalPages);const start=(state.specialPage-1)*pageSize,pageRows=opRows.slice(start,start+pageSize),end=Math.min(start+pageSize,opRows.length);
    $("special-operator-count").textContent=opRows.length?`${fmtInt(opRows.length)} operadores · ${fmtInt(start+1)}–${fmtInt(end)}`:"0 operadores";
    const hideSupervisor=state.supervisor!=="all";
    $("special-supervisor-header")?.classList.toggle("hidden",hideSupervisor);
    $("special-operators").innerHTML=pageRows.map(x=>`<tr><td>${escapeHtml(x.re)}</td><td><strong>${escapeHtml(x.operator)}</strong></td>${hideSupervisor?"":`<td>${escapeHtml(x.supervisor||"Não atribuída")}</td>`}<td>${escapeHtml(x.skill)}</td><td>${fmtInt(x.total)}</td><td class="metric-good">${fmtInt(x.proper)}</td><td class="metric-danger">${fmtInt(x.improper)}</td></tr>`).join("")||`<tr><td colspan="${hideSupervisor?6:7}" class="empty">Sem análises especiais.</td></tr>`;
    $("special-page-size").value=String(pageSize);$("special-page-indicator").textContent=`${state.specialPage} de ${totalPages}`;$("special-prev").disabled=state.specialPage<=1;$("special-next").disabled=state.specialPage>=totalPages;$("special-page-input").max=String(totalPages);$("special-page-input").value=String(state.specialPage);
  }

  function suiteKpi(label,value,icon,{delta=null,foot="",meter=null,tone=""}={}){
    const width=Number.isFinite(meter)?Math.max(0,Math.min(100,meter)):null;
    return `<article class="suite-kpi-card ${tone}">
      <div class="suite-kpi-heading"><span class="suite-kpi-icon">${iconSvg(icon)}</span><strong>${label}</strong></div>
      <div class="suite-kpi-value-row"><span class="suite-kpi-value">${value}</span>${delta?`<span class="suite-kpi-delta ${delta.tone}">${delta.arrow} ${delta.text}</span>`:""}</div>
      <div class="suite-kpi-foot">${foot}</div>
      ${width==null?"":`<div class="suite-kpi-meter"><span style="width:${width}%"></span></div>`}
    </article>`;
  }

  function suitePeriodContext(){
    const months=availableMonths();
    const currentMonth=state.month!=="all"?state.month:months.at(-1);
    const index=months.indexOf(currentMonth);
    const previousMonth=index>0?months[index-1]:null;
    return{months,currentMonth,previousMonth,index};
  }

  function suiteDelta(current,previous,opts={}){return generalDelta(current,previous,opts);}

  function suiteSimpleRows(items,{value=x=>x.value,format=fmtInt,limit=7,tone=""}={}){
    const rows=items.slice(0,limit),max=Math.max(1,...rows.map(x=>Number(value(x))||0));
    return rows.length?rows.map((x,i)=>{
      const raw=Number(value(x))||0,pct=Math.max(2,raw/max*100);
      return `<div class="suite-rank-row ${tone}"><span class="suite-rank-pos">${i+1}</span><span class="suite-rank-name" title="${escapeHtml(x.label||"")}">${escapeHtml(shorten(x.label||"Não informado",34))}</span><strong>${format(raw)}</strong><span class="suite-rank-track"><i style="width:${pct}%"></i></span></div>`;
    }).join(""):empty("Sem dados no período.");
  }

  function suiteQualityQuartiles(operators,targetId){
    const stats=quartileStats(operators.filter(x=>Number.isFinite(x.quality)).map(x=>({value:x.quality})));
    const labels=["Alto desempenho","Bom desempenho","Em desenvolvimento","Atenção"];
    const total=sum(stats,x=>x.count);
    $(targetId).innerHTML=stats.map((x,i)=>`<div class="suite-quartile-card q${x.q}"><span class="quartile-badge">Q${x.q}</span><div><small>${labels[i]}</small><strong>${fmtPct(x.average)}</strong><span>${fmtInt(x.count)} operadores · ${total?Math.round(x.count/total*100):0}%</span></div></div>`).join("")||empty();
  }

  function suiteQualityEvolution(){
    const months=availableMonths().slice(-8);
    if(!months.length)return empty("Sem histórico mensal disponível.");
    const rows=months.map(month=>{const f=filtered(month),notes=f.monitoring.map(x=>x.note).filter(Number.isFinite);return{month,quality:average(notes),monitoring:notes.length};});
    const valid=rows.filter(x=>Number.isFinite(x.quality));
    if(!valid.length)return empty("Sem histórico mensal de qualidade.");
    const width=900,height=275,p={l:54,r:62,t:30,b:40},pw=width-p.l-p.r,ph=height-p.t-p.b;
    const minQ=Math.max(0,Math.floor((Math.min(...valid.map(x=>x.quality),qualityTarget())-5)/5)*5),maxQ=100;
    const maxM=Math.max(1,...rows.map(x=>x.monitoring));
    const slot=pw/Math.max(rows.length,1),x=i=>p.l+slot*(i+.5),yQ=v=>p.t+(maxQ-v)/(maxQ-minQ)*ph,yM=v=>p.t+ph-(v/maxM)*ph*.72;
    const grid=[0,.25,.5,.75,1].map(r=>{const v=maxQ-(maxQ-minQ)*r,yy=p.t+ph*r;return`<line x1="${p.l}" y1="${yy}" x2="${width-p.r}" y2="${yy}" class="quality-grid-line"/><text x="${p.l-11}" y="${yy+4}" text-anchor="end" class="quality-axis-label">${Math.round(v)}%</text>`;}).join("");
    const barW=Math.min(46,slot*.42);
    const bars=rows.map((r,i)=>`<rect x="${x(i)-barW/2}" y="${yM(r.monitoring)}" width="${barW}" height="${Math.max(2,p.t+ph-yM(r.monitoring))}" rx="3" class="quality-volume-bar"/>`).join("");
    const path=valid.map((r,i)=>{const idx=rows.indexOf(r);return`${i?"L":"M"}${x(idx)},${yQ(r.quality)}`;}).join(" ");
    const points=rows.map((r,i)=>Number.isFinite(r.quality)?`<circle cx="${x(i)}" cy="${yQ(r.quality)}" r="4.5" class="quality-line-point"/><text x="${x(i)}" y="${yQ(r.quality)-10}" text-anchor="middle" class="quality-value-label">${r.quality.toLocaleString("pt-BR",{minimumFractionDigits:1,maximumFractionDigits:1})}%</text>`:"").join("");
    const monthsLabels=rows.map((r,i)=>`<text x="${x(i)}" y="${height-11}" text-anchor="middle" class="quality-month-label">${monthShort(r.month)}</text>`).join("");
    const target=qualityTarget();
    const targetLine=target>=minQ&&target<=maxQ?`<line x1="${p.l}" y1="${yQ(target)}" x2="${width-p.r}" y2="${yQ(target)}" class="quality-target-line"/><text x="${width-p.r}" y="${yQ(target)-7}" text-anchor="end" class="quality-target-label">Meta ${fmtPct(target)}</text>`:"";
    const rightTicks=[1,.5,0].map(r=>{const value=Math.round(maxM*r),yy=p.t+ph-(r*ph*.72);return`<text x="${width-p.r+8}" y="${yy+4}" class="quality-count-label">${fmtInt(value)}</text>`;}).join("");
    return`<div class="quality-chart-legend"><span><i class="quality"></i>Qualidade</span><span><i class="target"></i>Meta</span><span><i class="volume"></i>Monitorias</span></div><svg class="quality-combo-chart" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Evolução mensal da Qualidade e monitorias">${grid}${bars}${targetLine}<path d="${path}" class="quality-line"/>${points}${monthsLabels}${rightTicks}</svg>`;
  }
  function suiteSurveyEvolution(){
    const months=availableMonths(),series=months.map(month=>({month,value:comparisonMetric(month).isc}));
    return trendChart({key:"isc",label:"ISC",format:fmtPct,axis:v=>`${Math.round(v)}%`,percent:true,targetValue:satisfactionTarget(),kind:"line"},series);
  }

  function suiteFgEvolution(){
    const months=availableMonths(),series=months.map(month=>({month,value:comparisonMetric(month).fg}));
    return trendChart({key:"fg",label:"Falta Grave",format:fmtInt,axis:v=>fmtInt(v),kind:"bar"},series);
  }

  function suiteSupervisionRows(operators){
    const map=new Map();
    operators.forEach(x=>{
      const key=x.supervisor||"Não atribuída";
      const r=map.get(key)||{label:key,operators:0,evaluations:0,qualityWeighted:0,surveyCount:0,iscSum:0,calls:0,tmaWeighted:0,fg:0};
      r.operators++;r.evaluations+=x.evaluations||0;r.qualityWeighted+=(x.evaluations||0)*(Number.isFinite(x.quality)?x.quality:0);
      if(Number.isFinite(x.isc)){r.surveyCount++;r.iscSum+=x.isc}
      r.calls+=x.calls||0;r.tmaWeighted+=(x.calls||0)*(Number.isFinite(x.tma)?x.tma:0);r.fg+=x.fg||0;
      map.set(key,r);
    });
    return[...map.values()].map(x=>({...x,quality:x.evaluations?x.qualityWeighted/x.evaluations:NaN,isc:x.surveyCount?x.iscSum/x.surveyCount:NaN,tma:x.calls?x.tmaWeighted/x.calls:NaN})).sort((a,b)=>(b.quality||0)-(a.quality||0));
  }

  function suiteTableRows(rows,columns,limit=7){
    const data=rows.slice(0,limit);
    return data.length?`<div class="suite-mini-table">${data.map((row,i)=>`<div class="suite-mini-row"><span class="suite-mini-rank">${i+1}</span>${columns.map(col=>{const cls=typeof col.className==="function"?col.className(row):(col.className||"");const val=col.value(row);return`<span class="${cls}" title="${escapeHtml(String(val??""))}">${col.html?val:escapeHtml(String(val??"—"))}</span>`;}).join("")}</div>`).join("")}</div>`:empty("Sem dados no período.");
  }

  function suiteMiniTable(headers,rows,columns,limit=7){
    const data=rows.slice(0,limit);
    if(!data.length)return empty("Sem dados no período.");
    const tail=columns.length>1?` repeat(${columns.length-1},minmax(46px,.72fr))`:"";
    const template=`22px minmax(105px,1.55fr)${tail}`;
    const head=`<div class="suite-mini-head" style="grid-template-columns:${template}"><span>#</span>${headers.map(x=>`<span>${escapeHtml(x)}</span>`).join("")}</div>`;
    const body=data.map((row,i)=>`<div class="suite-mini-row" style="grid-template-columns:${template}"><span class="suite-mini-rank">${i+1}</span>${columns.map(col=>{const cls=typeof col.className==="function"?col.className(row):(col.className||"");const val=col.value(row);return`<span class="${cls}" title="${escapeHtml(String(val??""))}">${escapeHtml(String(val??"—"))}</span>`;}).join("")}</div>`).join("");
    return`<div class="suite-mini-table headed">${head}${body}</div>`;
  }

  function suiteQuestionRing(label,value,sub){
    const pct=Number.isFinite(value)?Math.max(0,Math.min(100,value)):0;
    return `<div class="suite-question-ring"><div class="suite-ring" style="--ring:${pct}%"><strong>${fmtPct(value)}</strong></div><span>${label}</span><small>${sub}</small></div>`;
  }

  function renderQuality(f,operators){
    const notes=f.monitoring.map(x=>x.note).filter(Number.isFinite),quality=average(notes);
    const criteria=aggregateCriteria(f.criteria),itemsAferidos=sum(criteria,x=>x.total);
    const skills=[...new Set(f.monitoring.map(x=>x.skill).filter(Boolean))];
    const special=f.monitoring.filter(isSpecial),audits=special.filter(x=>specialCategory(x.origin)==="Auditoria Interna").length;
    const ctx=suitePeriodContext(),prev=ctx.previousMonth?filtered(ctx.previousMonth):null,prevOps=prev?buildOperators(prev):[];
    const prevNotes=prev?prev.monitoring.map(x=>x.note).filter(Number.isFinite):[],prevCriteria=prev?aggregateCriteria(prev.criteria):[];
    const prevSpecial=prev?prev.monitoring.filter(isSpecial):[];
    const d=(cur,old,opts)=>suiteDelta(cur,old,opts);
    $("quality-kpis").innerHTML=[
      suiteKpi("Qualidade Geral",fmtPct(quality),"star",{delta:d(quality,average(prevNotes),{kind:"pp"}),foot:`Meta: ${fmtPct(qualityTarget())}`,meter:quality,tone:"quality"}),
      suiteKpi("Monitorias Avaliadas",fmtInt(notes.length),"clipboard",{delta:d(notes.length,prevNotes.length,{kind:"percent"}),foot:prev?`Mês anterior: ${fmtInt(prevNotes.length)}`:"Avaliações realizadas",meter:100,tone:"monitoring"}),
      suiteKpi("Itens Aferidos",fmtInt(itemsAferidos),"clipboard",{delta:d(itemsAferidos,sum(prevCriteria,x=>x.total),{kind:"percent"}),foot:"Aplicações dos critérios",meter:100,tone:"items"}),
      suiteKpi("Skills Monitoradas",fmtInt(skills.length),"layers",{delta:d(skills.length,prev?[...new Set(prev.monitoring.map(x=>x.skill).filter(Boolean))].length:NaN,{kind:"percent"}),foot:`Total de skills: ${fmtInt(skills.length)}`,meter:100,tone:"skills"}),
      suiteKpi("Auditorias Internas",fmtInt(audits),"headset",{delta:d(audits,prevSpecial.filter(x=>specialCategory(x.origin)==="Auditoria Interna").length,{kind:"percent"}),foot:"Registros de auditoria",meter:audits?100:0,tone:"audits"}),
      suiteKpi("Meta de Qualidade",fmtPct(qualityTarget()),"star",{foot:"Meta corporativa",meter:qualityTarget(),tone:"target"})
    ].join("");

    $("quality-evolution").innerHTML=suiteQualityEvolution();

    const bins=[
      {label:"Excelente (≥ 98%)",test:v=>v>=98},
      {label:"Muito bom (95%–97,99%)",test:v=>v>=95&&v<98},
      {label:"Bom (90%–94,99%)",test:v=>v>=90&&v<95},
      {label:"Atenção (80%–89,99%)",test:v=>v>=80&&v<90},
      {label:"Crítico (< 80%)",test:v=>v<80}
    ].map((b,i)=>({...b,count:notes.filter(b.test).length,index:i}));
    const total=notes.length||1;
    $("quality-distribution").innerHTML=`<div class="suite-distribution-bars">${bins.map(b=>`<div class="suite-distribution-row q${Math.min(4,b.index+1)}"><span>${b.label}</span><strong>${Math.round(b.count/total*100)}%</strong><i><b style="width:${b.count/total*100}%"></b></i><small>${fmtInt(b.count)}</small></div>`).join("")}</div><div class="suite-donut" style="--donut-value:${Math.max(0,Math.min(100,quality||0))}%"><strong>${fmtInt(notes.length)}</strong><span>monitorias</span></div>`;

    suiteQualityQuartiles(operators,"quality-quartiles-new");

    const skillRows=aggregate(f.monitoring,"skill").sort((a,b)=>b.average-a.average);
    $("quality-skill-ranking").innerHTML=suiteSimpleRows(skillRows,{value:x=>x.average,format:fmtPct,limit:7});

    const topCriteria=[...criteria].sort((a,b)=>b.total-a.total).map(x=>({label:x.criterion,value:x.total}));
    $("quality-top-criteria").innerHTML=suiteSimpleRows(topCriteria,{format:fmtInt,limit:7});

    const deviations=[...criteria].filter(x=>x.errors>0).sort((a,b)=>b.errorRate-a.errorRate).map(x=>({label:x.criterion,value:x.errorRate}));
    $("quality-deviations").innerHTML=suiteSimpleRows(deviations,{format:fmtPct,limit:7,tone:"danger"});

    const supervision=suiteSupervisionRows(operators);
    $("quality-supervision").innerHTML=suiteMiniTable(
      ["Supervisão","Monitorias","Qualidade","FG"],
      supervision,
      [
        {value:x=>x.label,className:"suite-col-main"},
        {value:x=>fmtInt(x.evaluations)},
        {value:x=>fmtPct(x.quality),className:"metric-good"},
        {value:x=>fmtInt(x.fg),className:x=>x.fg?"metric-danger":""}
      ],5
    );
  }
  function operatorSurveyRows(items){return items.map(x=>{const p1=iscFromCounts(x.p1||[]),p2=iscFromCounts(x.p2||[]),p3=iscFromCounts(x.p3||[]),all=[0,0,0,0,0];["p1","p2","p3"].forEach(q=>(x[q]||[]).forEach((v,i)=>all[i]+=+v||0));return{...x,p1Score:p1,p2Score:p2,p3Score:p3,isc:iscFromCounts(all),responses:sum(all),quartile:quartile(iscFromCounts(all))};}).filter(x=>x.responses>0);}
  function renderSurvey(f){
    const overall=isc(f.satisfaction),p1=isc(f.satisfaction,"p1"),p2=isc(f.satisfaction,"p2"),p3=isc(f.satisfaction,"p3");
    const surveyVolume=sum(questionCounts(f.satisfaction,"p1"));
    const operators=buildOperators(f),scored=operators.filter(x=>Number.isFinite(x.isc)),above=scored.filter(x=>x.isc>=satisfactionTarget()),below=scored.filter(x=>x.isc<satisfactionTarget()),noScore=operators.filter(x=>!Number.isFinite(x.isc));
    const ctx=suitePeriodContext(),prev=ctx.previousMonth?filtered(ctx.previousMonth):null,prevOps=prev?buildOperators(prev):[],prevOverall=prev?isc(prev.satisfaction):NaN;
    const prevVolume=prev?sum(questionCounts(prev.satisfaction,"p1")):NaN;
    $("survey-kpis").innerHTML=[
      suiteKpi("ISC Geral",fmtPct(overall),"survey",{delta:suiteDelta(overall,prevOverall,{kind:"pp"}),foot:`Meta: ${fmtPct(satisfactionTarget())}`,meter:overall,tone:"isc"}),
      suiteKpi("Meta ISC",fmtPct(satisfactionTarget()),"star",{foot:"Meta institucional",meter:satisfactionTarget(),tone:"target"}),
      suiteKpi("Operadores Acima da Meta",fmtInt(above.length),"arrow-up",{delta:{tone:"positive",arrow:"↑",text:`${scored.length?Math.round(above.length/scored.length*100):0}% do total`},foot:`Total com nota: ${fmtInt(scored.length)}`,meter:scored.length?above.length/scored.length*100:0,tone:"good"}),
      suiteKpi("Operadores Abaixo da Meta",fmtInt(below.length),"arrow-down",{delta:{tone:below.length?"negative":"neutral",arrow:below.length?"↑":"",text:`${scored.length?Math.round(below.length/scored.length*100):0}% do total`},foot:`Total com nota: ${fmtInt(scored.length)}`,meter:scored.length?below.length/scored.length*100:0,tone:"danger"}),
      suiteKpi("Sem Nota",fmtInt(noScore.length),"users",{foot:`Total de operadores: ${fmtInt(operators.length)}`,meter:operators.length?noScore.length/operators.length*100:0,tone:"neutral"}),
      suiteKpi("Volume de Pesquisas",fmtInt(surveyVolume),"clipboard",{delta:suiteDelta(surveyVolume,prevVolume,{kind:"percent"}),foot:"Respostas consideradas",meter:100,tone:"monitoring"})
    ].join("");

    $("survey-evolution").innerHTML=suiteSurveyEvolution();

    const allRows=operatorSurveyRows(f.satisfaction).sort((a,b)=>b.isc-a.isc),stats=quartileStats(allRows.map(x=>({value:x.isc}))),total=sum(stats,x=>x.count);
    const qLabels=["1º Quartil · Alta Satisfação","2º Quartil","3º Quartil","4º Quartil"];
    $("survey-quartile-detail").innerHTML=stats.map((x,i)=>`<div class="suite-quartile-row q${x.q}"><span class="quartile-badge">Q${x.q}</span><strong>${qLabels[i]}</strong><i><b style="width:${total?x.count/total*100:0}%"></b></i><span>${fmtInt(x.count)}</span><span>${total?Math.round(x.count/total*100):0}%</span><small>${x.range}</small></div>`).join("");

    const supervisionMap=new Map();
    f.satisfaction.forEach(row=>{
      const key=row.supervisor||"Não atribuída",r=supervisionMap.get(key)||{label:key,items:[]};r.items.push(row);supervisionMap.set(key,r);
    });
    const supervision=[...supervisionMap.values()].map(x=>({label:x.label,isc:isc(x.items)})).sort((a,b)=>(b.isc||0)-(a.isc||0));
    $("survey-supervision").innerHTML=suiteTableRows(supervision,[{value:x=>x.label,className:"suite-col-main"},{value:x=>fmtPct(x.isc),className:"metric-good"}],5);
    $("survey-top-operators").innerHTML=suiteTableRows(allRows,[{value:x=>x.operator,className:"suite-col-main"},{value:x=>fmtPct(x.isc),className:"metric-good"},{value:x=>fmtInt(x.responses)}],5);
    $("survey-question-circles").innerHTML=[
      suiteQuestionRing("P1",p1,"Atendimento"),
      suiteQuestionRing("P2",p2,"Cordialidade"),
      suiteQuestionRing("P3",p3,"Clareza")
    ].join("");

    const rows=state.surveyQuartile==="all"?allRows:allRows.filter(x=>String(x.quartile)===String(state.surveyQuartile));
    const paged=paginateRows(rows,state.surveyPage,state.surveyPageSize);state.surveyPage=paged.page;
    $("survey-operator-count").textContent=rows.length?`${fmtInt(rows.length)} operadores · ${fmtInt(paged.start+1)}–${fmtInt(paged.end)}`:"0 operadores";
    const hideSupervisor=state.supervisor!=="all";$("survey-supervisor-header")?.classList.toggle("hidden",hideSupervisor);
    $("survey-table").innerHTML=paged.rows.map(x=>`<tr><td>${escapeHtml(x.re)}</td><td><strong>${escapeHtml(x.operator)}</strong></td>${hideSupervisor?"":`<td>${escapeHtml(x.supervisor||"Não atribuída")}</td>`}<td>${fmtInt(x.responses)}</td><td class="${metricClass(x.p1Score)}">${fmtPct(x.p1Score)}</td><td class="${metricClass(x.p2Score)}">${fmtPct(x.p2Score)}</td><td class="${metricClass(x.p3Score)}">${fmtPct(x.p3Score)}</td><td class="${metricClass(x.isc)}">${fmtPct(x.isc)}</td><td>${quartileBadge(x.quartile)}</td></tr>`).join("")||`<tr><td colspan="${hideSupervisor?8:9}" class="empty">Sem respostas de pesquisa para o quartil selecionado.</td></tr>`;
    syncPager("survey",paged,state.surveyPageSize);
  }
  function renderFg(f){
    const rows=f.monitoring.filter(x=>x.fg),operators=new Set(rows.map(x=>x.re||x.operator)).size,origins=new Set(rows.map(x=>x.origin).filter(Boolean)).size,skills=new Set(rows.map(x=>x.skill).filter(Boolean)).size;
    const reasons=countBy(rows,"fgReason"),mainReason=reasons[0]?.label||"Sem ocorrência",mainReasonCount=reasons[0]?.value||0;
    const ctx=suitePeriodContext(),prev=ctx.previousMonth?filtered(ctx.previousMonth):null,prevRows=prev?prev.monitoring.filter(x=>x.fg):[];
    const reduction=suiteDelta(rows.length,prevRows.length,{kind:"percent",lowerBetter:true});
    $("fg-kpis").innerHTML=[
      suiteKpi("Total de Faltas Graves",fmtInt(rows.length),"alert",{delta:reduction,foot:"Ocorrências críticas",meter:100,tone:"danger"}),
      suiteKpi("Operadores com FG",fmtInt(operators),"users",{delta:suiteDelta(operators,prev?new Set(prevRows.map(x=>x.re||x.operator)).size:NaN,{kind:"percent",lowerBetter:true}),foot:`Total monitorado: ${fmtInt(new Set(f.monitoring.map(x=>x.re||x.operator)).size)}`,meter:f.monitoring.length?operators/Math.max(1,new Set(f.monitoring.map(x=>x.re||x.operator)).size)*100:0,tone:"danger"}),
      suiteKpi("Skills com FG",fmtInt(skills),"headset",{foot:`Skills monitoradas: ${fmtInt(new Set(f.monitoring.map(x=>x.skill).filter(Boolean)).size)}`,meter:100,tone:"skills"}),
      suiteKpi("Motivo mais recorrente",escapeHtml(shorten(mainReason,26)),"clipboard",{foot:`${fmtInt(mainReasonCount)} ocorrência(s)`,tone:"text"}),
      suiteKpi("Meta / Limite",fmtInt(fgLimit()),"star",{foot:"Limite mensal",meter:Math.min(100,rows.length/fgLimit()*100),tone:"target"}),
      suiteKpi("Variação vs. mês anterior",reduction.text||"—","arrow-down",{delta:reduction,foot:prev?`${fmtInt(prevRows.length)} → ${fmtInt(rows.length)} ocorrências`:"Sem período anterior",tone:"good"})
    ].join("");

    $("fg-monthly").innerHTML=suiteFgEvolution();
    renderRank("fg-reasons",reasons.map(x=>({...x,color:"red"})),{limit:7,color:"red"});
    renderRank("fg-origins",countBy(rows,"origin"),{limit:7});
    renderRank("fg-skills",countBy(rows,"skill"),{limit:7,color:"gold"});
    const limit=fgLimit(),within=rows.length<=limit,used=limit?rows.length/limit*100:0;
    $("fg-performance").innerHTML=`<div class="fg-performance-main three"><div><small>Total de Faltas Graves</small><strong>${fmtInt(rows.length)}</strong></div><div><small>Meta / Limite</small><strong>${fmtInt(limit)}</strong></div><div><small>Status</small><strong class="${within?"metric-good":"metric-danger"}">${within?"Dentro do limite":"Acima do limite"}</strong></div></div><div class="fg-performance-status ${within?"good":"danger"}"><span>${within?"✓":"!"}</span><strong>${Math.round(used)}% do limite utilizado</strong><small>${prev?`${reduction.text} vs. mês anterior`:"Período atual"}</small></div><div class="suite-kpi-meter"><span style="width:${Math.min(100,used)}%"></span></div>`;

    const map=new Map();rows.forEach(x=>{const key=x.re||x.operator,r=map.get(key)||{operator:x.operator,re:x.re,supervisor:x.supervisor,rows:[]};r.rows.push(x);map.set(key,r);});const opRows=[...map.values()].map(x=>({...x,count:x.rows.length,reason:mode(x.rows,"fgReason"),origin:mode(x.rows,"origin"),skill:mode(x.rows,"skill")})).sort((a,b)=>b.count-a.count);
    const paged=paginateRows(opRows,state.fgPage,state.fgPageSize);state.fgPage=paged.page;
    $("fg-operator-count").textContent=opRows.length?`${fmtInt(opRows.length)} operadores · ${fmtInt(paged.start+1)}–${fmtInt(paged.end)}`:"0 operadores";
    const hideSupervisor=state.supervisor!=="all";$("fg-supervisor-header")?.classList.toggle("hidden",hideSupervisor);
    $("fg-operators").innerHTML=paged.rows.map(x=>`<tr><td>${escapeHtml(x.re)}</td><td><strong>${escapeHtml(x.operator)}</strong></td>${hideSupervisor?"":`<td>${escapeHtml(x.supervisor||"Não atribuída")}</td>`}<td class="metric-danger">${fmtInt(x.count)}</td><td>${escapeHtml(x.reason)}</td><td>${escapeHtml(x.origin)}</td><td>${escapeHtml(x.skill)}</td></tr>`).join("")||`<tr><td colspan="${hideSupervisor?6:7}" class="empty">Sem faltas graves.</td></tr>`;
    syncPager("fg",paged,state.fgPageSize);
  }
  function comparisonMetric(monthValue){
    const f=filtered(monthValue),notes=f.monitoring.map(x=>x.note).filter(Number.isFinite),special=f.monitoring.filter(isSpecial);
    const tmaValue=weighted(f.tma),tmaTarget=tmaTargetFor(monthValue);
    return{quality:average(notes),isc:isc(f.satisfaction),tma:tmaValue,tmaTarget:Number.isFinite(tmaTarget)?tmaTarget:NaN,fg:f.monitoring.filter(x=>x.fg).length,complaints:special.filter(x=>specialCategory(x.origin)==="Reclamação").length,compliments:special.filter(x=>specialCategory(x.origin)==="Elogio").length,clientAudit:special.filter(x=>specialCategory(x.origin)==="Auditoria Cliente").length,internalAudit:special.filter(x=>specialCategory(x.origin)==="Auditoria Interna").length};
  }
  function availableMonths(){
    return sortMonths(new Set([...data.monitoring,...data.satisfaction,...data.tma,...(data.skillTma||[])].map(x=>x.m).filter(Boolean)));
  }
  function niceAxisMax(value){
    if(!Number.isFinite(value)||value<=0)return 1;
    const magnitude=10**Math.floor(Math.log10(value)),normalized=value/magnitude;
    return(normalized<=1?1:normalized<=2?2:normalized<=5?5:10)*magnitude;
  }
  function trendChart(def,series,targetSeries=[]){
    const values=[...series,...targetSeries].map(x=>x.value).filter(Number.isFinite);
    if(!values.length)return empty("Sem dados disponíveis para este indicador.");
    const width=680,height=300,pad={left:76,right:32,top:58,bottom:52};
    const plotW=width-pad.left-pad.right,plotH=height-pad.top-pad.bottom;
    let minY=0,maxY=Math.max(1,...values);
    const percentTarget=Number.isFinite(def.targetValue)?def.targetValue:90;
    if(def.percent){minY=Math.max(0,Math.floor((Math.min(...values,percentTarget)-5)/10)*10);maxY=100;}
    else if(def.time){minY=Math.max(0,Math.floor((Math.min(...values)-30)/30)*30);maxY=Math.ceil((Math.max(...values)+30)/30)*30;}
    else maxY=niceAxisMax(Math.max(...values)*1.12);
    if(maxY<=minY)maxY=minY+1;
    const slot=plotW/Math.max(series.length,1),x=(i)=>pad.left+slot*(i+.5);
    const y=(value)=>pad.top+(maxY-value)/(maxY-minY)*plotH;
    const ticks=4,grid=Array.from({length:ticks+1},(_,i)=>{const ratio=i/ticks,value=maxY-(maxY-minY)*ratio,pos=pad.top+plotH*ratio;return`<line x1="${pad.left}" y1="${pos}" x2="${width-pad.right}" y2="${pos}" class="chart-grid-line"/><text x="${pad.left-14}" y="${pos+4}" text-anchor="end" class="chart-axis-label">${def.axis(value)}</text>`;}).join("");
    const axes=`<line x1="${pad.left}" y1="${pad.top}" x2="${pad.left}" y2="${pad.top+plotH}" class="chart-axis-line"/><line x1="${pad.left}" y1="${pad.top+plotH}" x2="${width-pad.right}" y2="${pad.top+plotH}" class="chart-axis-line"/>`;
    const labels=series.map((point,i)=>`<text x="${x(i)}" y="${height-18}" text-anchor="middle" class="chart-month-label">${monthShort(point.month)}</text>`).join("");
    const valid=series.map((point,i)=>({...point,i})).filter(point=>Number.isFinite(point.value));
    let marks="";
    if(def.kind==="bar"){
      const barWidth=Math.min(58,slot*.46);
      marks=valid.map(point=>`<rect x="${x(point.i)-barWidth/2}" y="${y(point.value)}" width="${barWidth}" height="${Math.max(2,pad.top+plotH-y(point.value))}" rx="7" class="chart-bar"/><text x="${x(point.i)}" y="${Math.max(pad.top+15,y(point.value)-11)}" text-anchor="middle" class="chart-value-label">${def.format(point.value)}</text>`).join("");
    }else{
      const path=valid.map((point,i)=>`${i?"L":"M"}${x(point.i).toFixed(1)},${y(point.value).toFixed(1)}`).join(" ");
      const area=valid.length>1?`${path} L${x(valid.at(-1).i).toFixed(1)},${pad.top+plotH} L${x(valid[0].i).toFixed(1)},${pad.top+plotH} Z`:"";
      marks=`${area?`<path d="${area}" class="chart-area"/>`:""}<path d="${path}" class="chart-line"/>${valid.map(point=>`<circle cx="${x(point.i)}" cy="${y(point.value)}" r="6" class="chart-point"/><text x="${x(point.i)}" y="${def.targetKey?Math.min(pad.top+plotH-8,y(point.value)+26):Math.max(pad.top+16,y(point.value)-15)}" text-anchor="middle" class="chart-value-label">${def.targetKey?`Realizado ${def.format(point.value)}`:def.format(point.value)}</text>`).join("")}`;
    }
    const target=def.percent&&minY<=percentTarget?`<line x1="${pad.left}" y1="${y(percentTarget)}" x2="${width-pad.right}" y2="${y(percentTarget)}" class="chart-target-line"/><text x="${width-pad.right}" y="${y(percentTarget)-7}" text-anchor="end" class="chart-target-label">META ${fmtPct(percentTarget)}</text>`:"";
    const targetValid=targetSeries.map((point,i)=>({...point,i})).filter(point=>Number.isFinite(point.value)),targetPath=targetValid.map((point,i)=>`${i?"L":"M"}${x(point.i).toFixed(1)},${y(point.value).toFixed(1)}`).join(" ");
    const targetMarks=targetValid.length?`<path d="${targetPath}" class="chart-line target-series"/>${targetValid.map(point=>`<circle cx="${x(point.i)}" cy="${y(point.value)}" r="3.5" class="chart-point target-point"/>`).join("")}`:"";
    const legend=targetValid.length?`<div class="chart-legend"><span><i class="target"></i>Meta TMA</span><span><i class="actual"></i>Realizado</span></div>`:"";
    return`${legend}<svg class="trend-chart" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Evolução mensal de ${escapeHtml(def.label)}">${grid}${axes}${target}${marks}${targetMarks}${labels}</svg>`;
  }
  function renderComparison(){
    const months=availableMonths(),metrics=months.map(month=>({month,...comparisonMetric(month)}));
    const current=metrics.at(-1)||{},previous=metrics.length>1?metrics.at(-2):null,first=metrics[0]||{};
    const kd=(key,opts)=>suiteDelta(current[key],previous?.[key],opts);
    $("comparison-kpis").innerHTML=[
      suiteKpi("Qualidade Média",fmtPct(current.quality),"star",{delta:kd("quality",{kind:"pp"}),foot:`Meta: ${fmtPct(qualityTarget())}`,meter:current.quality,tone:"quality"}),
      suiteKpi("ISC Médio",fmtPct(current.isc),"survey",{delta:kd("isc",{kind:"pp"}),foot:`Meta: ${fmtPct(satisfactionTarget())}`,meter:current.isc,tone:"isc"}),
      suiteKpi("TMA",fmtTime(current.tma),"clock",{delta:kd("tma",{kind:"seconds",lowerBetter:true}),foot:Number.isFinite(current.tmaTarget)?`Meta: ${fmtTimeFull(current.tmaTarget)}`:"Sem meta",meter:Number.isFinite(current.tmaTarget)&&current.tma?current.tmaTarget/current.tma*100:0,tone:"tma"}),
      suiteKpi("Faltas Graves",fmtInt(current.fg),"alert",{delta:kd("fg",{kind:"percent",lowerBetter:true}),foot:"Ocorrências",tone:"danger"}),
      suiteKpi("Reclamações",fmtInt(current.complaints),"x",{delta:kd("complaints",{kind:"percent",lowerBetter:true}),foot:"Registros no período",tone:"complaints"}),
      suiteKpi("Elogios",fmtInt(current.compliments),"check",{delta:kd("compliments",{kind:"percent"}),foot:"Reconhecimentos",tone:"compliments"})
    ].join("");

    $("comparison-main-chart").innerHTML=generalEvolutionSvg();

    const summaries=[
      {label:"Qualidade",from:first.quality,to:current.quality,kind:"pp",lower:false,format:fmtPct},
      {label:"ISC",from:first.isc,to:current.isc,kind:"pp",lower:false,format:fmtPct},
      {label:"Faltas Graves",from:first.fg,to:current.fg,kind:"percent",lower:true,format:fmtInt},
      {label:"Elogios",from:first.compliments,to:current.compliments,kind:"percent",lower:false,format:fmtInt}
    ];
    $("comparison-summary").innerHTML=summaries.map(x=>{const d=suiteDelta(x.to,x.from,{kind:x.kind,lowerBetter:x.lower});return`<div class="comparison-summary-row ${d.tone}"><span class="comparison-summary-icon">${d.arrow||"="}</span><div><small>${x.label}</small><strong>${d.text}</strong><span>de ${x.format(x.from)} para ${x.format(x.to)}</span></div></div>`;}).join("");

    const tmaSeries=metrics.map(x=>({month:x.month,value:x.tma})),tmaTargets=metrics.map(x=>({month:x.month,value:x.tmaTarget}));
    $("comparison-tma-chart").innerHTML=trendChart({key:"tma",label:"TMA",format:fmtTime,axis:v=>v===0?"00:00":fmtTime(v),kind:"line",time:true,targetKey:"tmaTarget",targetFormat:fmtTimeFull},tmaSeries,tmaTargets);
    $("comparison-fg-chart").innerHTML=trendChart({key:"fg",label:"Falta Grave",format:fmtInt,axis:v=>fmtInt(v),kind:"bar"},metrics.map(x=>({month:x.month,value:x.fg})));

    const defs=[
      {key:"quality",label:"Qualidade",format:fmtPct},
      {key:"isc",label:"ISC",format:fmtPct},
      {key:"tma",label:"TMA",format:fmtTime},
      {key:"fg",label:"Faltas Graves",format:fmtInt},
      {key:"complaints",label:"Reclamações",format:fmtInt},
      {key:"compliments",label:"Elogios",format:fmtInt},
      {key:"internalAudit",label:"Auditorias",format:fmtInt}
    ];
    $("comparison-head").innerHTML=`<tr><th>Indicador</th>${months.map(month=>`<th>${escapeHtml(monthLabel(month))}</th>`).join("")}</tr>`;
    $("comparison-table").innerHTML=defs.map(def=>`<tr><td><strong>${def.label}</strong></td>${metrics.map(item=>`<td>${def.format(item[def.key])}</td>`).join("")}</tr>`).join("")||`<tr><td class="empty">Sem dados mensais.</td></tr>`;
    $("comparison-charts").innerHTML="";
  }
  function renderOperators(operators){
    const visible=operators.filter(x=>state.operatorStatus==="all"||x.status===state.operatorStatus).sort((a,b)=>{const av=a[state.sort.key],bv=b[state.sort.key],dir=state.sort.direction==="asc"?1:-1;if(typeof av==="string")return av.localeCompare(bv,"pt-BR")*dir;return((Number.isFinite(av)?av:-Infinity)-(Number.isFinite(bv)?bv:-Infinity))*dir;});
    const qCounts=[1,2,3,4].map(q=>operators.filter(x=>x.quartileQuality===q).length),quality=average(operators.map(x=>x.quality).filter(Number.isFinite)),iscAvg=average(operators.map(x=>x.isc).filter(Number.isFinite));
    const ctx=suitePeriodContext(),prev=ctx.previousMonth?buildOperators(filtered(ctx.previousMonth)):[],prevQuality=average(prev.map(x=>x.quality).filter(Number.isFinite)),prevIsc=average(prev.map(x=>x.isc).filter(Number.isFinite));
    $("operators-kpis").innerHTML=[
      suiteKpi("Total de Operadores",fmtInt(operators.length),"users",{delta:suiteDelta(operators.length,prev.length,{kind:"percent"}),foot:"Operadores no recorte",meter:100,tone:"monitoring"}),
      suiteKpi("Destaques (Q1)",operators.length?fmtPct(qCounts[0]/operators.length*100):"—","star",{foot:`${fmtInt(qCounts[0])} operadores`,meter:operators.length?qCounts[0]/operators.length*100:0,tone:"good"}),
      suiteKpi("Dentro da Meta (Q2)",operators.length?fmtPct(qCounts[1]/operators.length*100):"—","check",{foot:`${fmtInt(qCounts[1])} operadores`,meter:operators.length?qCounts[1]/operators.length*100:0,tone:"quality"}),
      suiteKpi("Em Atenção (Q3)",operators.length?fmtPct(qCounts[2]/operators.length*100):"—","alert",{foot:`${fmtInt(qCounts[2])} operadores`,meter:operators.length?qCounts[2]/operators.length*100:0,tone:"danger"}),
      suiteKpi("Média de Qualidade",fmtPct(quality),"star",{delta:suiteDelta(quality,prevQuality,{kind:"pp"}),foot:`Meta: ${fmtPct(qualityTarget())}`,meter:quality,tone:"quality"}),
      suiteKpi("Média de ISC",fmtPct(iscAvg),"survey",{delta:suiteDelta(iscAvg,prevIsc,{kind:"pp"}),foot:`Meta: ${fmtPct(satisfactionTarget())}`,meter:iscAvg,tone:"isc"})
    ].join("");

    const qStats=quartileStats(operators.filter(x=>Number.isFinite(x.quality)).map(x=>({value:x.quality}))),total=sum(qStats,x=>x.count),qLabels=["Primeiro quartil (Destaques)","Segundo quartil","Terceiro quartil","Quarto quartil"];
    $("operators-quartiles").innerHTML=qStats.map((x,i)=>`<div class="suite-quartile-row q${x.q}"><span class="quartile-badge">Q${x.q}</span><strong>${qLabels[i]}</strong><i><b style="width:${total?x.count/total*100:0}%"></b></i><span>${total?Math.round(x.count/total*100):0}%</span><small>${fmtInt(x.count)} operadores</small></div>`).join("");

    const withSurvey=operators.filter(x=>Number.isFinite(x.isc)).length,withFg=operators.filter(x=>x.fg>0).length,withMonitoring=operators.filter(x=>x.evaluations>0).length;
    $("operators-general-indicators").innerHTML=[
      ["Operadores com monitoria",withMonitoring],
      ["Com pesquisa ISC",withSurvey],
      ["Com falta grave",withFg],
      ["Sem nota ISC",operators.length-withSurvey]
    ].map(([label,value])=>`<div><span>${label}</span><strong>${fmtInt(value)}</strong></div>`).join("");

    const top=[...operators].filter(x=>Number.isFinite(x.quality)).sort((a,b)=>b.quality-a.quality).slice(0,5);
    $("operators-top").innerHTML=suiteTableRows(top,[{value:x=>x.re},{value:x=>x.operator,className:"suite-col-main"},{value:x=>fmtPct(x.quality),className:"metric-good"}],5);
    const attention=[...operators].filter(x=>x.status==="attention").sort((a,b)=>(b.fg-a.fg)||((a.quality||0)-(b.quality||0))).slice(0,5);
    $("operators-attention").innerHTML=suiteTableRows(attention,[{value:x=>x.re},{value:x=>x.operator,className:"suite-col-main"},{value:x=>fmtPct(x.quality)},{value:x=>fmtInt(x.fg),className:"metric-danger"}],5);
    const sup=suiteSupervisionRows(operators);
    $("operators-supervision").innerHTML=suiteMiniTable(
      ["Supervisão","Operadores","Qualidade","ISC","TMA"],
      sup,
      [{value:x=>x.label,className:"suite-col-main"},{value:x=>fmtInt(x.operators)},{value:x=>fmtPct(x.quality)},{value:x=>fmtPct(x.isc)},{value:x=>fmtTime(x.tma)}],5
    );

    const paged=paginateRows(visible,state.operatorPage,state.operatorPageSize);state.operatorPage=paged.page;
    $("operator-count").textContent=visible.length?`${fmtInt(visible.length)} operadores · ${fmtInt(paged.start+1)}–${fmtInt(paged.end)}`:"0 operadores";
    $("operator-summary").innerHTML="";
    $("operators-table").innerHTML=paged.rows.map(x=>`<tr><td>${escapeHtml(x.re)}</td><td><strong>${escapeHtml(x.operator)}</strong></td><td>${fmtInt(x.evaluations)}</td><td class="${metricClass(x.quality)}">${fmtPct(x.quality)}</td><td>${quartileBadge(x.quartileQuality)}</td><td class="${metricClass(x.isc)}">${fmtPct(x.isc)}</td><td>${fmtInt(x.calls)}</td><td>${fmtTime(x.tma)}</td><td class="${x.fg?"metric-danger":""}">${fmtInt(x.fg)}</td><td>${badge(x.status)}</td></tr>`).join("")||`<tr><td colspan="10" class="empty">Nenhum operador encontrado.</td></tr>`;
    syncPager("operator",paged,state.operatorPageSize);
  }
  function render(){
    const f=filtered(),operators=buildOperators(f);
    renderGeneral(f,operators);renderSpecial(f);renderQuality(f,operators);renderSurvey(f);renderFg(f);renderComparison();renderOperators(operators);
    const referenceText=state.view==="comparison"?"EVOLUÇÃO MENSAL":state.month==="all"?"TODOS OS MESES":monthLabel(state.month);
    const updatedText=data.meta?.importedAt?new Date(data.meta.importedAt).toLocaleString("pt-BR"):"Dados carregados";
    $("reference-label").textContent=referenceText;
    $("last-update").textContent=data.meta?.importedAt?`Atualizado neste dispositivo em ${updatedText}`:"Dados carregados do relatório-base";
    if($("general-reference-label"))$("general-reference-label").textContent=referenceText;
    if($("general-last-update"))$("general-last-update").textContent=updatedText;
  }

  function options(values,allLabel){return`<option value="all">${allLabel}</option>${values.map(x=>`<option value="${escapeHtml(x)}">${escapeHtml(x)}</option>`).join("")}`;}
  function populateFilters(reset=false){
    const months=sortMonths(new Set([...data.monitoring,...data.satisfaction,...data.tma,...(data.skillTma||[])].map(x=>x.m).filter(Boolean)));
    const skills=[...new Set([...data.monitoring,...data.criteria,...(data.skillTma||[])].map(x=>x.skill).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"pt-BR"));
    const forms=[...new Set([...data.monitoring,...data.criteria].map(x=>x.form).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"pt-BR"));
    const supervisors=(Array.isArray(data.supervisors)&&data.supervisors.length?data.supervisors:[...new Set([...data.monitoring,...data.satisfaction,...data.tma].map(x=>x.supervisor).filter(x=>x&&!normalize(x).startsWith("aline fernandes")))]).sort((a,b)=>a.localeCompare(b,"pt-BR"));
    const latest=months.at(-1)||"all";if(reset||!months.includes(state.month))state.month=latest;
    $("month-filter").innerHTML=options(months,"Todos os meses");$("skill-filter").innerHTML=options(skills,"Todas as skills");$("form-filter").innerHTML=options(forms,"Todas as aferições");$("supervisor-filter").innerHTML=options(supervisors,"Todas as supervisões");
    if(state.supervisor!=="all"&&!supervisors.includes(state.supervisor))state.supervisor="all";$("month-filter").value=state.month;$("skill-filter").value=state.skill;$("form-filter").value=state.form;$("supervisor-filter").value=state.supervisor;
  }

  function updateFilterVisibility(){
    const noSkill=["general","survey","comparison","admin"].includes(state.view);$("skill-filter-group").classList.toggle("hidden",noSkill);if(noSkill){state.skill="all";$("skill-filter").value="all";}
    const quality=state.view==="quality";$("form-filter-group").classList.toggle("hidden",!quality);if(!quality){state.form="all";$("form-filter").value="all";}
    const comparison=["comparison","admin"].includes(state.view);$("month-filter-group").classList.toggle("hidden",comparison);
  }
  function updateHeader(){
    const config=viewHeaders[state.view]||viewHeaders.general;
    document.body.classList.toggle("view-general",state.view==="general");
    document.body.dataset.view=state.view;
    $("masthead-eyebrow").textContent=config.eyebrow||"";
    $("masthead-title").textContent=config.title;
    $("masthead-subtitle").textContent=config.subtitle;
    if($("masthead-module-icon"))$("masthead-module-icon").innerHTML=iconSvg(config.icon||"chart");
    $("reference-caption").textContent=state.view==="comparison"?"PERÍODO COMPARADO":"MÊS DE REFERÊNCIA";
    document.querySelector(".admin-header-refresh")?.classList.toggle("visible",state.view==="admin");
    $("general-report")?.classList.toggle("suite-hidden-control",state.view==="admin");
  }
  function applyTheme(theme){
    const light=theme==="light";document.body.classList.toggle("light",light);const button=$("theme-toggle");
    button.querySelector(".theme-icon").innerHTML=iconSvg(light?"moon":"sun");button.querySelector(".theme-label").textContent=light?"Modo noite":"Modo dia";button.setAttribute("aria-label",light?"Ativar modo noite":"Ativar modo dia");button.setAttribute("aria-pressed",String(light));
    try{localStorage.setItem("mq-theme",light?"light":"dark");}catch{/* preferência opcional */}
  }
  function switchView(view){
    state.view=view;
    document.querySelectorAll(".view").forEach(x=>x.classList.toggle("active",x.id===view));
    document.querySelectorAll(".nav-item[data-view]").forEach(x=>x.classList.toggle("active",x.dataset.view===view));
    $("dashboard-filters").classList.remove("expanded");
    updateFilterVisibility();updateHeader();render();window.scrollTo({top:0,behavior:"smooth"});
  }
  function exportCsv(){
    const rows=buildOperators(filtered()),quote=v=>`"${String(v??"").replaceAll('"','""')}"`,header=["Operador","RE","Supervisão","Monitorias","Qualidade (%)","ISC (%)","Atendimentos","TMA (s)","FG","Status"];
    const lines=rows.map(x=>[x.operator,x.re,x.supervisor,x.evaluations,Number.isFinite(x.quality)?x.quality.toFixed(2):"",Number.isFinite(x.isc)?x.isc.toFixed(2):"",x.calls,Number.isFinite(x.tma)?Math.round(x.tma):"",x.fg,x.status].map(quote).join(";"));
    const blob=new Blob(["\ufeff"+[header.map(quote).join(";"),...lines].join("\n")],{type:"text/csv;charset=utf-8"}),link=document.createElement("a");link.href=URL.createObjectURL(blob);link.download="indicadores-qualidade-filtrados.csv";link.click();URL.revokeObjectURL(link.href);toast("Dados filtrados exportados.");
  }

  function toast(message){const el=$("toast");el.textContent=message;el.classList.add("show");clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove("show"),3200);}

  async function apiError(response,fallback){
    try{const payload=await response.json();return payload.error||fallback;}catch{return fallback;}
  }

  async function loadServerState(){
    const [dataResponse,configResponse]=await Promise.allSettled([fetch("/api/data",{cache:"no-store"}),fetch("/api/config",{cache:"no-store"})]);
    let config={qualityTarget:90,satisfactionTarget:90,maxFileSizeMB:30};
    if(configResponse.status==="fulfilled"&&configResponse.value.ok){try{config={...config,...await configResponse.value.json()};}catch{/* mantém padrões */}}
    if(dataResponse.status==="fulfilled"&&dataResponse.value.ok){try{const current=await dataResponse.value.json();if(current?.monitoring&&current?.criteria){data=current;}}catch{/* mantém relatório-base */}}
    data.meta={...(data.meta||{}),...config};
  }

  const formatAdminDateTime=(value)=>{if(!value)return"—";const date=new Date(value);return Number.isNaN(date.getTime())?"—":date.toLocaleString("pt-BR",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"});};

  function latestUpdateValue(status=null){
    return status?.lastUpdated||data.meta?.importedAt||status?.upload?.uploadedAt||null;
  }

  function updateLastUpdatedLabel(value=null){
    const target=$("admin-last-updated");if(!target)return;
    target.textContent=`Última atualização: ${formatAdminDateTime(value||latestUpdateValue())}`;
  }

  function renderImportHistory(items=[]){
    const body=$("import-history-body");if(!body)return;
    body.innerHTML=items.length?items.map(item=>`<tr><td>${escapeHtml(formatAdminDateTime(item.dateTime||item.createdAt||item.updatedAt))}</td><td>${escapeHtml(item.type||"—")}</td><td title="${escapeHtml(item.file||"")}">${escapeHtml(shorten(item.file||"—",40))}</td><td>${escapeHtml(item.records??"—")}</td><td><span class="history-status ${normalize(item.status)==="sucesso"?"ok":normalize(item.status)==="erro"?"error":normalize(item.status)==="desfeito"?"undone":"pending"}">${escapeHtml(item.status||"—")}</span></td><td title="${escapeHtml(item.details||"")}">${escapeHtml(shorten(item.details||"—",64))}</td><td>${item.canUndo?`<button type="button" class="history-undo" data-undo-import="${escapeHtml(item.id)}">Desfazer</button>`:"—"}</td></tr>`).join(""):`<tr><td colspan="7" class="admin-history-empty">Nenhuma importação registrada.</td></tr>`;
  }

  async function loadImportHistory(){
    try{
      const response=await fetch("/api/admin/history",{cache:"no-store"});
      if(!response.ok)return;
      const payload=await response.json(),items=Array.isArray(payload)?payload:payload.items||[];
      window.__MQ_IMPORT_HISTORY=items;
      renderImportHistory(items);
      if($("general-update-summary"))renderGeneralUpdateSummary();
    }catch{/* histórico não bloqueia o painel */}
  }
  async function undoImport(importId){
    if(!importId)return;
    const confirmed=window.confirm("Desfazer esta importação? O painel voltará exatamente ao estado anterior a ela.");
    if(!confirmed)return;
    const button=document.querySelector(`[data-undo-import="${CSS.escape(importId)}"]`);
    if(button){button.disabled=true;button.textContent="Desfazendo...";}
    try{
      const response=await fetch("/api/admin/undo",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({importId})});
      if(!response.ok)throw new Error(await apiError(response,"Não foi possível desfazer a importação."));
      await loadServerState();
      state.month="all";state.skill="all";state.form="all";state.supervisor="all";state.search="";resetListPages();
      populateFilters(true);updateFilterVisibility();updateHeader();render();updateLastUpdatedLabel();await loadImportHistory();
      toast("Importação desfeita. O estado anterior do painel foi restaurado.");
    }catch(cause){
      toast(cause?.message||"Não foi possível desfazer a importação.");
      if(button){button.disabled=false;button.textContent="Desfazer";}
    }
  }

  async function refreshDashboardData(){
    const button=$("admin-refresh");if(button){button.disabled=true;button.textContent="Atualizando...";}
    try{
      await loadServerState();populateFilters(true);updateFilterVisibility();updateHeader();render();updateLastUpdatedLabel();await loadImportHistory();toast("Painel atualizado com os dados mais recentes.");
    }catch(cause){toast(cause?.message||"Não foi possível atualizar o painel.");}
    finally{if(button){button.disabled=false;button.textContent="Atualizar painel";}}
  }

  function injectAdminStyles(){
    if($("admin-recovery-styles"))return;
    const style=document.createElement("style");style.id="admin-recovery-styles";style.textContent=`
      .admin-toolbar{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin:14px 0 6px}.admin-toolbar .secondary-button{min-width:150px}.admin-updated{font-size:12px;color:var(--muted,#91a4b7);font-weight:700}.admin-history-wrap{overflow:auto;border:1px solid rgba(128,160,190,.22);border-radius:12px}.admin-history{width:100%;border-collapse:collapse;min-width:760px;font-size:12px}.admin-history th,.admin-history td{padding:10px 12px;text-align:left;border-bottom:1px solid rgba(128,160,190,.16);vertical-align:top}.admin-history th{font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted,#91a4b7)}.admin-history tr:last-child td{border-bottom:0}.history-status{display:inline-flex;padding:3px 8px;border-radius:999px;font-size:10px;font-weight:800}.history-status.ok{background:rgba(21,226,172,.12);color:#15e2ac}.history-status.error{background:rgba(255,82,109,.12);color:#ff526d}.history-status.pending{background:rgba(255,193,61,.12);color:#ffc13d}.history-status.undone{background:rgba(126,145,166,.14);color:#9fb0c2}.history-undo{border:1px solid rgba(255,193,61,.45);background:rgba(255,193,61,.10);color:#ffc13d;border-radius:8px;padding:6px 10px;font-size:10px;font-weight:800;cursor:pointer;white-space:nowrap}.history-undo:hover{background:rgba(255,193,61,.17)}.history-undo:disabled{opacity:.55;cursor:wait}.admin-history-empty{text-align:center!important;color:var(--muted,#91a4b7);padding:18px!important}
    `;document.head.appendChild(style);
  }

  function renderAdminSummary(){
    const root=$("admin-page-content");if(!root||root.dataset.ready!=="1")return;
    const latest=availableMonths().at(-1),m=latest?comparisonMetric(latest):{quality:NaN,isc:NaN};
    if($("admin-quality-current"))$("admin-quality-current").textContent=fmtPct(m.quality);
    if($("admin-isc-current"))$("admin-isc-current").textContent=fmtPct(m.isc);
    if($("admin-last-updated-card"))$("admin-last-updated-card").textContent=formatAdminDateTime(latestUpdateValue());
  }

  function injectAdminInterface(status){
    const root=$("admin-page-content");if(!root||root.dataset.ready==="1")return;
    document.body.classList.add("admin-enabled");
    injectAdminStyles();
    if(!$("admin-nav")){
      $("main-nav").insertAdjacentHTML("beforeend",`<button class="nav-item admin-nav-item" id="admin-nav" type="button" data-view="admin" aria-label="Administração"><span class="nav-icon">${iconSvg("upload")}</span><b>Administração</b></button>`);
    }
    const environment=location.hostname.includes("homologacao")?"Homologação":"Produção";
    root.dataset.ready="1";
    root.innerHTML=`
      <div class="suite-kpi-grid admin-kpi-grid">
        <article class="suite-kpi-card admin-static"><div class="suite-kpi-heading"><span class="suite-kpi-icon">${iconSvg("clock")}</span><strong>Última atualização</strong></div><div class="suite-kpi-value-row"><span class="suite-kpi-value admin-date-value" id="admin-last-updated-card">${formatAdminDateTime(latestUpdateValue(status))}</span></div><div class="suite-kpi-foot metric-good">● Dados importados com sucesso.</div></article>
        <article class="suite-kpi-card admin-static"><div class="suite-kpi-heading"><span class="suite-kpi-icon">${iconSvg("layers")}</span><strong>Ambiente</strong></div><div class="suite-kpi-value-row"><span class="suite-kpi-value">${environment}</span></div><div class="suite-kpi-foot metric-good">● Sistema operacional</div></article>
        <article class="suite-kpi-card"><div class="suite-kpi-heading"><span class="suite-kpi-icon">${iconSvg("star")}</span><strong>Meta Qualidade</strong></div><div class="suite-kpi-value-row"><span class="suite-kpi-value">${fmtPct(qualityTarget())}</span><span class="suite-kpi-delta positive">Atual <b id="admin-quality-current">—</b></span></div><div class="suite-kpi-meter"><span style="width:${qualityTarget()}%"></span></div><div class="suite-kpi-foot">Meta do ambiente</div></article>
        <article class="suite-kpi-card"><div class="suite-kpi-heading"><span class="suite-kpi-icon">${iconSvg("survey")}</span><strong>Meta ISC</strong></div><div class="suite-kpi-value-row"><span class="suite-kpi-value">${fmtPct(satisfactionTarget())}</span><span class="suite-kpi-delta positive">Atual <b id="admin-isc-current">—</b></span></div><div class="suite-kpi-meter"><span style="width:${satisfactionTarget()}%"></span></div></article>
        <article class="suite-kpi-card admin-static"><div class="suite-kpi-heading"><span class="suite-kpi-icon">${iconSvg("check")}</span><strong>Status do processamento</strong></div><div class="admin-status-ok"><span>✓</span><div><strong>Concluído</strong><small>Última importação processada com sucesso.</small></div></div></article>
      </div>

      <div class="suite-grid admin-main-layout">
        <div class="admin-left-column">
          <article class="panel suite-panel admin-import-panel">
            <header class="suite-panel-header"><div><span class="suite-panel-icon">☁</span><div><h2>Importar novos dados</h2><p>Selecione um arquivo compatível para importar no sistema.</p></div></div></header>
            <label class="drop-zone admin-drop-suite" id="drop-zone" for="admin-file"><input id="admin-file" type="file" accept=".xlsx,.json.gz,.xls,.csv,.pdf"><span class="drop-icon">${iconSvg("upload")}</span><strong id="file-label">Arraste e solte o arquivo aqui</strong><small>XLSX principal até 30 MB · JSON.GZ, XLS, CSV e PDF complementares até 4 MB.</small></label>
            <div id="import-progress" class="import-progress" hidden><div class="progress-track"><span id="progress-bar"></span></div><p id="progress-label">Preparando o arquivo...</p></div>
            <div id="import-error" class="import-error" hidden></div>
            <div class="admin-import-actions"><button type="button" class="secondary-button" onclick="document.getElementById('admin-file').click()">Escolher arquivo</button><button type="button" id="process-file" class="primary-button" disabled>Validar e importar</button><button type="button" id="admin-refresh" class="secondary-button">↻ Atualizar painel</button></div>
            <p class="admin-latest" id="admin-latest">${status?.upload?`Último envio: ${escapeHtml(status.upload.originalName)} · ${formatAdminDateTime(status.upload.uploadedAt)}`:"Nenhum envio administrativo registrado."}</p>
          </article>

          <article class="panel suite-panel admin-history-panel">
            <header class="suite-panel-header"><div><span class="suite-panel-icon">▤</span><div><h2>Histórico de Importações</h2><p>Acompanhe todas as importações realizadas no sistema.</p></div></div></header>
            <div class="admin-history-wrap"><table class="admin-history"><thead><tr><th>Data/Hora</th><th>Tipo</th><th>Arquivo</th><th>Registros</th><th>Status</th><th>Detalhes</th><th>Ação</th></tr></thead><tbody id="import-history-body"><tr><td colspan="7" class="admin-history-empty">Carregando histórico...</td></tr></tbody></table></div>
          </article>
        </div>
        <div class="admin-right-column">
          <article class="panel suite-panel admin-settings-panel">
            <header class="suite-panel-header"><div><span class="suite-panel-icon">⚙</span><div><h2>Configurações dos indicadores</h2><p>Defina as metas e parâmetros utilizados no painel.</p></div></div></header>
            <div class="admin-settings"><label>Meta de Qualidade (%)<input id="quality-target-setting" type="number" min="0" max="100" step="0.01" value="${qualityTarget()}"></label><label>Meta ISC (%)<input id="satisfaction-target-setting" type="number" min="0" max="100" step="0.01" value="${satisfactionTarget()}"></label></div>
            <button type="button" id="save-settings" class="primary-button">Salvar configurações</button><div id="settings-error" class="import-error" hidden></div>
          </article>
          <article class="panel suite-panel"><header class="suite-panel-header"><div><span class="suite-panel-icon">●</span><div><h2>Status de processamento</h2><p>Entenda os status exibidos no histórico de importações.</p></div></div></header><div class="admin-status-guide"><div class="ok">✓ <strong>Importação concluída</strong><span>Arquivo processado com sucesso.</span></div><div class="pending">◷ <strong>Em processamento</strong><span>Arquivo em validação e processamento.</span></div><div class="error">! <strong>Erro na importação</strong><span>Falha na validação. Verifique os detalhes.</span></div></div></article>
          <article class="panel suite-panel"><header class="suite-panel-header"><div><span class="suite-panel-icon">▣</span><div><h2>Dicas e boas práticas</h2></div></div></header><div class="admin-tips"><span>● Utilize os formatos previstos para cada importação.</span><span>● Mantenha o layout padrão de colunas.</span><span>● Verifique a qualidade dos dados antes de importar.</span><span>● Em caso de erro, revise o arquivo e tente novamente.</span><span>● Após a importação, atualize o painel.</span></div></article>
        </div>
      </div>
      <span class="admin-updated" id="admin-last-updated">Última atualização: ${formatAdminDateTime(latestUpdateValue(status))}</span>
    `;
    renderAdminSummary();

    const openAdmin=()=>switchView("admin");
    document.querySelectorAll("[data-open-admin]").forEach(button=>button.addEventListener("click",openAdmin));
    $("admin-refresh").addEventListener("click",refreshDashboardData);
    $("admin-refresh-header")?.addEventListener("click",refreshDashboardData);
    $("admin-file").addEventListener("change",e=>setFile(e.target.files[0]));
    $("process-file").addEventListener("click",processImport);
    $("save-settings").addEventListener("click",saveSettings);
    $("import-history-body").addEventListener("click",e=>{const button=e.target.closest("[data-undo-import]");if(button)undoImport(button.dataset.undoImport);});
    const drop=$("drop-zone");
    ["dragenter","dragover"].forEach(type=>drop.addEventListener(type,e=>{e.preventDefault();drop.classList.add("drag");}));
    ["dragleave","drop"].forEach(type=>drop.addEventListener(type,e=>{e.preventDefault();drop.classList.remove("drag");}));
    drop.addEventListener("drop",e=>setFile(e.dataTransfer.files[0]));
    loadImportHistory();
  }
  function setFile(file){
    const lowerName=(file?.name||"").toLowerCase(),extension=lowerName.endsWith(".json.gz")?"json.gz":(lowerName.split(".").pop()||""),error=$("import-error");
    const allowed=["xlsx","json.gz","xls","csv","pdf"],limitMB=extension==="xlsx"?30:4,limitBytes=limitMB*1024*1024;
    error.hidden=true;
    if(file&&(!allowed.includes(extension)||file.size>limitBytes)){
      window.selectedAdminFile=null;$("process-file").disabled=true;$("file-label").textContent="Escolher arquivo";
      error.textContent=file.size>limitBytes?`O arquivo excede o limite de ${limitMB} MB para este tipo.`:"Formato não suportado. Utilize XLSX, JSON.GZ, XLS, CSV ou PDF.";error.hidden=false;return;
    }
    window.selectedAdminFile=file||null;$("process-file").disabled=!file;$("file-label").textContent=file?`${file.name} · ${(file.size/1024/1024).toLocaleString("pt-BR",{maximumFractionDigits:2})} MB`:"Escolher arquivo";
  }

  async function ensureImporter(){
    if(window.XLSXImporter)return;
    await new Promise((resolve,reject)=>{const script=document.createElement("script");script.src="/assets/xlsx-import.js";script.onload=resolve;script.onerror=()=>reject(new Error("Não foi possível carregar o processador de planilhas."));document.head.appendChild(script);});
  }

  async function reportClientImportError(importId,file,cause){
    try{await fetch("/api/admin/history",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({importId,file:file?.name||"",status:"Erro",details:cause?.message||"Falha durante o processamento do arquivo."})});}catch{/* não substitui o erro principal */}
  }

  async function processImport(){
    const file=window.selectedAdminFile;if(!file)return;
    const lowerName=file.name.toLowerCase(),extension=lowerName.endsWith(".json.gz")?"json.gz":(lowerName.split(".").pop()||""),error=$("import-error"),progress=$("import-progress"),bar=$("progress-bar"),label=$("progress-label");
    error.hidden=true;progress.hidden=false;$("process-file").disabled=true;let importId=null;
    try{
      if(extension==="xlsx"||extension==="json.gz"){
        let save;
        if(extension==="xlsx"){
          bar.style.width="8%";label.textContent="Validando a estrutura da planilha...";
          await ensureImporter();
          const result=await window.XLSXImporter.parse(file,(percent,message)=>{bar.style.width=`${8+percent*.72}%`;label.textContent=message;});
          result.meta={...(result.meta||{}),qualityTarget:qualityTarget(),satisfactionTarget:satisfactionTarget(),importedAt:new Date().toISOString()};
          bar.style.width="86%";label.textContent="Publicando os dados consolidados...";
          save=await fetch("/api/admin/data",{method:"POST",headers:{"content-type":"application/json","x-file-name":encodeURIComponent(file.name),"x-import-records":String(result.monitoring?.length||0)},body:JSON.stringify(result)});
        }else{
          bar.style.width="18%";label.textContent="Validando o pacote histórico consolidado...";
          save=await fetch("/api/admin/package",{method:"POST",headers:{"content-type":"application/gzip","x-file-name":encodeURIComponent(file.name)},body:file});
          bar.style.width="86%";label.textContent="Mesclando janeiro a junho e preservando os demais meses...";
        }
        if(!save.ok)throw new Error(await apiError(save,extension==="json.gz"?"Não foi possível importar o pacote histórico.":"Não foi possível atualizar os painéis."));
        const saved=await save.json();
        await loadServerState();
        state.month="all";state.skill="all";state.form="all";state.supervisor="all";state.search="";state.criteriaDimension="all";state.specialPage=1;$("criteria-dimension-filter").value="all";populateFilters(true);updateFilterVisibility();updateHeader();render();updateLastUpdatedLabel(saved.importedAt||data.meta?.importedAt);
        const monthInfo=Array.isArray(saved.months)&&saved.months.length?` · Meses: ${saved.months.join(", ")}`:"";
        $("admin-latest").textContent=`Último envio: ${file.name} · ${formatAdminDateTime(saved.importedAt||data.meta?.importedAt)}${monthInfo}`;
        toast(extension==="json.gz"?"Pacote histórico importado. Meses do pacote atualizados e demais períodos preservados.":saved.merged?"Importação concluída. Meses enviados atualizados e demais períodos preservados.":"Relatório validado e painéis atualizados com sucesso.");
      }else{
        bar.style.width="12%";label.textContent="Validando e armazenando o anexo...";
        const upload=await fetch("/api/admin/import",{method:"POST",headers:{"content-type":file.type||"application/octet-stream","x-file-name":encodeURIComponent(file.name)},body:file});
        if(!upload.ok)throw new Error(await apiError(upload,"Não foi possível validar o anexo."));
        const uploadResult=await upload.json();importId=uploadResult.importId||null;
        $("admin-latest").textContent=`Último envio: ${uploadResult.file.originalName} · ${formatAdminDateTime(uploadResult.file.uploadedAt)}`;
        toast("Arquivo validado e armazenado como anexo complementar.");
      }
      bar.style.width="100%";label.textContent="Importação concluída.";setFile(null);await loadImportHistory();
    }catch(cause){await reportClientImportError(importId,file,cause);error.textContent=cause?.message||"Não foi possível processar o arquivo.";error.hidden=false;$("process-file").disabled=false;await loadImportHistory();}
  }

  async function saveSettings(){
    const error=$("settings-error");error.hidden=true;const qualityTargetValue=Number($("quality-target-setting").value),satisfactionTargetValue=Number($("satisfaction-target-setting").value);
    try{
      const response=await fetch("/api/admin/config",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({qualityTarget:qualityTargetValue,satisfactionTarget:satisfactionTargetValue})});
      if(!response.ok)throw new Error(await apiError(response,"Não foi possível salvar as configurações."));
      data.meta={...(data.meta||{}),qualityTarget:qualityTargetValue,satisfactionTarget:satisfactionTargetValue};render();toast("Configurações atualizadas com sucesso.");
    }catch(cause){error.textContent=cause?.message||"Não foi possível salvar as configurações.";error.hidden=false;}
  }

  async function establishAdmin(){
    const url=new URL(location.href),urlToken=url.searchParams.get("admin_token"),adminMode=Boolean(urlToken)||url.searchParams.get("admin")==="1";
    if(!adminMode)return;

    async function openSession(token){
      const response=await fetch("/api/admin/session",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({token})});
      return response.ok;
    }

    if(urlToken){
      const ok=await openSession(urlToken);
      history.replaceState({},"",`${url.pathname}?admin=1`);
      if(!ok){toast("Chave administrativa inválida.");return;}
    }

    try{
      let response=await fetch("/api/admin/status",{cache:"no-store"});
      let status=await response.json();
      if(!status.admin&&!urlToken){
        const typed=window.prompt("Digite a chave administrativa:");
        if(!typed)return;
        const ok=await openSession(typed);
        if(!ok){toast("Chave administrativa inválida.");return;}
        response=await fetch("/api/admin/status",{cache:"no-store"});
        status=await response.json();
      }
      if(status.admin)injectAdminInterface(status);
    }catch{/* visualização pública permanece disponível */}
  }

  function bind(){
    $("main-nav").addEventListener("click",e=>{const button=e.target.closest("[data-view]");if(button)switchView(button.dataset.view);});\n    $("sidebar-home")?.addEventListener("click",()=>switchView("general"));\n    $("sidebar-collapse")?.addEventListener("click",()=>{\n      const collapsed=document.body.classList.toggle("sidebar-collapsed");\n      const button=$("sidebar-collapse");\n      button.setAttribute("aria-expanded",String(!collapsed));\n      button.setAttribute("aria-label",collapsed?"Expandir menu lateral":"Recolher menu lateral");\n      button.setAttribute("title",collapsed?"Expandir menu lateral":"Recolher menu lateral");\n      const glyph=button.querySelector(".sidebar-collapse-glyph");if(glyph)glyph.textContent=collapsed?"›":"‹";\n      try{localStorage.setItem("mq-sidebar-collapsed",collapsed?"1":"0");}catch{/* preferência opcional */}\n    });
    [["month-filter","month"],["skill-filter","skill"],["form-filter","form"],["supervisor-filter","supervisor"]].forEach(([id,key])=>$(id).addEventListener("change",e=>{state[key]=e.target.value;resetListPages();render();}));
    let timer;$("operator-filter").addEventListener("input",e=>{clearTimeout(timer);timer=setTimeout(()=>{state.search=e.target.value.trim();resetListPages();render();},180);});
    $("clear-filters").addEventListener("click",()=>{state.skill="all";state.form="all";state.supervisor="all";state.search="";state.criteriaDimension="all";state.surveyQuartile="all";resetListPages();$("skill-filter").value="all";$("form-filter").value="all";$("supervisor-filter").value="all";$("criteria-dimension-filter").value="all";$("survey-quartile-filter").value="all";$("operator-filter").value="";render();});
    $("criteria-dimension-filter").addEventListener("change",e=>{state.criteriaDimension=e.target.value;state.criteriaPage=1;renderQuality(filtered(),buildOperators(filtered()));});
    $("survey-quartile-filter").addEventListener("change",e=>{state.surveyQuartile=e.target.value;state.surveyPage=1;renderSurvey(filtered());});
    $("operator-status-filter").addEventListener("change",e=>{state.operatorStatus=e.target.value;state.operatorPage=1;renderOperators(buildOperators(filtered()));});
    $("special-page-size").addEventListener("change",e=>{state.specialPageSize=Number(e.target.value)||50;state.specialPage=1;renderSpecial(filtered());});
    $("special-prev").addEventListener("click",()=>{state.specialPage=Math.max(1,state.specialPage-1);renderSpecial(filtered());});
    $("special-next").addEventListener("click",()=>{state.specialPage++;renderSpecial(filtered());});
    $("special-page-form").addEventListener("submit",e=>{e.preventDefault();state.specialPage=Math.max(1,Number($("special-page-input").value)||1);renderSpecial(filtered());});
    const bindPager=(prefix,pageKey,sizeKey,fallback)=>{
      $(prefix+"-page-size").addEventListener("change",e=>{state[sizeKey]=normalizePageSize(e.target.value,fallback);state[pageKey]=1;render();});
      $(prefix+"-prev").addEventListener("click",()=>{state[pageKey]=Math.max(1,state[pageKey]-1);render();});
      $(prefix+"-next").addEventListener("click",()=>{state[pageKey]++;render();});
      $(prefix+"-page-form").addEventListener("submit",e=>{e.preventDefault();state[pageKey]=Math.max(1,Number($(prefix+"-page-input").value)||1);render();});
    };
    bindPager("quality-skill","qualitySkillPage","qualitySkillPageSize",10);
    bindPager("criteria","criteriaPage","criteriaPageSize",10);
    bindPager("survey","surveyPage","surveyPageSize",25);
    bindPager("fg","fgPage","fgPageSize",10);
    bindPager("operator","operatorPage","operatorPageSize",10);
    document.querySelector(".sortable thead").addEventListener("click",e=>{const th=e.target.closest("[data-sort]");if(!th)return;const key=th.dataset.sort;state.sort.direction=state.sort.key===key&&state.sort.direction==="asc"?"desc":"asc";state.sort.key=key;state.operatorPage=1;renderOperators(buildOperators(filtered()));});
    $("side-export").addEventListener("click",exportCsv);
    if($("general-export"))$("general-export").addEventListener("click",exportCsv);
    if($("general-report"))$("general-report").addEventListener("click",()=>window.print());
    if($("general-filter-toggle"))$("general-filter-toggle").addEventListener("click",e=>{const open=$("dashboard-filters").classList.toggle("expanded");e.currentTarget.classList.toggle("active",open);e.currentTarget.setAttribute("aria-expanded",String(open));});
    $("theme-toggle").addEventListener("click",()=>applyTheme(document.body.classList.contains("light")?"dark":"light"));
    $("mobile-filter-toggle").addEventListener("click",e=>{const open=$("dashboard-filters").classList.toggle("expanded");e.currentTarget.setAttribute("aria-expanded",String(open));});
  }

  async function bootstrap(){
    document.body.classList.add("redesign-suite");
    let initialTheme="dark";try{initialTheme=localStorage.getItem("mq-theme")||"dark";}catch{/* modo escuro padrão */}
    await loadServerState();populateFilters();updateFilterVisibility();updateHeader();bind();applyTheme(initialTheme);render();await establishAdmin();
  }
  bootstrap();
})();
