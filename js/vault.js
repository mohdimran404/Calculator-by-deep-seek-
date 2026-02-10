// ============================================
// CALCULATOR VAULT - SECRET VAULT SYSTEM
// Handles PIN entry, lockout delays, and vault access
// ============================================

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // ====================
    // 1. VAULT STATE & CONFIG
    // ====================
    const VAULT_CONFIG = {
        // Default PIN (admin can change via admin panel)
        defaultPIN: '1234',
        
        // Lockout settings
        lockoutDelays: [0, 0, 0, 15, 30, 60, 120], // In seconds
        
        // Storage keys
        storageKeys: {
            pinHash: 'vault_pin_hash',
            wrongAttempts: 'vault_wrong_attempts',
            lockoutUntil: 'vault_lockout_until',
            lastAttemptTime: 'vault_last_attempt'
        },
        
        // Security settings
        maxWrongAttempts: 6,
        pinLength: 4
    };

    // ====================
    // 2. CURRENT VAULT STATE
    // ====================
    let vaultState = {
        enteredPIN: '',
        isLockedOut: false,
        lockoutTimeLeft: 0,
        wrongAttempts: 0,
        lockoutTimer: null
    };

    // ====================
    // 3. DOM ELEMENTS
    // ====================
    // Main sections
    const calculatorSection = document.getElementById('calculatorSection');
    const pinScreen = document.getElementById('pinScreen');
    const vaultSection = document.getElementById('vaultSection');
    
    // PIN screen elements
    const pinDigits = document.querySelectorAll('.pin-digit');
    const pinKeypad = document.querySelector('.pin-keypad');
    const pinStatus = document.getElementById('pinStatus');
    const cancelPinBtn = document.getElementById('cancelPin');
    
    // Vault elements
    const logoutVaultBtn = document.getElementById('logoutVault');
    const vaultTabs = document.querySelectorAll('.vault-tab');
    const vaultTabContents = document.querySelectorAll('.vault-tab-content');
    
    // Secret trigger
    const secretTrigger = document.getElementById('secretTrigger');

    // ====================
    // 4. PIN STORAGE & SECURITY
    // ====================
    function initializePIN() {
        // Check if PIN hash exists in localStorage
        let pinHash = localStorage.getItem(VAULT_CONFIG.storageKeys.pinHash);
        
        if (!pinHash) {
            // First time setup - hash the default PIN
            pinHash = simpleHash(VAULT_CONFIG.defaultPIN);
            localStorage.setItem(VAULT_CONFIG.storageKeys.pinHash, pinHash);
            console.log('Default PIN set: 1234 (Change via admin panel)');
        }
        
        // Load wrong attempts history
        const savedAttempts = localStorage.getItem(VAULT_CONFIG.storageKeys.wrongAttempts);
        vaultState.wrongAttempts = savedAttempts ? parseInt(savedAttempts) : 0;
        
        // Check if locked out
        checkLockoutStatus();
    }

    function simpleHash(pin) {
        // Simple hash function for demo purposes
        // In production, use stronger hashing (like bcrypt)
        let hash = 0;
        for (let i = 0; i < pin.length; i++) {
            const char = pin.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString();
    }

    function verifyPIN(enteredPIN) {
        const storedHash = localStorage.getItem(VAULT_CONFIG.storageKeys.pinHash);
        const enteredHash = simpleHash(enteredPIN);
        return storedHash === enteredHash;
    }

    // ====================
    // 5. LOCKOUT SYSTEM
    // ====================
    function checkLockoutStatus() {
        const lockoutUntil = localStorage.getItem(VAULT_CONFIG.storageKeys.lockoutUntil);
        
        if (lockoutUntil) {
            const now = Date.now();
            const lockTime = parseInt(lockoutUntil);
            
            if (now < lockTime) {
                // Still locked out
                vaultState.isLockedOut = true;
                vaultState.lockoutTimeLeft = Math.ceil((lockTime - now) / 1000);
                startLockoutTimer();
                return true;
            } else {
                // Lockout period has ended
                localStorage.removeItem(VAULT_CONFIG.storageKeys.lockoutUntil);
                vaultState.isLockedOut = false;
                return false;
            }
        }
        
        vaultState.isLockedOut = false;
        return false;
    }

    function handleWrongPIN() {
        // Increment wrong attempts
        vaultState.wrongAttempts++;
        localStorage.setItem(VAULT_CONFIG.storageKeys.wrongAttempts, vaultState.wrongAttempts);
        
        // Determine lockout delay based on attempt count
        const attemptIndex = Math.min(vaultState.wrongAttempts, VAULT_CONFIG.lockoutDelays.length - 1);
        const lockoutSeconds = VAULT_CONFIG.lockoutDelays[attemptIndex];
        
        if (lockoutSeconds > 0) {
            // Calculate lockout end time
            const lockoutEnd = Date.now() + (lockoutSeconds * 1000);
            localStorage.setItem(VAULT_CONFIG.storageKeys.lockoutUntil, lockoutEnd.toString());
            
            // Update state
            vaultState.isLockedOut = true;
            vaultState.lockoutTimeLeft = lockoutSeconds;
            
            // Show lockout message
            showPINMessage(`Too many wrong attempts! Locked for ${lockoutSeconds} seconds.`, 'lockout');
            startLockoutTimer();
        } else {
            // Show error but no lockout yet
            const attemptsLeft = 3 - vaultState.wrongAttempts;
            if (attemptsLeft > 0) {
                showPINMessage(`Wrong PIN! ${attemptsLeft} attempt(s) left before lockout.`, 'error');
            } else {
                showPINMessage('Wrong PIN! Next wrong attempt will trigger lockout.', 'error');
            }
        }
    }

    function handleCorrectPIN() {
        // Reset wrong attempts on successful entry
        vaultState.wrongAttempts = 0;
        vaultState.isLockedOut = false;
        localStorage.removeItem(VAULT_CONFIG.storageKeys.wrongAttempts);
        localStorage.removeItem(VAULT_CONFIG.storageKeys.lockoutUntil);
        
        if (vaultState.lockoutTimer) {
            clearInterval(vaultState.lockoutTimer);
            vaultState.lockoutTimer = null;
        }
        
        // Show success message
        showPINMessage('Access granted!', 'success');
        
        // Transition to vault after delay
        setTimeout(() => {
            hidePINScreen();
            showVault();
        }, 500);
    }

    function startLockoutTimer() {
        if (vaultState.lockoutTimer) {
            clearInterval(vaultState.lockoutTimer);
        }
        
        vaultState.lockoutTimer = setInterval(() => {
            vaultState.lockoutTimeLeft--;
            
            if (vaultState.lockoutTimeLeft <= 0) {
                // Lockout period over
                clearInterval(vaultState.lockoutTimer);
                vaultState.lockoutTimer = null;
                vaultState.isLockedOut = false;
                localStorage.removeItem(VAULT_CONFIG.storageKeys.lockoutUntil);
                
                showPINMessage('Lockout over. You may try again.', '');
                updatePINDisplay(); // Reset display
            } else {
                // Update countdown message
                showPINMessage(`Locked for ${vaultState.lockoutTimeLeft} more seconds...`, 'lockout');
            }
        }, 1000);
    }

    // ====================
    // 6. PIN ENTRY & DISPLAY
    // ====================
    function updatePINDisplay() {
        // Update the visual dots
        pinDigits.forEach((digit, index) => {
            if (index < vaultState.enteredPIN.length) {
                digit.textContent = '•';
                digit.classList.add('filled');
            } else {
                digit.textContent = '•';
                digit.classList.remove('filled');
                digit.classList.remove('error');
                digit.classList.remove('success');
            }
        });
        
        // Clear any status messages if PIN is empty
        if (vaultState.enteredPIN.length === 0) {
            pinStatus.textContent = '';
            pinStatus.className = 'pin-status';
        }
    }

    function addDigitToPIN(digit) {
        if (vaultState.isLockedOut) {
            showPINMessage(`Still locked for ${vaultState.lockoutTimeLeft} seconds...`, 'lockout');
            return;
        }
        
        if (vaultState.enteredPIN.length < VAULT_CONFIG.pinLength) {
            vaultState.enteredPIN += digit;
            updatePINDisplay();
            
            // Auto-validate when 4 digits are entered
            if (vaultState.enteredPIN.length === VAULT_CONFIG.pinLength) {
                validatePIN();
            }
        }
    }

    function clearPIN() {
        vaultState.enteredPIN = '';
        updatePINDisplay();
    }

    function backspacePIN() {
        if (vaultState.enteredPIN.length > 0) {
            vaultState.enteredPIN = vaultState.enteredPIN.slice(0, -1);
            updatePINDisplay();
        }
    }

    function validatePIN() {
        if (vaultState.enteredPIN.length !== VAULT_CONFIG.pinLength) {
            return;
        }
        
        // Check if we're locked out
        if (checkLockoutStatus()) {
            showPINMessage(`Account locked! Wait ${vaultState.lockoutTimeLeft} seconds.`, 'lockout');
            clearPIN();
            return;
        }
        
        // Verify the PIN
        if (verifyPIN(vaultState.enteredPIN)) {
            // Correct PIN - add visual feedback
            pinDigits.forEach(digit => {
                digit.classList.add('success');
                digit.classList.remove('error');
            });
            
            handleCorrectPIN();
        } else {
            // Wrong PIN - add visual feedback
            pinDigits.forEach(digit => {
                digit.classList.add('error');
                digit.classList.remove('success');
            });
            
            handleWrongPIN();
            
            // Clear PIN after wrong attempt
            setTimeout(() => {
                clearPIN();
            }, 1000);
        }
    }

    // ====================
    // 7. SCREEN TRANSITIONS
    // ====================
    function showPINScreen() {
        // Check lockout status first
        if (checkLockoutStatus()) {
            showPINMessage(`Account locked! Wait ${vaultState.lockoutTimeLeft} seconds.`, 'lockout');
        } else {
            showPINMessage('Enter 4-digit PIN to access vault', '');
        }
        
        calculatorSection.style.display = 'none';
        pinScreen.style.display = 'flex';
        vaultSection.style.display = 'none';
        
        // Reset PIN on show
        clearPIN();
    }

    function hidePINScreen() {
        pinScreen.style.display = 'none';
        clearPIN();
    }

    function showVault() {
        calculatorSection.style.display = 'none';
        pinScreen.style.display = 'none';
        vaultSection.style.display = 'block';
        
        // Reset to first tab
        switchVaultTab('photos');
    }

    function showCalculator() {
        calculatorSection.style.display = 'block';
        pinScreen.style.display = 'none';
        vaultSection.style.display = 'none';
        clearPIN();
    }

    // ====================
    // 8. VAULT TAB SYSTEM
    // ====================
    function switchVaultTab(tabName) {
        // Update tab buttons
        vaultTabs.forEach(tab => {
            if (tab.dataset.tab === tabName) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });
        
        // Show corresponding content
        vaultTabContents.forEach(content => {
            if (content.id === `${tabName}Tab`) {
                content.classList.add('active');
            } else {
                content.classList.remove('active');
            }
        });
    }

    // ====================
    // 9. MESSAGE DISPLAY
    // ====================
    function showPINMessage(message, type = '') {
        pinStatus.textContent = message;
        pinStatus.className = 'pin-status';
        
        if (type) {
            pinStatus.classList.add(type);
        }
    }

    // ====================
    // 10. EVENT LISTENERS
    // ====================
    function setupEventListeners() {
        // Double-tap on secret trigger
        let lastTap = 0;
        secretTrigger.addEventListener('touchend', function(e) {
            const currentTime = new Date().getTime();
            const tapLength = currentTime - lastTap;
            
            if (tapLength < 500 && tapLength > 0) {
                // Double-tap detected
                e.preventDefault();
                showPINScreen();
            }
            
            lastTap = currentTime;
        });
        
        // Click on secret trigger (for desktop)
        secretTrigger.addEventListener('dblclick', function() {
            showPINScreen();
        });

        // PIN keypad buttons
        pinKeypad.addEventListener('click', function(e) {
            const button = e.target.closest('.pin-btn');
            if (!button) return;
            
            const digit = button.getAttribute('data-pin');
            const action = button.getAttribute('data-action');
            
            if (digit !== null) {
                addDigitToPIN(digit);
            } else if (action === 'clear') {
                clearPIN();
            } else if (action === 'backspace') {
                backspacePIN();
            }
        });

        // Cancel PIN button
        cancelPinBtn.addEventListener('click', showCalculator);

        // Logout from vault
        logoutVaultBtn.addEventListener('click', showCalculator);

        // Vault tabs
        vaultTabs.forEach(tab => {
            tab.addEventListener('click', function() {
                const tabName = this.dataset.tab;
                switchVaultTab(tabName);
            });
        });

        // Keyboard input for PIN (for accessibility)
        document.addEventListener('keydown', function(e) {
            // Only process if PIN screen is visible
            if (pinScreen.style.display !== 'flex') return;
            
            const key = e.key;
            
            // Number keys 0-9
            if (key >= '0' && key <= '9') {
                addDigitToPIN(key);
            }
            // Backspace
            else if (key === 'Backspace') {
                backspacePIN();
            }
            // Enter to submit
            else if (key === 'Enter' && vaultState.enteredPIN.length === VAULT_CONFIG.pinLength) {
                validatePIN();
            }
            // Escape to cancel
            else if (key === 'Escape') {
                showCalculator();
            }
        });
    }

    // ====================
    // 11. INITIALIZATION
    // ====================
    function initializeVault() {
        console.log('Initializing vault system...');
        
        // Setup PIN storage
        initializePIN();
        
        // Setup event listeners
        setupEventListeners();
        
        // Start with calculator visible
        showCalculator();
        
        console.log('Vault system ready');
        console.log('Secret: Double-tap the bottom text to access vault');
        console.log('Default PIN: 1234 (change via admin panel)');
    }

    // Start the vault system
    initializeVault();
});

// ====================
// 12. SECURITY NOTES
// ====================
// IMPORTANT SECURITY DISCLAIMER:
// This is a FRONT-END only security system with limitations:
// 1. PIN is stored in localStorage (not secure for production)
// 2. Hashing is basic (use bcrypt in production)
// 3. Users can clear localStorage to reset attempts
// 4. Advanced users can inspect code to find PIN
//
// For real security:
// - Use backend server for PIN validation
// - Implement proper rate limiting
// - Use HTTPS only
// - Consider two-factor authentication
//
// This system is designed to:
// - Prevent casual access
// - Deter brute force attempts with delays
// - Provide basic screenshot protection
// - Not protect against determined attackers

// ====================
// 13. ADMIN NOTES
// ====================
// Default PIN: 1234
// Change PIN via admin panel (admin-panel.html)
// Admin panel is NOT linked from main site for security
// Access via direct URL: admin-panel.html
