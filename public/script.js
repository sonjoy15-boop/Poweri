// --- 1. LANGUAGE DICTIONARY ---
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
    localStorage.setItem('userLanguage', lang); 
    const data = translations[lang];
    
    // Update text content with safety checks
    const mTitle = document.querySelector('.mission-section h2');
    const mText = document.getElementById('mission-text');
    const wTitle = document.querySelector('.welcome-container h3');
    const wText = document.querySelector('.welcome-container p');

    if (mTitle) mTitle.innerText = data.missionTitle;
    if (mText) mText.innerText = data.missionText;
    if (wTitle) wTitle.innerText = data.welcomeTitle;
    if (wText) wText.innerText = data.welcomeText;
}

// --- 2. AUTH MODAL LOGIC ---
function openAuthModal(mode) {
    const modal = document.getElementById('authModal');
    if (modal) {
        modal.style.display = 'block';
        toggleAuth(mode);
    }
}

function closeAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) modal.style.display = 'none';
}

function toggleAuth(mode) {
    const signupFields = document.querySelectorAll('.signup-only');
    const title = document.getElementById('modalTitle');
    const submitBtn = document.getElementById('auth-submit-btn');
    const tabLogin = document.getElementById('tab-login');
    const tabSignup = document.getElementById('tab-signup');

    if (mode === 'signup') {
        signupFields.forEach(el => el.style.display = 'block');
        if (title) title.innerText = "Create Account";
        if (submitBtn) submitBtn.innerText = "SIGN UP";
        if (tabSignup) tabSignup.classList.add('active');
        if (tabLogin) tabLogin.classList.remove('active');
        validateSignup(); 
    } else {
        signupFields.forEach(el => el.style.display = 'none');
        if (title) title.innerText = "Welcome Back";
        if (submitBtn) submitBtn.innerText = "LOGIN";
        if (tabLogin) tabLogin.classList.add('active');
        if (tabSignup) tabSignup.classList.remove('active');
        if (submitBtn) submitBtn.disabled = false;
    }
}

function validateSignup() {
    const checkBox = document.getElementById('privacy-check-new');
    const submitBtn = document.getElementById('auth-submit-btn');
    const activeTab = document.querySelector('.tab-link.active');
    if (activeTab && activeTab.id === 'tab-signup' && submitBtn) {
        submitBtn.disabled = checkBox ? !checkBox.checked : false;
    }
}

// --- 3. MONGODB AUTH LOGIC (Updated to Render URL) ---
const API_BASE_URL = "https://poweri-compliance-portal.onrender.com/api";

async function processAuth(e) {
    e.preventDefault();
    const activeTab = document.querySelector('.tab-link.active');
    if (!activeTab) return;

    if (activeTab.id === 'tab-signup') {
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
        const response = await fetch(`${API_BASE_URL}/signup`, {
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
        console.error("Signup Error:", error);
        alert('❌ Connection Error with Server.');
    }
}

async function handleLogin() {
    const emailField = document.getElementById('auth-email');
    const passField = document.getElementById('auth-pass');
    if (!emailField || !passField) return;

    const loginData = { email: emailField.value, password: passField.value };

    try {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(loginData)
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('poweri_user', JSON.stringify(data.user));
            // Standardizing storage keys
            localStorage.setItem('user', JSON.stringify({ name: data.user.name, email: data.user.email }));

            alert("✅ Login Successful!");
            closeAuthModal();
            showDashboard(data.user.name);
            
            // Auto-redirect if specifically desired
            // window.location.href = "Dashboard.html"; 
        } else {
            alert("❌ Login Failed: " + (data.msg || "Invalid Credentials"));
        }
    } catch (error) {
        console.error("Login Error:", error);
        alert("❌ Server Error: Unable to reach the service.");
    }
}

// --- 4. DASHBOARD & UI STATE ---
function showDashboard(userName) {
    const authBtns = document.getElementById('auth-btns');
    const profile = document.getElementById('user-profile');
    const nameDisplay = document.getElementById('userName');
    const dashAccess = document.getElementById('dashboard-access');

    if (authBtns) authBtns.style.display = 'none';
    if (profile) {
        profile.style.display = 'flex';
        if (nameDisplay) nameDisplay.innerText = userName;
    }
    if (dashAccess) {
        dashAccess.style.display = 'block';
    }
}

function toggleDashboardCat(button) {
    const content = button.nextElementSibling;
    const icon = button.querySelector('i');
    
    document.querySelectorAll('.cat-content').forEach(c => {
        if (c !== content) c.style.display = "none";
    });
    
    if (content.style.display === "block") {
        content.style.display = "none";
        if (icon) icon.className = "fas fa-chevron-down";
    } else {
        content.style.display = "block";
        if (icon) icon.className = "fas fa-chevron-up";
    }
}

function logout() {
    localStorage.clear();
    alert("Logged out successfully!");
    window.location.href = "index.html";
}

// --- 5. COMMUNITY DRAWER ---
function initCommunityDrawer() {
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
}

function checkAuthAndPost() {
    const user = localStorage.getItem('poweri_user');
    if (!user) {
        alert("Please Login to post comments or questions.");
        openAuthModal('login');
    } else {
        alert("Post feature coming soon for verified industrial users!");
    }
}

// --- 6. FAQ ACCORDION ---
function toggleAnswer(btn) {
    const panel = btn.nextElementSibling;
    const span = btn.querySelector("span");
    
    btn.classList.toggle("active");

    if (panel.style.maxHeight) {
        panel.style.maxHeight = null;
        if (span) span.innerText = "+";
    } else {
        document.querySelectorAll('.answer-panel').forEach(p => p.style.maxHeight = null);
        document.querySelectorAll('.question-btn span').forEach(s => s.innerText = "+");

        panel.style.maxHeight = panel.scrollHeight + "px";
        if (span) span.innerText = "-";
    }
}

// --- 7. INITIALIZATION ---
window.onload = function() {
    // 1. Initialize Community Drawer
    initCommunityDrawer();

    // 2. Handle Language persistence
    const savedLang = localStorage.getItem('userLanguage');
    if (savedLang && document.getElementById('languageSelect')) {
        document.getElementById('languageSelect').value = savedLang;
        toggleLanguage();
    }

    // 3. Handle Login State persistence
    const savedUser = localStorage.getItem('poweri_user');
    if (savedUser) {
        try {
            const user = JSON.parse(savedUser);
            showDashboard(user.name);
        } catch (e) {
            console.error("Error parsing saved user", e);
            localStorage.removeItem('poweri_user');
        }
    }
};
