// Local backend adapter that mimics Supabase client API

const API_URL = import.meta.env.VITE_LOCAL_API_URL || 'http://localhost:3001';

interface User {
  id: string;
  email: string;
  user_metadata: {
    full_name: string;
    avatar_url?: string;
  };
  provider_token?: string;
}

interface Session {
  access_token: string;
  refresh_token: string;
  user: User;
  provider_token?: string;
}

class LocalAuth {
  private session: Session | null = null;

  async getSession() {
    // Check localStorage
    const stored = localStorage.getItem('local_session');
    if (stored) {
      this.session = JSON.parse(stored);
      return { data: { session: this.session }, error: null };
    }
    return { data: { session: null }, error: null };
  }

  async signInWithOAuth(options: { provider: string; options?: Record<string, unknown> }) {
    // Mock instant login - no actual OAuth
      try {
        const response = await fetch(`${API_URL}/auth/v1/token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ grant_type: 'password', provider: options.provider })
        });
      
        if (!response.ok) {
          throw new Error('Login failed: ' + response.statusText);
        }

        const session = await response.json();
        this.session = session;
        localStorage.setItem('local_session', JSON.stringify(session));
      
        // Trigger storage event manually (since same-window doesn't fire it)
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'local_session',
          newValue: JSON.stringify(session),
          oldValue: null,
          storageArea: localStorage,
          url: window.location.href
        }));
      
        // Force page reload to simulate OAuth return
        setTimeout(() => window.location.reload(), 100);
      
        return { data: { user: session.user, session }, error: null };
      } catch (error) {
        console.error('[LocalBackend] Login error:', error);
        return { data: { user: null, session: null }, error: error as Error };
      }
  }

  async signOut() {
    await fetch(`${API_URL}/auth/v1/logout`, { method: 'POST' });
    this.session = null;
    localStorage.removeItem('local_session');
    return { error: null };
  }

  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    // Initial call
    this.getSession().then(({ data }) => {
      callback('INITIAL_SESSION', data.session);
    });

    // Listen for storage changes (logout in other tab)
    const handler = (e: StorageEvent) => {
      if (e.key === 'local_session') {
        const session = e.newValue ? JSON.parse(e.newValue) : null;
        callback(session ? 'SIGNED_IN' : 'SIGNED_OUT', session);
      }
    };
    window.addEventListener('storage', handler);

    return {
      data: { subscription: { unsubscribe: () => window.removeEventListener('storage', handler) } }
    };
  }
}

class LocalDatabase {
  private getHeaders() {
    const stored = localStorage.getItem('local_session');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (stored) {
      const session = JSON.parse(stored);
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }
    return headers;
  }

  from(table: string) {
    const headers = this.getHeaders();

    const buildQueryString = (filters: Array<{ column: string; value: string | number }>) => {
      const params = new URLSearchParams();
      for (const f of filters) {
        params.append(f.column, `eq.${f.value}`);
      }
      const qs = params.toString();
      return qs ? `?${qs}` : '';
    };

    // Builder state
    const state: {
      columns: string;
      filters: Array<{ column: string; value: string | number }>;
      orderBy?: { column: string; ascending: boolean };
      payload?: Record<string, unknown> | Record<string, unknown>[];
    } = { columns: '*', filters: [] };

    const executor = async () => {
      const qs = buildQueryString(state.filters);
      const url = `${API_URL}/rest/v1/${table}${qs}`;
      const res = await fetch(url, { headers });
      let data: unknown = await res.json();
      if (state.orderBy && Array.isArray(data)) {
        const { column, ascending } = state.orderBy;
        data = (data as Array<Record<string, unknown>>).sort((a, b) => {
          const av = (a?.[column] as string | number | undefined);
          const bv = (b?.[column] as string | number | undefined);
          if (av == null && bv == null) return 0;
          if (av == null) return ascending ? -1 : 1;
          if (bv == null) return ascending ? 1 : -1;
          if (typeof av === 'number' && typeof bv === 'number') {
            return (av - bv) * (ascending ? 1 : -1);
          }
          const as = String(av);
          const bs = String(bv);
          return as.localeCompare(bs) * (ascending ? 1 : -1);
        });
      }
      return { data, error: null as Error | null };
    };

    type Builder = {
      select: (columns?: string) => Builder;
      eq: (column: string, value: string | number) => Builder;
      order: (column: string, options?: { ascending?: boolean }) => Promise<{ data: unknown; error: Error | null }>;
      single: () => Promise<{ data: unknown; error: Error | null }>;
      insert: (payload: Record<string, unknown> | Record<string, unknown>[]) => {
        select: () => { single: () => Promise<{ data: unknown; error: Error | null }> };
      };
      update: (payload: Record<string, unknown>) => {
        eq: (column: string, value: string | number) => Promise<{ error: Error | null }>;
      };
      delete: () => { eq: (column: string, value: string | number) => Promise<{ error: Error | null }> };
    };

    const builder: Builder = {
      select(columns = '*') {
        state.columns = columns;
        return builder;
      },
      eq(column: string, value: string | number) {
        state.filters.push({ column, value });
        return builder;
      },
      order(column: string, options?: { ascending?: boolean }) {
        state.orderBy = { column, ascending: options?.ascending !== false };
        // Execute on await
        return executor();
      },
      single: async () => {
        const { data, error } = await executor();
        if (Array.isArray(data)) {
          return { data: data[0] ?? null, error };
        }
        return { data, error };
      },
      // Mutations
      insert: (payload: Record<string, unknown> | Record<string, unknown>[]) => {
        const arr: Array<Record<string, unknown>> = Array.isArray(payload)
          ? payload
          : [payload];
        const execInsert = async () => {
          const res = await fetch(`${API_URL}/rest/v1/${table}`, {
            method: 'POST',
            headers,
            body: JSON.stringify(arr[0])
          });
          const created = await res.json();
          return { data: created, error: null as Error | null };
        };
        const api = {
          select: () => ({
            single: async () => execInsert()
          }),
          then<TResult1 = { data: unknown; error: Error | null }, TResult2 = never>(
            onfulfilled?: (
              value: { data: unknown; error: Error | null }
            ) => TResult1 | PromiseLike<TResult1>,
            onrejected?: (reason: unknown) => TResult2 | PromiseLike<TResult2>
          ): Promise<TResult1 | TResult2> {
            return execInsert().then(onfulfilled, onrejected);
          }
        };
        return api;
      },
      update: (payload: Record<string, unknown>) => {
        state.payload = payload;
        return {
          eq: async (column: string, value: string | number) => {
            const qs = buildQueryString([{ column, value }]);
            await fetch(`${API_URL}/rest/v1/${table}${qs}`, {
              method: 'PATCH',
              headers,
              body: JSON.stringify(payload)
            });
            return { error: null as Error | null };
          }
        };
      },
      delete: () => ({
        eq: async (column: string, value: string | number) => {
          const qs = buildQueryString([{ column, value }]);
          await fetch(`${API_URL}/rest/v1/${table}${qs}`, {
            method: 'DELETE',
            headers
          });
          return { error: null as Error | null };
        }
      })
    };

    return builder;
  }

  rpc(fn: string, params: Record<string, unknown>) {
    return fetch(`${API_URL}/rest/v1/rpc/${fn}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(params)
    }).then(async (response) => {
      const data = await response.json();
      return { data, error: null };
    });
  }
}

export const localBackend = {
  auth: new LocalAuth(),
  from: (table: string) => new LocalDatabase().from(table),
  rpc: (fn: string, params: Record<string, unknown>) => new LocalDatabase().rpc(fn, params)
};
