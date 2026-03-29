// ═══════════════════════════════════════════════════════════
//  SUPABASE CONFIGURATION — Gayatri Jewellers
// ═══════════════════════════════════════════════════════════
// 
//  HOW TO SET UP:
//  1. Go to https://supabase.com and create a free project
//  2. Go to Project Settings → API
//  3. Copy your "Project URL" and "anon/public" key
//  4. Paste them below
//
//  TABLE SETUP (run this SQL in Supabase SQL Editor):
//  
//  CREATE TABLE profiles (
//    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
//    name TEXT NOT NULL,
//    phone TEXT UNIQUE NOT NULL,
//    created_at TIMESTAMPTZ DEFAULT now(),
//    last_login TIMESTAMPTZ DEFAULT now()
//  );
//
//  -- Enable Row Level Security
//  ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
//
//  -- Allow anyone to insert (for registration)
//  CREATE POLICY "Allow public insert" ON profiles
//    FOR INSERT WITH CHECK (true);
//
//  -- Allow anyone to read their own profile by phone
//  CREATE POLICY "Allow public read" ON profiles
//    FOR SELECT USING (true);
//
//  -- Allow anyone to update their own profile
//  CREATE POLICY "Allow public update" ON profiles
//    FOR UPDATE USING (true);
//
//  -- Allow anyone to update their own profile
//  CREATE POLICY "Allow public update" ON profiles
//    FOR UPDATE USING (true);
//
// ═══════════════════════════════════════════════════════════

(function () {
    // ⚠️ REPLACE THESE WITH YOUR SUPABASE PROJECT CREDENTIALS
    var SUPABASE_URL = 'https://omddrkchlokibusixgmf.supabase.co';
    var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9tZGRya2NobG9raWJ1c2l4Z21mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2OTMyMjYsImV4cCI6MjA5MDI2OTIyNn0.5O0WS_NS0D5nmDEZfW-Dv2_Nq6zY7uSl10KCrPauAsY';

    // ─── Initialize Supabase Client ───
    if (typeof supabase !== 'undefined' && supabase.createClient) {
        window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('✅ Supabase client initialized');
    } else {
        console.warn('⚠️ Supabase JS library not loaded.');
    }

    // ─── Helper: Save profile to Supabase ───
    window.saveProfileToSupabase = function (name, phone) {
        if (!window.supabaseClient) {
            return Promise.resolve({ success: false, error: 'Supabase not initialized' });
        }

        return window.supabaseClient
            .from('profiles')
            .select('*')
            .eq('phone', phone)
            .maybeSingle()
            .then(function(result) {
                var existing = result.data;
                if (existing) {
                    return window.supabaseClient
                        .from('profiles')
                        .update({ name: name, last_login: new Date().toISOString() })
                        .eq('phone', phone)
                        .select()
                        .single();
                } else {
                    return window.supabaseClient
                        .from('profiles')
                        .insert({ name: name, phone: phone })
                        .select()
                        .single();
                }
            })
            .then(function(result) {
                var data = result.data;
                var error = result.error;
                if (error) return { success: false, error: error.message };
                return {
                    success: true,
                    user: {
                        id: data.id,
                        name: data.name,
                        phone: data.phone
                    }
                };
            })
            .catch(function(err) {
                return { success: false, error: err.message };
            });
    };

    // ─── Helper: Get profile from Supabase by phone ───
    window.getProfileFromSupabase = function (phone) {
        if (!window.supabaseClient) return Promise.resolve(null);

        return window.supabaseClient
            .from('profiles')
            .select('*')
            .eq('phone', phone)
            .maybeSingle()
            .then(function(result) {
                var data = result.data;
                if (!data) return null;
                return {
                    id: data.id,
                    name: data.name,
                    phone: data.phone
                };
            })
            .catch(function() {
                return null;
            });
    };
})();
