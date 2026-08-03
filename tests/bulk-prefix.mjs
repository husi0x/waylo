import assert from 'node:assert/strict';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';

const dataDir=fs.mkdtempSync(path.join(os.tmpdir(),'waylo-bulk-'));
fs.writeFileSync(path.join(dataDir,'data.json'),JSON.stringify({domains:[{id:'d1',host:'links.test',status:'active',ssl:true}],links:[],events:[],page:{slug:'p',name:'Test',bio:'',accent:'#000',blocks:[]}}));
const port=await new Promise((resolve,reject)=>{const s=net.createServer();s.on('error',reject);s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>resolve(p))})});
const child=spawn(process.execPath,['server.mjs'],{cwd:path.resolve(import.meta.dirname,'..'),env:{...process.env,PORT:String(port),DATA_DIR:dataDir,ADMIN_PASSWORD:'bulk-test-password'},stdio:['ignore','pipe','pipe']});
let logs='';child.stdout.on('data',d=>logs+=d);child.stderr.on('data',d=>logs+=d);
const base=`http://127.0.0.1:${port}`;
try{
  for(let i=0;i<50;i++){try{if((await fetch(base+'/api/health')).ok)break}catch{}await new Promise(r=>setTimeout(r,50));if(i===49)throw Error('server did not start: '+logs)}
  const login=await fetch(base+'/api/auth/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({password:'bulk-test-password'})});
  assert.equal(login.status,200);const cookie=login.headers.get('set-cookie').split(';')[0];
  const headers={'content-type':'application/json',cookie};
  const bulk=await fetch(base+'/api/links/bulk',{method:'POST',headers,body:JSON.stringify({name:'Wildcard',domain:'links.test',destination:'https://example.com/bulk',prefix:'of'})});
  assert.equal(bulk.status,201);assert.equal((await bulk.json()).bulk,true);
  for(const pathname of ['/of','/of/a','/of/anything','/of/a/b']){const r=await fetch(base+pathname,{headers:{host:'links.test'},redirect:'manual'});assert.equal(r.status,302,pathname);assert.equal(r.headers.get('location'),'https://example.com/bulk',pathname)}
  const miss=await fetch(base+'/offer/a',{headers:{host:'links.test'},redirect:'manual'});assert.equal(miss.status,404);
  const exact=await fetch(base+'/api/links',{method:'POST',headers,body:JSON.stringify({name:'Exact',slug:'of/special',domain:'links.test',destination:'https://example.com/exact'})});assert.equal(exact.status,201);
  const exactHit=await fetch(base+'/of/special',{headers:{host:'links.test'},redirect:'manual'});assert.equal(exactHit.headers.get('location'),'https://example.com/exact');
  console.log('bulk-prefix: PASS');
}finally{child.kill('SIGTERM');fs.rmSync(dataDir,{recursive:true,force:true})}
