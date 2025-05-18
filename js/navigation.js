/**
 * Navigation functionality for the Vocabulary Learning Application
 * Handles mobile menu toggling and view switching
 */

document.addEventListener('DOMContentLoaded', function() {
    // Mobile navigation elements
    const mobileNavToggle = document.getElementById('mobile-nav-toggle');
    const sidebar = document.getElementById('sidebar');
    const mobileOverlay = document.getElementById('mobile-overlay');
    
    /**
     * Toggle mobile navigation menu visibility
     */
    function toggleMobileNav() {
        sidebar.classList.toggle('mobile-nav-open');
        mobileOverlay.classList.toggle('mobile-overlay-visible');
    }
    
    // Ensure the mobile nav toggle works
    mobileNavToggle.addEventListener('click', function(e) {
        e.preventDefault();
        toggleMobileNav();
    });
    
    mobileOverlay.addEventListener('click', toggleMobileNav);
    
    // Close mobile nav when a navigation item is clicked
    document.querySelectorAll('#sidebar button').forEach(btn => {
        btn.addEventListener('click', function() {
            if (window.innerWidth < 768) {
                toggleMobileNav();
            }
        });
    });

    /**
     * Adjust sidebar height based on window size
     */
    function adjustSidebarHeight() {
        if (window.innerWidth >= 768) {
            const windowHeight = window.innerHeight;
            sidebar.style.height = windowHeight + 'px';
        } else {
            sidebar.style.height = '100%';
        }
    }
    
    // Run on load and resize
    adjustSidebarHeight();
    window.addEventListener('resize', adjustSidebarHeight);
});