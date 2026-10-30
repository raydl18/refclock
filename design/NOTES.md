9/19/2026.
# Working on fixing the reauthentication flow from a password recovery link.
What runs on page load?
- index.html loads supabase.js with no defer, so it executes immediately during HTML parsing. It loads app.js with defer, so it executes after the HTML is parsed. This means that supabase.js is available to app.js when it runs.
- createClient() in supabase.js runs immediately during parsing. detectSessionInUrl defaults to on, so the client starts reading window.location.hash
- onAuthStateChange() in app.js runs once at startup. It registers a callback which fires many times, ex. sign in, sign out, token refresh
- onPasswordRecovery() in supabase.js runs once at startup, and also registers a callback that fires zero or one times
- getUser() in app.js runs once at startup to paint the right header state.

