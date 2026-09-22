import { get, list } from "@vercel/blob";

function token(){
  let value=String(process.env.BLOB_READ_WRITE_TOKEN||"").trim();
  const marker="BLOB_READ_WRITE_TOKEN=";
  const index=value.indexOf(marker);
  if(index>=0)value=value.slice(index+marker.length).trim();
  if((value.startsWith('"')&&value.endsWith('"'))||(value.startsWith("'")&&value.endsWith("'")))value=value.slice(1,-1);
  return value.trim();
}
function opts(extra={}){const v=token();return v?{...extra,token:v}:extra;}
async function find(pathname){
  const result=await list(opts({prefix:pathname,limit:10}));
  return result.blobs.find(b=>b.pathname===pathname)||null;
}
export default async function handler(req,res){
  if(req.method!=="GET"){res.statusCode=405;return res.end("Método não permitido.");}
  try{
    const mode=String(req.query?.mode||"dark")==="light"?"light":"dark";
    const pathname=`mq-assets/mq-logo-${mode}-transparent.png`;
    const blob=await find(pathname);
    if(!blob){res.statusCode=404;return res.end("Logo não encontrada.");}
    const result=await get(blob.url,opts({access:"private",useCache:true}));
    if(!result||result.statusCode!==200){res.statusCode=404;return res.end("Logo não encontrada.");}
    res.setHeader("Content-Type","image/png");
    res.setHeader("Cache-Control","public, max-age=3600, stale-while-revalidate=86400");
    const reader=result.stream.getReader();
    while(true){const {done,value}=await reader.read();if(done)break;res.write(Buffer.from(value));}
    res.end();
  }catch(error){
    res.statusCode=500;res.end("Não foi possível carregar a logo.");
  }
}