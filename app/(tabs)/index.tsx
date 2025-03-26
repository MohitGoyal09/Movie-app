import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  FlatList,
  Image,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Search, X, Heart } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { useFavorites, FavoriteMovie } from '../../hooks/useFavorites';

function debounce<F extends (...args: any[]) => any>(
  func: F,
  wait: number
): (...args: Parameters<F>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  return function (this: ThisParameterType<F>, ...args: Parameters<F>) {
    const context = this;
    if (timeoutId !== null) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func.apply(context, args);
    }, wait);
  };
}

interface Movie {
  imdbID: string;
  Title: string;
  Year: string;
  Poster: string;
  Rated?: string;
  Released?: string;
  Runtime?: string;
  Genre?: string;
  Director?: string;
  Writer?: string;
  Actors?: string;
  Plot?: string;
  BoxOffice?: string;
  Type?: string;
}

const OMDB_API_KEY = Constants.expoConfig?.extra?.EXPO_PUBLIC_OMDB_API_KEY;
const ITEMS_PER_PAGE = 10;
const DEBOUNCE_DELAY = 500;

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [movies, setMovies] = useState<Movie[]>([]);
  const [defaultMovies, setDefaultMovies] = useState<Movie[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalResults, setTotalResults] = useState<number>(0);
  const [hasMore, setHasMore] = useState(false);

  const router = useRouter();

  const { addFavorite, removeFavorite, isFavorite, loadFavorites } =
    useFavorites();

  const fetchMoviesFromApi = useCallback(
    async (query: string, pageNumber: number = 1, append: boolean = false) => {
      if (!query.trim()) {
        setMovies([]);
        setError(null);
        setHasMore(false);
        setTotalResults(0);
        setLoadingInitial(false);
        setLoadingMore(false);
        setPage(1);
        return;
      }

      if (append) setLoadingMore(true);
      else setLoadingInitial(true);
      setError(null); // Clear error before fetch

      try {
        const response = await fetch(
          `https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&s=${encodeURIComponent(
            query
          )}&type=movie&page=${pageNumber}`
        );
        const data = await response.json();
        console.log(
          `API Response (Query: ${query}, Page: ${pageNumber}):`,
          data
        );

        if (data.Response === 'True' && data.Search) {
          const newMovies = data.Search;
          const fetchedTotalResults = parseInt(data.totalResults, 10);
          setMovies((prevMovies) =>
            append ? [...prevMovies, ...newMovies] : newMovies
          );
          setTotalResults(fetchedTotalResults);
          setHasMore(pageNumber * ITEMS_PER_PAGE < fetchedTotalResults); // Correctly check if more pages exist
        } else {
          setError(data.Error || 'No movies found.');
          if (!append) setMovies([]); // Clear only if first page failed
          setHasMore(false);
        }
      } catch (err) {
        console.error('Error fetching movies:', err);
        setError('Failed to fetch movies. Check connection.');
        if (!append) setMovies([]);
        setHasMore(false);
      } finally {
        setLoadingInitial(false);
        setLoadingMore(false);
      }
    },
    [OMDB_API_KEY]
  );

  const debouncedSearchRef = useRef(
    debounce((query: string) => {
      fetchMoviesFromApi(query, 1, false);
    }, DEBOUNCE_DELAY)
  );

  const fetchDefaultMovies = useCallback(async () => {
    if (defaultMovies.length > 0 || loadingInitial) return;
    console.log('Fetching default movies...');
    setLoadingInitial(true);
    setError(null);
    try {
      const response = await fetch(
        `https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&s=batman&type=movie&page=1`
      );
      const data = await response.json();
      if (data.Response === 'True' && data.Search) {
        setDefaultMovies(data.Search.slice(0, ITEMS_PER_PAGE));
      } else {
        console.warn('Could not fetch default movies:', data.Error);
      }
    } catch (error) {
      console.error('Error fetching default movies:', error);
    } finally {
      setLoadingInitial(false);
    }
  }, [OMDB_API_KEY, defaultMovies.length, loadingInitial]);

  useEffect(() => {
    fetchDefaultMovies();
  }, [fetchDefaultMovies]);

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    debouncedSearchRef.current(text);
  };

  const clearSearch = () => {
    setSearchQuery('');
    debouncedSearchRef.current('');
  };

  const loadMore = () => {
    if (!loadingMore && !loadingInitial && hasMore && searchQuery.trim()) {
      const nextPage = page + 1;
      console.log('Loading page:', nextPage);
      setPage(nextPage);
      fetchMoviesFromApi(searchQuery, nextPage, true);
    }
  };

  const toggleFavorite = (movie: Movie) => {
    const favoriteData: FavoriteMovie = {
      imdbID: movie.imdbID,
      Title: movie.Title,
      Year: movie.Year,
      Poster: movie.Poster,
    };
    if (isFavorite(movie.imdbID)) removeFavorite(movie.imdbID);
    else addFavorite(favoriteData);
  };

  const renderMovieItem = ({ item }: { item: Movie }) => {
    const posterUrl =
      item.Poster && item.Poster !== 'N/A'
        ? item.Poster
        : 'https://via.placeholder.com/100x150';
    const favorite = isFavorite(item.imdbID);
    return (
      <TouchableOpacity
        style={styles.movieItem}
        onPress={() => router.push(`/movie/${item.imdbID}`)}
      >
        <Image
          source={{ uri: posterUrl }}
          style={styles.poster}
          resizeMode="cover"
        />
        <View style={styles.movieInfo}>
          <Text style={styles.title} numberOfLines={2}>
            {item.Title}
          </Text>
          <Text style={styles.year}>{item.Year}</Text>
        </View>
        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={() => toggleFavorite(item)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Heart
            size={24}
            color="#E50914"
            fill={favorite ? '#E50914' : 'none'}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color="#E50914" />
      </View>
    );
  };

  const displayData = searchQuery.trim() ? movies : defaultMovies;
  const showInitialLoader = loadingInitial && displayData.length === 0;
  const showEmptySearch =
    !loadingInitial &&
    !loadingMore &&
    movies.length === 0 &&
    !!searchQuery.trim();
  const showDefaultInfo =
    !loadingInitial &&
    !loadingMore &&
    !searchQuery.trim() &&
    defaultMovies.length === 0;
  const showError =
    error && !loadingInitial && !loadingMore && movies.length === 0;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.searchContainer}>
        <Search size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search movies by title..."
          placeholderTextColor="#888"
          value={searchQuery}
          onChangeText={handleSearchChange}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
            <X size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      {showInitialLoader ? (
        <ActivityIndicator style={styles.loader} size="large" color="#E50914" />
      ) : showError ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={displayData}
          renderItem={renderMovieItem}
          keyExtractor={(item, index) => `${item.imdbID}-${index}`}
          contentContainerStyle={styles.movieListContainer}
          ListEmptyComponent={
            showEmptySearch ? (
              <Text style={styles.emptyText}>
                No movies found for "{searchQuery}"
              </Text>
            ) : showDefaultInfo ? (
              <Text style={styles.emptyText}>Search for movies to begin!</Text>
            ) : null
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          keyboardShouldPersistTaps="handled"
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    padding: 8,
  },
  movieListContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  movieItem: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  poster: {
    width: 80,
    height: 120,
    backgroundColor: '#e0e0e0',
  },
  movieInfo: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  title: {
    fontWeight: '600',
    fontSize: 15,
    marginBottom: 4,
    color: '#333',
  },
  year: {
    fontSize: 13,
    color: '#666',
  },
  favoriteButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loader: {
    marginTop: 50,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 50,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontWeight: '600',
    fontSize: 17,
    color: '#D8000C',
    textAlign: 'center',
  },
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});
