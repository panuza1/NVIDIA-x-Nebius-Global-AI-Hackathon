import {NextResponse} from 'next/server';
import {db} from '@/lib/db';
import {failure} from '@/lib/http';
import {z} from 'zod';
export const runtime='nodejs';
export async function GET(_req:Request,{params}:{params:Promise<{id:string}>}){try{const id=z.string().uuid().parse((await params).id);const client=db();const [m,s,c]=await Promise.all([client.from('monitors').select('*').eq('id',id).maybeSingle(),client.from('snapshots').select('id,captured_at,facts').eq('monitor_id',id).order('captured_at',{ascending:false}).limit(1).maybeSingle(),client.from('changes').select('id,report,created_at').eq('monitor_id',id).order('created_at',{ascending:false})]);if(m.error||s.error||c.error) throw new Error('Unable to load monitor.');if(!m.data) throw new Error('Monitor not found.');return NextResponse.json({monitor:m.data,snapshot:s.data,changes:c.data});}catch(e){return failure(e);}}
