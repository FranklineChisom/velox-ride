'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { UserRole } from '@/types';

// ... existing createSystemUser code ...

export async function createSystemUser(formData: FormData) {
  const cookieStore = await cookies();
  
  // 1. Verify the requester is authorized
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

  // 2. Enforce Hierarchy Rules
  if (requesterRole === 'employee') {
    if (!['passenger', 'driver'].includes(targetRole)) {
      return { error: 'Staff can only create Passengers and Drivers' };
    }
  }

  if (requesterRole === 'manager') {
    if (['superadmin', 'manager'].includes(targetRole)) {
      return { error: 'Managers cannot create other Managers or Superadmins' };
    }
  }

  // 3. Create the User
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!serviceRoleKey) {
    return { error: 'Missing SUPABASE_SERVICE_ROLE_KEY in server environment. Cannot create user securely.' };
  }

  const supabaseAdmin = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );

  const { error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      phone_number: phone,
      role: targetRole
    }
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

  // Fetch target user to check role hierarchy before deleting
  const { data: targetUser, error: fetchError } = await supabaseAdmin.auth.admin.getUserById(userId);
  
  if (fetchError || !targetUser.user) return { error: 'User not found' };

  const targetRole = targetUser.user.user_metadata.role as UserRole;

  // Hierarchy Check
  if (requesterRole === 'manager') {
    if (['superadmin', 'manager'].includes(targetRole)) {
      return { error: 'Managers cannot delete other Managers or Superadmins' };
    }
  }

  // Delete
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

  // 1. Authorization Check: Superadmin, Manager, and Employee (Staff) can verify
  if (!requester || !['superadmin', 'manager', 'employee'].includes(requesterRole)) {
    return { error: 'Unauthorized access' };
  }

  // 2. Perform Update via Admin Client (Bypasses RLS to ensure write)
  // Although RLS policy might allow staff update, using admin client ensures consistency
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
    .eq('role', 'driver'); // Ensure we are only verifying drivers

  if (error) return { error: error.message };

  return { success: true };
}