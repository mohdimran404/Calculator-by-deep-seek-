// ============================================
// CALCULATOR VAULT - ADMIN PANEL FUNCTIONALITY
// Handles PIN changes and vault content management
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // ====================
    // 1. ADMIN CONFIG
    // ====================
    const ADMIN_CONFIG = {
        // Storage keys (must match vault.js)
        storageKeys: {
            pinHash: 'vault_pin_hash',
            wrongAttempts: 'vault_wrong_attempts',
            lockoutUntil: 'vault_lockout_until'
        },
        
        // Default PIN for validation
        defaultPINHash: '12648430' // This is hash of "1234"
    };

    // ====================
    // 2. DOM ELEMENTS
    // ====================
    // PIN Change Section
    const pinForm = document.getElementById('pinForm');
    const currentPINInput = document.getElementById('currentPIN');
    const newPINInput = document.getElementById('newPIN');
    const confirmPINInput = document.getElementById('confirmPIN');
    const pinMessage = document.getElementById('pinMessage');
    
    // Content Management Section
    const addContentForm = document.getElementById('addContentForm');
    const driveLinkInput = document.getElementById('driveLink');
    const fileNameInput = document.getElementById('fileName');
    const contentCategorySelect = document.getElementById('contentCategory');
    const addContentMessage = document.getElementById('addContentMessage');
    const refreshContentBtn = document.getElementById('refreshContent');
    const contentListContainer = document.getElementById('contentListContainer');
    const clearAllContentBtn = document.getElementById('clearAllContent');
    
    // Navigation buttons (already handled in admin.html inline script)

    // ====================
    // 3. PIN MANAGEMENT
    // ====================
    // Simple hash function (must match vault.js)
    function simpleHash(pin) {
        let hash = 0;
        for (let i = 0; i < pin.length; i++) {
            const char = pin.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString();
    }

    // Validate PIN format
    function isValidPIN(pin) {
        return /^\d{4}$/.test(pin);
    }

    // Get current stored PIN hash
    function getCurrentPINHash() {
        return localStorage.getItem(ADMIN_CONFIG.storageKeys.pinHash) || ADMIN_CONFIG.defaultPINHash;
    }

    // Update PIN in storage
    function updatePIN(newPIN) {
        const newHash = simpleHash(newPIN);
        localStorage.setItem(ADMIN_CONFIG.storageKeys.pinHash, newHash);
        
        // Also clear any lockout states
        localStorage.removeItem(ADMIN_CONFIG.storageKeys.wrongAttempts);
        localStorage.removeItem(ADMIN_CONFIG.storageKeys.lockoutUntil);
        
        return newHash;
    }

    // Handle PIN change form submission
    pinForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const currentPIN = currentPINInput.value.trim();
        const newPIN = newPINInput.value.trim();
        const confirmPIN = confirmPINInput.value.trim();
        
        // Reset message
        pinMessage.textContent = '';
        pinMessage.className = 'form-help';
        
        // Validate inputs
        if (!currentPIN || !newPIN || !confirmPIN) {
            showPinMessage('All fields are required', 'error');
            return;
        }
        
        if (!isValidPIN(currentPIN) || !isValidPIN(newPIN) || !isValidPIN(confirmPIN)) {
            showPinMessage('PIN must be exactly 4 digits (numbers only)', 'error');
            return;
        }
        
        if (newPIN !== confirmPIN) {
            showPinMessage('New PIN and confirmation do not match', 'error');
            return;
        }
        
        if (newPIN === currentPIN) {
            showPinMessage('New PIN cannot be the same as current PIN', 'error');
            return;
        }
        
        // Check if current PIN is correct
        const currentHash = simpleHash(currentPIN);
        const storedHash = getCurrentPINHash();
        
        if (currentHash !== storedHash) {
            showPinMessage('Current PIN is incorrect', 'error');
            return;
        }
        
        // Update the PIN
        const newHash = updatePIN(newPIN);
        
        // Show success message
        showPinMessage('✅ PIN successfully updated!', 'success');
        
        // Clear form
        currentPINInput.value = '';
        newPINInput.value = '';
        confirmPINInput.value = '';
        
        // Log for admin
        console.log('PIN updated successfully');
        console.log('New PIN hash stored:', newHash);
    });

    function showPinMessage(message, type = '') {
        pinMessage.textContent = message;
        pinMessage.className = 'form-help';
        
        if (type === 'error') {
            pinMessage.style.color = '#e74c3c';
            pinMessage.style.fontWeight = '500';
        } else if (type === 'success') {
            pinMessage.style.color = '#27ae60';
            pinMessage.style.fontWeight = '500';
        }
    }

    // ====================
    // 4. CONTENT MANAGEMENT
    // ====================
    // Validate Google Drive URL
    function isValidDriveUrl(url) {
        const patterns = [
            /https:\/\/drive\.google\.com\/file\/d\/[a-zA-Z0-9_-]+/,
            /https:\/\/drive\.google\.com\/open\?id=[a-zA-Z0-9_-]+/,
            /https:\/\/drive\.google\.com\/drive\/folders\/[a-zA-Z0-9_-]+/
        ];
        
        return patterns.some(pattern => pattern.test(url));
    }

    // Handle add content form submission
    addContentForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const driveUrl = driveLinkInput.value.trim();
        const fileName = fileNameInput.value.trim();
        const category = contentCategorySelect.value;
        
        // Reset message
        addContentMessage.textContent = '';
        addContentMessage.className = 'form-help';
        
        // Validate inputs
        if (!driveUrl || !fileName) {
            showAddContentMessage('Both Google Drive link and file name are required', 'error');
            return;
        }
        
        if (!isValidDriveUrl(driveUrl)) {
            showAddContentMessage('Invalid Google Drive URL format', 'error');
            return;
        }
        
        // Ensure DriveHandler is available
        if (typeof window.DriveHandler === 'undefined') {
            showAddContentMessage('Error: Drive handler not loaded. Please refresh the page.', 'error');
            console.error('DriveHandler not found');
            return;
        }
        
        // Add content to vault
        const result = window.DriveHandler.addContent(driveUrl, fileName, category === 'auto' ? null : category);
        
        if (result.success) {
            // Show success message
            showAddContentMessage(`✅ Added "${fileName}" to ${result.category}`, 'success');
            
            // Clear form
            driveLinkInput.value = '';
            fileNameInput.value = '';
            contentCategorySelect.value = 'auto';
            
            // Refresh content list if we're in the content section
            if (document.getElementById('contentSection').classList.contains('active')) {
                refreshContentList();
            }
            
            console.log('Content added:', result);
        } else {
            // Show error message
            showAddContentMessage(`❌ ${result.message}`, 'error');
            console.error('Failed to add content:', result);
        }
    });

    function showAddContentMessage(message, type = '') {
        addContentMessage.textContent = message;
        addContentMessage.className = 'form-help';
        
        if (type === 'error') {
            addContentMessage.style.color = '#e74c3c';
            addContentMessage.style.fontWeight = '500';
        } else if (type === 'success') {
            addContentMessage.style.color = '#27ae60';
            addContentMessage.style.fontWeight = '500';
        }
    }

    // Refresh content list
    refreshContentBtn.addEventListener('click', refreshContentList);

    function refreshContentList() {
        // Ensure DriveHandler is available
        if (typeof window.DriveHandler === 'undefined') {
            contentListContainer.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #e74c3c;">
                    Error: Drive handler not loaded. Please refresh the page.
                </div>
            `;
            return;
        }
        
        // Get current content
        const content = window.DriveHandler.getContent();
        
        if (!content) {
            contentListContainer.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #7f8c8d;">
                    No content found in vault
                </div>
            `;
            return;
        }
        
        // Count total items
        const totalItems = Object.values(content).reduce((sum, arr) => sum + arr.length, 0);
        
        if (totalItems === 0) {
            contentListContainer.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #7f8c8d;">
                    Vault is empty. Add content using the form above.
                </div>
            `;
            return;
        }
        
        // Display content by category
        let html = '';
        
        // Photos
        if (content.photos && content.photos.length > 0) {
            html += `<h4 style="margin-top: 30px; color: #2c3e50;">Photos (${content.photos.length})</h4>`;
            content.photos.forEach((item, index) => {
                html += createContentItemHTML(item, 'photos', index);
            });
        }
        
        // Videos
        if (content.videos && content.videos.length > 0) {
            html += `<h4 style="margin-top: 30px; color: #2c3e50;">Videos (${content.videos.length})</h4>`;
            content.videos.forEach((item, index) => {
                html += createContentItemHTML(item, 'videos', index);
            });
        }
        
        // Files
        if (content.files && content.files.length > 0) {
            html += `<h4 style="margin-top: 30px; color: #2c3e50;">Files (${content.files.length})</h4>`;
            content.files.forEach((item, index) => {
                html += createContentItemHTML(item, 'files', index);
            });
        }
        
        // Recordings
        if (content.recordings && content.recordings.length > 0) {
            html += `<h4 style="margin-top: 30px; color: #2c3e50;">Recordings (${content.recordings.length})</h4>`;
            content.recordings.forEach((item, index) => {
                html += createContentItemHTML(item, 'recordings', index);
            });
        }
        
        contentListContainer.innerHTML = html;
        
        // Add event listeners to delete buttons
        document.querySelectorAll('.btn-delete').forEach(button => {
            button.addEventListener('click', handleDeleteContent);
        });
    }

    function createContentItemHTML(item, category, index) {
        const date = new Date(item.addedDate).toLocaleDateString();
        
        return `
            <div class="content-item" data-id="${item.id}" data-category="${category}" data-index="${index}">
                <div class="content-info">
                    <h4>${item.name}</h4>
                    <p>ID: ${item.id.substring(0, 8)}... • Added: ${date} • ${category}</p>
                </div>
                <div class="content-actions">
                    <button class="btn-small btn-delete" data-id="${item.id}" data-category="${category}">
                        Delete from Vault
                    </button>
                </div>
            </div>
        `;
    }

    // Handle delete content
    function handleDeleteContent(e) {
        const fileId = e.target.dataset.id;
        const category = e.target.dataset.category;
        
        if (!fileId || !category) {
            console.error('Missing file ID or category');
            return;
        }
        
        if (confirm(`Delete this item from the vault?\n\nNote: This only removes from vault, not from Google Drive.`)) {
            if (typeof window.DriveHandler === 'undefined') {
                alert('Error: Drive handler not available');
                return;
            }
            
            const result = window.DriveHandler.deleteContent(fileId, category);
            
            if (result.success) {
                alert(`✅ ${result.message}\n\n${result.note}`);
                refreshContentList();
            } else {
                alert(`❌ ${result.message}`);
            }
        }
    }

    // Clear all content
    clearAllContentBtn.addEventListener('click', function() {
        if (confirm(`⚠️ WARNING: This will remove ALL content from the vault!\n\n` +
                   `• All photos, videos, files, and recordings will be removed\n` +
                   `• This action cannot be undone\n` +
                   `• Content remains safe in your Google Drive\n\n` +
                   `Are you absolutely sure?`)) {
            
            if (typeof window.DriveHandler === 'undefined') {
                alert('Error: Drive handler not available');
                return;
            }
            
            // Clear each category
            const categories = ['photos', 'videos', 'files', 'recordings'];
            let clearedCount = 0;
            
            categories.forEach(category => {
                const result = window.DriveHandler.clearCategory(category);
                if (result.success) {
                    clearedCount++;
                }
            });
            
            if (clearedCount > 0) {
                alert(`✅ Cleared all vault content (${clearedCount} categories)\n\n` +
                      `All files remain safe in your Google Drive.`);
                refreshContentList();
            } else {
                alert('❌ Failed to clear vault content');
            }
        }
    });

    // ====================
    // 5. ADMIN PANEL UTILITIES
    // ====================
    // Check if DriveHandler is loaded and display instructions
    function displayDriveInstructions() {
        if (typeof window.DriveHandler !== 'undefined' && window.DriveHandler.getInstructions) {
            const instructions = window.DriveHandler.getInstructions();
            console.log('Google Drive Instructions:', instructions.howToAdd);
            
            // You could display these in the instructions section if needed
            const instructionsSection = document.getElementById('instructionsSection');
            if (instructionsSection) {
                // Instructions are already in HTML, but we could enhance them here
            }
        }
    }

    // Check current PIN status
    function checkPINStatus() {
        const currentHash = getCurrentPINHash();
        const isDefaultPIN = currentHash === ADMIN_CONFIG.defaultPINHash;
        
        if (isDefaultPIN) {
            console.warn('⚠️ SECURITY WARNING: Using default PIN (1234). Please change it!');
            
            // Optional: Show warning in admin panel
            const warning = document.createElement('div');
            warning.className = 'admin-warning';
            warning.style.marginTop = '20px';
            warning.innerHTML = `
                ⚠️ <strong>SECURITY WARNING</strong> - You are still using the default PIN (1234). 
                Please change it in the "Change PIN" section for security.
            `;
            
            // Insert after PIN form if it exists
            const pinSection = document.getElementById('pinSection');
            if (pinSection) {
                pinSection.appendChild(warning);
            }
        }
    }

    // ====================
    // 6. INITIALIZATION
    // ====================
    function initializeAdminPanel() {
        console.log('Initializing admin panel...');
        
        // Check PIN status
        checkPINStatus();
        
        // Display Drive instructions
        displayDriveInstructions();
        
        // Auto-refresh content list if we're in content section
        const contentSection = document.getElementById('contentSection');
        if (contentSection && contentSection.classList.contains('active')) {
            refreshContentList();
        }
        
        console.log('Admin panel ready');
        
        // Log security reminder
        console.log(`
═══════════════════════════════════════════════
ADMIN PANEL SECURITY REMINDER
═══════════════════════════════════════════════

1. This page is NOT linked from the calculator
2. Bookmark it securely
3. Clear browser history after use on shared devices
4. Change the default PIN (1234) immediately
5. Regularly review vault content

ACCESS URL: admin-panel.html
DEFAULT PIN: 1234 (CHANGE THIS!)

═══════════════════════════════════════════════
        `);
    }

    // Start admin panel
    initializeAdminPanel();
});

// ====================
// 7. SECURITY NOTES
// ====================
/*
IMPORTANT ADMIN SECURITY PRACTICES:

1. BOOKMARK SECURITY:
   - Bookmark this admin panel page
   - Do not save bookmark on shared computers
   - Consider using a password manager for the bookmark

2. SESSION SECURITY:
   - Clear browser history after admin sessions
   - Use private/incognito mode on shared devices
   - Close the admin tab when done

3. PIN MANAGEMENT:
   - Change from default PIN immediately
   - Use a PIN you don't use elsewhere
   - Consider changing PIN periodically

4. CONTENT MANAGEMENT:
   - Regularly review vault content
   - Remove old/unused content
   - Use Google Drive's built-in security
   - Revoke link sharing for deleted content

5. BROWSER SECURITY:
   - Keep browser updated
   - Use antivirus software
   - Enable browser security features

REMEMBER:
- This is a front-end only application
- Determined users can inspect the code
- For highly sensitive content, use additional security measures
*/
