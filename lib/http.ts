import {NextResponse} from 'next/server';
import {ZodError} from 'zod';
export function failure(e:unknown) {
 const message=e instanceof ZodError?'Invalid request or data.':e instanceof Error?e.message:'Unexpected server error.';
 const status=e instanceof ZodError?400:/not found/i.test(message)?404:/limit reached|wait 90/i.test(message)?429:/valid public|private network|hostname|custom port/i.test(message)?400:/timed out|timeout/i.test(message)?504:500;
 console.error('ChangeProof:',message);
 return NextResponse.json({error:message},{status});
}
