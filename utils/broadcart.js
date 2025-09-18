function broadcast(wss, msgObj) {
  const data = JSON.stringify(msgObj);
  wss.clients.forEach((c) => {
    if (c.readyState === 1) c.send(data);
  });
}

export default broadcast;