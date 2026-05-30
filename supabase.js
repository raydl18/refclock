/* Supabase client — configure these two constants before deploying */
const SUPABASE_URL     = 'https://glrecozajprxtxtfiped.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_MrasY7nJvnsGC1WKvVlTZg_CW3qfHxj';

const _client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function signUp(email, password, displayName) {
  const { data, error } = await _client.auth.signUp({
    email, password,
    options: { data: { display_name: displayName } },
  });
  return { user: data?.user, error };
}

async function signInWithPassword(email, password) {
  const { data, error } = await _client.auth.signInWithPassword({ email, password });
  return { user: data?.user, error };
}

async function resetPassword(email) {
  const { error } = await _client.auth.resetPasswordForEmail(email, {
    redirectTo: 'https://raydl18.github.io/refclock',
  });
  return error;
}

async function signOut() {
  const { error } = await _client.auth.signOut();
  return error;
}

async function getUser() {
  const { data: { user }, error } = await _client.auth.getUser();
  return error ? null : user;
}

async function saveGame(gameRecord) {
  const { error } = await _client.from('games').insert(gameRecord);
  return error;
}

async function fetchGames() {
  const { data, error } = await _client
    .from('games')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);
  return { data: data || [], error };
}

function onAuthStateChange(callback) {
  _client.auth.onAuthStateChange((_event, session) => {
    callback(session ? session.user : null);
  });
}

window.SupabaseAPI = { signUp, signInWithPassword, resetPassword, signOut, getUser, saveGame, fetchGames, onAuthStateChange };
