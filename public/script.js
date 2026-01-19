// ==========================================
// 1. CONFIGURATION & API BASE URL
// ==========================================
const API_BASE_URL = "https://poweri-compliance-portal.onrender.com/api";
const AUTH_URL = `${API_BASE_URL}/auth`; 

// ==========================================
// 2. LANGUAGE DICTIONARY & LOGIC
// ==========================================
const translations = {
    en: {
        missionTitle: "Our Mission",
        missionText: "Our Mission is to simplify Electricity Compliances, Ground level clarity, and complex specific data finding. We currently operate in Chhattisgarh, providing transparent, realistic data on power connectivity.",
        welcomeTitle: "Welcome to PowerI.in",
        welcomeText: "Verifiable and practical data regarding industrial power connectivity."
    },
    hi: {
        missionTitle: "हमारा लक्ष्य (Mission)",
        missionText: "हमारा मिशन बिजली अनुपालन, जमीनी स्तर की स्पष्टता और डेटा खोजने की समस्या को सरल बनाना है। हम छत्तीसगढ़ के औद्योगिक विकास के लिए समर्पित हैं।",
        welcomeTitle: "PowerI.in में स्वागत है",
        welcomeText: "बिजली कनेक्टिविटी के संबंध में स्पष्ट और व्यावहारिक डेटा के लिए आपका विश्वसनीय स्रोत।"
    }
};

function toggleLanguage() {
    const langSelect = document.getElementById('languageSelect');
    if (!langSelect) return;
    
    const lang = langSelect.value;
    localStorage.setItem('userLanguage', lang); 
    const data = translations[lang];

    const mTitle = document.querySelector('.mission-section h2');
    const mText = document.getElementById('mission-text');
    const wTitle = document.querySelector('.welcome-container h3');
    const wText = document.querySelector('.welcome-container p');

    if (mTitle) mTitle.innerText = data.missionTitle;
    if (mText) mText.innerText = data.missionText;
    if (wTitle) wTitle.innerText = data.welcomeTitle;
    if (wText) wText.innerText = data.welcomeText;
}

// ==========================================
// 3. AUTH MODAL & UI TOGGLES
// ==========================================
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

// Function to handle switching between Login and Signup tabs
function toggleAuth(mode) {
    // Get references to the button and the form sections
    const submitBtn = document.getElementById("auth-submit-btn");
    const loginTab = document.getElementById("tab-login");
    const signupTab = document.getElementById("tab-signup");
    const signupFields = document.querySelectorAll(".signup-only");
    const privacyCheckbox = document.getElementById("privacy-check-new");

    if (mode === 'login') {
        // 1. Activate Login Tab Styling
        loginTab.classList.add("active");
        signupTab.classList.remove("active");
        
        // 2. Hide Signup-specific fields
        signupFields.forEach(el => el.style.display = "none");
        
        // 3. IMPORTANT: Login button is ALWAYS enabled
        submitBtn.innerText = "LOGIN";
        submitBtn.disabled = false;
        submitBtn.style.opacity = "1";
        submitBtn.style.cursor = "pointer";
        
    } else {
        // 1. Activate Signup Tab Styling
        signupTab.classList.add("active");
        loginTab.classList.remove("active");
        
        // 2. Show Signup-specific fields
        signupFields.forEach(el => el.style.display = "block");
        
        // 3. IMPORTANT: Reset checkbox and DISABLE button initially
        submitBtn.innerText = "CONTINUE";
        privacyCheckbox.checked = false; // Uncheck box
        validateSignup(); // Run validation to disable button
    }
}

// Function to enable/disable button based on Checkbox
function validateSignup() {
    const privacyCheckbox = document.getElementById("privacy-check-new");
    const submitBtn = document.getElementById("auth-submit-btn");
    
    // Only run this logic if we are actually in "Signup" mode (button says CONTINUE)
    if (submitBtn.innerText === "CONTINUE") {
        if (privacyCheckbox.checked) {
            submitBtn.disabled = false;
            submitBtn.style.opacity = "1";
            submitBtn.style.cursor = "pointer";
        } else {
            submitBtn.disabled = true;
            submitBtn.style.opacity = "0.5";
            submitBtn.style.cursor = "not-allowed";
        }
    }
}

// ==========================================
// 4. MONGODB AUTHENTICATION
// ==========================================
async function processAuth(e) {
    e.preventDefault();
    const activeTab = document.querySelector('.tab-link.active');
    
    const submitBtn = document.getElementById('auth-submit-btn');
    const originalText = submitBtn.innerText;
    submitBtn.innerText = "Connecting...";
    submitBtn.disabled = true;

    if (activeTab && activeTab.id === 'tab-signup') {
        await handleSignup();
    } else {
        await handleLogin();
    }
    
    submitBtn.innerText = originalText;
    submitBtn.disabled = false;
}

async function handleSignup() {
    const user = {
        name: document.getElementById('reg-name').value,
        mobile: document.getElementById('reg-mobile').value,
        company: document.getElementById('reg-company').value,
        email: document.getElementById('auth-email').value.trim().toLowerCase(),
        location: document.getElementById('reg-location').value,
        password: document.getElementById('auth-pass').value
    };

    try {
        const response = await fetch(`${AUTH_URL}/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(user)
        });
        const data = await response.json();
        if (response.ok) {
            alert('✅ Success! Welcome to PowerI. Please login now.');
            toggleAuth('login');
        } else {
            alert('❌ Signup Error: ' + data.msg);
        }
    } catch (error) {
        alert('❌ Server is waking up (Render delay). Please try again in 30 seconds.');
    }
}

async function handleLogin() {
    const email = document.getElementById('auth-email').value.trim().toLowerCase();
    const password = document.getElementById('auth-pass').value;

    try {
        const response = await fetch(`${AUTH_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('poweri_user', JSON.stringify(data.user));
            
            alert("✅ Login Successful!");
            closeAuthModal();
            
            // Instantly update the home page UI
            showDashboard(data.user.name);
            
            // Redirect to workspace
            window.location.assign("./dashboard.html");
        } else {
            alert("❌ Login Failed: " + (data.msg || "Invalid Credentials"));
        }
    } catch (error) {
        alert("❌ Render server is starting up. Please click Login again in 1 minute.");
    }
}

// ==========================================
// 5. UI UPDATES & SESSION
// ==========================================
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
    // Make the workspace entry point visible
    if (dashAccess) dashAccess.style.display = 'block';
}

function logout() {
    localStorage.clear();
    alert("Logged out successfully!");
    window.location.href = "index.html";
}

// ==========================================
// 6. FAQ & ACCORDION
// ==========================================
function toggleAnswer(btn) {
    const panel = btn.nextElementSibling;
    const span = btn.querySelector("span");
    
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

// ==========================================
// 7. INITIALIZATION
// ==========================================
window.onload = function() {
    // Check if user is already logged in
    const savedUser = localStorage.getItem('poweri_user');
    if (savedUser) {
        try {
            const user = JSON.parse(savedUser);
            showDashboard(user.name);
        } catch (e) {
            localStorage.removeItem('poweri_user');
        }
    }
    
    // Attach form listener
    const authForm = document.getElementById('authForm');
    if(authForm) authForm.onsubmit = processAuth;

    // Load language
    const savedLang = localStorage.getItem('userLanguage');
    if (savedLang && document.getElementById('languageSelect')) {
        document.getElementById('languageSelect').value = savedLang;
        toggleLanguage();
    }
};

