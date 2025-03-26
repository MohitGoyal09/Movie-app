import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { Heart, ChevronLeft } from 'lucide-react-native';
import { useFavorites, FavoriteMovie } from '@/hooks/useFavorites';

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
  const { id } = useLocalSearchParams<{ id: string }>();
  const [movie, setMovie] = useState<MovieDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addFavorite, removeFavorite, isFavorite } = useFavorites();
  const router = useRouter();

  useEffect(() => {
    const fetchMovieDetails = async () => {
      if (!id || typeof id !== 'string') {
        setError('Invalid Movie ID');
        setLoading(false);
        return;
      }

      console.log('Fetching details for ID:', id);
      setLoading(true);
      setError(null);
      setMovie(null);

      try {
        const response = await fetch(
          `https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&i=${id}&plot=full`
        );
        const data = await response.json();

        if (data.Response === 'False') {
          setError(data.Error || 'Failed to load movie details');
        } else {
          setMovie(data as MovieDetails);
          setError(null);
        }
      } catch (err) {
        console.error('Error fetching movie details:', err);
        setError('Failed to load movie details. Check connection.');
      } finally {
        setLoading(false);
      }
    };

    fetchMovieDetails();
  }, [id]);

  const toggleFavorite = () => {
    if (!movie) return;
    const favoriteData: FavoriteMovie = {
      imdbID: movie.imdbID,
      Title: movie.Title,
      Year: movie.Year,
      Poster: movie.Poster,
    };
    if (isFavorite(movie.imdbID)) removeFavorite(movie.imdbID);
    else addFavorite(favoriteData);
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
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.headerButton}
            >
              <ChevronLeft size={28} color="#fff" />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity
              onPress={toggleFavorite}
              style={styles.headerButton}
            >
              <Heart
                size={24}
                color="#fff"
                fill={isFavorited ? '#fff' : 'none'}
              />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.posterContainer}>
          <Image
            source={{
              uri:
                movie.Poster && movie.Poster !== 'N/A'
                  ? movie.Poster
                  : 'https://via.placeholder.com/300x450?text=No+Image',
            }}
            style={styles.posterImage}
            resizeMode="cover"
          />
          <View style={styles.posterOverlay} />
          <View style={styles.titleOverlay}>
            <Text style={styles.title} numberOfLines={2}>
              {movie.Title}
            </Text>
          </View>
        </View>

        <View style={styles.detailsContent}>
          <View style={styles.metaContainer}>
            <Text style={styles.metaText}>{movie.Year}</Text>
            {movie.Runtime && movie.Runtime !== 'N/A' && (
              <>
                <Text style={styles.metaSeparator}>•</Text>
                <Text style={styles.metaText}>{movie.Runtime}</Text>
              </>
            )}
            {movie.Rated && movie.Rated !== 'N/A' && (
              <>
                <Text style={styles.metaSeparator}>•</Text>
                <Text style={styles.metaText}>{movie.Rated}</Text>
              </>
            )}
          </View>

          {movie.imdbRating && movie.imdbRating !== 'N/A' && (
            <View style={styles.ratingSection}>
              <Text style={styles.ratingLabel}>IMDb Rating</Text>
              <Text style={styles.ratingValue}>
                <Text style={styles.ratingScore}>{movie.imdbRating}</Text>/10
              </Text>
            </View>
          )}

          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Plot Summary</Text>
            <Text style={styles.plotText}>{movie.Plot || 'N/A'}</Text>
          </View>

          {movie.Genre && movie.Genre !== 'N/A' && (
            <View style={styles.infoSection}>
              <Text style={styles.sectionTitle}>Genre</Text>
              <Text style={styles.infoText}>{movie.Genre}</Text>
            </View>
          )}

          {movie.Director && movie.Director !== 'N/A' && (
            <View style={styles.infoSection}>
              <Text style={styles.sectionTitle}>Director</Text>
              <Text style={styles.infoText}>{movie.Director}</Text>
            </View>
          )}
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
  scrollContent: {
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#141414',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  errorText: {
    fontSize: 16,
    color: '#E50914',
    textAlign: 'center',
  },
  headerButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  posterContainer: {
    width: '100%',
    height: 450,
    backgroundColor: '#222',
  },
  posterImage: {
    width: '100%',
    height: '100%',
  },
  posterOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  titleOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 60,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 28,
    color: '#fff',
    textAlign: 'left',
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  detailsContent: {
    padding: 20,
    marginTop: -20,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: 300,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  metaText: {
    fontSize: 14,
    color: '#555',
  },
  metaSeparator: {
    marginHorizontal: 6,
    color: '#999',
    fontSize: 14,
  },
  ratingSection: {
    marginBottom: 24,
    padding: 12,
    backgroundColor: '#f7f7f7',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  ratingLabel: {
    fontWeight: '600',
    fontSize: 14,
    color: '#444',
    marginRight: 10,
  },
  ratingValue: {
    fontSize: 16,
    color: '#333',
  },
  ratingScore: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#E50914',
  },
  infoSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontWeight: '600',
    fontSize: 18,
    color: '#333',
    marginBottom: 8,
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
    paddingBottom: 4,
  },
  infoText: {
    fontSize: 15,
    color: '#555',
    lineHeight: 22,
  },
  plotText: {
    fontSize: 15,
    color: '#555',
    lineHeight: 24,
  },
});
