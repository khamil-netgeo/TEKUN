<?php

namespace App\Services;

use App\Models\OtpCode;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

/**
 * Core Foundation Service: OtpService
 * Handles OTP generation, sending (SMS + Email), and verification.
 * Per project instructions: dual-channel OTP support required.
 */
class OtpService
{
    private const OTP_EXPIRY_MINUTES = 5;
    private const MAX_ATTEMPTS       = 3;
    private const OTP_LENGTH         = 6;

    /**
     * Generate and send OTP via specified channel.
     *
     * @param  string $identifier  Phone number or email address
     * @param  string $channel     'sms' or 'email'
     * @param  string $purpose     'verification' | 'password_reset' | 'login_2fa'
     * @return array{success: bool, message: string, expires_in: int}
     */
    public function send(string $identifier, string $channel, string $purpose = 'verification'): array
    {
        // Invalidate any existing unused OTPs for this identifier
        OtpCode::where('identifier', $identifier)
                ->where('channel', $channel)
                ->where('purpose', $purpose)
                ->where('is_used', false)
                ->update(['is_used' => true]);

        // Generate cryptographically secure 6-digit OTP
        $code = str_pad((string) random_int(0, 999999), self::OTP_LENGTH, '0', STR_PAD_LEFT);

        // Store in database
        OtpCode::create([
            'identifier' => $identifier,
            'channel'    => $channel,
            'code'       => $code,
            'purpose'    => $purpose,
            'is_used'    => false,
            'attempts'   => 0,
            'expires_at' => Carbon::now()->addMinutes(self::OTP_EXPIRY_MINUTES),
        ]);

        // Send via appropriate channel
        $sent = match ($channel) {
            'sms'   => $this->sendSms($identifier, $code, $purpose),
            'email' => $this->sendEmail($identifier, $code, $purpose),
            default => false,
        };

        if (!$sent) {
            Log::warning('OTP send failed', ['identifier' => $identifier, 'channel' => $channel]);
        }

        return [
            'success'    => true,
            'message'    => $channel === 'sms'
                ? 'Kod OTP telah dihantar ke nombor telefon anda.'
                : 'Kod OTP telah dihantar ke e-mel anda.',
            'expires_in' => self::OTP_EXPIRY_MINUTES * 60,
        ];
    }

    /**
     * Verify OTP code.
     *
     * @param  string $identifier
     * @param  string $channel
     * @param  string $code
     * @param  string $purpose
     * @return array{verified: bool, message: string}
     */
    public function verify(string $identifier, string $channel, string $code, string $purpose = 'verification'): array
    {
        $otp = OtpCode::where('identifier', $identifier)
                       ->where('channel', $channel)
                       ->where('purpose', $purpose)
                       ->where('is_used', false)
                       ->orderByDesc('created_at')
                       ->first();

        if (!$otp) {
            return ['verified' => false, 'message' => 'Kod OTP tidak dijumpai atau telah digunakan.'];
        }

        if ($otp->isExpired()) {
            return ['verified' => false, 'message' => 'Kod OTP telah tamat tempoh. Sila minta kod baharu.'];
        }

        if ($otp->isExceededAttempts()) {
            return ['verified' => false, 'message' => 'Terlalu banyak percubaan. Sila minta kod OTP baharu.'];
        }

        $otp->incrementAttempts();

        if ($otp->code !== $code) {
            $remaining = self::MAX_ATTEMPTS - $otp->attempts;
            return [
                'verified' => false,
                'message'  => "Kod OTP tidak sah. {$remaining} percubaan berbaki.",
            ];
        }

        $otp->markAsUsed();

        return ['verified' => true, 'message' => 'OTP berjaya disahkan.'];
    }

    // ── Private Senders ──────────────────────────────────────────────────────

    private function sendSms(string $phone, string $code, string $purpose): bool
    {
        // In production: integrate with Vonage/Twilio/Telco API
        // For now, log the OTP (development mode)
        $message = $this->buildSmsMessage($code, $purpose);
        Log::info("OTP SMS [{$purpose}] to {$phone}: {$message}");

        // TODO: Uncomment when SMS provider is configured
        // $vonage = app(\Vonage\Client::class);
        // $vonage->sms()->send(new \Vonage\SMS\Message\SMS($phone, 'TEKUN', $message));

        return true;
    }

    private function sendEmail(string $email, string $code, string $purpose): bool
    {
        // Uses Laravel Mail (configured in .env — MAIL_MAILER=log for dev)
        try {
            Mail::send([], [], function ($message) use ($email, $code, $purpose) {
                $subject = match ($purpose) {
                    'password_reset' => 'TEKUN SPPT — Kod Tetapkan Semula Kata Laluan',
                    'login_2fa'      => 'TEKUN SPPT — Kod Pengesahan Log Masuk',
                    default          => 'TEKUN SPPT — Kod Pengesahan OTP',
                };

                $body = $this->buildEmailBody($code, $purpose);

                $message->to($email)
                        ->subject($subject)
                        ->html($body);
            });
            return true;
        } catch (\Exception $e) {
            Log::error('OTP email send failed', ['email' => $email, 'error' => $e->getMessage()]);
            return false;
        }
    }

    private function buildSmsMessage(string $code, string $purpose): string
    {
        return match ($purpose) {
            'password_reset' => "TEKUN SPPT: Kod tetapkan semula kata laluan anda ialah {$code}. Sah selama 5 minit.",
            'login_2fa'      => "TEKUN SPPT: Kod log masuk anda ialah {$code}. Sah selama 5 minit. Jangan kongsi kod ini.",
            default          => "TEKUN SPPT: Kod pengesahan anda ialah {$code}. Sah selama 5 minit.",
        };
    }

    private function buildEmailBody(string $code, string $purpose): string
    {
        $purposeLabel = match ($purpose) {
            'password_reset' => 'Tetapkan Semula Kata Laluan',
            'login_2fa'      => 'Pengesahan Log Masuk',
            default          => 'Pengesahan Akaun',
        };

        return <<<HTML
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
            <div style="background: #1B2B5E; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 20px;">TEKUN SPPT</h1>
                <p style="color: #a0aec0; margin: 5px 0 0; font-size: 13px;">Sistem Pengurusan Pembiayaan TEKUN Nasional</p>
            </div>
            <div style="background: #f8f9fa; padding: 30px; border: 1px solid #e2e8f0; border-radius: 0 0 8px 8px;">
                <h2 style="color: #1B2B5E; margin: 0 0 15px;">{$purposeLabel}</h2>
                <p style="color: #4a5568; margin: 0 0 20px;">Kod OTP anda untuk {$purposeLabel}:</p>
                <div style="background: #1B2B5E; color: white; font-size: 32px; font-weight: bold; letter-spacing: 8px; text-align: center; padding: 20px; border-radius: 8px; margin: 0 0 20px;">
                    {$code}
                </div>
                <p style="color: #718096; font-size: 13px; margin: 0;">
                    Kod ini sah selama <strong>5 minit</strong>. Jangan kongsi kod ini dengan sesiapa.
                </p>
                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
                <p style="color: #a0aec0; font-size: 11px; margin: 0;">
                    Jika anda tidak membuat permintaan ini, sila abaikan e-mel ini atau hubungi sokongan TEKUN.
                </p>
            </div>
        </div>
        HTML;
    }
}
