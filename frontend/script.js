document.addEventListener('DOMContentLoaded', () => {
  const backendUrl = 'http://localhost:5000'; 
  let isLoggedIn = !!localStorage.getItem('token');
  let pendingAction = null;

  const furnitureData = [
    { id: "arm-chair", category: "chair", name: "Arm Chair", dimensions: "H: 95cm W: 80cm D: 75cm", imagePath: "assets/images/Arm_Chair.png", modelPath: "assets/models/Arm_Chair.glb" },
    { id: "l-sofa", category: "sofa", name: "Brown L-Sofa", dimensions: "H: 85cm W: 240cm D: 160cm", imagePath: "assets/images/Brown_L-Sofa.png", modelPath: "assets/models/Brown_L-Sofa.glb" },
    { id: "bed", category: "bed", name: "Bed", dimensions: "H: 110cm W: 180cm D: 210cm", imagePath: "assets/images/bed.png", modelPath: "assets/models/bed.glb" },
    { id: "table-lamp", category: "lighting", name: "Table Lamp", dimensions: "H: 55cm W: 30cm D: 30cm", imagePath: "assets/images/table_lamp.png", modelPath: "assets/models/table_lamp.glb" },
    { id: "tv-stand", category: "storage", name: "TV Stand", dimensions: "H: 50cm W: 180cm D: 40cm", imagePath: "assets/images/tv_stand.png", modelPath: "assets/models/tv_stand.glb" },
    { id: "antique-desk", category: "table", name: "Antique Desk", dimensions: "H: 78cm W: 120cm D: 60cm", imagePath: "assets/images/antique_desk.png", modelPath: "assets/models/antique_desk.glb" },
    { id: "bookshelf", category: "storage", name: "Bookshelf", dimensions: "H: 180cm W: 90cm D: 30cm", imagePath: "assets/images/bookshelf.png", modelPath: "assets/models/bookshelf.glb" },
    { id: "cupboard", category: "storage", name: "Cupboard", dimensions: "H: 190cm W: 100cm D: 55cm", imagePath: "assets/images/cupboard.png", modelPath: "assets/models/cupboard.glb" },
    { id: "coffee-table", category: "table", name: "Coffee Table", dimensions: "H: 45cm W: 110cm D: 60cm", imagePath: "assets/images/coffee_table.png", modelPath: "assets/models/coffee_table.glb" },
    { id: "modern-chair", category: "chair", name: "Modern Chair", dimensions: "H: 90cm W: 60cm D: 55cm", imagePath: "assets/images/chair.png", modelPath: "assets/models/chair.glb" },
    { id: "modern-table", category: "table", name: "Modern Table", dimensions: "H: 75cm W: 120cm D: 80cm", imagePath: "assets/images/table.png", modelPath: "assets/models/table.glb" },
    { id: "wood-table", category: "table", name: "Wood Table", dimensions: "H: 75cm W: 160cm D: 90cm", imagePath: "assets/images/wood_table.png", modelPath: "assets/models/wood_table.glb" }
  ];

  // Helper function to calculate if an item is "Large" based on width
  const checkWillItFit = (dimensionsStr) => {
    const widthMatch = dimensionsStr.match(/W:\s*(\d+)cm/);
    if (widthMatch) {
        const width = parseInt(widthMatch[1], 10);
        return width >= 150; // Items wider than 150cm get the warning badge
    }
    return false;
  };

  const grid = document.getElementById('product-grid');
  
  function renderProducts(dataToRender) {
    grid.innerHTML = '';
    dataToRender.forEach(item => {
      const isLargeItem = checkWillItFit(item.dimensions);
      
      const card = document.createElement('div');
      card.className = 'product-card';
      card.dataset.category = item.category;
      card.dataset.name = item.name.toLowerCase();
      
      // Injecting the Model Viewer, Badge, and Color Swatches
      card.innerHTML = `
        <model-viewer id="model-${item.id}" src="${item.modelPath}" poster="${item.imagePath}" ar ar-placement="floor" auto-rotate camera-controls shadow-intensity="1"></model-viewer>
        
        <h3>${item.name}</h3>
        
        ${isLargeItem ? '<div class="fit-badge">⚠️ Large Item: Measure your space</div>' : ''}
        
        <p class="product-dimensions">${item.dimensions}</p>

        <div class="color-picker">
            <button class="color-swatch" style="background: #ffffff;" data-color="1,1,1,1" title="Original"></button>
            <button class="color-swatch" style="background: #ff4d4d;" data-color="0.8,0.1,0.1,1" title="Ruby Red"></button>
            <button class="color-swatch" style="background: #4d4dff;" data-color="0.1,0.1,0.8,1" title="Deep Blue"></button>
            <button class="color-swatch" style="background: #1a1a1a;" data-color="0.05,0.05,0.05,1" title="Midnight Black"></button>
        </div>

        <div class="button-row">
            <button class="btn ar-btn">View in 3D/AR</button>
            <button class="btn snapshot-btn">Snapshot 📸</button>
        </div>
      `;
      grid.appendChild(card);

      // --- Feature: Dynamic Color Change Logic ---
      const modelViewer = card.querySelector(`model-viewer`);
      const swatches = card.querySelectorAll('.color-swatch');
      
      swatches.forEach(swatch => {
          swatch.addEventListener('click', () => {
              if (modelViewer.model && modelViewer.model.materials.length > 0) {
                  // Extract RGBA array from the data attribute
                  const colorArray = swatch.getAttribute('data-color').split(',').map(Number);
                  
                  // Apply to the base material of the 3D model
                  const material = modelViewer.model.materials[0];
                  material.pbrMetallicRoughness.setBaseColorFactor(colorArray);
              } else {
                  // If the model hasn't finished loading yet
                  alert("Please wait for the 3D model to load before changing colors.");
              }
          });
      });

      // --- Security & Features ---
      card.querySelector('.ar-btn').onclick = () => {
        if (!isLoggedIn) {
          pendingAction = { type: 'ar', item: item.name };
          document.getElementById('auth-modal').style.display = 'flex';
        } else {
          alert("AR Mode Activated for " + item.name);
        }
      };

      card.querySelector('.snapshot-btn').onclick = async () => {
        if (!isLoggedIn) {
          pendingAction = { type: 'snapshot', item: item.name };
          document.getElementById('auth-modal').style.display = 'flex';
        } else {
          if (modelViewer) {
              const blob = await modelViewer.toBlob({ idealAspect: true });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `snapshot-${item.name.replace(/\s+/g, '-')}.png`;
              link.click();
              URL.revokeObjectURL(url);
          }
        }
      };
    });
  }

  renderProducts(furnitureData);

  // Search and Filter Logic
  const searchBar = document.getElementById('search-bar');
  const filterButtons = document.querySelectorAll('.filter-btn');

  function filterProducts() {
    const searchQuery = searchBar.value.toLowerCase();
    const activeCategory = document.querySelector('.filter-btn.active').dataset.category;

    const filteredData = furnitureData.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery);
      const matchesCategory = (activeCategory === 'all' || item.category === activeCategory);
      return matchesSearch && matchesCategory;
    });

    renderProducts(filteredData);
  }

  if (searchBar) searchBar.addEventListener('input', filterProducts);
  
  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      filterButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      filterProducts();
    });
  });

  // UI Updates & Auth Modal Controls
  const updateUI = () => {
    document.getElementById('login-nav-btn').style.display = isLoggedIn ? 'none' : 'block';
    document.getElementById('logout-btn').style.display = isLoggedIn ? 'block' : 'none';
  };
  updateUI();

  const modal = document.getElementById('auth-modal');
  const signupForm = document.getElementById('signup-form');
  const loginForm = document.getElementById('login-form');

  const clearFormsAndErrors = () => {
    signupForm.reset();
    loginForm.reset();
    document.getElementById('signup-error').style.display = 'none';
    document.getElementById('login-error').style.display = 'none';
  };

  document.getElementById('login-nav-btn').onclick = () => { clearFormsAndErrors(); modal.style.display = 'flex'; };
  document.getElementById('auth-modal-close-btn').onclick = () => { modal.style.display = 'none'; pendingAction = null; };
  
  document.getElementById('show-login').onclick = (e) => { e.preventDefault(); clearFormsAndErrors(); signupForm.style.display = 'none'; loginForm.style.display = 'block'; };
  document.getElementById('show-signup').onclick = (e) => { e.preventDefault(); clearFormsAndErrors(); loginForm.style.display = 'none'; signupForm.style.display = 'block'; };

  const validateEmail = (email) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password) => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+={}\[\]|\\:;"'<>,.?/-]).{6,}$/;
    return passwordRegex.test(password);
  };

  const showValidationError = (formPrefix, message) => {
    const errorElement = document.getElementById(`${formPrefix}-error`);
    errorElement.textContent = message;
    errorElement.style.display = 'block';
  };

  const handleAuth = async (e, endpoint, formPrefix) => {
    e.preventDefault();
    document.getElementById(`${formPrefix}-error`).style.display = 'none';

    const email = document.getElementById(`${formPrefix}-email`).value.trim();
    const password = document.getElementById(`${formPrefix}-password`).value;

    if (!validateEmail(email)) return showValidationError(formPrefix, "Invalid email format. Must be like example@domain.com");
    if (!validatePassword(password)) return showValidationError(formPrefix, "Password must contain at least 6 characters including uppercase, lowercase, number, and special character.");

    try {
      const res = await fetch(`${backendUrl}/api/auth/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase(), password })
      });
      const data = await res.json();
      
      if (res.ok) {
        localStorage.setItem('token', data.token);
        isLoggedIn = true;
        updateUI();
        modal.style.display = 'none';
        clearFormsAndErrors();
        alert(`Successfully ${endpoint === 'register' ? 'signed up' : 'logged in'}!`);
        pendingAction = null; 
      } else {
        showValidationError(formPrefix, data.msg);
      }
    } catch (err) {
      showValidationError(formPrefix, "Could not connect to backend server.");
    }
  };

  signupForm.onsubmit = (e) => handleAuth(e, 'register', 'signup');
  loginForm.onsubmit = (e) => handleAuth(e, 'login', 'login');

  document.getElementById('logout-btn').onclick = () => {
    localStorage.removeItem('token');
    isLoggedIn = false;
    updateUI();
  };
});