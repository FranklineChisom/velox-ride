import { createClient } from '@/lib/supabase';
import { Profile, OnboardingStep, Vehicle, Guarantor } from '@/types';

const supabase = createClient();

export const AuthService = {
  
  async getProfile(userId: string): Promise<Profile | null> {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    return data;
  },

  async getOnboardingStatus(userId: string, role: string): Promise<OnboardingStep> {
    const profile = await this.getProfile(userId);
    if (!profile) return 'PROFILE_DETAILS';

    if (!profile.full_name || !profile.phone_number) return 'PROFILE_DETAILS';
    
    // Check Phone verification status
    if (!profile.phone_verified) return 'PHONE_VERIFICATION';

    if (role === 'passenger') {
      return 'COMPLETED'; 
    }

    if (role === 'driver') {
      // 1. Vehicle
      const { data: vehicle } = await supabase.from('vehicles').select('*').eq('driver_id', userId).single();
      if (!vehicle) return 'VEHICLE_DETAILS';

      // 2. Guarantor
      const { data: guarantor } = await supabase.from('guarantors').select('*').eq('driver_id', userId).single();
      if (!guarantor) return 'GUARANTOR_DETAILS';

      // 3. Documents
      const { data: docs } = await supabase.from('compliance_records').select('*').eq('user_id', userId);
      const requiredDocs = ['drivers_license', 'vehicle_insurance', 'road_worthiness']; 
      
      const missingDocs = requiredDocs.filter(type => 
        !docs?.find(d => d.document_type === type && d.status !== 'rejected')
      );

      if (missingDocs.length > 0) return 'DOCUMENTS_UPLOAD';

      const pendingDocs = docs?.filter(d => d.status === 'pending');
      if (pendingDocs && pendingDocs.length > 0) return 'AWAITING_APPROVAL';
      
      if (profile.is_verified) return 'COMPLETED';
      
      return 'AWAITING_APPROVAL';
    }

    return 'COMPLETED';
  },

  async updateProfile(userId: string, updates: Partial<Profile>) {
    return await supabase.from('profiles').update(updates).eq('id', userId);
  },

  // Mock phone verification for now
  async verifyPhone(userId: string) {
    return await supabase.from('profiles').update({ phone_verified: true }).eq('id', userId);
  },

  async saveVehicle(userId: string, vehicleData: Partial<Vehicle>) {
    const { data: existing } = await supabase.from('vehicles').select('id').eq('driver_id', userId).single();
    if (existing) {
      return await supabase.from('vehicles').update(vehicleData).eq('id', existing.id);
    } else {
      return await supabase.from('vehicles').insert({ ...vehicleData, driver_id: userId, is_active: true });
    }
  },

  async saveGuarantor(userId: string, data: Partial<Guarantor>) {
    const { data: existing } = await supabase.from('guarantors').select('id').eq('driver_id', userId).single();
    if (existing) {
      return await supabase.from('guarantors').update(data).eq('id', existing.id);
    } else {
      return await supabase.from('guarantors').insert({ ...data, driver_id: userId });
    }
  },

  async uploadComplianceDoc(userId: string, type: string, url: string) {
    const { data: existing } = await supabase
      .from('compliance_records')
      .select('id')
      .eq('user_id', userId)
      .eq('document_type', type)
      .single();

    if (existing) {
      return await supabase.from('compliance_records').update({
        document_url: url,
        status: 'pending',
        rejection_reason: null,
        updated_at: new Date().toISOString()
      }).eq('id', existing.id);
    } else {
      return await supabase.from('compliance_records').insert({
        user_id: userId,
        document_type: type,
        document_url: url,
        status: 'pending'
      });
    }
  }
};