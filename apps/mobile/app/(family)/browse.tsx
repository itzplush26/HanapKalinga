import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function BrowseTab() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/(public)/nurses');
  }, [router]);

  return null;
}
