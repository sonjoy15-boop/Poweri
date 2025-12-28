// --- 1. LANGUAGE DICTIONARY --- (Keep as is)
const translations = {
    en: {
        missionTitle: "Our Mission",
        missionText: "Our Mission is to simplify Electricity Compliances, Ground level clarity, complex specific data finding problem. We currently operate in Chhattisgarh, one of India's largest producing states for cement, steel, and power.",
        welcomeTitle: "Welcome to PowerI.in",
        welcomeText: "We are dedicated to translating this operational experience into clear, verifiable, and practical data regarding power connectivity."
    },
    hi: {
        missionTitle: "हमारा लक्ष्य (Mission)",
        missionText: "हमारा मिशन बिजली अनुपालन, जमीनी स्तर की स्पष्टता और जटिल विशिष्ट डेटा खोजने की समस्या को सरल बनाना है। हम वर्तमान में छत्तीसगढ़ में काम करते हैं, जो सीमेंट, स्टील और बिजली के लिए भारत के सबसे बड़े उत्पादक राज्यों में से एक है।",
        welcomeTitle: "PowerI.in में स्वागत है",
        welcomeText: "हम इस परिचालन अनुभव को बिजली कनेक्टिविटी के संबंध में स्पष्ट, सत्यापन योग्य और व्यावहारिक डेटा में अनुवाद करने के लिए समर्पित हैं।"
    }
};

function toggleLanguage() {
    const lang = document.getElementById('languageSelect').value;
    const data = translations[lang];
    document.querySelector('.mission-section h2').innerText = data.missionTitle;
    document.getElementById('mission-text').innerText = data.missionText;
    document.querySelector('.welcome-container h3').innerText = data.welcomeTitle;
    document.querySelector('.welcome-container p').innerText = data.welcomeText;
}

// --- 2. AUTH MODAL LOGIC --- (Keep as is)
function openAuthModal(mode) {
    document.getElementById('authModal').style.display = 'block';
    toggleAuth(mode);
}

function closeAuthModal() {
    document.getElementById('authModal').style.display = 'none';
}

function toggleAuth(mode) {
    const signupFields = document.querySelectorAll('.signup-only');
    const title = document.getElementById('modalTitle');
    const submitBtn = document.getElementById('auth-submit-btn');
    const tabLogin = document.getElementById('tab-login');
    const tabSignup = document.getElementById('tab-signup');

    if (mode === 'signup') {
        signupFields.forEach(el => el.style.display = 'block');
        title.innerText = "Create Account";
        submitBtn.innerText = "SIGN UP";
        tabSignup.classList.add('active');
        tabLogin.classList.remove('active');
        validateSignup(); 
    } else {
        signupFields.forEach(el => el.style.display = 'none');
        title.innerText = "Welcome Back";
        submitBtn.innerText = "LOGIN";
        tabLogin.classList.add('active');
        tabSignup.classList.remove('active');
        submitBtn.disabled = false;
    }
}

function validateSignup() {
    const checkBox = document.getElementById('privacy-check-new');
    const submitBtn = document.getElementById('auth-submit-btn');
    const activeTab = document.querySelector('.tab-link.active');
    if (activeTab && activeTab.id === 'tab-signup') {
        submitBtn.disabled = !checkBox.checked;
    }
}

// --- 3. MONGODB AUTH LOGIC --- 
async function processAuth(e) {
    e.preventDefault();
    const activeTab = document.querySelector('.tab-link.active').id;
    if (activeTab === 'tab-signup') {
        await handleSignup();
    } else {
        await handleLogin();
    }
}

async function handleSignup() {
    const user = {
        name: document.getElementById('reg-name').value,
        mobile: document.getElementById('reg-mobile').value,
        company: document.getElementById('reg-company').value,
        email: document.getElementById('auth-email').value,
        location: document.getElementById('reg-location').value,
        password: document.getElementById('auth-pass').value
    };

    try {
        const response = await fetch('http://localhost:5000/api/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(user)
        });
        const data = await response.json();
        if (response.ok) {
            alert('✅ Signup Successful!');
            toggleAuth('login');
        } else {
            alert('❌ Signup Failed: ' + (data.msg || data.error));
        }
    } catch (error) {
        alert('❌ Connection Error with MongoDB Server.');
    }
}

