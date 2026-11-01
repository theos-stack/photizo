// Deploy with Supabase Edge Functions. Never put these secrets in client code.
import { createClient } from "npm:@supabase/supabase-js@2.105.3";
import webpush from "npm:web-push@3.6.7";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CRON_SECRET = Deno.env.get("PRAYER_CRON_SECRET")!;
const RESEND_KEY = Deno.env.get("RESEND_API_KEY") || "";
const RESEND_FROM = Deno.env.get("RESEND_FROM_EMAIL") || "";
const VAPID_PUBLIC = Deno.env.get("VAPID_PUBLIC_KEY") || "";
const VAPID_PRIVATE = Deno.env.get("VAPID_PRIVATE_KEY") || "";
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") || "mailto:hello@photizonetwork.org";
const db = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

type Delivery = { id:string; member_id:string; enrollment_id:string; channel:string; kind:string; local_date:string; reminder_hour:number; payload:Record<string,string>; attempts:number };
function localTime(zone:string) {
  const values=new Intl.DateTimeFormat("en-CA",{timeZone:zone,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(new Date());
  const part=(type:string)=>values.find((item)=>item.type===type)?.value||"00";
  return {date:`${part("year")}-${part("month")}-${part("day")}`,hour:Number(part("hour")),minute:Number(part("minute"))};
}
function templateText(text:string,values:Record<string,string>) { return text.replace(/\{\{([a-z_]+)\}\}/g,(_,key:string)=>values[key]||""); }
function isTrustedPushEndpoint(value:string) {
  try {
    const url=new URL(value);
    const allowed=["fcm.googleapis.com","push.services.mozilla.com","push.services.mozilla.org","web.push.apple.com","notify.windows.com"];
    return url.protocol==="https:"&&!url.username&&!url.password&&(!url.port||url.port==="443")&&allowed.some((host)=>url.hostname===host||url.hostname.endsWith(`.${host}`));
  } catch { return false; }
}
async function settle(id:string,status:"sent"|"failed"|"skipped",error?:string,providerId?:string) {
  await db.from("prayer_notification_deliveries").update({status,error:error||null,provider_id:providerId||null,updated_at:new Date().toISOString(),delivered_at:status==="sent"?new Date().toISOString():null}).eq("id",id);
}
async function sendEmail(delivery:Delivery,template:{subject:string;body:string},displayName:string) {
  const to=delivery.payload.email;
  if(!RESEND_KEY||!RESEND_FROM){await settle(delivery.id,"failed","Email provider is not configured (RESEND_API_KEY / RESEND_FROM_EMAIL). Retry after configuration.");return;}
  if(!to){await settle(delivery.id,"skipped","No verified email address is available.");return;}
  const values={display_name:displayName,journey_day:String(delivery.payload.journey_day||""),milestone:String(delivery.reminder_hour||""),start_date:delivery.local_date};
  const response=await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:`Bearer ${RESEND_KEY}`,"Content-Type":"application/json","Idempotency-Key":delivery.id},body:JSON.stringify({from:RESEND_FROM,to:[to],subject:templateText(template.subject,values),text:templateText(template.body,values)})});
  const result=await response.json().catch(()=>({}));
  if(!response.ok){await settle(delivery.id,"failed",`Resend delivery failed (${response.status}).`);return;}
  await settle(delivery.id,"sent",undefined,result.id);
}
async function claim(id:string):Promise<Delivery|null>{const {data,error}=await db.rpc("claim_prayer_notification",{p_delivery_id:id});if(error)throw error;return data as Delivery|null;}
function isServiceAuthorization(request:Request) {
  const authorization=request.headers.get("authorization")||"";
  const expected=`Bearer ${SERVICE_KEY}`;
  if(authorization.length!==expected.length)return false;
  let diff=0;for(let index=0;index<expected.length;index++)diff|=authorization.charCodeAt(index)^expected.charCodeAt(index);
  return diff===0;
}
function isCronAuthorization(request:Request) {
  const received=request.headers.get("x-prayer-cron-secret")||"";
  if(!CRON_SECRET||received.length!==CRON_SECRET.length)return false;
  let diff=0;for(let index=0;index<CRON_SECRET.length;index++)diff|=received.charCodeAt(index)^CRON_SECRET.charCodeAt(index);
  return diff===0;
}
async function sendTestPush(request:Request) {
  if(!isServiceAuthorization(request))return Response.json({success:false,message:"Unauthorized."},{status:401});
  if(!VAPID_PUBLIC||!VAPID_PRIVATE)return Response.json({success:false,configured:false,message:"Push delivery is not configured on the reminder service."},{status:503});
  let body:{member_id?:unknown};try{body=await request.json();}catch{return Response.json({success:false,message:"Invalid test request."},{status:400});}
  if(typeof body.member_id!=="string"||!/^[0-9a-f-]{36}$/i.test(body.member_id))return Response.json({success:false,message:"Invalid test request."},{status:400});
  const memberId=body.member_id;
  const [{data:prefs},{data:profile},{data:subscriptions}]=await Promise.all([
    db.from("prayer_notification_preferences").select("push_enabled").eq("member_id",memberId).maybeSingle(),
    db.from("member_profiles").select("timezone").eq("id",memberId).maybeSingle(),
    db.from("prayer_push_subscriptions").select("id,endpoint,p256dh,auth_secret").eq("member_id",memberId),
  ]);
  if(!prefs?.push_enabled)return Response.json({success:false,message:"Push reminders are not enabled for this member."},{status:400});
  if(!subscriptions?.length)return Response.json({success:false,message:"No device subscription is registered yet."},{status:400});
  const timezone=profile?.timezone||"Africa/Lagos";
  let date:string;try{date=localTime(timezone).date;}catch{return Response.json({success:false,message:"The saved reminder time zone is invalid."},{status:400});}
  const payload={title:"PHOTIZO Prayer Reminder",body:"Your time with God matters. Take a moment to pray and continue your journey today.",url:"/streak/dashboard"};
  const id=await enqueue({member_id:memberId,enrollment_id:null,channel:"push",kind:"test",local_date:date,reminder_hour:-2,status:"queued",payload});
  if(!id)return Response.json({success:false,message:"A test reminder already exists for today."},{status:409});
  const delivery=await claim(id);if(!delivery)return Response.json({success:false,message:"A test reminder is already processing or was sent today."},{status:409});
  webpush.setVapidDetails(VAPID_SUBJECT,VAPID_PUBLIC,VAPID_PRIVATE);
  let sent=0;const errors:string[]=[];
  for(const sub of subscriptions){
    if(!isTrustedPushEndpoint(sub.endpoint)){await db.from("prayer_push_subscriptions").delete().eq("id",sub.id);errors.push("An unsupported endpoint was removed.");continue;}
    try{await webpush.sendNotification({endpoint:sub.endpoint,keys:{p256dh:sub.p256dh,auth:sub.auth_secret}},JSON.stringify(payload));sent++;}
    catch(error){const status=(error as {statusCode?:number}).statusCode;if(status===404||status===410)await db.from("prayer_push_subscriptions").delete().eq("id",sub.id);errors.push(status?`Push provider returned ${status}.`:"Push provider rejected a device subscription.");}
  }
  if(sent){await settle(delivery.id,"sent",errors.length?errors.join(" "):undefined);return Response.json({success:true,sent});}
  await settle(delivery.id,"failed",errors.join(" ")||"No push endpoint accepted the test.");
  return Response.json({success:false,message:"The push provider could not deliver to this device. Check the subscription and server VAPID configuration."},{status:502});
}
async function enqueue(row:Record<string,unknown>) {
  const {error}=await db.from("prayer_notification_deliveries").upsert(row,{onConflict:"member_id,enrollment_id,channel,kind,local_date,reminder_hour",ignoreDuplicates:true});
  if(error)throw error;
  let query=db.from("prayer_notification_deliveries").select("id").eq("member_id",String(row.member_id)).eq("channel",String(row.channel)).eq("kind",String(row.kind)).eq("local_date",String(row.local_date)).eq("reminder_hour",Number(row.reminder_hour));
  query=row.enrollment_id?query.eq("enrollment_id",String(row.enrollment_id)):query.is("enrollment_id",null);
  const {data}=await query.maybeSingle();return data?.id as string|undefined;
}
async function processQueuedEmails() {
  const {data:pending,error}=await db.from("prayer_notification_deliveries").select("*").eq("channel","email").in("kind",["welcome","milestone"]).in("status",["queued","failed"]).order("created_at").limit(100);
  if(error)throw error;
  for(const row of pending||[]){
    const {data:prefs}=await db.from("prayer_notification_preferences").select("email_enabled").eq("member_id",row.member_id).maybeSingle();
    if(!prefs?.email_enabled){await settle(row.id,"skipped","Email reminders are disabled for this member.");continue;}
    const delivery=await claim(row.id);if(!delivery)continue;
    const {data:profile}=await db.from("member_profiles").select("display_name").eq("id",row.member_id).maybeSingle();
    const {data:template}=await db.from("prayer_notification_templates").select("subject,body").eq("template_key",row.kind).maybeSingle();
    await sendEmail(delivery,template||{subject:"Your PHOTIZO prayer journey",body:"Your prayer journey continues. Visit {{start_date}}."},profile?.display_name||"Friend");
  }
}
async function processReminders() {
  let cursor="";
  while(true){
  let query=db.from("prayer_enrollments").select("id,member_id,challenge_id,enrollment_timezone,start_local_date,member_profiles!inner(id,email,display_name),prayer_notification_preferences!inner(*)").eq("status","active").order("id",{ascending:true}).limit(500);
  if(cursor)query=query.gt("id",cursor);
  const {data:enrollments,error}=await query;
  if(error)throw error;
  if(!enrollments?.length)break;
  for(const row of enrollments){
    const profile=Array.isArray(row.member_profiles)?row.member_profiles[0]:row.member_profiles;
    const prefs=Array.isArray(row.prayer_notification_preferences)?row.prayer_notification_preferences[0]:row.prayer_notification_preferences;
    if(!profile||!prefs)continue;
    let now;try{now=localTime(row.enrollment_timezone)}catch{continue;}
    const elapsedDays=Math.floor((Date.parse(`${now.date}T12:00:00Z`)-Date.parse(`${row.start_local_date}T12:00:00Z`))/86400000)+1;
    if(elapsedDays>30){const{data:metrics}=await db.from("prayer_enrollments").select("total_completed_days").eq("id",row.id).maybeSingle();await db.from("prayer_enrollments").update({status:"completed",completed_at:new Date().toISOString(),current_streak:0,missed_days:Math.max(0,30-(metrics?.total_completed_days||0))}).eq("id",row.id);continue;}
    const reminders=[{hour:9,enabled:prefs.reminder_09_enabled},{hour:18,enabled:prefs.reminder_18_enabled},{hour:21,enabled:prefs.reminder_21_enabled},{hour:23,enabled:prefs.reminder_23_enabled}];
    const due=reminders.find((item)=>item.enabled&&item.hour===now.hour&&now.minute<20);if(!due)continue;
    const journeyDay=elapsedDays;
    if(journeyDay<1||journeyDay>30)continue;
    const {data:checkin}=await db.from("prayer_checkins").select("id").eq("enrollment_id",row.id).eq("local_date",now.date).maybeSingle();if(checkin)continue;
    const {data:guide}=await db.from("prayer_challenge_days").select("title,bible_reference").eq("challenge_id",row.challenge_id).eq("day_number",journeyDay).maybeSingle();
    const {data:template}=await db.from("prayer_notification_templates").select("subject,body").eq("template_key","reminder").maybeSingle();
    const content=template||{subject:"A moment for prayer today",body:"Your Day {{journey_day}} prayer guide is ready. Take ten quiet minutes when you can."};
    const reminderBody=templateText(content.body,{display_name:profile.display_name||"Friend",journey_day:String(journeyDay),milestone:"",start_date:now.date});
    const reminderPayload={title:`Day ${journeyDay}: ${guide?.title||"A moment for prayer"}`,body:`${guide?.bible_reference||"Your daily guide"} · ${reminderBody}`,url:"/streak/dashboard"};
    await enqueue({member_id:row.member_id,enrollment_id:row.id,channel:"in_app",kind:"reminder",local_date:now.date,reminder_hour:due.hour,status:"sent",payload:reminderPayload});
    if(prefs.email_enabled&&profile.email){
      const payload={email:profile.email,journey_day:String(journeyDay)};
      const id=await enqueue({member_id:row.member_id,enrollment_id:row.id,channel:"email",kind:"reminder",local_date:now.date,reminder_hour:due.hour,status:"queued",payload});
      if(id){const delivery=await claim(id);if(delivery)await sendEmail(delivery,content,profile.display_name||"Friend");}
    }
    if(prefs.push_enabled&&VAPID_PUBLIC&&VAPID_PRIVATE){
      const {data:subscriptions}=await db.from("prayer_push_subscriptions").select("id,endpoint,p256dh,auth_secret").eq("member_id",row.member_id);
      if((subscriptions||[]).length){
        const payload=reminderPayload;
        const id=await enqueue({member_id:row.member_id,enrollment_id:row.id,channel:"push",kind:"reminder",local_date:now.date,reminder_hour:due.hour,status:"queued",payload});
        if(id){const delivery=await claim(id);if(delivery){webpush.setVapidDetails(VAPID_SUBJECT,VAPID_PUBLIC,VAPID_PRIVATE);let sent=0;const failures:string[]=[];for(const sub of subscriptions||[]){if(!isTrustedPushEndpoint(sub.endpoint)){await db.from("prayer_push_subscriptions").delete().eq("id",sub.id);failures.push("Unsupported push endpoint removed.");continue;}try{await webpush.sendNotification({endpoint:sub.endpoint,keys:{p256dh:sub.p256dh,auth:sub.auth_secret}},JSON.stringify(payload));sent++;}catch(error){const status=(error as {statusCode?:number}).statusCode;if(status===404||status===410)await db.from("prayer_push_subscriptions").delete().eq("id",sub.id);failures.push(status?`Push provider returned ${status}.`:"Push provider rejected a device subscription.");}}if(sent)await settle(delivery.id,"sent",failures.length?failures.join("; "):undefined);else await settle(delivery.id,"failed",failures.join("; ")||"No valid push endpoint.");}}
      }
    } else if(prefs.push_enabled){
      await enqueue({member_id:row.member_id,enrollment_id:row.id,channel:"push",kind:"reminder",local_date:now.date,reminder_hour:due.hour,status:"failed",error:"Web Push is not configured on the server.",payload:reminderPayload});
    }
  }
  cursor=enrollments[enrollments.length-1].id;
  if(enrollments.length<500)break;
  }
}
Deno.serve(async (request)=>{
  if(request.method!=="POST")return new Response("Method not allowed",{status:405});
  let requestedAction="run";try{const body=await request.clone().json();if(body?.action==="send-test")requestedAction="send-test";}catch{}
  if(requestedAction==="send-test")return await sendTestPush(request);
  if(!isCronAuthorization(request))return new Response("Unauthorized",{status:401});
  try{await processQueuedEmails();await processReminders();return Response.json({success:true});}catch(error){console.error("Prayer reminder run failed",error);return Response.json({error:"Reminder run failed"},{status:500});}
});
