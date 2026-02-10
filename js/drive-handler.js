// ============================================
// CALCULATOR VAULT - GOOGLE DRIVE INTEGRATION
// Handles Google Drive links for vault content
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // ====================
    // 1. GOOGLE DRIVE CONFIG
    // ====================
    const DRIVE_CONFIG = {
        // Storage key for vault content
        storageKey: 'vault_drive_content',
        
        // Default categories
        categories: ['photos', 'videos', 'files', 'recordings'],
        
        // Google Drive URL patterns
        urlPatterns: {
            // Standard share link format
            shareLink: /https:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/,
            
            // Open/view link format
            openLink: /https:\/\/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/,
            
            // Folder link (if needed in future)
            folderLink: /https:\/\/drive\.google\.com\/drive\/folders\/([a-zA-Z0-9_-]+)/
        }
    };

    // ====================
    // 2. DRIVE CONTENT STATE
    // ====================
    let driveContent = {
        photos: [],    // { id, name, url, thumbnail, date }
        videos: [],    // { id, name, embedUrl, thumbnail, date }
        files: [],     // { id, name, directUrl, size, type, date }
        recordings: [] // { id, name, directUrl, size, date }
    };

    // ====================
    // 3. GOOGLE DRIVE LINK HANDLING
    // ====================
    function extractFileId(driveUrl) {
        // Try to match different Google Drive URL formats
        let fileId = null;
        
        // Format 1: https://drive.google.com/file/d/FILE_ID/view
        const shareMatch = driveUrl.match(DRIVE_CONFIG.urlPatterns.shareLink);
        if (shareMatch && shareMatch[1]) {
            fileId = shareMatch[1];
        }
        
        // Format 2: https://drive.google.com/open?id=FILE_ID
        const openMatch = driveUrl.match(DRIVE_CONFIG.urlPatterns.openLink);
        if (openMatch && openMatch[1]) {
            fileId = openMatch[1];
        }
        
        if (!fileId) {
            console.error('Invalid Google Drive URL format:', driveUrl);
            return null;
        }
        
        return fileId;
    }

    function generateEmbedUrl(fileId) {
        // For videos: creates embeddable iframe URL
        return `https://drive.google.com/file/d/${fileId}/preview`;
    }

    function generateDirectUrl(fileId) {
        // For photos/files: creates direct download URL
        return `https://drive.google.com/uc?id=${fileId}&export=download`;
    }

    function generateThumbnailUrl(fileId) {
        // Creates thumbnail URL for images
        return `https://drive.google.com/thumbnail?id=${fileId}&sz=w400`;
    }

    function generateViewUrl(fileId) {
        // Creates view-only URL
        return `https://drive.google.com/file/d/${fileId}/view`;
    }

    // ====================
    // 4. CONTENT TYPE DETECTION
    // ====================
    function detectContentType(fileName, fileId) {
        const extension = fileName.split('.').pop().toLowerCase();
        
        // Image extensions
        const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];
        if (imageExtensions.includes(extension)) {
            return 'photos';
        }
        
        // Video extensions
        const videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm'];
        if (videoExtensions.includes(extension)) {
            return 'videos';
        }
        
        // Audio/recording extensions
        const audioExtensions = ['mp3', 'wav', 'm4a', 'aac', 'ogg', 'flac'];
        if (audioExtensions.includes(extension)) {
            return 'recordings';
        }
        
        // Document/file extensions
        const fileExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'zip', 'rar'];
        if (fileExtensions.includes(extension)) {
            return 'files';
        }
        
        // Default to files if unknown
        return 'files';
    }

    // ====================
    // 5. VAULT CONTENT STORAGE
    // ====================
    function loadDriveContent() {
        const storedContent = localStorage.getItem(DRIVE_CONFIG.storageKey);
        if (storedContent) {
            try {
                driveContent = JSON.parse(storedContent);
                console.log('Loaded Google Drive content from storage');
            } catch (error) {
                console.error('Error parsing stored content:', error);
                initializeDefaultContent();
            }
        } else {
            initializeDefaultContent();
        }
        updateVaultDisplay();
    }

    function saveDriveContent() {
        try {
            localStorage.setItem(DRIVE_CONFIG.storageKey, JSON.stringify(driveContent));
            console.log('Saved Google Drive content to storage');
            return true;
        } catch (error) {
            console.error('Error saving content:', error);
            return false;
        }
    }

    function initializeDefaultContent() {
        // Set up empty structure
        driveContent = {
            photos: [],
            videos: [],
            files: [],
            recordings: []
        };
        saveDriveContent();
    }

    // ====================
    // 6. ADD CONTENT TO VAULT
    // ====================
    function addDriveContent(driveUrl, fileName, category = null) {
        // Extract file ID from URL
        const fileId = extractFileId(driveUrl);
        if (!fileId) {
            return {
                success: false,
                message: 'Invalid Google Drive URL format'
            };
        }
        
        // Detect category if not specified
        const detectedCategory = category || detectContentType(fileName, fileId);
        
        // Check if file already exists in vault
        if (isFileInVault(fileId, detectedCategory)) {
            return {
                success: false,
                message: 'This file is already in the vault'
            };
        }
        
        // Create content object based on type
        const contentItem = createContentItem(fileId, fileName, detectedCategory);
        
        // Add to appropriate category
        driveContent[detectedCategory].push(contentItem);
        
        // Save to storage
        const saved = saveDriveContent();
        
        if (saved) {
            // Update display if vault is open
            updateVaultDisplay();
            
            return {
                success: true,
                message: `Added "${fileName}" to ${detectedCategory}`,
                category: detectedCategory,
                item: contentItem
            };
        } else {
            return {
                success: false,
                message: 'Failed to save to vault storage'
            };
        }
    }

    function createContentItem(fileId, fileName, category) {
        const now = new Date();
        
        // Base item structure
        const baseItem = {
            id: fileId,
            name: fileName,
            addedDate: now.toISOString(),
            addedTimestamp: now.getTime()
        };
        
        // Add category-specific URLs
        switch (category) {
            case 'photos':
                return {
                    ...baseItem,
                    type: 'photo',
                    thumbnailUrl: generateThumbnailUrl(fileId),
                    directUrl: generateDirectUrl(fileId),
                    viewUrl: generateViewUrl(fileId)
                };
                
            case 'videos':
                return {
                    ...baseItem,
                    type: 'video',
                    embedUrl: generateEmbedUrl(fileId),
                    thumbnailUrl: generateThumbnailUrl(fileId),
                    directUrl: generateDirectUrl(fileId)
                };
                
            case 'files':
            case 'recordings':
                return {
                    ...baseItem,
                    type: category === 'files' ? 'document' : 'audio',
                    directUrl: generateDirectUrl(fileId),
                    viewUrl: generateViewUrl(fileId),
                    size: 'Unknown' // Could be fetched via Drive API in future
                };
                
            default:
                return baseItem;
        }
    }

    function isFileInVault(fileId, category = null) {
        if (category) {
            // Check specific category
            return driveContent[category].some(item => item.id === fileId);
        } else {
            // Check all categories
            for (const cat of DRIVE_CONFIG.categories) {
                if (driveContent[cat].some(item => item.id === fileId)) {
                    return true;
                }
            }
            return false;
        }
    }

    // ====================
    // 7. DELETE CONTENT FROM VAULT
    // ====================
    function deleteDriveContent(fileId, category = null) {
        let deleted = false;
        let deletedFromCategory = null;
        
        if (category) {
            // Delete from specific category
            const initialLength = driveContent[category].length;
            driveContent[category] = driveContent[category].filter(item => item.id !== fileId);
            deleted = driveContent[category].length < initialLength;
            deletedFromCategory = category;
        } else {
            // Delete from any category (search all)
            for (const cat of DRIVE_CONFIG.categories) {
                const initialLength = driveContent[cat].length;
                driveContent[cat] = driveContent[cat].filter(item => item.id !== fileId);
                if (driveContent[cat].length < initialLength) {
                    deleted = true;
                    deletedFromCategory = cat;
                    break;
                }
            }
        }
        
        if (deleted) {
            saveDriveContent();
            updateVaultDisplay();
            return {
                success: true,
                message: 'File removed from vault',
                category: deletedFromCategory,
                note: 'File remains safe in your Google Drive'
            };
        } else {
            return {
                success: false,
                message: 'File not found in vault'
            };
        }
    }

    function clearCategory(category) {
        if (driveContent[category] && Array.isArray(driveContent[category])) {
            driveContent[category] = [];
            saveDriveContent();
            updateVaultDisplay();
            return {
                success: true,
                message: `Cleared all ${category} from vault`,
                note: 'Files remain safe in your Google Drive'
            };
        }
        return {
            success: false,
            message: `Invalid category: ${category}`
        };
    }

    // ====================
    // 8. DISPLAY CONTENT IN VAULT
    // ====================
    function updateVaultDisplay() {
        // Update each category display
        DRIVE_CONFIG.categories.forEach(category => {
            updateCategoryDisplay(category);
        });
    }

    function updateCategoryDisplay(category) {
        const containerId = `${category}Grid`;
        const listId = `${category}List`;
        const emptyId = `${category}Empty`;
        
        const items = driveContent[category];
        
        // Update empty message visibility
        const emptyElement = document.getElementById(emptyId);
        if (emptyElement) {
            emptyElement.style.display = items.length === 0 ? 'block' : 'none';
        }
        
        // Update grid/list display based on category
        if (category === 'photos' || category === 'videos') {
            updateGridDisplay(containerId, items, category);
        } else {
            updateListDisplay(listId, items, category);
        }
    }

    function updateGridDisplay(containerId, items, category) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        // Clear existing content
        container.innerHTML = '';
        
        // Add each item
        items.forEach((item, index) => {
            const itemElement = createGridItem(item, category, index);
            container.appendChild(itemElement);
        });
    }

    function createGridItem(item, category, index) {
        const div = document.createElement('div');
        div.className = 'vault-item';
        div.dataset.id = item.id;
        div.dataset.index = index;
        
        if (category === 'photos') {
            // Photo item
            div.innerHTML = `
                <img src="${item.thumbnailUrl}" alt="${item.name}" loading="lazy">
                <div class="vault-item-overlay">
                    <div class="item-name">${item.name}</div>
                    <div class="item-date">${formatDate(item.addedDate)}</div>
                </div>
            `;
            
            // Click to view full image
            div.addEventListener('click', function() {
                window.open(item.viewUrl, '_blank');
            });
            
        } else if (category === 'videos') {
            // Video item
            div.innerHTML = `
                <div class="video-thumbnail">
                    <img src="${item.thumbnailUrl}" alt="${item.name}" loading="lazy">
                    <div class="video-play-icon">▶</div>
                </div>
                <div class="vault-item-overlay">
                    <div class="item-name">${item.name}</div>
                    <div class="item-date">${formatDate(item.addedDate)}</div>
                </div>
            `;
            
            // Click to open video in modal (simplified - could use iframe)
            div.addEventListener('click', function() {
                openVideoModal(item);
            });
        }
        
        return div;
    }

    function updateListDisplay(containerId, items, category) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        // Clear existing content
        container.innerHTML = '';
        
        // Add each item
        items.forEach((item, index) => {
            const itemElement = createListItem(item, category, index);
            container.appendChild(itemElement);
        });
    }

    function createListItem(item, category, index) {
        const div = document.createElement('div');
        div.className = 'file-item';
        div.dataset.id = item.id;
        div.dataset.index = index;
        
        // Get appropriate icon
        const icon = getFileIcon(item.name, category);
        
        div.innerHTML = `
            <div class="file-icon">${icon}</div>
            <div class="file-info">
                <div class="file-name">${item.name}</div>
                <div class="file-size">${item.size || 'Unknown size'} • ${formatDate(item.addedDate)}</div>
            </div>
            <button class="file-download" data-url="${item.directUrl}">Download</button>
        `;
        
        // Add download functionality
        const downloadBtn = div.querySelector('.file-download');
        downloadBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            downloadFile(item.directUrl, item.name);
        });
        
        // Click to open in new tab
        div.addEventListener('click', function() {
            window.open(item.viewUrl || item.directUrl, '_blank');
        });
        
        return div;
    }

    // ====================
    // 9. UTILITY FUNCTIONS
    // ====================
    function formatDate(isoString) {
        const date = new Date(isoString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    }

    function getFileIcon(filename, category) {
        const extension = filename.split('.').pop().toLowerCase();
        
        // Category-based icons
        if (category === 'recordings') return '🎵';
        
        // File type icons
        const icons = {
            'pdf': '📄',
            'doc': '📝', 'docx': '📝',
            'xls': '📊', 'xlsx': '📊',
            'ppt': '📽', 'pptx': '📽',
            'txt': '📃',
            'zip': '📦', 'rar': '📦'
        };
        
        return icons[extension] || '📎';
    }

    function downloadFile(url, filename) {
        // Create temporary link for download
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    function openVideoModal(videoItem) {
        // Simple modal for video playback
        const modal = document.createElement('div');
        modal.className = 'video-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.9);
            z-index: 2000;
            display: flex;
            justify-content: center;
            align-items: center;
        `;
        
        modal.innerHTML = `
            <div class="modal-content" style="width: 90%; max-width: 800px;">
                <div style="position: relative; padding-bottom: 56.25%; height: 0;">
                    <iframe 
                        src="${videoItem.embedUrl}" 
                        style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"
                        frameborder="0" 
                        allowfullscreen
                        allow="autoplay; encrypted-media"
                    ></iframe>
                </div>
                <div style="color: white; padding: 15px; text-align: center;">
                    <h3>${videoItem.name}</h3>
                    <button id="closeModal" style="margin-top: 15px; padding: 10px 20px;">Close</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close modal on button click or background click
        modal.addEventListener('click', function(e) {
            if (e.target.id === 'closeModal' || e.target === modal) {
                document.body.removeChild(modal);
            }
        });
        
        // Close on escape key
        document.addEventListener('keydown', function closeOnEscape(e) {
            if (e.key === 'Escape') {
                document.body.removeChild(modal);
                document.removeEventListener('keydown', closeOnEscape);
            }
        });
    }

    // ====================
    // 10. EXPORT FUNCTIONS
    // ====================
    // Make functions available to admin panel and other scripts
    window.DriveHandler = {
        // Core functions
        addContent: addDriveContent,
        deleteContent: deleteDriveContent,
        clearCategory: clearCategory,
        loadContent: loadDriveContent,
        getContent: () => driveContent,
        
        // Helper functions for admin panel
        extractFileId: extractFileId,
        detectContentType: detectContentType,
        
        // URL generators (for admin instructions)
        generateEmbedUrl: generateEmbedUrl,
        generateDirectUrl: generateDirectUrl,
        generateThumbnailUrl: generateThumbnailUrl,
        
        // Info for admin
        getInstructions: function() {
            return {
                howToAdd: `
HOW TO ADD GOOGLE DRIVE CONTENT:

1. Upload your file to Google Drive
2. Right-click the file and select "Get link"
3. Set link sharing to "Anyone with the link"
4. Copy the link (it will look like):
   https://drive.google.com/file/d/FILE_ID/view

5. In admin panel:
   - Paste the Google Drive link
   - Enter a display name
   - Select category (or auto-detect)
   - Click "Add to Vault"

LINK FORMATS:
• Videos use: https://drive.google.com/file/d/FILE_ID/preview
• Photos/Files use: https://drive.google.com/uc?id=FILE_ID&export=download

IMPORTANT:
• Files remain in YOUR Google Drive
• Only the links are stored in the vault
• Deleting from vault doesn't delete from Drive
                `,
                categories: DRIVE_CONFIG.categories,
                exampleLinks: {
                    video: 'https://drive.google.com/file/d/1EXAMPLE_FILE_ID/preview',
                    photo: 'https://drive.google.com/file/d/1EXAMPLE_FILE_ID/view'
                }
            };
        }
    };

    // ====================
    // 11. INITIALIZATION
    // ====================
    function initializeDriveHandler() {
        console.log('Initializing Google Drive handler...');
        loadDriveContent();
        console.log('Google Drive handler ready');
        
        // Log instructions for admin
        console.log(`
═══════════════════════════════════════════════
GOOGLE DRIVE INTEGRATION INSTRUCTIONS
═══════════════════════════════════════════════

1. FOR VIDEOS (Embeddable):
   Use: https://drive.google.com/file/d/FILE_ID/preview
   This creates an iframe-embedded player

2. FOR PHOTOS/FILES (Direct link):
   Use: https://drive.google.com/uc?id=FILE_ID&export=download
   This creates a direct download link

3. ADMIN PANEL:
   • Add content via admin-panel.html
   • Paste standard Google Drive share links
   • System auto-converts to proper format
   • Files remain safe in your Google Drive

4. SECURITY:
   • Only links are stored (not files)
   • Delete from vault ≠ delete from Drive
   • Use Google Drive's own security features

═══════════════════════════════════════════════
        `);
    }

    // Start the drive handler
    initializeDriveHandler();
});
