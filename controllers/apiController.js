import fetch from "node-fetch";
import dayjs from "dayjs";
import { getConnection } from "../config/db.js";
import { REMOTE_BASE } from "../config/constants.js";

// /api/ask
export async function ask(req, res) {
  const body = req.body || {};
  const question = (body.question || "").replace(/"/g, '\\"');

  try {
    // 1) Gửi câu hỏi nguyên bản sang /ask, không dịch
    const r = await fetch(`${REMOTE_BASE}/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=UTF-8" },
      body: JSON.stringify({ question, context: "" }),
    });

    let answer = await r.text();
    try {
      answer = JSON.parse(answer).answer || answer;
    } catch {}

    // 2) Trả về nguyên câu trả lời, giữ cùng ngôn ngữ với câu hỏi
    res.json({ question, answer });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
}

// /api/transper
export async function transper(req, res) {
  const body = req.body || {};
  const text = body.text || "";
  const targetLang = body.targetLang || "ko";

  try {
    // Gửi payload giống hệt frontend tới remote server
    const r = await fetch(`${REMOTE_BASE}/transper`, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=UTF-8" },
      body: JSON.stringify({ text, targetLang }),
    });

    console.log("DEBUG: remote headers:", [...r.headers.entries()]);

    const raw = await r.text();
    console.log("DEBUG: remote raw response:", raw); 

    let result = {};
    try {
      result = JSON.parse(raw);
    } catch (err) {
      console.error("❌ Không parse được JSON:", err);
    }

    console.log("DEBUG: remote JSON parsed:", result);

    // Map về key 'translation' thống nhất
    res.json({
      translation: result.translation || "",
    });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
}

// /api/summarize-and-save
export async function summarizeAndSave(req, res) {
  const { regno, cellno, lastQuestion } = req.body || {};
  if (!lastQuestion)
    return res.status(400).json({ error: "lastQuestion 가 없습니다." });

  try {
    // 1) summarize 호출
    const r = await fetch(`${REMOTE_BASE}/summarize`, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=UTF-8" },
      body: JSON.stringify({ question: lastQuestion }),
    });
    if (!r.ok) {
      const t = await r.text();
      return res.status(500).json({ error: `summarize 실패: ${t}` });
    }
    const { summary } = await r.json();

    // 2) DB 조회 및 3) INSERT
    const conn = await getConnection();
    try {
      const [rows] = await conn.query(
        `SELECT cuscd, cusnm FROM apcust WHERE regno = ? LIMIT 1`,
        [regno || ""]
      );
      const { cuscd = "", cusnm = "" } = rows[0] || {};

      const ydate = dayjs().format("YYYYMMDD");
      const ytime = dayjs().format("HHmmss");
      const ygb = "미주봇";
      const ycellno = cellno || "";

      await conn.query(
        `INSERT INTO cust_request (ydate, ytime, ycuscd, ygb, ymemo, ycusnm, ycellno, yempcd)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [ydate, ytime, cuscd, ygb, summary, cusnm, ycellno, ygb]
      );

      res.json({
        ok: true,
        message: "요청사항을 미주아이티에 등록하였습니다.",
        summary,
        cuscd,
        cusnm,
      });
    } finally {
      conn.release();
    }
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
}


