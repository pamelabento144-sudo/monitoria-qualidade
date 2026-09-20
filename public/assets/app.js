(() => {
  "use strict";

  let data = window.DASH_DATA;
  const $ = (id) => document.getElementById(id);
  const state = { view:"general", month:"Ago", skill:"all", form:"all", supervisor:"all", search:"", criteriaDimension:"all", specialPage:1, specialPageSize:50, qualitySkillPage:1, qualitySkillPageSize:10, criteriaPage:1, criteriaPageSize:10, surveyPage:1, surveyPageSize:25, surveyQuartile:"all", fgPage:1, fgPageSize:10, operatorPage:1, operatorPageSize:10, operatorStatus:"all", sort:{key:"quality",direction:"asc"} };
  const palette=["#16d9f5","#9254ff","#ff526d","#15e2ac","#ffc13d","#6ea8d8","#b4c6d4"];
  const monthNames={Jan:"JANEIRO",Fev:"FEVEREIRO",Mar:"MARÇO",Abr:"ABRIL",Mai:"MAIO",Jun:"JUNHO",Jul:"JULHO",Ago:"AGOSTO",Set:"SETEMBRO",Out:"OUTUBRO",Nov:"NOVEMBRO",Dez:"DEZEMBRO"};
  const monthOrder={Jan:1,Fev:2,Mar:3,Abr:4,Mai:5,Jun:6,Jul:7,Ago:8,Set:9,Out:10,Nov:11,Dez:12};
  const viewHeaders={
    general:{eyebrow:"VISÃO CONSOLIDADA",title:'PAINEL <span>GERAL</span>',subtitle:"Indicadores de qualidade, performance e experiência do cidadão"},
    special:{eyebrow:"ANÁLISES DE ATENDIMENTO",title:'ANÁLISES <span>ESPECIAIS</span>',subtitle:"Reclamações, elogios, ofícios e auditorias cliente e interna"},
    quality:{eyebrow:"MONITORIAS AVALIADAS",title:'PAINEL DE <span>QUALIDADE</span>',subtitle:"Distribuição das avaliações, médias e itens de aferição"},
    survey:{eyebrow:"EXPERIÊNCIA DO CIDADÃO",title:'PESQUISA <span>ISC</span>',subtitle:"Índice de satisfação calculado pelas perguntas P1, P2 e P3"},
    fg:{eyebrow:"NÃO CONFORMIDADES CRÍTICAS",title:'FALTA <span>GRAVE</span>',subtitle:"Motivos, origens, skills e operadores com ocorrências"},
    comparison:{eyebrow:"EVOLUÇÃO DOS INDICADORES",title:'COMPARATIVO <span>MENSAL</span>',subtitle:"Gráficos mensais preparados para acompanhar janeiro a dezembro"},
    operators:{eyebrow:"DESEMPENHO INDIVIDUAL",title:'PAINEL DE <span>OPERADORES</span>',subtitle:"Qualidade, satisfação, TMA e ocorrências por operador"}
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
    $(target).innerHTML=list.length?list.map(x=>{const tone=x.color||color||(performance?performanceColor(x.value):"");const valueClass=performance?metricClass(x.value):"";return`<div class="rank-row"><span class="rank-name" title="${escapeHtml(x.label)}">${escapeHtml(shorten(x.label,45))}</span><div class="bar-track"><div class="bar-fill ${tone}" style="width:${Math.max(2,(+x.value||0)/max*100)}%"></div></div><strong class="rank-value ${valueClass}">${format(x.value)}</strong></div>`;}).join(""):empty();
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

  function renderGeneral(f,operators){
    const notes=f.monitoring.map(x=>x.note).filter(Number.isFinite),quality=average(notes),iscValue=isc(f.satisfaction),tmaValue=weighted(f.tma),tmaTarget=state.month!=="all"?tmaTargetFor(state.month):NaN,fg=f.monitoring.filter(x=>x.fg).length;
    $("general-kpis").innerHTML=[
      kpi("Qualidade Geral",fmtPct(quality),`Meta ≥ <strong>${fmtPct(qualityTarget())}</strong>`,"star",{meter:quality,performance:true}),
      kpi("Monitorias",fmtInt(notes.length),"Avaliações realizadas","headset",{meter:100}),
      kpi("Pesquisa (ISC)",fmtPct(iscValue),`Meta ≥ <strong>${fmtPct(satisfactionTarget())}</strong>`,"survey",{meter:iscValue,performance:true}),
      kpi("TMA Geral",fmtTime(tmaValue),Number.isFinite(tmaTarget)?`Meta do mês: <strong>${fmtTimeFull(tmaTarget)}</strong>`:`${fmtInt(sum(f.tma,x=>x.calls))} atendimentos`,"clock",{meter:Math.min(100,tmaValue&&Number.isFinite(tmaTarget)?tmaTarget/tmaValue*100:0)}),
      kpi("Falta Grave",fmtInt(fg),`${fmtPct(notes.length?fg/notes.length*100:NaN)} sobre monitorias`,"alert",{danger:true,meter:notes.length?fg/notes.length*100:0})
    ].join("");
    renderColumns("quality-quartiles",quartileStats(operators.filter(x=>Number.isFinite(x.quality)).map(x=>({value:x.quality}))));
    renderColumns("survey-quartiles",quartileStats(operators.filter(x=>Number.isFinite(x.isc)).map(x=>({value:x.isc}))));
    const originMap=new Map();f.monitoring.forEach(x=>{const key=generalOriginCategory(x.origin);originMap.set(key,(originMap.get(key)||0)+1);});const origins=[...originMap].map(([label,value])=>({label,value})).sort((a,b)=>b.value-a.value);renderOriginBars("general-origin",origins);
    const allCriteria=aggregateCriteria(f.criteria),bestCriteria=[...allCriteria].sort((a,b)=>b.accuracy-a.accuracy).slice(0,5),offenderCriteria=[...allCriteria].filter(x=>Number.isFinite(x.accuracy)&&x.accuracy<qualityTarget()).sort((a,b)=>b.accuracy-a.accuracy).slice(0,5);
    renderRank("best-criteria",bestCriteria.map(x=>({label:x.criterion,value:x.accuracy})),{limit:5,format:fmtPct,maxValue:100,performance:true});
    const criteriaOverview=$("criteria-overview"),offenderBlock=$("general-offenders-block");
    if(offenderCriteria.length){
      criteriaOverview?.classList.add("has-offenders");criteriaOverview?.classList.remove("no-offenders");offenderBlock?.classList.remove("hidden");
      renderRank("general-criteria-offenders",offenderCriteria.map(x=>({label:x.criterion,value:x.accuracy,color:"red"})),{limit:5,format:fmtPct,maxValue:100,color:"red"});
    }else{
      criteriaOverview?.classList.remove("has-offenders");criteriaOverview?.classList.add("no-offenders");offenderBlock?.classList.add("hidden");
      if($("general-criteria-offenders"))$("general-criteria-offenders").innerHTML="";
    }
    renderSplit("form-performance",aggregate(f.monitoring,"form"));renderSplit("skill-performance",aggregate(f.monitoring,"skill"));
    const qualityTop=operators.filter(x=>x.evaluations>0).sort((a,b)=>b.quality-a.quality).map(x=>({label:x.operator,value:x.quality,width:x.quality}));
    const fgTop=operators.filter(x=>x.fg>0).sort((a,b)=>b.fg-a.fg).map(x=>({label:x.operator,value:x.fg,width:Math.min(100,x.fg*22),color:"red"}));
    const complaintTop=operators.filter(x=>x.complaints>0).sort((a,b)=>b.complaints-a.complaints).map(x=>({label:x.operator,value:x.complaints,width:Math.min(100,x.complaints*18),color:"gold"}));
    renderPodium("top-quality",qualityTop,fmtPct);renderPodium("top-fg",fgTop,fmtInt);renderPodium("top-complaints",complaintTop,fmtInt);
    const lowestSkill=aggregate(f.monitoring,"skill").filter(x=>Number.isFinite(x.average)&&x.count>=3).sort((a,b)=>a.average-b.average)[0];
    const insights=[{text:`Qualidade geral em ${fmtPct(quality)}, ${quality>=qualityTarget()?"acima":"abaixo"} da meta de ${fmtPct(qualityTarget())}.`,tone:quality>=qualityTarget()?"":"warn"},{text:`ISC geral de ${fmtPct(iscValue)}, calculado com P1, P2 e P3.`,tone:iscValue>=satisfactionTarget()?"":"warn"},{text:`${fmtInt(fg)} falta(s) grave(s) em ${fmtInt(notes.length)} monitorias.`,tone:fg?"danger":""},{text:lowestSkill?`${lowestSkill.label} apresenta a menor média entre as skills com ao menos 3 avaliações: ${fmtPct(lowestSkill.average)}.`:"Sem volume suficiente para destacar oportunidades por skill.",tone:"warn"}];
    $("general-insights").innerHTML=insights.map(x=>`<div class="insight ${x.tone}">${escapeHtml(x.text)}</div>`).join("");
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

  function renderQuality(f,operators){
    const notes=f.monitoring.map(x=>x.note).filter(Number.isFinite),quality=average(notes),maxOps=operators.filter(x=>x.evaluations>0&&Math.abs(x.quality-100)<.0001).length,below=operators.filter(x=>x.evaluations>0&&x.quality<qualityTarget()).length;
    $("quality-kpis").innerHTML=[kpi("Total de Monitorias",fmtInt(notes.length),"Atendimentos avaliados","headset",{meter:100}),kpi("Média Geral",fmtPct(quality),`Meta ≥ ${fmtPct(qualityTarget())}`,"star",{meter:quality,performance:true}),kpi("Alta Performance",fmtInt(maxOps),"Operadores com média de 100%","arrow-up",{meter:operators.length?maxOps/operators.length*100:0}),kpi("Abaixo da Meta",fmtInt(below),`Operadores abaixo de ${fmtPct(qualityTarget())}`,"arrow-down",{danger:below>0,meter:operators.length?below/operators.length*100:0})].join("");
    const table=(target,rows)=>{$(target).innerHTML=rows.map(x=>`<tr><td><strong>${escapeHtml(x.label)}</strong></td><td>${fmtInt(x.count)}</td><td class="${metricClass(x.average)}">${fmtPct(x.average)}</td></tr>`).join("")||`<tr><td colspan="3" class="empty">Sem dados.</td></tr>`;};
    const originRows=aggregate(f.monitoring,"origin").sort((a,b)=>b.count-a.count),skillRows=aggregate(f.monitoring,"skill").sort((a,b)=>b.count-a.count),formRows=aggregate(f.monitoring,"form").sort((a,b)=>b.count-a.count);
    table("quality-origin-table",originRows);
    const skillPaged=paginateRows(skillRows,state.qualitySkillPage,state.qualitySkillPageSize);state.qualitySkillPage=skillPaged.page;table("quality-skill-table",skillPaged.rows);syncPager("quality-skill",skillPaged,state.qualitySkillPageSize);
    table("quality-form-table",formRows);
    renderRank("quality-type-chart",aggregate(f.monitoring,"monitoringType").sort((a,b)=>b.count-a.count).map(x=>({label:x.label,value:x.average,sub:x.count})),{limit:8,format:fmtPct,maxValue:100,performance:true});
    const criteria=aggregateCriteria(f.criteria).sort((a,b)=>b.errorRate-a.errorRate),offenders=criteria.filter(x=>x.errors>0).slice(0,3);
    $("criteria-offenders").innerHTML=offenders.length?offenders.map((x,index)=>`<div class="offender-card"><span class="offender-position">${index+1}</span><div class="offender-copy"><strong title="${escapeHtml(x.criterion)}">${escapeHtml(shorten(x.criterion,72))}</strong><span>${escapeHtml(x.kind||"Dimensão não informada")} · ${fmtInt(x.errors)} erro(s) em ${fmtInt(x.total)} aplicações</span></div><div class="offender-rate"><strong>${fmtPct(x.errorRate)}</strong><span>erro</span></div></div>`).join(""):empty("Nenhum critério ofensor no recorte selecionado.");
    const visibleCriteria=criteria.filter(x=>state.criteriaDimension==="all"||normalize(x.kind)===normalize(state.criteriaDimension));
    const criteriaPaged=paginateRows(visibleCriteria,state.criteriaPage,state.criteriaPageSize);state.criteriaPage=criteriaPaged.page;
    $("criteria-table").innerHTML=criteriaPaged.rows.map(x=>`<tr><td><strong>${escapeHtml(shorten(x.criterion,110))}</strong></td><td>${escapeHtml(x.kind)}</td><td>${x.weight}</td><td>${fmtInt(x.total)}</td><td class="metric-good">${fmtInt(x.hits)}</td><td class="${x.errors?"metric-danger":""}">${fmtInt(x.errors)}</td><td class="${metricClass(x.accuracy)}">${fmtPct(x.accuracy)}</td><td class="${x.errorRate>=10?"metric-danger":x.errorRate>0?"metric-warn":""}">${fmtPct(x.errorRate)}</td></tr>`).join("")||`<tr><td colspan="8" class="empty">Sem itens para a dimensão selecionada.</td></tr>`;
    syncPager("criteria",criteriaPaged,state.criteriaPageSize);
  }

  function operatorSurveyRows(items){return items.map(x=>{const p1=iscFromCounts(x.p1||[]),p2=iscFromCounts(x.p2||[]),p3=iscFromCounts(x.p3||[]),all=[0,0,0,0,0];["p1","p2","p3"].forEach(q=>(x[q]||[]).forEach((v,i)=>all[i]+=+v||0));return{...x,p1Score:p1,p2Score:p2,p3Score:p3,isc:iscFromCounts(all),responses:sum(all),quartile:quartile(iscFromCounts(all))};}).filter(x=>x.responses>0);}
  function renderSurvey(f){
    const overall=isc(f.satisfaction),p1=isc(f.satisfaction,"p1"),p2=isc(f.satisfaction,"p2"),p3=isc(f.satisfaction,"p3"),responses=sum(questionCounts(f.satisfaction));
    $("survey-kpis").innerHTML=[kpi("ISC Geral",fmtPct(overall),"P1 + P2 + P3","survey",{meter:overall,performance:true}),kpi("P1 Atendimento",fmtPct(p1),"Notas 4 e 5","check",{meter:p1,performance:true}),kpi("P2 Cordialidade",fmtPct(p2),"Notas 4 e 5","check",{meter:p2,performance:true}),kpi("P3 Clareza",fmtPct(p3),"Notas 4 e 5","check",{meter:p3,performance:true}),kpi("Respondidas",fmtInt(responses),"Somatório de P1, P2 e P3","clipboard",{meter:100})].join("");
    const allRows=operatorSurveyRows(f.satisfaction).sort((a,b)=>b.isc-a.isc),stats=quartileStats(allRows.map(x=>({value:x.isc})));
    $("survey-quartile-detail").innerHTML=stats.map(x=>`<div class="quartile-card"><span class="quartile-badge">Q${x.q}</span><div><strong>${fmtInt(x.count)}</strong><small>${x.range}</small></div><div><strong>${fmtPct(x.average)}</strong><small>Média do quartil</small></div></div>`).join("");
    const rows=state.surveyQuartile==="all"?allRows:allRows.filter(x=>String(x.quartile)===String(state.surveyQuartile));
    const paged=paginateRows(rows,state.surveyPage,state.surveyPageSize);state.surveyPage=paged.page;
    $("survey-operator-count").textContent=rows.length?`${fmtInt(rows.length)} operadores · ${fmtInt(paged.start+1)}–${fmtInt(paged.end)}`:"0 operadores";
    const hideSupervisor=state.supervisor!=="all";
    $("survey-supervisor-header")?.classList.toggle("hidden",hideSupervisor);
    $("survey-table").innerHTML=paged.rows.map(x=>`<tr><td>${escapeHtml(x.re)}</td><td><strong>${escapeHtml(x.operator)}</strong></td>${hideSupervisor?"":`<td>${escapeHtml(x.supervisor||"Não atribuída")}</td>`}<td>${fmtInt(x.responses)}</td><td class="${metricClass(x.p1Score)}">${fmtPct(x.p1Score)}</td><td class="${metricClass(x.p2Score)}">${fmtPct(x.p2Score)}</td><td class="${metricClass(x.p3Score)}">${fmtPct(x.p3Score)}</td><td class="${metricClass(x.isc)}">${fmtPct(x.isc)}</td><td>${quartileBadge(x.quartile)}</td></tr>`).join("")||`<tr><td colspan="${hideSupervisor?8:9}" class="empty">Sem respostas de pesquisa para o quartil selecionado.</td></tr>`;
    syncPager("survey",paged,state.surveyPageSize);
  }

  function renderFg(f){
    const rows=f.monitoring.filter(x=>x.fg),operators=new Set(rows.map(x=>x.re||x.operator)).size,origins=new Set(rows.map(x=>x.origin).filter(Boolean)).size,skills=new Set(rows.map(x=>x.skill).filter(Boolean)).size;
    $("fg-kpis").innerHTML=[kpi("Total de FGs",fmtInt(rows.length),"Não conformidades críticas","alert",{danger:rows.length>0,meter:100}),kpi("Operadores com FG",fmtInt(operators),fmtPct(f.monitoring.length?operators/new Set(f.monitoring.map(x=>x.re)).size*100:NaN),"users",{danger:operators>0,meter:f.monitoring.length?operators/new Set(f.monitoring.map(x=>x.re)).size*100:0}),kpi("Origens",fmtInt(origins),"Fontes de identificação","layers",{meter:100}),kpi("Skills",fmtInt(skills),"Áreas com ocorrência","grid",{meter:100})].join("");
    renderRank("fg-reasons",countBy(rows,"fgReason").map(x=>({...x,color:"red"})),{limit:10,color:"red"});renderRank("fg-origins",countBy(rows,"origin"),{limit:10});renderRank("fg-skills",countBy(rows,"skill"),{limit:10,color:"gold"});
    const map=new Map();rows.forEach(x=>{const key=x.re||x.operator,r=map.get(key)||{operator:x.operator,re:x.re,supervisor:x.supervisor,rows:[]};r.rows.push(x);map.set(key,r);});const opRows=[...map.values()].map(x=>({...x,count:x.rows.length,reason:mode(x.rows,"fgReason"),origin:mode(x.rows,"origin"),skill:mode(x.rows,"skill")})).sort((a,b)=>b.count-a.count);
    const paged=paginateRows(opRows,state.fgPage,state.fgPageSize);state.fgPage=paged.page;
    $("fg-operator-count").textContent=opRows.length?`${fmtInt(opRows.length)} operadores · ${fmtInt(paged.start+1)}–${fmtInt(paged.end)}`:"0 operadores";
    const hideSupervisor=state.supervisor!=="all";
    $("fg-supervisor-header")?.classList.toggle("hidden",hideSupervisor);
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
    const targetMarks=targetValid.length?`<path d="${targetPath}" class="chart-line target-series"/>${targetValid.map(point=>`<circle cx="${x(point.i)}" cy="${y(point.value)}" r="5" class="chart-point target-point"/><text x="${x(point.i)}" y="${Math.max(pad.top+16,y(point.value)-18)}" text-anchor="middle" class="chart-target-value-label">Meta ${(def.targetFormat||def.format)(point.value)}</text>`).join("")}`:"";
    const legend=targetValid.length?`<div class="chart-legend"><span><i class="target"></i>Meta TMA</span><span><i class="actual"></i>Realizado</span></div>`:"";
    return`${legend}<svg class="trend-chart" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Evolução mensal de ${escapeHtml(def.label)}">${grid}${axes}${target}${marks}${targetMarks}${labels}</svg>`;
  }
  function renderComparison(){
    const months=availableMonths(),metrics=months.map(month=>({month,...comparisonMetric(month)}));
    const defs=[
      {key:"quality",label:"Média Geral Qualidade",format:fmtPct,axis:v=>`${Math.round(v)}%`,percent:true,targetValue:qualityTarget(),kind:"line",higher:true},
      {key:"isc",label:"Média Pesquisa (ISC)",format:fmtPct,axis:v=>`${Math.round(v)}%`,percent:true,targetValue:satisfactionTarget(),kind:"line",higher:true},
      {key:"tma",label:"TMA",format:fmtTime,axis:v=>v===0?"00:00":fmtTime(v),kind:"line",time:true,higher:false,targetKey:"tmaTarget",targetFormat:fmtTimeFull},
      {key:"fg",label:"Falta Grave",format:fmtInt,axis:v=>fmtInt(v),kind:"bar",higher:false},
      {key:"complaints",label:"Reclamações",format:fmtInt,axis:v=>fmtInt(v),kind:"bar",higher:false},
      {key:"compliments",label:"Elogios",format:fmtInt,axis:v=>fmtInt(v),kind:"bar",higher:true},
      {key:"clientAudit",label:"Auditorias Cliente",format:fmtInt,axis:v=>fmtInt(v),kind:"bar",higher:false},
      {key:"internalAudit",label:"Auditoria Interna",format:fmtInt,axis:v=>fmtInt(v),kind:"bar",higher:false}
    ];
    $("comparison-charts").innerHTML=months.length?defs.map(def=>{
      const series=metrics.map(item=>({month:item.month,value:item[def.key]})),targetSeries=def.targetKey?metrics.map(item=>({month:item.month,value:item[def.targetKey]})):[],finite=series.map(x=>x.value).filter(Number.isFinite),first=finite[0],last=finite.at(-1),delta=Number.isFinite(first)&&Number.isFinite(last)?last-first:NaN,good=Number.isFinite(delta)&&(def.higher?delta>=0:delta<=0);
      const deltaText=!Number.isFinite(delta)?"Sem variação":delta===0?"Estável":`${delta>0?"+":""}${def.percent?delta.toLocaleString("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:2})+" p.p.":def.key==="tma"?`${Math.round(delta)} s`:fmtInt(delta)}`;
      return`<article class="trend-panel"><header><div><span class="panel-kicker">${def.kind==="bar"?"VOLUME":"EVOLUÇÃO"}</span><h3>${def.label}</h3></div><span class="trend-delta ${Number.isFinite(delta)?good?"metric-good":"metric-danger":""}">${deltaText}</span></header>${trendChart(def,series,targetSeries)}</article>`;
    }).join(""):empty("Importe um relatório com dados mensais para gerar os gráficos.");
    $("comparison-head").innerHTML=`<tr><th>Indicador</th>${months.map(month=>`<th>${escapeHtml(monthLabel(month))}</th>`).join("")}</tr>`;
    const tableDefs=defs.flatMap(def=>def.key==="tma"?[def,{key:"tmaTarget",label:"Meta TMA",format:fmtTimeFull}]:[def]);
    $("comparison-table").innerHTML=tableDefs.map(def=>`<tr><td><strong>${def.label}</strong></td>${metrics.map(item=>`<td class="${def.percent?metricClass(item[def.key]):""}">${def.format(item[def.key])}</td>`).join("")}</tr>`).join("")||`<tr><td class="empty">Sem dados mensais.</td></tr>`;
  }

  function renderOperators(operators){
    const visible=operators.filter(x=>state.operatorStatus==="all"||x.status===state.operatorStatus).sort((a,b)=>{const av=a[state.sort.key],bv=b[state.sort.key],dir=state.sort.direction==="asc"?1:-1;if(typeof av==="string")return av.localeCompare(bv,"pt-BR")*dir;return((Number.isFinite(av)?av:-Infinity)-(Number.isFinite(bv)?bv:-Infinity))*dir;});
    const counts={excellent:operators.filter(x=>x.status==="excellent").length,good:operators.filter(x=>x.status==="good").length,attention:operators.filter(x=>x.status==="attention").length};
    const paged=paginateRows(visible,state.operatorPage,state.operatorPageSize);state.operatorPage=paged.page;
    $("operator-count").textContent=visible.length?`${fmtInt(visible.length)} operadores · ${fmtInt(paged.start+1)}–${fmtInt(paged.end)}`:"0 operadores";
    $("operator-summary").innerHTML=`<div class="summary-tile"><strong>${fmtInt(counts.excellent)}</strong><span>Destaques com média de 100%</span></div><div class="summary-tile warn"><strong>${fmtInt(counts.good)}</strong><span>Dentro da meta</span></div><div class="summary-tile danger"><strong>${fmtInt(counts.attention)}</strong><span>Para acompanhamento</span></div>`;
    $("operators-table").innerHTML=paged.rows.map(x=>`<tr><td>${escapeHtml(x.re)}</td><td><strong>${escapeHtml(x.operator)}</strong></td><td>${fmtInt(x.evaluations)}</td><td class="${metricClass(x.quality)}">${fmtPct(x.quality)}</td><td>${quartileBadge(x.quartileQuality)}</td><td class="${metricClass(x.isc)}">${fmtPct(x.isc)}</td><td>${fmtInt(x.calls)}</td><td>${fmtTime(x.tma)}</td><td class="${x.fg?"metric-danger":""}">${fmtInt(x.fg)}</td><td>${badge(x.status)}</td></tr>`).join("")||`<tr><td colspan="10" class="empty">Nenhum operador encontrado.</td></tr>`;
    syncPager("operator",paged,state.operatorPageSize);
  }

  function render(){
    const f=filtered(),operators=buildOperators(f);
    renderGeneral(f,operators);renderSpecial(f);renderQuality(f,operators);renderSurvey(f);renderFg(f);renderComparison();renderOperators(operators);
    $("reference-label").textContent=state.view==="comparison"?"EVOLUÇÃO MENSAL":state.month==="all"?"TODOS OS MESES":monthLabel(state.month);
    $("last-update").textContent=data.meta?.importedAt?`Atualizado neste dispositivo em ${new Date(data.meta.importedAt).toLocaleString("pt-BR")}`:"Dados carregados do relatório-base";
  }

  function options(values,allLabel){return`<option value="all">${allLabel}</option>${values.map(x=>`<option value="${escapeHtml(x)}">${escapeHtml(x)}</option>`).join("")}`;}
  function populateFilters(reset=false){
    const months=sortMonths(new Set([...data.monitoring,...data.satisfaction,...data.tma,...(data.skillTma||[])].map(x=>x.m).filter(Boolean)));
    const skills=[...new Set([...data.monitoring,...data.criteria,...(data.skillTma||[])].map(x=>x.skill).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"pt-BR"));
    const forms=[...new Set([...data.monitoring,...data.criteria].map(x=>x.form).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"pt-BR"));
    const supervisors=[...new Set([...data.monitoring,...data.satisfaction,...data.tma].map(x=>x.supervisor).filter(x=>x&&!normalize(x).startsWith("aline fernandes")))].sort((a,b)=>a.localeCompare(b,"pt-BR"));
    const latest=months.at(-1)||"all";if(reset||!months.includes(state.month))state.month=latest;
    $("month-filter").innerHTML=options(months,"Todos os meses");$("skill-filter").innerHTML=options(skills,"Todas as skills");$("form-filter").innerHTML=options(forms,"Todas as aferições");$("supervisor-filter").innerHTML=options(supervisors,"Todas as supervisões");
    $("month-filter").value=state.month;$("skill-filter").value=state.skill;$("form-filter").value=state.form;$("supervisor-filter").value=state.supervisor;
  }

  function updateFilterVisibility(){
    const noSkill=["general","survey","comparison"].includes(state.view);$("skill-filter-group").classList.toggle("hidden",noSkill);if(noSkill){state.skill="all";$("skill-filter").value="all";}
    const quality=state.view==="quality";$("form-filter-group").classList.toggle("hidden",!quality);if(!quality){state.form="all";$("form-filter").value="all";}
    const comparison=state.view==="comparison";$("month-filter-group").classList.toggle("hidden",comparison);
  }
  function updateHeader(){const config=viewHeaders[state.view]||viewHeaders.general;$("masthead-eyebrow").textContent=config.eyebrow;$("masthead-title").innerHTML=config.title;$("masthead-subtitle").textContent=config.subtitle;$("reference-caption").textContent=state.view==="comparison"?"PERÍODO COMPARADO":"MÊS DE REFERÊNCIA";}
  function applyTheme(theme){
    const light=theme==="light";document.body.classList.toggle("light",light);const button=$("theme-toggle");
    button.querySelector(".theme-icon").innerHTML=iconSvg(light?"moon":"sun");button.querySelector(".theme-label").textContent=light?"Modo noite":"Modo dia";button.setAttribute("aria-label",light?"Ativar modo noite":"Ativar modo dia");button.setAttribute("aria-pressed",String(light));
    try{localStorage.setItem("mq-theme",light?"light":"dark");}catch{/* preferência opcional */}
  }
  function switchView(view){state.view=view;document.querySelectorAll(".view").forEach(x=>x.classList.toggle("active",x.id===view));document.querySelectorAll(".nav-item").forEach(x=>x.classList.toggle("active",x.dataset.view===view));updateFilterVisibility();updateHeader();render();window.scrollTo({top:0,behavior:"smooth"});}

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
    body.innerHTML=items.length?items.map(item=>`<tr><td>${escapeHtml(formatAdminDateTime(item.dateTime||item.createdAt||item.updatedAt))}</td><td>${escapeHtml(item.type||"—")}</td><td title="${escapeHtml(item.file||"")}">${escapeHtml(shorten(item.file||"—",40))}</td><td>${escapeHtml(item.records??"—")}</td><td><span class="history-status ${normalize(item.status)==="sucesso"?"ok":normalize(item.status)==="erro"?"error":"pending"}">${escapeHtml(item.status||"—")}</span></td><td title="${escapeHtml(item.details||"")}">${escapeHtml(shorten(item.details||"—",64))}</td></tr>`).join(""):`<tr><td colspan="6" class="admin-history-empty">Nenhuma importação registrada.</td></tr>`;
  }

  async function loadImportHistory(){
    try{
      const response=await fetch("/api/admin/history",{cache:"no-store"});
      if(!response.ok)return;
      const payload=await response.json();renderImportHistory(Array.isArray(payload)?payload:payload.items||[]);
    }catch{/* histórico não bloqueia o painel */}
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
      .admin-toolbar{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin:14px 0 6px}.admin-toolbar .secondary-button{min-width:150px}.admin-updated{font-size:12px;color:var(--muted,#91a4b7);font-weight:700}.admin-history-wrap{overflow:auto;border:1px solid rgba(128,160,190,.22);border-radius:12px}.admin-history{width:100%;border-collapse:collapse;min-width:760px;font-size:12px}.admin-history th,.admin-history td{padding:10px 12px;text-align:left;border-bottom:1px solid rgba(128,160,190,.16);vertical-align:top}.admin-history th{font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted,#91a4b7)}.admin-history tr:last-child td{border-bottom:0}.history-status{display:inline-flex;padding:3px 8px;border-radius:999px;font-size:10px;font-weight:800}.history-status.ok{background:rgba(21,226,172,.12);color:#15e2ac}.history-status.error{background:rgba(255,82,109,.12);color:#ff526d}.history-status.pending{background:rgba(255,193,61,.12);color:#ffc13d}.admin-history-empty{text-align:center!important;color:var(--muted,#91a4b7);padding:18px!important}
    `;document.head.appendChild(style);
  }

  function injectAdminInterface(status){
    if($("admin-dialog"))return;
    injectAdminStyles();
    document.querySelector(".masthead-actions").insertAdjacentHTML("beforeend",`<button class="admin-open" id="admin-open" type="button" aria-haspopup="dialog"><span>${iconSvg("upload")}</span><span>Administração</span></button>`);
    document.body.insertAdjacentHTML("beforeend",`<dialog id="admin-dialog" class="import-dialog admin-dialog"><div class="dialog-card admin-card"><button class="dialog-close" id="admin-close" type="button" aria-label="Fechar">×</button><p class="eyebrow">ACESSO ADMINISTRATIVO</p><h2>Gerenciamento do relatório</h2><p class="dialog-copy">Importe novos dados, atualize o painel e acompanhe o histórico das importações.</p><div class="admin-toolbar"><button type="button" id="admin-refresh" class="secondary-button">Atualizar painel</button><span class="admin-updated" id="admin-last-updated">Última atualização: ${formatAdminDateTime(latestUpdateValue(status))}</span></div><section class="admin-section"><div><h3>Importação de dados</h3><p>O XLSX principal é processado no navegador antes da publicação. Limite: <strong>30 MB</strong>. Anexos complementares: <strong>4 MB</strong>.</p></div><label class="drop-zone" id="drop-zone" for="admin-file"><input id="admin-file" type="file" accept=".xlsx,.xls,.csv,.pdf" /><span class="drop-icon">${iconSvg("clipboard")}</span><strong id="file-label">Escolher arquivo</strong><small>XLSX atualiza os painéis. XLS, CSV e PDF podem ser armazenados como anexos complementares de até 4 MB.</small></label><div class="import-checklist"><span>✓ XLSX, XLS e CSV</span><span>✓ PDF complementar</span><span>✓ Validação de extensão, MIME e assinatura</span></div><div id="import-progress" class="import-progress" hidden><div class="progress-track"><span id="progress-bar"></span></div><p id="progress-label">Preparando o arquivo...</p></div><div id="import-error" class="import-error" hidden></div><button type="button" id="process-file" class="primary-button" disabled>Validar e importar</button><p class="admin-latest" id="admin-latest">${status?.upload?`Último envio: ${escapeHtml(status.upload.originalName)} · ${formatAdminDateTime(status.upload.uploadedAt)}`:"Nenhum envio administrativo registrado."}</p></section><section class="admin-section"><div><h3>Histórico de Importações</h3><p>Registros mais recentes primeiro.</p></div><div class="admin-history-wrap"><table class="admin-history"><thead><tr><th>Data/Hora</th><th>Tipo</th><th>Arquivo</th><th>Registros</th><th>Status</th><th>Detalhes</th></tr></thead><tbody id="import-history-body"><tr><td colspan="6" class="admin-history-empty">Carregando histórico...</td></tr></tbody></table></div></section><section class="admin-section"><div><h3>Configurações dos indicadores</h3><p>Defina as metas usadas nos cards, alertas e gráficos comparativos.</p></div><div class="admin-settings"><label>Meta de Qualidade (%)<input id="quality-target-setting" type="number" min="0" max="100" step="0.01" value="${qualityTarget()}"></label><label>Meta de Pesquisa — ISC (%)<input id="satisfaction-target-setting" type="number" min="0" max="100" step="0.01" value="${satisfactionTarget()}"></label></div><button type="button" id="save-settings" class="secondary-button">Salvar configurações</button><div id="settings-error" class="import-error" hidden></div></section></div></dialog>`);
    const dialog=$("admin-dialog");
    $("admin-open").addEventListener("click",()=>{dialog.showModal();loadImportHistory();updateLastUpdatedLabel(latestUpdateValue(status));});
    $("admin-close").addEventListener("click",()=>dialog.close());
    $("admin-refresh").addEventListener("click",refreshDashboardData);
    $("admin-file").addEventListener("change",e=>setFile(e.target.files[0]));
    $("process-file").addEventListener("click",processImport);
    $("save-settings").addEventListener("click",saveSettings);
    const drop=$("drop-zone");
    ["dragenter","dragover"].forEach(type=>drop.addEventListener(type,e=>{e.preventDefault();drop.classList.add("drag");}));
    ["dragleave","drop"].forEach(type=>drop.addEventListener(type,e=>{e.preventDefault();drop.classList.remove("drag");}));
    drop.addEventListener("drop",e=>setFile(e.dataTransfer.files[0]));
    loadImportHistory();
  }

  function setFile(file){
    const allowed=["xlsx","xls","csv","pdf"],extension=(file?.name.split(".").pop()||"").toLowerCase(),error=$("import-error");
    const limitMB=extension==="xlsx"?30:4,limitBytes=limitMB*1024*1024;
    error.hidden=true;
    if(file&&(!allowed.includes(extension)||file.size>limitBytes)){
      window.selectedAdminFile=null;$("process-file").disabled=true;$("file-label").textContent="Escolher arquivo";
      error.textContent=file.size>limitBytes?`O arquivo excede o limite de ${limitMB} MB para este tipo.`:"Formato não suportado. Utilize XLSX, XLS, CSV ou PDF.";error.hidden=false;return;
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
    const extension=(file.name.split(".").pop()||"").toLowerCase(),error=$("import-error"),progress=$("import-progress"),bar=$("progress-bar"),label=$("progress-label");
    error.hidden=true;progress.hidden=false;$("process-file").disabled=true;let importId=null;
    try{
      if(extension==="xlsx"){
        bar.style.width="8%";label.textContent="Validando a estrutura da planilha...";
        await ensureImporter();
        const result=await window.XLSXImporter.parse(file,(percent,message)=>{bar.style.width=`${8+percent*.72}%`;label.textContent=message;});
        result.meta={...(result.meta||{}),qualityTarget:qualityTarget(),satisfactionTarget:satisfactionTarget(),importedAt:new Date().toISOString()};
        bar.style.width="86%";label.textContent="Publicando os dados consolidados...";
        const save=await fetch("/api/admin/data",{method:"POST",headers:{"content-type":"application/json","x-file-name":encodeURIComponent(file.name),"x-import-records":String(result.monitoring?.length||0)},body:JSON.stringify(result)});
        if(!save.ok)throw new Error(await apiError(save,"Não foi possível atualizar os painéis."));
        data=result;state.month="all";state.skill="all";state.form="all";state.supervisor="all";state.search="";state.criteriaDimension="all";state.specialPage=1;$("criteria-dimension-filter").value="all";populateFilters(true);updateHeader();render();updateLastUpdatedLabel(result.meta.importedAt);
        $("admin-latest").textContent=`Último envio: ${file.name} · ${formatAdminDateTime(result.meta.importedAt)}`;
        toast("Relatório validado e painéis atualizados com sucesso.");
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
    $("main-nav").addEventListener("click",e=>{const button=e.target.closest("[data-view]");if(button)switchView(button.dataset.view);});
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
    $("theme-toggle").addEventListener("click",()=>applyTheme(document.body.classList.contains("light")?"dark":"light"));
    $("mobile-filter-toggle").addEventListener("click",e=>{const open=$("dashboard-filters").classList.toggle("expanded");e.currentTarget.setAttribute("aria-expanded",String(open));});
  }

  async function bootstrap(){
    let initialTheme="dark";try{initialTheme=localStorage.getItem("mq-theme")||"dark";}catch{/* modo escuro padrão */}
    await loadServerState();populateFilters();updateFilterVisibility();updateHeader();bind();applyTheme(initialTheme);render();await establishAdmin();
  }
  bootstrap();
})();
