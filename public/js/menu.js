// Menu and Screen Management
class MenuManager {
  constructor() {
    this.currentScreen = 'mainMenu';
    this.user = null;
    this.token = localStorage.getItem('gunbattle_token');
    
    this.initializeEventListeners();
    this.checkAuthStatus();
  }

  initializeEventListeners() {
    // Main menu buttons
    document.getElementById('playBtn').addEventListener('click', () => this.handlePlay());
    document.getElementById('shopBtn').addEventListener('click', () => this.showScreen('shopScreen'));
    document.getElementById('loginBtn').addEventListener('click', () => this.showScreen('loginScreen'));
    document.getElementById('registerBtn').addEventListener('click', () => this.showScreen('registerScreen'));

    // Back buttons
    document.getElementById('backToMenuFromLogin').addEventListener('click', () => this.showScreen('mainMenu'));
    document.getElementById('backToMenuFromRegister').addEventListener('click', () => this.showScreen('mainMenu'));
    document.getElementById('closeShop').addEventListener('click', () => this.showScreen('mainMenu'));
    document.getElementById('backToMenu').addEventListener('click', () => this.showScreen('mainMenu'));
  }

  showScreen(screenId) {
    // Hide all screens
    const screens = document.querySelectorAll('.screen');
    screens.forEach(screen => screen.classList.remove('active'));

    // Show target screen
    document.getElementById(screenId).classList.add('active');
    this.currentScreen = screenId;

    // Handle specific screen logic
    if (screenId === 'shopScreen' && this.user) {
      window.shopManager.loadShop();
    } else if (screenId === 'gameScreen') {
      this.startGame();
    }
  }

  handlePlay() {
    if (this.user) {
      this.showScreen('gameScreen');
    } else {
      this.showScreen('loginScreen');
      this.showMessage('Please login to play!', 'info');
    }
  }

  startGame() {
    // Initialize canvas and start the game
    const canvas = document.getElementById('canvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Update game UI with user info
    if (this.user) {
      document.getElementById('gameUsernameDisplay').textContent = this.user.username;
      document.getElementById('gameCoinsDisplay').textContent = this.user.coins;
    }

    // Start the game animation loop
    if (typeof animate === 'function') {
      animate();
    }
  }

  async checkAuthStatus() {
    if (this.token) {
      try {
        const response = await fetch('/api/profile', {
          headers: {
            'Authorization': `Bearer ${this.token}`
          }
        });

        if (response.ok) {
          this.user = await response.json();
          this.updateUserInterface();
        } else {
          localStorage.removeItem('gunbattle_token');
          this.token = null;
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('gunbattle_token');
        this.token = null;
      }
    }
  }

  updateUserInterface() {
    if (this.user) {
      // Show player stats
      document.getElementById('playerStats').style.display = 'flex';
      document.getElementById('usernameDisplay').textContent = this.user.username;
      document.getElementById('coinsDisplay').textContent = this.user.coins;

      // Update buttons
      document.getElementById('loginBtn').style.display = 'none';
      document.getElementById('registerBtn').style.display = 'none';
      
      // Create logout button if it doesn't exist
      if (!document.getElementById('logoutBtn')) {
        const logoutBtn = document.createElement('button');
        logoutBtn.id = 'logoutBtn';
        logoutBtn.className = 'menu-btn secondary';
        logoutBtn.textContent = 'LOGOUT';
        logoutBtn.addEventListener('click', () => this.logout());
        document.querySelector('.menu-buttons').appendChild(logoutBtn);
      }
    } else {
      // Hide player stats
      document.getElementById('playerStats').style.display = 'none';
      
      // Show login/register buttons
      document.getElementById('loginBtn').style.display = 'block';
      document.getElementById('registerBtn').style.display = 'block';
      
      // Remove logout button
      const logoutBtn = document.getElementById('logoutBtn');
      if (logoutBtn) {
        logoutBtn.remove();
      }
    }
  }

  setUser(userData, token) {
    this.user = userData;
    this.token = token;
    localStorage.setItem('gunbattle_token', token);
    this.updateUserInterface();
  }

  logout() {
    this.user = null;
    this.token = null;
    localStorage.removeItem('gunbattle_token');
    this.updateUserInterface();
    this.showScreen('mainMenu');
    this.showMessage('Logged out successfully!', 'info');
  }

  showMessage(message, type = 'info') {
    // Create a temporary message element
    const messageEl = document.createElement('div');
    messageEl.className = `message ${type}`;
    messageEl.textContent = message;
    messageEl.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 15px 25px;
      border-radius: 10px;
      color: white;
      font-weight: bold;
      z-index: 10000;
      animation: slideIn 0.3s ease;
      background: ${type === 'error' ? '#e74c3c' : type === 'success' ? '#27ae60' : '#3498db'};
    `;

    document.body.appendChild(messageEl);

    // Remove after 3 seconds
    setTimeout(() => {
      messageEl.style.animation = 'slideOut 0.3s ease forwards';
      setTimeout(() => messageEl.remove(), 300);
    }, 3000);
  }

  // Update user data (called after purchases, etc.)
  updateUserData(userData) {
    if (this.user) {
      this.user = { ...this.user, ...userData };
      this.updateUserInterface();
      
      // Update all coin displays across the interface
      if (userData.coins !== undefined) {
        document.getElementById('coinsDisplay').textContent = userData.coins;
        document.getElementById('gameCoinsDisplay').textContent = userData.coins;
        const shopCoinsEl = document.getElementById('shopCoinsDisplay');
        if (shopCoinsEl) {
          shopCoinsEl.textContent = userData.coins;
        }
      }
    }
  }
}

// Add CSS animations for messages
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  
  @keyframes slideOut {
    to { transform: translateX(100%); opacity: 0; }
  }
`;
document.head.appendChild(style);

// Initialize menu manager when DOM is loaded
let menuManager;
document.addEventListener('DOMContentLoaded', () => {
  menuManager = new MenuManager();
});