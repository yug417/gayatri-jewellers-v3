(function () {
    var SUPABASE_URL = 'https://omddrkchlokibusixgmf.supabase.co';
    var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9tZGRya2NobG9raWJ1c2l4Z21mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2OTMyMjYsImV4cCI6MjA5MDI2OTIyNn0.5O0WS_NS0D5nmDEZfW-Dv2_Nq6zY7uSl10KCrPauAsY';
    if (typeof supabase !== 'undefined' && supabase.createClient) {
        window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('✅ Supabase initialized');
    }
    window.saveProfileToSupabase = function (name, phone) {
        if (!window.supabaseClient) return Promise.resolve({ success: false });
        return window.supabaseClient.from('profiles').select('*').eq('phone', phone).maybeSingle().then(res => {
            if (res.data) return window.supabaseClient.from('profiles').update({ name: name, last_login: new Date().toISOString() }).eq('phone', phone).select().single();
            return window.supabaseClient.from('profiles').insert({ name: name, phone: phone }).select().single();
        }).then(res => ({ success: !res.error, user: res.data }));
    };
    window.getProfileFromSupabase = function (phone) {
        if (!window.supabaseClient) return Promise.resolve(null);
        return window.supabaseClient.from('profiles').select('*').eq('phone', phone).maybeSingle().then(res => res.data);
    };
})();
