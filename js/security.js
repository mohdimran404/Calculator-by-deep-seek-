// ============================================
// CALCULATOR VAULT - SCREENSHOT PROTECTION
// Front-end techniques to deter screenshot attempts
// IMPORTANT: 100% protection is NOT possible in browsers
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // ====================
    // 1. SECURITY STATE
    // ====================
    let securityState = {
        isVaultVisible: false,
        screenshotAttempts: 0,
        warningVisible: false,
        lastKeyPressTime: 0,
        keySequence: []
    };

    // ====================
    // 2. SECURITY SETTINGS
    // ====================
    const SECURITY_CONFIG = {
        // Enable/disable features
        disableRightClick: true,
        disableTextSelection: true,
        detectScreenshotKeys: true,
        blurOnDetection: true,
        
        // Detection thresholds
        maxScreenshotAttempts: 3,
        keySequenceTimeout: 2000, // ms
        
        // Warning messages
        warningMessages: [
            "⚠️ Screenshot attempt detected!",
            "⚠️ Security warning!",
            "⚠️ Unauthorized capture attempt!"
        ]
    };

    // ====================
    // 3. DOM ELEMENTS FOR SECURITY
    // ====================
    let securityWarning = null;
    let vaultContent = null;

    // ====================
    // 4. DISABLE RIGHT-CLICK
    // ====================
    function disableRightClick() {
        if (!SECURITY_CONFIG.disableRightClick) return;
        
        document.addEventListener('contextmenu', function(e) {
            // Allow right-click on input fields for normal use
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }
            
            // Show warning if vault is visible
            if (securityState.isVaultVisible) {
                showSecurityWarning("Right-click disabled in vault");
                e.preventDefault();
                return false;
            }
        }, false);
        
        console.log('Right-click protection enabled');
    }

    // ====================
    // 5. DISABLE TEXT SELECTION
    // ====================
    function disableTextSelection() {
        if (!SECURITY_CONFIG.disableTextSelection) return;
        
        // Apply unselectable style to body
        document.body.style.userSelect = 'none';
        document.body.style.webkitUserSelect = 'none';
        document.body.style.msUserSelect = 'none';
        document.body.style.mozUserSelect = 'none';
        
        // Allow selection on input fields
        const inputs = document.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            input.style.userSelect = 'text';
            input.style.webkitUserSelect = 'text';
        });
        
        console.log('Text selection protection enabled');
    }

    // ====================
    // 6. SCREENSHOT KEY DETECTION
    // ====================
    function setupScreenshotDetection() {
        if (!SECURITY_CONFIG.detectScreenshotKeys) return;
        
        document.addEventListener('keydown', function(e) {
            // Only detect when vault is visible
            if (!securityState.isVaultVisible) return;
            
            const now = Date.now();
            const key = e.key.toLowerCase();
            
            // Track key sequence for Print Screen combinations
            if (now - securityState.lastKeyPressTime > SECURITY_CONFIG.keySequenceTimeout) {
                securityState.keySequence = [];
            }
            securityState.keySequence.push(key);
            securityState.lastKeyPressTime = now;
            
            // Common screenshot key combinations
            const screenshotCombinations = [
                ['printscreen'], // Print Screen key
                ['alt', 'printscreen'], // Alt + Print Screen
                ['control', 'printscreen'], // Ctrl + Print Screen
                ['meta', 'printscreen'], // Cmd + Print Screen (Mac)
                ['control', 'shift', 's'], // Ctrl+Shift+S (Windows snipping tool)
                ['meta', 'shift', '4'], // Cmd+Shift+4 (Mac screenshot)
                ['meta', 'shift', '3'], // Cmd+Shift+3 (Mac full screen)
                ['control', 'p'], // Ctrl+P (Print dialog)
                ['meta', 'p'] // Cmd+P (Print dialog on Mac)
            ];
            
            // Check if current key sequence matches any screenshot combination
            for (const combo of screenshotCombinations) {
                if (arraysEqual(securityState.keySequence.slice(-combo.length), combo)) {
                    handleScreenshotAttempt();
                    securityState.keySequence = []; // Reset after detection
                    break;
                }
            }
        });
        
        console.log('Screenshot key detection enabled');
    }

    function arraysEqual(arr1, arr2) {
        if (arr1.length !== arr2.length) return false;
        for (let i = 0; i < arr1.length; i++) {
            if (arr1[i] !== arr2[i]) return false;
        }
        return true;
    }

    // ====================
    // 7. BLUR EFFECT ON DETECTION
    // ====================
    function applyBlurEffect() {
        if (!SECURITY_CONFIG.blurOnDetection) return;
        
        // Create blur overlay if it doesn't exist
        if (!vaultContent) {
            vaultContent = document.getElementById('vaultSection');
            if (!vaultContent) return;
        }
        
        // Add blur class
        vaultContent.classList.add('security-blur');
        
        // Remove blur after delay
        setTimeout(() => {
            if (vaultContent) {
                vaultContent.classList.remove('security-blur');
            }
        }, 2000);
    }

    // ====================
    // 8. SECURITY WARNING SYSTEM
    // ====================
    function createSecurityWarning() {
        securityWarning = document.createElement('div');
        securityWarning.className = 'security-warning';
        securityWarning.style.display = 'none';
        document.body.appendChild(securityWarning);
    }

    function showSecurityWarning(message) {
        if (!securityWarning) return;
        
        // Show warning
        securityWarning.textContent = message;
        securityWarning.style.display = 'flex';
        securityState.warningVisible = true;
        
        // Hide after 3 seconds
        setTimeout(() => {
            securityWarning.style.display = 'none';
            securityState.warningVisible = false;
        }, 3000);
        
        securityState.screenshotAttempts++;
        console.log(`Security warning: ${message} (Attempt ${securityState.screenshotAttempts})`);
    }

    // ====================
    // 9. HANDLE SCREENSHOT ATTEMPT
    // ====================
    function handleScreenshotAttempt() {
        // Only trigger if vault is visible
        if (!securityState.isVaultVisible) return;
        
        securityState.screenshotAttempts++;
        
        // Get random warning message
        const randomIndex = Math.floor(Math.random() * SECURITY_CONFIG.warningMessages.length);
        const warningMessage = SECURITY_CONFIG.warningMessages[randomIndex];
        
        // Show warning
        showSecurityWarning(warningMessage);
        
        // Apply blur effect
        if (SECURITY_CONFIG.blurOnDetection) {
            applyBlurEffect();
        }
        
        // If too many attempts, log out user
        if (securityState.screenshotAttempts >= SECURITY_CONFIG.maxScreenshotAttempts) {
            setTimeout(() => {
                alert("Multiple security violations detected. Returning to calculator.");
                window.location.reload(); // Simple logout by reloading
            }, 1000);
        }
    }

    // ====================
    // 10. VISIBILITY DETECTION
    // ====================
    function setupVisibilityDetection() {
        // Watch for vault visibility changes
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                    const vaultSection = document.getElementById('vaultSection');
                    if (vaultSection) {
                        securityState.isVaultVisible = vaultSection.style.display !== 'none';
                    }
                }
            });
        });
        
        // Start observing the vault section
        const vaultSection = document.getElementById('vaultSection');
        if (vaultSection) {
            observer.observe(vaultSection, { attributes: true });
            securityState.isVaultVisible = vaultSection.style.display !== 'none';
        }
    }

    // ====================
    // 11. PAGE VISIBILITY API
    // ====================
    function setupPageVisibility() {
        // Detect when user switches tabs/windows
        document.addEventListener('visibilitychange', function() {
            if (document.hidden && securityState.isVaultVisible) {
                // User switched away from tab - log out for security
                console.log('User switched away from vault - auto logout');
                showSecurityWarning("Session ended due to tab switch");
                
                setTimeout(() => {
                    window.location.reload(); // Simple logout
                }, 1000);
            }
        });
    }

    // ====================
    // 12. COPY/PASTE PROTECTION
    // ====================
    function disableCopyPaste() {
        // Prevent copying from vault
        document.addEventListener('copy', function(e) {
            if (securityState.isVaultVisible) {
                e.preventDefault();
                showSecurityWarning("Copying disabled in vault");
                return false;
            }
        });
        
        // Prevent pasting into vault
        document.addEventListener('paste', function(e) {
            if (securityState.isVaultVisible) {
                e.preventDefault();
                showSecurityWarning("Pasting disabled in vault");
                return false;
            }
        });
        
        // Prevent cut from vault
        document.addEventListener('cut', function(e) {
            if (securityState.isVaultVisible) {
                e.preventDefault();
                showSecurityWarning("Cutting disabled in vault");
                return false;
            }
        });
    }

    // ====================
    // 13. DEVTOOLS DETECTION (BASIC)
    // ====================
    function setupDevToolsDetection() {
        // Simple devtools detection (not foolproof)
        const element = new Image();
        Object.defineProperty(element, 'id', {
            get: function() {
                // This will be triggered when devtools is open
                if (securityState.isVaultVisible) {
                    showSecurityWarning("Developer tools detected");
                }
            }
        });
        
        console.log('%c⚠️ Developer tools may trigger security warnings', 'color: red; font-weight: bold;');
    }

    // ====================
    // 14. INITIALIZATION
    // ====================
    function initializeSecurity() {
        console.log('Initializing security system...');
        
        // Create warning element
        createSecurityWarning();
        
        // Setup all security features
        disableRightClick();
        disableTextSelection();
        setupScreenshotDetection();
        setupVisibilityDetection();
        setupPageVisibility();
        disableCopyPaste();
        setupDevToolsDetection();
        
        console.log('Security system initialized');
        
        // Display security disclaimer
        showSecurityDisclaimer();
    }

    // ====================
    // 15. SECURITY DISCLAIMER
    // ====================
    function showSecurityDisclaimer() {
        console.log(`
═══════════════════════════════════════════════
 SECURITY SYSTEM ACTIVE - IMPORTANT INFORMATION
═══════════════════════════════════════════════

⚠️  SECURITY DISCLAIMER:
This system uses FRONT-END ONLY techniques to
deter casual screenshot attempts.

WHAT WE CAN DO:
✓ Disable right-click in vault
✓ Disable text selection
✓ Detect common screenshot key combinations
✓ Show warnings and blur content
✓ Auto-logout on multiple violations

WHAT WE CANNOT DO (Browser Limitations):
✗ Prevent Print Screen key (OS-level)
✗ Block hardware screenshot buttons
✗ Prevent camera photos of screen
✗ Stop screen recording software
✗ Block browser extensions
✗ Prevent OS-level screen capture

REALITY CHECK:
• Determined users can still capture your screen
• These are DETERRENTS, not guarantees
• For real security, use device-level encryption
• Consider physical privacy screens

USE CASE:
This system is designed to prevent CASUAL
screenshots by friends/family, not determined
attackers.

═══════════════════════════════════════════════
        `);
    }

    // ====================
    // 16. START SECURITY SYSTEM
    // ====================
    initializeSecurity();
});

// ====================
// 17. BROWSER LIMITATIONS EXPLANATION
// ====================
/*
WHY 100% SCREENSHOT PROTECTION IS IMPOSSIBLE IN BROWSERS:

1. OPERATING SYSTEM LEVEL:
   - Print Screen key is handled by OS, not browser
   - Hardware buttons (like phone power+volume) bypass browser
   - Screen recording software works at OS level

2. BROWSER EXTENSIONS:
   - Screenshot extensions can capture any tab
   - Developer tools can capture screenshots
   - Users can install custom screenshot tools

3. PHYSICAL ACCESS:
   - Camera photos of the screen
   - Second device recording
   - Mirror reflections

4. TECHNICAL WORKAROUNDS:
   - Disable JavaScript (bypasses all protection)
   - Use browser's built-in screenshot tools
   - Use virtual machines or remote desktop

WHAT WE'RE DOING INSTEAD:
- Making casual screenshots difficult
- Providing visual warnings
- Auto-logout on suspicious activity
- Educating users about limitations

RECOMMENDATION FOR USERS:
For truly sensitive content:
1. Use this as a first layer only
2. Enable device-level screen capture blocking
3. Use privacy screen filters
4. Store only non-critical items
5. Regularly clear vault content
*/
