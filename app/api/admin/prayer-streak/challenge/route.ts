import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyAdminRequest } from "@/lib/server/admin-api";
import { getServiceSupabaseClient } from "@/lib/supabase/server";

const daySchema=z.object({day_number:z.number().int().min(1).max(30),title:z.string().trim().min(2).max(120),bible_reference:z.string().trim().min(2).max(100),encouragement:z.string().trim().min(10).max(1000),prayer_points:z.array(z.string().trim().min(2).max(300)).min(1).max(8),completion_message:z.string().trim().min(5).max(300)});
const challengeSchema=z.object({id:z.string().uuid(),title:z.string().trim().min(3).max(160),description:z.string().trim().min(20).max(2000),status:z.enum(["draft","published","archived"]),days:z.array(daySchema).length(30)});
export async function PUT(request:Request){
  const auth=await verifyAdminRequest(); if(!auth.ok)return NextResponse.json({error:"Unauthorized."},{status:401});
  let raw:unknown;try{raw=await request.json()}catch{return NextResponse.json({error:"Invalid request body."},{status:400})}
  const parsed=challengeSchema.safeParse(raw);if(!parsed.success)return NextResponse.json({error:parsed.error.issues[0]?.message||"Invalid challenge content."},{status:400});
  if(new Set(parsed.data.days.map(d=>d.day_number)).size!==30)return NextResponse.json({error:"Each of the 30 journey days must appear exactly once."},{status:400});
  const db=getServiceSupabaseClient();if(!db)return NextResponse.json({error:"Server database credentials are not configured."},{status:503});
  const {id,title,description,status,days}=parsed.data;
  const {error}=await db.rpc("admin_save_prayer_challenge",{p_id:id,p_title:title,p_description:description,p_status:status,p_days:days});
  if(error)return NextResponse.json({error:error.message||"Could not save campaign and daily guides."},{status:500});
  return NextResponse.json({success:true});
}

export async function POST(request:Request){
  const auth=await verifyAdminRequest();if(!auth.ok)return NextResponse.json({error:"Unauthorized."},{status:401});
  let raw:unknown;try{raw=await request.json()}catch{return NextResponse.json({error:"Invalid request body."},{status:400})}
  const parsed=z.object({title:z.string().trim().min(3).max(160),slug:z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(80),description:z.string().trim().min(20).max(2000)}).safeParse(raw);
  if(!parsed.success)return NextResponse.json({error:parsed.error.issues[0]?.message||"Invalid campaign."},{status:400});
  const db=getServiceSupabaseClient();if(!db)return NextResponse.json({error:"Server database credentials are not configured."},{status:503});
  const {data:id,error}=await db.rpc("admin_create_prayer_campaign",{p_title:parsed.data.title,p_slug:parsed.data.slug,p_description:parsed.data.description});
  if(error)return NextResponse.json({error:error.code==="23505"?"That campaign URL is already in use.":error.message||"Could not create campaign."},{status:400});
  return NextResponse.json({success:true,id});
}
