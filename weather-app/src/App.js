import React, { useState, useEffect, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaSearch, FaPlay, FaFilm, FaTimes, FaPlus, 
  FaArrowUp, FaSignOutAlt, FaUser, FaYoutube, FaTrash, FaCheckCircle, FaCreditCard, FaChevronDown
} from 'react-icons/fa';
import { FaFacebook, FaTwitter, FaInstagram } from 'react-icons/fa';
import './App.css';

const API_URL = "https://imdb.iamidiotareyoutoo.com/search?size=20&q=";

// --- 1. MOCK BACKEND SERVICE ---
const AuthService = {
  getUsers: () => JSON.parse(localStorage.getItem('filmbox_users')) || [],
  
  signup: (email, password, name) => {
    const users = AuthService.getUsers();
    if (users.find(u => u.email === email)) return { error: "User already exists" };
    const newUser = { email, password, name, myList: [], isSubscribed: false };
    users.push(newUser);
    localStorage.setItem('filmbox_users', JSON.stringify(users));
    return { user: newUser };
  },

  login: (email, password) => {
    const users = AuthService.getUsers();
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) return { error: "Invalid email or password" };
    return { user };
  },

  subscribeUser: (email) => {
    const users = AuthService.getUsers();
    const index = users.findIndex(u => u.email === email);
    if (index !== -1) {
      users[index].isSubscribed = true;
      localStorage.setItem('filmbox_users', JSON.stringify(users));
      const currentUser = JSON.parse(localStorage.getItem('filmbox_current_user'));
      if (currentUser) {
        currentUser.isSubscribed = true;
        localStorage.setItem('filmbox_current_user', JSON.stringify(currentUser));
      }
      return users[index];
    }
  },

  saveUserList: (email, myList) => {
    const users = AuthService.getUsers();
    const index = users.findIndex(u => u.email === email);
    if (index !== -1) {
      users[index].myList = myList;
      localStorage.setItem('filmbox_users', JSON.stringify(users));
      const currentUser = JSON.parse(localStorage.getItem('filmbox_current_user'));
      currentUser.myList = myList;
      localStorage.setItem('filmbox_current_user', JSON.stringify(currentUser));
    }
  }
};

const AuthContext = createContext();

export default function App() {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('filmbox_current_user')));

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('filmbox_current_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('filmbox_current_user');
  };

  const completeSubscription = () => {
    const updatedUser = AuthService.subscribeUser(user.email);
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, completeSubscription }}>
      <div className="app">
        {!user ? (
          <AuthScreen />
        ) : !user.isSubscribed ? (
          <PaymentScreen />
        ) : (
          <MainApp />
        )}
      </div>
    </AuthContext.Provider>
  );
}

// --- 2. AUTH SCREEN (Dark Theme) ---
function AuthScreen() {
  const { login } = useContext(AuthContext);
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ email: '', password: '', name: '' });
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (isLogin) {
      const res = AuthService.login(formData.email, formData.password);
      res.error ? setError(res.error) : login(res.user);
    } else {
      if(!formData.name || !formData.email || !formData.password) {
        setError("All fields are required"); return;
      }
      const res = AuthService.signup(formData.email, formData.password, formData.name);
      res.error ? setError(res.error) : login(res.user);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <div className="auth-brand"><FaFilm /> FILMBOX</div>
        <h2>{isLogin ? 'Sign In' : 'Create Account'}</h2>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          {!isLogin && <input type="text" placeholder="Name" onChange={e => setFormData({...formData, name: e.target.value})} />}
          <input type="email" placeholder="Email" onChange={e => setFormData({...formData, email: e.target.value})} />
          <input type="password" placeholder="Password" onChange={e => setFormData({...formData, password: e.target.value})} />
          <button type="submit" className="auth-btn">{isLogin ? 'Sign In' : 'Sign Up'}</button>
        </form>
        <p className="auth-switch" onClick={() => setIsLogin(!isLogin)}>
          {isLogin ? "New to FilmBox? Sign up." : "Have an account? Sign in."}
        </p>
      </div>
    </div>
  );
}

