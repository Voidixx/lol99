// Authentication Manager
class AuthManager {
  constructor() {
    this.initializeEventListeners();
  }

  initializeEventListeners() {
    // Login form
    document.getElementById('loginForm').addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleLogin();
    });

    // Register form  
    document.getElementById('registerForm').addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleRegister();
    });
  }

  async handleLogin() {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    const errorEl = document.getElementById('loginError');

    // Clear previous errors
    errorEl.textContent = '';

    if (!username || !password) {
      errorEl.textContent = 'Please fill in all fields';
      return;
    }

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (response.ok) {
        // Login successful
        menuManager.setUser(data.user, data.token);
        menuManager.showScreen('mainMenu');
        menuManager.showMessage('Login successful! Welcome back!', 'success');
        
        // Clear form
        document.getElementById('loginForm').reset();
      } else {
        errorEl.textContent = data.error || 'Login failed';
      }
    } catch (error) {
      console.error('Login error:', error);
      errorEl.textContent = 'Network error. Please try again.';
    }
  }

  async handleRegister() {
    const username = document.getElementById('registerUsername').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const errorEl = document.getElementById('registerError');

    // Clear previous errors
    errorEl.textContent = '';

    // Validation
    if (!username || !email || !password) {
      errorEl.textContent = 'Please fill in all fields';
      return;
    }

    if (username.length < 3) {
      errorEl.textContent = 'Username must be at least 3 characters long';
      return;
    }

    if (!this.isValidEmail(email)) {
      errorEl.textContent = 'Please enter a valid email address';
      return;
    }

    if (password.length < 6) {
      errorEl.textContent = 'Password must be at least 6 characters long';
      return;
    }

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, email, password })
      });

      const data = await response.json();

      if (response.ok) {
        // Registration successful
        menuManager.setUser(data.user, data.token);
        menuManager.showScreen('mainMenu');
        menuManager.showMessage('Registration successful! Welcome to Gunbattle.io!', 'success');
        
        // Clear form
        document.getElementById('registerForm').reset();
      } else {
        errorEl.textContent = data.error || 'Registration failed';
      }
    } catch (error) {
      console.error('Registration error:', error);
      errorEl.textContent = 'Network error. Please try again.';
    }
  }

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

// Initialize auth manager when DOM is loaded
let authManager;
document.addEventListener('DOMContentLoaded', () => {
  authManager = new AuthManager();
});