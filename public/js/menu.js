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
      
      // Update equipment previews with user's current items
      this.updateEquipmentPreviews();
      
      // Create logout button if it doesn't exist
      if (!document.getElementById('logoutBtn')) {
        const logoutBtn = document.createElement('button');
        logoutBtn.id = 'logoutBtn';
        logoutBtn.className = 'menu-btn secondary';
        logoutBtn.textContent = '🚪 LOGOUT';
        logoutBtn.addEventListener('click', () => this.logout());
        document.querySelector('.menu-buttons').appendChild(logoutBtn);
      }
    } else {
      // Hide player stats
      document.getElementById('playerStats').style.display = 'none';
      
      // Show login/register buttons
      document.getElementById('loginBtn').style.display = 'block';
      document.getElementById('registerBtn').style.display = 'block';
      
      // Reset equipment previews to defaults
      this.resetEquipmentPreviews();
      
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

  /**
   * Update equipment preview areas with user's current items
   */
  updateEquipmentPreviews() {
    if (!this.user) return;

    // Update skin preview
    const currentSkinName = document.getElementById('currentSkinName');
    const characterBody = document.getElementById('characterBody');
    
    if (currentSkinName) {
      currentSkinName.textContent = this.user.equipped_skin || 'Default';
    }
    
    if (characterBody) {
      // Apply skin-specific styling
      const skinClass = `skin-${(this.user.equipped_skin || 'default').toLowerCase().replace(/\s+/g, '-')}`;
      characterBody.className = `character-body ${skinClass}`;
      
      // Set background color based on skin
      const skinColors = {
        'ninja': '#2c3e50',
        'warrior': '#e74c3c', 
        'ghost': '#95a5a6',
        'fire-lord': '#f39c12',
        'ice-king': '#3498db',
        'dragon-slayer': '#9b59b6',
        'golden-emperor': '#f1c40f',
        'default': '#667eea'
      };
      
      const skinKey = (this.user.equipped_skin || 'default').toLowerCase().replace(/\s+/g, '-');
      const skinColor = skinColors[skinKey] || skinColors.default;
      characterBody.style.background = `linear-gradient(135deg, ${skinColor} 0%, ${skinColor}80 100%)`;
    }

    // Update weapon preview
    const currentWeaponName = document.getElementById('currentWeaponName');
    const weaponIcon = document.getElementById('weaponIcon');
    const weaponDamage = document.getElementById('weaponDamage');
    const weaponRate = document.getElementById('weaponRate');
    
    const equippedWeapon = this.user.equipped_gun || 'pistol';
    
    if (currentWeaponName) {
      currentWeaponName.textContent = equippedWeapon.charAt(0).toUpperCase() + equippedWeapon.slice(1);
    }
    
    if (weaponIcon) {
      // Apply weapon-specific class for icon
      const weaponClass = `weapon-${equippedWeapon.toLowerCase().replace(/\s+/g, '-')}`;
      weaponIcon.className = `weapon-icon ${weaponClass}`;
    }
    
    // Update weapon stats based on equipped weapon
    const weaponStats = {
      'pistol': { damage: 25, rate: '⭐⭐⭐' },
      'smg': { damage: 20, rate: '⭐⭐⭐⭐' },
      'shotgun': { damage: 60, rate: '⭐⭐☆' },
      'assault rifle': { damage: 35, rate: '⭐⭐⭐' },
      'sniper rifle': { damage: 80, rate: '⭐⭐☆' },
      'rocket launcher': { damage: 100, rate: '⭐☆☆' },
      'plasma cannon': { damage: 75, rate: '⭐⭐☆' },
      'lightning gun': { damage: 90, rate: '⭐⭐☆' }
    };
    
    const stats = weaponStats[equippedWeapon.toLowerCase()] || weaponStats.pistol;
    
    if (weaponDamage) weaponDamage.textContent = stats.damage;
    if (weaponRate) weaponRate.textContent = stats.rate;
  }

  /**
   * Reset equipment previews to default state
   */
  resetEquipmentPreviews() {
    const currentSkinName = document.getElementById('currentSkinName');
    const characterBody = document.getElementById('characterBody');
    const currentWeaponName = document.getElementById('currentWeaponName');
    const weaponIcon = document.getElementById('weaponIcon');
    const weaponDamage = document.getElementById('weaponDamage');
    const weaponRate = document.getElementById('weaponRate');
    
    if (currentSkinName) currentSkinName.textContent = 'Default';
    if (characterBody) {
      characterBody.className = 'character-body skin-default';
      characterBody.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    }
    if (currentWeaponName) currentWeaponName.textContent = 'Pistol';
    if (weaponIcon) weaponIcon.className = 'weapon-icon weapon-pistol';
    if (weaponDamage) weaponDamage.textContent = '25';
    if (weaponRate) weaponRate.textContent = '⭐⭐⭐';
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