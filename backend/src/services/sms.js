// No SMS provider is configured yet. This logs the code and returns it in the API
// response instead of sending a real text, so trainee OTP login is fully testable
// today. Swap the body of this function for a real provider call (Twilio, MSG91, ...)
// once an account exists — nothing else in the OTP flow needs to change, since the
// dev-mode leak of the code disappears the moment this stops returning it.
export async function sendOtp(phone, code) {
  console.log(`[dev] OTP for ${phone}: ${code}`);
  return { devCode: code };
}
