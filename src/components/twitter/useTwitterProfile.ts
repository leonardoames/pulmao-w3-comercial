import { useState, useEffect } from 'react';
import { TwitterProfile } from './types';

const STORAGE_KEY = 'pulmao-twitter-profile';

const DEFAULT_PROFILE: TwitterProfile = {
  name: 'Seu Nome',
  handle: '@seu_handle',
  avatarUrl: '',
};

export function useTwitterProfile() {
  const [profile, setProfile] = useState<TwitterProfile>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : DEFAULT_PROFILE;
    } catch {
      return DEFAULT_PROFILE;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  }, [profile]);

  return { profile, setProfile };
}
