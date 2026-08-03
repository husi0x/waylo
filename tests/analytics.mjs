import assert from 'node:assert/strict';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import Database from 'better-sqlite3';
import {spawn} from 'node:child_process';

const dataDir=fs.mkdtempSync(path.join(os.tmpdir(),'waylo-analytics-'));
fs.writeFileSync(path.join(dataDir,'data.json'),JSON.stringify({domains:[],links:[{id:'l1',name:'One',slug:'one',domain:'links.test',status:'active'},{id:'l2',name:'Two',slug:'two',domain:'links.test',status:'active'}],events:[],page:{slug:'p',name:'Test',bio:'',accent:'#000',blocks:[]}}));
const port=await new Promise((resolve,reject)=>{const s=net.createServer();s.on('error',reject);s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>resolve(p))})});
const child=spawn(process.execPath,['server.mjs'],{cwd:path.resolve(import.meta.dirname,'..'),env:{...process.env,PORT:String(port),DATA_DIR:dataDir,ADMIN_PASSWORD:'analytics-test-password'},stdio:['ignore','pipe','pipe']});
let logs='';child.stdout.on('data',d=>logs+=d);child.stderr.on('data',d=>logs+=d);
const base=`http://127.0.0.1:${port}`;
try{
  for(let i=0;i<50;i++){try{if((await fetch(base+'/api/health')).ok)break}catch{}await new Promise(r=>setTimeout(r,50));if(i===49)throw Error('server did not start: '+logs)}
  const db=new Database(path.join(dataDir,'analytics.db'));
  const insert=db.prepare('INSERT INTO click_events(id,link_id,route_id,visitor_id,country,region,city,device,device_model,os,browser,source,referrer,destination,created_at,internal) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,0)');
  const now=Date.now();
  for(let i=0;i<13;i++)insert.run('e'+i,i%3?'l1':'l2',null,'v'+(i%6),i%4?'US':'FI','R','City',i%3?'Desktop':'Mobile',i%3?'PC':'iPhone',i%3?'Windows':'iOS','Browser','Direct','Direct','https://example.com',new Date(now-i*2*86400000).toISOString());
  insert.run('old','l1',null,'old-v','DE','R','City','Mobile','Pixel','Android','Chrome','Direct','Direct','https://example.com',new Date(now-40*86400000).toISOString());
  db.close();
  const login=await fetch(base+'/api/auth/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({password:'analytics-test-password'})});
  assert.equal(login.status,200);const cookie=login.headers.get('set-cookie').split(';')[0];
  const flag=await fetch(base+'/flags/us.svg');assert.equal(flag.status,200);assert.match(flag.headers.get('content-type')||'',/svg/);assert.match(await flag.text(),/<svg/);
  const get=async query=>{const r=await fetch(base+'/api/analytics?'+query,{headers:{cookie}});const body=await r.text();assert.equal(r.status,200,body||logs);return JSON.parse(body)};
  const day=await get('period=day&pageSize=10&page=1');
  assert.equal(day.summary.clicks,1);assert.equal(day.events.length,1);assert.equal(day.pagination.total,1);assert.ok(day.timeline.every(x=>/^\d{4}-\d{2}-\d{2} \d{2}:00$/.test(x.bucket)));
  const week=await get('period=week');assert.equal(week.summary.clicks,4);assert.ok(week.timeline.every(x=>/^\d{4}-\d{2}-\d{2}$/.test(x.bucket)));
  const month=await get('period=month&pageSize=10&page=1');assert.equal(month.summary.clicks,13);assert.equal(month.pagination.pages,2);assert.equal(month.events.length,10);assert.ok(month.timeline.every(x=>/^\d{4}-\d{2}-\d{2}$/.test(x.bucket)));
  const page2=await get('period=month&pageSize=10&page=2');assert.equal(page2.events.length,3);
  const filtered=await get('period=month&linkId=l2');assert.equal(filtered.summary.clicks,5);assert.ok(filtered.events.every(x=>x.link_id==='l2'));
  console.log('analytics: PASS');
}finally{child.kill('SIGTERM');fs.rmSync(dataDir,{recursive:true,force:true})}