async function handleLogin() {
    const emailField = document.getElementById('auth-email');
    const passField = document.getElementById('auth-pass');
    if (!emailField || !passField) return;

    const loginData = { email: emailField.value, password: passField.value };

    try {
        const response = await fetch('http://localhost:5000/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(loginData)
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('poweri_user', JSON.stringify(data.user));
            localStorage.setItem('user', JSON.stringify({ name: data.user.name, email: data.user.email }));

            alert("✅ Login Successful!");
            closeAuthModal();
            showDashboard(data.user.name);
        } else {
            alert("❌ Login Failed: " + (data.msg || "Invalid Credentials"));
        }
    } catch (error) {
        console.error("Login Error:", error);
        alert("❌ Server Error.");
    }
}

// --- 4. DASHBOARD & UI STATE (Updated for Separate Dashboard Page) ---
function showDashboard(userName) {
    // 1. Update Header UI (Show user profile, hide login/signup)
    const authBtns = document.getElementById('auth-btns');
    const profile = document.getElementById('user-profile');
    const nameDisplay = document.getElementById('userName');

    if (authBtns) authBtns.style.display = 'none';
    if (profile) {
        profile.style.display = 'flex';
        if (nameDisplay) nameDisplay.innerText = userName;
    }

    // 2. Show the "Enter Dashboard" button in the Mission Section
    const dashAccess = document.getElementById('dashboard-access');
    if (dashAccess) {
        dashAccess.style.display = 'block';
    }

    // 3. Optional: Redirect immediately to separate page if just logged in
    // Uncomment the line below if you want automatic redirect after login click
    // window.location.href = "Dashboard.html"; 
}

// Keep this for when the user is actually ON the Dashboard.html page
function toggleDashboardCat(button) {
    const content = button.nextElementSibling;
    const icon = button.querySelector('i');
    
    document.querySelectorAll('.cat-content').forEach(c => {
        if (c !== content) c.style.display = "none";
    });
    
    if (content.style.display === "block") {
        content.style.display = "none";
        icon.className = "fas fa-chevron-down";
    } else {
        content.style.display = "block";
        icon.className = "fas fa-chevron-up";
    }
}

function logout() {
    localStorage.clear();
    alert("Logged out successfully!");
    window.location.href = "index.html";
}

// --- 6. INITIALIZATION (Updated) ---
window.onload = function() {
    // Handle Language persistence
    const savedLang = localStorage.getItem('userLanguage');
    if (savedLang && document.getElementById('languageSelect')) {
        document.getElementById('languageSelect').value = savedLang;
        toggleLanguage();
    }

    // Handle Login State persistence
    const savedUser = localStorage.getItem('poweri_user');
    if (savedUser) {
        const user = JSON.parse(savedUser);
        showDashboard(user.name);
    }
};

// --- 7. COMMUNITY DRAWER ---
(function() {
    const initCommunityDrawer = () => {
        const communityBtn = document.getElementById('communityBtn');
        const drawer = document.getElementById('communityDrawer');
        const overlay = document.getElementById('communityOverlay');
        const drawerClose = document.getElementById('drawerClose');

        if (!communityBtn || !drawer || !overlay) return;

        communityBtn.onclick = (e) => {
            e.preventDefault();
            drawer.classList.add('open');
            overlay.classList.add('show');
        };

        const close = () => {
            drawer.classList.remove('open');
            overlay.classList.remove('show');
        };

        if (drawerClose) drawerClose.onclick = close;
        overlay.onclick = close;
    };
    initCommunityDrawer();
})();
function checkAuthAndPost() {
    const user = localStorage.getItem('poweri_user');
    if (!user) {
        alert("Please Login to post comments or questions.");
        openAuthModal('login');
    } else {
        alert("Post feature coming soon for verified industrial users!");
    }
}

// Add this to handle your FAQ accordion
function toggleAnswer(btn) {
    const panel = btn.nextElementSibling;
    const span = btn.querySelector("span");
    
    // Toggle active state for styling
    btn.classList.toggle("active");

    if (panel.style.maxHeight) {
        panel.style.maxHeight = null;
        span.innerText = "+";
    } else {
        // Close other panels first (Optional: Accordion behavior)
        document.querySelectorAll('.answer-panel').forEach(p => p.style.maxHeight = null);
        document.querySelectorAll('.question-btn span').forEach(s => s.innerText = "+");

        panel.style.maxHeight = panel.scrollHeight + "px";
        span.innerText = "-";
    }
}
function toggleLanguage() {
    const lang = document.getElementById('languageSelect').value;
    localStorage.setItem('userLanguage', lang); // ADD THIS LINE
    const data = translations[lang];
    // ... rest of your code
}