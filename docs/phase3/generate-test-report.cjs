// Generate the client report from recorded evidence; does not execute application tests.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { chromium } = require('../../frontend/node_modules/@playwright/test');
const root = path.resolve(__dirname, '../..');
const evidence = path.join(__dirname, 'evidence');
const output = path.join(root, 'deliverables/Deeparture_V2_Phase3_Test_Report_Rev1.0_2026-10-31.pdf');
const escape = value => String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const suites = [
  ['Phase 3 Operator Portal', 'phase3-results.json', 'P3'],
  ['Phase 1 regression', 'phase1-test-results.json', 'P1'],
  ['Phase 2A regression', 'phase2a-test-results.json', 'P2A'],
  ['Phase 2B API regression', 'phase2b-api-results.json', 'P2B'],
  ['Extended Phase 2B regression', 'phase2b-acceptance-results.json', 'P2BX'],
].map(([name,file,prefix]) => ({ name, file, prefix, ...JSON.parse(fs.readFileSync(path.join(evidence,file),'utf8')) }));
for (const suite of suites) {
  if (!suite.results.length || suite.results.some(result => result.status !== 'passed')) throw new Error('Nonpassing or missing evidence: ' + suite.file);
}
const backend = fs.readFileSync(path.join(evidence,'backend-checks.txt'),'utf8');
const build = fs.readFileSync(path.join(evidence,'frontend-build.txt'),'utf8');
if (!backend.includes('pass 38') || !backend.includes('fail 0') || !build.includes('Compiled successfully')) throw new Error('Expected successful check/build evidence missing');
const rows = data => data.map(row => `<tr>${row.map(cell=>`<td>${cell}</td>`).join('')}</tr>`).join('');
const table = (headers,data,widths='') => `<table>${widths}<thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rows(data)}</tbody></table>`;
const total = suites.reduce((sum,suite)=>sum+suite.results.length,0);
const summary = [
 ['Backend JavaScript syntax','104 files','PASS','PENDING'],
 ['Phase 2B architecture/static checks','All checks','PASS','PENDING'],
 ['Phase 3 architecture/static checks','All checks','PASS','PENDING'],
 ['Backend unit tests','38 / 38','PASS','PENDING'],
 ['Next.js production build','Operator and existing routes','PASS','PENDING'],
 ...suites.map(suite=>[escape(suite.name),`${suite.results.length} / ${suite.results.length} groups`,'PASS','PENDING']),
];
const sections = suites.map(suite=>`<section class="suite"><h2>${escape(suite.name)}</h2><p class="muted">Evidence: ${escape(suite.file)} · ${escape(new Date(suite.testedAt).toLocaleString('en-GB',{timeZone:'Asia/Dhaka',hour12:false}))} (Asia/Dhaka)</p>${table(['ID','Executed test group','Local','Render'],suite.results.map((result,index)=>[`${suite.prefix}-${String(index+1).padStart(2,'0')}`,escape(result.label),'PASS','PENDING']),'<colgroup><col style="width:12%"><col style="width:64%"><col style="width:10%"><col style="width:14%"></colgroup>')}</section>`).join('');
const files = [...suites.map(s=>s.file),'backend-checks.txt','frontend-build.txt'];
const html = `<!doctype html><html><head><meta charset="utf-8"><title>Deeparture V2 Phase 3 Test Report</title><style>
@page { size:A4; margin:17mm 14mm 19mm; }
* {box-sizing:border-box} body {font:10px/1.45 Arial,sans-serif;color:#172b39;margin:0} h1 {font-size:25px;line-height:1.16;margin:12px 0 7px} h2 {font-size:15px;margin:22px 0 9px;break-after:avoid} p {margin:7px 0} .eyebrow {font-weight:700;letter-spacing:1.8px;color:#22756b;font-size:10px}.muted{color:#586a77;font-size:9px}.status {background:#edf7f3;border-left:4px solid #247c62;padding:12px 14px;margin:17px 0;font-size:12px}.note {background:#f3f5f7;padding:10px 12px;margin:12px 0}.meta {border-top:1px solid #d5dfe4;border-bottom:1px solid #d5dfe4;padding:9px 0}.mono {font-family:monospace;overflow-wrap:anywhere;font-size:9px} table {width:100%;border-collapse:collapse;table-layout:fixed;margin:9px 0 16px;font-size:9px} thead {display:table-header-group} th,td {border:1px solid #cbd6de;padding:6px 7px;text-align:left;vertical-align:top;overflow-wrap:anywhere} th {background:#193a48;color:white;font-size:9px} tr:nth-child(even) td {background:#f1f5f7} tr {break-inside:avoid} td:nth-last-child(2) {color:#17664a;font-weight:bold} td:last-child {font-size:8px} .suite {break-before:page} a {color:#176c78;text-decoration:none} .hash {font-family:monospace;font-size:8px;word-break:break-all} ul {padding-left:17px} li{margin:5px 0}
</style></head><body>
<div class="eyebrow">DEEPARTURE V2 · QUALITY ASSURANCE</div><h1>Phase 3 Operator Portal<br>Test Report</h1><p>Revision 1.0 · 31 October 2026 · Asia/Dhaka</p>
<div class="status"><strong>LOCAL TEST RESULT: PASS</strong><br>38 unit tests and ${total} regression/API/browser groups passed.<br><strong>RENDER STAGING: PENDING</strong></div>
<div class="meta"><p><strong>Source branch:</strong> phase2b-rev1.3-review-fixes</p><p><strong>Phase 2B baseline:</strong> <span class="mono">01cb93ea3ce312ef0227099bd224094b2072ddb8</span></p><p><strong>Phase 3 source:</strong> uncommitted working tree based on the above baseline. No Phase 3 release commit or deployed hash is established.</p></div>
<h2>Verification summary</h2>${table(['Check','Coverage','Local','Render'],summary,'<colgroup><col style="width:43%"><col style="width:29%"><col style="width:12%"><col style="width:16%"></colgroup>')}
<p class="muted">PASS records the result of the named executed check. PENDING means no Phase 3 staging execution result is recorded. This report reproduces existing evidence; no new application tests were run to generate this PDF.</p>
<h2>Environment and scope</h2><p>Tests used isolated loopback MongoDB databases, generated local accounts and test email transport. Browser checks covered approximately 390px, 768px and 1440px. The media migration was tested on local fixtures only.</p><p>Media management uses scoped image URLs. A durable provider for direct binary uploads is outside this release's configured scope.</p>
${sections}
<section class="suite"><h2>Deployment and acceptance status</h2><p><strong>Local automated checks passed. Final Phase 3 staging acceptance is pending.</strong></p><p>The executed groups in this report do not establish completion of every manual acceptance checklist item. No Phase 3 Render deployment, live database migration or real email delivery was performed.</p>
${table(['Required staging evidence','Status'],[['Frontend Render Live full commit','PENDING'],['Backend Render Live full commit','PENDING'],['Phase 3 release commit identifying the modified source','PENDING'],['Dedicated V2 Atlas staging identity and indexes','PENDING'],['Staging media backfill dry run / reviewed application','PENDING'],['Manual invitation, CSV/XLSX and routine mobile workflows','PENDING'],['Completed Phase 3 acceptance checklist','PENDING']])}
<p><strong>Project service links</strong> (provided addresses; Phase 3 deployment unverified):</p><ul><li><a href="https://deeparture-v2-1.onrender.com">Frontend</a> · <a href="https://deeparture-v2-1.onrender.com/operator/v2">Operator Portal</a></li><li><a href="https://deeparture-v2-3hr6.onrender.com/health">Backend health</a></li></ul>
<h2>Evidence integrity</h2><p>Reports are stored under <span class="mono">docs/phase3/evidence/</span>. SHA256 values below identify the exact evidence used.</p>
${table(['Evidence file','SHA256'],files.map(file=>[escape(file),`<span class="hash">${crypto.createHash('sha256').update(fs.readFileSync(path.join(evidence,file))).digest('hex')}</span>`]))}
<p>Implementation notes: <span class="mono">docs/phase3/INTEGRATION_RESULTS_2026-10-31.md</span><br>Acceptance template: <span class="mono">docs/phase3/PHASE3_ACCEPTANCE_CHECKLIST_REV1.0.md</span></p></section>
</body></html>`;
(async()=>{
 let browser;
 try {
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage(); await page.setContent(html,{waitUntil:'load'});
  await page.pdf({path:output,format:'A4',printBackground:true,preferCSSPageSize:true,displayHeaderFooter:true,headerTemplate:'<span></span>',footerTemplate:'<div style="font:8px Arial;color:#697984;width:100%;padding:0 14mm;display:flex;justify-content:space-between"><span>Deeparture V2 · Phase 3 · Revision 1.0</span><span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span></div>',margin:{top:'17mm',bottom:'19mm',left:'14mm',right:'14mm'}});
  await page.screenshot({path:'/tmp/deeparture-phase3-test-report-preview.png',fullPage:false});
  console.log(JSON.stringify({output,groups:total,unitTests:38,phase3Groups:suites[0].results.length,bytes:fs.statSync(output).size}));
 } finally {if(browser)await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
