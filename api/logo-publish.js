import { put } from "@vercel/blob";
import { json, readBody } from "../lib/http.js";

const SECRET = "mq-logo-publish-20260919-7f3a";

function token(){
  let value=String(process.env.BLOB_READ_WRITE_TOKEN||"").trim();
  const marker="BLOB_READ_WRITE_TOKEN=";
  const index=value.indexOf(marker);
  if(index>=0)value=value.slice(index+marker.length).trim();
  if((value.startsWith('"')&&value.endsWith('"'))||(value.startsWith("'")&&value.endsWith("'")))value=value.slice(1,-1);
  return value.trim();
}

export default async function handler(req,res){
  if(req.method!=="POST")return json(res,405,{error:"Método não permitido."});
  if(req.headers["x-logo-secret"]!==SECRET)return json(res,401,{error:"Não autorizado."});
  try{
    const body=JSON.parse((await readBody(req)).toString("utf8"));
    const source=String(body.url||"");
    const name=String(body.name||"logo.png").replace(/[^a-zA-Z0-9._-]+/g,"_");
    if(!/^https:\/\//.test(source))return json(res,400,{error:"URL inválida."});
    const r=await fetch(source);
    if(!r.ok)throw new Error("Falha ao baixar logo: "+r.status);
    const buffer=Buffer.from(await r.arrayBuffer());
    const blob=await put("mq-assets/"+name,buffer,{access:"private",addRandomSuffix:false,allowOverwrite:true,contentType:r.headers.get("content-type")||"image/png",...(token()?{token:token()}:{})});
    return json(res,200,{url:blob.url,pathname:blob.pathname,size:buffer.length});
  }catch(error){
    return json(res,500,{error:error.message||"Falha."});
  }
}