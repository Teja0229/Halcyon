// Starter JavaScript for disabling form submissions if there are invalid fields
(() => {
  'use strict';

  // Fetch all the forms we want to apply custom Bootstrap validation styles to
  const forms = document.querySelectorAll('.needs-validation');

  // Loop over them and prevent submission
  Array.from(forms).forEach(form => {
    form.addEventListener('submit', event => {
      if (!form.checkValidity()) {
        event.preventDefault();
        event.stopPropagation();
      }

      form.classList.add('was-validated');
    }, false);
  });

  // Cart / Saved Stays Toggle Handler
  document.addEventListener('click', async (event) => {
    const btn = event.target.closest('.cart-toggle-btn');
    if (!btn) return;

    event.preventDefault();
    event.stopPropagation();

    const listingId = btn.getAttribute('data-listing-id');
    if (!listingId) return;

    // Check if user is logged in
    if (!window.isLoggedIn) {
      const modalEl = document.getElementById('authPromptModal');
      if (modalEl && typeof bootstrap !== 'undefined') {
        const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
        modal.show();
      } else {
        window.location.href = '/login';
      }
      return;
    }

    // Toggle cart via AJAX
    try {
      btn.style.pointerEvents = 'none';
      const response = await fetch(`/cart/toggle/${listingId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      const data = await response.json();
      btn.style.pointerEvents = '';

      if (data.requireLogin) {
        window.location.href = data.redirect || '/login';
        return;
      }

      if (data.success) {
        // Update all buttons for this listing on the page
        const matchingButtons = document.querySelectorAll(`[data-listing-id="${listingId}"]`);
        matchingButtons.forEach(b => {
          const icon = b.querySelector('i');
          const textSpan = b.querySelector('.cart-btn-text');

          if (data.inCart) {
            b.classList.add('active');
            if (icon) {
              icon.classList.remove('fa-regular');
              icon.classList.add('fa-solid', 'text-danger');
            }
            if (b.classList.contains('btn-outline-danger')) {
              b.classList.remove('btn-outline-danger');
              b.classList.add('btn-danger', 'text-white');
            }
            if (textSpan) textSpan.textContent = 'Saved in Cart';
            b.setAttribute('title', 'Remove from Cart');
          } else {
            b.classList.remove('active');
            if (icon) {
              icon.classList.add('fa-regular');
              icon.classList.remove('fa-solid', 'text-danger');
            }
            if (b.classList.contains('btn-danger')) {
              b.classList.remove('btn-danger', 'text-white');
              b.classList.add('btn-outline-danger');
            }
            if (textSpan) textSpan.textContent = 'Save to Cart';
            b.setAttribute('title', 'Add to Cart');
          }
        });

        // Update Navbar cart count badge
        const badge = document.getElementById('cartCountBadge');
        if (badge) {
          badge.textContent = data.cartCount;
          badge.style.display = data.cartCount > 0 ? '' : 'none';
        }
        const headerBadge = document.getElementById('miniCartHeaderBadge');
        if (headerBadge) {
          headerBadge.textContent = `${data.cartCount} item(s)`;
        }
      }
    } catch (err) {
      btn.style.pointerEvents = '';
      console.error('Error toggling cart:', err);
    }
  });

  // Mini-Cart Dropdown Item Remove Handler
  document.addEventListener('click', async (event) => {
    const removeBtn = event.target.closest('.mini-cart-remove-btn');
    if (!removeBtn) return;

    event.preventDefault();
    event.stopPropagation();

    const listingId = removeBtn.getAttribute('data-listing-id');
    if (!listingId) return;

    try {
      removeBtn.disabled = true;
      const response = await fetch(`/cart/remove/${listingId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        // Animate and remove the mini-cart item row
        const itemRow = removeBtn.closest('.mini-cart-item');
        if (itemRow) {
          itemRow.style.transition = 'all 0.25s ease';
          itemRow.style.opacity = '0';
          itemRow.style.transform = 'translateX(20px)';
          setTimeout(() => {
            itemRow.remove();
            
            // If no more items, show empty message
            const container = document.getElementById('miniCartItemsContainer');
            if (container && container.querySelectorAll('.mini-cart-item').length === 0) {
              container.innerHTML = `
                <div class="text-center py-4 px-3 text-muted empty-mini-cart-msg">
                  <i class="fa-regular fa-heart text-danger fs-2 mb-2 d-block"></i>
                  <p class="small mb-2">No stays saved in your cart yet.</p>
                  <a href="/listings" class="btn btn-sm btn-outline-danger rounded-pill px-3 fw-semibold">
                    Explore Stays
                  </a>
                </div>
              `;
            }
          }, 250);
        }

        // Update badge counts
        const badge = document.getElementById('cartCountBadge');
        if (badge) {
          badge.textContent = data.cartCount;
          badge.style.display = data.cartCount > 0 ? '' : 'none';
        }

        const headerBadge = document.getElementById('miniCartHeaderBadge');
        if (headerBadge) {
          headerBadge.textContent = `${data.cartCount} item(s)`;
        }

        // Also update any heart toggle buttons on the page for this listing
        const matchingButtons = document.querySelectorAll(`[data-listing-id="${listingId}"]`);
        matchingButtons.forEach(b => {
          if (b.classList.contains('mini-cart-remove-btn')) return;
          b.classList.remove('active');
          const icon = b.querySelector('i');
          if (icon) {
            icon.classList.add('fa-regular');
            icon.classList.remove('fa-solid', 'text-danger');
          }
          if (b.classList.contains('btn-danger')) {
            b.classList.remove('btn-danger', 'text-white');
            b.classList.add('btn-outline-danger');
          }
          const textSpan = b.querySelector('.cart-btn-text');
          if (textSpan) textSpan.textContent = 'Save to Cart';
          b.setAttribute('title', 'Add to Cart');
        });
      }
    } catch (err) {
      removeBtn.disabled = false;
      console.error('Error removing item from mini cart:', err);
    }
  });
})();