const functions = require("firebase-functions");
const admin = require("firebase-admin");
const sgMail = require("@sendgrid/mail");

admin.initializeApp();

// 環境変数に SENDGRID_API_KEY を設定してください
sgMail.setApiKey(process.env.SENDGRID_API_KEY || "");

exports.sendVerificationEmail = functions.https.onCall(async (data, context) => {
  const { email, displayName } = data || {};
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Authentication required");
  }
  if (!email) {
    throw new functions.https.HttpsError("invalid-argument", "email is required");
  }

  // メール検証リンク生成
  const actionCodeSettings = {
    url: "https://kanta02cer.github.io/JAA.HP/admin/news-console.html",
    handleCodeInApp: false,
  };

  let link = await admin.auth().generateEmailVerificationLink(email, actionCodeSettings);
  try {
    const u = new URL(link);
    u.searchParams.set('lang', 'ja');
    link = u.toString();
  } catch (e) {
    // ignore URL parse error
  }

  const msg = {
    to: email,
    from: { email: "no-reply@jaa-ambassadors.jp", name: "日本学生アンバサダー協会" },
    subject: "【重要】メールアドレスの確認をお願いします",
    text: [
      `${displayName || "ご担当者"} 様`,
      "",
      "下記のリンクからメールアドレスの確認を完了してください。",
      link,
      "",
      "本メールは送信専用です。ご不明点はサイトの問い合わせ窓口へご連絡ください。",
    ].join("\n"),
    html: `
      <p>${displayName || "ご担当者"} 様</p>
      <p>下記ボタンからメールアドレスの確認を完了してください。</p>
      <p><a href="${link}" style="display:inline-block;padding:12px 20px;background:#f97316;color:#fff;text-decoration:none;border-radius:6px;">メールアドレスを確認する</a></p>
      <p>もしボタンが機能しない場合は、次のURLをコピーしてブラウザに貼り付けてください：</p>
      <p><a href="${link}">${link}</a></p>
      <hr />
      <p style="font-size:12px;color:#6b7280;">このメールは送信専用です。お問い合わせはサイトの「お問い合わせ」からお願いします。</p>
    `,
    headers: {
      'List-Unsubscribe': '<mailto:unsubscribe@jaa-ambassadors.jp>, <https://jaa-ambassadors.jp/unsubscribe>'
    },
    trackingSettings: {
      clickTracking: { enable: false, enableText: false },
      openTracking: { enable: false }
    },
  };

  if (!process.env.SENDGRID_API_KEY) {
    console.warn("SENDGRID_API_KEY not set. Skipping actual send.");
    return { ok: true, simulated: true };
  }

  await sgMail.send(msg);
  return { ok: true };
});


