((root) => {
  "use strict";

  const decoder = new TextDecoder("utf-8");
  const MONTHS = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

  const xmlDecode = (value="") => String(value)
    .replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&quot;/g,'"')
    .replace(/&apos;/g,"'").replace(/&amp;/g,"&").replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi,(_,n)=>String.fromCodePoint(parseInt(n,16)));
  const repairText = (value="") => String(value)
    .replace(/CONFIRMA\?\?O/gi,"CONFIRMAÇÃO")
    .replace(/AUTOM\?TICO/gi,"AUTOMÁTICO")
    .replace(/POPULA\?\?O/gi,"POPULAÇÃO")
    .replace(/EDUCA\?\?O/gi,"EDUCAÇÃO")
    .replace(/CAL\?ADAS/gi,"CALÇADAS")
    .replace(/POLUI\?\?O/gi,"POLUIÇÃO")
    .replace(/CORRE\?\?O/gi,"CORREÇÃO")
    .replace(/CRIAN\?A/gi,"CRIANÇA");
  const text = (value) => value == null ? "" : repairText(String(value).trim());
  const normalize = (value) => text(value).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
  const code = (value) => {
    if(value == null || value === "") return "";
    if(typeof value === "number" && Number.isFinite(value)) return String(Math.trunc(value));
    const raw=text(value); if(!raw || raw.startsWith("=")) return "";
    return raw.replace(/\.0$/,"");
  };
  const numeric = (value, fallback=0) => {
    if(typeof value === "number") return Number.isFinite(value) ? value : fallback;
    const raw=text(value).replace(/\./g,".").replace(",",".");
    const n=Number(raw); return Number.isFinite(n)?n:fallback;
  };
  const numericOrNull = (value) => {
    if(value == null || value === "") return null;
    const n=typeof value === "number" ? value : Number(text(value).replace(",","."));
    return Number.isFinite(n)?n:null;
  };
  const month = (value) => {
    if(typeof value === "number" && Number.isFinite(value) && value > 30000){
      const d=new Date(Date.UTC(1899,11,30)+Math.round(value)*86400000); return MONTHS[d.getUTCMonth()]||"";
    }
    const raw=normalize(value);
    const iso=raw.match(/\b\d{4}-(\d{2})-/); if(iso){const n=Number(iso[1]); return MONTHS[n-1]||"";}
    const map={jan:"Jan",fev:"Fev",mar:"Mar",abr:"Abr",mai:"Mai",jun:"Jun",jul:"Jul",ago:"Ago",set:"Set",out:"Out",nov:"Nov",dez:"Dez"};
    for(const [prefix,label] of Object.entries(map)) if(raw.startsWith(prefix)) return label;
    return "";
  };
  const seconds = (value) => {
    if(typeof value === "number" && Number.isFinite(value)) return Math.round(Math.abs(value)<=1?value*86400:value);
    const raw=text(value); if(!raw) return 0;
    const parts=raw.split(":").map(Number); if(parts.every(Number.isFinite)){
      if(parts.length===3) return Math.round(parts[0]*3600+parts[1]*60+parts[2]);
      if(parts.length===2) return Math.round(parts[0]*60+parts[1]);
    }
    const n=Number(raw.replace(",",".")); return Number.isFinite(n)?Math.round(Math.abs(n)<=1?n*86400:n):0;
  };

  function unzipIndex(buffer){
    const bytes=new Uint8Array(buffer),view=new DataView(buffer);
    let eocd=-1;
    for(let i=bytes.length-22;i>=Math.max(0,bytes.length-65557);i--){
      if(view.getUint32(i,true)===0x06054b50){eocd=i;break;}
    }
    if(eocd<0) throw new Error("Arquivo XLSX inválido: diretório ZIP não encontrado.");
    const count=view.getUint16(eocd+10,true),centralOffset=view.getUint32(eocd+16,true),entries=new Map();
    let pos=centralOffset;
    for(let i=0;i<count;i++){
      if(view.getUint32(pos,true)!==0x02014b50) throw new Error("Arquivo XLSX inválido: índice ZIP corrompido.");
      const method=view.getUint16(pos+10,true),compressedSize=view.getUint32(pos+20,true),uncompressedSize=view.getUint32(pos+24,true),nameLen=view.getUint16(pos+28,true),extraLen=view.getUint16(pos+30,true),commentLen=view.getUint16(pos+32,true),localOffset=view.getUint32(pos+42,true);
      const name=decoder.decode(bytes.subarray(pos+46,pos+46+nameLen));
      if(view.getUint32(localOffset,true)!==0x04034b50) throw new Error(`Arquivo XLSX inválido: entrada ${name} corrompida.`);
      const localNameLen=view.getUint16(localOffset+26,true),localExtraLen=view.getUint16(localOffset+28,true),dataStart=localOffset+30+localNameLen+localExtraLen;
      entries.set(name,{name,method,compressedSize,uncompressedSize,dataStart});
      pos+=46+nameLen+extraLen+commentLen;
    }
    const entryStream=(name)=>{
      const entry=entries.get(name); if(!entry) throw new Error(`Componente XLSX ausente: ${name}.`);
      const compressed=bytes.subarray(entry.dataStart,entry.dataStart+entry.compressedSize);
      let stream=new Blob([compressed]).stream();
      if(entry.method===8) stream=stream.pipeThrough(new DecompressionStream("deflate-raw"));
      else if(entry.method!==0) throw new Error(`Compressão ZIP não suportada (${entry.method}) em ${name}.`);
      return stream;
    };
    const entryText=async(name)=>{
      const reader=entryStream(name).getReader(); const td=new TextDecoder("utf-8"); let out="";
      while(true){const {done,value}=await reader.read();if(done)break;out+=td.decode(value,{stream:true});}
      out+=td.decode();return out;
    };
    return{entries,entryStream,entryText};
  }

  async function sharedStrings(zip){
    if(!zip.entries.has("xl/sharedStrings.xml")) return [];
    const xml=await zip.entryText("xl/sharedStrings.xml"),values=[];
    for(const match of xml.matchAll(/<si(?:\s[^>]*)?>([\s\S]*?)<\/si>/g)){
      let value=""; for(const t of match[1].matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)) value+=xmlDecode(t[1]); values.push(value);
    }
    return values;
  }

  async function workbookSheets(zip){
    const workbook=await zip.entryText("xl/workbook.xml"),rels=await zip.entryText("xl/_rels/workbook.xml.rels"),targets=new Map();
    for(const m of rels.matchAll(/<Relationship\b([^>]*?)\/?\s*>/g)){
      const attrs=m[1],id=(attrs.match(/\bId="([^"]+)"/)||[])[1],target=(attrs.match(/\bTarget="([^"]+)"/)||[])[1];
      if(id&&target){const clean=target.replace(/^\//,"");targets.set(id,clean.startsWith("xl/")?clean:`xl/${clean}`);}
    }
    const sheets=[];
    for(const m of workbook.matchAll(/<sheet\b([^>]*?)\/?\s*>/g)){
      const attrs=m[1],name=xmlDecode((attrs.match(/\bname="([^"]+)"/)||[])[1]||""),rid=(attrs.match(/\br:id="([^"]+)"/)||[])[1];
      if(name&&rid&&targets.has(rid)) sheets.push({name,path:targets.get(rid)});
    }
    return sheets;
  }

  function findSheet(sheets,expected){
    const target=normalize(expected);
    const exact=sheets.find(s=>normalize(s.name)===target);if(exact)return exact;
    return sheets.find(s=>{const current=normalize(s.name),min=Math.min(current.length,target.length);return min>=20 && Math.abs(current.length-target.length)<=3 && (current.startsWith(target)||target.startsWith(current));})||null;
  }
  const columnIndex=(ref="")=>{let n=0;for(const c of ref.match(/[A-Z]+/i)?.[0]||""){n=n*26+(c.toUpperCase().charCodeAt(0)-64);}return Math.max(0,n-1);};

  function parseCell(cellXml,shared){
    const open=(cellXml.match(/^<c\b([^>]*)>/)||[])[1]||"",type=(open.match(/\bt="([^"]+)"/)||[])[1]||"",ref=(open.match(/\br="([^"]+)"/)||[])[1]||"";
    const v=(cellXml.match(/<v(?:\s[^>]*)?>([\s\S]*?)<\/v>/)||[])[1];
    let value=null;
    if(type==="s"&&v!=null) value=shared[Number(v)]??"";
    else if(type==="inlineStr") {let out="";for(const t of cellXml.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g))out+=xmlDecode(t[1]);value=out;}
    else if(type==="str"||type==="e") value=v==null?"":xmlDecode(v);
    else if(type==="b") value=v==="1";
    else if(v!=null&&v!=="") {const n=Number(v);value=Number.isFinite(n)?n:xmlDecode(v);}
    else {
      const f=(cellXml.match(/<f(?:\s[^>]*)?>([\s\S]*?)<\/f>/)||[])[1]; if(f!=null)value=`=${xmlDecode(f)}`;
    }
    return{ref,value};
  }

  async function readRows(zip,sheet,shared,onRow){
    const reader=zip.entryStream(sheet.path).getReader(),td=new TextDecoder("utf-8"); let carry="",headers=null,rowNumber=0;
    const processRow=(rowXml)=>{
      const cells=[]; let sequential=0;
      for(const match of rowXml.matchAll(/<c\b[^>]*\/>|<c\b[^>]*>[\s\S]*?<\/c>/g)){
        const parsed=parseCell(match[0],shared),idx=parsed.ref?columnIndex(parsed.ref):sequential;cells[idx]=parsed.value;sequential=idx+1;
      }
      if(!cells.some(v=>v!==null&&v!==undefined&&v!==""))return;
      rowNumber++;
      if(!headers){headers=cells.map(v=>text(v));return;}
      const first=normalize(cells[0]);if(["mes","data","periodo","período"].includes(first))return;
      const obj={}; headers.forEach((h,i)=>{if(h)obj[h]=cells[i]??null;}); onRow(obj,rowNumber);
    };
    while(true){
      const {done,value}=await reader.read(); if(done)break; carry+=td.decode(value,{stream:true});
      while(true){const start=carry.indexOf("<row"); if(start<0){carry=carry.slice(-16);break;} const end=carry.indexOf("</row>",start); if(end<0){if(start>0)carry=carry.slice(start);break;} processRow(carry.slice(start,end+6)); carry=carry.slice(end+6);}
    }
    carry+=td.decode();
    while(true){const start=carry.indexOf("<row");if(start<0)break;const end=carry.indexOf("</row>",start);if(end<0)break;processRow(carry.slice(start,end+6));carry=carry.slice(end+6);}
  }

  async function parse(file,progress=()=>{}){
    progress(3,"Lendo o arquivo...");
    const buffer=await file.arrayBuffer();
    if(buffer.byteLength<4||new DataView(buffer).getUint32(0,true)!==0x04034b50) throw new Error("O arquivo selecionado não possui uma assinatura XLSX válida.");
    const zip=unzipIndex(buffer),sheets=await workbookSheets(zip),shared=await sharedStrings(zip);
    const required=["Quadro_Operacional","Consolidado_Monitoria","Consolidado_Aferidos_Operador","Pesquisa_Satisfação_Atendimento","Pesquisa_Satisfação_Cordialidade","Pesquisa_Satisfação_Clareza","Consolidado_Atendimentos_Pesqui","Consolidado_TMA"];
    const missing=required.filter(name=>!findSheet(sheets,name));
    if(missing.length) throw new Error(`Abas obrigatórias não encontradas: ${missing.join(", ")}.`);

    progress(10,"Parametrizando o Quadro Operacional...");
    const rosterRe=new Map(),rosterIp=new Map();
    await readRows(zip,findSheet(sheets,"Quadro_Operacional"),shared,row=>{
      const item={re:code(row.RE),ip:code(row["ID VoIP"]),operator:text(row.Nome),supervisor:text(row.Supervisor),coordinator:text(row.Coordenador),manager:text(row.Gerente),service:text(row.Servico),status:text(row["Status Operacional"]),shift:text(row.Turno)};
      if(item.re)rosterRe.set(item.re,item);if(item.ip)rosterIp.set(item.ip,item);
    });
    const roster=(reValue="",ipValue="")=>{const re=code(reValue),ip=code(ipValue);return rosterRe.get(re)||rosterIp.get(ip)||(ip?rosterRe.get(ip.slice(-5)):null)||{};};

    progress(20,"Processando monitorias...");
    const monitoring=[];
    await readRows(zip,findSheet(sheets,"Consolidado_Monitoria"),shared,row=>{
      const person=roster(row["RE OPERADOR"]),re=code(row["RE OPERADOR"]),note=numericOrNull(row.NOTA),fgReason=text(row["FALTA GRAVE"]);
      if(!re&&!text(row.OPERADOR)&&note==null)return;
      monitoring.push({m:month(row["Mês"])||month(row["DATA MONITORIA"]),re,operator:text(row.OPERADOR)||person.operator||"",supervisor:text(row.SUPERVISOR)||person.supervisor||"",note,fg:Boolean(fgReason),fgReason,origin:text(row.ORIGEM),form:text(row["AFERIÇÃO"]),skill:text(row.SKILL),monitoringType:text(row["TIPO MONITORIA"]),service:text(row["SERVIÇO"])||person.service||"",status:text(row["STATUS OPERACIONAL"])||person.status||""});
    });

    progress(38,"Consolidando critérios de qualidade...");
    const criteriaMap=new Map();
    await readRows(zip,findSheet(sheets,"Consolidado_Aferidos_Operador"),shared,row=>{
      const person=roster(row.RE),total=numeric(row.TOTAL),criterion=text(row["AVALIAÇÃO"]);if(!criterion&&!total)return;
      const item={m:month(row["Mês"]),supervisor:text(row.SUPERVISOR)||person.supervisor||"",form:text(row["AFERIÇÃO"]),skill:person.service||"",criterion,kind:text(row.TIPO),weight:numeric(row.PESO),hits:numeric(row.ACERTOS),errors:numeric(row.ERROS),total};
      const key=[item.m,item.supervisor,item.form,item.skill,item.criterion,item.kind,item.weight].join("¦"),current=criteriaMap.get(key)||{...item,hits:0,errors:0,total:0};
      current.hits+=item.hits;current.errors+=item.errors;current.total+=item.total;criteriaMap.set(key,current);
    });
    const criteria=[...criteriaMap.values()];

    progress(52,"Consolidando pesquisa de satisfação...");
    const satisfactionMap=new Map();
    const getSat=(row,create=true)=>{
      const ip=code(row["IP VOIP"]),person=roster(row.RE,ip),re=person.re||code(row.RE)||(ip?ip.slice(-5):""),m=month(row["Mês"]),key=`${m}¦${re||normalize(row.Operador||row.Nome)}`;
      if(!satisfactionMap.has(key)){if(!create)return null;satisfactionMap.set(key,{m,re,operator:text(row.Operador||row.Nome)||person.operator||"",supervisor:person.supervisor||"",p1:[0,0,0,0,0],p2:[0,0,0,0,0],p3:[0,0,0,0,0],attended:0,transferred:0,responded:0});}
      const item=satisfactionMap.get(key);item.operator||=text(row.Operador||row.Nome)||person.operator||"";item.supervisor||=person.supervisor||"";return item;
    };
    const scoreHeaders=["Muito Insatisfeito","Insatisfeito","Suficiente","Satisfeito","Muito Satisfeito"];
    for(const [sheetName,key] of [["Pesquisa_Satisfação_Atendimento","p1"],["Pesquisa_Satisfação_Cordialidade","p2"],["Pesquisa_Satisfação_Clareza","p3"]]){
      await readRows(zip,findSheet(sheets,sheetName),shared,row=>{const item=getSat(row);item[key]=scoreHeaders.map(h=>numeric(row[h]));});
    }
    await readRows(zip,findSheet(sheets,"Consolidado_Atendimentos_Pesqui"),shared,row=>{const item=getSat(row,false);if(!item)return;item.attended=numeric(row["Atendidas (Total)"]);item.transferred=numeric(row["Transferidas (Total)"]);item.responded=numeric(row.Respondidas);});
    const satisfaction=[...satisfactionMap.values()];

    progress(68,"Consolidando TMA...");
    const tma=[];
    await readRows(zip,findSheet(sheets,"Consolidado_TMA"),shared,row=>{
      const person=roster(row.RE),calls=numeric(row.Atendimentos);if(!calls&&!row.TMA)return;
      tma.push({m:month(row["Mês"]),re:code(row.RE),operator:text(row.Operador)||person.operator||"",supervisor:text(row.Supervisor)||person.supervisor||"",calls,tma:seconds(row.TMA),service:text(row["Serviço"])||person.service||""});
    });

    progress(76,"Lendo metas de TMA...");
    const tmaTargetsMap=new Map(),nqSheet=findSheet(sheets,"Consolidado_TMA x NQ");
    if(nqSheet)await readRows(zip,nqSheet,shared,row=>{const m=month(row["PERÍODO"]),target=seconds(row["META TMA"]);if(m&&target>0&&!tmaTargetsMap.has(m))tmaTargetsMap.set(m,target);});
    const tmaTargets=[...tmaTargetsMap].map(([m,target])=>({m,target}));

    progress(80,"Consolidando TMA por skill...");
    const skillTmaMap=new Map(),skillSheet=findSheet(sheets,"Consolidado_TMA x SKILL");
    if(skillSheet)await readRows(zip,skillSheet,shared,row=>{
      const person=roster(row.RE),calls=numeric(row.ATENDIDAS),m=month(row.DATA),skill=text(row.SKILL),supervisor=person.supervisor||text(row.SUPERVISOR)||"";if(!m||!skill||!calls)return;
      const key=`${m}¦${skill}¦${supervisor}`,current=skillTmaMap.get(key)||{m,skill,supervisor,calls:0,weighted:0};current.calls+=calls;current.weighted+=calls*seconds(row.TMA);skillTmaMap.set(key,current);
    });
    const skillTma=[...skillTmaMap.values()].map(x=>({m:x.m,skill:x.skill,supervisor:x.supervisor,calls:Math.round(x.calls),tma:x.calls?Math.round(x.weighted/x.calls):0}));

    progress(96,"Finalizando indicadores...");
    const result={meta:{title:"Relatório Indicadores de Qualidade",period:"Relatório importado",qualityTarget:90,satisfactionTarget:90,source:file.name,supervisionRule:"Quadro Operacional por RE ou IP VOIP",importedAt:new Date().toISOString()},monitoring,criteria,satisfaction,tma,tmaTargets,skillTma};
    progress(100,"Relatório processado com sucesso.");
    return result;
  }

  root.XLSXImporter={parse};
})(typeof window!=="undefined"?window:globalThis);
