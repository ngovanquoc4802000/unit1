const chatEl = document.getElementById("chat");
const questionInput = document.getElementById("question");
const sendBtn = document.getElementById("sendBtn");

async function sendQuestion() {
  const text = questionInput.value.trim();
  if (!text) return;

  // Hiển thị văn bản gốc trên chat
  const qDiv = document.createElement('div');
  qDiv.className = 'chat-question';
  qDiv.textContent = `Quốc: ${text}`;
  chatEl.appendChild(qDiv);

  questionInput.value = '';
  chatEl.scrollTop = chatEl.scrollHeight;

  try {
    // Gọi API dịch thuật
    const res = await fetch('/api/transper', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, targetLang: 'ko' }) // mặc định dịch sang Hàn
    });

    const data = await res.json();

    const aDiv = document.createElement('div');
    aDiv.className = 'chat-answer';
    aDiv.textContent = `A: ${data.translation}`; // chỉ in bản dịch
    chatEl.appendChild(aDiv);
    chatEl.scrollTop = chatEl.scrollHeight;
  } catch (err) {
    const errDiv = document.createElement('div');
    errDiv.className = 'chat-error';
    errDiv.textContent = `Error: ${err.message}`;
    chatEl.appendChild(errDiv);
  }
}

sendBtn.addEventListener("click", sendQuestion);
questionInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendQuestion();
});