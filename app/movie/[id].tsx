import { useEffect, useState } from 'react';
import { StyleSheet, View, Text, Image, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { Heart } from 'lucide-react-native';
import { useFavorites } from '@/hooks/useFavorites';
import React from 'react';

interface MovieDetails {
  Title: string;
  Year: string;
  Rated: string;
  Runtime: string;
  Genre: string;
  Director: string;
  Plot: string;
  Poster: string;
  imdbRating: string;
  imdbID: string;
}

const OMDB_API_KEY = Constants.expoConfig?.extra?.EXPO_PUBLIC_OMDB_API_KEY;

export default function MovieDetailsScreen() {
  const { id } = useLocalSearchParams();
  const [movie, setMovie] = useState<MovieDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addFavorite, removeFavorite, isFavorite } = useFavorites();

  useEffect(() => {
    fetchMovieDetails();
  }, [id]);

  const fetchMovieDetails = async () => {
    try {
      const response = await fetch(
        `https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&i=${id}&plot=full`
      );
      const data = await response.json();
      
      if (data.Response === 'False') {
        setError(data.Error || 'Failed to load movie details');
        setMovie(null);
      } else {
        setMovie(data);
        setError(null);
      }
    } catch (error) {
      console.error('Error fetching movie details:', error);
      setError('Failed to load movie details. Please try again.');
      setMovie(null);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = () => {
    if (!movie) return;

    if (isFavorite(movie.imdbID)) {
      removeFavorite(movie.imdbID);
    } else {
      addFavorite({
        imdbID: movie.imdbID,
        Title: movie.Title,
        Year: movie.Year,
        Poster: movie.Poster,
      });
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E50914" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!movie) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Movie not found</Text>
      </View>
    );
  }

  const isFavorited = isFavorite(movie.imdbID);

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: '',
          headerTransparent: true,
          headerTintColor: '#fff',
          headerStyle: {
            backgroundColor: 'transparent',
          },
          headerRight: () => (
            <TouchableOpacity
              style={styles.favoriteButton}
              onPress={toggleFavorite}>
              <Heart
                size={24}
                color="#fff"
                fill={isFavorited ? "#fff" : "none"}
              />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView style={styles.container}>
        <View style={styles.posterContainer}>
          <Image
            source={{
              uri: movie.Poster !== 'N/A' ? movie.Poster : 'https://via.placeholder.com/300x450',
            }}
            style={styles.poster}
          />
          <View style={styles.overlay} />
        </View>

        <View style={styles.detailsContainer}>
          <Text style={styles.title}>{movie.Title}</Text>
          <View style={styles.metaContainer}>
            <Text style={styles.meta}>{movie.Year}</Text>
            <Text style={styles.metaDot}>•</Text>
            <Text style={styles.meta}>{movie.Runtime}</Text>
            <Text style={styles.metaDot}>•</Text>
            <Text style={styles.meta}>{movie.Rated}</Text>
          </View>

          <View style={styles.ratingContainer}>
            <Text style={styles.ratingText}>IMDb Rating</Text>
            <Text style={styles.rating}>{movie.imdbRating}/10</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Genre</Text>
            <Text style={styles.sectionText}>{movie.Genre}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Director</Text>
            <Text style={styles.sectionText}>{movie.Director}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Plot</Text>
            <Text style={styles.plot}>{movie.Plot}</Text>
          </View>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
  },
  errorText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#E50914',
    textAlign: 'center',
  },
  posterContainer: {
    height: 500,
    position: 'relative',
  },
  poster: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  detailsContainer: {
    padding: 16,
    marginTop: -50,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
    color: '#000',
    marginBottom: 8,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  meta: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#666',
  },
  metaDot: {
    marginHorizontal: 8,
    color: '#666',
  },
  ratingContainer: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  ratingText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  rating: {
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
    color: '#E50914',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#000',
    marginBottom: 8,
  },
  sectionText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#666',
  },
  plot: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  favoriteButton: {
    padding: 12,
  },
});