import { useState, useEffect } from 'react';
import { StyleSheet, View, TextInput, FlatList, Image, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Search, X, Heart } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { useFavorites, FavoriteMovie } from '../../hooks/useFavorites'; 

interface Movie {
  imdbID: string;
  Title: string;
  Year: string;
  Rated: string;
  Released: string;
  Runtime: string;
  Genre: string;
  Director: string;
  Writer: string;
  Actors: string;
  Plot: string;
  BoxOffice: string;
  Poster: string;
}

const OMDB_API_KEY = Constants.expoConfig?.extra?.EXPO_PUBLIC_OMDB_API_KEY;
const ITEMS_PER_PAGE = 10; 

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [movies, setMovies] = useState<Movie[]>([]);
  const [defaultMovies, setDefaultMovies] = useState<Movie[]>([]); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalResults, setTotalResults] = useState<number>(0);
  const router = useRouter();
  const { addFavorite, removeFavorite, isFavorite, loadFavorites } = useFavorites(); 

  const searchMovies = async (query: string, pageNumber: number = 1, append: boolean = false) => {
    if (!query.trim()) {
      setMovies([]);
      setError(null);
      setHasMore(true);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&s=${encodeURIComponent(query)}&page=${pageNumber}`
      );
      const data = await response.json();
      
      console.log('API Response:', data); 
      if (data.Response === 'False') {
        setError(data.Error || 'No movies found');
        setMovies(append ? movies : []);
        setHasMore(false);
      } else if (data.Search) {
        const resultsToShow = data.Search.slice(0, ITEMS_PER_PAGE);
        setTotalResults(parseInt(data.totalResults, 10));
        setMovies(append ? [...movies, ...resultsToShow] : resultsToShow);
        setHasMore(pageNumber * ITEMS_PER_PAGE < totalResults);
      } else {
        setMovies(append ? movies : []);
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error fetching movies:', error);
      setError('Failed to fetch movies. Please try again.');
      setMovies(append ? movies : []);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (movies.length < totalResults) { 
      const nextPage = page + 1;
      setPage(nextPage);
      searchMovies(searchQuery, nextPage, true);
    }
  };

  const fetchDefaultMovies = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&s=batman&page=1` 
      );
      const data = await response.json();
      if (data.Response === 'True') {
        const resultsToShow = data.Search.slice(0, ITEMS_PER_PAGE); 
        setDefaultMovies(resultsToShow);
      }
    } catch (error) {
      console.error('Error fetching default movies:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDefaultMovies();
  }, []);

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    setPage(1);
    searchMovies(text, 1, false);
  };

  const toggleFavorite = (movie: Movie) => {
    if (isFavorite(movie.imdbID)) {
      removeFavorite(movie.imdbID);
      setMovies(movies.filter(m => m.imdbID !== movie.imdbID)); 
    } else {
      addFavorite(movie as FavoriteMovie);
      setMovies([...movies, movie]); 
    }
  };

  const renderMovieItem = ({ item }: { item: Movie }) => {
    const posterUrl = item.Poster !== 'N/A' ? item.Poster : 'https://via.placeholder.com/300x450';
    return (
      <TouchableOpacity
        style={styles.movieItem}
        onPress={() => router.push(`/movie/${item.imdbID}`)}>
        <Image
          source={{ uri: posterUrl }}
          style={styles.poster}
        />
        <View style={styles.movieInfo}>
          <Text style={styles.title} numberOfLines={2}>
            {item.Title}
          </Text>
          <Text style={styles.year}>{item.Year}</Text>
        </View>
        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={() => toggleFavorite(item)}>
          <Heart
            size={24}
            color="#E50914"
            fill={isFavorite(item.imdbID) ? "#E50914" : "none"}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderFooter = () => {
    if (!loading || !hasMore) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color="#E50914" />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchContainer}>
        <Search size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search movies..."
          value={searchQuery}
          onChangeText={handleSearch}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => {
              setSearchQuery('');
              setMovies([]);
              setError(null);
              setHasMore(true);
              setPage(1);
            }}>
            <X size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity onPress={loadFavorites} style={styles.reloadButton}>
        <Text style={styles.reloadText}>Reload Favorites</Text>
      </TouchableOpacity>
      {loading && (movies.length === 0 && defaultMovies.length === 0) ? (
        <ActivityIndicator style={styles.loader} size="large" color="#E50914" />
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={searchQuery ? movies : defaultMovies} 
          renderItem={renderMovieItem}
          keyExtractor={(item) => item.imdbID}
          contentContainerStyle={styles.movieList}
          ListEmptyComponent={
            searchQuery ? (
              <Text style={styles.emptyText}>No movies found</Text>
            ) : (
              <Text style={styles.emptyText}>Here are some movies:</Text> 
            )
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0', 
    padding: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#000',
  },
  movieList: {
    padding: 16,
  },
  movieItem: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 12, 
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
    padding: 10,
  },
  poster: {
    width: 80,
    height: 120,
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
  },
  movieInfo: {
    flex: 1,
    padding: 12,
  },
  title: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    marginBottom: 4,
    color: '#000',
  },
  year: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#666',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20, 
  },
  emptyText: {
    textAlign: 'center',
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#666',
    marginTop: 32,
    fontStyle: 'italic', 
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: '#E50914',
    textAlign: 'center',
    marginVertical: 20, 
  },
  favoriteButton: {
    padding: 12,
    justifyContent: 'center',
  },
  footer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  reloadButton: {
    padding: 12,
    backgroundColor: '#E50914',
    borderRadius: 12, 
    alignItems: 'center',
    marginVertical: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  reloadText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    textAlign: 'center',
  },
});
