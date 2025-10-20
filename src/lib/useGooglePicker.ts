import { useCallback, useEffect, useState } from 'react';
import { supabase } from './supabase';

declare global {
  interface Window {
    gapi?: unknown;
    google?: unknown;
  }
}

interface PickerFile {
  id: string;
  name: string;
  url: string;
}

export function useGooglePicker() {
  const [pickerApiLoaded, setPickerApiLoaded] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Minimal runtime-checked types for Google APIs
  type GapiLike = { load: (api: string, cb: () => void) => void };
  type PickerCallback = (data: { action: string; docs: Array<{ id: string; name: string; url: string }> }) => void;
  type PickerBuilder = {
    addView(view: unknown): PickerBuilder;
    setOAuthToken(token: string): PickerBuilder;
    setDeveloperKey(key: string): PickerBuilder;
    setCallback(cb: PickerCallback): PickerBuilder;
    setTitle(title: string): PickerBuilder;
    build(): { setVisible(visible: boolean): void };
  };
  type DocsView = {
    setIncludeFolders(b: boolean): DocsView;
    setSelectFolderEnabled(b: boolean): DocsView;
  };
  type GooglePicker = {
    PickerBuilder: new () => PickerBuilder;
    DocsView: new (viewId: string) => DocsView;
    Action: { PICKED: string };
    ViewId: { SPREADSHEETS: string };
  };
  type GoogleAPI = { picker: GooglePicker };

  useEffect(() => {
    // Load picker API
    try {
      const gapiObj = window.gapi as unknown as Partial<GapiLike> | undefined;
      if (gapiObj && typeof gapiObj.load === 'function') {
        gapiObj.load('picker', () => setPickerApiLoaded(true));
      } else {
        // Retry shortly in case scripts are still loading
        const t = setTimeout(() => {
          const gapiObj2 = window.gapi as unknown as Partial<GapiLike> | undefined;
          if (gapiObj2 && typeof gapiObj2.load === 'function') {
            gapiObj2.load('picker', () => setPickerApiLoaded(true));
          }
        }, 300);
        return () => clearTimeout(t);
      }
    } catch (e) {
      console.error('Failed to init Picker API', e);
      setError('Picker API not available');
    }

    // Get access token from session
    const getToken = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.provider_token) {
          setAccessToken(session.provider_token);
        }
      } catch (e) {
        console.error('Failed to get session for Picker', e);
        setError('No Google token');
      }
    };

    getToken();
  }, []);

  const openPicker = useCallback((onSelect: (file: PickerFile) => void) => {
    const googleObj = window.google as unknown as Partial<GoogleAPI> | undefined;
    const hasPicker = !!googleObj?.picker;
    if (!pickerApiLoaded || !accessToken || !hasPicker) {
      console.error('Picker not ready or no access token');
      setError('Picker not ready');
      return;
    }

    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!googleClientId) {
      console.error('Google Client ID not configured');
      return;
    }

    const picker = new (googleObj!.picker as GooglePicker).PickerBuilder()
      .addView(
        new (googleObj!.picker as GooglePicker).DocsView((googleObj!.picker as GooglePicker).ViewId.SPREADSHEETS)
          .setIncludeFolders(true)
          .setSelectFolderEnabled(false)
      )
      .setOAuthToken(accessToken)
      .setDeveloperKey(import.meta.env.VITE_GOOGLE_API_KEY || '')
      .setCallback((data: { action: string; docs: Array<{ id: string; name: string; url: string }> }) => {
        if (data.action === (googleObj!.picker as GooglePicker).Action.PICKED) {
          const file = data.docs[0];
          onSelect({ id: file.id, name: file.name, url: file.url });
        }
      })
      .setTitle('Select a Google Spreadsheet')
      .build();

    picker.setVisible(true);
  }, [pickerApiLoaded, accessToken]);

  return {
    openPicker,
    isReady: pickerApiLoaded && !!accessToken,
    error,
  };
}
