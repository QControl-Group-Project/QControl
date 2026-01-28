import { createBrowserClient } from "@supabase/ssr";
import { SupabaseClient } from "@supabase/supabase-js";

let supabaseClient: SupabaseClient | undefined;

export function getSupabaseClient() {
  if (supabaseClient) {
    return supabaseClient;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  supabaseClient = createBrowserClient(url, anonKey, {
    cookies: {
      get(name: string) {
        if (typeof window === 'undefined') {
          return undefined;
        }
        const value = document.cookie
          .split('; ')
          .find(row => row.startsWith(`${name}=`))
          ?.split('=')[1];
        return value ? decodeURIComponent(value) : undefined;
      },
      set(name: string, value: string, options: any) {
        if (typeof window === 'undefined') {
          return;
        }

        const maxAge = options?.maxAge ?? 2592000; 

        let cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge};`;

        if (options?.sameSite) {
          cookie += ` samesite=${options.sameSite};`;
        } else {
          cookie += ' samesite=lax;';
        }

        if (options?.secure || process.env.NODE_ENV === 'production') {
          cookie += ' secure;';
        }

        document.cookie = cookie;
      },
      remove(name: string) {
        if (typeof window === 'undefined') {
          return;
        }
        document.cookie = `${name}=; path=/; max-age=0;`;
      },
    },
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      debug: process.env.NODE_ENV === 'development',
    },
  });

  return supabaseClient;
}

