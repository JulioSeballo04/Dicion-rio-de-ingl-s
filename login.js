// ✅ Firebase config e inicialização PRIMEIRO (antes de qualquer uso)
const firebaseConfig = {
    apiKey: "AIzaSyAQ0175U_iU86mz78j4mCmGQ7GrEGpaLW4",
    authDomain: "dictionary-appweb.firebaseapp.com",
    projectId: "dictionary-appweb",
    appId: "1:836256754010:web:f78a22dc0b06a8b3732b63"
};

// ✅ CORRIGIDO: inicializa apenas se ainda não foi inicializado
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();

// ---------------- SLIDER ----------------

const slider = document.getElementById("slider");
const goSignup = document.getElementById("goSignup");
const goLogin = document.getElementById("goLogin");

goSignup.onclick = (e) => {
    e.preventDefault();
    slider.style.transform = "translateX(-420px)";
};

goLogin.onclick = (e) => {
    e.preventDefault();
    slider.style.transform = "translateX(0)";
};

// ---------------- LOGIN ----------------

function login() {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!email || !password) {
        showError("Preencha todos os campos!");
        return;
    }

    auth.signInWithEmailAndPassword(email, password)
        .then(() => {
            window.location.href = "dictionary.html";
        })
        .catch(error => {
            console.error("ERRO LOGIN:", error);
            showError(error.message);
        });
}

// ---------------- SIGNUP ----------------

function signup() {
    const firstName = document.getElementById("firstName").value.trim();
    const lastName = document.getElementById("lastName").value.trim();
    const email = document.getElementById("signupEmail").value.trim();
    const password = document.getElementById("signupPassword").value.trim();
    const confirmPassword = document.getElementById("confirmPassword").value.trim();

    if (!firstName || !lastName) {
        showError("Por favor, preencha o nome e sobrenome.");
        return;
    }

    if (!email || !password) {
        showError("Por favor, preencha o e-mail e a senha.");
        return;
    }

    if (password !== confirmPassword) {
        showError("As senhas não coincidem!");
        return;
    }

    if (password.length < 6) {
        showError("A senha deve ter pelo menos 6 caracteres.");
        return;
    }

    auth.createUserWithEmailAndPassword(email, password)
        .then(userCredential => {
            // ✅ CORRIGIDO: salva nome e sobrenome no perfil do Firebase
            return userCredential.user.updateProfile({
                displayName: `${firstName} ${lastName}`
            });
        })
        .then(() => {
            window.location.href = "dictionary.html";
        })
        .catch(error => {
            showError("Erro ao criar conta: " + error.message);
        });
}

// ---------------- GOOGLE LOGIN ----------------

function loginGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();

    auth.signInWithPopup(provider)
        .then(() => {
            window.location.href = "dictionary.html";
        })
        .catch(error => {
            console.error(error);
            showError(error.message);
        });
}

// ---------------- HELPER: MOSTRAR ERRO ----------------

function showError(msg) {
    // Remove erros anteriores
    const existingErrors = document.querySelectorAll(".error-msg");
    existingErrors.forEach(el => el.remove());

    const div = document.createElement("div");
    div.className = "error-msg";
    div.innerText = msg;
    div.style.cssText = `
        background: #fee2e2;
        color: #991b1b;
        padding: 10px;
        margin-bottom: 10px;
        border-radius: 8px;
        font-size: 0.9rem;
        text-align: center;
    `;

    // Insere no form ativo (login ou signup)
    const activeForm = slider.style.transform === "translateX(-420px)"
        ? document.querySelector(".signup")
        : document.querySelector(".login");

    activeForm.prepend(div);

    setTimeout(() => div.remove(), 4000);
}