"use client";
import { useEffect, useState } from "react";
export function PwaInstallPrompt() {
  const [installEvent,setInstallEvent]=useState<Event|null>(null); const [show,setShow]=useState(false);
  const ios=typeof navigator!=="undefined"&&/iphone|ipad|ipod/i.test(navigator.userAgent)&&!("standalone" in navigator&&(navigator as Navigator&{standalone?:boolean}).standalone);
  useEffect(()=>{ if("serviceWorker" in navigator) void navigator.serviceWorker.register("/sw.js"); const handler=(event:Event)=>{event.preventDefault();setInstallEvent(event);setShow(true)}; const installed=()=>{setShow(false);setInstallEvent(null)}; window.addEventListener("beforeinstallprompt",handler); window.addEventListener("appinstalled",installed); const timer=window.setTimeout(()=>{if(ios&&!sessionStorage.getItem("pwa-prompt-dismissed"))setShow(true)},12000); return ()=>{window.removeEventListener("beforeinstallprompt",handler);window.removeEventListener("appinstalled",installed);window.clearTimeout(timer)};},[ios]);
  async function install(){ if(installEvent){const prompt=(installEvent as Event & {prompt:()=>Promise<void>}).prompt; await prompt(); setInstallEvent(null); return;} setShow(true); }
  function dismiss(){setShow(false);sessionStorage.setItem("pwa-prompt-dismissed","1")}
  if(!show)return null;
  return <aside className="fixed inset-x-3 bottom-3 z-[70] mx-auto max-w-md rounded-2xl border border-black/10 bg-white p-4 shadow-2xl sm:inset-x-auto sm:right-5"><div className="flex items-start justify-between gap-4"><div><p className="font-semibold">Keep PHOTIZO close</p><p className="mt-1 text-sm leading-6 text-black/60">Install the site for a focused, app-like experience. It also works in your browser.</p></div><button onClick={dismiss} className="px-2 text-lg" aria-label="Dismiss install prompt">×</button></div>{ios&&<p className="mt-3 rounded-xl bg-[#fbfaf6] p-3 text-sm leading-6">On iPhone or iPad, tap <strong>Share</strong>, then <strong>Add to Home Screen</strong>.</p>}{installEvent&&<button onClick={install} className="mt-3 rounded-full bg-[var(--dark-moss-green)] px-5 py-2.5 text-sm font-semibold text-white">Install app</button>}</aside>;
}
