import express from 'express';
import axios from 'axios';

export default function (wss, processAnswer_tr, mqttClient) {
  const router = express.Router();

  // Delphi의 transper와 동일한 엔드포인트
  router.post('/transper', async (req, res) => {
  try {
    console.log("📥 받은 요청 body =", req.body);

    // 들어오는 형식이 text/targetLang 일 수도 있음 → question/context 로 매핑
    let question = req.body?.question || req.body?.text || '';
    let context  = req.body?.context  || '';

    if (!question || question.trim() === '') {
      return res.status(400).json({ error: '질문이 비어있습니다 (Node.js에서 체크됨)' });
    }

    question = String(question).replace(/"/g, '\\"');
    context  = String(context).replace(/"/g, '\\"').replace(/\r?\n/g, '\\n');

    const jsonBody = { question, context };
    console.log("📤 번역 서버로 보낼 jsonBody =", jsonBody);

    const response = await axios.post(
      'http://211.237.0.235:8080/transper',
      jsonBody,
      { headers: { 'Content-Type': 'application/json; charset=UTF-8' } }
    );

    console.log("📥 번역 서버 응답 =", response.data);

    let answer =
      response.data.answer ||
      response.data.translation ||
      response.data.result?.answer ||
      response.data.error ||
      '서버에서 answer를 반환하지 않았습니다.';

    answer = answer.replace(/&nbsp;/gi, '');

    const payload = 'translation : ' + answer;
    mqttClient.publish('/1234/', payload, { qos: 0, retain: false });
    console.log("📤 MQTT 발행 완료:", payload);

    res.json({ answer });
  } catch (err) {
    console.error("❌ 번역 오류:", err.response?.data || err.message);
    res.status(err.response?.status || 500).json({ error: err.message });
  }
});

  return router;

}