// --- 3. PAYMENT SCREEN (Dark Theme & Naira) ---
function PaymentScreen() {
  const { logout, completeSubscription, user } = useContext(AuthContext);
  const [selectedPlan, setSelectedPlan] = useState('Family'); // Default to Family
  const [processing, setProcessing] = useState(false);

  // Pricing Data
  const plans = {
    Basic: { price: '₦2,500', quality: 'Good', res: '720p' },
    Family: { price: '₦7,500', quality: 'Better', res: '1080p' },
    Premium: { price: '₦15,500', quality: 'Best', res: '4K+HDR' }
  };

  const handlePayment = () => {
    setProcessing(true);
    setTimeout(() => {
      completeSubscription();
      setProcessing(false);
    }, 1500);
  };

  return (
    <div className="payment-container dark-theme">
      <nav className="payment-nav">
        <div className="brand"><FaFilm /> FILMBOX</div>
        <button className="logout-text-btn" onClick={logout}>Sign Out</button>
      </nav>
      
      <div className="payment-content">
        <div className="payment-header">
          <div className="step-indicator">STEP 2 OF 2</div>
          <h1>Choose your plan.</h1>
          <ul className="benefit-list">
            <li><FaCheckCircle /> Watch all you want. Ad-free.</li>
            <li><FaCheckCircle /> Recommendations just for you.</li>
            <li><FaCheckCircle /> Change or cancel your plan anytime.</li>
          </ul>
        </div>

        <div className="plan-grid">
          {Object.keys(plans).map((planName) => (
            <div 
              key={planName} 
              className={`plan-card ${selectedPlan === planName ? 'selected' : ''}`}
              onClick={() => setSelectedPlan(planName)}
            >
              <div className="plan-name">{planName}</div>
              <div className="plan-price">{plans[planName].price}</div>
              <div className="plan-quality">{plans[planName].quality}</div>
              <div className="plan-res">{plans[planName].res}</div>
            </div>
          ))}
        </div>

        <button className="pay-btn" onClick={handlePayment} disabled={processing}>
          {processing ? 'Processing Payment...' : `Pay ${plans[selectedPlan].price}`} <FaCreditCard style={{marginLeft: 10}}/>
        </button>
      </div>
    </div>
  );
}

// --- 4. MAIN APP ---
function MainApp() {
  const [search, setSearch] = useState(""); 
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [view, setView] = useState("home"); 

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <Navbar search={search} setSearch={setSearch} isScrolled={isScrolled} setView={setView} />
      
      <main>
        {search.length >= 3 ? (
          <SearchResults search={search} onSelect={setSelectedMovie} />
        ) : view === "wishlist" ? (
          <WishlistPage onSelect={setSelectedMovie} />
        ) : (
          <HomeView onSelect={setSelectedMovie} />
        )}
      </main>

      <AnimatePresence>
        {selectedMovie && (
          <MovieDetails movie={selectedMovie} onClose={() => setSelectedMovie(null)} />
        )}
      </AnimatePresence>

      <ScrollToTop />
      <Footer />
    </>
  );
}

