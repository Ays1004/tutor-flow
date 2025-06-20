// app/api/delete-user/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // WARNING: Only use in server files
);

export async function POST(req: NextRequest) {
  const { userId } = await req.json();

  if (!userId) {
    return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
  }

  // Optional: Clean up from related tables first
  await supabaseAdmin.from('profiles').delete().eq('id', userId);
  await supabaseAdmin.from('user_question_data').delete().eq('user_id', userId);
  // Add more cleanup here if needed

  // Delete from auth.users using Admin API
  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
