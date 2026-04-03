const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const alphabetList = document.getElementById("alphabet");
const sidebar = document.getElementById("sidebar");
let current = null;

// Gerar Alfabeto
alphabet.forEach(letter => {
    const li = document.createElement("li");
    li.innerText = letter;
    li.onclick = () => {
        openLetter(letter);
        if (window.innerWidth <= 768) toggleSidebar();
    };
    alphabetList.appendChild(li);
});

function toggleSidebar() {
    sidebar.classList.toggle("active");
}

function showAlphabetMobile() {
    const list = document.getElementById("alphabet");
    list.style.display = (list.style.display === "none" || list.style.display === "") ? "grid" : "none";
}

function goHome() {
    current = null;
    document.getElementById("homeView").style.display = "block";
    document.getElementById("editorView").style.display = "none";
    document.getElementById("backBtn").style.display = "none";
}

function openLetter(letter) {
    current = letter;
    showEditor(letter, true);
    loadWords();
}

function openRules() {
    current = "rules";
    showEditor("Grammar Rules", false);
    loadRules();
}

function showEditor(titleText, isLetter) {
    document.getElementById("homeView").style.display = "none";
    document.getElementById("editorView").style.display = "block";
    document.getElementById("backBtn").style.display = "block";

    document.getElementById("title").innerText = isLetter
        ? "Letter " + titleText
        : titleText;

    document.getElementById("wordInputs").style.display = isLetter ? "flex" : "none";
    document.getElementById("ruleInputs").style.display = isLetter ? "none" : "flex";
}

// ---------------- WORDS ----------------

async function saveWord() {
    const wordInput = document.getElementById("word");
    const meaningInput = document.getElementById("meaning");
    const message = document.getElementById("message");
    const saveBtn = document.getElementById("saveBtn");

    const word = wordInput.value.trim();
    const meaning = meaningInput.value.trim();

    if (!word || !meaning) {
        message.style.color = "orange";
        message.textContent = "⚠️ Preencha a palavra e a tradução.";
        return;
    }

    const data = JSON.parse(localStorage.getItem(current)) || [];

    // Verifica duplicata
    const duplicate = data.find(item => item.word.toLowerCase() === word.toLowerCase());
    if (duplicate) {
        message.style.color = "red";
        message.textContent = `⚠️ "${word}" já está salva nesta letra.`;
        return;
    }

    // Gera exemplos via servidor proxy
    message.style.color = "#6366f1";
    message.textContent = "✨ Gerando exemplos com IA...";
    if (saveBtn) saveBtn.disabled = true;

    try {
        const examples = await gerarExemplos(word, meaning);

        data.push({ word, meaning, examples });
        localStorage.setItem(current, JSON.stringify(data));

        wordInput.value = "";
        meaningInput.value = "";
        message.style.color = "green";
        message.textContent = "✅ Palavra salva com exemplos!";
        setTimeout(() => { message.textContent = ""; }, 3000);

        loadWords();

    } catch (err) {
        console.error(err);
        // Salva sem exemplos se o servidor não estiver rodando
        data.push({ word, meaning, examples: [] });
        localStorage.setItem(current, JSON.stringify(data));
        wordInput.value = "";
        meaningInput.value = "";
        message.style.color = "orange";
        message.textContent = "⚠️ Salvo sem exemplos. Verifique se o servidor está rodando.";
        setTimeout(() => { message.textContent = ""; }, 5000);
        loadWords();
    } finally {
        if (saveBtn) saveBtn.disabled = false;
    }
}

// ---------------- PROXY: GERAR EXEMPLOS ----------------

async function gerarExemplos(word, meaning) {
    // Chama o servidor Node local (proxy seguro para a Anthropic)
    const response = await fetch("http://localhost:3000/generate-examples", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word, translation: meaning })
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Erro no servidor");
    }

    const data = await response.json();
    return data.examples;
}

// ---------------- RENDERIZAR TABELA ----------------

