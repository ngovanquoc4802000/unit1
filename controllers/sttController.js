import { spawn, exec } from "child_process";
import { PYTHON_EXE, STT_SCRIPT } from "../config/constants.js";
import broadcast from "../utils/broadcart.js";

let sttProc = null;

export function startSTT(wss) {
  return async (req, res) => {
    const { mode = "답변" } = req.body || {};
    if (sttProc) {
      return res.status(400).json({ error: "이미 STT 실행 중입니다." });
    }

    try {
      sttProc = spawn(PYTHON_EXE, [STT_SCRIPT, mode], { windowsHide: true });

      sttProc.stdout.on("data", (chunk) => {
        const text = chunk.toString("utf8").trim();
        broadcast(wss, { type: "stt", text });
      });

      sttProc.stderr.on("data", (chunk) => {
        const text = chunk.toString("utf8").trim();
        broadcast(wss, { type: "stt_err", text });
      });

      sttProc.on("close", (code) => {
        broadcast(wss, { type: "info", message: `STT 종료(code=${code})` });
        sttProc = null;
      });

      res.json({ ok: true, message: "STT 시작함", mode });
    } catch (e) {
      sttProc = null;
      res.status(500).json({ error: e.message });
    }
  };
}

export async function stopSTT(req, res) {
  if (!sttProc) return res.json({ ok: true, message: "이미 종료됨" });

  try {
    if (process.platform === "win32") {
      exec(`taskkill /PID ${sttProc.pid} /T /F`, () => {});
    } else {
      sttProc.kill("SIGKILL");
    }
    sttProc = null;
    res.json({ ok: true, message: "STT 프로세스 강제 종료 요청됨" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
