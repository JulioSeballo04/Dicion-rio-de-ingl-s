import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// 🌐 Rota de teste
app.get("/", (req, res) => {
  res.send("API do dicionário está rodando 🚀");
});

// ✨ Rota proxy para Groq — gera frases de exemplo com IA
app.post("/generate-examples", async (req, res) => {
  const { word, translation } = req.body;

  if (!word || !translation) {
    return res.status(400).json({ error: "word e translation são obrigatórios" });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "GROQ_API_KEY não configurada no servidor" });
  }

  const prompt = `You are an English teacher helping Brazilian students learn English.
Generate exactly 3 simple, natural example sentences for the English word "${word}" (Portuguese translation: "${translation}").

Rules:
- Sentences must be simple and clear (A2/B1 level)
- Each sentence must use the word "${word}" naturally
- Return ONLY a raw JSON array of 3 strings, nothing else
- No markdown, no backticks, no explanation

Example output:
["Sentence one here.", "Sentence two here.", "Sentence three here."]`;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 300
      })
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Groq error:", err);
      return res.status(502).json({ error: "Erro na API do Groq" });
    }

    const data = await response.json();
    const text = data.choices[0].message.content.trim();

    // Remove possíveis backticks
    const clean = text.replace(/```json|```/g, "").trim();
    const examples = JSON.parse(clean);

    if (!Array.isArray(examples)) {
      return res.status(500).json({ error: "Resposta inválida da IA" });
    }

    res.json({ examples });

  } catch (err) {
    console.error("Erro interno:", err);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// 🚀 Iniciar servidor
app.listen(3000, () => {
  console.log("Servidor rodando em http://localhost:3000");
});