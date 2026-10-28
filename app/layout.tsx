import type {Metadata} from 'next';
import './globals.css';
export const metadata:Metadata={title:'ChangeProof',description:'Track important changes to application pages.'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
