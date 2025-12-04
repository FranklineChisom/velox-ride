'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { UserRole } from '@/types';

// ... existing createSystemUser ...
// ... existing deleteSystemUser ...
// ... existing verifyDriver ...

// (Keep your existing functions here, I am appending the new one)

export async function createSystemUser(formData: FormData) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );

  const { data: { user: requester } } = await supabase.auth.getUser();
  const requesterRole = requester?.user_metadata?.role as UserRole;

  if (!requester || !['superadmin', 'manager', 'employee'].includes(requesterRole)) {
    return { error: 'Unauthorized access' };
  }

  const targetRole = formData.get('role') as UserRole;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const fullName = formData.get('full_name') as string;
  const phone = formData.get('phone') as string;

  if (requesterRole === 'employee' && !['passenger', 'driver'].includes(targetRole)) {
      return { error: 'Staff can only create Passengers and Drivers' };
  }
  if (requesterRole === 'manager' && ['superadmin', 'manager'].includes(targetRole)) {
      return { error: 'Managers cannot create other Managers or Superadmins' };
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) return { error: 'Missing SUPABASE_SERVICE_ROLE_KEY' };

  const supabaseAdmin = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );

  const { error } = await supabaseAdmin.auth.admin.createUser({
    email, password, email_confirm: true,
    user_metadata: { full_name: fullName, phone_number: phone, role: targetRole }
  });

  if (error) return { error: error.message };
  return { success: true };
}

export async function deleteSystemUser(userId: string) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );

  const { data: { user: requester } } = await supabase.auth.getUser();
  const requesterRole = requester?.user_metadata?.role as UserRole;

  if (!requester || !['superadmin', 'manager'].includes(requesterRole)) {
    return { error: 'Unauthorized access' };
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) return { error: 'Server misconfiguration' };

  const supabaseAdmin = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );

  const { data: targetUser, error: fetchError } = await supabaseAdmin.auth.admin.getUserById(userId);
  if (fetchError || !targetUser.user) return { error: 'User not found' };

  const targetRole = targetUser.user.user_metadata.role as UserRole;
  if (requesterRole === 'manager' && ['superadmin', 'manager'].includes(targetRole)) {
      return { error: 'Managers cannot delete other Managers or Superadmins' };
  }

  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
  if (error) return { error: error.message };
  return { success: true };
}

export async function verifyDriver(driverId: string) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );

  const { data: { user: requester } } = await supabase.auth.getUser();
  const requesterRole = requester?.user_metadata?.role as UserRole;

  if (!requester || !['superadmin', 'manager', 'employee'].includes(requesterRole)) {
    return { error: 'Unauthorized access' };
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) return { error: 'Server misconfiguration' };

  const supabaseAdmin = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );

  const { error } = await supabaseAdmin
    .from('profiles')
    .update({ is_verified: true })
    .eq('id', driverId)
    .eq('role', 'driver');

  if (error) return { error: error.message };
  return { success: true };
}

// --- NEW: Delete Own Account ---
export async function deleteMyAccount() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) return { error: 'Server misconfiguration. Cannot delete account securely.' };

  const supabaseAdmin = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );

  // Delete the user from Auth (Cascades to profiles/rides etc via DB schema)
  const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id);

  if (error) return { error: error.message };
  return { success: true };
}