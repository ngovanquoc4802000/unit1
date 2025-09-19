const chatEl = document.getElementById("chat");
const questionInput = document.getElementById("question");
const sendBtn = document.getElementById("sendBtn");

// ✅ WebSocket 연결 (서버에서 MQTT 메시지를 받아옴)
const socket = new WebSocket("ws://localhost:3000/stt");

socket.onopen = () => {
  console.log("✅ WebSocket connected");
};

// 서버에서 MQTT 메시지를 받아서 채팅창에 표시
socket.onmessage = (event) => {
  const data = JSON.parse(event.data);

  const div = document.createElement("div");
  div.classList.add("line");

  if (data.msg?.startsWith("Original")) {
    div.classList.add("original");
  } else if (data.msg?.startsWith("translation")) {
    div.classList.add("translation");
  } else if (data.type === "info") {
    div.classList.add("stt");
  }

  div.textContent = data.msg || data.message || "";
  chatEl.appendChild(div);
  chatEl.scrollTop = chatEl.scrollHeight;
};

// ✅ 질문 전송 → Node.js 서버에 REST API 호출
async function sendQuestion() {
  const text = questionInput.value.trim();
  if (!text) return;

  // 내가 보낸 질문 채팅창에 표시
  const qDiv = document.createElement("div");
  qDiv.className = "line me";
  qDiv.textContent = `나: ${text}`;
  chatEl.appendChild(qDiv);
  chatEl.scrollTop = chatEl.scrollHeight;

  questionInput.value = "";

  try {
    // 번역 모드 확인 (질문/번역)
    const mode = document.querySelector('input[name="mode"]:checked').value;

    // Node.js 서버의 API 호출
    const res = await fetch("/api/transper", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // 서버는 question/context 형식을 기대 → 변환
      body: JSON.stringify({ question: text, context: "", mode })
    });

    // 응답은 바로 쓰지 않고 MQTT 경유 → WebSocket 으로 채팅창에 뜸
    const data = await res.json();
    console.log("📥 API 응답 =", data);
  } catch (err) {
    const errDiv = document.createElement("div");
    errDiv.className = "line stt-err";
    errDiv.textContent = `Error: ${err.message}`;
    chatEl.appendChild(errDiv);
  }
}

// 버튼 클릭 / 엔터 입력 처리
sendBtn.addEventListener("click", sendQuestion);
questionInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendQuestion();
});
