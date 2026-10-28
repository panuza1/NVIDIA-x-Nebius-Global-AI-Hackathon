import {NextResponse} from 'next/server';
import {z} from 'zod';
import {db} from '@/lib/db';
import {publicUrl} from '@/lib/url';
import {failure} from '@/lib/http';
export const runtime='nodejs';
export async function GET(){try {const {data,error}=await db().from('monitors').select('*, changes(created_at)').order('created_at',{ascending:false}); if(error) throw new Error('Unable to load monitors.'); return NextResponse.json(data);}catch(e){return failure(e);}}
export async function POST(request:Request){try {const body=z.object({url:z.string().max(2048),context:z.string().max(500).optional()}).parse(await request.json()); const url=await publicUrl(body.url); const {data,error}=await db().rpc('create_monitor',{p_url:url,p_context:body.context?.trim()??''}); if(error) throw new Error(error.message); return NextResponse.json(data);}catch(e){return failure(e);}}
