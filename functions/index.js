const functions = require("firebase-functions");
const admin = require("firebase-admin");
const sgMail = require("@sendgrid/mail");

admin.initializeApp();

// 環境変数に SENDGRID_API_KEY を設定してください
sgMail.setApiKey(process.env.SENDGRID_API_KEY || "");

// リージョンをサイト利用に近い asia-northeast1 に合わせる
exports.sendVerificationEmail = functions.region('asia-northeast1').https.onCall(async (data, context) => {
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

  const preheader = 'メールアドレス確認のご案内（日本学生アンバサダー協会）';
  const safeTextName = displayName || 'ご担当者';

  const html = `
  <!doctype html>
  <html lang="ja">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="Content-Language" content="ja" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>メールアドレスの確認</title>
    <style>
      /* できるだけインラインだが、最低限のリセット */
      body { margin:0; padding:0; background:#f5f7fb; }
      a { color:#f97316; text-decoration:none; }
      .btn { background:#f97316; color:#ffffff !important; padding:12px 20px; display:inline-block; border-radius:6px; font-weight:700; }
      .muted { color:#6b7280; font-size:12px; }
      .preheader { display:none !important; visibility:hidden; opacity:0; color:transparent; height:0; width:0; overflow:hidden; mso-hide:all; }
    </style>
  </head>
  <body>
    <span class="preheader">${preheader}</span>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f5f7fb;">
      <tr>
        <td align="center" style="padding:24px;">
          <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;background:#ffffff;border-radius:8px;overflow:hidden;">
            <tr>
              <td style="padding:20px 24px;background:#111827;color:#fff;font-weight:900;">
                日本学生アンバサダー協会
              </td>
            </tr>
            <tr>
              <td style="padding:24px 24px 8px 24px; font-size:16px; color:#111827;">
                ${safeTextName} 様
              </td>
            </tr>
            <tr>
              <td style="padding:0 24px 8px 24px; font-size:16px; color:#111827;">
                アカウントのご登録ありがとうございます。以下のボタンからメールアドレスの確認を完了してください。
              </td>
            </tr>
            <tr>
              <td align="left" style="padding:16px 24px 8px 24px;">
                <a href="${link}" class="btn">メールアドレスを確認する</a>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 24px 24px 24px; font-size:14px; color:#111827;">
                もしボタンが機能しない場合は、以下のURLをブラウザに貼り付けてください。<br />
                <span style="word-break:break-all;">${link}</span>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 24px;" class="muted">
                このメールは送信専用です。ご不明点はサイトの「お問い合わせ」からお願いいたします。
              </td>
            </tr>
            <tr>
              <td style="padding:12px 24px; border-top:1px solid #e5e7eb;" class="muted">
                日本学生アンバサダー協会<br/>
                <a href="https://kanta02cer.github.io/JAA.HP/">公式サイト</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>`;

  const text = [
    `${safeTextName} 様`,
    '',
    'アカウントのご登録ありがとうございます。以下のリンクからメールアドレスの確認を完了してください。',
    link,
    '',
    'このメールは送信専用です。ご不明点はサイトの「お問い合わせ」からお願いいたします。'
  ].join('\n');

  const msg = {
    to: email,
    from: { email: "no-reply@jaa-ambassadors.jp", name: "日本学生アンバサダー協会" },
    subject: "【メール確認のお願い】日本学生アンバサダー協会",
    text,
    html,
    replyTo: { email: "support@jaa-ambassadors.jp", name: "日本学生アンバサダー協会 サポート" },
    headers: {
      'List-Unsubscribe': '<mailto:unsubscribe@jaa-ambassadors.jp>, <https://jaa-ambassadors.jp/unsubscribe>',
      'Content-Language': 'ja'
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


