// Shop Manager - Complete Implementation
class ShopManager {
  constructor() {
    this.items = [];
    this.currentTab = 'skins';
    this.timeLeft = 0;
    this.timerInterval = null;
    
    this.initializeEventListeners();
  }

  /**
   * Initialize event listeners for shop tabs and interactions
   */
  initializeEventListeners() {
    // Shop tab switching
    document.querySelectorAll('.shop-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        const tabName = e.target.dataset.tab;
        this.switchTab(tabName);
      });
    });

    // Close shop button
    const closeBtn = document.getElementById('closeShop');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.cleanup();
      });
    }
  }

  /**
   * Switch between shop tabs (skins/guns)
   */
  switchTab(tabName) {
    if (!['skins', 'guns'].includes(tabName)) {
      console.error('Invalid tab name:', tabName);
      return;
    }

    this.currentTab = tabName;
    
    // Update tab appearance
    document.querySelectorAll('.shop-tab').forEach(tab => {
      tab.classList.remove('active');
    });
    
    const activeTab = document.querySelector(`[data-tab="${tabName}"]`);
    if (activeTab) {
      activeTab.classList.add('active');
    }
    
    // Re-render items for current tab
    this.renderItems();
  }

  /**
   * Load shop data from the backend API
   */
  async loadShop() {
    if (!menuManager || !menuManager.token) {
      if (menuManager) {
        menuManager.showMessage('Please login to access the shop', 'error');
      }
      return;
    }

    try {
      const response = await fetch('/api/shop', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${menuManager.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      this.items = data.items || [];
      this.timeLeft = data.timeLeft || 0;
      
      // Update UI
      this.renderItems();
      this.updateCoinDisplay();
      this.startTimer();
      
      console.log('Shop loaded successfully:', {
        itemCount: this.items.length,
        timeLeft: this.timeLeft
      });

    } catch (error) {
      console.error('Shop load error:', error);
      if (menuManager) {
        menuManager.showMessage('Failed to load shop. Please try again.', 'error');
      }
    }
  }

  /**
   * Render shop items in the current tab
   */
  renderItems() {
    const container = document.getElementById('shopItems');
    if (!container) {
      console.error('Shop items container not found');
      return;
    }

    container.innerHTML = '';

    // Filter items by current tab
    const filteredItems = this.items.filter(item => item.type === this.currentTab);

    if (filteredItems.length === 0) {
      container.innerHTML = `
        <div class="no-items-message" style="
          text-align: center; 
          color: #bdc3c7; 
          font-size: 1.2rem; 
          grid-column: 1 / -1;
          padding: 2rem;
        ">
          No ${this.currentTab} available in this rotation
        </div>
      `;
      return;
    }

    // Create and append item elements
    filteredItems.forEach(item => {
      const itemElement = this.createItemElement(item);
      container.appendChild(itemElement);
    });
  }

  /**
   * Create a single shop item element
   */
  createItemElement(item) {
    if (!item || !item.id) {
      console.error('Invalid item data:', item);
      return document.createElement('div');
    }

    const itemEl = document.createElement('div');
    itemEl.className = `shop-item rarity-${item.rarity || 'common'}`;
    itemEl.dataset.itemId = item.id;

    // Check if user owns this item
    const userItems = this.getUserOwnedItems(item.type);
    const isOwned = userItems.includes(item.name);

    if (isOwned) {
      itemEl.classList.add('owned');
    }

    // Create preview styling
    const previewColor = item.color || this.getDefaultColor(item.rarity);
    const previewIcon = item.type === 'skin' ? '👤' : '🔫';

    itemEl.innerHTML = `
      <div class="item-preview" style="background-color: ${previewColor}">
        <span class="item-icon">${previewIcon}</span>
      </div>
      <div class="item-info">
        <div class="item-name">${this.escapeHtml(item.name)}</div>
        <div class="item-description">${this.escapeHtml(item.description || 'No description available')}</div>
        <div class="item-price">
          <span class="coins-icon">🪙</span>
          <span class="price-value">${item.price}</span>
        </div>
        <div class="item-status">
          ${isOwned ? '<span class="owned-label">OWNED</span>' : '<span class="purchase-label">CLICK TO BUY</span>'}
        </div>
      </div>
    `;

    // Add purchase handler if not owned
    if (!isOwned) {
      itemEl.addEventListener('click', () => this.purchaseItem(item));
      itemEl.style.cursor = 'pointer';
    } else {
      itemEl.style.cursor = 'default';
    }

    return itemEl;
  }

  /**
   * Get user's owned items for a specific type
   */
  getUserOwnedItems(itemType) {
    if (!menuManager || !menuManager.user) {
      return [];
    }

    const propName = itemType === 'skin' ? 'owned_skins' : 'owned_guns';
    return menuManager.user[propName] || [];
  }

  /**
   * Get default color for rarity levels
   */
  getDefaultColor(rarity) {
    const colors = {
      common: '#95a5a6',
      rare: '#3498db', 
      epic: '#9b59b6',
      legendary: '#f1c40f'
    };
    return colors[rarity] || colors.common;
  }

  /**
   * Purchase an item from the shop
   */
  async purchaseItem(item) {
    if (!menuManager || !menuManager.user) {
      if (menuManager) {
        menuManager.showMessage('Please login to make purchases', 'error');
      }
      return;
    }

    // Check if user has sufficient coins
    if (menuManager.user.coins < item.price) {
      menuManager.showMessage('Insufficient coins! You need more coins to buy this item.', 'error');
      return;
    }

    // Check if already owned (double-check)
    const userItems = this.getUserOwnedItems(item.type);
    if (userItems.includes(item.name)) {
      menuManager.showMessage('You already own this item!', 'error');
      return;
    }

    try {
      const response = await fetch(`/api/shop/purchase/${item.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${menuManager.token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok && data) {
        // Update user data with new coin balance and owned items
        const updateData = {
          coins: data.coinsLeft
        };
        
        const ownedItemsKey = item.type === 'skin' ? 'owned_skins' : 'owned_guns';
        updateData[ownedItemsKey] = data.ownedItems;

        menuManager.updateUserData(updateData);

        // Update displays
        this.updateCoinDisplay();
        this.renderItems();

        // Show success message
        menuManager.showMessage(`${item.name} purchased successfully!`, 'success');

      } else {
        // Handle purchase failure
        const errorMessage = data?.error || 'Purchase failed. Please try again.';
        menuManager.showMessage(errorMessage, 'error');
      }

    } catch (error) {
      console.error('Purchase error:', error);
      menuManager.showMessage('Network error during purchase. Please try again.', 'error');
    }
  }

  /**
   * Update coin display in the shop
   */
  updateCoinDisplay() {
    const coinDisplay = document.getElementById('shopCoinsDisplay');
    if (coinDisplay && menuManager && menuManager.user) {
      coinDisplay.textContent = menuManager.user.coins || 0;
    }
  }

  /**
   * Start the shop rotation timer
   */
  startTimer() {
    // Clear any existing timer
    this.clearTimer();

    if (this.timeLeft <= 0) {
      return;
    }

    // Update display immediately
    this.updateTimerDisplay();

    // Start interval for updates
    this.timerInterval = setInterval(() => {
      this.timeLeft--;
      
      if (this.timeLeft <= 0) {
        console.log('Shop rotation expired, reloading...');
        this.clearTimer();
        // Reload shop when timer expires
        this.loadShop();
      } else {
        this.updateTimerDisplay();
      }
    }, 1000);

    console.log('Shop timer started:', this.timeLeft, 'seconds remaining');
  }

  /**
   * Update the timer display
   */
  updateTimerDisplay() {
    const timerElement = document.getElementById('shopTimer');
    if (!timerElement) return;

    if (this.timeLeft <= 0) {
      timerElement.textContent = '00:00:00';
      return;
    }

    const hours = Math.floor(this.timeLeft / 3600);
    const minutes = Math.floor((this.timeLeft % 3600) / 60);
    const seconds = this.timeLeft % 60;

    const timeString = [
      hours.toString().padStart(2, '0'),
      minutes.toString().padStart(2, '0'),
      seconds.toString().padStart(2, '0')
    ].join(':');

    timerElement.textContent = timeString;
  }

  /**
   * Clear the timer interval
   */
  clearTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  /**
   * Clean up resources when shop is closed
   */
  cleanup() {
    this.clearTimer();
    console.log('Shop cleaned up');
  }

  /**
   * Utility function to escape HTML
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Refresh shop data (can be called externally)
   */
  async refresh() {
    console.log('Refreshing shop...');
    await this.loadShop();
  }

  /**
   * Get current shop status
   */
  getStatus() {
    return {
      itemCount: this.items.length,
      currentTab: this.currentTab,
      timeLeft: this.timeLeft,
      timerActive: !!this.timerInterval
    };
  }
}

// Initialize and expose shop manager globally
let shopManager;

document.addEventListener('DOMContentLoaded', () => {
  console.log('Initializing ShopManager...');
  shopManager = new ShopManager();
  
  // Make shopManager globally accessible
  window.shopManager = shopManager;
  
  console.log('ShopManager initialized and available globally');
});

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ShopManager;
}