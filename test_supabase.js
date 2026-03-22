import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://qfslqgmcxfltfpuzoyph.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmc2xxZ21jeGZsdGZwdXpveXBoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2NjAyMjksImV4cCI6MjA4OTIzNjIyOX0.Dvv253mdPYVShc9wZpAfCIcxnF_O7OD6ciYHea0TZ9Q'
);

async function test() {
  const email = 'marcseif@test.com'; // Some email that probably already exists or not.
  const password = 'password1234!';
  
  console.log('Testing existing?');
  let res2 = await supabase.auth.signUp({ email, password, options: { data: { username: 'test_user_exisqqqwqwq' } } });
  console.log(JSON.stringify(res2, null, 2));
}

test();
