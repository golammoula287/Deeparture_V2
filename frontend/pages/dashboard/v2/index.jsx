import { useEffect } from "react";
import { useRouter } from "next/router";
export default function LegacyOperatorDashboard(){const router=useRouter();useEffect(()=>{router.replace('/operator/v2')},[]);return <main className="p-8" role="status">Opening Operator Portal…</main>}
