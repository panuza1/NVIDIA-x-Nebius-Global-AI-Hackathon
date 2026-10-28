import 'server-only';
import {createHash} from 'node:crypto';
import {db} from './db';
import {publicUrl} from './url';
import {extract} from './tavily';
import {extractFacts,impact} from './nebius';
import {factsSchema} from './facts';
import {diffFacts} from './diff';
export async function checkMonitor(id:string) {
 const client=db();
 const {data:monitor,error:me}=await client.from('monitors').select('*').eq('id',id).maybeSingle();
 if(me) throw new Error('Unable to read monitor.');
 if(!monitor) throw new Error('Monitor not found.');
 await publicUrl(monitor.url);
 const {error:reservation}=await client.rpc('reserve_check',{p_monitor_id:id});
 if(reservation) throw new Error(reservation.message);
 const {data:previous,error:pe}=await client.from('snapshots').select('id,facts').eq('monitor_id',id).order('captured_at',{ascending:false}).order('id',{ascending:false}).limit(1).maybeSingle();
 if(pe) throw new Error('Unable to read previous snapshot.');
 const content=await extract(monitor.url);
 const facts=await extractFacts(content);
 const changes=previous?diffFacts(factsSchema.parse(previous.facts),facts):[];
 const report=changes.length?await impact(changes,monitor.context):null;
 const {error:save}=await client.rpc('save_check',{p_monitor_id:id,p_previous_id:previous?.id??null,p_hash:createHash('sha256').update(content).digest('hex'),p_content:content,p_facts:facts,p_report:report});
 if(save) throw new Error('Could not save check: '+save.message);
 return {status:!previous?'baseline':changes.length?'changed':'unchanged',facts,report};
}
