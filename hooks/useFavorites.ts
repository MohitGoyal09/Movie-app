import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FAVORITES_KEY = '@movie_favorites';

export interface FavoriteMovie {
  imdbID: string;
  Title: string;
  Year: string;
  Poster: string;
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteMovie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => { 
    setLoading(true); // Set loading state while fetching
    try {
      const storedFavorites = await AsyncStorage.getItem(FAVORITES_KEY);
      if (storedFavorites) {
        setFavorites(JSON.parse(storedFavorites));
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setLoading(false); // Reset loading state after fetching
    }
  };

  const addFavorite = useCallback(async (movie: FavoriteMovie) => {
    const newFavorites = [...favorites, movie];
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));
    setFavorites(newFavorites);
    loadFavorites(); // Trigger reload after adding
  }, [favorites]);

  const removeFavorite = useCallback(async (imdbID: string) => {
    const newFavorites = favorites.filter(movie => movie.imdbID !== imdbID);
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));
    setFavorites(newFavorites);
    loadFavorites(); // Trigger reload after removing
  }, [favorites]);

  const isFavorite = useCallback((imdbID: string) => {
    return favorites.some(movie => movie.imdbID === imdbID);
  }, [favorites]);

  return {
    loadFavorites,
    favorites,
    loading,
    addFavorite,
    removeFavorite,
    isFavorite,
  };
}
