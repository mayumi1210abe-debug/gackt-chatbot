// TODO: Twilio アカウント取得後、ここを実際の送信処理に差し替える。
// (Account SID / Auth Token / 送信元番号を環境変数に追加し、Twilio SDK 経由で送信)
export async function sendSms(phoneNumber: string, body: string): Promise<void> {
  console.log(`[SMS placeholder] to=${phoneNumber} body="${body}"`);
}
