// Isolated local development only. Never link this runtime to a hosted project.
import {mkdirSync,chmodSync,existsSync,readFileSync,writeFileSync,cpSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
const runtime='.local/runtime';mkdirSync(runtime,{recursive:true,mode:0o700});chmodSync('.local',0o700);
const env={...process.env,DOCKER_HOST:`unix://${process.env.HOME}/.colima/foihk/docker.sock`};
function run(command,args){const result=spawnSync(command,args,{env,encoding:'utf8',maxBuffer:32*1024*1024});if(result.status!==0){writeFileSync('.local/setup-error.log',(result.stdout||'')+(result.stderr||''),{mode:0o600});throw new Error(`${command} failed; inspect .local/setup-error.log`);}return result.stdout;}
const cli=(...args)=>run('npx',['--yes','supabase@2.117.0',...args,'--workdir',runtime]);
if(spawnSync('docker',['info'],{env,stdio:'ignore'}).status!==0)run('colima',['start','foihk','--cpu','4','--memory','6','--disk','30','--activate=false','--dns','1.1.1.1','--dns','8.8.8.8']);
const config=`${runtime}/supabase/config.toml`;
if(!existsSync(config)){
 cli('init','--yes');
 writeFileSync(config,readFileSync(config,'utf8').replace('project_id = "runtime"','project_id = "foihk-local"').replace('http://127.0.0.1:3000','http://localhost:5173')+'\n[functions.site-deploy-admin]\nverify_jwt = true\n[functions.site-deploy-worker]\nverify_jwt = false\n');
}
cpSync('supabase/migrations',`${runtime}/supabase/migrations`,{recursive:true});
cpSync('supabase/functions',`${runtime}/supabase/functions`,{recursive:true});
writeFileSync('.local/start.log',cli('start','-x','studio,logflare,vector,supavisor,realtime,postgres-meta'),{mode:0o600});
const status=JSON.parse(cli('status','-o','json'));
if(status.API_URL!=='http://127.0.0.1:54321')throw new Error('Unexpected local API URL');
writeFileSync('.local/supabase.json',JSON.stringify(status),{mode:0o600});
writeFileSync('.env.local',`VITE_SUPABASE_URL=${status.API_URL}\nVITE_SUPABASE_PUBLISHABLE_KEY=${status.ANON_KEY}\n`,{mode:0o600});
cli('migration','up','--local');
if(!existsSync('.local/admin-access.json')){
 cpSync('public/published-articles.json','.local/original-published-articles.json');
 run('node',['scripts/local/seed.mjs']);
 const sql=readFileSync('update_news_published_dates.sql','utf8');
 const result=spawnSync('docker',['exec','-i','supabase_db_foihk-local','psql','-U','postgres','-d','postgres','-v','ON_ERROR_STOP=1'],{env,input:sql,encoding:'utf8'});
 if(result.status!==0)throw new Error('Local date correction failed');
 writeFileSync('.local/date-repair-first.log',result.stdout);
}
console.log('Local Supabase ready. Admin credentials: .local/admin-access.json. Start the website with npm run dev -- --host 127.0.0.1 --port 5173 --strictPort.');
