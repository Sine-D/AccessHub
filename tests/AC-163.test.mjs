import test from 'node:test';import assert from 'node:assert/strict';
import {parseKeywords} from '../src/core/search/parser.ts';
import {validateInput,isSearchQuery} from '../src/core/search/contracts.ts';
import {createApi} from '../server/index.mjs';
test('invalid inputs rejected',()=>{for(const text of ['', ' '.repeat(4),'x'.repeat(501)])assert.throws(()=>validateInput({text}));assert.throws(()=>validateInput({text:'products',profile:{name:'private'}}));});
test('ambiguous, negated and reversed prices need clarification',()=>{for(const q of ['find places and products','please help','find products between 9000 and 1000','find places without ramps','find products under -1','find places near me'])assert.equal(parseKeywords(q).needsClarification,true,q);});
test('malformed provider output rejected',()=>assert.equal(isSearchQuery({intent:'places'}),false));
test('endpoint rejects bad origin, extra personal data and content type',async()=>{
 const server=createApi();await new Promise(r=>server.listen(0,'127.0.0.1',r));const url='http://127.0.0.1:'+server.address().port+'/api/interpret';
 try{
 assert.equal((await fetch(url,{method:'POST',headers:{Origin:'https://evil.example','Content-Type':'application/json'},body:'{}'})).status,403);
 assert.equal((await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:'products',profile:'private'})})).status,400);
 assert.equal((await fetch(url,{method:'POST',body:'products'})).status,415);
 }finally{await new Promise(r=>server.close(r));}
});