function loadWords() {
    const data = JSON.parse(localStorage.getItem(current)) || [];
    const div = document.getElementById("output");

    if (data.length === 0) {
        div.innerHTML = "<p style='text-align:center; padding: 20px; color: #94a3b8;'>No words saved.</p>";
        return;
    }

    let html = `<table>
        <colgroup>
            <col style="width: 14%">
            <col style="width: 14%">
            <col style="width: 58%">
            <col style="width: 14%">
        </colgroup>
        <tr><th>Word</th><th>Meaning</th><th>Examples</th><th>Action</th></tr>`;

    data.forEach((item, i) => {
        let examplesHtml = "<em style='color:#94a3b8;'>No examples</em>";
        if (item.examples && item.examples.length > 0) {
            examplesHtml = `<ol style="margin:0; padding-left:18px; font-size:0.9rem; color:#374151;">
                ${item.examples.map(e => `<li style="margin-bottom:4px;">${e}</li>`).join("")}
            </ol>`;
        }

        html += `
        <tr>
            <td><strong>${item.word}</strong></td>
            <td>${item.meaning}</td>
            <td>${examplesHtml}</td>
            <td class="action-btns">
                <button class="btn-edit" onclick="editWord(${i})" title="Editar">✎</button>
                <button class="btn-delete" onclick="deleteWord(${i})" title="Excluir">✕</button>
            </td>
        </tr>`;
    });

    html += "</table>";
    div.innerHTML = html;
}

function editWord(i) {
    const data = JSON.parse(localStorage.getItem(current));
    const w = prompt("Editar palavra:", data[i].word);
    const m = prompt("Editar significado:", data[i].meaning);

    if (w && m) {
        data[i] = { word: w, meaning: m, examples: data[i].examples || [] };
        localStorage.setItem(current, JSON.stringify(data));
        loadWords();
    }
}

function deleteWord(i) {
    if (!confirm("Excluir esta palavra?")) return;
    const data = JSON.parse(localStorage.getItem(current));
    data.splice(i, 1);
    localStorage.setItem(current, JSON.stringify(data));
    loadWords();
}

// ---------------- RULES ----------------

function saveRule() {
    const title = document.getElementById("ruleTitle").value.trim();
    const desc = document.getElementById("ruleDesc").value.trim();
    if (!title || !desc) return;

    const data = JSON.parse(localStorage.getItem("rules")) || [];
    data.push({ title, desc });
    localStorage.setItem("rules", JSON.stringify(data));

    document.getElementById("ruleTitle").value = "";
    document.getElementById("ruleDesc").value = "";
    loadRules();
}

function loadRules() {
    const data = JSON.parse(localStorage.getItem("rules")) || [];
    const div = document.getElementById("output");

    if (data.length === 0) {
        div.innerHTML = "<p style='text-align:center; padding: 20px; color: #94a3b8;'>No rules saved.</p>";
        return;
    }

    let html = `<table>
        <tr><th>Title</th><th>Description</th><th>Action</th></tr>`;

    data.forEach((r, i) => {
        html += `
        <tr>
            <td><strong>${r.title}</strong></td>
            <td>${r.desc}</td>
            <td class="action-btns">
                <button class="btn-edit" onclick="editRule(${i})">✎</button>
                <button class="btn-delete" onclick="deleteRule(${i})">✕</button>
            </td>
        </tr>`;
    });

    html += "</table>";
    div.innerHTML = html;
}

function editRule(i) {
    const data = JSON.parse(localStorage.getItem("rules"));
    document.getElementById("ruleTitle").value = data[i].title;
    document.getElementById("ruleDesc").value = data[i].desc;
    deleteRule(i);
}

function deleteRule(i) {
    const data = JSON.parse(localStorage.getItem("rules"));
    data.splice(i, 1);
    localStorage.setItem("rules", JSON.stringify(data));
    loadRules();
}

// ---------------- AUTH FIREBASE ----------------

const firebaseConfig = {
    apiKey: "AIzaSyAQ0175U_iU86mz78j4mCmGQ7GrEGpaLW4",
    authDomain: "dictionary-appweb.firebaseapp.com",
    projectId: "dictionary-appweb",
    appId: "1:836256754010:web:f78a22dc0b06a8b3732b63"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

firebase.auth().onAuthStateChanged(user => {
    if (!user) {
        window.location.href = "paginalogin.html";
    }
});

function logout() {
    firebase.auth().signOut()
        .then(() => { window.location.href = "paginalogin.html"; })
        .catch(error => { alert("Erro ao sair: " + error.message); });
}