// --- 5. REDESIGNED NAVBAR ---
function Navbar({ search, setSearch, isScrolled, setView }) {
  const { user, logout } = useContext(AuthContext);
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <nav className={`navbar-new ${isScrolled ? 'scrolled' : ''}`}>
      <div className="nav-container">
        
        {/* Left Side */}
        <div className="nav-left">
          <div className="brand" onClick={() => { setView("home"); setSearch(""); }}>
            <FaFilm /> FILMBOX
          </div>
          <ul className="nav-links">
            <li onClick={() => { setView("home"); setSearch(""); }}>Home</li>
            <li onClick={() => { setView("wishlist"); setSearch(""); }}>My List</li>
          </ul>
        </div>

        {/* Right Side */}
        <div className="nav-right">
          <div className={`search-wrapper ${search.length > 0 ? 'active' : ''}`}>
            <FaSearch className="search-icon"/>
            <input 
              type="text" 
              placeholder="Titles, people, genres" 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
            />
          </div>

          <div 
            className="profile-menu" 
            onMouseEnter={() => setShowDropdown(true)} 
            onMouseLeave={() => setShowDropdown(false)}
          >
            <div className="profile-trigger">
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/0/0b/Netflix-avatar.png" 
                alt="User" 
                className="user-avatar" 
              />
              <FaChevronDown className={`arrow ${showDropdown ? 'rotate' : ''}`} />
            </div>

            {showDropdown && (
              <div className="dropdown-menu">
                <div className="dropdown-arrow"></div>
                <div className="dropdown-item user-info">
                  Hello, {user.name}
                </div>
                <div className="dropdown-divider"></div>
                <div className="dropdown-item" onClick={() => setView("wishlist")}>
                   My List
                </div>
                <div className="dropdown-item logout-btn" onClick={logout}>
                  <FaSignOutAlt /> Sign out
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

// --- 6. HELPER COMPONENTS ---
function WishlistPage({ onSelect }) {
  const { user, setUser } = useContext(AuthContext);
  const list = user.myList || [];

  const removeItem = (id, e) => {
    e.stopPropagation();
    const updated = list.filter(m => m["#IMDB_ID"] !== id);
    AuthService.saveUserList(user.email, updated);
    setUser({...user, myList: updated});
  };

  return (
    <div className="wishlist-section">
      <h2 className="section-heading">My Wishlist ({list.length})</h2>
      {list.length === 0 ? (
        <p className="empty-msg">Your list is empty. Add some movies!</p>
      ) : (
        <div className="search-grid">
          {list.map((m) => (
            <div key={m["#IMDB_ID"]} className="m-card-container">
              <MovieCard movie={m} onSelect={() => onSelect(m)} />
              <button className="remove-btn" onClick={(e) => removeItem(m["#IMDB_ID"], e)}><FaTrash /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MovieDetails({ movie, onClose }) {
  const { user, setUser } = useContext(AuthContext);

  const watchTrailer = () => {
    const query = encodeURIComponent(`${movie["#AKA"]} ${movie["#YEAR"]} official trailer`);
    window.open(`https://www.youtube.com/results?search_query=${query}`, '_blank');
  };

  const toggleMyList = () => {
    let list = [...(user.myList || [])];
    const exists = list.find(m => m["#IMDB_ID"] === movie["#IMDB_ID"]);
    if (exists) list = list.filter(m => m["#IMDB_ID"] !== movie["#IMDB_ID"]);
    else list.push(movie);
    
    AuthService.saveUserList(user.email, list);
    setUser({...user, myList: list});
  };

  const isSaved = user.myList?.find(m => m["#IMDB_ID"] === movie["#IMDB_ID"]);

  return (
    <motion.div className="details-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div className="details-window" initial={{ y: 50 }} animate={{ y: 0 }} onClick={e => e.stopPropagation()}>
        <button className="close-details" onClick={onClose}><FaTimes /></button>
        <div className="details-hero">
          <img src={movie["#IMG_POSTER"]} alt="poster" className="details-bg" />
          <div className="details-hero-overlay">
            <h1>{movie["#AKA"]}</h1>
            <div className="details-actions">
              <button className="play-btn-large" onClick={watchTrailer}><FaPlay /> Play Trailer</button>
              <button className={`circ-action yt-btn`} onClick={watchTrailer}><FaYoutube /></button>
              <button className={`circ-action ${isSaved ? 'active-list' : ''}`} onClick={toggleMyList}><FaPlus /></button>
            </div>
          </div>
        </div>
        <div className="details-body">
          <p>{movie["#AKA"]} ({movie["#YEAR"]}) - Rank: {movie["#RANK"]}</p>
          <p className="actors">Starring: {movie["#ACTORS"]}</p>
        </div>
      </motion.div>
    </motion.div>
  );
}

function HomeView({ onSelect }) {
  const [activeGenre, setActiveGenre] = useState("All");
  const genres = ["All", "Action", "Comedy", "Drama", "Horror", "Sci-Fi", "Romance", "Thriller"];

  return (
    <>
      <HeroSlider query="Avatar" onSelect={onSelect} />
      <div className="category-bar">
        {genres.map(genre => (
          <button 
            key={genre} 
            className={`category-pill ${activeGenre === genre ? 'active' : ''}`}
            onClick={() => setActiveGenre(genre)}
          >
            {genre}
          </button>
        ))}
      </div>
      {activeGenre === "All" ? (
        <div className="content-rows">
          <RankingCarousel query="Top" onSelect={onSelect} />
          <MovieCarousel title="Action Hits" query="Action" onSelect={onSelect} />
          <MovieCarousel title="Sci-Fi Zone" query="Sci-Fi" onSelect={onSelect} />
          <MovieCarousel title="Comedy Picks" query="Comedy" onSelect={onSelect} />
        </div>
      ) : (
        <div className="genre-results-section">
          <h2 className="section-heading">{activeGenre} Movies</h2>
          <GenreGrid query={activeGenre} onSelect={onSelect} />
        </div>
      )}
    </>
  );
}

function GenreGrid({ query, onSelect }) {
  const [movies, setMovies] = useState([]);
  useEffect(() => {
    fetch(API_URL + query).then(r => r.json()).then(d => setMovies(d.description || []));
  }, [query]);
  return (
    <div className="search-grid">
       {movies.length > 0 ? (
          movies.map((m, i) => <MovieCard key={i} movie={m} onSelect={() => onSelect(m)} />)
       ) : <div className="skeleton-grid">Loading...</div>}
    </div>
  );
}

function HeroSlider({ query, onSelect }) {
  const [movie, setMovie] = useState(null);
  useEffect(() => {
    fetch(API_URL + query).then(r => r.json()).then(d => setMovie(d.description?.[0]));
  }, [query]);
  if (!movie) return <div className="skeleton hero-skeleton" />;
  return (
    <div className="hero-wrap">
      <img src={movie["#IMG_POSTER"]} className="hero-image" alt="" />
      <div className="hero-overlay">
        <div className="hero-text">
          <h1>{movie["#AKA"]}</h1>
          <div className="hero-btns">
            <button className="play-btn" onClick={() => window.open(`https://www.youtube.com/results?search_query=${movie["#AKA"]} trailer`, '_blank')}>
              <FaPlay /> Trailer
            </button>
            <button className="list-btn" onClick={() => onSelect(movie)}>More Info</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MovieCarousel({ title, query, onSelect }) {
  const [movies, setMovies] = useState([]);
  useEffect(() => {
    fetch(API_URL + query).then(r => r.json()).then(d => setMovies(d.description || []));
  }, [query]);
  return (
    <div className="carousel-row">
      <h3 className="row-title">{title}</h3>
      <div className="carousel-track">
        {movies.map((m, i) => <MovieCard key={i} movie={m} onSelect={() => onSelect(m)} />)}
      </div>
    </div>
  );
}

function RankingCarousel({ query, onSelect }) {
  const [movies, setMovies] = useState([]);
  useEffect(() => {
    fetch(API_URL + query).then(r => r.json()).then(d => setMovies(d.description?.slice(0, 10) || []));
  }, [query]);
  return (
    <div className="carousel-row">
      <h3 className="row-title">Top 10 Today</h3>
      <div className="carousel-track">
        {movies.map((m, i) => (
          <div key={i} className="ranking-card-wrapper" onClick={() => onSelect(m)}>
            <div className="ranking-number">{i + 1}</div>
            <div className="m-card"><img src={m["#IMG_POSTER"]} alt="" /></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MovieCard({ movie, onSelect }) {
  return (
    <div className="m-card" onClick={onSelect}>
      <img src={movie["#IMG_POSTER"]} alt="" loading="lazy" />
      <div className="m-info">
        <h4>{movie["#AKA"]}</h4>
        <p>{movie["#YEAR"]}</p>
      </div>
    </div>
  );
}

function SearchResults({ search, onSelect }) {
  const [movies, setMovies] = useState([]);
  useEffect(() => {
    fetch(API_URL + search).then(r => r.json()).then(d => setMovies(d.description || []));
  }, [search]);
  return (
    <div className="search-section">
      <h2 className="section-heading">Results for "{search}"</h2>
      <div className="search-grid">
        {movies.map((m, i) => <MovieCard key={i} movie={m} onSelect={() => onSelect(m)} />)}
      </div>
    </div>
  );
}

function ScrollToTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    window.addEventListener('scroll', () => setShow(window.scrollY > 400));
  }, []);
  return show ? <div className="scroll-top show" onClick={() => window.scrollTo({top:0, behavior:'smooth'})}><FaArrowUp /></div> : null;
}

function Footer() {
  return (
    <footer className="footer-new">
      <div className="f-logo"><FaFilm /> FILMBOX</div>
      <div className="f-social"><FaFacebook /><FaTwitter /><FaInstagram /><FaYoutube /></div>
      <p>&copy; 2026 FilmBox Inc.</p>
    </footer>
  );
}