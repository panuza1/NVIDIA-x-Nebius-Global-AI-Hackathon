import {NextResponse} from 'next/server';
import {z} from 'zod';
import {checkMonitor} from '@/lib/check-monitor';
import {failure} from '@/lib/http';
export const runtime='nodejs';
export const maxDuration=120;
export async function POST(_req:Request,{params}:{params:Promise<{id:string}>}){try{return NextResponse.json(await checkMonitor(z.string().uuid().parse((await params).id)));}catch(e){return failure(e);}}
