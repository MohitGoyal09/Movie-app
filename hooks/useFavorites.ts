import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FAVORITES_KEY = '@movie_favorites';

export interface FavoriteMovie {
  imdbID: string;
  Title: string;
  Year: string;
  Poster: string;
  Type?: string;
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteMovie[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFavorites = useCallback(async () => {
    try {
      const storedFavorites = await AsyncStorage.getItem(FAVORITES_KEY);
      if (storedFavorites) {
        const parsedFavorites = JSON.parse(storedFavorites);

        setFavorites((prev) => {
          if (JSON.stringify(prev) !== JSON.stringify(parsedFavorites)) {
            return parsedFavorites;
          }
          return prev;
        });
      } else {
        setFavorites([]);
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    loadFavorites();
  }, [loadFavorites]);

  const addFavorite = useCallback(
    async (movie: FavoriteMovie) => {
      // Prevent adding duplicates
      if (favorites.some((fav) => fav.imdbID === movie.imdbID)) {
        console.log('Movie already in favorites:', movie.imdbID);
        return;
      }
      const newFavorites = [...favorites, movie];
      try {
        await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));
        setFavorites(newFavorites);
        console.log('Added favorite:', movie.imdbID);
      } catch (error) {
        console.error('Error saving favorite:', error);
      }
    },
    [favorites]
  );

  const removeFavorite = useCallback(
    async (imdbID: string) => {
      const newFavorites = favorites.filter((movie) => movie.imdbID !== imdbID);

      if (newFavorites.length !== favorites.length) {
        try {
          await AsyncStorage.setItem(
            FAVORITES_KEY,
            JSON.stringify(newFavorites)
          );
          setFavorites(newFavorites);
          console.log('Removed favorite:', imdbID);
        } catch (error) {
          console.error('Error removing favorite:', error);
        }
      }
    },
    [favorites]
  );

  const isFavorite = useCallback(
    (imdbID: string) => {
      return favorites.some((movie) => movie.imdbID === imdbID);
    },
    [favorites]
  );

  return {
    loadFavorites,
    favorites,
    loading,
    addFavorite,
    removeFavorite,
    isFavorite,
  };
}
