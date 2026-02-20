interface SendEmailParams {
  playerName: string;
  playerEmail: string;
  completionCode: string;
  gameName: string;
  rewardDescription: string;
}

export async function sendCompletionEmail(params: SendEmailParams) {
  const serviceId = process.env.EMAILJS_SERVICE_ID;
  const templateId = process.env.EMAILJS_TEMPLATE_ID;
  const publicKey = process.env.EMAILJS_PUBLIC_KEY;
  const privateKey = process.env.EMAILJS_PRIVATE_KEY;

  if (!serviceId || !templateId || !publicKey) {
    return;
  }

  const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "origin": "https://aplikace-centro-zlin.vercel.app",
    },
    body: JSON.stringify({
      service_id: serviceId,
      template_id: templateId,
      user_id: publicKey,
      accessToken: privateKey,
      template_params: {
        to_name: params.playerName,
        to_email: params.playerEmail,
        completion_code: params.completionCode,
        game_name: params.gameName,
        reward_description: params.rewardDescription,
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("EmailJS error:", text);
    throw new Error(`EmailJS error: ${text}`);
  }
}
