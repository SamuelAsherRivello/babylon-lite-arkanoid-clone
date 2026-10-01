import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { moveLaneInput, toLaneInput } from '../src/game/controls.js';

test('maps pointer targets into each player’s lane and clamps invalid input',()=>{assert.equal(toLaneInput(.25,0),.5);assert.equal(toLaneInput(.75,1),.5);assert.equal(toLaneInput(0,1),0);assert.equal(toLaneInput(1,0),1);assert.equal(toLaneInput(NaN,0),.5);});
test('keyboard input remains inside its assigned lane',()=>{assert.equal(moveLaneInput(.02,-1),0);assert.equal(moveLaneInput(.98,1),1);assert.equal(moveLaneInput(.5,1),.545);});
test('focus, local pause and teardown release local paddle input',async()=>{const [content,session]=await Promise.all([readFile(new URL('../src/content/Content.jsx',import.meta.url),'utf8'),readFile(new URL('../src/game/GameSession.jsx',import.meta.url),'utf8')]);assert.match(content,/window\.addEventListener\('blur',blur\)/);assert.match(content,/if\(paused\)send\('input',\{x:\.5\}\)/);assert.match(session,/client\.disconnect\(\)/);assert.match(session,/client\.send\('input',\{x:\.5\}\)/);});
