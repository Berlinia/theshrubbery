import test from 'node:test';
import assert from 'node:assert/strict';
import {createDriveClient} from '../dist/googleDrive.js';
import {emptyDocument,serializeDocument} from '../dist/documentFormat.js';
function setup(routes,account='account-A'){
 const calls=[];let now=0;
 const google={accounts:{oauth2:{hasGrantedAllScopes:()=>true,initTokenClient:options=>({requestAccessToken:()=>options.callback({access_token:'test-token',expires_in:3600})})}}};
 const client=createDriveClient({clientId:'test.apps.googleusercontent.com',googleProvider:()=>google,now:()=>now,fetchImpl:async(url,options)=>{
  calls.push({url,options});
  if(url.includes('/about?'))return new Response(JSON.stringify({user:{permissionId:account,emailAddress:'test@example.invalid'}}));
  return routes(url,options);
 }});
 return {client,calls,setTime:t=>now=t};
}
test('unconfigured Drive refuses connection',async()=>{await assert.rejects(createDriveClient({clientId:''}).connect(),/not been configured/);});
test('new save uses Wildsea namespace and multipart Markdown',async()=>{
 const {client,calls}=setup(()=>new Response(JSON.stringify({id:'new',modifiedTime:'t1'})));await client.connect();
 const saved=await client.save({...emptyDocument('# Hello'),id:'local-id'});assert.equal(saved.account,'account-A');
 const request=calls.at(-1);assert.equal(request.options.method,'POST');assert.match(request.options.body,/wildsea-shrubbery/);assert.match(request.options.body,/# Hello/);assert.doesNotMatch(request.options.body,/deltagreenery/);
});
test('existing same-account file is patched with a precondition',async()=>{
 const {client,calls}=setup(url=>url.includes('/upload/')?new Response(JSON.stringify({id:'saved',modifiedTime:'t2'})):new Response(JSON.stringify({id:'saved',modifiedTime:'t1'}),{headers:{etag:'"rev1"'}}));await client.connect();
 await client.save({...emptyDocument(),id:'local',drive:{id:'saved',account:'account-A',modifiedTime:'t1'}});
 assert.equal(calls.at(-1).options.method,'PATCH');assert.equal(calls.at(-1).options.headers['If-Match'],'"rev1"');
});
test('another account never overwrites the old account file',async()=>{const {client,calls}=setup(()=>new Response(JSON.stringify({id:'new',modifiedTime:'t2'})),'account-B');await client.connect();await client.save({...emptyDocument(),id:'local',drive:{id:'old',account:'account-A',modifiedTime:'t1'}});assert.equal(calls.at(-1).options.method,'POST');assert.ok(!calls.at(-1).url.includes('/old'));});
test('concurrent edits are rejected before upload',async()=>{const {client,calls}=setup(()=>new Response(JSON.stringify({id:'old',modifiedTime:'newer'})));await client.connect();await assert.rejects(client.save({...emptyDocument(),drive:{id:'old',account:'account-A',modifiedTime:'t1'}}),/changed elsewhere/);assert.equal(calls.filter(c=>c.options.method==='PATCH').length,0);});
test('expired auth requires reconnection',async()=>{const {client,setTime}=setup(()=>new Response('{}'));await client.connect();setTime(3600001);assert.equal(client.connected(),false);await assert.rejects(client.save(emptyDocument()),/Connect/);});
test('list follows pagination and isolates Wildsea files',async()=>{const {client,calls}=setup(url=>new Response(JSON.stringify(url.includes('pageToken=next')?{files:[{id:'2'}]}:{files:[{id:'1'}],nextPageToken:'next'})));await client.connect();assert.equal((await client.list()).length,2);assert.match(decodeURIComponent(calls[1].url),/wildsea-shrubbery/);});
test('open parses metadata, text and Drive ownership',async()=>{const doc={...emptyDocument('# On the waves'),title:'Voyage'};const {client}=setup(url=>url.includes('alt=media')?new Response(serializeDocument(doc)):new Response(JSON.stringify({id:'file',modifiedTime:'t1'})));await client.connect();const opened=await client.open('file');assert.equal(opened.title,'Voyage');assert.equal(opened.drive.account,'account-A');});
test('unauthorized calls disconnect without retrying a write',async()=>{const {client,calls}=setup(()=>new Response('{}',{status:401}));await client.connect();await assert.rejects(client.save(emptyDocument()),/expired/);assert.equal(client.connected(),false);assert.equal(calls.filter(c=>c.options.method==='POST').length,1);});
