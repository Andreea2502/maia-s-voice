/**
 * persona-select — leitet weiter zu tarot/index
 * (Persona-Auswahl ist in index.tsx integriert)
 */
import { useEffect } from 'react';
import { router } from 'expo-router';

export default function PersonaSelect() {
  useEffect(() => {
    router.replace('/tarot');
  }, []);
  return null;
}
